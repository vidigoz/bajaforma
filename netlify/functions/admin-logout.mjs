import { clearSessionCookie, json } from './_lib/auth.mjs';

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, { status: 405 });
  }
  return json({ ok: true }, { headers: { 'set-cookie': clearSessionCookie() } });
};

export const config = { path: '/api/admin/logout' };
