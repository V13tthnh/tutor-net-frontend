'use client';
// features/security-sandbox/components/test-panels/bypass-auth-panel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type BypassMethod = 'param' | 'header' | 'role-param' | 'none';

const BYPASS_METHODS: {
  id: BypassMethod;
  label: string;
  description: string;
  request: string;
  works: boolean;
}[] = [
  {
    id: 'none',
    label: 'Không bypass (bình thường)',
    description: 'Request bình thường không có session token',
    request: 'GET /api/admin/dashboard HTTP/1.1\nHost: tutornet.vn\n// Không có auth',
    works: false,
  },
  {
    id: 'param',
    label: '?admin=true',
    description: 'Thêm query param ?admin=true để bypass check phân quyền',
    request: 'GET /api/admin/dashboard?admin=true HTTP/1.1\nHost: tutornet.vn\n// Server: if (req.query.admin) skip auth check',
    works: true,
  },
  {
    id: 'header',
    label: 'X-Admin: 1',
    description: 'Thêm custom header để trigger lỗ hổng trong server middleware',
    request: 'GET /api/admin/dashboard HTTP/1.1\nHost: tutornet.vn\nX-Admin: 1\nX-Forwarded-User: admin',
    works: true,
  },
  {
    id: 'role-param',
    label: '?role=ADMIN',
    description: 'Truyền role trực tiếp qua query string để server tin tưởng',
    request: 'GET /api/admin/dashboard?role=ADMIN&userId=42 HTTP/1.1\nHost: tutornet.vn\n// Server: const role = req.query.role || getRole(token)',
    works: true,
  },
];

const ADMIN_DATA = {
  dashboard: { totalUsers: 1247, revenue: 182500000, activeContracts: 89 },
  secretEndpoint: 'Đây là dữ liệu chỉ admin mới được xem!',
};

export function BypassAuthPanel() {
  const [selected, setSelected] = useState<BypassMethod>('none');
  const [response, setResponse] = useState<{ success: boolean; data: unknown } | null>(null);

  const method = BYPASS_METHODS.find((m) => m.id === selected)!;

  const sendRequest = () => {
    setResponse({
      success: method.works,
      data: method.works ? ADMIN_DATA.dashboard : { error: 'Unauthorized', status: 401 },
    });
  };

  const reset = () => setResponse(null);

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Server có lỗi logic xác thực — tin tưởng vào các tham số
          client-controlled như query string hoặc custom header để cấp quyền admin.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Phương thức bypass:</p>
        {BYPASS_METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => { setSelected(m.id); setResponse(null); }}
            className={`w-full rounded border p-3 text-left text-xs transition-all ${
              selected === m.id
                ? m.works
                  ? 'border-red-500/40 bg-red-950/20'
                  : 'border-border bg-muted/20'
                : 'border-border/20 hover:bg-muted/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <code className={`font-bold ${m.works ? 'text-red-400' : 'text-muted-foreground'}`}>
                {m.label}
              </code>
              {m.works && <span className="text-xs text-red-400">⚠️ Exploit!</span>}
            </div>
            <p className="text-muted-foreground mt-1">{m.description}</p>
          </button>
        ))}
      </div>

      <div className="rounded border border-border/20 bg-black/40 p-3">
        <p className="text-xs text-muted-foreground mb-2">HTTP Request:</p>
        <pre className="text-xs font-mono text-orange-300 whitespace-pre-wrap">{method.request}</pre>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={sendRequest} variant={method.works ? 'destructive' : 'outline'}>
          Gửi request
        </Button>
        {response && <Button size="sm" onClick={reset} variant="outline">Reset</Button>}
      </div>

      {response && (
        <div className={`rounded border p-4 space-y-2 ${
          response.success ? 'border-red-500/40 bg-red-950/10' : 'border-muted/50 bg-muted/10'
        }`}>
          <p className={`font-semibold text-xs ${response.success ? 'text-red-400' : 'text-muted-foreground'}`}>
            {response.success
              ? '🔴 Bypass auth thành công! Truy cập admin mà không có credentials!'
              : '✅ Bị chặn đúng cách — 401 Unauthorized'}
          </p>
          <pre className="text-xs font-mono whitespace-pre-wrap bg-black/40 rounded p-3 text-red-300">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable logic:</p>
        <code className="text-muted-foreground block">
          {'if (req.query.admin || req.headers["x-admin"]) {\n  req.user = { role: "ADMIN" }; // BUG!\n}'}
        </code>
        <p className="text-green-400 font-semibold mt-2">Fixed: Chỉ trust server-side session</p>
        <code className="text-muted-foreground block">
          {'const session = verifyJWT(req.headers.authorization);\nif (!session || session.role !== "ADMIN") return 403;'}
        </code>
      </div>
    </div>
  );
}
