'use client';
// features/security-sandbox/components/test-panels/path-traversal-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MOCK_FILES: Record<string, string> = {
  '/var/www/uploads/file.pdf': '%PDF-1.4 ... [binary content]',
  '/var/www/uploads/avatar.jpg': '[JPEG binary data]',
  '/etc/passwd':
    'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33::/var/www:/usr/sbin/nologin\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin',
  '/etc/shadow': 'root:$6$xyz...:19000:0:99999:7:::\nwww-data:!:19000::::::',
  '/var/www/.env': 'DATABASE_URL=postgresql://admin:Sup3rS3cr3t@localhost/tutornet\nJWT_SECRET=my-jwt-secret-do-not-share\nADMIN_PASSWORD=admin123',
  '/var/www/config.php': '<?php\ndefine("DB_PASS", "supersecret");\ndefine("API_KEY", "sk-1234567890abcdef");\n?>',
  '/proc/self/environ': 'DATABASE_URL=postgresql://...\nPATH=/usr/local/bin:/usr/bin\nHOME=/var/www',
};

const BASE_DIR = '/var/www/uploads/';

function resolvePath(base: string, input: string): string {
  const parts = (base + input).split('/');
  const resolved: string[] = [];
  for (const p of parts) {
    if (p === '..') resolved.pop();
    else if (p && p !== '.') resolved.push(p);
  }
  return '/' + resolved.join('/');
}

export function PathTraversalPanel() {
  const [input, setInput] = useState('../../etc/passwd');
  const [result, setResult] = useState<{ path: string; content: string; danger: boolean } | null>(null);

  const examples = [
    '../../etc/passwd',
    '../../etc/shadow',
    '../../var/www/.env',
    '../../var/www/config.php',
    '../../proc/self/environ',
    'file.pdf',
  ];

  const fetchFile = () => {
    const resolved = resolvePath(BASE_DIR, input);
    const content = MOCK_FILES[resolved] ?? `[No such file: ${resolved}]`;
    const danger = !resolved.startsWith(BASE_DIR);
    setResult({ path: resolved, content, danger });
  };

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Server xây dựng đường dẫn file bằng cách nối chuỗi
          input người dùng với base directory. Dùng <code>../</code> để thoát ra ngoài
          thư mục được phép và đọc file hệ thống nhạy cảm.
        </AlertDescription>
      </Alert>

      <div className="space-y-1 text-xs">
        <p className="text-muted-foreground">Base directory:</p>
        <code className="text-blue-400">{BASE_DIR}</code>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tên file (tham số ?file=)</Label>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(null); }}
            className="font-mono text-xs"
            placeholder="../../etc/passwd"
          />
          <Button size="sm" onClick={fetchFile} variant="destructive">Đọc file</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => { setInput(ex); setResult(null); }}
            className="rounded border border-border/30 px-2 py-1 text-xs font-mono hover:bg-muted/20"
          >
            {ex}
          </button>
        ))}
      </div>

      {result && (
        <div className={`rounded border p-4 space-y-3 ${
          result.danger ? 'border-red-500/40 bg-red-950/10' : 'border-green-500/30 bg-green-950/10'
        }`}>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Đường dẫn thực tế:</p>
            <code className={`text-xs font-mono ${result.danger ? 'text-red-400' : 'text-green-400'}`}>
              {result.path}
            </code>
            {result.danger && (
              <p className="text-xs text-red-400">🔴 Nằm ngoài base directory! Path traversal thành công</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Nội dung file:</p>
            <pre className={`text-xs font-mono whitespace-pre-wrap rounded bg-black/40 p-3 ${
              result.danger ? 'text-red-300' : 'text-muted-foreground'
            }`}>
              {result.content}
            </pre>
          </div>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable:</p>
        <code className="text-muted-foreground">{'const path = BASE_DIR + req.query.file;\nfs.readFile(path, callback);'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed:</p>
        <code className="text-muted-foreground">
          {'const resolved = path.resolve(BASE_DIR, req.query.file);\nif (!resolved.startsWith(BASE_DIR)) throw Error("Forbidden");'}
        </code>
      </div>
    </div>
  );
}
