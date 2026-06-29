'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function DemoProfilePage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/demo/session/me');
      const data = await res.json();
      if (res.ok) {
        setSession(data);
      } else {
        setError(data.error || 'Không tìm thấy phiên đăng nhập');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/demo/session/logout', { method: 'POST' });
    } catch (e) {}
    setSession(null);
    setError('Đã đăng xuất');
  };

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-gray-950 dark:via-gray-900 dark:to-primary/10">
      
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

      <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xl backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary border border-primary/20">
              <Icons.school size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold">TutorNet Demo Profile</h1>
              <p className="text-xs text-muted-foreground">Trang kiểm thử phiên làm việc trực quan</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={fetchSession}>
            <Icons.history size={13} /> Làm mới
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        )}

        {/* Error / Not Logged In State */}
        {!loading && error && (
          <div className="text-center py-8 space-y-5 animate-in fade-in duration-300">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <Icons.lock size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground">Bạn Chưa Đăng Nhập</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Hệ thống không tìm thấy Cookie phiên làm việc hợp lệ.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Link href="/auth/login">
                <Button size="sm" className="h-9 px-5">Đăng nhập ngay</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Logged In User State */}
        {!loading && session && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* User Profile Card */}
            <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white text-xl font-bold border border-primary/20 shadow-inner">
                {session.fullName ? session.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">{session.fullName || 'Người dùng TutorNet'}</h2>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Gia sư</Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{session.email}</p>
                <p className="text-[10px] text-muted-foreground">User ID: <span className="font-semibold text-foreground">{session.userId}</span></p>
              </div>
            </div>

            {/* Session Debugging Info */}
            <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5">
              <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 border-b border-amber-500/25 pb-1.5">
                <Icons.info size={14} /> Chi tiết cấu hình Session Security
              </h3>
              <div className="grid grid-cols-3 gap-y-1.5 gap-x-2 text-[11px] font-mono">
                <span className="text-muted-foreground">Session ID:</span>
                <span className="col-span-2 text-foreground font-semibold break-all">{session.sessionId}</span>

                <span className="text-muted-foreground">Loại Cookie:</span>
                <span className="col-span-2 text-foreground">
                  {session.sessionId.startsWith('safe_') || session.regenerated ? (
                    <span className="text-green-600 dark:text-green-400 font-semibold">SESS (Safe Mode)</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 font-semibold">TUTOR_SESSION (Vulnerable)</span>
                  )}
                </span>

                <span className="text-muted-foreground">Xác thực:</span>
                <span className="col-span-2 text-green-600 dark:text-green-400 font-semibold">Thành công (200 OK)</span>

                <span className="text-muted-foreground">Tạo lúc:</span>
                <span className="col-span-2 text-muted-foreground">{new Date(session.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Link href="/">
                <Button size="sm" variant="outline" className="h-9 gap-1.5">
                  <Icons.home size={14} /> Về trang chủ
                </Button>
              </Link>
              <Button size="sm" variant="destructive" className="h-9 gap-1.5" onClick={handleLogout}>
                <Icons.logout size={14} /> Đăng xuất phiên
              </Button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
