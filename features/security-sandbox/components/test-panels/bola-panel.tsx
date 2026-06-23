'use client';
// features/security-sandbox/components/test-panels/bola-panel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const USERS_DB: Record<number, { id: number; email: string; fullName: string; role: string; phone: string; address: string; bankAccount?: string }> = {
  1: { id: 1, email: 'admin@tutornet.vn', fullName: 'Super Admin', role: 'ADMIN', phone: '0900000001', address: 'HCM City', bankAccount: '9999-8888-7777' },
  2: { id: 2, email: 'alice@tutornet.vn', fullName: 'Alice Nguyen', role: 'STUDENT', phone: '0912345678', address: '123 Lê Lợi, Q1' },
  3: { id: 3, email: 'bob@tutornet.vn', fullName: 'Bob Tran', role: 'TUTOR', phone: '0923456789', address: '456 Nguyễn Huệ, Q1', bankAccount: '1234-5678-9012' },
  5: { id: 5, email: 'charlie@tutornet.vn', fullName: 'Charlie Le', role: 'STUDENT', phone: '0934567890', address: '789 Phạm Ngũ Lão, Q1' },
};

// Simulated logged-in user
const CURRENT_USER = USERS_DB[5];

export function BolaPanel() {
  const [targetId, setTargetId] = useState(5);
  const [response, setResponse] = useState<{ data: unknown; idor: boolean } | null>(null);

  const fetchUser = () => {
    const data = USERS_DB[targetId] ?? { error: 'User not found', status: 404 };
    const idor = targetId !== CURRENT_USER.id && USERS_DB[targetId] !== undefined;
    setResponse({ data, idor });
  };

  const reset = () => setResponse(null);

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Người dùng <code>charlie (id=5)</code> đang đăng nhập.
          API <code>/api/users/:id</code> chỉ kiểm tra có token hay không — không kiểm tra
          token có khớp với <code>:id</code> không. Thay đổi ID để truy cập data người khác.
        </AlertDescription>
      </Alert>

      <div className="rounded border border-blue-500/30 bg-blue-950/20 p-3 text-xs space-y-1">
        <p className="text-blue-400 font-semibold">Người dùng đang đăng nhập:</p>
        <p>ID: <code className="text-blue-300">{CURRENT_USER.id}</code></p>
        <p>Email: <code className="text-blue-300">{CURRENT_USER.email}</code></p>
        <p>Role: <code className="text-blue-300">{CURRENT_USER.role}</code></p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Thay đổi User ID trong request:</p>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[1, 2, 3, 5].map((id) => (
              <button
                key={id}
                onClick={() => { setTargetId(id); setResponse(null); }}
                className={`rounded border w-10 h-10 text-sm font-bold transition-all ${
                  targetId === id
                    ? id === CURRENT_USER.id
                      ? 'border-blue-500/60 bg-blue-950/40 text-blue-400'
                      : 'border-red-500/60 bg-red-950/30 text-red-400'
                    : 'border-border/30 hover:bg-muted/20'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {targetId === CURRENT_USER.id ? '← của bạn' : '← của người khác!'}
          </span>
        </div>
      </div>

      <div className="rounded border border-border/20 bg-muted/10 p-3 text-xs">
        <code className="text-orange-400">GET /api/users/{targetId}</code>
        <p className="text-muted-foreground mt-1">Authorization: Bearer eyJ... (token của charlie)</p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={fetchUser} variant={targetId !== CURRENT_USER.id ? 'destructive' : 'outline'}>
          Gọi API
        </Button>
        {response && <Button size="sm" onClick={reset} variant="outline">Reset</Button>}
      </div>

      {response && (
        <div className={`rounded border p-4 space-y-2 ${
          response.idor ? 'border-red-500/40 bg-red-950/10' : 'border-green-500/30 bg-green-950/10'
        }`}>
          {response.idor ? (
            <p className="text-red-400 font-semibold text-xs">
              🔴 BOLA thành công! Đang xem dữ liệu của user #{targetId}
            </p>
          ) : (
            <p className="text-green-400 font-semibold text-xs">
              ✅ Đang xem dữ liệu của chính bạn (user #{targetId})
            </p>
          )}
          <pre className="text-xs font-mono whitespace-pre-wrap bg-black/40 rounded p-3 text-red-300">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable: Chỉ kiểm tra isAuthenticated</p>
        <code className="text-muted-foreground">
          {'app.get("/api/users/:id",\n  requireAuth,  // chỉ check token tồn tại\n  (req, res) => db.getUser(req.params.id)\n);'}
        </code>
        <p className="text-green-400 font-semibold mt-2">Fixed: Kiểm tra ownership</p>
        <code className="text-muted-foreground">
          {'if (req.params.id !== req.user.id && !req.user.isAdmin)\n  return res.status(403).json({ error: "Forbidden" });'}
        </code>
      </div>
    </div>
  );
}
