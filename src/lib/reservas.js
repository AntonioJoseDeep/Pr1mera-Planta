import db from './db.js';

export const P1_TOTAL_MESAS = 20;
export const P1_DURACION_MESA_MIN = 90;
export const P1_SLOTS = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'];
export const P1_DIRECCION = 'C.C. Green Park Altorreal, Av. del Golf, 100, 30506 Molina de Segura, Murcia';
export const P1_TELEFONO = '677400400';

export async function reservasDelDia(fecha) {
  const { rows } = await db.execute({
    sql: `SELECT * FROM reservas WHERE fecha = ? AND estado != 'cancelada' ORDER BY hora ASC`,
    args: [fecha],
  });
  return rows;
}

export async function ocupadasEnSlot(fecha, hora, excluirId = null) {
  const { rows } = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM reservas WHERE fecha = ? AND hora = ? AND estado != 'cancelada' AND id != ?`,
    args: [fecha, hora, excluirId || ''],
  });
  return Number(rows[0].n);
}

export async function libresEnSlot(fecha, hora, excluirId = null) {
  return Math.max(0, P1_TOTAL_MESAS - (await ocupadasEnSlot(fecha, hora, excluirId)));
}

export async function slotsConDisponibilidad(fecha) {
  return Promise.all(
    P1_SLOTS.map(async (hora) => {
      const libres = await libresEnSlot(fecha, hora);
      return { hora, libres, completo: libres === 0 };
    })
  );
}

export async function crearReserva({ nombre, telefono, email, fecha, hora, personas }) {
  if ((await libresEnSlot(fecha, hora)) <= 0) {
    return { ok: false, motivo: 'Ese turno se ha completado mientras rellenabas el formulario. Elige otra hora.' };
  }
  const reserva = {
    id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    nombre,
    telefono,
    email: email || '',
    fecha,
    hora,
    personas,
    estado: 'confirmada',
    creada: new Date().toISOString(),
  };
  await db.execute({
    sql: `INSERT INTO reservas (id, nombre, telefono, email, fecha, hora, personas, estado, creada)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [reserva.id, reserva.nombre, reserva.telefono, reserva.email, reserva.fecha, reserva.hora, reserva.personas, reserva.estado, reserva.creada],
  });
  return { ok: true, reserva };
}

export async function conteoPorDiaEnMes(anio, mes) {
  const prefijo = `${anio}-${String(mes).padStart(2, '0')}`;
  const { rows } = await db.execute({
    sql: `SELECT fecha, COUNT(*) AS n FROM reservas WHERE fecha LIKE ? AND estado != 'cancelada' GROUP BY fecha`,
    args: [prefijo + '%'],
  });
  const conteo = {};
  rows.forEach((r) => { conteo[r.fecha] = Number(r.n); });
  return conteo;
}

export async function obtenerReserva(id) {
  const { rows } = await db.execute({ sql: `SELECT * FROM reservas WHERE id = ?`, args: [id] });
  return rows[0] || null;
}

export async function editarReserva(id, { fecha, hora, personas }) {
  const reserva = await obtenerReserva(id);
  if (!reserva) {
    return { ok: false, motivo: 'La reserva no existe.' };
  }

  const nuevaFecha = fecha || reserva.fecha;
  const nuevaHora = hora || reserva.hora;
  const nuevasPersonas = personas || reserva.personas;

  const cambiaTurno = nuevaFecha !== reserva.fecha || nuevaHora !== reserva.hora;
  if (cambiaTurno && (await libresEnSlot(nuevaFecha, nuevaHora, id)) <= 0) {
    return { ok: false, motivo: 'Ese turno ya está completo. Elige otra hora.' };
  }

  await db.execute({
    sql: `UPDATE reservas SET fecha = ?, hora = ?, personas = ? WHERE id = ?`,
    args: [nuevaFecha, nuevaHora, nuevasPersonas, id],
  });

  return { ok: true, reserva: await obtenerReserva(id) };
}

export async function cancelarReserva(id) {
  await db.execute({ sql: `UPDATE reservas SET estado = 'cancelada' WHERE id = ?`, args: [id] });
}

export function linkGoogleCalendar({ nombre, fecha, hora, personas }) {
  const [h, m] = hora.split(':').map(Number);
  const start = new Date(fecha + 'T00:00:00');
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + P1_DURACION_MESA_MIN * 60000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Reserva Pr1mera Planta — ' + nombre,
    dates: fmt(start) + '/' + fmt(end),
    details: 'Reserva para ' + personas + ' en Pr1mera Planta. Teléfono del restaurante: ' + P1_TELEFONO,
    location: P1_DIRECCION,
  });

  return 'https://calendar.google.com/calendar/render?' + params.toString();
}
