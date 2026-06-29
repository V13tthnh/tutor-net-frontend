'use client';
// features/security-sandbox/components/test-panels/bola-panel.tsx

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export function BolaPanel() {
  const [targetId, setTargetId] = useState(3);
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string; fullName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    vulnStatus: number;
    vulnData: any;
    fixedStatus: number;
    fixedData: any;
  } | null>(null);

  // Fetch current user from session on mount to show active context
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser({
              id: data.user.id,
              email: data.user.email,
              fullName: data.user.fullName || data.user.email,
              role: data.user.role || 'STUDENT',
            });
          }
        }
      } catch (e) {
        // Fallback
      }
    };
    fetchMe();
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    setResult(null);
    try {
      // 1. Gọi API Vulnerable
      const resVuln = await fetch(`/api/v1/demo/access/users/${targetId}/vulnerable`, {
        method: 'GET',
      });
      let dataVuln;
      try {
        dataVuln = await resVuln.json();
      } catch {
        dataVuln = await resVuln.text();
      }

      // 2. Gọi API Safe
      const resFixed = await fetch(`/api/v1/demo/access/users/${targetId}/safe`, {
        method: 'GET',
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

      toast.info('Đã nhận phản hồi từ server');
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
          <strong>Kiểm thử BOLA (Broken Object Level Authorization):</strong> Xảy ra khi server chỉ kiểm tra Token xác thực hợp lệ (isAuthenticated) nhưng quên không kiểm tra quyền sở hữu đối với tài nguyên được yêu cầu. Attacker đổi ID tài nguyên (ví dụ: User ID) trên tham số đường dẫn để đọc lén dữ liệu của người khác.
        </AlertDescription>
      </Alert>

      {currentUser && (
        <div className="rounded border border-blue-500/30 bg-blue-950/20 p-3 text-xs space-y-1">
          <p className="text-blue-400 font-semibold">Tài khoản của bạn đang đăng nhập (Client Session):</p>
          <p>ID trên hệ thống: <code className="text-blue-300 font-mono">{currentUser.id}</code></p>
          <p>Email: <code className="text-blue-300 font-mono">{currentUser.email}</code></p>
          <p>Quyền hạn: <code className="text-blue-300 font-mono">{currentUser.role}</code></p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Thay đổi ID người dùng cần xem trên API (Database Demo có các ID: 1, 2, 3, 5):</p>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {[1, 2, 3, 5].map((id) => (
              <button
                key={id}
                disabled={loading}
                onClick={() => { setTargetId(id); setResult(null); }}
                className={`rounded border w-10 h-10 text-xs font-bold transition-all ${
                  targetId === id
                    ? 'border-red-500/60 bg-red-950/30 text-red-400 font-mono'
                    : 'border-border/30 hover:bg-muted/20 font-mono'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {targetId === 1 ? '← Super Admin' : targetId === 3 ? '← Gia sư Bob' : targetId === 2 ? '← Học viên Alice' : '← Học viên Charlie'}
          </span>
        </div>
      </div>

      <div className="rounded border border-border/20 bg-muted/10 p-3 text-xs">
        <code className="text-orange-400">GET /api/v1/demo/access/users/{targetId}</code>
        <p className="text-muted-foreground mt-1">Authorization: Bearer eyJ... (Token hợp lệ của tài khoản đang đăng nhập)</p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={fetchUser} variant="destructive" disabled={loading}>
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
              <p className="text-[10px] text-red-300 italic font-semibold">⚠️ Lỗ hổng BOLA! Server cho phép xem dữ liệu của người dùng khác mà không kiểm tra quyền sở hữu.</p>
            )}
          </div>

          {/* Safe Result */}
          <div className={`rounded border p-4 space-y-2 ${result.fixedStatus === 403 ? 'border-green-500/40 bg-green-950/10' : 'border-red-500/40 bg-red-950/10'}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-green-400">✅ Safe Endpoint</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${result.fixedStatus === 200 ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'}`}>
                Status: {result.fixedStatus}
              </span>
            </div>
            <pre className="text-[11px] font-mono whitespace-pre-wrap bg-black/40 rounded p-3 text-green-200 max-h-48 overflow-y-auto">
              {JSON.stringify(result.fixedData, null, 2)}
            </pre>
            {result.fixedStatus === 403 ? (
              <p className="text-[10px] text-green-400 italic font-semibold">🛡️ Đã bảo vệ! Server kiểm duyệt ownership và chặn đứng truy cập trái phép (403 Forbidden).</p>
            ) : (
              <p className="text-[10px] text-green-300 italic font-semibold">Cho phép truy cập (Chính chủ hoặc tài khoản Admin).</p>
            )}
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable (Không kiểm tra quyền sở hữu ID):</p>
        <code className="text-muted-foreground">{'@GetMapping("/users/{id}")\npublic ResponseEntity<?> getUser(@PathVariable Long id) {\n  return ResponseEntity.ok(userService.findById(id));\n}'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed (Kiểm tra token owner có trùng với tài nguyên yêu cầu):</p>
        <code className="text-muted-foreground">
          {'User currentUser = getAuthenticatedUser();\nif (!currentUser.getId().equals(id) && !currentUser.isAdmin()) {\n  throw new AccessDeniedException("Forbidden");\n}'}
        </code>
      </div>
    </div>
  );
}
