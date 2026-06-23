'use client';
// features/security-sandbox/components/test-panels/credential-stuffing-panel.tsx

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const LEAKED_CREDENTIALS = [
  { email: 'alice@gmail.com', password: 'Summer2022!' },
  { email: 'bob@yahoo.com', password: 'MyP@ssw0rd' },
  { email: 'alice@tutornet.vn', password: 'Summer2022!' }, // ← reused! match
  { email: 'charlie@hotmail.com', password: 'Ch@rlie99' },
  { email: 'diana@tutornet.vn', password: 'diana123' },    // ← reused! match
  { email: 'eve@example.com', password: 'eveLovesJS' },
];

// Simulate which tutornet accounts reuse password from leak
const TUTORNET_MATCHES = ['alice@tutornet.vn', 'diana@tutornet.vn'];

export function CredentialStuffingPanel() {
  const [attempts, setAttempts] = useState<{ email: string; password: string; status: 'ok' | 'fail' }[]>([]);
  const [running, setRunning] = useState(false);
  const [hits, setHits] = useState<string[]>([]);
  const stopRef = useRef(false);

  const start = async () => {
    setRunning(true);
    stopRef.current = false;
    setAttempts([]);
    setHits([]);

    for (const cred of LEAKED_CREDENTIALS) {
      if (stopRef.current) break;
      await new Promise((r) => setTimeout(r, 400));
      const ok = TUTORNET_MATCHES.includes(cred.email);
      setAttempts((prev) => [...prev, { ...cred, status: ok ? 'ok' : 'fail' }]);
      if (ok) setHits((prev) => [...prev, cred.email]);
    }
    setRunning(false);
  };

  const stop = () => { stopRef.current = true; setRunning(false); };
  const reset = () => { setAttempts([]); setHits([]); stopRef.current = true; setRunning(false); };

  const progress = Math.round((attempts.length / LEAKED_CREDENTIALS.length) * 100);

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Dùng danh sách credential bị rò rỉ từ các breach khác để đăng nhập TutorNet — khai thác người dùng tái sử dụng mật khẩu. 6 credential từ dark web được thử.
        </AlertDescription>
      </Alert>

      {hits.length > 0 && (
        <div className="rounded border border-red-500 bg-red-950/40 p-4 space-y-1">
          <p className="text-red-300 font-semibold text-sm">{hits.length} tài khoản TutorNet bị xâm phạm:</p>
          {hits.map((h) => <p key={h} className="text-xs font-mono text-red-200">✓ {h}</p>)}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={start} disabled={running} variant="destructive" size="sm">
          {running ? 'Đang thử...' : 'Chạy Credential Stuffing'}
        </Button>
        {running && <Button onClick={stop} variant="outline" size="sm">Dừng</Button>}
        {!running && attempts.length > 0 && <Button onClick={reset} variant="outline" size="sm">Reset</Button>}
      </div>

      {attempts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Đang thử {attempts.length}/{LEAKED_CREDENTIALS.length} credentials từ breach list</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="max-h-52 overflow-y-auto space-y-1 rounded border border-border/20 p-2">
            {attempts.map((a, i) => (
              <div key={i} className={`flex items-center justify-between text-xs font-mono px-2 py-1 rounded ${a.status === 'ok' ? 'bg-red-950/60 text-red-300' : 'text-muted-foreground'}`}>
                <span>{a.email} : {a.password}</span>
                <span className={a.status === 'ok' ? 'text-red-400 font-bold' : 'text-muted-foreground'}>
                  {a.status === 'ok' ? 'HIT ✓' : '401 ✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable: không phát hiện bulk login từ nhiều IP</p>
        <p className="text-green-400 font-semibold mt-1">Fixed: rate limit + CAPTCHA + HaveIBeenPwned check</p>
      </div>
    </div>
  );
}
