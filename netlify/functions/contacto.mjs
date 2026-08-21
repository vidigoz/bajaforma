// Netlify Function (formato v2) que recibe el formulario de contacto y lo
// guarda en Neon. Requiere la variable de entorno DATABASE_URL configurada
// en Netlify (Site settings → Environment variables) apuntando a tu proyecto
// de Neon. Ver db/schema.sql para crear la tabla antes de usarla.

import { neon } from '@neondatabase/serverless';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido.' }), {
      status: 405,
      headers: { 'content-type': 'application/json' }
    });
  }

  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en las variables de entorno de Netlify.');
    return new Response(
      JSON.stringify({ error: 'El formulario no está configurado todavía. Escríbenos por WhatsApp mientras tanto.' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Datos inválidos.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  const name = (body.name || '').trim();
  const message = (body.message || '').trim();
  const email = (body.email || '').trim() || null;
  const phone = (body.phone || '').trim() || null;
  const product = (body.product || '').trim() || null;

  if (!name || !message) {
    return new Response(JSON.stringify({ error: 'Falta tu nombre o el mensaje.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      insert into contact_messages (name, email, phone, product, message)
      values (${name}, ${email}, ${phone}, ${product}, ${message})
    `;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (err) {
    console.error('Error guardando mensaje de contacto:', err);
    return new Response(JSON.stringify({ error: 'No se pudo guardar tu mensaje. Intenta de nuevo o usa WhatsApp.' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

export const config = { path: '/api/contacto' };
