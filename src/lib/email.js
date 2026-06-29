const RESEND_API_KEY = process.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || import.meta.env.RESEND_FROM || 'Pr1mera Planta <onboarding@resend.dev>';

function fechaFormateada(fecha) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function plantillaConfirmacion({ nombre, fecha, hora, personas }) {
  const primerNombre = nombre.trim().split(' ')[0];
  return `
    <div style="font-family:sans-serif; background:#19120D; color:#F4E9DA; padding:32px; border-radius:16px;">
      <h2 style="color:#E2A86C; margin-top:0;">Pr1mera Planta</h2>
      <p>Hola ${primerNombre},</p>
      <p>Tu reserva ha quedado confirmada:</p>
      <ul style="line-height:1.6;">
        <li><strong>Fecha:</strong> ${fechaFormateada(fecha)}</li>
        <li><strong>Hora:</strong> ${hora}h</li>
        <li><strong>Personas:</strong> ${personas}</li>
      </ul>
      <p>Te esperamos en el Centro Comercial Green Park Altorreal, Molina de Segura.</p>
      <p style="color:#B6A493; font-size:13px;">Si necesitas cambiar algo, llámanos al 677 40 04 00.</p>
    </div>
  `;
}

function plantillaActualizacion({ nombre, fecha, hora, personas }) {
  const primerNombre = nombre.trim().split(' ')[0];
  return `
    <div style="font-family:sans-serif; background:#19120D; color:#F4E9DA; padding:32px; border-radius:16px;">
      <h2 style="color:#E2A86C; margin-top:0;">Pr1mera Planta</h2>
      <p>Hola ${primerNombre},</p>
      <p>Hemos actualizado tu reserva. Estos son los nuevos datos:</p>
      <ul style="line-height:1.6;">
        <li><strong>Fecha:</strong> ${fechaFormateada(fecha)}</li>
        <li><strong>Hora:</strong> ${hora}h</li>
        <li><strong>Personas:</strong> ${personas}</li>
      </ul>
      <p style="color:#B6A493; font-size:13px;">Si no esperabas este cambio, llámanos al 677 40 04 00.</p>
    </div>
  `;
}

async function enviarEmail(reserva, { subject, html }) {
  if (!RESEND_API_KEY || !reserva.email) return { ok: false, motivo: 'sin-configurar-o-sin-email' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM, to: reserva.email, subject, html }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    return { ok: false, motivo: detalle };
  }
  return { ok: true };
}

export async function enviarEmailConfirmacion(reserva) {
  return enviarEmail(reserva, {
    subject: 'Tu reserva en Pr1mera Planta está confirmada',
    html: plantillaConfirmacion(reserva),
  });
}

export async function enviarEmailActualizacion(reserva) {
  return enviarEmail(reserva, {
    subject: 'Tu reserva en Pr1mera Planta ha sido actualizada',
    html: plantillaActualizacion(reserva),
  });
}
