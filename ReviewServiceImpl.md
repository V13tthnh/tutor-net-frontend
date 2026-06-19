package com.tutornet.tutor_net.service.impl;

import com.tutornet.tutor_net.dto.request.ReviewCreateRequest;
import com.tutornet.tutor_net.dto.response.AdminReviewResponse;
import com.tutornet.tutor_net.dto.response.PublicReviewResponse;
import com.tutornet.tutor_net.entity.Contract;
import com.tutornet.tutor_net.entity.Review;
import com.tutornet.tutor_net.entity.TutorProfile;
import com.tutornet.tutor_net.entity.User;
import com.tutornet.tutor_net.enums.ContractStatus;
import com.tutornet.tutor_net.event.NewReviewSubmittedEvent;
import com.tutornet.tutor_net.exception.BusinessException;
import com.tutornet.tutor_net.exception.ResourceNotFoundException;
import com.tutornet.tutor_net.mapper.ReviewMapper;
import com.tutornet.tutor_net.repository.ContractRepository;
import com.tutornet.tutor_net.repository.ReviewRepository;
import com.tutornet.tutor_net.repository.TutorProfileRepository;
import com.tutornet.tutor_net.security.CustomUserDetails;
import com.tutornet.tutor_net.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ContractRepository contractRepository;
    private final TutorProfileRepository tutorProfileRepository;
    private final ReviewMapper reviewMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public Page<PublicReviewResponse> getPublicReviewsByTutor(Long tutorId, int page, int size) {
        // Sắp xếp các đánh giá mới nhất lên đầu tiên
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());

        Page<Review> reviewsPage = reviewRepository.findByTutorIdAndIsPublicTrue(tutorId, pageable);

        return reviewsPage.map(reviewMapper::toPublicResponse);
    }

    @Override
    @Transactional
    public void submitReview(ReviewCreateRequest request, CustomUserDetails currentUser) {
        // Kiểm tra Hợp đồng
        Contract contract = contractRepository.findById(request.contractId())
                .orElseThrow(() -> new ResourceNotFoundException("Hợp đồng không tồn tại"));

        if (contract.getStatus() != ContractStatus.COMPLETED) {
            throw new BusinessException("Lớp học chưa hoàn thành, không thể đánh giá lúc này.");
        }

        if (reviewRepository.existsByContractId(contract.getId())) {
            throw new BusinessException("Hợp đồng này đã được đánh giá.");
        }

        // Phân luồng Xác thực (Login vs Magic Link)
        User reviewer = null;
        String tokenToSave = null;

        if (currentUser != null) {
            // Luồng 1: Người dùng ĐÃ ĐĂNG NHẬP trên hệ thống
            if (!contract.getClassRequest().getUser().getId().equals(currentUser.getUser().getId())) {
                throw new BusinessException("Bạn không có quyền đánh giá lớp học này.");
            }
            reviewer = currentUser.getUser();
        } else {
            // Luồng 2: Khách vãng lai bấm từ EMAIL (Không cần đăng nhập)
            if (request.guestReviewToken() == null || request.guestReviewToken().isEmpty()) {
                throw new BusinessException("Bạn cần đăng nhập để thực hiện đánh giá.");
            }
            // Logic tạo Token của bạn: Ví dụ Token = Mã Hash của (ContractID + SecretKey)
            // Cần so khớp xem Token gửi lên có đúng là của Hợp đồng này không
            if (reviewRepository.existsByGuestReviewToken(request.guestReviewToken())) {
                throw new BusinessException("Đường dẫn đánh giá này đã hết hạn (đã được sử dụng).");
            }
            tokenToSave = request.guestReviewToken();
        }

        // 3. Tạo Review và lưu vào DB (Theo đúng Entity của bạn)
        Review newReview = reviewMapper.toEntity(request, contract, reviewer, tokenToSave);
        reviewRepository.save(newReview);

        // 4. Tính toán và cập nhật điểm cho Gia sư
        syncTutorRating(contract.getTutor().getUser().getId());

        String reviewerName = reviewer != null ? reviewer.getFullName() : "Học viên ẩn danh";

        eventPublisher.publishEvent(new NewReviewSubmittedEvent(
                contract.getTutor().getUser().getId(),
                contract.getTutor().getUser().getEmail(),
                reviewerName,
                newReview.getRating(),
                contract.getId()
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminReviewResponse> getReviewsForAdmin(Integer rating, Boolean isPublic, String search, int page, int size) {
        // Sắp xếp mặc định: Đánh giá mới nhất nổi lên đầu
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());

        Page<Review> reviewsPage = reviewRepository.findAllForAdmin(rating, isPublic, search, pageable);

        return reviewsPage.map(reviewMapper::toAdminResponse);
    }

    @Override
    @Transactional
    public void toggleReviewVisibility(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá có ID: " + reviewId));

        // Đảo ngược trạng thái hiển thị (Đang hiện thành ẩn, đang ẩn thành hiện)
        review.setIsPublic(!review.getIsPublic());
        reviewRepository.save(review);

        // Sau khi ẩn/hiện, tính toán lại điểm trung bình cho gia sư ngay lập tức
        syncTutorRating(review.getTutor().getId());
    }

    /**
     * Hàm dùng chung để Đồng bộ tính toán lại Điểm và Lượt đánh giá
     */
    private void syncTutorRating(Long tutorUserId) {
        Double avg = reviewRepository.calculateAverageRatingByTutorId(tutorUserId);
        Integer count = reviewRepository.countPublicReviewsByTutorId(tutorUserId);

        // Xử lý trường hợp null (khi gia sư bị ẩn hết tất cả các đánh giá)
        BigDecimal newAvg = (avg != null)
                ? BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        int newCount = (count != null) ? count : 0;

        // Tìm Profile của gia sư và cập nhật
        TutorProfile profile = tutorProfileRepository.findByUserId(tutorUserId)
                .orElse(null); // Tránh quăng lỗi nếu vì lý do nào đó profile bị thiếu

        if (profile != null) {
            profile.setRatingAvg(newAvg);
            profile.setRatingCount(newCount);
            tutorProfileRepository.save(profile);
        }
    }
}
