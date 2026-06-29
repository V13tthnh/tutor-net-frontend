/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

let backendOrigin = 'http://127.0.0.1:8080';
try {
  backendOrigin = new URL(
    process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1'
  ).origin;
} catch (e) {
  // Use fallback
}

const wsScheme = isDev ? 'ws' : 'wss';
const wsOrigin = backendOrigin.replace(/^https?/, wsScheme);

const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const devWsOrigin = appOrigin.replace(/^https?/, wsScheme);

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com" + (isDev ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${backendOrigin} ${wsOrigin} ${appOrigin} ${devWsOrigin} https://www.google.com`,
  "frame-src 'self' https://www.google.com https://recaptcha.google.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
].join('; ');

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
          ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
        ],
      },
    ];
  },
};

export default nextConfig;
