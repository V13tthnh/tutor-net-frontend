import { Icons } from '@/components/icons';
import { ScrollReveal } from "@/hooks/use-scroll-reveal";
import Link from "next/link";

export default function PublicFooter() {
    return (
        <footer className='bg-muted/30 border-t py-12'>
            <ScrollReveal variant='fade-up' threshold={0.1}>
                <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                    <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
                        <div className='md:col-span-2'>
                            <div className='flex items-center gap-2'>
                                <div className='bg-primary flex h-8 w-8 items-center justify-center rounded-lg'>
                                    <Icons.school className='text-primary-foreground' />
                                </div>
                                <span className='text-foreground text-lg font-bold'>TutorNet</span>
                            </div>
                            <p className='text-muted-foreground mt-3 max-w-xs text-sm leading-relaxed'>
                                Nền tảng kết nối gia sư - phụ huynh hàng đầu Việt Nam. Cam kết chất lượng, uy
                                tín và hiệu quả.
                            </p>
                            <div className='mt-4 flex gap-3'>
                                <a
                                    href='#'
                                    className='text-muted-foreground hover:text-primary transition-colors'
                                    aria-label='Facebook'
                                >
                                    <Icons.facebook size={20} />
                                </a>
                                <a
                                    href='#'
                                    className='text-muted-foreground hover:text-primary transition-colors'
                                    aria-label='YouTube'
                                >
                                    <Icons.youtube size={20} />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className='text-foreground mb-3 text-sm font-semibold'>Thông tin</h4>
                            <ul className='space-y-2 text-sm'>
                                {['TutorNet.vn - Nền tảng kết nối gia sư 1 kèm 1', '107A Nguyễn Phong Sắc, Dịch Vọng Hậu, Cầu Giấy, Hà Nội', 'Hotline: 0123 456 789', 'Email: tutornet@gmail.com'].map((item) => (
                                    <li key={item}>
                                        <Link
                                            href='#'
                                            className='text-muted-foreground hover:text-foreground transition-colors'
                                        >
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className='text-foreground mb-3 text-sm font-semibold'>Tài liệu</h4>
                            <ul className='space-y-2 text-sm'>
                                {['Hợp đồng giao lớp', 'Hợp đồng gia sư', 'Báo cáo học tập', 'Điều khoản dịch vụ'].map(
                                    (item) => (
                                        <li key={item}>
                                            <Link
                                                href='#'
                                                className='text-muted-foreground hover:text-foreground transition-colors'
                                            >
                                                {item}
                                            </Link>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className='border-border mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 text-center sm:flex-row'>
                        <p className='text-muted-foreground text-sm'>
                            © {new Date().getFullYear()} TutorNet. Bảo lưu mọi quyền.
                        </p>
                        <p className='text-muted-foreground text-xs'>
                        </p>
                    </div>
                </div>
            </ScrollReveal>
        </footer>
    )
}