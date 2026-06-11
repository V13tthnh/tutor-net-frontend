'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { subjectTreeQueryOptions, subjectKeys } from '../api/queries';
import { reorderSubjectMutation, deleteSubjectMutation } from '../api/mutations';
import type { Subject } from '../api/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertModal } from '@/components/modal/alert-modal';
import { toast } from 'sonner';
import { getQueryClient } from '@/lib/query-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubjectTreeProps {
  onSelect: (subject: Subject | null) => void;
  selectedId?: number | null;
  onEdit: (subject: Subject) => void;
}

/**
 * Vị trí thả khi drag-and-drop:
 * - 'before' : thả phía trên node → trở thành sibling trước node đó
 * - 'into'   : thả vào giữa node → trở thành con (child) của node đó
 * - 'after'  : thả phía dưới node → trở thành sibling sau node đó
 *  ┌──────────────────────────────┐
    │  Top 25%   → "before" ─────→ chèn TRƯỚC (đường kẻ xanh trên)
    │                               │
    │  Mid 50%   → "into"   ─────→ lồng vào CON (highlight xanh + "Thêm vào")
    │                               │
    │  Bot 25%   → "after"  ─────→ chèn SAU  (đường kẻ xanh dưới)
    └──────────────────────────────┘
 */
type DropPosition = 'before' | 'into' | 'after';

interface DragState {
  draggingId: number | null;
  overId: number | null;
  dropPosition: DropPosition | null;
}

// ─── TreeNode ─────────────────────────────────────────────────────────────────

interface TreeNodeProps {
  subject: Subject;
  depth: number;
  selectedId?: number | null;
  dragState: DragState;
  onDragStart: (e: React.DragEvent, subject: Subject) => void;
  onDragOver: (e: React.DragEvent, subject: Subject, el: HTMLElement) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, target: Subject) => void;
  onSelect: (subject: Subject) => void;
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}

