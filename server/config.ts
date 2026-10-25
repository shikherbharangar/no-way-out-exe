/** Fail closed in production; allow unconfigured localhost tools only in development. */
export function serverConfig(env: NodeJS.ProcessEnv = process.env) {
 const port = Number(env.PORT || 2567);
 if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
 const origins = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
 if (env.NODE_ENV === 'production' && !origins.length) throw new Error('Set ALLOWED_ORIGIN to the exact Vercel HTTPS origin before starting production.');
 for (const origin of origins) {
  let url: URL;
  try { url = new URL(origin); } catch { throw new Error('ALLOWED_ORIGIN must contain comma-separated exact http(s) origins.'); }
  if (origin.includes('*') || !['http:', 'https:'].includes(url.protocol) || url.origin !== origin || url.username || url.password || (env.NODE_ENV === 'production' && url.protocol !== 'https:')) {
   throw new Error('ALLOWED_ORIGIN requires exact origins without paths, wildcards or trailing slashes; production requires HTTPS.');
  }
 }
 return { port, acceptsOrigin: (origin: string) => origins.length ? origins.includes(origin) : true };
}
