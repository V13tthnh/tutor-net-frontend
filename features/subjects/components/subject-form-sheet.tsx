'use client';

/**
 * SubjectFormSheet - Legacy sheet-based form (kept for CellAction edit in table view)
 * The main management UI now uses SubjectFormPanel in subjects-management.tsx
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { SubjectFormPanel } from './subject-form-panel';
import type { Subject } from '../api/types';

interface SubjectFormSheetProps {
  subject?: Subject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubjectFormSheet({ subject, open, onOpenChange }: SubjectFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col p-0'>
        <SubjectFormPanel
          subject={subject}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

export function SubjectFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm môn học
      </Button>
      <SubjectFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
