import { ScrollReveal, Stagger } from "@/hooks/use-scroll-reveal";
import { useRouter } from "next/navigation";
import { LEVELS } from "@/constants/mock-api-tutors";

export default function LevelsSection() {
    const router = useRouter();
    const handleLevelClick = (level: string) => {
        router.push(`/tutors?levels=${encodeURIComponent(level)}`);
    };
    return (
        <section className='bg-muted/30 py-12'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <ScrollReveal variant='fade-up' threshold={0.2}>
                    <div className='mb-8 text-center'>
                        <h2 className='text-foreground text-2xl font-bold sm:text-3xl'>Tìm theo cấp học</h2>
                        <p className='text-muted-foreground mt-2 text-base'>
                            Gia sư chuyên biệt cho từng cấp học
                        </p>
                    </div>
                </ScrollReveal>

                <Stagger
                    variant='zoom-in'
                    baseDelay={0}
                    staggerDelay={60}
                    duration={450}
                    threshold={0.1}
                    className='flex flex-wrap justify-center gap-3'
                >
                    {LEVELS.map((level) => (
                        <button
                            key={level}
                            id={`level-btn-${level}`}
                            onClick={() => handleLevelClick(level)}
                            className='hover:bg-primary hover:text-primary-foreground bg-background border-border cursor-pointer rounded-full border px-5 py-2.5 text-sm font-medium transition-all hover:scale-105 hover:shadow-md'
                        >
                            {level}
                        </button>
                    ))}
                </Stagger>
            </div>
        </section>
    );
}