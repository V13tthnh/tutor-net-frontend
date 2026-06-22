'use client';

import { ScrollReveal, Stagger } from "@/hooks/use-scroll-reveal";
import { useRouter } from "next/navigation";
import { SUBJECTS } from "@/constants/mock-api-tutors";
import { useQuery } from "@tanstack/react-query";
import { tutorFilterOptionsQuery } from "../../api/queries";

const SUBJECT_NAME_TO_ID: Record<string, string> = {
    'Toán': '1',
    'Ngữ Văn': '2',
    'Tiếng Anh': '3',
    'Vật Lý': '4',
    'Hóa Học': '5',
    'Sinh Học': '6',
    'Lịch Sử': '7',
    'Địa Lý': '8',
    'Tin Học': '9',
    'GDCD': '10'
};

export default function SubjectsSection() {
    const router = useRouter();
    const { data: filterOptions } = useQuery(tutorFilterOptionsQuery());

    const handleSubjectClick = (subjectName: string) => {
        const found = filterOptions?.subjects?.find(
            s => s.name.toLowerCase() === subjectName.toLowerCase()
        );
        const subjectId = found ? String(found.id) : (SUBJECT_NAME_TO_ID[subjectName] || subjectName);
        router.push(`/tutors?subjects=${encodeURIComponent(subjectId)}`);
    };
    return (
        <section className='py-16'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <ScrollReveal variant='fade-up' threshold={0.2}>
                    <div className='mb-10 text-center'>
                        <h2 className='text-foreground text-2xl font-bold sm:text-3xl'>Tìm theo môn học</h2>
                        <p className='text-muted-foreground mt-3 text-base'>
                            Chọn môn học bạn cần gia sư hỗ trợ
                        </p>
                    </div>
                </ScrollReveal>

                <Stagger
                    variant='fade-up'
                    baseDelay={0}
                    staggerDelay={45}
                    duration={480}
                    threshold={0.1}
                    className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5'
                >
                    {SUBJECTS.map((subject) => (
                        <button
                            key={subject}
                            id={`subject-btn-${subject}`}
                            onClick={() => handleSubjectClick(subject)}
                            className='hover:border-primary hover:bg-primary/5 hover:text-primary group bg-card text-foreground flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all duration-200'
                        >
                            {subject}
                        </button>
                    ))}
                </Stagger>
            </div>
        </section>
    );
}