'use client';
// features/security-sandbox/components/test-panels/mime-spoofing-panel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PRESETS = [
  {
    name: 'shell.php (Spoofed to image/jpeg)',
    filename: 'shell.php',
    sentMime: 'image/jpeg',
    realMime: 'application/x-php',
    isSpoofed: true,
  },
  {
    name: 'avatar.jpg (Normal image/jpeg)',
    filename: 'avatar.jpg',
    sentMime: 'image/jpeg',
    realMime: 'image/jpeg',
    isSpoofed: false,
  },
  {
    name: 'report.pdf (Normal pdf)',
    filename: 'report.pdf',
    sentMime: 'application/pdf',
    realMime: 'application/pdf',
    isSpoofed: false,
  },
  {
    name: 'exploit.php (Normal PHP)',
    filename: 'exploit.php',
    sentMime: 'application/x-php',
    realMime: 'application/x-php',
    isSpoofed: false,
  },
];

export function MimeSpoofingPanel() {
  const [selected, setSelected] = useState(PRESETS[0]);
  const [result, setResult] = useState<null | { vuln: boolean; fixed: boolean }>(null);

  const test = () => {
    // Vulnerable: checks the sent MIME type (trusts client) and accepts if it's image/jpeg or application/pdf
    const vulnAllowed = ['image/jpeg', 'image/png', 'application/pdf'].includes(selected.sentMime);

    // Fixed: checks the actual file extension AND checks file signature/content (realMime)
    const ext = selected.filename.slice(selected.filename.lastIndexOf('.')).toLowerCase();
    const isExtAllowed = ['.jpg', '.jpeg', '.png', '.pdf'].includes(ext);
    const isMimeAllowed = ['image/jpeg', 'image/png', 'application/pdf'].includes(selected.realMime);
    const fixedAllowed = isExtAllowed && isMimeAllowed;

    setResult({
      vuln: vulnAllowed,
      fixed: fixedAllowed,
    });
  };

  const reset = () => setResult(null);

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Server chỉ kiểm tra trường <code>Content-Type</code> do client gửi lên.
          Attacker gửi file <code>shell.php</code> nhưng chỉnh sửa HTTP header thành <code>Content-Type: image/jpeg</code>
          để đánh lừa server lưu file PHP độc hại.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => { setSelected(p); setResult(null); }}
            className={`rounded border p-3 text-left text-xs transition-all ${
              selected.name === p.name
                ? p.isSpoofed
                  ? 'border-red-500/50 bg-red-950/20'
                  : 'border-green-500/50 bg-green-950/20'
                : 'border-border/30 bg-muted/10 hover:bg-muted/20'
            }`}
          >
            <p className="font-mono font-semibold">{p.filename}</p>
            <p className="text-muted-foreground mt-1">MIME gửi: <code className="text-orange-400">{p.sentMime}</code></p>
            <p className="text-muted-foreground">MIME thực: <code>{p.realMime}</code></p>
            {p.isSpoofed && <p className="text-red-400 mt-1 font-semibold">⚠️ Giả mạo (Spoofed)</p>}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={test}
          variant={selected.isSpoofed ? 'destructive' : 'outline'}
        >
          Upload {selected.filename}
        </Button>
        {result && (
          <Button size="sm" onClick={reset} variant="outline">Reset</Button>
        )}
      </div>

      {result && (
        <div className="rounded border border-border/30 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-border/30">
            <div className={`p-4 space-y-1 ${result.vuln ? 'bg-red-950/20' : 'bg-green-950/10'}`}>
              <p className="text-xs font-semibold text-muted-foreground">🔴 Vulnerable check</p>
              <code className="text-xs block text-muted-foreground">
                {'if (["image/jpeg"].includes(file.mimetype))'}
              </code>
              <p className={`text-sm font-bold mt-2 ${result.vuln ? 'text-red-400' : 'text-green-400'}`}>
                {result.vuln ? '✅ Cho phép upload' : '❌ Từ chối'}
              </p>
              {result.vuln && selected.isSpoofed && (
                <p className="text-xs text-red-300">Lỗ hổng! Server tin tưởng Content-Type giả mạo và lưu file PHP.</p>
              )}
            </div>
            <div className={`p-4 space-y-1 ${result.fixed ? 'bg-green-950/10' : 'bg-muted/10'}`}>
              <p className="text-xs font-semibold text-muted-foreground">✅ Fixed check</p>
              <code className="text-xs block text-muted-foreground">
                {'validateMagicBytes(file) && validateExtension(file)'}
              </code>
              <p className={`text-sm font-bold mt-2 ${result.fixed ? 'text-green-400' : 'text-red-400'}`}>
                {result.fixed ? '✅ Cho phép upload' : '❌ Từ chối'}
              </p>
              {!result.fixed && selected.isSpoofed && (
                <p className="text-xs text-green-300">Đã chặn thành công vì file thực tế là PHP.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable (Chỉ tin header):</p>
        <code className="text-muted-foreground">{'const allowed = ["image/jpeg"];\nif (allowed.includes(file.mimetype)) save(file);'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed (Kiểm tra extension + Đọc Magic Bytes):</p>
        <code className="text-muted-foreground">
          {'const fileType = await fromBuffer(file.buffer);\nif (fileType.mime !== file.mimetype) throw Error("Spoofed MIME!");'}
        </code>
      </div>
    </div>
  );
}
