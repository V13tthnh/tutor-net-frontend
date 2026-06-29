'use client';
// features/security-sandbox/components/test-panels/post-csrf-panel.tsx

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';

export function PostCsrfPanel() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string>('Console initialized...');
  const [consoleStatus, setConsoleStatus] = useState<number | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTimeline((prev) => [...prev, `[${time}] ${msg}`]);
  };

  const fetchTransfers = async () => {
    try {
      const res = await fetch('/api/v1/demo/csrf/transfers');
      const data = await res.json();
      if (res.ok) {
        setTransfers(data.transfers || []);
      }
    } catch (e) {
      console.error('Failed to fetch transfers', e);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleClearTransfers = async () => {
    try {
      await fetch('/api/v1/demo/csrf/transfers', { method: 'DELETE' });
      addLog('Nhật ký chuyển khoản đã được dọn sạch.');
      setTransfers([]);
      setConsoleOutput('Console cleared.');
      setConsoleStatus(null);
      setTimeline([]);
    } catch (e) {}
  };

  // Simulate vulnerable POST request
  const handleVulnerablePost = async () => {
    setLoading(true);
    setConsoleStatus(null);
    setConsoleOutput('Sending POST CSRF Request (Vulnerable)...');
    addLog('Nạn nhân click nút "Nhận Quà" trên trang evil-cooking.com.');
    addLog('JavaScript trên trang của attacker tự động submit một form POST ngầm.');

    try {
      const res = await fetch('/api/v1/demo/csrf/transfer/vulnerable-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'attacker@evil.com', amount: '500000' }),
      });
      const data = await res.json();
      setConsoleStatus(res.status);
      setConsoleOutput(`HTTP/1.1 ${res.status} OK\n${JSON.stringify(data, null, 2)}`);

      if (res.ok) {
        addLog('Giao dịch chuyển 500,000 VND sang attacker@evil.com hoàn tất thành công (CSRF thành công!).');
        fetchTransfers();
      }
    } catch (e) {
      setConsoleOutput('System Error: Không kết nối được server');
    } finally {
      setLoading(false);
    }
  };

  // Simulate safe POST request (without token)
  const handleSafePost = async () => {
    setLoading(true);
    setConsoleStatus(null);
    setConsoleOutput('Sending POST Request (Safe) without CSRF token...');
    addLog('Nạn nhân click nút "Nhận Quà" trên trang evil-cooking.com.');
    addLog('JavaScript tự động submit form POST ngầm trỏ đến API bảo mật...');

    try {
      const res = await fetch('/api/v1/demo/csrf/transfer/safe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: 'attacker@evil.com', 
          amount: '500000',
          csrfToken: 'INVALID_OR_MISSING_TOKEN',
          sessionId: 'tutor_session_123'
        }),
      });
      const data = await res.json();
      setConsoleStatus(res.status);
      setConsoleOutput(`HTTP/1.1 ${res.status} Forbidden\n${JSON.stringify(data, null, 2)}`);

      if (!res.ok) {
        addLog(`Giao dịch thất bại! Server chặn request (Status ${res.status} Forbidden). Lý do: ${data.reason}`);
      }
    } catch (e) {
      setConsoleOutput('System Error: Không kết nối được server');
    } finally {
      setLoading(false);
    }
  };

  // Tính số dư (Mặc định 10,000,000 VND trừ đi các giao dịch)
  const initialBalance = 10000000;
  const totalDeducted = transfers
    .reduce((acc, t) => acc + parseInt(t.amount || '0'), 0);
  const currentBalance = initialBalance - totalDeducted;

  const attackerHtml = `<!-- evil-cooking.com/csrf.html -->
<body onload="document.forms[0].submit()">
  <form action="/api/v1/demo/csrf/transfer/vulnerable-post" method="POST">
    <input type="hidden" name="to" value="attacker@evil.com" />
    <input type="hidden" name="amount" value="500000" />
  </form>
</body>`;

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng POST-based CSRF:</strong> Kẻ tấn công tạo một form HTML ẩn chứa các tham số chuyển khoản và tự động submit bằng JavaScript ngay khi nạn nhân tải trang. Nếu server không xác thực token CSRF, lệnh POST sẽ được thực thi trái phép kèm session cookie.
        </AlertDescription>
      </Alert>

      {/* Split-Screen Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Victim Bank Account (TutorNet Banking) */}
        <div className="lg:col-span-6 flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-md">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/65 border-b border-border select-none">
            <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              TutorNet Banking Dashboard (Victim Browser)
            </span>
            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={handleClearTransfers}>
              Dọn dẹp nhật ký
            </Button>
          </div>

          {/* Account Details */}
          <div className="p-4 bg-muted/20 border-b border-border space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Tài khoản:</span>
              <span className="font-semibold text-foreground">victim@tutornet.com</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Số dư khả dụng:</span>
              <span className="font-mono font-bold text-green-600 dark:text-green-400 text-sm">
                {currentBalance.toLocaleString()} VND
              </span>
            </div>
          </div>

          {/* Transactions History */}
          <div className="flex-1 p-4 min-h-[180px] max-h-[220px] overflow-y-auto">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
              Lịch sử giao dịch chuyển khoản
            </p>
            {transfers.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground italic">
                Chưa có giao dịch chuyển khoản nào được thực hiện.
              </div>
            ) : (
              <div className="space-y-2">
                {transfers.map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 rounded-lg border border-red-500/10 bg-red-500/5 text-[11px] font-mono animate-in slide-in-from-bottom-1 duration-200">
                    <div className="space-y-0.5">
                      <p className="font-bold text-red-600 dark:text-red-400">{t.result || t.type}</p>
                      <p className="text-[9px] text-muted-foreground">Người nhận: {t.to}</p>
                    </div>
                    <span className="font-bold text-red-600">
                      -{parseInt(t.amount).toLocaleString()} VND
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Attacker's Web Site (evil-cooking.com) */}
        <div className="lg:col-span-6 flex flex-col rounded-xl border border-red-500/30 bg-card overflow-hidden shadow-md">
          {/* Header Bar */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/5 border-b border-red-500/20 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              http://evil-gift.com (Attacker Site)
            </span>
          </div>

          {/* Form Source Code Display */}
          <div className="p-3 bg-slate-950 text-slate-300 font-mono text-[9px] border-b border-red-500/10">
            <p className="text-red-400 font-bold mb-1">// Mã nguồn Form tự submit của hacker nhúng trên web:</p>
            <pre className="whitespace-pre overflow-x-auto">{attackerHtml}</pre>
          </div>

          {/* Interactive buttons */}
          <div className="p-4 space-y-2 bg-red-500/[0.02]">
            <p className="text-[10px] text-muted-foreground text-center">Mô phỏng click link nhận quà trên trang của hacker:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleVulnerablePost} disabled={loading} size="sm" variant="destructive" className="h-8 text-xs font-semibold">
                Auto-Submit (Vulnerable)
              </Button>
              <Button onClick={handleSafePost} disabled={loading} size="sm" variant="outline" className="h-8 text-xs font-semibold border-red-500/30 text-red-500 hover:bg-red-500/10">
                Auto-Submit (Safe / Check token)
              </Button>
            </div>
          </div>

          {/* Response Console */}
          <div className="bg-black/80 p-3 font-mono text-[9px] text-slate-300 min-h-[90px] border-t border-red-500/20">
            <p className="text-slate-500 border-b border-slate-900 pb-1 mb-1 font-semibold flex items-center justify-between">
              <span>[Console Output]</span>
              {consoleStatus && (
                <span className={consoleStatus === 200 ? 'text-red-400' : 'text-green-400'}>
                  STATUS: {consoleStatus}
                </span>
              )}
            </p>
            <pre className="whitespace-pre-wrap leading-tight">{consoleOutput}</pre>
          </div>
        </div>
      </div>

      {/* Timeline Logs */}
      {timeline.length > 0 && (
        <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Icons.clock size={14} className="text-primary" /> Timeline Cuộc Tấn Công
          </h4>
          <div className="text-[11px] font-mono space-y-1">
            {timeline.map((log, i) => (
              <p key={i} className={i === timeline.length - 1 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>
                ➤ {log}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Vulnerable vs Fixed comparison */}
      <div className="text-xs bg-muted/50 rounded p-3 font-mono space-y-1">
        <p className="text-red-600 dark:text-red-400 font-semibold">Vulnerable: Không có CSRF token trong form</p>
        <p className="text-green-600 dark:text-green-400 font-semibold mt-2">Fixed:</p>
        <code className="text-muted-foreground block text-[10px]">
          {'<input type="hidden" name="_csrf" value="<server-generated-token>" />'}
        </code>
        <code className="text-muted-foreground block text-[10px] mt-1">
          {'// Server: verify req.body._csrf === session.csrfToken && check Origin Header'}
        </code>
      </div>
    </div>
  );
}
