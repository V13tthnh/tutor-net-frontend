'use-client';

import { useState } from 'react';
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { ScrollReveal } from "@/hooks/use-scroll-reveal";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HeroSection() {
    const router = useRouter();
    const [quickSearch, setQuickSearch] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (quickSearch) params.set('search', quickSearch);
        router.push(`/tutors?${params.toString()}`);
    };

    const handleSubjectClick = (subject: string) => {
        router.push(`/tutors?subjects=${encodeURIComponent(subject)}`);
    };

    const handleLevelClick = (level: string) => {
        router.push(`/tutors?levels=${encodeURIComponent(level)}`);
    };

    return (
        <section className='from-background via-background to-muted/50 relative overflow-hidden bg-gradient-to-b'>
            {/* Background Image */}
            <div className='absolute inset-0 z-0'>
                <Image
                    src='https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1920&h=1080'
                    alt='Education Background'
                    fill
                    className='object-cover opacity-[0.07] dark:opacity-[0.05]'
                    priority
                    unoptimized
                />
                <div className='absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background' />
            </div>

            {/* Background decoration */}
            <div className='pointer-events-none absolute inset-0 overflow-hidden z-0'>
                <div className='bg-primary/10 absolute -top-40 -right-40 h-96 w-96 rounded-full blur-3xl' />
                <div className='bg-violet-500/10 absolute top-20 -left-20 h-64 w-64 rounded-full blur-3xl' />
                <div className='bg-emerald-500/10 absolute bottom-0 right-1/3 h-80 w-80 rounded-full blur-3xl' />
            </div>

            <div className='relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8 z-10'>
                <div className='mx-auto max-w-3xl text-center'>
                    {/* Hero content: no scroll ScrollReveal — visible immediately */}
                    <ScrollReveal variant='fade-down' duration={700}>
                        <Badge
                            variant='secondary'
                            className='mb-6 gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium'
                        >
                            <Icons.shieldCheck size={14} className='text-primary' />
                            Nền tảng gia sư #1 Việt Nam
                        </Badge>
                    </ScrollReveal>

                    <ScrollReveal variant='fade-up' delay={100} duration={800}>
                        <h1 className='text-foreground text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl'>
                            Tìm gia sư{' '}
                            <span className='from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent'>
                                phù hợp nhất
                            </span>{' '}
                            cho con bạn
                        </h1>
                    </ScrollReveal>

                    <ScrollReveal variant='fade-up' delay={220} duration={700}>
                        <p className='text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed'>
                            Kết nối với hơn{' '}
                            <span className='text-foreground font-semibold'>10,000+ gia sư chất lượng cao</span>{' '}
                            được xác minh trên toàn quốc. Học tại nhà, online hoặc kết hợp — theo cách của bạn.
                        </p>
                    </ScrollReveal>

                    {/* Quick Search */}
                    <ScrollReveal variant='fade-up' delay={340} duration={700}>
                        <form onSubmit={handleSearch} className='mx-auto mt-10 max-w-xl'>
                            <div className='bg-background flex items-center gap-2 rounded-2xl border p-2 shadow-lg'>
                                <div className='relative flex-1'>
                                    <Icons.search
                                        size={16}
                                        className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2'
                                    />
                                    <input
                                        id='hero-search'
                                        type='text'
                                        placeholder='Tìm gia sư theo môn, tên...'
                                        value={quickSearch}
                                        onChange={(e) => setQuickSearch(e.target.value)}
                                        className='placeholder:text-muted-foreground text-foreground w-full rounded-xl bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none'
                                    />
                                </div>
                                <Button type='submit' className='shrink-0 gap-2 rounded-xl px-5 py-2.5'>
                                    Tìm kiếm
                                    <Icons.arrowRight size={15} />
                                </Button>
                            </div>
                        </form>
                    </ScrollReveal>

                    {/* Subject quick links */}
                    <ScrollReveal variant='fade-up' delay={460} duration={600}>
                        <div className='mt-6 flex flex-wrap items-center justify-center gap-2'>
                            <span className='text-muted-foreground text-sm'>Môn phổ biến:</span>
                            {['Toán', 'Tiếng Anh', 'Vật Lý', 'Hóa Học', 'Ngữ Văn'].map((subject) => (
                                <button
                                    key={subject}
                                    id={`quick-subject-${subject}`}
                                    onClick={() => handleSubjectClick(subject)}
                                    className='hover:bg-primary hover:text-primary-foreground bg-muted text-muted-foreground cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors'
                                >
                                    {subject}
                                </button>
                            ))}
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    )
}