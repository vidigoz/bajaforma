// CRUD de páginas libres (tabla `pages`). Los bloques de cada página se
// manejan en admin-blocks.mjs.

import { neon } from '@neondatabase/serverless';
import { requireAuth, json } from './_lib/auth.mjs';

export default async (req) => {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;

  if (!process.env.DATABASE_URL) {
    return json({ error: 'DATABASE_URL no está configurada.' }, { status: 500 });
  }
  const sql = neon(process.env.DATABASE_URL);
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const pages = await sql`
      select id, slug, title, meta_description, nav_label, published, sort_order
      from pages order by sort_order asc, id asc
    `;
    return json({ pages });
  }

  if (req.method === 'POST') {
    const b = await req.json().catch(() => ({}));
    if (!b.slug || !b.title) return json({ error: 'Falta slug o título.' }, { status: 400 });
    try {
      const [row] = await sql`
        insert into pages (slug, title, meta_description, nav_label, published, sort_order)
        values (${b.slug}, ${b.title}, ${b.meta_description || ''}, ${b.nav_label || null}, ${b.published ?? true}, ${b.sort_order ?? 0})
        returning id, slug, title, meta_description, nav_label, published, sort_order
      `;
      return json({ page: row }, { status: 201 });
    } catch (err) {
      return json({ error: err.message.includes('unique') ? 'Ya existe una página con ese slug.' : err.message }, { status: 400 });
    }
  }

  if (req.method === 'PUT') {
    const b = await req.json().catch(() => ({}));
    if (!b.id) return json({ error: 'Falta id.' }, { status: 400 });
    const [row] = await sql`
      update pages set
        slug = ${b.slug},
        title = ${b.title},
        meta_description = ${b.meta_description || ''},
        nav_label = ${b.nav_label || null},
        published = ${b.published ?? true},
        sort_order = ${b.sort_order ?? 0},
        updated_at = now()
      where id = ${b.id}
      returning id, slug, title, meta_description, nav_label, published, sort_order
    `;
    if (!row) return json({ error: 'No existe esa página.' }, { status: 404 });
    return json({ page: row });
  }

  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Falta id.' }, { status: 400 });
    await sql`delete from pages where id = ${id}`;
    return json({ ok: true });
  }

  return json({ error: 'Método no permitido.' }, { status: 405 });
};

export const config = { path: '/api/admin/pages' };
