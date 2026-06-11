import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/hooks/use-scroll-reveal";
import Link from "next/link";

export const CtaBannerSection = () => {
    return (
        <section className='bg-primary py-16'>
            <ScrollReveal variant='zoom-in' duration={700} threshold={0.2}>
                <div className='mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8'>
                    <h2 className='text-primary-foreground text-2xl font-bold sm:text-3xl'>
                        Bạn là gia sư? Hãy đăng ký ngay!
                    </h2>
                    <p className='text-primary-foreground/80 mx-auto mt-4 max-w-2xl text-base'>
                        Kết nối với hàng nghìn phụ huynh và học sinh đang tìm kiếm gia sư. Tạo hồ sơ miễn
                        phí và bắt đầu nhận học sinh ngay hôm nay.
                    </p>
                    <ScrollReveal variant='fade-up' delay={200} duration={600}>
                        <div className='mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
                            <Link href='/auth/sign-up' id='cta-become-tutor'>
                                <Button size='lg' variant='secondary' className='w-full gap-2 px-8 sm:w-auto'>
                                    Đăng ký làm gia sư
                                </Button>
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>
            </ScrollReveal>
        </section>
    );
};