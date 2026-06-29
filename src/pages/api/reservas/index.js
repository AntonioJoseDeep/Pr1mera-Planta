import { reservasDelDia, slotsConDisponibilidad, crearReserva } from '../../../lib/reservas.js';
import { isAuthenticated } from '../../../lib/session.js';
import { enviarEmailConfirmacion } from '../../../lib/email.js';

export const prerender = false;

export async function GET({ url, cookies }) {
  const fecha = url.searchParams.get('fecha');
  if (!fecha) {
    return new Response(JSON.stringify({ error: 'Falta el parámetro fecha' }), { status: 400 });
  }

  const slots = await slotsConDisponibilidad(fecha);
  if (!isAuthenticated(cookies)) {
    return new Response(JSON.stringify({ slots }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(
    JSON.stringify({ reservas: await reservasDelDia(fecha), slots }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST({ request }) {
  const body = await request.json();
  const { nombre, telefono, email, fecha, hora, personas } = body;

  if (!nombre || nombre.trim().length < 3) {
    return new Response(JSON.stringify({ ok: false, motivo: 'Introduce tu nombre completo.' }), { status: 400 });
  }
  const phoneDigits = String(telefono || '').replace(/\s+/g, '');
  if (!/^[6-9]\d{8}$/.test(phoneDigits)) {
    return new Response(JSON.stringify({ ok: false, motivo: 'Introduce un teléfono válido (9 dígitos).' }), { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())) {
    return new Response(JSON.stringify({ ok: false, motivo: 'Introduce un correo electrónico válido.' }), { status: 400 });
  }
  if (!personas || !fecha || !hora) {
    return new Response(JSON.stringify({ ok: false, motivo: 'Faltan datos de la reserva.' }), { status: 400 });
  }

  const resultado = await crearReserva({
    nombre: nombre.trim(),
    telefono: phoneDigits,
    email: email.trim(),
    fecha,
    hora,
    personas,
  });

  if (resultado.ok) {
    enviarEmailConfirmacion(resultado.reserva).catch(() => {});
  }

  return new Response(JSON.stringify(resultado), {
    status: resultado.ok ? 200 : 409,
    headers: { 'Content-Type': 'application/json' },
  });
}
