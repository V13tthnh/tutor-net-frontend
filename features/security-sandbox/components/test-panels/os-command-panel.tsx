'use client';
// features/security-sandbox/components/test-panels/os-command-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export function OsCommandPanel() {
  const [input, setInput] = useState('google.com; id');
  const [result, setResult] = useState<{
    vulnCmd: string;
    vulnOutput: string;
    vulnInjection: boolean;
    fixedBlocked: boolean;
    fixedReason?: string;
    fixedOutput?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const examples = [
    'google.com; id',
    'google.com; whoami',
    'google.com | ls /',
    'google.com && cat /etc/passwd',
    'google.com; cat /var/www/.env',
  ];

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      // 1. Gọi API Vulnerable
      const resVuln = await fetch(`/api/v1/demo/cmd/ping/vulnerable?host=${encodeURIComponent(input)}`);
      const dataVuln = await resVuln.json();

      // 2. Gọi API Safe
      const resFixed = await fetch(`/api/v1/demo/cmd/ping/safe?host=${encodeURIComponent(input)}`);
      const dataFixed = await resFixed.json();

      setResult({
        vulnCmd: dataVuln.builtCommand,
        vulnOutput: dataVuln.simulatedOutput,
        vulnInjection: dataVuln.injectionDetected,
        fixedBlocked: dataFixed.blocked || false,
        fixedReason: dataFixed.reason,
        fixedOutput: dataFixed.output,
      });

      toast.info('Nhận kết quả thực thi thành công.');
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
          <strong>Kiểm thử OS Command Injection:</strong> Đầu vào của người dùng được ghép trực tiếp vào câu lệnh shell thực thi trên máy chủ (hệ thống). Sử dụng các ký tự phân cách lệnh như <code>;</code>, <code>|</code>, hoặc <code>&&</code> để chạy thêm các mã lệnh tuỳ ý ngoài ping.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Ping target (Trường đầu vào bị lỗi)</Label>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(null); }}
            className="font-mono text-xs"
            placeholder="hostname; command"
            disabled={loading}
          />
          <Button size="sm" onClick={run} disabled={loading} variant="destructive">
            {loading ? 'Đang chạy...' : 'Thực thi'}
          </Button>
          {result && <Button size="sm" onClick={reset} variant="outline" disabled={loading}>Reset</Button>}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Thử nhanh các payload Command Injection phổ biến:</p>
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
          <div className={`p-4 space-y-2 ${result.vulnInjection ? 'bg-red-500/10' : 'bg-green-500/5'}`}>
            <p className="text-xs font-semibold text-red-400">🔴 Vulnerable Endpoint Check</p>
            <div className="text-[11px] font-mono text-muted-foreground">
              Lệnh Shell được xây dựng: <code className="text-orange-400 bg-background/50 p-1 rounded font-mono">{result.vulnCmd}</code>
            </div>
            <pre className="text-xs font-mono bg-black/60 p-2.5 rounded text-green-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {result.vulnOutput}
            </pre>
            {result.vulnInjection && (
              <p className="text-[10px] text-red-300 italic font-semibold">⚠️ Lỗ hổng! Lệnh chèn thêm đã chạy thành công dưới quyền hạn của server.</p>
            )}
          </div>

          {/* Safe Result */}
          <div className={`p-4 space-y-2 ${result.fixedBlocked ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
            <p className="text-xs font-semibold text-green-400">✅ Safe Endpoint Check</p>
            {result.fixedBlocked ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-400">❌ ĐÃ CHẶN INJECTION THÀNH CÔNG</p>
                <p className="text-[10px] text-muted-foreground italic">Lý do: {result.fixedReason}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-bold text-green-400">✅ Đăng nhập an toàn (ProcessBuilder):</p>
                <pre className="text-xs font-mono bg-black/60 p-2.5 rounded text-green-400 whitespace-pre-wrap">
                  {result.fixedOutput || 'Không có output (lệnh ping an toàn đã chạy xong)'}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable (Ghép chuỗi gọi shell):</p>
        <code className="text-muted-foreground">{'Runtime.getRuntime().exec("ping -c 1 " + host)'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed (Sử dụng danh sách tham số (args array) và validate Regex):</p>
        <code className="text-muted-foreground">
          {'Pattern.compile("^[a-zA-Z0-9.-]+$").matcher(host);\nnew ProcessBuilder("ping", "-c", "1", host).start();'}
        </code>
      </div>
    </div>
  );
}
