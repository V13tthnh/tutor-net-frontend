'use client';
// features/security-sandbox/components/test-panels/sqli-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function SqliPanel() {
  const [input, setInput] = useState("' UNION SELECT id, password_hash, email, phone, avatar_url FROM users --");
  const [result, setResult] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');

  const PRESETS = [
    { label: 'Boolean Bypass (OR 1=1)', value: "' OR '1'='1" },
    { label: 'UNION Injection', value: "' UNION SELECT id, password_hash, email, phone, avatar_url FROM users --" },
    { label: 'Destructive (DROP TABLE)', value: "x'; DROP TABLE users; --" },
  ];

  const testVulnerable = async () => {
    setIsLoading(true);
    setError('');
    setRestoreMessage('');
    try {
      const res = await fetch(`/api/demo/sqli/vulnerable?name=${encodeURIComponent(input)}`);
      const data = await res.json();
      setQuery(data.sql || '');
      if (!res.ok || data.error) {
        setError(data.error || 'Unknown database error');
        setResult([]);
      } else {
        setResult(data.data || []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testSafe = async () => {
    setIsLoading(true);
    setError('');
    setRestoreMessage('');
    try {
      const res = await fetch(`/api/demo/sqli/safe?name=${encodeURIComponent(input)}`);
      const data = await res.json();
      setQuery('SELECT id, full_name, email, avatar_url FROM users WHERE full_name ILIKE :namePattern');
      if (!res.ok || data.error) {
        setError(data.error || 'Unknown database error');
        setResult([]);
      } else {
        setResult(data.data || []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const restoreDb = async () => {
    setIsLoading(true);
    setError('');
    setResult([]);
    setQuery('');
    try {
      const res = await fetch('/api/demo/sqli/restore', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRestoreMessage(data.message);
      } else {
        setError(data.error || 'Failed to restore');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng thực tế:</strong> Input sẽ được gửi đến Backend Spring Boot. Thử chọn các Preset bên dưới để test SQLi.
        </AlertDescription>
      </Alert>

      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((p, idx) => (
          <Button key={idx} variant="outline" size="sm" onClick={() => setInput(p.value)} className="text-[10px] h-7 px-2 py-1">
            {p.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tên gia sư (search parameter)</Label>
        <div className="flex flex-col gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} className="font-mono text-xs" />
          
          <div className="flex gap-2 mt-1">
            <Button size="sm" onClick={testVulnerable} variant="destructive" disabled={isLoading} className="text-xs h-8">
              {isLoading ? 'Đang gọi...' : 'Test Vulnerable API'}
            </Button>
            <Button size="sm" onClick={testSafe} variant="default" disabled={isLoading} className="text-xs h-8">
               {isLoading ? 'Đang gọi...' : 'Test Secured API'}
            </Button>
            <Button size="sm" onClick={restoreDb} variant="outline" disabled={isLoading} className="ml-auto text-xs h-8">
              Khôi phục DB
            </Button>
          </div>
        </div>
      </div>

      {restoreMessage && (
        <div className="bg-green-950/40 border border-green-500/40 rounded p-3 text-xs text-green-400 font-medium">
          ✅ {restoreMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-500/40 rounded p-3 text-xs space-y-1">
          <p className="text-red-400 font-bold flex items-center gap-2">
            <Badge variant="destructive">Lỗi Database</Badge>
          </p>
          <code className="text-red-300 block whitespace-pre-wrap mt-2">{error}</code>
        </div>
      )}

      {query && !error && (
        <div className="bg-muted/30 border border-border/40 rounded p-3 text-xs font-mono space-y-2">
          <p className="text-muted-foreground font-sans font-semibold">Query thực thi trên Backend:</p>
          <code className="text-foreground block whitespace-pre-wrap">{query}</code>
        </div>
      )}

      {!error && result.length > 0 && (
        <div className="rounded border border-red-500/40 overflow-hidden mt-4">
          <div className="px-3 py-2 bg-red-950/40 flex justify-between items-center">
            <p className="text-xs text-red-400 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Dữ liệu trả về từ Database
            </p>
            <Badge variant="outline" className="text-red-400 border-red-400/30 text-[10px]">{result.length} rows</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b border-border/20">
                <tr>
                  {Object.keys(result[0]).map((k) => (
                    <th key={k} className="px-3 py-2 text-left font-mono text-muted-foreground whitespace-nowrap">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 bg-muted/10">
                {result.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-2 font-mono text-red-300 truncate max-w-[200px]" title={String(v)}>
                        {String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!error && query && result.length === 0 && !restoreMessage && (
        <div className="bg-muted/30 border border-border/40 rounded p-3 text-xs text-muted-foreground mt-4 text-center py-6">
          Không có kết quả nào trả về từ DB <br/> (Hoặc SQL Injection đã bị chặn thành công).
        </div>
      )}

      <div className="text-[11px] bg-muted/20 border border-border/20 rounded p-3 font-mono space-y-1 mt-4">
        <p className="text-red-400 font-semibold mb-1">❌ Vulnerable (String concatenation):</p>
        <code className="text-muted-foreground bg-muted/50 px-1 py-0.5 rounded break-all block">
          {"jdbcTemplate.queryForList(\"SELECT ... WHERE full_name ILIKE '%\" + name + \"%'\")"}
        </code>
        <p className="text-green-400 font-semibold mt-3 mb-1">✅ Fixed (Parameterized Query):</p>
        <code className="text-muted-foreground bg-muted/50 px-1 py-0.5 rounded break-all block">
          {"em.createNativeQuery(sql).setParameter(\"namePattern\", \"%\" + name + \"%\")"}
        </code>
      </div>
    </div>
  );
}
