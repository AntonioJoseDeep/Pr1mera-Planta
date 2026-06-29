import { cancelarReserva } from '../../../lib/reservas.js';

export const prerender = false;

export async function PATCH({ params }) {
  cancelarReserva(params.id);
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
