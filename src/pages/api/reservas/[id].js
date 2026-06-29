import { cancelarReserva, editarReserva } from '../../../lib/reservas.js';
import { isAuthenticated } from '../../../lib/session.js';
import { enviarEmailActualizacion } from '../../../lib/email.js';

export const prerender = false;

export async function PATCH({ params, request, cookies }) {
  if (!isAuthenticated(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.action === 'editar') {
    const resultado = await editarReserva(params.id, {
      fecha: body.fecha,
      hora: body.hora,
      personas: body.personas,
    });
    if (resultado.ok) {
      enviarEmailActualizacion(resultado.reserva).catch(() => {});
    }
    return new Response(JSON.stringify(resultado), {
      status: resultado.ok ? 200 : 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await cancelarReserva(params.id);
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
