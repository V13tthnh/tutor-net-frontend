'use client';
// features/security-sandbox/components/test-panels/brute-force-panel.tsx

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const COMMON_PASSWORDS = ['123456', 'password', 'admin', 'tutornet', '111111', 'qwerty', 'abc123', 'letmein', '123456789', 'welcome'];
const TARGET_PASSWORD = 'tutornet';

export function BruteForcePanel() {
  const [email, setEmail] = useState('target@tutornet.vn');
  const [attempts, setAttempts] = useState<{ password: string; status: 'ok' | 'fail' }[]>([]);
  const [running, setRunning] = useState(false);
  const [found, setFound] = useState('');
  const stopRef = useRef(false);

  const start = async () => {
    setRunning(true);
    stopRef.current = false;
    setAttempts([]);
    setFound('');

    for (const pw of COMMON_PASSWORDS) {
      if (stopRef.current) break;
      await new Promise((r) => setTimeout(r, 300));
      const ok = pw === TARGET_PASSWORD;
      setAttempts((prev) => [...prev, { password: pw, status: ok ? 'ok' : 'fail' }]);
      if (ok) {
        setFound(pw);
        break;
      }
    }
    setRunning(false);
  };

  const stop = () => { stopRef.current = true; setRunning(false); };
  const reset = () => { setAttempts([]); setFound(''); stopRef.current = true; setRunning(false); };

  const progress = Math.round((attempts.length / COMMON_PASSWORDS.length) * 100);

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Không có rate limiting → kẻ tấn công thử lần lượt danh sách mật khẩu phổ biến. Mật khẩu mục tiêu là <code className="font-mono">tutornet</code>.
        </AlertDescription>
      </Alert>

      {found && (
        <div className="rounded border border-red-500 bg-red-950/40 p-4 text-sm text-red-300">
          🔴 Mật khẩu tìm được: <strong className="font-mono text-red-200">"{found}"</strong> — sau {attempts.length} lần thử!
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Email mục tiêu</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="text-xs" disabled={running} />
      </div>

      <div className="flex gap-2">
        <Button onClick={start} disabled={running} variant="destructive" size="sm">
          {running ? 'Đang tấn công...' : 'Bắt đầu Brute Force'}
        </Button>
        {running && <Button onClick={stop} variant="outline" size="sm">Dừng</Button>}
        {!running && attempts.length > 0 && <Button onClick={reset} variant="outline" size="sm">Reset</Button>}
      </div>

      {attempts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{attempts.length} / {COMMON_PASSWORDS.length} thử</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="max-h-48 overflow-y-auto space-y-1 rounded border border-border/20 p-2">
            {attempts.map((a, i) => (
              <div key={i} className={`flex items-center justify-between text-xs font-mono px-2 py-1 rounded ${a.status === 'ok' ? 'bg-red-950/60 text-red-300' : 'bg-muted/20 text-muted-foreground'}`}>
                <span>POST /api/auth/login → {email} : {a.password}</span>
                <span className={a.status === 'ok' ? 'text-red-400 font-bold' : 'text-muted-foreground'}>
                  {a.status === 'ok' ? '200 ✓' : '401 ✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable: không giới hạn attempts</p>
        <p className="text-green-400 font-semibold mt-1">Fixed: rate limit 5 req/min + account lockout</p>
      </div>
    </div>
  );
}
