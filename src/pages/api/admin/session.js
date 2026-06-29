import { isAuthenticated } from '../../../lib/session.js';

export const prerender = false;

export async function GET({ cookies }) {
  return new Response(JSON.stringify({ authenticated: isAuthenticated(cookies) }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
