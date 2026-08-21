// Sirve los thumbnails subidos desde el dashboard. Pública (sin auth) — son
// las fotos del catálogo, se ven en /productos/ igual que cualquier imagen.

import { getStore } from '@netlify/blobs';

export default async (req) => {
  const key = new URL(req.url).searchParams.get('key');
  if (!key) return new Response('Falta key.', { status: 400 });

  const store = getStore('product-images');
  const blob = await store.get(key, { type: 'arrayBuffer' });
  if (!blob) return new Response('No encontrada.', { status: 404 });

  const meta = await store.getMetadata(key);
  const contentType = meta?.metadata?.contentType || 'application/octet-stream';

  return new Response(blob, {
    headers: {
      'content-type': contentType,
      // La key incluye un UUID nuevo en cada subida, así que el contenido de
      // una key dada nunca cambia — se puede cachear "para siempre".
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
};

export const config = { path: '/api/product-image' };
