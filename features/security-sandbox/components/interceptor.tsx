'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { SecurityFlag } from '@/features/security-sandbox/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Helper to decode signed cookie client-side
export function getClientSecurityFlags(): SecurityFlag[] {
  if (typeof document === 'undefined') return [];
  const match = document.cookie.match(new RegExp('(^| )security_sandbox=([^;]+)'));
  if (!match) return [];
  const val = match[2];
  const lastDot = val.lastIndexOf('.');
  const payload = lastDot === -1 ? val : val.slice(0, lastDot);
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed as SecurityFlag[];
  } catch (e) {
    console.error('Failed to decode security flags on client', e);
  }
  return [];
}

export function SecuritySandboxInterceptor() {
  const pathname = usePathname();
  const router = useRouter();
  const [flags, setFlags] = useState<SecurityFlag[]>([]);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  
  // Vulnerability Alert State
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertType, setAlertType] = useState<'xss' | 'html' | 'sqli' | 'auth'>('xss');
  const [alertPayload, setAlertPayload] = useState('');
  const [vulnCode, setVulnCode] = useState('');
  const [fixedCode, setFixedCode] = useState('');

  // Fetch flags on mount and route changes
  useEffect(() => {
    setFlags(getClientSecurityFlags());
  }, [pathname]);

  // Periodically check cookies to detect instant toggles in admin
  useEffect(() => {
    const interval = setInterval(() => {
      const currentFlags = getClientSecurityFlags();
      if (JSON.stringify(currentFlags) !== JSON.stringify(flags)) {
        setFlags(currentFlags);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [flags]);

  // Handle Stored XSS Simulation on mount/flags change
  useEffect(() => {
    if (flags.includes('stored_xss')) {
      const stored = localStorage.getItem('stored_xss_payload');
      if (stored) {
        // Execute stored payload
        setAlertType('xss');
        setAlertTitle('Stored XSS (Cross-Site Scripting) Triggered!');
        setAlertPayload(stored);
        setVulnCode(`// Vulnerable Server-side:
<div>{renderUnsanitized(db.getUserComment())}</div>
// React equivalent:
<div dangerouslySetInnerHTML={{ __html: storedPayload }} />`);
        setFixedCode(`// Fixed Code using DOMPurify:
import DOMPurify from 'dompurify';
<div>{DOMPurify.sanitize(storedPayload)}</div>`);
        setAlertOpen(true);
        
        // Execute the script
        try {
          const scriptContent = extractScriptContent(stored);
          if (scriptContent) {
            new Function(scriptContent)();
          } else {
            // Default alert if simple text
            alert(`Stored XSS Executed: ${stored}`);
          }
        } catch (e) {
          console.error('Stored XSS execution failed', e);
        }

        // Clean up to prevent infinite loops on page reloads
        localStorage.removeItem('stored_xss_payload');
      }
    }
  }, [flags]);

  // Handle Reflected XSS from URL parameters on page load/change
  useEffect(() => {
    if (flags.includes('reflected_xss') && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      let foundPayload = '';
      params.forEach((val) => {
        if (/<script>|onerror=|onload=/gi.test(val)) {
          foundPayload = val;
        }
      });

      if (foundPayload) {
        setAlertType('xss');
        setAlertTitle('Reflected XSS (Cross-Site Scripting) Triggered!');
        setAlertPayload(foundPayload);
        setVulnCode(`// Vulnerable Code (Reflecting URL parameters without encoding):
const query = new URLSearchParams(window.location.search).get('q');
document.getElementById('search-result').innerHTML = query;`);
        setFixedCode(`// Fixed Code (Escape HTML output or use textContent):
const query = new URLSearchParams(window.location.search).get('q');
document.getElementById('search-result').textContent = query;`);
        setAlertOpen(true);

        try {
          const scriptContent = extractScriptContent(foundPayload);
          if (scriptContent) {
            new Function(scriptContent)();
          } else {
            alert(`Reflected XSS: ${foundPayload}`);
          }
        } catch (e) {
          console.error('Reflected XSS execution failed', e);
        }
      }
    }
  }, [flags, pathname]);

  // Handle DOM XSS on hashchange
  useEffect(() => {
    if (!flags.includes('dom_xss')) return;

    const handleHashChange = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash && (/<script>|onerror=|onload=|<[a-z]/gi.test(hash))) {
        setAlertType('xss');
        setAlertTitle('DOM-based XSS (Cross-Site Scripting) Triggered!');
        setAlertPayload(hash);
        setVulnCode(`// Vulnerable DOM Sink:
const hash = window.location.hash.slice(1);
document.getElementById('output').innerHTML = hash;`);
        setFixedCode(`// Fixed DOM Sink:
const hash = window.location.hash.slice(1);
document.getElementById('output').textContent = decodeURIComponent(hash);`);
        setAlertOpen(true);

        try {
          const scriptContent = extractScriptContent(hash);
          if (scriptContent) {
            new Function(scriptContent)();
          } else {
            alert(`DOM XSS: ${hash}`);
          }
        } catch (e) {
          console.error('DOM XSS execution failed', e);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Trigger initially if hash exists
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [flags]);

  // Helper to extract script content from string
  const extractScriptContent = (str: string): string => {
    const scriptMatch = str.match(/<script>([\s\S]*?)<\/script>/i);
    if (scriptMatch && scriptMatch[1]) {
      return scriptMatch[1];
    }
    const onerrorMatch = str.match(/onerror=["']([\s\S]*?)["']/i);
    if (onerrorMatch && onerrorMatch[1]) {
      return onerrorMatch[1];
    }
    return '';
  };

  // Global Input Interception for forms and keystrokes
  useEffect(() => {
    if (flags.length === 0) return;

    const handleInputCheck = (val: string, targetEl: HTMLInputElement | HTMLTextAreaElement) => {
      // 1. Check HTML Injection
      if (flags.includes('html_injection') && /<[a-z][\s\S]*>/i.test(val) && !/<script>|onerror=/i.test(val)) {
        setAlertType('html');
        setAlertTitle('HTML Injection Vulnerability Triggered!');
        setAlertPayload(val);
        setVulnCode(`// Vulnerable React Code:
<div dangerouslySetInnerHTML={{ __html: userInput }} />`);
        setFixedCode(`// Fixed React Code:
<div>{userInput}</div>`);
        setAlertOpen(true);
      }

      // 2. Check XSS (Reflected or Stored)
      if (/<script>|onerror=|onload=/gi.test(val)) {
        if (flags.includes('stored_xss')) {
          localStorage.setItem('stored_xss_payload', val);
          setAlertType('xss');
          setAlertTitle('Stored XSS Payload Captured!');
          setAlertPayload(val);
          setVulnCode(`// Stored XSS: Payload saved in database (localStorage).
// Will execute upon reloading or navigating to other pages.`);
          setFixedCode(`// Fix: Sanitize content before rendering in output views.`);
          setAlertOpen(true);
        } else if (flags.includes('reflected_xss')) {
          setAlertType('xss');
          setAlertTitle('Reflected XSS Input Triggered!');
          setAlertPayload(val);
          setVulnCode(`// Reflected XSS: Input immediately executed in client context.`);
          setFixedCode(`// Fix: Always sanitize or escape user inputs before rendering.`);
          setAlertOpen(true);
          try {
            const script = extractScriptContent(val);
            if (script) new Function(script)();
            else alert(`XSS Executed: ${val}`);
          } catch {}
        }
      }

      // 3. Check SQL Injection (UNION search payload simulation)
      if (flags.includes('union_sqli') && (/'\s*union\s+select/i.test(val) || /or\s+1\s*=\s*1/i.test(val))) {
        setAlertType('sqli');
        setAlertTitle('UNION-based SQL Injection Simulation!');
        setAlertPayload(val);
        setVulnCode(`// Vulnerable SQL query creation:
const sql = "SELECT * FROM users WHERE name = '" + query + "'";
db.execute(sql);`);
        setFixedCode(`// Fixed SQL using PreparedStatement:
const sql = "SELECT * FROM users WHERE name = ?";
db.execute(sql, [query]);`);
        setAlertOpen(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          handleInputCheck(target.value, target);
        }
      }
    };

    const handleFormSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      const inputs = form.querySelectorAll('input, textarea');
      inputs.forEach((input) => {
        const inputEl = input as HTMLInputElement | HTMLTextAreaElement;
        if (inputEl.value) {
          handleInputCheck(inputEl.value, inputEl);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('submit', handleFormSubmit);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('submit', handleFormSubmit);
    };
  }, [flags]);

  // Bypass Auth check using URL parameters (?role=admin)
  useEffect(() => {
    if (flags.includes('bypass_auth')) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('role') === 'admin') {
        setAlertType('auth');
        setAlertTitle('Bypass Authentication Vulnerability Triggered!');
        setAlertPayload('URL Parameter: ?role=admin');
        setVulnCode(`// Vulnerable Auth Middleware check:
if (req.query.role === 'admin' || session.isAdmin) {
  grantAdminAccess();
}`);
        setFixedCode(`// Fixed Auth Check (Validate session token only):
if (session.user.role === 'admin') {
  grantAdminAccess();
}`);
        setAlertOpen(true);
      }
    }
  }, [flags, pathname]);

  const handleResetSandbox = async () => {
    try {
      await fetch('/api/security-flags', { method: 'DELETE' });
      setFlags([]);
      router.refresh();
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset sandbox', e);
    }
  };

  // Render absolutely nothing if sandbox is inactive
  if (flags.length === 0) return null;

  return (
    <>
      {/* Sandbox Status Bar / Banner at the top of client pages */}
      {isBannerVisible && (
        <div className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-yellow-500/40 bg-yellow-500/10 px-4 py-2.5 backdrop-blur-md transition-all animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 text-xs md:text-sm text-yellow-500 font-medium">
            <span className="animate-pulse text-sm">⚠️</span>
            <span>
              <strong>Chế độ Bảo mật Sandbox đang hoạt động</strong>: {flags.length}/22 lỗ hổng đang bật.
            </span>
            <div className="hidden md:flex gap-1">
              {flags.slice(0, 3).map((f) => (
                <Badge key={f} variant="outline" className="text-[10px] py-0 border-yellow-500/40 text-yellow-600 bg-yellow-500/5">
                  {f}
                </Badge>
              ))}
              {flags.length > 3 && (
                <Badge variant="outline" className="text-[10px] py-0 border-yellow-500/40 text-yellow-600 bg-yellow-500/5">
                  +{flags.length - 3} khác
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetSandbox}
              className="text-[11px] h-7 border-yellow-600/40 text-yellow-600 hover:bg-yellow-500/20 font-sans"
            >
              Reset Sandbox
            </Button>
            <button
              onClick={() => setIsBannerVisible(false)}
              className="text-yellow-600 hover:text-yellow-800 transition-colors p-1"
            >
              <Icons.close size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Floating button to restore banner if closed */}
      {!isBannerVisible && (
        <button
          onClick={() => setIsBannerVisible(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/90 text-yellow-950 font-bold px-4 py-2 shadow-lg hover:bg-yellow-500 hover:scale-105 transition-all text-xs font-sans animate-bounce"
        >
          <span>⚠️ Sandbox Active</span>
        </button>
      )}

      {/* Vuln Alert Dialog Displaying Vulnerability Info */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="max-w-2xl bg-zinc-950 text-zinc-100 border-zinc-800/80 shadow-2xl rounded-xl p-6 font-sans">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="flex items-center gap-2 text-red-400 font-bold text-lg">
              <span className="text-xl">🚨</span>
              <span>{alertTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Môi trường thử nghiệm bảo mật Web — Lỗi được phát hiện do bật cấu hình tương ứng trong Security Sandbox.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Input Payload Visual */}
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-3.5">
              <p className="text-[11px] font-semibold uppercase text-red-400 tracking-wider mb-1">Payload Đầu Vào:</p>
              <pre className="font-mono text-xs text-zinc-200 overflow-x-auto whitespace-pre-wrap select-all">
                {alertPayload}
              </pre>
            </div>

            {/* Simulated Vulnerable Render if HTML Injection */}
            {alertType === 'html' && (
              <div className="rounded-lg border border-yellow-600/30 bg-background/50 p-4">
                <p className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider mb-2">Giao diện bị ảnh hưởng (HTML Rendered):</p>
                {/* eslint-disable-next-line react/no-danger */}
                <div 
                  className="p-3 border border-dashed border-zinc-800 rounded bg-zinc-900/30"
                  dangerouslySetInnerHTML={{ __html: alertPayload }} 
                />
              </div>
            )}

            {/* Simulated Leakage table if UNION SQL Injection */}
            {alertType === 'sqli' && (
              <div className="rounded-lg border border-amber-600/30 bg-background/50 p-4 overflow-hidden">
                <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2">Kết quả rò rỉ dữ liệu (Exposed DB Data):</p>
                <div className="overflow-x-auto rounded border border-zinc-800 text-[11px]">
                  <table className="min-w-full divide-y divide-zinc-800 font-mono text-zinc-300">
                    <thead className="bg-zinc-900">
                      <tr>
                        <th className="px-3 py-1.5 text-left font-semibold">id</th>
                        <th className="px-3 py-1.5 text-left font-semibold">username</th>
                        <th className="px-3 py-1.5 text-left font-semibold">password_hash</th>
                        <th className="px-3 py-1.5 text-left font-semibold">role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-950/50">
                      <tr>
                        <td className="px-3 py-1.5">1</td>
                        <td className="px-3 py-1.5">admin@tutornet.vn</td>
                        <td className="px-3 py-1.5">$2b$12$R9h/cIPY... (MD5: e10adc3949ba59abbe56e057f20f883e)</td>
                        <td className="px-3 py-1.5">SUPER_ADMIN</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5">2</td>
                        <td className="px-3 py-1.5">tutor_manager@tutornet.vn</td>
                        <td className="px-3 py-1.5">$2b$12$K82jDpqW... (MD5: 21232f297a57a5a743894a0e4a801fc3)</td>
                        <td className="px-3 py-1.5">ADMIN</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Code Diff Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="rounded border border-red-950 bg-red-950/10 p-3 font-mono">
                <p className="font-semibold text-red-400 mb-1">❌ Code lỗi (Vulnerable):</p>
                <pre className="text-zinc-400 overflow-x-auto whitespace-pre">{vulnCode}</pre>
              </div>
              <div className="rounded border border-emerald-950 bg-emerald-950/10 p-3 font-mono">
                <p className="font-semibold text-emerald-400 mb-1">✔️ Code sửa (Remediation):</p>
                <pre className="text-zinc-400 overflow-x-auto whitespace-pre">{fixedCode}</pre>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setAlertOpen(false)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700 text-xs h-8 px-4"
            >
              Đóng demo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
