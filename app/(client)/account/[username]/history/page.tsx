'use client';

import { useState } from 'react';
import { ScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const MOCK_HISTORY = [
    { id: 1, tutor: 'Lê Thị Hương', subject: 'Toán', date: '10/05/2024', status: 'Hoàn thành', price: '200,000' },
    { id: 2, tutor: 'Trần Minh Hùng', subject: 'Tiếng Anh', date: '08/05/2024', status: 'Đã hủy', price: '250,000' },
];

export default function HistoryPage() {

    return (
        <>
            <style>{`
                          @keyframes rowFadeIn {
                            from { opacity: 0; transform: translateX(20px); }
                            to   { opacity: 1; transform: none; }
                          }
                        `}</style>
            <ScrollReveal variant='fade-up' duration={650} threshold={0.05}>
                <div className='rounded-2xl border bg-card shadow-sm p-6'>
                    <h2 className='text-lg font-bold mb-1'>Lịch sử đặt lịch</h2>
                    <p className='text-sm text-muted-foreground mb-5'>Tất cả các buổi học đã đặt</p>

                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='border-b'>
                                {['Gia sư', 'Môn học', 'Ngày', 'Học phí', 'Trạng thái'].map(h => (
                                    <th key={h} className='pb-3 text-left font-semibold text-muted-foreground text-xs'>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_HISTORY.map((h, i) => (
                                <tr
                                    key={h.id}
                                    className='border-b last:border-0'
                                    style={{
                                        animation: `rowFadeIn 500ms cubic-bezier(0.22,1,0.36,1) ${i * 80}ms both`,
                                    }}
                                >
                                    <td className='py-3 font-medium'>{h.tutor}</td>
                                    <td className='py-3 text-muted-foreground'>{h.subject}</td>
                                    <td className='py-3 text-muted-foreground'>{h.date}</td>
                                    <td className='py-3'>{h.price}đ</td>
                                    <td className='py-3'>
                                        <span className={cn(
                                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                            h.status === 'Hoàn thành' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        )}>
                                            {h.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            </ScrollReveal>
        </>
    );
}