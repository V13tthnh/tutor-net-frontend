'use client';
// features/security-sandbox/components/test-panels/session-hijacking-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SessionHijackingPanel() {
  const [stolenToken, setStolenToken] = useState('');
  const [impersonating, setImpersonating] = useState(false);
  const [victim] = useState({ email: 'alice@tutornet.vn', role: 'STUDENT', id: 42 });

  const stealToken = () => {
    // Simulate XSS stealing document.cookie
    const fakeToken = btoa(JSON.stringify({ sub: victim.email, role: victim.role, id: victim.id, exp: Date.now() + 3600000 }));
    setStolenToken(`client_access_token=${fakeToken}`);
  };

  const hijack = () => {
    if (stolenToken) setImpersonating(true);
  };

  const reset = () => { setStolenToken(''); setImpersonating(false); };

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Token trong cookie không có cờ HttpOnly → XSS đọc được <code>document.cookie</code>. Kẻ tấn công dùng token để mạo danh nạn nhân.
        </AlertDescription>
      </Alert>

      {impersonating && (
        <div className="rounded border border-red-500 bg-red-950/40 p-4 space-y-2">
          <p className="text-red-300 font-semibold">Đang mạo danh: {victim.email}</p>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>Role: <span className="text-red-300">{victim.role}</span></p>
            <p>User ID: <span className="text-red-300">{victim.id}</span></p>
            <p>Request header: <code className="text-red-300">Authorization: Bearer {stolenToken.split('=')[1]?.slice(0, 20)}...</code></p>
          </div>
          <Button size="sm" onClick={reset} variant="outline">Reset</Button>
        </div>
      )}

      <div className="space-y-3">
        <div className="rounded border border-border/20 p-3 bg-muted/20 text-xs space-y-1">
          <p className="text-muted-foreground font-medium">Phiên của nạn nhân:</p>
          <p>Email: <span className="text-foreground">{victim.email}</span></p>
          <p>Cookie (non-HttpOnly): <code className="text-yellow-400">client_access_token=eyJ...</code></p>
        </div>

        <Button onClick={stealToken} variant="destructive" size="sm">
          1. Đánh cắp token qua XSS (document.cookie)
        </Button>

        {stolenToken && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Token bị đánh cắp:</Label>
            <Input readOnly value={stolenToken} className="font-mono text-xs text-red-400 bg-red-950/20" />
            <Button onClick={hijack} variant="destructive" size="sm">
              2. Dùng token để mạo danh nạn nhân
            </Button>
          </div>
        )}
      </div>

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable: HttpOnly=false trên session cookie</p>
        <p className="text-green-400 font-semibold mt-1">Fixed: HttpOnly=true, Secure=true, SameSite=Strict</p>
      </div>
    </div>
  );
}
