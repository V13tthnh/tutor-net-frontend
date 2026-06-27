'use client';
// components/ui/table/table-forbidden-state.tsx

import { ShieldAlert } from 'lucide-react';

interface TableForbiddenStateProps {
  /** Số cột để colspan (mặc định 10) */
  colSpan?: number;
  /** Ghi đè message mặc định */
  message?: string;
}

/**
 * Hiển thị trạng thái "không có quyền" bên trong TableBody của một danh sách.
 * Dùng cho lỗi 403 khi fetch danh sách.
 */
export function TableForbiddenState({ colSpan = 10, message }: TableForbiddenStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-destructive">Truy cập bị từ chối</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {message ?? 'Bạn không có quyền xem danh sách này'}
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}

/**
 * Phiên bản standalone (không nằm trong <table>) — dùng cho các layout không có Table.
 */
export function ForbiddenState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
        <ShieldAlert className="h-7 w-7 text-destructive" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-destructive">Truy cập bị từ chối</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {message ?? 'Bạn không có quyền xem danh sách này'}
        </p>
      </div>
    </div>
  );
}
