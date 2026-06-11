import { ScrollReveal } from "@/hooks/use-scroll-reveal";
import { IconShieldCheck, IconAward, IconTrendingUp, IconHeadset } from "@tabler/icons-react";

const WHY_CHOOSE_US = [
    {
        icon: IconShieldCheck,
        title: 'Gia sư được xác minh',
        description:
            'Tất cả gia sư đều được kiểm tra bằng cấp, lý lịch tư pháp và phỏng vấn trực tiếp trước khi được đăng ký.',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
        icon: IconTrendingUp,
        title: 'Cam kết kết quả',
        description:
            'Theo dõi tiến độ học sinh định kỳ. Hoàn tiền 100% nếu không có cải thiện sau 1 tháng học.',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
        icon: IconAward,
        title: 'Linh hoạt thời gian',
        description:
            'Dạy tại nhà, dạy online hoặc kết hợp cả hai. Tự chọn giờ học phù hợp với lịch của bạn.',
        color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
        icon: IconHeadset,
        title: 'Hỗ trợ 24/7',
        description:
            'Đội ngũ hỗ trợ sẵn sàng giải đáp mọi thắc mắc và giải quyết vấn đề phát sinh nhanh chóng.',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
];

export default function WhyChooseUsSection() {
    return (
        <section className='from-primary/5 to-background bg-gradient-to-b py-16'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <ScrollReveal variant='fade-up' threshold={0.2}>
                    <div className='mb-12 text-center'>
                        <h2 className='text-foreground text-2xl font-bold sm:text-3xl'>
                            Vì sao chọn TutorNet?
                        </h2>
                        <p className='text-muted-foreground mt-3 text-base'>
                            Chúng tôi cam kết mang lại trải nghiệm học tập tốt nhất
                        </p>
                    </div>
                </ScrollReveal>

                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
                    {WHY_CHOOSE_US.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <ScrollReveal
                                key={item.title}
                                variant='fade-up'
                                delay={i * 100}
                                duration={580}
                                threshold={0.15}
                            >
                                <div className='bg-card hover:border-primary/30 rounded-2xl border p-6 transition-all duration-200 h-full'>
                                    <div className={`mb-4 inline-flex rounded-xl p-3 ${item.color}`}>
                                        <Icon size={22} />
                                    </div>
                                    <h3 className='text-foreground font-semibold'>{item.title}</h3>
                                    <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                                        {item.description}
                                    </p>
                                </div>
                            </ScrollReveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}