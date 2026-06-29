'use client';
// features/security-sandbox/components/test-panels/html-injection-panel.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function HtmlInjectionPanel() {
  const [input, setInput] = useState('<h1 style="color:red">Injected!</h1><marquee>Hacked!</marquee>');
  const [rendered, setRendered] = useState('');

  const run = () => setRendered(input);
  const clear = () => { setRendered(''); setInput(''); };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/30 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
          <strong>Mô phỏng:</strong> Input của người dùng được render trực tiếp vào DOM qua <code>dangerouslySetInnerHTML</code> mà không qua sanitize. Thử nhập thẻ HTML tùy ý.
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Payload HTML</Label>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='<h1>Injected</h1>'
            className="font-mono text-xs"
          />
          <Button size="sm" onClick={run} variant="destructive">Inject</Button>
          <Button size="sm" onClick={clear} variant="outline">Clear</Button>
        </div>
      </div>
      {rendered && (
        <div className="rounded-lg border border-red-500/40 bg-background p-4">
          <p className="text-xs text-muted-foreground mb-2">Output (DOM bị inject):</p>
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: rendered }} />
        </div>
      )}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3 font-mono">
        <p className="text-red-400 font-semibold mb-1">Vulnerable code:</p>
        <code>{'<div dangerouslySetInnerHTML={{ __html: userInput }} />'}</code>
        <p className="text-green-400 font-semibold mt-2 mb-1">Fixed code:</p>
        <code>{'<div>{DOMPurify.sanitize(userInput)}</div>'}</code>
      </div>
    </div>
  );
}
