import { createSessionCookie, passwordMatches, json } from './_lib/auth.mjs';

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, { status: 405 });
  }

  const password = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!password || !secret) {
    return json(
      { error: 'El dashboard no está configurado (falta DASHBOARD_PASSWORD o DASHBOARD_SESSION_SECRET).' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Datos inválidos.' }, { status: 400 });
  }

  if (!passwordMatches(body.password, password)) {
    return json({ error: 'Contraseña incorrecta.' }, { status: 401 });
  }

  return json(
    { ok: true },
    { headers: { 'set-cookie': createSessionCookie(secret) } }
  );
};

export const config = { path: '/api/admin/login' };
