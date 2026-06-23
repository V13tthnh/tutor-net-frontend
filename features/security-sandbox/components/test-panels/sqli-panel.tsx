'use client';
// features/security-sandbox/components/test-panels/sqli-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MOCK_USERS = [
  { id: 1, email: 'admin@tutornet.vn', password: 'hashed_secret', role: 'ADMIN' },
  { id: 2, email: 'alice@tutornet.vn', password: 'hashed_abc123', role: 'STUDENT' },
  { id: 3, email: 'bob@tutornet.vn',   password: 'hashed_xyz789', role: 'TUTOR' },
];

export function SqliPanel() {
  const [input, setInput] = useState("' UNION SELECT id, email, password, role FROM users --");
  const [result, setResult] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [triggered, setTriggered] = useState(false);

  const run = () => {
    const raw = `SELECT * FROM tutors WHERE name = '${input}'`;
    setQuery(raw);

    if (input.toUpperCase().includes('UNION') && input.toUpperCase().includes('SELECT')) {
      setResult(MOCK_USERS);
      setTriggered(true);
    } else {
      setResult([]);
      setTriggered(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Input được nối chuỗi trực tiếp vào SQL query. UNION SELECT cho phép lấy dữ liệu từ bảng <code>users</code> bao gồm password hash.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tên gia sư (search parameter)</Label>
        <div className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} className="font-mono text-xs" />
          <Button size="sm" onClick={run} variant="destructive">Thực thi</Button>
        </div>
      </div>

      {query && (
        <div className="bg-muted/30 rounded p-3 text-xs font-mono space-y-1">
          <p className="text-muted-foreground">Query thực thi:</p>
          <code className={`block ${triggered ? 'text-red-400' : 'text-foreground'}`}>{query}</code>
        </div>
      )}

      {triggered && result.length > 0 && (
        <div className="rounded border border-red-500/40 overflow-hidden">
          <p className="text-xs text-red-400 font-semibold px-3 py-2 bg-red-950/40">🔴 Dữ liệu bị rò rỉ qua UNION injection:</p>
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>{Object.keys(result[0]).map((k) => <th key={k} className="px-3 py-2 text-left font-mono text-muted-foreground">{k}</th>)}</tr>
            </thead>
            <tbody>
              {result.map((row, i) => (
                <tr key={i} className="border-t border-border/20">
                  {Object.values(row).map((v, j) => (
                    <td key={j} className="px-3 py-2 font-mono text-red-300">{String(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable:</p>
        <code className="text-muted-foreground">{'`SELECT * FROM tutors WHERE name = \'${input}\'`'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed:</p>
        <code className="text-muted-foreground">{'db.query("SELECT * FROM tutors WHERE name = ?", [input])'}</code>
      </div>
    </div>
  );
}
