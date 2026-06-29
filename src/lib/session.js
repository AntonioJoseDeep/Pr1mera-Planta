import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = import.meta.env.SESSION_SECRET || 'dev-only-insecure-secret';
const COOKIE_NAME = 'p1_admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

function sign(value) {
  return createHmac('sha256', SECRET).update(value).digest('hex');
}

export function createSessionCookieValue() {
  const payload = String(Date.now());
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionCookieValue(value) {
  if (!value) return false;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const issuedAt = Number(payload);
  if (!issuedAt || Date.now() - issuedAt > MAX_AGE_SECONDS * 1000) return false;

  return true;
}

export function isAuthenticated(cookies) {
  return isValidSessionCookieValue(cookies.get(COOKIE_NAME)?.value);
}

export function setSessionCookie(cookies) {
  cookies.set(COOKIE_NAME, createSessionCookieValue(), {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(cookies) {
  cookies.delete(COOKIE_NAME, { path: '/' });
}
