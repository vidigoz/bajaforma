import { neon } from '@neondatabase/serverless';
import { requireAuth, json } from './_lib/auth.mjs';

export default async (req) => {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;

  if (!process.env.DATABASE_URL) {
    return json({ error: 'DATABASE_URL no está configurada.' }, { status: 500 });
  }
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    const rows = await sql`select key, value from site_texts order by key asc`;
    return json({ texts: rows });
  }

  if (req.method === 'PUT') {
    const b = await req.json().catch(() => ({}));
    if (!b.key) return json({ error: 'Falta key.' }, { status: 400 });
    await sql`
      insert into site_texts (key, value) values (${b.key}, ${b.value || ''})
      on conflict (key) do update set value = excluded.value, updated_at = now()
    `;
    return json({ ok: true });
  }

  return json({ error: 'Método no permitido.' }, { status: 405 });
};

export const config = { path: '/api/admin/texts' };
