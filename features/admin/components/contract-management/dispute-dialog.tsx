'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { resolveContractDispute } from '../../api/service';
import type { AdminContractResponse } from '../../api/types';

interface DisputeDialogProps {
  open: boolean;
  contract: AdminContractResponse | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DisputeDialog({ open, contract, onClose, onSuccess }: DisputeDialogProps) {
  const [status, setStatus] = useState<'CANCELLED' | 'VIOLATED'>('CANCELLED');
  const [reason, setReason] = useState('');
  const [refundFee, setRefundFee] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!contract || !reason.trim()) return;

    setLoading(true);
    try {
      await resolveContractDispute(contract.id, {
        status,
        reason: reason.trim(),
        refundFee,
      });
      toast.success('Xử lý sự cố tranh chấp hợp đồng thành công.');
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi xử lý tranh chấp');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStatus('CANCELLED');
    setReason('');
    setRefundFee(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
            Xử lý Sự cố & Bảo hành
          </DialogTitle>
          <DialogDescription>
            Can thiệp vào hợp đồng đang hoạt động khi có sự cố học thử hỏng hoặc gia sư vi phạm chính sách.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {contract && (
            <div className="rounded-lg bg-muted p-3 text-xs space-y-1.5 border border-border/80">
              <p>
                <span className="font-bold">Mã hợp đồng:</span> {contract.contractNumber}
              </p>
              <p>
                <span className="font-bold">Môn học:</span> {contract.subjectName}
              </p>
              <p>
                <span className="font-bold">Gia sư:</span> {contract.tutorName}
              </p>
              <p>
                <span className="font-bold">Phụ huynh:</span> {contract.contactName}
              </p>
              <p>
                <span className="font-bold">Phí dịch vụ:</span>{' '}
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  contract.introductionFee
                )}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground">Quyết định xử lý *</label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as 'CANCELLED' | 'VIOLATED')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CANCELLED">Hủy hợp đồng (CANCELLED)</SelectItem>
                <SelectItem value="VIOLATED">Đánh dấu Vi phạm (VIOLATED)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="refundFee"
              checked={refundFee}
              onCheckedChange={(checked) => setRefundFee(!!checked)}
            />
            <label
              htmlFor="refundFee"
              className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-foreground"
            >
              Hoàn trả tiền phí nhận lớp cho Gia sư
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground">Lý do xử lý *</label>
            <Textarea
              placeholder="Nhập lý do chi tiết (ví dụ: gia sư dạy kém bị đổi, phụ huynh hủy lớp giữa chừng, học thử hỏng...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none text-sm"
              rows={4}
            />
            {!reason.trim() && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Vui lòng nhập lý do can thiệp hợp đồng
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            variant="destructive"
            className="cursor-pointer"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận xử lý'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
