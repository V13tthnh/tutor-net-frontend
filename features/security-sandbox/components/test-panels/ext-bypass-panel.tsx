'use client';
// features/security-sandbox/components/test-panels/ext-bypass-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];

function vulnerableCheck(filename: string): boolean {
  // Vulnerable: only checks if filename contains an allowed extension
  return ALLOWED_EXTS.some((ext) => filename.toLowerCase().includes(ext));
}

function fixedCheck(filename: string): boolean {
  // Fixed: checks the LAST extension
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return false;
  const ext = filename.slice(lastDot).toLowerCase();
  return ALLOWED_EXTS.includes(ext);
}

export function ExtBypassPanel() {
  const [filename, setFilename] = useState('shell.php.jpg');
  const [result, setResult] = useState<null | { vuln: boolean; fixed: boolean }>(null);

  const test = () => {
    setResult({
      vuln: vulnerableCheck(filename),
      fixed: fixedCheck(filename),
    });
  };

  const reset = () => setResult(null);

  const examples = [
    'shell.php.jpg',
    'avatar.jpg.php',
    'payload.php%00.jpg',
    'image.jpg',
    'document.pdf',
    'shell.PHP',
  ];

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Server kiểm tra extension bằng cách tìm chuỗi con
          thay vì kiểm tra extension cuối cùng. File <code>shell.php.jpg</code> chứa
          <code>.jpg</code> → bị nhầm là ảnh hợp lệ.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tên file upload</Label>
        <div className="flex gap-2">
          <Input
            value={filename}
            onChange={(e) => { setFilename(e.target.value); setResult(null); }}
            className="font-mono text-xs"
            placeholder="shell.php.jpg"
          />
          <Button size="sm" onClick={test} variant="destructive">Kiểm tra</Button>
          {result && <Button size="sm" onClick={reset} variant="outline">Reset</Button>}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Thử nhanh:</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => { setFilename(ex); setResult(null); }}
              className="rounded border border-border/30 px-2 py-1 text-xs font-mono hover:bg-muted/20 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="rounded border border-border/30 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-border/30">
            <div className={`p-4 space-y-1 ${result.vuln ? 'bg-red-950/20' : 'bg-green-950/10'}`}>
              <p className="text-xs font-semibold text-muted-foreground">🔴 Vulnerable check</p>
              <code className="text-xs block text-muted-foreground">
                {'filename.includes(".jpg")'}
              </code>
              <p className={`text-sm font-bold mt-2 ${result.vuln ? 'text-red-400' : 'text-green-400'}`}>
                {result.vuln ? '✅ Cho phép upload' : '❌ Từ chối'}
              </p>
              {result.vuln && (
                <p className="text-xs text-red-300">Lỗ hổng! File nguy hiểm được chấp nhận</p>
              )}
            </div>
            <div className={`p-4 space-y-1 ${result.fixed ? 'bg-green-950/10' : 'bg-muted/10'}`}>
              <p className="text-xs font-semibold text-muted-foreground">✅ Fixed check</p>
              <code className="text-xs block text-muted-foreground">
                {'path.extname(filename)'}
              </code>
              <p className={`text-sm font-bold mt-2 ${result.fixed ? 'text-green-400' : 'text-red-400'}`}>
                {result.fixed ? '✅ Cho phép upload' : '❌ Từ chối'}
              </p>
              {!result.fixed && <p className="text-xs text-green-300">Đã chặn đúng cách</p>}
            </div>
          </div>

          <div className="bg-muted/10 px-4 py-2 border-t border-border/20">
            <p className="text-xs text-muted-foreground">
              Extension thực sự:{' '}
              <code className="text-orange-400">
                {filename.slice(filename.lastIndexOf('.'))}
              </code>
            </p>
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable:</p>
        <code className="text-muted-foreground">{'ALLOWED.some(ext => filename.includes(ext))'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed:</p>
        <code className="text-muted-foreground">{'ALLOWED.includes(path.extname(filename).toLowerCase())'}</code>
      </div>
    </div>
  );
}
