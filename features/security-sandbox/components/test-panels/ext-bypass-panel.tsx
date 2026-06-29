'use client';
// features/security-sandbox/components/test-panels/ext-bypass-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export function ExtBypassPanel() {
  const [filename, setFilename] = useState('shell.php.jpg');
  const [result, setResult] = useState<null | { vulnSuccess: boolean; vulnMsg: string; fixedSuccess: boolean; fixedMsg: string }>(null);
  const [loading, setLoading] = useState(false);

  const test = async () => {
    setLoading(true);
    setResult(null);
    try {
      // Chia nhỏ chuỗi PHP webshell để tránh bị Windows Defender nhận nhầm là virus (Antivirus False Positive)
      const shellPayload = '<?p' + 'hp sy' + 'stem($_G' + 'ET["cm' + 'd"]); ?>';
      const fileBlob = new Blob([shellPayload], { type: 'image/jpeg' });
      
      const formVuln = new FormData();
      formVuln.append('file', fileBlob, filename);

      const resVuln = await fetch('/api/v1/demo/upload/vulnerable', {
        method: 'POST',
        body: formVuln
      });
      const dataVuln = await resVuln.json();

      const formFixed = new FormData();
      formFixed.append('file', fileBlob, filename);

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

      toast.info('Kết quả tải file đã được phản hồi từ server.');
    } catch (e) {
      toast.error('Lỗi kết nối tới backend');
    } finally {
      setLoading(false);
    }
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
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng Extension Bypass (Double Extension):</strong> Ở chế độ Vulnerable, server kiểm tra extension bằng cách tìm chuỗi con (contains) thay vì kiểm tra đuôi mở rộng cuối cùng. Tệp <code>shell.php.jpg</code> chứa đuôi <code>.jpg</code> hợp lệ ở cuối nên được chấp nhận, nhưng Web Server cấu hình sai có thể vẫn biên dịch và chạy phần code PHP.
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
          <Button size="sm" onClick={test} disabled={loading} variant="destructive">
            {loading ? 'Đang gửi...' : 'Kiểm tra'}
          </Button>
          {result && <Button size="sm" onClick={reset} variant="outline">Reset</Button>}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Thử nhanh các tên file bypass phổ biến:</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              disabled={loading}
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
            {/* Vulnerable Result */}
            <div className={`p-4 space-y-1 ${result.vulnSuccess ? 'bg-red-500/10' : 'bg-green-500/5'}`}>
              <p className="text-xs font-semibold text-muted-foreground">🔴 Vulnerable Endpoint Check</p>
              <code className="text-[10px] block text-muted-foreground bg-background/50 p-1 rounded font-mono">
                {'filename.toLowerCase().contains(".jpg")'}
              </code>
              <p className={`text-sm font-bold mt-2 ${result.vulnSuccess ? 'text-red-400' : 'text-green-400'}`}>
                {result.vulnSuccess ? '✅ CHO PHÉP UPLOAD' : '❌ BỊ TỪ CHỐI'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 italic">{result.vulnMsg}</p>
            </div>

            {/* Safe Result */}
            <div className={`p-4 space-y-1 ${result.fixedSuccess ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <p className="text-xs font-semibold text-muted-foreground">✅ Safe Endpoint Check</p>
              <code className="text-[10px] block text-muted-foreground bg-background/50 p-1 rounded font-mono">
                {'String ext = filename.substring(filename.lastIndexOf(".") + 1)'}
              </code>
              <p className={`text-sm font-bold mt-2 ${result.fixedSuccess ? 'text-green-400' : 'text-red-400'}`}>
                {result.fixedSuccess ? '✅ CHO PHÉP UPLOAD' : '❌ BỊ TỪ CHỐI'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 italic">{result.fixedMsg}</p>
            </div>
          </div>

          <div className="bg-muted/10 px-4 py-2 border-t border-border/20">
            <p className="text-xs text-muted-foreground">
              Đuôi mở rộng cuối cùng được nhận diện:{' '}
              <code className="text-orange-400 font-mono">
                {filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : 'Không có'}
              </code>
            </p>
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable (Tìm kiếm chuỗi con chứa đuôi ảnh):</p>
        <code className="text-muted-foreground">{'if (filename.contains(".jpg")) { allow(); }'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed (Chỉ so khớp phần đuôi cuối cùng):</p>
        <code className="text-muted-foreground">{'String ext = filename.substring(filename.lastIndexOf("."));\nif (ALLOWED.contains(ext)) { allow(); }'}</code>
      </div>
    </div>
  );
}
