'use client';
// features/security-sandbox/components/test-panels/post-csrf-panel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function PostCsrfPanel() {
  const [step, setStep] = useState(0);

  const attackerHtml = `<html>
  <body onload="document.forms[0].submit()">
    <form action="http://localhost:3000/api/user/update"
          method="POST">
      <input name="email" value="hacked@evil.com" />
      <input name="role"  value="ADMIN" />
    </form>
  </body>
</html>`;

  const steps = [
    {
      title: '① Nạn nhân đăng nhập tutornet.vn',
      detail: 'Session cookie được set. Browser sẽ tự gửi kèm cookie với mọi request.',
      color: 'text-blue-400',
    },
    {
      title: '② Attacker gửi link evil.com/csrf.html',
      detail: 'Trang này chứa form tự submit sang tutornet.vn qua JS: document.forms[0].submit()',
      color: 'text-yellow-400',
    },
    {
      title: '③ Trình duyệt tự submit form (kèm cookie)',
      detail: 'POST /api/user/update với email=hacked@evil.com, role=ADMIN. Browser gửi session cookie tự động.',
      color: 'text-orange-400',
    },
    {
      title: '④ 🔴 Server chấp nhận — tài khoản bị chiếm!',
      detail: 'Không có CSRF token → server không phân biệt được request từ trang hợp lệ hay trang của attacker.',
      color: 'text-red-400',
    },
  ];

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const reset = () => setStep(0);

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Form HTML tự động submit từ trang attacker sang server nạn nhân.
          Trình duyệt gửi kèm session cookie → server nghĩ request đến từ người dùng hợp lệ.
        </AlertDescription>
      </Alert>

      <div className="rounded border border-border/30 bg-muted/10 p-3">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Trang của attacker (evil.com/csrf.html):</p>
        <pre className="text-xs font-mono text-orange-300 overflow-x-auto whitespace-pre-wrap break-all">
          {attackerHtml}
        </pre>
      </div>

      <div className="space-y-2">
        {steps.slice(0, step + 1).map((s, i) => (
          <div
            key={i}
            className={`rounded border p-3 text-xs space-y-1 transition-all ${i === step
                ? 'border-red-500/40 bg-red-950/20'
                : 'border-border/20 bg-muted/10'
              }`}
          >
            <p className={`font-semibold ${s.color}`}>{s.title}</p>
            <p className="text-muted-foreground">{s.detail}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {step < steps.length - 1 ? (
          <Button size="sm" onClick={next} variant="destructive">
            Bước tiếp theo →
          </Button>
        ) : (
          <Button size="sm" onClick={reset} variant="outline">
            Xem lại từ đầu
          </Button>
        )}
      </div>

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable: Không có CSRF token trong form</p>
        <p className="text-green-400 font-semibold mt-2">Fixed:</p>
        <code className="text-muted-foreground block">
          {'<input type="hidden" name="_csrf" value="<server-generated-token>" />'}
        </code>
        <code className="text-muted-foreground block mt-1">
          {'// Server: verify req.body._csrf === session.csrfToken'}
        </code>
      </div>
    </div>
  );
}
