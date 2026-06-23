'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import type { TutorApplicant } from './tutor-data';

interface ApproveDialogProps {
    tutors: TutorApplicant[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (ids: number[]) => void;
}

export function ApproveDialog({ tutors, open, onOpenChange, onConfirm }: ApproveDialogProps) {
    const [submitting, setSubmitting] = useState(false);

    const isBulk = tutors.length > 1;
    const displayName = isBulk ? `${tutors.length} gia sư đã chọn` : tutors[0]?.fullName || '';

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            await onConfirm(tutors.map(t => t.id));
            onOpenChange(false);
        } catch (err) {
            console.error('Error in ApproveDialog handleConfirm:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (submitting) return;
            onOpenChange(v);
        }}>
            <DialogContent className='max-w-md'>
                <DialogHeader>
                    <div className='flex items-center gap-3 mb-1'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40'>
                            <Icons.circleCheck size={20} className='text-emerald-600 dark:text-emerald-400' />
                        </div>
                        <div>
                            <DialogTitle>Xác nhận duyệt</DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className='py-4 text-sm text-foreground font-medium'>
                    {isBulk ? (
                        <>Muốn duyệt hồ sơ của các gia sư đã chọn: <span className='text-primary font-bold'>{displayName}</span>?</>
                    ) : (
                        <>Muốn duyệt hồ sơ này của <span className='text-primary font-bold'>{displayName}</span>?</>
                    )}
                </div>

                <DialogFooter className='gap-2 sm:gap-0 flex-row justify-end'>
                    <Button variant='outline' onClick={() => onOpenChange(false)} disabled={submitting} className='mr-2'>
                        Huỷ
                    </Button>
                    <Button
                        className='bg-emerald-600 hover:bg-emerald-700 text-white'
                        onClick={handleConfirm}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <><Icons.spinner size={14} className='animate-spin mr-2' />Đang xử lý...</>
                        ) : (
                            <>Duyệt</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
