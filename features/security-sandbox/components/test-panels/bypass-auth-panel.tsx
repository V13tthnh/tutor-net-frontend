'use client';
// features/security-sandbox/components/test-panels/bypass-auth-panel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

type BypassMethod = 'param' | 'header' | 'role-param' | 'none';

const BYPASS_METHODS = [
  {
    id: 'none' as BypassMethod,
    label: 'Không bypass (Request thường)',
    description: 'Yêu cầu bình thường không có quyền admin',
    path: '/api/v1/demo/access/admin-dashboard',
    works: false,
  },
  {
    id: 'param' as BypassMethod,
    label: '?admin=true',
    description: 'Thêm tham số ?admin=true vào query để bypass kiểm tra quyền',
    path: '/api/v1/demo/access/admin-dashboard?admin=true',
    works: true,
  },
  {
    id: 'header' as BypassMethod,
    label: 'X-Admin: 1',
    description: 'Gửi thêm custom header X-Admin: 1 để đánh lừa server middleware',
    path: '/api/v1/demo/access/admin-dashboard',
    works: true,
  },
  {
    id: 'role-param' as BypassMethod,
    label: '?role=ADMIN',
    description: 'Khai báo trực tiếp vai trò admin qua tham số query string',
    path: '/api/v1/demo/access/admin-dashboard?role=ADMIN',
    works: true,
  },
];

export function BypassAuthPanel() {
  const [selected, setSelected] = useState<BypassMethod>('none');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    vulnStatus: number;
    vulnData: any;
    fixedStatus: number;
    fixedData: any;
  } | null>(null);

  const methodInfo = BYPASS_METHODS.find((m) => m.id === selected)!;

  const sendRequest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const headers: Record<string, string> = {};
      if (selected === 'header') {
        headers['X-Admin'] = '1';
      }

      // 1. Gọi API Vulnerable
      const resVuln = await fetch(methodInfo.path + (methodInfo.path.includes('?') ? '&vulnerable' : '/vulnerable'), {
        method: 'GET',
        headers,
      });
      let dataVuln;
      try {
        dataVuln = await resVuln.json();
      } catch {
        dataVuln = await resVuln.text();
      }

      // 2. Gọi API Safe (Sẽ luôn bị chặn trừ khi có Admin token thực sự)
      const resFixed = await fetch(methodInfo.path + (methodInfo.path.includes('?') ? '&safe' : '/safe'), {
        method: 'GET',
        headers,
      });
      let dataFixed;
      try {
        dataFixed = await resFixed.json();
      } catch {
        dataFixed = await resFixed.text();
      }

      setResult({
        vulnStatus: resVuln.status,
        vulnData: dataVuln,
        fixedStatus: resFixed.status,
        fixedData: dataFixed,
      });

      toast.info('Nhận phản hồi từ server.');
    } catch (e) {
      toast.error('Lỗi kết nối tới backend');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setResult(null);

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Kiểm thử Bypass Authentication (Nhận dạng không an toàn):</strong> Lập trình viên vô tình tin tưởng vào thông tin đầu vào do client tự khai báo (chẳng hạn như query string hoặc HTTP headers) để xác định quyền quản trị (Admin) thay vì xác thực tập trung từ session/token ký bởi server.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Lựa chọn kịch bản khai thác:</p>
        <div className="space-y-2">
          {BYPASS_METHODS.map((m) => (
            <button
              key={m.id}
              disabled={loading}
              onClick={() => { setSelected(m.id); setResult(null); }}
              className={`w-full rounded border p-3 text-left text-xs transition-all ${
                selected === m.id
                  ? m.works
                    ? 'border-red-500/40 bg-red-950/20'
                    : 'border-border bg-muted/20'
                  : 'border-border/20 hover:bg-muted/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <code className={`font-bold ${m.works ? 'text-red-400 font-mono' : 'text-muted-foreground font-mono'}`}>
                  {m.label}
                </code>
                {m.works && <span className="text-[10px] text-red-400 font-semibold animate-pulse">⚠️ Kích hoạt tấn công</span>}
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">{m.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded border border-border/20 bg-black/40 p-3">
        <p className="text-xs text-muted-foreground mb-1.5">HTTP Request mô phỏng gửi đi:</p>
        <pre className="text-xs font-mono text-orange-300 whitespace-pre-wrap">
{`GET ${methodInfo.path} HTTP/1.1
Host: localhost:8080
${selected === 'header' ? 'X-Admin: 1\nX-Forwarded-User: admin' : '// Header thông thường'}`}
        </pre>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={sendRequest} variant={methodInfo.works ? 'destructive' : 'outline'} disabled={loading}>
          {loading ? 'Đang gửi...' : 'Gửi Request'}
        </Button>
        {result && <Button size="sm" onClick={reset} variant="outline" disabled={loading}>Reset</Button>}
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          {/* Vulnerable Result */}
          <div className={`rounded border p-4 space-y-2 ${result.vulnStatus === 200 ? 'border-red-500/40 bg-red-950/10' : 'border-green-500/30 bg-green-950/10'}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-red-400">🔴 Vulnerable Endpoint</span>
              <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded font-mono">Status: {result.vulnStatus}</span>
            </div>
            <pre className="text-[11px] font-mono whitespace-pre-wrap bg-black/40 rounded p-3 text-red-200 max-h-48 overflow-y-auto">
              {JSON.stringify(result.vulnData, null, 2)}
            </pre>
            {result.vulnStatus === 200 && (
              <p className="text-[10px] text-red-300 italic font-semibold">⚠️ Bypass thành công! Server cấp quyền Admin dựa vào tham số client-controlled.</p>
            )}
          </div>

          {/* Safe Result */}
          <div className={`rounded border p-4 space-y-2 ${result.fixedStatus === 200 ? 'border-green-500/40 bg-green-950/10' : 'border-red-500/40 bg-red-950/10'}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-green-400">✅ Safe Endpoint</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${result.fixedStatus === 200 ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'}`}>
                Status: {result.fixedStatus}
              </span>
            </div>
            <pre className="text-[11px] font-mono whitespace-pre-wrap bg-black/40 rounded p-3 text-green-200 max-h-48 overflow-y-auto">
              {JSON.stringify(result.fixedData, null, 2)}
            </pre>
            {result.fixedStatus === 401 || result.fixedStatus === 403 ? (
              <p className="text-[10px] text-green-400 italic font-semibold">🛡️ Đã bảo vệ! Hệ thống từ chối các tham số tự khai báo và trả về {result.fixedStatus} Unauthorized.</p>
            ) : (
              <p className="text-[10px] text-green-300 italic font-semibold">Token hợp lệ - Quyền admin xác thực thành công.</p>
            )}
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable logic (Tin tưởng tham số client):</p>
        <code className="text-muted-foreground block whitespace-pre-wrap">
          {'if ("true".equals(adminParam) || "1".equals(adminHeader)) {\n   // BUG: Bỏ qua filter, cấp quyền admin\n}'}
        </code>
        <p className="text-green-400 font-semibold mt-2">Fixed (Chỉ xác thực qua Token/Session do Server quản lý):</p>
        <code className="text-muted-foreground block whitespace-pre-wrap">
          {'Claims claims = jwtService.verify(token);\nif (!"ADMIN".equals(claims.get("role"))) throw new AccessDeniedException();'}
        </code>
      </div>
    </div>
  );
}
