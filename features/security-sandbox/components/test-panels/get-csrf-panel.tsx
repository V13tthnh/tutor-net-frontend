'use client';
// features/security-sandbox/components/test-panels/get-csrf-panel.tsx

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';

export function GetCsrfPanel() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [victimVisited, setVictimVisited] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

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
      addLog('Nhật ký đã được dọn sạch.');
      setTransfers([]);
      setVictimVisited(false);
      setImageSrc(null);
      setTimeline([]);
    } catch (e) { }
  };

  const handleSimulate = () => {
    setVictimVisited(true);
    addLog('Nạn nhân click vào bài viết làm bánh flan trên trang evil-cooking.com.');
    addLog('Trình duyệt nạp bài báo, thấy thẻ <img> ẩn có src trỏ sang TutorNet.');
    
    // Tạo link GET CSRF đổi tên trỏ thẳng sang backend
    const attackUrl = `/api/v1/demo/csrf/profile/vulnerable-update-name?fullName=Hacker%20Bi%20An&t=${Date.now()}`;
    setImageSrc(attackUrl);
  };

  const handleImageLoadOrError = () => {
    addLog('Trình duyệt tự động gửi kèm Cookie phiên của nạn nhân và thực hiện GET request.');
    addLog('Họ tên hiển thị của nạn nhân đã bị thay đổi thành "Hacker Bi An" (CSRF!).');
    fetchTransfers();
  };

  // Lấy họ tên hiện tại từ log cuối cùng
  const nameLogs = transfers.filter(t => t.type === 'GET-CSRF-NAME');
  const currentName = nameLogs.length > 0 
    ? nameLogs[nameLogs.length - 1].result.replace('✅ DISPLAY NAME UPDATED TO: ', '') 
    : 'thành đinh';

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng GET-based CSRF:</strong> Kẻ tấn công tạo một trang web độc hại và nhúng thẻ <code>{'<img>'}</code> ẩn có nguồn trỏ tới liên kết thay đổi thông tin. Khi nạn nhân đã đăng nhập và vô tình xem trang web này, trình duyệt sẽ tự động gửi request kèm cookie để thực thi lệnh đổi thông tin trái phép.
        </AlertDescription>
      </Alert>

      {/* Split-Screen Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Victim Account Dashboard (TutorNet Profile) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-md">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/65 border-b border-border select-none">
            <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              TutorNet Profile Dashboard (Victim Browser)
            </span>
            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={handleClearTransfers}>
              Dọn dẹp nhật ký
            </Button>
          </div>

          {/* Account Details */}
          <div className="p-4 bg-muted/20 border-b border-border space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Email tài khoản:</span>
              <span className="font-semibold text-foreground">johnsnow9813@gmail.com</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Họ tên hiển thị:</span>
              <span className="font-bold text-sm text-foreground">
                {currentName}
              </span>
            </div>
          </div>

          {/* Profile Updates History */}
          <div className="flex-1 p-4 min-h-[160px] max-h-[220px] overflow-y-auto">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
              Nhật ký thay đổi thông tin tài khoản
            </p>
            {nameLogs.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground italic">
                Chưa có lịch sử thay đổi thông tin nào.
              </div>
            ) : (
              <div className="space-y-2">
                {nameLogs.map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 rounded-lg border border-red-500/10 bg-red-500/5 text-[11px] font-mono animate-in slide-in-from-bottom-1 duration-200">
                    <div className="space-y-0.5">
                      <p className="font-bold text-red-600 dark:text-red-400">{t.result}</p>
                      <p className="text-[9px] text-muted-foreground">Thời gian: {t.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Attacker's Web Site (evil-cooking.com) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-red-500/30 bg-card overflow-hidden shadow-md">
          {/* Header Bar */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/5 border-b border-red-500/20 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              http://evil-cooking.com (Attacker Site)
            </span>
          </div>

          {/* Cooking Blog Content */}
          <div className="flex-1 p-4 flex flex-col justify-center text-center space-y-3 bg-red-500/[0.02] min-h-[160px]">
            <div className="mx-auto w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
              <Icons.pizza size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Blog Ẩm Thực: Cách Làm Bánh Flan</h4>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                Công thức gia truyền giúp bánh flan mềm mịn, không bị rỗ. Click xem ngay!
              </p>
            </div>

            <Button onClick={handleSimulate} size="sm" variant="destructive" className="h-8 text-xs font-semibold w-full">
              Lừa nạn nhân truy cập trang bài viết
            </Button>

            {/* Hidden Image tag loaded dynamically */}
            {imageSrc && (
              <img
                src={imageSrc}
                alt="hidden csrf payload"
                style={{ display: 'none' }}
                onLoad={handleImageLoadOrError}
                onError={handleImageLoadOrError}
              />
            )}
          </div>

          {/* Attacker payload display */}
          {victimVisited && (
            <div className="border-t border-red-500/20 bg-red-500/5 p-3 text-[10px] font-mono space-y-1 select-none animate-in fade-in duration-300">
              <p className="text-red-600 dark:text-red-400 font-bold">Payload HTML ẩn:</p>
              <code className="text-muted-foreground block bg-background p-1.5 rounded border border-border overflow-x-auto whitespace-nowrap">
                {`<iframe src="/api/v1/demo/csrf/profile/vulnerable-update-name?fullName=..." width="0" height="0" style="display:none"></iframe>`}
              </code>
            </div>
          )}
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
        <p className="text-red-600 dark:text-red-400 font-semibold">Vulnerable: GET request thực hiện state-changing action</p>
        <code className="text-muted-foreground block text-[10px]">GET /api/v1/demo/csrf/profile/vulnerable-update-name?fullName=Hacker%20Bi%20An</code>
        <p className="text-green-600 dark:text-green-400 font-semibold mt-2">Fixed: Dùng POST + CSRF token</p>
        <code className="text-muted-foreground block text-[10px]">
          {'POST /api/v1/users/profile\nHeader -> X-CSRF-Token: <random-token>'}
        </code>
      </div>
    </div>
  );
}
