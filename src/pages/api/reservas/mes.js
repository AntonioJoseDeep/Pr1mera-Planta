import { conteoPorDiaEnMes } from '../../../lib/reservas.js';
import { isAuthenticated } from '../../../lib/session.js';

export const prerender = false;

export async function GET({ url, cookies }) {
  if (!isAuthenticated(cookies)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const anio = Number(url.searchParams.get('anio'));
  const mes = Number(url.searchParams.get('mes'));
  if (!anio || !mes) {
    return new Response(JSON.stringify({ error: 'Faltan los parámetros anio y mes' }), { status: 400 });
  }
  return new Response(JSON.stringify({ conteo: await conteoPorDiaEnMes(anio, mes) }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
