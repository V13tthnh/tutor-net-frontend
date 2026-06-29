'use client';
// features/security-sandbox/components/test-panels/session-hijacking-panel.tsx

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';

export function SessionHijackingPanel() {
  const [email, setEmail] = useState('johnsnow9813@gmail.com');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [stolenToken, setStolenToken] = useState('');
  const [stolenCookieName, setStolenCookieName] = useState('');
  const [impersonating, setImpersonating] = useState(false);
  const [impersonateResult, setImpersonateResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [timelineLogs, setTimelineLogs] = useState<string[]>([]);

  // Victim browser mock states
  const [cookieTutorSession, setCookieTutorSession] = useState('');
  const [cookieSess, setCookieSess] = useState('');

  // Attacker console mock states
  const [attackerLogs, setAttackerLogs] = useState<string[]>(['[System] Attacker Console Initialized...']);
  const [showMonitor, setShowMonitor] = useState(false);

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
  }, [sessionInfo]);

  const loginVulnerable = async () => {
    setErrorMsg('');
    setSessionInfo(null);
    setStolenToken('');
    setStolenCookieName('');
    setImpersonating(false);
    setImpersonateResult(null);
    setShowMonitor(false);

    try {
      addConsole(`$ curl -X POST "/api/demo/session/login/vulnerable" -d "email=${email}"`);
      const res = await fetch('/api/v1/demo/session/login/vulnerable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionInfo(data);
        addLog(`Victim đăng nhập chế độ Vulnerable. Cookie TUTOR_SESSION (không HttpOnly) được cấp.`);
        addConsole(`HTTP/1.1 200 OK\n${JSON.stringify(data, null, 2)}`);
      } else {
        setErrorMsg(data.error || 'Đăng nhập vulnerable thất bại');
      }
    } catch (e) {
      setErrorMsg('Không kết nối được server');
    }
  };

  const loginSafe = async () => {
    setErrorMsg('');
    setSessionInfo(null);
    setStolenToken('');
    setStolenCookieName('');
    setImpersonating(false);
    setImpersonateResult(null);
    setShowMonitor(false);

    try {
      addConsole(`$ curl -X POST "/api/demo/session/login/safe" -d "email=${email}"`);
      const res = await fetch('/api/v1/demo/session/login/safe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionInfo(data);
        addLog(`Victim đăng nhập chế độ Safe. Cookie SESS (có HttpOnly) được cấp.`);
        addConsole(`HTTP/1.1 200 OK\n${JSON.stringify(data, null, 2)}`);
      } else {
        setErrorMsg(data.error || 'Đăng nhập safe thất bại');
      }
    } catch (e) {
      setErrorMsg('Không kết nối được server');
    }
  };

  const triggerXssSteal = () => {
    addLog(`Attacker kích hoạt payload XSS trên trình duyệt nạn nhân để đọc document.cookie...`);
    
    const cookies = document.cookie.split(';');
    let foundToken = '';
    let foundName = '';

    for (let c of cookies) {
      const [name, val] = c.trim().split('=');
      if (name === 'TUTOR_SESSION') {
        foundToken = val;
        foundName = name;
        break;
      }
      if (name === 'SESS') {
        foundToken = val;
        foundName = name;
        break;
      }
    }

    if (foundToken && foundName === 'TUTOR_SESSION') {
      setStolenToken(foundToken);
      setStolenCookieName(foundName);
      addLog(`XSS thành công! Đã lấy được cookie "${foundName}=${foundToken}".`);
      addConsole(`[XSS Intercepted] Cookie stolen: ${foundName}=${foundToken}`);
    } else {
      setStolenToken('');
      setStolenCookieName('');
      addLog(`XSS thất bại! Không đọc được cookie nào từ document.cookie (Cờ HttpOnly đã bảo vệ cookie!).`);
      addConsole(`[XSS Failed] document.cookie returned empty.`);
      alert('Không tìm thấy cookie nào hoặc cookie SESS là HttpOnly nên Javascript không thể đọc trộm!');
    }
  };

  const hijack = async () => {
    if (!stolenToken) return;
    setImpersonating(true);
    setImpersonateResult(null);

    try {
      addConsole(`$ curl -X GET "/api/demo/session/me" -H "X-Session-Id: ${stolenToken}"`);
      const res = await fetch('/api/v1/demo/session/me', {
        method: 'GET',
        headers: {
          'X-Session-Id': stolenToken,
        },
      });
      const data = await res.json();
      setImpersonateResult(data);
      setShowMonitor(true);

      if (res.ok) {
        addLog(`Attacker Replay Token thành công. Chiếm tài khoản dưới danh nghĩa ${data.email}.`);
        addConsole(`HTTP/1.1 200 OK\n${JSON.stringify(data, null, 2)}`);
      } else {
        addLog(`Attacker Replay Token thất bại (401 Unauthorized).`);
        addConsole(`HTTP/1.1 401 Unauthorized\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (e) {
      setImpersonateResult({ error: 'Mạo danh thất bại' });
    }
  };

  const reset = async () => {
    try {
      await fetch('/api/v1/demo/session/logout', { method: 'POST' });
    } catch (e) {}
    setSessionInfo(null);
    setStolenToken('');
    setStolenCookieName('');
    setImpersonating(false);
    setImpersonateResult(null);
    setShowMonitor(false);
    setErrorMsg('');
    setTimelineLogs([]);
    setAttackerLogs(['[System] Attacker Console Initialized...']);
    setTimeout(updateCookiesDisplay, 200);
  };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng Session Hijacking (Đánh cắp phiên):</strong> Cookie phiên không có cờ `HttpOnly` sẽ bị mã JavaScript (XSS) đọc trộm thông qua `document.cookie`. Kẻ tấn công trích xuất token này, gửi request mạo danh từ một IP/thiết bị khác để vượt qua lớp xác thực.
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
              <span className="truncate">http://localhost:3000/dashboard</span>
            </div>
            <button className="text-muted-foreground hover:text-foreground shrink-0" onClick={updateCookiesDisplay}>
              <Icons.history size={14} />
            </button>
          </div>

          {/* Browser Display Area */}
          <div className="flex-1 p-6 flex flex-col justify-center min-h-[220px] bg-background/50">
            {sessionInfo ? (
              <div className="space-y-4 max-w-sm mx-auto w-full text-center animate-in fade-in zoom-in duration-300">
                <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Icons.user size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Chào mừng quay lại, Thanh!</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Tài khoản: <span className="font-mono text-foreground font-medium">{sessionInfo.loggedInAs}</span></p>
                </div>
                
                {/* Vulnerable point button for XSS */}
                <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/25 space-y-2">
                  <p className="text-[10px] text-red-500 leading-normal">
                    Trang này dính lỗi XSS và cho phép chạy mã script lạ. Thử gọi <code>document.cookie</code>!
                  </p>
                  <Button onClick={triggerXssSteal} size="sm" variant="destructive" className="h-8 text-xs font-semibold w-full">
                    Kích hoạt lỗi XSS (Đánh cắp Cookie)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-sm mx-auto w-full">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold text-foreground">Phiên nạn nhân (Victim Profile)</h4>
                  <p className="text-[11px] text-muted-foreground">Vui lòng đăng nhập ở cột Attacker để kích hoạt phiên</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={loginVulnerable} size="sm" variant="destructive" className="flex-1 text-xs h-9">
                    Login Vulnerable
                  </Button>
                  <Button onClick={loginSafe} size="sm" variant="outline" className="flex-1 text-xs h-9">
                    Login Safe
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
            {stolenToken ? (
              <div className="space-y-3 animate-in slide-in-from-top-1 duration-200">
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-400">Cookie Đánh Cắp Được:</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={`${stolenCookieName}=${stolenToken}`} className="font-mono text-xs h-8 bg-slate-900 border-slate-800 text-red-400" />
                  </div>
                </div>
                <Button onClick={hijack} variant="destructive" size="sm" className="w-full h-8 text-xs font-semibold animate-pulse">
                  Replay Request (Gửi API mạo danh)
                </Button>
              </div>
            ) : (
              <div className="p-2 border border-slate-850 rounded bg-slate-900/50 text-center text-xs text-slate-400 select-none py-6">
                Chờ nạn nhân kích hoạt XSS để nhận cookie...
              </div>
            )}

            {impersonating && impersonateResult && (
              <div className="space-y-2 animate-in zoom-in-95 duration-200">
                {!impersonateResult.error ? (
                  <div className="p-3 bg-red-950/40 border border-red-900/60 rounded text-red-400 text-xs space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                      ACCOUNT COMPROMISED (Status 200 OK)
                    </p>
                    <p>Chào mừng Thanh! Bạn đã truy cập được tài khoản của nạn nhân mà không cần password.</p>
                  </div>
                ) : (
                  <div className="p-3 bg-green-950/40 border border-green-900/60 rounded text-green-400 text-xs space-y-1">
                    <p className="font-bold">✓ ATTACK BLOCKED (Status 401)</p>
                    <p>Token không tồn tại hoặc đã hết hạn.</p>
                  </div>
                )}
                <Button onClick={reset} variant="outline" size="sm" className="w-full h-8 text-xs font-semibold border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-slate-100">
                  Reset Demo
                </Button>
              </div>
            )}
          </div>

          {/* Session Monitor Dashboard inside Terminal */}
          {showMonitor && impersonateResult && !impersonateResult.error && (
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-850 text-[10px] space-y-2 select-none animate-in fade-in duration-300">
              <div className="text-red-400 font-bold border-b border-red-900/50 pb-1 flex items-center justify-between">
                <span>[Session Monitor Dashboard]</span>
                <span className="animate-pulse bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded text-[8px]">⚠ HIJACKING SUSPECTED</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <p className="text-slate-500">User Email:</p>
                  <p className="font-semibold">{impersonateResult.email}</p>
                </div>
                <div>
                  <p className="text-slate-500">Session ID:</p>
                  <p className="font-mono text-red-400">{impersonateResult.sessionId}</p>
                </div>
                <div>
                  <p className="text-slate-500">Victim Location:</p>
                  <p>192.168.1.100 (Chrome / Win)</p>
                </div>
                <div>
                  <p className="text-red-400 font-bold">Attacker Location:</p>
                  <p className="text-red-400 font-bold">192.168.1.155 (Firefox / OS)</p>
                </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/25 p-2 rounded text-red-400 text-[9px] leading-normal font-sans">
                <strong>Hệ thống cảnh báo:</strong> Phát hiện 2 thiết bị khác địa chỉ IP sử dụng cùng một Session ID trong cùng thời điểm. Yêu cầu khóa khẩn cấp!
              </div>
            </div>
          )}

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
              <p className="text-muted-foreground italic select-none">Chưa có hoạt động nào. Hãy thực hiện theo các nút lệnh để kiểm thử...</p>
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
          <p className="text-red-600 dark:text-red-400 font-semibold">Vulnerable: HttpOnly=false trên session cookie</p>
          <p className="text-green-600 dark:text-green-400 font-semibold mt-1">Fixed: HttpOnly=true, Secure=true, SameSite=Strict</p>
        </div>
      </div>
    </div>
  );
}
