'use client';
// features/security-sandbox/components/test-panels/session-fixation-panel.tsx

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';

export function SessionFixationPanel() {
  const [fixedSessionId, setFixedSessionId] = useState('fixed_attacker_123');
  const [victimEmail, setVictimEmail] = useState('johnsnow9813@gmail.com');
  const [step, setStep] = useState(0); // 0: Idle, 1: Sent Link, 2: Victim Opened & Logged In, 3: Hijacked
  const [timelineLogs, setTimelineLogs] = useState<string[]>([]);
  
  // Victim browser mock states
  const [browserUrl, setBrowserUrl] = useState('http://localhost:3000/auth/login');
  const [cookieTutorSession, setCookieTutorSession] = useState('');
  const [cookieSess, setCookieSess] = useState('');
  const [victimLoggedIn, setVictimLoggedIn] = useState(false);
  const [victimUser, setVictimUser] = useState<string | null>(null);

  // Attacker console mock states
  const [attackerLogs, setAttackerLogs] = useState<string[]>(['[System] Attacker Console Initialized...']);
  const [apiResponse, setApiResponse] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<number | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTimelineLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  const addConsole = (msg: string) => {
    setAttackerLogs((prev) => [...prev, msg]);
  };

  // Sync cookies with mock browser display
  const updateCookiesDisplay = () => {
    if (typeof window === 'undefined') return;
    const cookies = document.cookie.split(';');
    let ts = '';
    let s = '';
    for (let c of cookies) {
      const [name, val] = c.trim().split('=');
      if (name === 'TUTOR_SESSION') ts = val;
      if (name === 'SESS') s = val;
    }
    setCookieTutorSession(ts);
    setCookieSess(s);
  };

  useEffect(() => {
    updateCookiesDisplay();
  }, [step]);

  // Step 1: Attacker registers session ID and generates link
  const handleStep1 = async () => {
    if (!fixedSessionId.trim()) {
      alert('Vui lòng nhập Session ID!');
      return;
    }
    setApiStatus(null);
    setApiResponse('');
    
    try {
      addConsole(`$ curl -X GET "/api/demo/session/fixation/set?sessId=${fixedSessionId}"`);
      const res = await fetch(`/api/v1/demo/session/fixation/set?sessId=${fixedSessionId}`);
      const data = await res.json();
      
      if (res.ok) {
        setStep(1);
        setBrowserUrl(`http://localhost:3000/auth/login?TUTOR_SESSION=${fixedSessionId}`);
        addLog(`Attacker đăng ký Session ID cố định: "${fixedSessionId}".`);
        addConsole(`HTTP/1.1 200 OK\n${JSON.stringify(data, null, 2)}`);
        updateCookiesDisplay();
      } else {
        addConsole(`HTTP/1.1 ${res.status} Error\nFail to register session ID`);
      }
    } catch (e) {
      addConsole(`System Error: Không kết nối được server`);
    }
  };

  // Step 2: Victim loads page & logs in
  const handleStep2 = async () => {
    setApiStatus(null);
    setApiResponse('');
    
    try {
      addLog(`Nạn nhân click đường dẫn dụ dỗ của kẻ tấn công.`);
      addLog(`Cookie TUTOR_SESSION trên trình duyệt nạn nhân được gán = "${fixedSessionId}".`);
      
      addLog(`Nạn nhân bắt đầu thực hiện đăng nhập bằng tài khoản: ${victimEmail}`);
      addConsole(`$ curl -X POST "/api/demo/session/login/vulnerable" -H "Cookie: TUTOR_SESSION=${fixedSessionId}"`);
      
      const res = await fetch('/api/v1/demo/session/login/vulnerable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: victimEmail }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setStep(2);
        setVictimLoggedIn(true);
        setVictimUser(data.loggedInAs);
        addLog(`Nạn nhân đăng nhập thành công.`);
        
        // Detect safe or vulnerable check in cookie
        setTimeout(() => {
          updateCookiesDisplay();
          // Check if session ID changed (regenerated)
          const tsCookie = document.cookie.split(';').find(c => c.trim().startsWith('TUTOR_SESSION='))?.split('=')[1];
          const sessCookie = document.cookie.split(';').find(c => c.trim().startsWith('SESS='))?.split('=')[1];
          
          if (sessCookie) {
            addLog(`Hệ thống đang ở chế độ SAFE: Session ID tự động đổi thành "${sessCookie}" (Regenerated!).`);
          } else {
            addLog(`Hệ thống ở chế độ VULNERABLE: Session ID vẫn được giữ nguyên là "${tsCookie || fixedSessionId}".`);
          }
        }, 100);

        addConsole(`HTTP/1.1 200 OK\n${JSON.stringify(data, null, 2)}`);
      } else {
        addConsole(`HTTP/1.1 ${res.status} Error\nVictim login failed`);
      }
    } catch (e) {
      addConsole(`System Error: Không kết nối được server`);
    }
  };

  // Step 3: Attacker steals session
  const handleStep3 = async () => {
    setApiStatus(null);
    setApiResponse('');
    
    try {
      addLog(`Attacker gửi request replay session để chiếm quyền.`);
      addConsole(`$ curl -X GET "/api/demo/session/me" -H "X-Session-Id: ${fixedSessionId}"`);
      
      const res = await fetch('/api/v1/demo/session/me', {
        method: 'GET',
        headers: {
          'X-Session-Id': fixedSessionId,
        },
      });
      const data = await res.json();
      setApiStatus(res.status);
      setApiResponse(JSON.stringify(data, null, 2));

      if (res.ok) {
        setStep(3);
        addLog(`Chiếm phiên THÀNH CÔNG! Đăng nhập trái phép dưới danh nghĩa: ${data.email}.`);
        addConsole(`HTTP/1.1 200 OK\n${JSON.stringify(data, null, 2)}`);
      } else {
        setStep(3);
        addLog(`Chiếm phiên THẤT BẠI! Server báo lỗi 401 Unauthorized do session cũ đã bị hủy.`);
        addConsole(`HTTP/1.1 401 Unauthorized\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (e) {
      addConsole(`System Error: Không kết nối được server`);
    }
  };

  const handleReset = async () => {
    try {
      await fetch('/api/v1/demo/session/logout', { method: 'POST' });
    } catch (e) {}
    setStep(0);
    setVictimLoggedIn(false);
    setVictimUser(null);
    setBrowserUrl('http://localhost:3000/auth/login');
    setTimelineLogs([]);
    setAttackerLogs(['[System] Attacker Console Initialized...']);
    setApiResponse('');
    setApiStatus(null);
    setTimeout(updateCookiesDisplay, 200);
  };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng Session Fixation:</strong> Kẻ tấn công thiết lập sẵn một Session ID (`TUTOR_SESSION`) trên server, dụ dỗ nạn nhân dùng session đó để đăng nhập. Nếu server dễ bị lỗi (Vulnerable), Session ID không đổi sau khi xác thực, kẻ tấn công dùng session đó chiếm đoạt tài khoản ngay lập tức.
        </AlertDescription>
      </Alert>

      {/* Split-Screen Simulation Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Victim Browser Mock */}
        <div className="lg:col-span-6 flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-md">
          {/* Browser Header Bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/65 border-b border-border">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
            </div>
            <div className="flex-1 flex items-center gap-1.5 bg-background px-3 py-1 rounded-md border border-border text-[11px] text-muted-foreground font-sans select-none overflow-hidden truncate">
              <Icons.lock size={11} className="text-green-600 shrink-0" />
              <span className="truncate">{browserUrl}</span>
            </div>
            <button className="text-muted-foreground hover:text-foreground shrink-0" onClick={updateCookiesDisplay}>
              <Icons.history size={14} />
            </button>
          </div>

          {/* Browser Display Area */}
          <div className="flex-1 p-6 flex flex-col justify-center min-h-[220px] bg-background/50">
            {victimLoggedIn ? (
              <div className="text-center space-y-3 animate-in fade-in zoom-in duration-300">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center text-green-600 border border-green-500/20">
                  <Icons.check size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Đăng Nhập Thành Công</h4>
                  <p className="text-xs text-muted-foreground mt-1">Gia sư: <span className="font-mono font-semibold text-foreground">{victimUser}</span></p>
                </div>
                <div className="inline-block px-2.5 py-0.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-[10px] rounded font-medium select-none">
                  Trạng thái: Phiên đã đăng nhập
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-sm mx-auto w-full">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold text-foreground">TutorNet Đăng Nhập</h4>
                  <p className="text-[11px] text-muted-foreground">Vui lòng đăng nhập để tiếp tục</p>
                </div>
                <div className="space-y-2 border border-border/80 rounded-lg p-4 bg-background shadow-sm">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Email đăng nhập</Label>
                    <Input readOnly value={victimEmail} className="h-8 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Mật khẩu</Label>
                    <Input readOnly type="password" value="••••••••" className="h-8 text-xs" />
                  </div>
                  <Button disabled={step < 1} onClick={handleStep2} size="sm" className="w-full h-8 text-xs mt-1">
                    {step < 1 ? 'Chờ kẻ tấn công gửi link...' : 'Đăng nhập'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Browser Developer Panel (Cookies Inspector) */}
          <div className="border-t border-border bg-muted/30 p-3 font-mono text-[10px] space-y-1 select-none">
            <div className="flex items-center justify-between text-muted-foreground font-semibold border-b border-border/60 pb-1 mb-1.5">
              <span className="flex items-center gap-1"><Icons.code size={10} /> Cookie Inspector (Dev Panel)</span>
              <span className="text-[9px] px-1 bg-muted border border-border rounded">document.cookie</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span>TUTOR_SESSION (Predictable, no flags):</span>
                <span className={cookieTutorSession ? 'text-red-500 font-bold' : 'text-muted-foreground'}>
                  {cookieTutorSession ? `"${cookieTutorSession}"` : 'undefined'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>SESS (Secure, HttpOnly, SameSite):</span>
                <span className={cookieSess ? 'text-green-500 font-bold' : 'text-muted-foreground'}>
                  {cookieSess ? `"${cookieSess.substring(0, 8)}...[HttpOnly]"` : 'undefined'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Attacker Console Mock */}
        <div className="lg:col-span-6 flex flex-col rounded-xl border border-border bg-slate-950 text-slate-200 font-mono overflow-hidden shadow-md">
          {/* Console Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 select-none">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Attacker Terminal</span>
            <span className="text-[9px]">bash - 80x24</span>
          </div>

          {/* Terminal Controls */}
          <div className="p-4 space-y-4 border-b border-slate-900 bg-slate-950/70">
            {step === 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-slate-400">1. Đặt Session ID cố định:</Label>
                    <Input 
                      value={fixedSessionId} 
                      onChange={(e) => setFixedSessionId(e.target.value)} 
                      className="font-mono text-xs h-8 bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-slate-700" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-slate-400">Email nạn nhân nhắm đến:</Label>
                    <Input 
                      value={victimEmail} 
                      onChange={(e) => setVictimEmail(e.target.value)} 
                      className="font-mono text-xs h-8 bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-slate-700" 
                    />
                  </div>
                </div>
                <Button onClick={handleStep1} variant="destructive" size="sm" className="w-full h-8 text-xs font-semibold">
                  Tạo Session & Copy Link dụ dỗ
                </Button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                <p className="text-[10px] text-slate-400">Dụ dỗ nạn nhân truy cập đường dẫn:</p>
                <div className="flex gap-2 items-center bg-slate-900 p-2 rounded border border-slate-800 text-xs select-all text-amber-500 break-all">
                  {`http://localhost:3000/auth/login?TUTOR_SESSION=${fixedSessionId}`}
                </div>
                <Button onClick={handleStep2} variant="destructive" size="sm" className="w-full h-8 text-xs font-semibold">
                  Mô phỏng Nạn nhân click link & đăng nhập
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                <p className="text-xs text-yellow-500">Nạn nhân đã đăng nhập. Bắt đầu Replay Session ID để chiếm quyền!</p>
                <Button onClick={handleStep3} variant="destructive" size="sm" className="w-full h-8 text-xs font-semibold animate-pulse">
                  Chiếm quyền Session (Reuse session)
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2.5 animate-in zoom-in-95 duration-200">
                {apiStatus === 200 ? (
                  <div className="p-3 bg-red-950/40 border border-red-900/60 rounded text-red-400 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" /> CHIẾM PHIÊN THÀNH CÔNG (Compromised!)</p>
                    <p>Attacker hiện đã đăng nhập trái phép mà không cần mật khẩu dưới tên nạn nhân!</p>
                  </div>
                ) : (
                  <div className="p-3 bg-green-950/40 border border-green-900/60 rounded text-green-400 text-xs space-y-1">
                    <p className="font-bold">✓ PHÒNG THỦ THÀNH CÔNG (Safe)</p>
                    <p>Server đã đổi Session ID mới cho nạn nhân ngay khi đăng nhập. Token cũ của kẻ tấn công bị vô hiệu hóa (401 Unauthorized).</p>
                  </div>
                )}
                <Button onClick={handleReset} variant="outline" size="sm" className="w-full h-8 text-xs font-semibold border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-slate-100">
                  Reset Demo
                </Button>
              </div>
            )}
          </div>

          {/* Terminal Console Logs */}
          <div className="flex-1 p-3 overflow-y-auto max-h-[170px] min-h-[120px] text-[10px] space-y-1 bg-black/55 select-text">
            {attackerLogs.map((logStr, i) => (
              <pre key={i} className="whitespace-pre-wrap leading-normal text-slate-300 font-mono">
                {logStr}
              </pre>
            ))}
          </div>
        </div>
      </div>

      {/* TIMELINE LOGGER (Mô tả quy trình tấn công theo thời gian thực) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 flex flex-col rounded-xl border border-border p-4 bg-muted/20">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2.5">
            <Icons.clock size={14} className="text-primary" /> Timeline hoạt động thời gian thực (Test Flow)
          </h4>
          <div className="text-[11px] font-mono space-y-1.5 max-h-[120px] overflow-y-auto">
            {timelineLogs.length === 0 ? (
              <p className="text-muted-foreground italic select-none">Chưa có hoạt động nào. Hãy thực hiện theo các nút lệnh trên Terminal của Attacker...</p>
            ) : (
              timelineLogs.map((logLine, idx) => (
                <div key={idx} className="flex gap-2 leading-relaxed animate-in slide-in-from-bottom-1 duration-200">
                  <span className="text-primary shrink-0 select-none">➤</span>
                  <span className="text-foreground">{logLine}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col justify-center p-4 bg-muted/40 rounded-xl border border-border text-xs font-mono space-y-1">
          <p className="text-red-600 dark:text-red-400 font-semibold">Vulnerable: không tạo session ID mới sau khi đăng nhập</p>
          <p className="text-green-600 dark:text-green-400 font-semibold mt-1">Fixed: regenerateSession() sau authentication thành công</p>
        </div>
      </div>
    </div>
  );
}
