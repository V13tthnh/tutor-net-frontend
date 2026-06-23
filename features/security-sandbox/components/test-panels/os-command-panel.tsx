'use client';
// features/security-sandbox/components/test-panels/os-command-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MOCK_OUTPUTS: Record<string, string> = {
  'id': 'uid=33(www-data) gid=33(www-data) groups=33(www-data)',
  'whoami': 'www-data',
  'ls /': 'bin  boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  srv  sys  tmp  usr  var',
  'cat /etc/passwd': 'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33::/var/www:/usr/sbin/nologin',
  'cat /var/www/.env': 'DATABASE_URL=postgresql://admin:Sup3rS3cr3t@localhost/tutornet\nJWT_SECRET=my-secret-key',
  'uname -a': 'Linux server-01 5.15.0-91-generic #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023 x86_64 GNU/Linux',
  'ps aux': 'USER  PID  COMMAND\nroot    1   /sbin/init\nwww-data 42  node /var/www/app.js\nnobody  99  postgres',
};

function parseCommand(raw: string): { host: string; injected: string[] } {
  const parts = raw.split(/[;&|]+/).map((s) => s.trim()).filter(Boolean);
  const [host, ...rest] = parts;
  return { host: host ?? '', injected: rest };
}

export function OsCommandPanel() {
  const [input, setInput] = useState('tutornet.vn; id');
  const [output, setOutput] = useState<string[] | null>(null);

  const examples = [
    'tutornet.vn; id',
    'tutornet.vn; whoami',
    'tutornet.vn | ls /',
    'tutornet.vn && cat /etc/passwd',
    'tutornet.vn; cat /var/www/.env',
    'tutornet.vn; uname -a',
  ];

  const run = () => {
    const { host, injected } = parseCommand(input);
    const results: string[] = [];

    // Simulate ping
    results.push(`$ ping -c 1 ${host}`);
    results.push(`PING ${host}: 56 data bytes\n64 bytes: icmp_seq=0 ttl=64\n--- ${host} ping statistics ---\n1 packets transmitted, 1 received`);

    // Simulate injected commands
    for (const cmd of injected) {
      results.push(`\n$ ${cmd}`);
      const out = MOCK_OUTPUTS[cmd.trim()] ?? `sh: ${cmd}: command executed (mock)`;
      results.push(out);
    }

    setOutput(results);
  };

  const reset = () => setOutput(null);

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Input được truyền thẳng vào lệnh shell:{' '}
          <code>{'exec(`ping -c 1 ${userInput}`)'}</code>. Dùng ký tự <code>;</code>{' '}
          <code>|</code> <code>&&</code> để chèn thêm lệnh tùy ý.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Ping target (field bị lỗi)</Label>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(null); }}
            className="font-mono text-xs"
            placeholder="hostname; command"
          />
          <Button size="sm" onClick={run} variant="destructive">Thực thi</Button>
          {output && <Button size="sm" onClick={reset} variant="outline">Reset</Button>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => { setInput(ex); setOutput(null); }}
            className="rounded border border-border/30 px-2 py-1 text-xs font-mono hover:bg-muted/20"
          >
            {ex}
          </button>
        ))}
      </div>

      <div className="rounded border border-border/20 bg-muted/10 p-3 text-xs">
        <p className="text-muted-foreground mb-1">Server thực thi:</p>
        <code className="text-orange-400">exec(`ping -c 1 {input}`)</code>
      </div>

      {output && (
        <div className="rounded border border-red-500/40 bg-black/60 p-4">
          <p className="text-xs text-red-400 font-semibold mb-3">🔴 Command Injection thành công:</p>
          <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
            {output.join('\n')}
          </pre>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable:</p>
        <code className="text-muted-foreground">{'exec(`ping -c 1 ${req.body.host}`, callback)'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed: Dùng execFile + whitelist</p>
        <code className="text-muted-foreground">
          {'// Validate: /^[a-zA-Z0-9._-]+$/.test(host)\nexecFile("ping", ["-c", "1", host], callback)'}
        </code>
      </div>
    </div>
  );
}
