'use client';
// features/security-sandbox/components/security-sandbox-client.tsx

import { useState, useMemo } from 'react';
import { useSecurityFlags } from '@/hooks/use-security-flags';
import {
  VULNERABILITY_LIST,
  VULNERABILITY_CATEGORIES,
  type SecurityFlag,
  type VulnCategory,
  type Severity,
} from '@/features/security-sandbox/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HtmlInjectionPanel,
  ReflectedXssPanel,
  StoredXssPanel,
  DomXssPanel,
  BypassLoginPanel,
  SqliPanel,
  WeakPasswordPanel,
  BruteForcePanel,
  CredentialStuffingPanel,
  SessionHijackingPanel,
  SessionFixationPanel,
  GetCsrfPanel,
  PostCsrfPanel,
  UploadWebshellPanel,
  MimeSpoofingPanel,
  ExtBypassPanel,
  PathTraversalPanel,
  OsCommandPanel,
  MissingAuthPanel,
  BolaPanel,
  BypassAuthPanel,
  BruteSecretKeyPanel,
} from '@/features/security-sandbox/components/test-panels';

// ─── Panel Map ───────────────────────────────────────────────────────────────
const PANEL_MAP: Record<SecurityFlag, React.ReactNode> = {
  html_injection: <HtmlInjectionPanel />,
  reflected_xss: <ReflectedXssPanel />,
  stored_xss: <StoredXssPanel />,
  dom_xss: <DomXssPanel />,
  bypass_login: <BypassLoginPanel />,
  union_sqli: <SqliPanel />,
  weak_password: <WeakPasswordPanel />,
  brute_force: <BruteForcePanel />,
  credential_stuffing: <CredentialStuffingPanel />,
  session_hijacking: <SessionHijackingPanel />,
  session_fixation: <SessionFixationPanel />,
  get_csrf: <GetCsrfPanel />,
  post_csrf: <PostCsrfPanel />,
  upload_webshell: <UploadWebshellPanel />,
  mime_spoofing: <MimeSpoofingPanel />,
  ext_bypass: <ExtBypassPanel />,
  path_traversal: <PathTraversalPanel />,
  os_command: <OsCommandPanel />,
  missing_auth: <MissingAuthPanel />,
  bola: <BolaPanel />,
  bypass_auth: <BypassAuthPanel />,
  brute_secret_key: <BruteSecretKeyPanel />,
};

