'use client';
// features/security-sandbox/components/test-panels/missing-auth-panel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const ENDPOINTS = [
  { path: '/api/v1/demo/access/users', description: 'Danh sách toàn bộ người dùng', key: 'users' },
  { path: '/api/v1/demo/access/system-info', description: 'Thông tin hệ thống & cấu hình', key: 'system-info' },
];

export function MissingAuthPanel() {
  const [token, setToken] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState(ENDPOINTS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    vulnStatus: number;
    vulnData: any;
    fixedStatus: number;
    fixedData: any;
  } | null>(null);

  const callApi = async () => {
    setLoading(true);
    setResult(null);
    try {
      const headers: Record<string, string> = {};
      if (token.trim()) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      // 1. Gọi API Vulnerable
      const resVuln = await fetch(`${selectedEndpoint.path}/vulnerable`, {
        method: 'GET',
        headers,
      });
      let dataVuln;
      try {
        dataVuln = await resVuln.json();
      } catch {
        dataVuln = await resVuln.text();
      }

      // 2. Gọi API Safe
      const resFixed = await fetch(`${selectedEndpoint.path}/safe`, {
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

      toast.info('Nhận phản hồi từ server');
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
          <strong>Kiểm thử Missing Authentication (Thiếu xác thực):</strong> Endpoint chứa dữ liệu nhạy cảm của hệ thống nhưng không áp dụng bộ lọc (filter) hoặc middleware kiểm tra Token. Kẻ tấn công truy cập trực tiếp API mà không cần đăng nhập vẫn tải được toàn bộ dữ liệu.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Chọn endpoint cần kiểm thử:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ENDPOINTS.map((ep) => (
            <button
              key={ep.path}
              disabled={loading}
              onClick={() => { setSelectedEndpoint(ep); setResult(null); }}
              className={`rounded border p-3 text-left text-xs transition-all ${
                selectedEndpoint.key === ep.key
                  ? 'border-red-500/40 bg-red-950/20'
                  : 'border-border/20 hover:bg-muted/10'
              }`}
            >
              <code className="text-orange-400 font-mono">{ep.path}</code>
              <p className="text-muted-foreground mt-1 text-[11px]">{ep.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium">JWT Token gửi kèm (Để trống để kiểm thử bypass auth):</p>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Ví dụ: eyJhbGciOiJIUzI1NiIsIn..."
          className="w-full rounded border border-border/30 bg-background px-3 py-1.5 text-xs font-mono text-muted-foreground placeholder:text-muted-foreground/40"
          disabled={loading}
        />
      </div>

      <div className="rounded border border-border/20 bg-muted/10 p-3 text-xs space-y-1">
        <p className="text-muted-foreground font-medium">HTTP Request gửi đi:</p>
        <pre className="font-mono text-orange-300">
{`GET ${selectedEndpoint.path}/[mode] HTTP/1.1
Host: localhost:8080
${token ? `Authorization: Bearer ${token.substring(0, 15)}...` : '// Không gửi kèm Authorization Header!'}`}
        </pre>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={callApi} variant="destructive" disabled={loading}>
          {loading ? 'Đang gửi...' : 'Gửi Request'}
        </Button>
        {result && <Button size="sm" onClick={reset} variant="outline" disabled={loading}>Reset</Button>}
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p className="text-[10px] text-red-300 italic font-semibold">⚠️ Lỗ hổng! Server cho phép truy xuất dữ liệu nhạy cảm mà không cần xác thực.</p>
            )}
          </div>

          {/* Safe Result */}
          <div className={`rounded border p-4 space-y-2 ${result.fixedStatus === 200 ? 'border-green-500/40 bg-green-950/10' : 'border-green-500/30 bg-green-950/10'}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-green-400">✅ Safe Endpoint</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${result.fixedStatus === 200 ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'}`}>
                Status: {result.fixedStatus}
              </span>
            </div>
            <pre className="text-[11px] font-mono whitespace-pre-wrap bg-black/40 rounded p-3 text-green-200 max-h-48 overflow-y-auto">
              {JSON.stringify(result.fixedData, null, 2)}
            </pre>
            {result.fixedStatus === 401 ? (
              <p className="text-[10px] text-green-400 italic font-semibold">🛡️ Đã bảo vệ! Hệ thống chặn đứng yêu cầu chưa xác thực và trả về 401 Unauthorized.</p>
            ) : (
              <p className="text-[10px] text-green-300 italic font-semibold">Token hợp lệ - Cho phép đọc dữ liệu.</p>
            )}
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable (Không có filter kiểm duyệt token):</p>
        <code className="text-muted-foreground">{'@GetMapping("/users/vulnerable")\npublic ResponseEntity<?> getUsers() { return db.getUsers(); }'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed (Ràng buộc bộ lọc an toàn và xác thực):</p>
        <code className="text-muted-foreground">
          {'@GetMapping("/users/safe")\npublic ResponseEntity<?> getUsers(@RequestHeader("Authorization") String token) {\n  if (!isValid(token)) throw new UnauthorizedException();\n}'}
        </code>
      </div>
    </div>
  );
}
