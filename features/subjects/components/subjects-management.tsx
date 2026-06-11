'use client';

import { useState, Suspense } from 'react';
import { SubjectTree } from './subject-tree';
import { SubjectFormPanel } from './subject-form-panel';
import { SubjectStatistics, SubjectStatisticsSkeleton } from './subject-stats';
import type { Subject } from '../api/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

// ─── Main 2-column management UI ─────────────────────────────────────────────

export default function SubjectsManagementClient() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');


  const handleSelectSubject = (subject: Subject | null) => {
    setSelectedSubject(subject);
    // If we were editing a different subject, go back to create with this as parent
    if (formMode === 'edit' && subject && editingSubject?.id !== subject.id) {
      setEditingSubject(null);
      setFormMode('create');
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSelectedSubject(subject);
    setFormMode('edit');
  };

  const handleCancelEdit = () => {
    setEditingSubject(null);
    setFormMode('create');
  };

  const handleFormSuccess = () => {
    if (formMode === 'edit') {
      setEditingSubject(null);
      setFormMode('create');
    }
  };

  const handleNewSubject = () => {
    setEditingSubject(null);
    setFormMode('create');
    setSelectedSubject(null);
  };

  return (
    <div className='flex flex-col gap-4'>
      {/* Stats row */}
      <Suspense fallback={<SubjectStatisticsSkeleton />}>
        <SubjectStatistics />
      </Suspense>

      {/* 2-column content area */}
      <div className='flex items-start gap-4'>
        {/* ──── LEFT: Subject Tree Panel ──────────────────────── */}
        <aside className='flex w-[360px] shrink-0 flex-col rounded-xl border bg-card shadow-sm'>
          {/* Panel header */}
          <div className='flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2.5'>
            <div className='flex items-center gap-2'>
              <Icons.category className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm font-semibold'>Cấu trúc môn học</span>
            </div>
            <Button
              size='sm'
              variant='outline'
              className='h-7 gap-1 text-xs'
              onClick={handleNewSubject}
            >
              <Icons.add className='h-3 w-3' />
              Thêm mới
            </Button>
          </div>

          {/* Tree */}
          <div className='p-3'>
            <SubjectTree
              onSelect={handleSelectSubject}
              selectedId={selectedSubject?.id ?? null}
              onEdit={handleEditSubject}
            />
          </div>

          {/* Footer legend */}
          <div className='border-t bg-muted/20 px-4 py-2'>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground'>
              <span className='flex items-center gap-1'>
                <Icons.folder className='h-3 w-3 text-amber-500' /> Nhóm môn
              </span>
              <span className='flex items-center gap-1'>
                <Icons.fileText className='h-3 w-3 text-blue-500' /> Môn học / Chuyên đề
              </span>
            </div>
          </div>
        </aside>

        {/* ──── RIGHT: Form Panel ──────────────────────────────── */}
        <div className={cn(
          'flex min-w-0 flex-1 flex-col rounded-xl border bg-card shadow-sm',
          formMode === 'edit' && 'ring-2 ring-amber-500/30'
        )}>
          <SubjectFormPanel
            key={formMode === 'edit' ? `edit-${editingSubject?.id}` : `create-${selectedSubject?.id ?? 'root'}`}
            subject={formMode === 'edit' ? editingSubject : null}
            defaultParentId={formMode === 'create' ? (selectedSubject?.id ?? null) : null}
            onSuccess={handleFormSuccess}
            onCancel={formMode === 'edit' ? handleCancelEdit : undefined}
          />
        </div>
      </div>
    </div>
  );
}