// ─── Severity helpers ────────────────────────────────────────────────────────
const SEVERITY_COLOR: Record<Severity, string> = {
  Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const CATEGORY_COLOR: Record<VulnCategory, string> = {
  Injection: 'text-purple-400',
  Authentication: 'text-blue-400',
  Session: 'text-cyan-400',
  CSRF: 'text-amber-400',
  'File Upload': 'text-orange-400',
  'Access Control': 'text-rose-400',
};

const CATEGORY_ICON: Record<VulnCategory, string> = {
  Injection: '💉',
  Authentication: '🔑',
  Session: '🍪',
  CSRF: '🎭',
  'File Upload': '📁',
  'Access Control': '🔒',
};

// ─── Component ───────────────────────────────────────────────────────────────
export function SecuritySandboxClient() {
  const { flags, isLoading, toggle, enableAll, resetAll } = useSecurityFlags();
  const [selected, setSelected] = useState<SecurityFlag | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<VulnCategory | 'All'>('All');

  const allFlags = VULNERABILITY_LIST.map((v) => v.flag);
  const activeCount = flags.length;

  const filtered = useMemo(() => {
    return VULNERABILITY_LIST.filter((v) => {
      const matchSearch =
        !search ||
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.titleVi.toLowerCase().includes(search.toLowerCase()) ||
        v.cwe.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        activeCategory === 'All' || v.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [search, activeCategory]);

  const selectedMeta = selected ? VULNERABILITY_LIST.find((v) => v.flag === selected) : null;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Status Bar ─── */}
      <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/60 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full transition-colors ${activeCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-sm font-medium">
            {activeCount === 0
              ? 'Sandbox an toàn — không có lỗ hổng nào đang bật'
              : `${activeCount}/22 lỗ hổng đang hoạt động`}
          </span>
          {activeCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              ⚠️ SANDBOX ACTIVE
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-red-500/40 text-red-400 hover:bg-red-950/20"
            onClick={() => enableAll(allFlags)}
          >
            Bật tất cả
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => { resetAll(); setSelected(null); }}
          >
            Reset tất cả
          </Button>
        </div>
      </div>

      {/* ─── Main Layout ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        {/* ─── Left: Vuln List ─── */}
        <div className="flex flex-col gap-3">
          {/* Search & Filter */}
          <div className="space-y-2">
            <Input
              placeholder="Tìm lỗ hổng, CWE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm"
            />
            <div className="flex flex-wrap gap-1.5">
              {(['All', ...VULNERABILITY_CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full border px-3 py-0.5 text-xs transition-all ${activeCategory === cat
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-border/30 text-muted-foreground hover:bg-muted/20'
                    }`}
                >
                  {cat !== 'All' ? `${CATEGORY_ICON[cat as VulnCategory]} ` : ''}{cat}
                </button>
              ))}
            </div>
          </div>

          {/* Vuln cards grouped by category */}
          <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {VULNERABILITY_CATEGORIES.map((category) => {
              const items = filtered.filter((v) => v.category === category);
              if (items.length === 0) return null;
              return (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-sm">{CATEGORY_ICON[category]}</span>
                    <h3 className={`text-xs font-semibold uppercase tracking-wider ${CATEGORY_COLOR[category]}`}>
                      {category}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      ({items.filter((v) => flags.includes(v.flag)).length}/{items.length})
                    </span>
                  </div>
                  {items.map((vuln) => {
                    const isOn = flags.includes(vuln.flag);
                    const isSelected = selected === vuln.flag;
                    return (
                      <div
                        key={vuln.flag}
                        onClick={() => setSelected(isSelected ? null : vuln.flag)}
                        className={`group cursor-pointer rounded-lg border p-3 transition-all ${isSelected
                          ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20'
                          : isOn
                            ? 'border-red-500/30 bg-red-950/10 hover:border-red-500/50'
                            : 'border-border/30 bg-card/40 hover:bg-muted/20'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Toggle */}
                          <div
                            onClick={(e) => { e.stopPropagation(); toggle(vuln.flag); }}
                            className="mt-0.5 flex-shrink-0"
                          >
                            <Switch
                              checked={isOn}
                              onCheckedChange={() => toggle(vuln.flag)}
                              className={isOn ? 'data-[state=checked]:bg-red-500' : ''}
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-medium ${isOn ? 'text-red-300' : 'text-foreground'}`}>
                                {vuln.title}
                              </span>
                              {isOn && (
                                <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${SEVERITY_COLOR[vuln.severity]}`}>
                                {vuln.severity}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{vuln.cwe}</span>
                              <span className="text-[10px] text-muted-foreground">{vuln.owasp}</span>
                            </div>
                          </div>

                          {/* Expand indicator */}
                          <span className={`text-xs text-muted-foreground transition-transform ${isSelected ? 'rotate-180' : ''}`}>
                            ▾
                          </span>
                        </div>

                        {/* Description (shown when selected) */}
                        {isSelected && (
                          <p className="mt-2 text-xs text-muted-foreground leading-relaxed pl-11">
                            {vuln.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="rounded-lg border border-dashed border-border/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">Không tìm thấy lỗ hổng nào</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Test Panel ─── */}
        <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm">
          {selectedMeta ? (
            <div className="flex h-full flex-col">
              {/* Panel Header */}
              <div className={`flex items-start justify-between rounded-t-xl border-b border-border/30 p-4 ${flags.includes(selectedMeta.flag) ? 'bg-red-950/20' : 'bg-muted/10'
                }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{CATEGORY_ICON[selectedMeta.category]}</span>
                    <h2 className="text-base font-bold">{selectedMeta.title}</h2>
                    <span className={`rounded border px-2 py-0.5 text-xs font-medium ${SEVERITY_COLOR[selectedMeta.severity]}`}>
                      {selectedMeta.severity}
                    </span>
                    {flags.includes(selectedMeta.flag) ? (
                      <Badge variant="destructive" className="text-xs">🔴 ENABLED</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">⚫ DISABLED</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{selectedMeta.cwe}</span>
                    <span>•</span>
                    <span>{selectedMeta.owasp}</span>
                    <span>•</span>
                    <span className={CATEGORY_COLOR[selectedMeta.category]}>{selectedMeta.category}</span>
                  </div>
                </div>

                {/* Quick toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {flags.includes(selectedMeta.flag) ? 'Bật' : 'Tắt'}
                  </span>
                  <Switch
                    checked={flags.includes(selectedMeta.flag)}
                    onCheckedChange={() => toggle(selectedMeta.flag)}
                    className={flags.includes(selectedMeta.flag) ? 'data-[state=checked]:bg-red-500' : ''}
                  />
                </div>
              </div>

              {/* Panel warning if disabled */}
              {!flags.includes(selectedMeta.flag) && (
                <div className="mx-4 mt-4 rounded-lg border border-muted/40 bg-muted/10 p-3 text-xs text-muted-foreground flex items-center gap-2">
                  <span className="text-base">⚫</span>
                  <span>
                    Lỗ hổng này đang <strong>tắt</strong>. Bật switch để kích hoạt và xem simulation bên dưới hoạt động.
                  </span>
                </div>
              )}

              {/* Test Panel Content */}
              <div className={`flex-1 overflow-y-auto p-4 transition-opacity ${flags.includes(selectedMeta.flag) ? 'opacity-100' : 'opacity-60 pointer-events-none select-none'
                }`}>
                {PANEL_MAP[selectedMeta.flag]}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 text-5xl">🛡️</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Chọn một lỗ hổng để test
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Bật switch để kích hoạt lỗ hổng, rồi click vào card để xem panel mô phỏng tấn công.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {VULNERABILITY_CATEGORIES.map((cat) => (
                  <div key={cat} className="rounded-lg border border-border/20 bg-muted/10 p-3 text-center">
                    <div className="text-2xl mb-1">{CATEGORY_ICON[cat]}</div>
                    <p className={`text-xs font-medium ${CATEGORY_COLOR[cat]}`}>{cat}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {VULNERABILITY_LIST.filter((v) => v.category === cat).length} lỗi
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
