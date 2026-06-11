import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/hooks/use-scroll-reveal";
import { IconArrowRight, IconSearch, IconBook, IconHeadset } from "@tabler/icons-react";
import Link from "next/link";

const HOW_IT_WORKS = [
    {
        step: '01',
        title: 'Tìm kiếm gia sư',
        description: 'Lọc theo môn học, cấp độ, khu vực, học phí và hình thức dạy học phù hợp.',
        icon: IconSearch,
    },
    {
        step: '02',
        title: 'Xem hồ sơ & đánh giá',
        description:
            'Xem thông tin chi tiết, bằng cấp, kinh nghiệm và nhận xét từ phụ huynh học sinh khác.',
        icon: IconBook,
    },
    {
        step: '03',
        title: 'Liên hệ & đặt lịch',
        description:
            'Liên hệ trực tiếp với gia sư, thảo luận về nhu cầu và đặt lịch học thử miễn phí.',
        icon: IconHeadset,
    },
];

export default function HowItWorksSection() {
    return (
        <section className='bg-muted/30 py-16'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <ScrollReveal variant='fade-up' threshold={0.2}>
                    <div className='mb-12 text-center'>
                        <h2 className='text-foreground text-2xl font-bold sm:text-3xl'>
                            Cách TutorNet hoạt động
                        </h2>
                        <p className='text-muted-foreground mt-3 text-base'>
                            Chỉ 3 bước đơn giản để tìm được gia sư phù hợp
                        </p>
                    </div>
                </ScrollReveal>

                <div className='relative grid grid-cols-1 gap-8 md:grid-cols-3'>
                    {/* Connector line */}
                    <div className='from-primary/30 via-primary/20 to-primary/30 absolute top-12 left-0 hidden h-0.5 w-full bg-gradient-to-r md:block' />

                    {HOW_IT_WORKS.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <ScrollReveal
                                key={step.step}
                                variant='flip-up'
                                delay={i * 150}
                                duration={700}
                                threshold={0.15}
                            >
                                <div className='relative flex flex-col items-center text-center'>
                                    <div className='bg-primary text-primary-foreground relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-2xl shadow-lg'>
                                        <Icon size={28} />
                                        <span className='mt-1 text-xs font-bold opacity-80'>{step.step}</span>
                                    </div>
                                    <h3 className='text-foreground mt-5 text-lg font-semibold'>{step.title}</h3>
                                    <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                                        {step.description}
                                    </p>
                                </div>
                            </ScrollReveal>
                        );
                    })}
                </div>

                <ScrollReveal variant='fade-up' delay={300} threshold={0.1}>
                    <div className='mt-12 text-center'>
                        <Link href='/tutors' id='cta-find-tutor'>
                            <Button size='lg' className='gap-2 px-8'>
                                Bắt đầu tìm gia sư ngay
                                <IconArrowRight size={16} />
                            </Button>
                        </Link>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}