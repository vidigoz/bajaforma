// CRUD de bloques/secciones dentro de una página libre (tabla `page_blocks`).
// GET ?page_id=123 lista los bloques de esa página.

import { neon } from '@neondatabase/serverless';
import { requireAuth, json } from './_lib/auth.mjs';

const VALID_TYPES = new Set(['heading_text', 'faq', 'cta']);

export default async (req) => {
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;

  if (!process.env.DATABASE_URL) {
    return json({ error: 'DATABASE_URL no está configurada.' }, { status: 500 });
  }
  const sql = neon(process.env.DATABASE_URL);
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const pageId = url.searchParams.get('page_id');
    if (!pageId) return json({ error: 'Falta page_id.' }, { status: 400 });
    const blocks = await sql`
      select id, page_id, position, type, content
      from page_blocks where page_id = ${pageId}
      order by position asc, id asc
    `;
    return json({ blocks });
  }

  if (req.method === 'POST') {
    const b = await req.json().catch(() => ({}));
    if (!b.page_id || !VALID_TYPES.has(b.type)) {
      return json({ error: 'Falta page_id o el tipo de bloque no es válido.' }, { status: 400 });
    }
    const [row] = await sql`
      insert into page_blocks (page_id, position, type, content)
      values (${b.page_id}, ${b.position ?? 0}, ${b.type}, ${JSON.stringify(b.content || {})}::jsonb)
      returning id, page_id, position, type, content
    `;
    return json({ block: row }, { status: 201 });
  }

  if (req.method === 'PUT') {
    const b = await req.json().catch(() => ({}));
    if (!b.id) return json({ error: 'Falta id.' }, { status: 400 });
    const [row] = await sql`
      update page_blocks set
        position = ${b.position ?? 0},
        content = ${JSON.stringify(b.content || {})}::jsonb,
        updated_at = now()
      where id = ${b.id}
      returning id, page_id, position, type, content
    `;
    if (!row) return json({ error: 'No existe ese bloque.' }, { status: 404 });
    return json({ block: row });
  }

  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Falta id.' }, { status: 400 });
    await sql`delete from page_blocks where id = ${id}`;
    return json({ ok: true });
  }

  return json({ error: 'Método no permitido.' }, { status: 405 });
};

export const config = { path: '/api/admin/blocks' };
