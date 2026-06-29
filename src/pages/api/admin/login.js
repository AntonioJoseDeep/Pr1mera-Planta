import { setSessionCookie } from '../../../lib/session.js';

export const prerender = false;

const ADMIN_PASS = import.meta.env.ADMIN_PASS;

export async function POST({ request, cookies }) {
  const { pass } = await request.json();

  if (typeof pass !== 'string' || !ADMIN_PASS || pass !== ADMIN_PASS) {
    return new Response(JSON.stringify({ ok: false }), { status: 401 });
  }

  setSessionCookie(cookies);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
