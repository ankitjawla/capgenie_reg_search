// Lightweight same-origin / allow-list check for POST endpoints. We can't
// rely on CSRF tokens for a mostly-anonymous public app, but we can reject
// unknown Origin headers — which blocks basic browser-driven cross-origin
// abuse without impacting curl / Postman smoke tests (they don't send an
// Origin header).

const ALLOWED_HOSTS = [
  'capgenie-reg-search.vercel.app',
  // Any Vercel preview URL for this project.
  /^capgenie-reg-search-[a-z0-9-]+-ankitjawlas-projects\.vercel\.app$/,
  // Local dev.
  'localhost:3000',
  '127.0.0.1:3000',
];

export function isOriginAllowed(req: Request): boolean {
  const origin = req.headers.get('origin');
  // curl / server-to-server: no Origin header → allow (we still have the
  // rate limiter as a backstop).
  if (!origin) return true;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  for (const h of ALLOWED_HOSTS) {
    if (typeof h === 'string' ? host === h : h.test(host)) return true;
  }
  return false;
}
