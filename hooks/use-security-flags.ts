'use client';

// hooks/use-security-flags.ts
import { useState, useEffect, useCallback } from 'react';
import type { SecurityFlag } from '@/features/security-sandbox/types';

interface UseSandboxReturn {
  flags: SecurityFlag[];
  isActive: boolean;
  isLoading: boolean;
  toggle: (flag: SecurityFlag) => Promise<void>;
  enableAll: (allFlags: SecurityFlag[]) => Promise<void>;
  resetAll: () => Promise<void>;
  setFlags: (flags: SecurityFlag[]) => Promise<void>;
}

export function useSecurityFlags(): UseSandboxReturn {
  const [flags, setFlagsState] = useState<SecurityFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load flags on mount
  useEffect(() => {
    fetch('/api/security-flags', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setFlagsState(data.flags ?? []);
      })
      .catch(() => setFlagsState([]))
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (newFlags: SecurityFlag[]) => {
    setFlagsState(newFlags); // optimistic update
    try {
      const res = await fetch('/api/security-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flags: newFlags }),
      });
      const data = await res.json();
      if (data.flags) setFlagsState(data.flags);
    } catch {
      // revert on error — refetch
      fetch('/api/security-flags')
        .then((r) => r.json())
        .then((data) => setFlagsState(data.flags ?? []));
    }
  }, []);

  const toggle = useCallback(
    async (flag: SecurityFlag) => {
      const current = flags;
      const next = current.includes(flag)
        ? current.filter((f) => f !== flag)
        : [...current, flag];
      await persist(next);
    },
    [flags, persist]
  );

  const enableAll = useCallback(
    async (allFlags: SecurityFlag[]) => {
      await persist(allFlags);
    },
    [persist]
  );

  const resetAll = useCallback(async () => {
    setFlagsState([]);
    try {
      await fetch('/api/security-flags', { method: 'DELETE' });
    } catch {}
  }, []);

  const setFlags = useCallback(
    async (newFlags: SecurityFlag[]) => {
      await persist(newFlags);
    },
    [persist]
  );

  return {
    flags,
    isActive: flags.length > 0,
    isLoading,
    toggle,
    enableAll,
    resetAll,
    setFlags,
  };
}
