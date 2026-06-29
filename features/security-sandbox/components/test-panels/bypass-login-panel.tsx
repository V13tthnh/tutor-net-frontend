'use client';
// features/security-sandbox/components/test-panels/bypass-login-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function BypassLoginPanel() {
  const [email, setEmail] = useState("victim@tutornet.vn");
  const [password, setPassword] = useState("wrongpassword");
  const [result, setResult] = useState<'idle' | 'success' | 'fail'>('idle');
  const [token, setToken] = useState('');

  const login = () => {
    // Simulate: flag enabled → any credentials succeed
    const fakeToken = btoa(JSON.stringify({ sub: email, role: 'student', exp: Date.now() + 3600000 }));
    setToken(fakeToken);
    setResult('success');
  };

  const reset = () => { setResult('idle'); setToken(''); };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng:</strong> Khi flag bật, server bỏ qua kiểm tra mật khẩu — mọi credential đều được chấp nhận và trả về JWT hợp lệ.
        </AlertDescription>
      </Alert>

      {result === 'success' && (
        <div className="rounded border border-red-500 bg-red-950/40 p-4 space-y-2">
          <p className="text-red-300 font-semibold text-sm">Đăng nhập thành công với mật khẩu sai!</p>
          <p className="text-xs text-muted-foreground">JWT token (giả lập):</p>
          <code className="text-xs text-green-400 break-all block bg-muted/20 p-2 rounded">{token}</code>
          <Button size="sm" onClick={reset} variant="outline">Reset</Button>
        </div>
      )}

      {result === 'idle' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mật khẩu (sai vẫn login được)</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="text" className="text-xs font-mono" />
          </div>
          <Button onClick={login} variant="destructive" className="w-full" size="sm">
            Đăng nhập (Bypass)
          </Button>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable:</p>
        <code className="text-muted-foreground">{'if (bypassLogin) return generateToken(email); // skip password check'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed:</p>
        <code className="text-muted-foreground">{'if (!bcrypt.compare(password, hash)) throw Unauthorized'}</code>
      </div>
    </div>
  );
}
