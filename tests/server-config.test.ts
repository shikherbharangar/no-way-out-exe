import { describe, expect, it } from 'vitest';
import { serverConfig } from '../server/config';
describe('production host configuration', () => {
 it('requires HTTPS origins in production and rejects missing or wildcard configuration', () => {
  for(const origin of ['', '*', 'https://*.vercel.app', 'https://game.vercel.app/', 'http://game.vercel.app']) {
   expect(()=>serverConfig({NODE_ENV:'production',ALLOWED_ORIGIN:origin})).toThrow();
  }
 });
 it('accepts only exact allowed origins including comma-separated, trimmed values', () => {
  const c=serverConfig({NODE_ENV:'production',PORT:'10000',ALLOWED_ORIGIN:' https://game.vercel.app , https://play.example '});
  expect(c.port).toBe(10000);expect(c.acceptsOrigin('https://game.vercel.app')).toBe(true);
  for(const origin of ['', 'null', 'https://other.vercel.app', 'https://game.vercel.app.evil.test'])expect(c.acceptsOrigin(origin)).toBe(false);
 });
 it('allows unconfigured local development and validates platform ports', () => {
  expect(serverConfig({}).acceptsOrigin('')).toBe(true);
  for(const port of ['abc','-1','65536','80.5'])expect(()=>serverConfig({PORT:port})).toThrow();
 });
});
