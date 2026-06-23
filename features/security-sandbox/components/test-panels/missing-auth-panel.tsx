'use client';
// features/security-sandbox/components/test-panels/missing-auth-panel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SENSITIVE_DATA = {
  users: [
    { id: 1, email: 'admin@tutornet.vn', role: 'ADMIN', phone: '0901234567' },
    { id: 2, email: 'alice@tutornet.vn', role: 'STUDENT', phone: '0912345678' },
    { id: 3, email: 'bob@tutornet.vn', role: 'TUTOR', phone: '0923456789' },
  ],
  systemInfo: {
    version: '2.1.0',
    dbHost: 'postgres://localhost:5432/tutornet',
    nodeEnv: 'production',
    jwtSecret: 'tutornet-super-secret-key-2024',
  },
};

const ENDPOINTS = [
  { path: '/api/admin/users', description: 'Danh sách toàn bộ người dùng', key: 'users' as const },
  { path: '/api/admin/system-info', description: 'Thông tin hệ thống & config', key: 'systemInfo' as const },
];

export function MissingAuthPanel() {
  const [token, setToken] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState(ENDPOINTS[0]);
  const [response, setResponse] = useState<{ status: number; data: unknown } | null>(null);

  const callApi = () => {
    // Vulnerable: server doesn't check for auth token at all
    setResponse({
      status: 200,
      data: SENSITIVE_DATA[selectedEndpoint.key],
    });
  };

  const reset = () => setResponse(null);

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Endpoint nhạy cảm không yêu cầu xác thực.
          Gọi API không cần token vẫn nhận được dữ liệu quan trọng.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Chọn endpoint:</p>
        <div className="space-y-2">
          {ENDPOINTS.map((ep) => (
            <button
              key={ep.path}
              onClick={() => { setSelectedEndpoint(ep); setResponse(null); }}
              className={`w-full rounded border p-3 text-left text-xs transition-all ${
                selectedEndpoint.path === ep.path
                  ? 'border-red-500/40 bg-red-950/20'
                  : 'border-border/20 hover:bg-muted/10'
              }`}
            >
              <code className="text-orange-400">{ep.path}</code>
              <p className="text-muted-foreground mt-1">{ep.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded border border-border/20 bg-muted/10 p-3 text-xs space-y-2">
        <p className="text-muted-foreground font-medium">HTTP Request gửi đi:</p>
        <pre className="font-mono text-orange-300">
{`GET ${selectedEndpoint.path} HTTP/1.1
Host: tutornet.vn
${token ? `Authorization: Bearer ${token}` : '// Không có Authorization header!'}`}
        </pre>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Token (tùy chọn — để trống để test lỗ hổng)</p>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Để trống hoặc nhập token bất kỳ..."
          className="w-full rounded border border-border/30 bg-background px-3 py-2 text-xs font-mono"
        />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={callApi} variant="destructive">
          Gọi API (không auth)
        </Button>
        {response && <Button size="sm" onClick={reset} variant="outline">Reset</Button>}
      </div>

      {response && (
        <div className="rounded border border-red-500/40 bg-red-950/10 p-4 space-y-2">
          <p className="text-red-400 font-semibold text-xs">
            🔴 HTTP {response.status} OK — Không cần auth vẫn nhận được data!
          </p>
          <pre className="text-xs font-mono text-red-300 whitespace-pre-wrap bg-black/40 rounded p-3">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable: Không có middleware auth</p>
        <code className="text-muted-foreground">
          {'app.get("/api/admin/users", (req, res) => {\n  res.json(db.getAllUsers());\n});'}
        </code>
        <p className="text-green-400 font-semibold mt-2">Fixed:</p>
        <code className="text-muted-foreground">
          {'app.get("/api/admin/users",\n  requireAuth,  // middleware\n  requireRole("ADMIN"),\n  (req, res) => { res.json(db.getAllUsers()); }\n);'}
        </code>
      </div>
    </div>
  );
}
