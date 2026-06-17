'use client';

import { ScrollReveal } from '@/hooks/use-scroll-reveal';
import Link from 'next/link';
import BecomeTutorPage from '@/features/tutors/components/become-tutor-page';

export default function AddCvPage() {

    return (
        <ScrollReveal variant='fade-up' delay={100} duration={650} threshold={0.05}>
            <div className='rounded-2xl border bg-card shadow-sm p-6'>
                <h2 className='text-lg font-bold mb-1'>Hồ sơ gia sư</h2>
                <p className='text-sm text-muted-foreground mb-4'>Hồ sơ gia sư phản ánh năng lực chuyên môn, uy tín cá nhân khi nhận lớp giảng dạy.</p>
                <BecomeTutorPage />
            </div>
        </ScrollReveal>
    );
}