'use client';
// features/security-sandbox/components/test-panels/stored-xss-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Comment { id: number; author: string; text: string; }

export function StoredXssPanel() {
  const [author, setAuthor] = useState('user123');
  const [comment, setComment] = useState('<img src=x onerror="alert(\'Stored XSS!\')" />');
  const [comments, setComments] = useState<Comment[]>([
    { id: 1, author: 'Alice', text: 'Bài học rất hay!' },
    { id: 2, author: 'Bob', text: 'Gia sư tận tâm.' },
  ]);
  const [triggered, setTriggered] = useState<number[]>([]);

  const submit = () => {
    const id = Date.now();
    setComments((prev) => [...prev, { id, author, text: comment }]);
    // Simulate onerror/script detection
    if (comment.includes('onerror') || comment.toLowerCase().includes('<script>') || comment.includes('onload')) {
      setTriggered((prev) => [...prev, id]);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng:</strong> Comment được lưu vào "database" và render cho mọi người dùng mà không sanitize. Payload XSS kích hoạt khi trang tải.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tên tác giả</Label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} className="text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Nội dung comment (payload)</Label>
          <div className="flex gap-2">
            <Input value={comment} onChange={(e) => setComment(e.target.value)} className="font-mono text-xs" />
            <Button size="sm" onClick={submit} variant="destructive">Lưu</Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Comments (render từ DB — không sanitize):</p>
        {comments.map((c) => (
          <div key={c.id} className={`rounded border p-3 text-sm ${triggered.includes(c.id) ? 'border-red-500/60 bg-red-950/30' : 'border-border/30 bg-muted/20'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-primary">{c.author}</span>
              {triggered.includes(c.id) && (
                <span className="text-xs text-red-400 animate-pulse">🔴 XSS Executed!</span>
              )}
            </div>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: c.text }} />
          </div>
        ))}
      </div>

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable:</p>
        <code className="text-muted-foreground">{'db.save(comment); render(comment) // no sanitize'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed:</p>
        <code className="text-muted-foreground">{'db.save(DOMPurify.sanitize(comment))'}</code>
      </div>
    </div>
  );
}
