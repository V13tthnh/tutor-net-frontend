'use client';
// features/security-sandbox/components/test-panels/weak-password-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function getStrength(pw: string): { label: string; color: string; score: number } {
  if (pw.length === 0) return { label: '', color: '', score: 0 };
  if (pw.length < 4) return { label: 'Rất yếu', color: 'bg-red-500', score: 1 };
  if (pw.length < 6) return { label: 'Yếu', color: 'bg-orange-500', score: 2 };
  if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: 'Trung bình', color: 'bg-yellow-500', score: 3 };
  if (!/[^A-Za-z0-9]/.test(pw)) return { label: 'Khá', color: 'bg-blue-500', score: 4 };
  return { label: 'Mạnh', color: 'bg-green-500', score: 5 };
}

const WEAK_PASSWORDS = ['123456', '123', 'abc', 'pass', 'password', 'tutornet', 'admin'];

export function WeakPasswordPanel() {
  const [email, setEmail] = useState('newuser@example.com');
  const [password, setPassword] = useState('123');
  const [registered, setRegistered] = useState(false);
  const strength = getStrength(password);

  const register = () => {
    // Flag enabled: no minimum password complexity enforced
    setRegistered(true);
    setTimeout(() => setRegistered(false), 3000);
  };

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Đăng ký tài khoản không có yêu cầu độ phức tạp mật khẩu. Mật khẩu &quot;123&quot; hoặc &quot;abc&quot; được chấp nhận.
        </AlertDescription>
      </Alert>

      {registered && (
        <div className="rounded border border-red-500 bg-red-950/40 p-3 text-sm text-red-300 animate-pulse">
          Đăng ký thành công với mật khẩu: <strong className="font-mono">"{password}"</strong>
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Mật khẩu (thử: 123, abc, pass)</Label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono text-xs" />
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1 h-1.5">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className={`flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-muted'}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{strength.label}</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {WEAK_PASSWORDS.map((pw) => (
            <button key={pw} onClick={() => setPassword(pw)}
              className="text-xs font-mono px-2 py-1 rounded bg-muted/40 hover:bg-red-900/40 hover:text-red-300 transition-colors border border-border/20">
              {pw}
            </button>
          ))}
        </div>
        <Button onClick={register} variant="destructive" className="w-full" size="sm">
          Đăng ký (không validate mật khẩu)
        </Button>
      </div>

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable:</p>
        <code className="text-muted-foreground">{'if (password.length > 0) saveUser(email, password)'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed:</p>
        <code className="text-muted-foreground">{'if (!isStrongPassword(password)) throw ValidationError'}</code>
      </div>
    </div>
  );
}
