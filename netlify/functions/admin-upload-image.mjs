// Sube el thumbnail de un producto a Netlify Blobs. El navegador manda la
// imagen como data URL (base64) en JSON — evita tener que parsear
// multipart/form-data a mano. Devuelve la "key" que se guarda en
// products.image_key; para mostrarla se usa /api/product-image?key=...

import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';
import { requireAuth, json } from './_lib/auth.mjs';

const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, { status: 405 });
  }
  const unauthorized = requireAuth(req);
  if (unauthorized) return unauthorized;

  const b = await req.json().catch(() => ({}));
  const dataUrl = b.dataUrl || '';
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return json({ error: 'Imagen inválida.' }, { status: 400 });

  const [, contentType, base64] = match;
  if (!ALLOWED.has(contentType)) {
    return json({ error: 'Formato no soportado. Usa PNG, JPG, WEBP o GIF.' }, { status: 400 });
  }

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.byteLength > MAX_BYTES) {
    return json({ error: 'La imagen pesa demasiado (máx. 3MB).' }, { status: 400 });
  }

  const key = `${randomUUID()}.${EXT[contentType]}`;
  const store = getStore('product-images');
  await store.set(key, buffer, { metadata: { contentType } });

  // Si se manda la key anterior (reemplazo), borra el blob viejo para no acumular basura.
  if (b.previousKey) {
    await store.delete(b.previousKey).catch(() => {});
  }

  return json({ key, url: `/api/product-image?key=${encodeURIComponent(key)}` }, { status: 201 });
};

export const config = { path: '/api/admin/upload-image' };
