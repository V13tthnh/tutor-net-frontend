'use client';

import { ScrollReveal } from "@/hooks/use-scroll-reveal";
import PostClassPage from "@/features/classes/components/post-class-page";
import Link from "next/link";

export default function NewClassPage() {

    return (
        <>
          <ScrollReveal variant='fade-up' delay={100} duration={650} threshold={0.05}>
                <div className='rounded-2xl border bg-card shadow-sm p-6'>
                    <h2 className='text-lg font-bold mb-1'>Tạo lớp học</h2>
                    <p className='text-sm text-muted-foreground mb-4'>Hồ sơ gia sư phản ánh năng lực chuyên môn, uy tín cá nhân khi nhận lớp giảng dạy
                        <Link href="#" className="text-primary underline ml-1">Đăng ký làm gia sư.</Link>
                    </p>
                    <PostClassPage />
                </div>
            </ScrollReveal>
        </>
    );
}