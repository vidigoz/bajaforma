// Dispara un rebuild+deploy en Netlify vía Build Hook. Los cambios guardados
// en Neon no se ven en el sitio público hasta que esto corre (o hasta el
// próximo deploy normal) — el sitio sigue siendo estático.

import { requireAuth, json } from './_lib/auth.mjs';

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, { status: 405 });
  }
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;

  const hookUrl = process.env.NETLIFY_BUILD_HOOK_URL;
  if (!hookUrl) {
    return json({
      ok: true,
      triggered: false,
      message:
        'Guardado en la base de datos. Falta configurar NETLIFY_BUILD_HOOK_URL para publicar automático — mientras tanto, haz un deploy manual desde Netlify.'
    });
  }

  try {
    const res = await fetch(hookUrl, { method: 'POST' });
    if (!res.ok) throw new Error(`Netlify respondió ${res.status}`);
    return json({ ok: true, triggered: true, message: 'Publicando… tarda entre 30 y 60 segundos.' });
  } catch (err) {
    return json({ error: 'No se pudo disparar el build: ' + err.message }, { status: 502 });
  }
};

export const config = { path: '/api/admin/publish' };
