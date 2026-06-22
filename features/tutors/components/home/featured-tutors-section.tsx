import { Button } from "@/components/ui/button";
import { ScrollReveal, Stagger } from "@/hooks/use-scroll-reveal";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { TutorCard } from "../tutor-card";
import type { Tutor } from "@/constants/mock-api-tutors";

interface HomePageClientProps {
    featuredTutors: Tutor[];
    onContactClick?: (tutor: Tutor) => void;
    onInviteClick?: (tutor: Tutor) => void;
}

export default function FeaturedTutorsSection({ featuredTutors, onContactClick, onInviteClick }: HomePageClientProps) {
    return (
        <section className='py-16'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <ScrollReveal variant='fade-up' threshold={0.15}>
                    <div className='mb-10 flex items-center justify-between'>
                        <div>
                            <h2 className='text-foreground text-2xl font-bold sm:text-3xl'>Gia sư nổi bật</h2>
                            <p className='text-muted-foreground mt-2 text-base'>
                                Những gia sư được đánh giá cao nhất
                            </p>
                        </div>
                        <Link href='/tutors' id='see-all-tutors'>
                            <Button variant='outline' className='hidden gap-2 sm:flex'>
                                Xem tất cả
                                <IconArrowRight size={15} />
                            </Button>
                        </Link>
                    </div>
                </ScrollReveal>
 
                {featuredTutors.length > 0 ? (
                    <Stagger
                        variant='fade-up'
                        baseDelay={0}
                        staggerDelay={120}
                        duration={600}
                        threshold={0.1}
                        className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
                    >
                        {featuredTutors.map((tutor) => (
                            <TutorCard
                                key={tutor.id}
                                tutor={tutor}
                                onContactClick={onContactClick}
                                onInviteClick={onInviteClick}
                            />
                        ))}
                    </Stagger>
                ) : (
                    <ScrollReveal variant='fade-up'>
                        <div className='bg-muted/30 rounded-2xl py-16 text-center'>
                            <p className='text-muted-foreground'>Chưa có gia sư nổi bật.</p>
                        </div>
                    </ScrollReveal>
                )}

                <div className='mt-8 text-center sm:hidden'>
                    <Link href='/tutors'>
                        <Button className='gap-2'>
                            Xem tất cả gia sư
                            <IconArrowRight size={15} />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}