function TreeNode({
  subject,
  depth,
  selectedId,
  dragState,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onSelect,
  onEdit,
  onDelete
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = !!subject.children?.length;
  const isSelected = subject.id === selectedId;
  const isDragging = dragState.draggingId === subject.id;
  const isOver = dragState.overId === subject.id && !isDragging;
  const dropPos = isOver ? dragState.dropPosition : null;

  return (
    <div className='select-none'>
      {/* Drop indicator: BEFORE */}
      {dropPos === 'before' && (
        <div className='mx-1 h-0.5 rounded-full bg-primary shadow-[0_0_6px_1px_hsl(var(--primary)/0.4)]' />
      )}

      {/* Row */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, subject)}
        onDragOver={(e) => onDragOver(e, subject, e.currentTarget as HTMLElement)}
        onDragEnd={onDragEnd}
        onDrop={(e) => onDrop(e, subject)}
        onClick={() => onSelect(subject)}
        className={cn(
          'group relative flex items-center gap-1 rounded-lg cursor-pointer transition-all duration-100',
          'hover:bg-accent/60',
          isSelected && 'bg-primary/10 ring-1 ring-primary/20',
          isDragging && 'opacity-40 scale-[0.98]',
          // 'into' → highlight toàn bộ node với màu primary
          dropPos === 'into' && 'ring-2 ring-primary bg-primary/8'
        )}
        style={{ paddingLeft: `${depth * 14 + 6}px`, paddingRight: 6, paddingTop: 5, paddingBottom: 5 }}
      >
        {/* Drag handle */}
        <Icons.gripVertical className='h-3.5 w-3.5 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60 cursor-grab active:cursor-grabbing' />

        {/* Expand toggle */}
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded((v) => !v);
          }}
          className={cn(
            'shrink-0 rounded p-0.5 transition-colors hover:bg-accent',
            !hasChildren && 'invisible pointer-events-none'
          )}
        >
          {expanded
            ? <Icons.chevronDown className='h-3.5 w-3.5 text-muted-foreground' />
            : <Icons.chevronRight className='h-3.5 w-3.5 text-muted-foreground' />
          }
        </button>

        {/* Icon */}
        {dropPos === 'into'
          ? <Icons.folderOpen className='h-4 w-4 shrink-0 text-primary' />
          : hasChildren
            ? expanded
              ? <Icons.folderOpen className='h-4 w-4 shrink-0 text-amber-500' />
              : <Icons.folder className='h-4 w-4 shrink-0 text-amber-500' />
            : <Icons.fileText className='h-4 w-4 shrink-0 text-blue-500/80' />
        }

        {/* Name */}
        <span className={cn(
          'flex-1 truncate text-sm leading-none',
          isSelected ? 'font-semibold text-primary' : 'font-medium',
          dropPos === 'into' && 'text-primary font-semibold'
        )}>
          {subject.name}
        </span>

        {/* 'into' hint label */}
        {dropPos === 'into' && (
          <span className='shrink-0 text-[10px] font-medium text-primary bg-primary/10 rounded px-1 py-0.5'>
            Thêm vào
          </span>
        )}

        {/* Cấp 1 badge */}
        {depth === 0 && dropPos !== 'into' && (
          <Badge variant='outline' className='shrink-0 h-[18px] px-1.5 text-[10px] font-normal leading-none'>
            Cấp 1
          </Badge>
        )}

        {/* Inactive badge */}
        {!subject.isActive && dropPos !== 'into' && (
          <Badge variant='secondary' className='shrink-0 h-[18px] px-1.5 text-[10px] leading-none'>
            Ẩn
          </Badge>
        )}

        {/* Inline actions (appear on hover) */}
        <div
          className='ml-auto flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 rounded-md'
            onClick={() => onEdit(subject)}
            title='Chỉnh sửa'
          >
            <Icons.edit className='h-3 w-3' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10'
            onClick={() => onDelete(subject)}
            title='Xóa'
          >
            <Icons.trash className='h-3 w-3' />
          </Button>
        </div>
      </div>

      {/* Drop indicator: AFTER */}
      {dropPos === 'after' && (
        <div className='mx-1 h-0.5 rounded-full bg-primary shadow-[0_0_6px_1px_hsl(var(--primary)/0.4)]' />
      )}

      {/* Children */}
      {hasChildren && expanded && (
        <div
          className='relative ml-5 border-l border-border/50'
          style={{ marginLeft: `${depth * 14 + 22}px` }}
        >
          <div className='space-y-0.5 py-0.5 pl-1'>
            {subject.children!.map((child) => (
              <TreeNode
                key={child.id}
                subject={child}
                depth={depth + 1}
                selectedId={selectedId}
                dragState={dragState}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDrop={onDrop}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SubjectTree ───────────────────────────────────────────────────────────────

export function SubjectTree({ onSelect, selectedId, onEdit }: SubjectTreeProps) {
  const [search, setSearch] = useState('');
  const [dragState, setDragState] = useState<DragState>({ draggingId: null, overId: null, dropPosition: null });
  const [draggingSubject, setDraggingSubject] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  const { data, isLoading } = useQuery(subjectTreeQueryOptions({ search: search || undefined }));

  const reorderMutation = useMutation({
    ...reorderSubjectMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật vị trí môn học');
      getQueryClient().invalidateQueries({ queryKey: subjectKeys.all });
    },
    onError: () => toast.error('Cập nhật vị trí thất bại')
  });

  const deleteMutation = useMutation({
    ...deleteSubjectMutation,
    onSuccess: () => {
      toast.success('Đã xóa môn học');
      setDeleteTarget(null);
      getQueryClient().invalidateQueries({ queryKey: subjectKeys.all });
    },
    onError: () => toast.error('Xóa thất bại')
  });

  const handleDragStart = useCallback((e: React.DragEvent, subject: Subject) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragState((s) => ({ ...s, draggingId: subject.id }));
    setDraggingSubject(subject);
  }, []);

  /**
   * Xác định DropPosition dựa trên vị trí Y của chuột trong element:
   *   - top 25%    → 'before'  (chèn trước)
   *   - middle 50% → 'into'    (thêm vào trong, thành con)
   *   - bottom 25% → 'after'   (chèn sau)
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent, subject: Subject, el: HTMLElement) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (subject.id === dragState.draggingId) return;

      const rect = el.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const ratio = y / rect.height;

      let dropPosition: DropPosition;
      if (ratio < 0.25) {
        dropPosition = 'before';
      } else if (ratio > 0.75) {
        dropPosition = 'after';
      } else {
        dropPosition = 'into';
      }

      setDragState((s) => ({ ...s, overId: subject.id, dropPosition }));
    },
    [dragState.draggingId]
  );

  const handleDragEnd = useCallback(() => {
    setDragState({ draggingId: null, overId: null, dropPosition: null });
    setDraggingSubject(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, target: Subject) => {
      e.preventDefault();
      if (!draggingSubject || draggingSubject.id === target.id) return;

      const { dropPosition } = dragState;

      let parentId: number | null;
      let sortOrder: number;

      if (dropPosition === 'into') {
        // Thả VÀO node → dragging subject trở thành CON của target
        parentId = target.id;
        sortOrder = 0; // đặt đầu danh sách con
      } else if (dropPosition === 'after') {
        // Thả DƯỚI node → sibling sau target (cùng cấp)
        parentId = target.parentId ?? null;
        sortOrder = target.sortOrder + 1;
      } else {
        // 'before' hoặc null → sibling trước target (cùng cấp)
        parentId = target.parentId ?? null;
        sortOrder = target.sortOrder;
      }

      reorderMutation.mutate({ id: draggingSubject.id, parentId, sortOrder });
      setDragState({ draggingId: null, overId: null, dropPosition: null });
      setDraggingSubject(null);
    },
    [draggingSubject, dragState, reorderMutation]
  );

  const subjects = data?.data ?? [];

  return (
    <>
      <AlertModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />

      <div className='flex flex-col gap-2.5'>
        {/* Search bar */}
        <div className='relative'>
          <Icons.search className='absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground' />
          <Input
            placeholder='Tìm môn học...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-8 pl-8 text-sm'
          />
          {search && (
            <button
              type='button'
              onClick={() => setSearch('')}
              className='absolute right-2 top-2 rounded text-muted-foreground hover:text-foreground'
            >
              <Icons.close className='h-3.5 w-3.5' />
            </button>
          )}
        </div>

        {/* Hint */}
        <p className='text-[11px] text-muted-foreground flex items-center gap-1.5'>
          <Icons.gripVertical className='h-3 w-3' />
          Kéo thả để sắp xếp — thả vào giữa để lồng cấp con
        </p>

        {/* Tree list */}
        <div className='relative rounded-lg border bg-background/60'>
          {/* Reorder loading overlay */}
          {reorderMutation.isPending && (
            <div className='absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[2px]'>
              <div className='flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm'>
                <Icons.spinner className='h-3.5 w-3.5 animate-spin text-primary' />
                <span className='text-xs font-medium text-muted-foreground'>Đang cập nhật...</span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className='space-y-1.5 p-2 overflow-hidden'>
              {[100, 100, 75, 75, 55, 100, 75].map((w, i) => {
                const indent = i % 3 === 0 ? 0 : i % 3 === 1 ? 14 : 28;
                return (
                  <Skeleton
                    key={i}
                    className='h-7 rounded-md'
                    style={{
                      width: indent ? `calc(${w}% - ${indent}px)` : `${w}%`,
                      marginLeft: indent
                    }}
                  />
                );
              })}
            </div>
          ) : subjects.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-10 text-center'>
              <Icons.folder className='h-9 w-9 text-muted-foreground/20' />
              <p className='mt-2 text-sm text-muted-foreground'>
                {search ? 'Không tìm thấy kết quả' : 'Chưa có môn học nào'}
              </p>
            </div>
          ) : (
            <div className='space-y-0.5 p-1.5'>
              {subjects.map((subject) => (
                <TreeNode
                  key={subject.id}
                  subject={subject}
                  depth={0}
                  selectedId={selectedId}
                  dragState={dragState}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function SubjectTreeSkeleton() {
  return (
    <div className='space-y-1.5 p-2 overflow-hidden'>
      {[100, 100, 75, 75, 55, 100, 80].map((w, i) => {
        const indent = i % 3 === 0 ? 0 : i % 3 === 1 ? 14 : 28;
        return (
          <Skeleton
            key={i}
            className='h-7 rounded-md'
            style={{
              width: indent ? `calc(${w}% - ${indent}px)` : `${w}%`,
              marginLeft: indent
            }}
          />
        );
      })}
    </div>
  );
}
