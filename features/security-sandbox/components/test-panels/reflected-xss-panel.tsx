'use client';
// features/security-sandbox/components/test-panels/reflected-xss-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ReflectedXssPanel() {
  const [query, setQuery] = useState('<script>alert("XSS")</script>');
  const [reflected, setReflected] = useState('');
  const [alerted, setAlerted] = useState(false);

  const search = () => {
    setReflected(query);
    // Simulate script execution alert
    if (query.toLowerCase().includes('<script>') || query.includes('onerror') || query.includes('onload')) {
      setAlerted(true);
      setTimeout(() => setAlerted(false), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertDescription className="text-yellow-300 text-xs">
          <strong>Mô phỏng:</strong> Giá trị search query được phản chiếu trực tiếp vào trang mà không encode. Server trả HTML có chứa payload của kẻ tấn công.
        </AlertDescription>
      </Alert>

      {alerted && (
        <div className="rounded border border-red-500 bg-red-950/60 p-3 text-sm text-red-300 animate-pulse">
          🔴 <strong>XSS Triggered!</strong> Script đã được thực thi — <code>alert("XSS")</code>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Search query (URL param ?q=)</Label>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='<script>alert(1)</script>'
            className="font-mono text-xs"
          />
          <Button size="sm" onClick={search} variant="destructive">Search</Button>
        </div>
      </div>

      {reflected && (
        <div className="rounded-lg border border-red-500/40 bg-background p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Server response (raw HTML — không encoded):</p>
          <div className="font-mono text-xs text-red-300 bg-muted/30 rounded p-2">
            {`<p>Kết quả tìm kiếm cho: `}
            <span className="text-red-400 font-bold">{reflected}</span>
            {`</p>`}
          </div>
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: `<p class="text-sm">Kết quả cho: ${reflected}</p>` }} />
        </div>
      )}

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable:</p>
        <code className="text-muted-foreground">{'res.send(`<p>Results for: ${req.query.q}</p>`)'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed:</p>
        <code className="text-muted-foreground">{'res.send(`<p>Results for: ${escapeHtml(req.query.q)}</p>`)'}</code>
      </div>
    </div>
  );
}
