// features/security-sandbox/components/test-panels/index.ts
// Barrel export for all 22 vulnerability test panels

export { HtmlInjectionPanel } from './html-injection-panel';
export { ReflectedXssPanel } from './reflected-xss-panel';
export { StoredXssPanel } from './stored-xss-panel';
export { DomXssPanel } from './dom-xss-panel';
export { BypassLoginPanel } from './bypass-login-panel';
export { SqliPanel } from './sqli-panel';
export { WeakPasswordPanel } from './weak-password-panel';
export { BruteForcePanel } from './brute-force-panel';
export { CredentialStuffingPanel } from './credential-stuffing-panel';
export { SessionHijackingPanel } from './session-hijacking-panel';
export { SessionFixationPanel } from './session-fixation-panel';
export { GetCsrfPanel } from './get-csrf-panel';
export { PostCsrfPanel } from './post-csrf-panel';
export { UploadWebshellPanel } from './upload-webshell-panel';
export { MimeSpoofingPanel } from './mime-spoofing-panel';
export { ExtBypassPanel } from './ext-bypass-panel';
export { PathTraversalPanel } from './path-traversal-panel';
export { OsCommandPanel } from './os-command-panel';
export { MissingAuthPanel } from './missing-auth-panel';
export { BolaPanel } from './bola-panel';
export { BypassAuthPanel } from './bypass-auth-panel';
export { BruteSecretKeyPanel } from './brute-secret-key-panel';
