// CRUD del catálogo de /productos/ para el dashboard. Todo requiere sesión
// (el catálogo público en sí lo lee Astro directo de Neon en build, no por aquí).

import { neon } from '@neondatabase/serverless';
import { getStore } from '@netlify/blobs';
import { requireAuth, json } from './_lib/auth.mjs';

function db() {
  return neon(process.env.DATABASE_URL);
}

async function deleteImage(key) {
  if (!key) return;
  await getStore('product-images').delete(key).catch(() => {});
}

export default async (req) => {
  if (!process.env.DATABASE_URL) {
    return json({ error: 'DATABASE_URL no está configurada.' }, { status: 500 });
  }

  const url = new URL(req.url);

  if (req.method === 'GET') {
    const unauthorized = requireAuth(req);
    if (unauthorized) return unauthorized;
    const sql = db();
    const rows = await sql`
      select id, slug, name, short_description, emoji, image_key, tool_url, status, sort_order
      from products
      order by sort_order asc, id asc
    `;
    return json({ products: rows });
  }

  if (req.method === 'POST') {
    const unauthorized = requireAuth(req);
    if (unauthorized) return unauthorized;
    const b = await req.json().catch(() => ({}));
    if (!b.slug || !b.name) {
      return json({ error: 'Falta slug o nombre.' }, { status: 400 });
    }
    const sql = db();
    try {
      const [row] = await sql`
        insert into products (slug, name, short_description, emoji, image_key, tool_url, status, sort_order)
        values (${b.slug}, ${b.name}, ${b.short_description || ''}, ${b.emoji || '✨'}, ${b.image_key || null}, ${b.tool_url || null}, ${b.status || 'proximamente'}, ${b.sort_order ?? 0})
        returning id, slug, name, short_description, emoji, image_key, tool_url, status, sort_order
      `;
      return json({ product: row }, { status: 201 });
    } catch (err) {
      return json({ error: err.message.includes('unique') ? 'Ya existe un producto con ese slug.' : err.message }, { status: 400 });
    }
  }

  if (req.method === 'PUT') {
    const unauthorized = requireAuth(req);
    if (unauthorized) return unauthorized;
    const b = await req.json().catch(() => ({}));
    if (!b.id) return json({ error: 'Falta id.' }, { status: 400 });
    const sql = db();

    const [existing] = await sql`select image_key from products where id = ${b.id}`;
    const newImageKey = b.image_key ?? null;

    const [row] = await sql`
      update products set
        slug = ${b.slug},
        name = ${b.name},
        short_description = ${b.short_description || ''},
        emoji = ${b.emoji || '✨'},
        image_key = ${newImageKey},
        tool_url = ${b.tool_url || null},
        status = ${b.status || 'proximamente'},
        sort_order = ${b.sort_order ?? 0},
        updated_at = now()
      where id = ${b.id}
      returning id, slug, name, short_description, emoji, image_key, tool_url, status, sort_order
    `;
    if (!row) return json({ error: 'No existe ese producto.' }, { status: 404 });

    // Si se reemplazó o se quitó la imagen, borra el blob anterior.
    if (existing?.image_key && existing.image_key !== newImageKey) {
      await deleteImage(existing.image_key);
    }
    return json({ product: row });
  }

  if (req.method === 'DELETE') {
    const unauthorized = requireAuth(req);
    if (unauthorized) return unauthorized;
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Falta id.' }, { status: 400 });
    const sql = db();
    const [existing] = await sql`select image_key from products where id = ${id}`;
    await sql`delete from products where id = ${id}`;
    if (existing?.image_key) await deleteImage(existing.image_key);
    return json({ ok: true });
  }

  return json({ error: 'Método no permitido.' }, { status: 405 });
};

export const config = { path: '/api/admin/products' };
