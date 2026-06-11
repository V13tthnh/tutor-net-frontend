import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/hooks/use-scroll-reveal";
import { IconHome, IconVideo, IconSchool } from "@tabler/icons-react";

const TEACHING_MODES = [
    {
        icon: IconHome,
        title: 'Dạy tại nhà (Offline)',
        description: 'Gia sư đến tận nhà, học sinh tập trung hơn trong không gian quen thuộc.',
        badge: 'Phổ biến',
    },
    {
        icon: IconVideo,
        title: 'Dạy online (Online)',
        description: 'Học qua video call, không giới hạn địa lý, linh hoạt thời gian.',
        badge: 'Tiện lợi',
    },
    {
        icon: IconSchool,
        title: 'Kết hợp (Online & Offline)',
        description: 'Linh hoạt giữa dạy trực tiếp và online theo nhu cầu từng tuần.',
        badge: 'Hiệu quả',
    },
];

export default function TeachingModesSection() {
    return (
        <section className='py-16'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <ScrollReveal variant='fade-up' threshold={0.2}>
                    <div className='mb-12 text-center'>
                        <h2 className='text-foreground text-2xl font-bold sm:text-3xl'>
                            Hình thức học linh hoạt
                        </h2>
                        <p className='text-muted-foreground mt-3 text-base'>
                            Chọn cách học phù hợp với điều kiện và sở thích của bạn
                        </p>
                    </div>
                </ScrollReveal>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                    {TEACHING_MODES.map((mode, i) => {
                        const Icon = mode.icon;
                        return (
                            <ScrollReveal
                                key={mode.title}
                                variant='fade-up'
                                delay={i * 130}
                                duration={600}
                                threshold={0.15}
                            >
                                <div className='bg-card group cursor-pointer rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full'>
                                    <div className='mb-4 flex items-start justify-between'>
                                        <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl'>
                                            <Icon size={24} className='text-primary' />
                                        </div>
                                        <Badge variant='secondary' className='text-xs'>
                                            {mode.badge}
                                        </Badge>
                                    </div>
                                    <h3 className='text-foreground text-lg font-semibold'>{mode.title}</h3>
                                    <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                                        {mode.description}
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