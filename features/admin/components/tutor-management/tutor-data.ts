export type TutorStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface TutorApplicant {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    avatar: string;
    subjects: string[];
    education: string;
    university: string;
    experience: string; // years
    appliedAt: string;
    status: TutorStatus;
    cvUrl: string;
    rating?: number;
    location: string;
}

export const REJECT_REASONS = [
    'Hồ sơ không đầy đủ',
    'Bằng cấp không phù hợp',
    'Thiếu kinh nghiệm giảng dạy',
    'Thông tin không chính xác / giả mạo',
    'Không đáp ứng tiêu chuẩn chất lượng',
    'Môn học không có nhu cầu',
    'Lý do khác',
];

export const SUGGESTED_FEES = [
    { label: '80.000 đ/giờ', value: 80000 },
    { label: '100.000 đ/giờ', value: 100000 },
    { label: '120.000 đ/giờ', value: 120000 },
    { label: '150.000 đ/giờ', value: 150000 },
    { label: '180.000 đ/giờ', value: 180000 },
    { label: '200.000 đ/giờ', value: 200000 },
    { label: '250.000 đ/giờ', value: 250000 },
    { label: '300.000 đ/giờ', value: 300000 },
];
