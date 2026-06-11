import { Stagger } from "@/hooks/use-scroll-reveal";
import { Icons } from "@/components/icons"

const STATS = [
    { value: '10,000+', label: 'Gia sư đã đăng ký', icon: Icons.users, color: 'text-blue-500' },
    { value: '50,000+', label: 'Học sinh thụ hưởng', icon: Icons.school, color: 'text-emerald-500' },
    { value: '63', label: 'Tỉnh thành phủ sóng', icon: Icons.mapPin, color: 'text-violet-500' },
    { value: '4.8★', label: 'Đánh giá trung bình', icon: Icons.exclusive, color: 'text-amber-500' },
];

export function StatsSection() {
    return (
        <section className='bg-muted/30 border-y py-10'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <Stagger
                    variant='zoom-in'
                    baseDelay={0}
                    staggerDelay={100}
                    duration={500}
                    threshold={0.2}
                    className='grid grid-cols-2 gap-6 lg:grid-cols-4'
                >
                    {STATS.map((stat) => {
                        const Icons = stat.icon;
                        return (
                            <div key={stat.label} className='flex flex-col items-center text-center'>
                                <Icons size={28} className={stat.color} />
                                <div className='text-foreground mt-2 text-3xl font-bold'>{stat.value}</div>
                                <div className='text-muted-foreground mt-1 text-sm'>{stat.label}</div>
                            </div>
                        );
                    })}
                </Stagger>
            </div>
        </section>
    )
}