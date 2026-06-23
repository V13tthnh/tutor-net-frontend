'use client';
// features/security-sandbox/components/test-panels/brute-secret-key-panel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// The "real" secret used by the mock server
const SERVER_SECRET = 'secret';

const COMMON_SECRETS = [
  'password', 'secret', '1234', 'jwt-secret', 'mysecret',
  'abc123', 'changeme', 'key', 'token', 'auth-secret',
  'your-256-bit-secret', 'supersecret', 'default',
];

// Mock HMAC-SHA256 verification (simplified for demo)
function mockVerify(secret: string): boolean {
  return secret === SERVER_SECRET;
}

function forgeToken(secret: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(
    JSON.stringify({ sub: 'attacker@evil.com', role: 'ADMIN', iat: Math.floor(Date.now() / 1000) })
  ).replace(/=/g, '');
  // Mock signature (in real: HMAC-SHA256 with secret)
  const sig = btoa(`sig_with_${secret}`).replace(/=/g, '').slice(0, 20);
  return `${header}.${payload}.${sig}`;
}

export function BruteSecretKeyPanel() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<{ secret: string; success: boolean }[]>([]);
  const [found, setFound] = useState<string | null>(null);
  const [forgedToken, setForgedToken] = useState<string | null>(null);
  const [speed, setSpeed] = useState(200); // ms per attempt

  const start = () => {
    setRunning(true);
    setLogs([]);
    setFound(null);
    setForgedToken(null);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= COMMON_SECRETS.length) {
        clearInterval(interval);
        setRunning(false);
        return;
      }

      const secret = COMMON_SECRETS[i];
      const success = mockVerify(secret);

      setLogs((prev) => [...prev, { secret, success }]);

      if (success) {
        clearInterval(interval);
        setRunning(false);
        setFound(secret);
        setForgedToken(forgeToken(secret));
      }

      i++;
    }, speed);
  };

  const reset = () => {
    setLogs([]);
    setFound(null);
    setForgedToken(null);
    setRunning(false);
  };

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Server dùng JWT secret key yếu như <code>secret</code>.
          Attacker thử danh sách common secrets → tìm đúng secret → forge JWT token
          với bất kỳ payload nào (ví dụ: <code>role: ADMIN</code>).
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Tốc độ brute force:</p>
        <div className="flex gap-2">
          {[{ label: 'Chậm', ms: 400 }, { label: 'Trung bình', ms: 200 }, { label: 'Nhanh', ms: 60 }].map((s) => (
            <button
              key={s.ms}
              onClick={() => setSpeed(s.ms)}
              disabled={running}
              className={`rounded border px-3 py-1 text-xs transition-all ${
                speed === s.ms ? 'border-primary bg-primary/20' : 'border-border/30 hover:bg-muted/20'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={start} variant="destructive" disabled={running}>
          {running ? 'Đang tấn công...' : 'Bắt đầu brute force'}
        </Button>
        {(logs.length > 0 || found) && !running && (
          <Button size="sm" onClick={reset} variant="outline">Reset</Button>
        )}
      </div>

      {logs.length > 0 && (
        <div className="rounded border border-border/20 bg-black/40 p-3 max-h-48 overflow-y-auto space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-mono">
              <span className={log.success ? 'text-green-400' : 'text-muted-foreground'}>
                {log.success ? '✅' : '❌'}
              </span>
              <code className={log.success ? 'text-green-400 font-bold' : 'text-muted-foreground'}>
                {log.secret}
              </code>
              {log.success && <span className="text-green-400">← SECRET FOUND!</span>}
            </div>
          ))}
          {running && (
            <div className="flex items-center gap-2 text-xs">
              <span className="animate-pulse text-yellow-400">●</span>
              <span className="text-muted-foreground">Đang thử tiếp...</span>
            </div>
          )}
        </div>
      )}

      {found && forgedToken && (
        <div className="rounded border border-red-500/40 bg-red-950/10 p-4 space-y-3">
          <p className="text-red-400 font-semibold text-xs">
            🔴 Secret key tìm được: <code className="text-red-300 text-sm">"{found}"</code>
          </p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Forged JWT token (role=ADMIN):</p>
            <div className="rounded bg-black/60 p-3">
              <code className="text-xs text-red-300 break-all">{forgedToken}</code>
            </div>
          </div>
          <p className="text-xs text-red-400">
            Attacker dùng token này để mạo danh admin với bất kỳ payload nào!
          </p>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable: Secret key yếu</p>
        <code className="text-muted-foreground">{'jwt.sign(payload, "secret")'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed: Secret key mạnh + rotate định kỳ</p>
        <code className="text-muted-foreground">
          {'// Generate: openssl rand -base64 64\njwt.sign(payload, process.env.JWT_SECRET, {\n  expiresIn: "15m"\n})'}
        </code>
      </div>
    </div>
  );
}
