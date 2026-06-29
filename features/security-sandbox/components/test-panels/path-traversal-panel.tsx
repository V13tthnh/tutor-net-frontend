'use client';
// features/security-sandbox/components/test-panels/path-traversal-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export function PathTraversalPanel() {
  const [input, setInput] = useState('../../etc/passwd');
  const [result, setResult] = useState<{
    vulnPath: string;
    vulnContent: string;
    vulnWarning: boolean;
    fixedBlocked: boolean;
    fixedPath?: string;
    fixedContent?: string;
    fixedReason?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const examples = [
    '../../etc/passwd',
    '../../etc/hosts',
    '../secret.txt',
    'report.pdf',
    'avatar.jpg',
  ];

  const fetchFile = async () => {
    setLoading(true);
    setResult(null);
    try {
      // 1. Gọi API Vulnerable
      const resVuln = await fetch(`/api/v1/demo/files/read/vulnerable?filename=${encodeURIComponent(input)}`);
      const dataVuln = await resVuln.json();

      // 2. Gọi API Safe
      const resFixed = await fetch(`/api/v1/demo/files/read/safe?filename=${encodeURIComponent(input)}`);
      const dataFixed = await resFixed.json();

      setResult({
        vulnPath: dataVuln.resolvedPath,
        vulnContent: dataVuln.content,
        vulnWarning: dataVuln.warning,
        fixedBlocked: dataFixed.blocked || false,
        fixedPath: dataFixed.resolvedPath,
        fixedContent: dataFixed.content,
        fixedReason: dataFixed.reason,
      });

      toast.info('Đã tải kết quả từ server.');
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
          <strong>Kiểm thử Path Traversal (Đường dẫn tương đối):</strong> Server xây dựng đường dẫn file bằng cách nối chuỗi input người dùng với thư mục gốc (Jail directory). Sử dụng <code>../</code> để cố gắng thoát ra ngoài thư mục được phép đọc để rò rỉ file hệ thống nhạy cảm.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tên file (tham số ?filename=)</Label>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(null); }}
            className="font-mono text-xs"
            placeholder="../../etc/passwd"
            disabled={loading}
          />
          <Button size="sm" onClick={fetchFile} disabled={loading} variant="destructive">
            {loading ? 'Đang đọc...' : 'Đọc file'}
          </Button>
          {result && <Button size="sm" onClick={reset} variant="outline" disabled={loading}>Reset</Button>}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Thử nhanh các payload Path Traversal phổ biến:</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              disabled={loading}
              onClick={() => { setInput(ex); setResult(null); }}
              className="rounded border border-border/30 px-2 py-1 text-xs font-mono hover:bg-muted/20 transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="rounded border border-border/30 overflow-hidden divide-y divide-border/20">
          {/* Vulnerable Result */}
          <div className={`p-4 space-y-2 ${result.vulnWarning ? 'bg-red-500/10' : 'bg-green-500/5'}`}>
            <p className="text-xs font-semibold text-red-400">🔴 Vulnerable Endpoint Check</p>
            <code className="text-[10px] block text-muted-foreground bg-background/50 p-1 rounded font-mono">
              {'Path filePath = PUBLIC_DIR.resolve(filename);'}
            </code>
            <div className="text-[11px] font-mono text-muted-foreground">
              Resolved Path: <span className={result.vulnWarning ? 'text-red-400 font-bold' : 'text-green-400'}>{result.vulnPath}</span>
            </div>
            <pre className="text-xs font-mono bg-black/40 p-2.5 rounded text-red-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {result.vulnContent}
            </pre>
            {result.vulnWarning && (
              <p className="text-[10px] text-red-300 italic font-semibold">⚠️ Lỗ hổng! Server cho phép thoát khỏi thư mục chỉ định và tải được file hệ thống.</p>
            )}
          </div>

          {/* Safe Result */}
          <div className={`p-4 space-y-2 ${result.fixedBlocked ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <p className="text-xs font-semibold text-green-400">✅ Safe Endpoint Check</p>
            <code className="text-[10px] block text-muted-foreground bg-background/50 p-1 rounded font-mono">
              {'if (filename.contains("..")) return Blocked;'}
            </code>
            {result.fixedBlocked ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-400">❌ ĐÃ CHẶN YÊU CẦU THÀNH CÔNG</p>
                <p className="text-[10px] text-muted-foreground italic">Lý do chặn: {result.fixedReason}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-muted-foreground">
                  Resolved Path: <span className="text-green-400 font-bold">{result.fixedPath}</span>
                </div>
                <pre className="text-xs font-mono bg-black/40 p-2.5 rounded text-green-200 whitespace-pre-wrap">
                  {result.fixedContent}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable (Nối chuỗi trực tiếp):</p>
        <code className="text-muted-foreground">{'Path filePath = PUBLIC_DIR.resolve(filename);'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed (Kiểm tra chặn ký tự quay lui & so khớp Canonical Path):</p>
        <code className="text-muted-foreground">
          {'if (filename.contains("..") || filename.contains("/")) throw Blocked;\nif (!resolved.startsWith(PUBLIC_DIR)) throw Blocked;'}
        </code>
      </div>
    </div>
  );
}
