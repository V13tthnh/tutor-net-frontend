'use client';
// features/security-sandbox/components/test-panels/get-csrf-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function GetCsrfPanel() {
  const [targetUrl, setTargetUrl] = useState('http://localhost:3000/api/user/delete?id=5');
  const [triggered, setTriggered] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const simulate = () => {
    setLogs([]);
    const steps = [
      'Nạn nhân đang đăng nhập vào tutornet.vn (có cookie session)',
      'Attacker gửi email chứa: <img src="' + targetUrl + '">',
      'Trình duyệt tự động gửi GET request đến URL trên (kèm cookie)',
      'Server thực thi hành động — xóa user #5 thành công',
      'CSRF thành công — nạn nhân không hay biết gì!',
    ];
    steps.forEach((step, i) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, step]);
        if (i === steps.length - 1) setTriggered(true);
      }, i * 600);
    });
  };

  const reset = () => {
    setTriggered(false);
    setLogs([]);
  };

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Hành động thay đổi dữ liệu được thực hiện qua GET request.
          Chỉ cần nhúng <code>{'<img src="URL">'}  </code> vào trang khác là trình duyệt
          tự gửi request kèm cookie — không cần tương tác người dùng.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Endpoint bị tấn công (GET)</Label>
        <Input
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          className="font-mono text-xs"
          placeholder="https://example.com/api/action?id=5"
        />
      </div>

      <div className="rounded border border-muted/30 bg-muted/10 p-3 text-xs">
        <p className="text-muted-foreground mb-2 font-medium">Payload của attacker (HTML):</p>
        <code className="text-orange-400 block break-all">
          {`<img src="${targetUrl}" width="0" height="0" />`}
        </code>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={simulate} variant="destructive">
          Mô phỏng tấn công
        </Button>
        <Button size="sm" onClick={reset} variant="outline">
          Reset
        </Button>
      </div>

      {logs.length > 0 && (
        <div className="rounded border border-border/20 bg-muted/20 p-3 space-y-1.5">
          {logs.map((log, i) => (
            <p key={i} className={`text-xs ${i === logs.length - 1 && triggered ? 'text-red-400 font-semibold' : 'text-muted-foreground'}`}>
              {log}
            </p>
          ))}
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable: GET request thực hiện state-changing action</p>
        <code className="text-muted-foreground block">GET /api/user/delete?id=5 HTTP/1.1</code>
        <p className="text-green-400 font-semibold mt-2">Fixed: Dùng POST + CSRF token</p>
        <code className="text-muted-foreground block">
          {'POST /api/user/delete\nX-CSRF-Token: <random-token>'}
        </code>
      </div>
    </div>
  );
}
