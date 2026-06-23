'use client';
// features/security-sandbox/components/test-panels/session-fixation-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SessionFixationPanel() {
  const [fixedSessionId, setFixedSessionId] = useState('ATTACKER_SESSION_12345');
  const [step, setStep] = useState(0);
  const [victimLoggedIn, setVictimLoggedIn] = useState(false);

  const step1 = () => setStep(1);
  const step2 = () => { setStep(2); setVictimLoggedIn(true); };
  const step3 = () => setStep(3);
  const reset = () => { setStep(0); setVictimLoggedIn(false); };

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Server chấp nhận Session ID từ URL param. Kẻ tấn công gửi link cho nạn nhân, sau khi nạn nhân đăng nhập, kẻ tấn công dùng cùng Session ID đó để truy cập.
        </AlertDescription>
      </Alert>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Session ID do kẻ tấn công tạo ra</Label>
        <Input value={fixedSessionId} onChange={(e) => setFixedSessionId(e.target.value)} className="font-mono text-xs" disabled={step > 0} />
      </div>

      <div className="space-y-3">
        {/* Step 1 */}
        <div className={`rounded border p-3 space-y-2 ${step >= 1 ? 'border-yellow-500/40 bg-yellow-950/20' : 'border-border/20'}`}>
          <p className="text-xs font-medium">Bước 1: Kẻ tấn công gửi link với Session ID cố định</p>
          {step >= 1 && (
            <code className="text-xs text-yellow-300 block bg-muted/20 p-2 rounded">
              {`https://tutornet.vn/auth/sign-in?sessionId=${fixedSessionId}`}
            </code>
          )}
          {step === 0 && <Button onClick={step1} size="sm" variant="destructive">Tạo link độc</Button>}
        </div>

        {/* Step 2 */}
        {step >= 1 && (
          <div className={`rounded border p-3 space-y-2 ${step >= 2 ? 'border-orange-500/40 bg-orange-950/20' : 'border-border/20'}`}>
            <p className="text-xs font-medium">Bước 2: Nạn nhân click link, đăng nhập với session ID bị fixate</p>
            {step === 1 && <Button onClick={step2} size="sm" variant="outline">Mô phỏng nạn nhân đăng nhập</Button>}
            {step >= 2 && <p className="text-xs text-orange-300">✓ Nạn nhân đăng nhập thành công. Session ID vẫn là: <code className="font-mono">{fixedSessionId}</code></p>}
          </div>
        )}

        {/* Step 3 */}
        {step >= 2 && (
          <div className={`rounded border p-3 space-y-2 ${step >= 3 ? 'border-red-500/40 bg-red-950/30' : 'border-border/20'}`}>
            <p className="text-xs font-medium">Bước 3: Kẻ tấn công dùng cùng Session ID để truy cập tài khoản nạn nhân</p>
            {step === 2 && <Button onClick={step3} size="sm" variant="destructive">Chiếm session</Button>}
            {step >= 3 && (
              <div className="text-xs text-red-300 space-y-1">
                <p><strong>Session bị chiếm thành công!</strong></p>
                <p>Cookie: <code className="font-mono">sessionId={fixedSessionId}</code></p>
                <p>Kẻ tấn công truy cập tài khoản nạn nhân mà không cần mật khẩu</p>
              </div>
            )}
          </div>
        )}

        {step >= 3 && <Button onClick={reset} size="sm" variant="outline">Reset demo</Button>}
      </div>

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable: không tạo session ID mới sau khi đăng nhập</p>
        <p className="text-green-400 font-semibold mt-1">Fixed: regenerateSession() sau authentication thành công</p>
      </div>
    </div>
  );
}
