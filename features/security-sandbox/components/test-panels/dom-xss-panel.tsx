'use client';
// features/security-sandbox/components/test-panels/dom-xss-panel.tsx

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DomXssPanel() {
  const [hashValue, setHashValue] = useState('<img src=x onerror="alert(\'DOM XSS!\')">');
  const [triggered, setTriggered] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const simulate = () => {
    // Simulate: window.location.hash → innerHTML (DOM sink)
    if (outputRef.current) {
      outputRef.current.innerHTML = hashValue; // vulnerable DOM sink
    }
    if (hashValue.includes('onerror') || hashValue.toLowerCase().includes('<script>') || hashValue.includes('onload')) {
      setTriggered(true);
      setTimeout(() => setTriggered(false), 3000);
    }
  };

  const clear = () => {
    if (outputRef.current) outputRef.current.innerHTML = '';
    setTriggered(false);
    setHashValue('');
  };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng:</strong> Giá trị từ <code>window.location.hash</code> được gán trực tiếp vào <code>element.innerHTML</code> mà không qua bất kỳ kiểm tra nào — tấn công hoàn toàn client-side.
        </AlertDescription>
      </Alert>

      {triggered && (
        <div className="rounded border border-red-500 bg-red-950/60 p-3 text-sm text-red-300 animate-pulse">
          🔴 <strong>DOM XSS Triggered!</strong> <code>onerror</code> handler đã thực thi
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Giá trị hash URL (<code>#payload</code>)</Label>
        <div className="flex gap-2">
          <Input
            value={hashValue}
            onChange={(e) => setHashValue(e.target.value)}
            placeholder='<img src=x onerror="alert(1)">'
            className="font-mono text-xs"
          />
          <Button size="sm" onClick={simulate} variant="destructive">Inject</Button>
          <Button size="sm" onClick={clear} variant="outline">Clear</Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/30 bg-background p-4">
        <p className="text-xs text-muted-foreground mb-2">DOM Output (<code>div.innerHTML = hash</code>):</p>
        <div ref={outputRef} className="min-h-[40px]" />
      </div>

      <div className="text-xs bg-muted/30 rounded p-3 font-mono space-y-1">
        <p className="text-red-400 font-semibold">Vulnerable code:</p>
        <code className="text-muted-foreground">{'document.getElementById("msg").innerHTML = location.hash.slice(1);'}</code>
        <p className="text-green-400 font-semibold mt-2">Fixed code:</p>
        <code className="text-muted-foreground">{'document.getElementById("msg").textContent = decodeURIComponent(location.hash.slice(1));'}</code>
      </div>
    </div>
  );
}
