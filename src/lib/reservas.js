import db from './db.js';

export const P1_TOTAL_MESAS = 20;
export const P1_DURACION_MESA_MIN = 90;
export const P1_SLOTS = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'];
export const P1_DIRECCION = 'C.C. Green Park Altorreal, Av. del Golf, 100, 30506 Molina de Segura, Murcia';
export const P1_TELEFONO = '677400400';

export function reservasDelDia(fecha) {
  return db.prepare(
    `SELECT * FROM reservas WHERE fecha = ? AND estado != 'cancelada' ORDER BY hora ASC`
  ).all(fecha);
}

export function ocupadasEnSlot(fecha, hora) {
  const row = db.prepare(
    `SELECT COUNT(*) AS n FROM reservas WHERE fecha = ? AND hora = ? AND estado != 'cancelada'`
  ).get(fecha, hora);
  return row.n;
}

export function libresEnSlot(fecha, hora) {
  return Math.max(0, P1_TOTAL_MESAS - ocupadasEnSlot(fecha, hora));
}

export function slotsConDisponibilidad(fecha) {
  return P1_SLOTS.map((hora) => {
    const libres = libresEnSlot(fecha, hora);
    return { hora, libres, completo: libres === 0 };
  });
}

export function crearReserva({ nombre, telefono, email, fecha, hora, personas }) {
  if (libresEnSlot(fecha, hora) <= 0) {
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
  db.prepare(
    `INSERT INTO reservas (id, nombre, telefono, email, fecha, hora, personas, estado, creada)
     VALUES (@id, @nombre, @telefono, @email, @fecha, @hora, @personas, @estado, @creada)`
  ).run(reserva);
  return { ok: true, reserva };
}

export function cancelarReserva(id) {
  db.prepare(`UPDATE reservas SET estado = 'cancelada' WHERE id = ?`).run(id);
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
