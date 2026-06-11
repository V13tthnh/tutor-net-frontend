'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REJECT_REASONS, type TutorApplicant } from './tutor-data';

interface RejectDialogProps {
    tutors: TutorApplicant[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (ids: number[], reason: string, note: string) => void;
}

export function RejectDialog({ tutors, open, onOpenChange, onConfirm }: RejectDialogProps) {
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isBulk = tutors.length > 1;

    const handleConfirm = async () => {
        if (!reason) return;
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 800));
        onConfirm(tutors.map(t => t.id), reason, note);
        setReason('');
        setNote('');
        setSubmitting(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-md'>
                <DialogHeader>
                    <div className='flex items-center gap-3 mb-1'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40'>
                            <Icons.circleX size={20} className='text-red-600 dark:text-red-400' />
                        </div>
                        <div>
                            <DialogTitle>Xác nhận từ chối</DialogTitle>
                            <p className='text-sm text-muted-foreground mt-0.5'>
                                {isBulk ? `${tutors.length} gia sư được chọn` : tutors[0]?.fullName}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className='space-y-4 py-2'>
                    {isBulk && (
                        <div className='rounded-lg border bg-muted/30 p-3 max-h-28 overflow-y-auto space-y-1'>
                            {tutors.map(t => (
                                <div key={t.id} className='flex items-center gap-2 text-sm'>
                                    <Icons.user size={12} className='text-muted-foreground shrink-0' />
                                    <span className='font-medium'>{t.fullName}</span>
                                    <span className='text-muted-foreground text-xs'>· {t.subjects.join(', ')}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className='space-y-1.5'>
                        <Label className='text-sm font-medium flex items-center gap-1.5'>
                            <Icons.list size={14} />
                            Lý do từ chối <span className='text-destructive'>*</span>
                        </Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Chọn lý do từ chối...' />
                            </SelectTrigger>
                            <SelectContent>
                                {REJECT_REASONS.map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className='space-y-1.5'>
                        <Label className='text-sm font-medium flex items-center gap-1.5'>
                            <Icons.fileText size={14} />
                            Ghi chú chi tiết
                        </Label>
                        <Textarea
                            placeholder='Nhập ghi chú chi tiết để gửi đến gia sư...'
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className='resize-none h-28'
                        />
                        <p className='text-xs text-muted-foreground'>
                            Ghi chú sẽ được gửi qua email đến gia sư để họ có thể cải thiện hồ sơ.
                        </p>
                    </div>
                </div>

                <DialogFooter className='gap-2'>
                    <Button variant='outline' onClick={() => onOpenChange(false)} disabled={submitting}>
                        Huỷ
                    </Button>
                    <Button
                        variant='destructive'
                        onClick={handleConfirm}
                        disabled={!reason || submitting}
                    >
                        {submitting ? (
                            <><Icons.spinner size={14} className='animate-spin mr-2' />Đang xử lý...</>
                        ) : (
                            <><Icons.send size={14} className='mr-2' />Gửi từ chối</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
