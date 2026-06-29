'use client';
// features/security-sandbox/components/test-panels/credential-stuffing-panel.tsx

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const LEAKED_CREDENTIALS = [
  { email: 'johnsnow9813@gmail.com', password: 'Admin@123' },      // Real user, correct password -> HIT
  { email: 'guilliman0511@gmail.com', password: 'wrongpassword' },  // Real user, wrong password -> MISS
  { email: 'nonexistent@example.com', password: 'password123' },  // Non-existent user -> MISS
  { email: 'superadmin@gmail.com', password: 'admin123' },       // Real admin user, correct password -> HIT
];

export function CredentialStuffingPanel() {
  const [attempts, setAttempts] = useState<{ email: string; password: string; status: 'ok' | 'fail' }[]>([]);
  const [running, setRunning] = useState(false);
  const [hits, setHits] = useState<string[]>([]);
  const [fileCredentials, setFileCredentials] = useState<{ email: string; password: string }[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const stopRef = useRef(false);

  const parseCredentialsFile = (text: string): { email: string; password: string }[] => {
    const lines = text.split('\n');
    const list: { email: string; password: string }[] = [];
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      const emailMatch = line.match(/email:\s*['"]?([^'",\s]+)['"]?/i);
      const passwordMatch = line.match(/password:\s*['"]?([^'"]+)['"]?/i);
      
      if (emailMatch && passwordMatch) {
        list.push({
          email: emailMatch[1].trim(),
          password: passwordMatch[1].trim()
        });
      }
    }
    return list;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        try {
          const parsed = parseCredentialsFile(text);
          if (parsed.length === 0) {
            alert("Không tìm thấy credentials hợp lệ trong file. Vui lòng kiểm tra định dạng file (ví dụ: email: 'user@gmail.com', password: '123')");
            clearFile();
          } else {
            setFileCredentials(parsed);
          }
        } catch (err) {
          alert('Lỗi đọc file. Vui lòng thử lại.');
          clearFile();
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearFile = () => {
    setFileCredentials(null);
    setFileName('');
    const input = document.getElementById('credential-file-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const activeList = fileCredentials || LEAKED_CREDENTIALS;

  const start = async () => {
    setRunning(true);
    stopRef.current = false;
    setAttempts([]);
    setHits([]);

    try {
      const res = await fetch('/api/v1/demo/auth/credential-stuffing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: activeList }),
      });
      const data = await res.json();
      const results = data.results || [];

      for (const item of results) {
        if (stopRef.current) break;
        // Simulate scanning delay
        await new Promise((r) => setTimeout(r, 450));
        
        const isHit = item.success;
        const matchedCred = activeList.find(c => c.email === item.email);
        
        setAttempts((prev) => [
          ...prev, 
          { 
            email: item.email, 
            password: matchedCred ? matchedCred.password : '******', 
            status: isHit ? 'ok' : 'fail' 
          }
        ]);
        
        if (isHit) {
          setHits((prev) => [...prev, item.email]);
        }
      }
    } catch (e) {
      console.error('Credential stuffing attack simulation failed', e);
    } finally {
      setRunning(false);
    }
  };

  const stop = () => { stopRef.current = true; setRunning(false); };
  const reset = () => { setAttempts([]); setHits([]); stopRef.current = true; setRunning(false); };

  const progress = Math.round((attempts.length / activeList.length) * 100);

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng:</strong> Dùng danh sách credential bị rò rỉ từ các breach khác để đăng nhập TutorNet — khai thác người dùng tái sử dụng mật khẩu. 6 credential từ dark web được thử.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-2 p-3 bg-muted/40 rounded border border-border/80">
        <label className="text-xs font-semibold text-foreground">
          Tải lên danh sách credentials rò rỉ (.txt):
        </label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".txt"
            id="credential-file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={running}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('credential-file-upload')?.click()}
            disabled={running}
          >
            Chọn file (.txt)
          </Button>
          <span className="text-xs text-muted-foreground truncate max-w-xs">
            {fileName || 'Mặc định (Dùng danh sách tích hợp sẵn)'}
          </span>
          {fileCredentials && !running && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 h-8 px-2"
              onClick={clearFile}
            >
              Xoá file
            </Button>
          )}
        </div>
      </div>

      {hits.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-4 space-y-1">
          <p className="text-red-800 dark:text-red-300 font-semibold text-sm">{hits.length} tài khoản TutorNet bị xâm phạm:</p>
          {hits.map((h) => <p key={h} className="text-xs font-mono text-red-600 dark:text-red-200">✓ {h}</p>)}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={start} disabled={running} variant="destructive" size="sm">
          {running ? 'Đang thử...' : 'Chạy Credential Stuffing'}
        </Button>
        {running && <Button onClick={stop} variant="outline" size="sm">Dừng</Button>}
        {!running && attempts.length > 0 && <Button onClick={reset} variant="outline" size="sm">Reset</Button>}
      </div>

      {attempts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Đang thử {attempts.length}/{activeList.length} credentials</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="max-h-52 overflow-y-auto space-y-1 rounded border border-border/20 p-2">
            {attempts.map((a, i) => (
              <div key={i} className={`flex items-center justify-between text-xs font-mono px-2 py-1 rounded ${a.status === 'ok' ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200' : 'text-muted-foreground'}`}>
                <span>{a.email} : {a.password}</span>
                <span className={a.status === 'ok' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-muted-foreground'}>
                  {a.status === 'ok' ? 'HIT ✓' : '401 ✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/50 rounded p-3 font-mono space-y-1">
        <p className="text-red-600 dark:text-red-400 font-semibold">Vulnerable: không phát hiện bulk login từ nhiều IP</p>
        <p className="text-green-600 dark:text-green-400 font-semibold mt-1">Fixed: rate limit + CAPTCHA + HaveIBeenPwned check</p>
      </div>
    </div>
  );
}
