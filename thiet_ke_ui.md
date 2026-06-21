Nếu user mở link trong Email ở một trình duyệt ẩn danh hoặc điện thoại khác: Họ chưa đăng nhập. Nếu chuyển hướng về /account/contracts, hệ thống bảo mật của Frontend sẽ "đá" họ văng ra trang Đăng nhập (/login). Họ đăng nhập xong thì mất luôn cái thông báo thanh toán thành công.

Nếu user đang mượn máy tính của người khác (tài khoản khác đang login): Thông báo "Thanh toán thành công HD-123" hiện lên trong khi danh sách hợp đồng của họ chả có cái HD-123 nào. Gây hoang mang tột độ.

👉 GIẢI PHÁP CHUẨN CÔNG NGHIỆP NHẤT: Bạn hoàn toàn đúng! Chúng ta phải tạo một trang thông báo kết quả độc lập (Ví dụ: /payment-result). Trang này phải là Trang Công Khai (Public Page) – ai truy cập cũng xem được trạng thái giao dịch mà không cần bắt buộc đăng nhập.

Dưới đây là phần cập nhật nhỏ cho Backend để đổi link đích, bạn chép đè hàm vnpayReturn vào file PaymentController nhé:

💡 Gợi ý thiết kế trang Frontend (/payment-result):
Trên React, bạn tạo một component Public Route tên là PaymentResultPage.
Trang này không cần kiểm tra đăng nhập. Nó chỉ cần hiện 1 cái Icon to đùng ở giữa màn hình:

Nếu status=success: Hiện icon ✅ (Checkmark xanh lá) cực to. Kèm dòng chữ:
"Thanh toán thành công! Phí dịch vụ cho Hợp đồng {contractCode} đã được ghi nhận. Cảm ơn bạn!"
(Bên dưới có nút: [Về trang chủ] hoặc [Xem hợp đồng của tôi])

Nếu status=failed: Hiện icon ❌ (Chữ X màu đỏ). Kèm dòng chữ:
"Giao dịch không thành công hoặc đã bị hủy. Hợp đồng {contractCode} chưa được thanh toán."
(Bên dưới có nút: [Thử thanh toán lại] hoặc [Về trang chủ])

Nhờ cách thiết kế tách bạch này, dù người dùng có mở link bằng máy mượn ngoài quán net hay mở bằng điện thoại khi chưa đăng nhập, luồng hoạt động vẫn cực kỳ an toàn, thông tin tường minh và UX đạt mức hoàn hảo nhất!