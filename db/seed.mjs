// Siembra inicial: mete en Neon el mismo contenido que ya vivía escrito a mano
// en el código (src/lib/products.ts + los textos de home/contacto/como-funciona),
// para que el dashboard arranque mostrando exactamente lo que ya está publicado.
//
// Uso: node db/seed.mjs   (lee DATABASE_URL de .env)
// Seguro de correr más de una vez: usa upsert (on conflict) en todo.

import { readFileSync } from 'node:fs';
import { Pool } from '@neondatabase/serverless';

const envFile = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const match = envFile.match(/^DATABASE_URL=(.*)$/m);
const DATABASE_URL = match?.[1]?.trim();
if (!DATABASE_URL) {
  console.error('No se encontró DATABASE_URL en .env');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

const products = [
  {
    slug: 'llaveros-personalizados',
    name: 'Llaveros con nombre',
    short_description:
      'Escribe un nombre, elige tipografía y colores, y descarga tu llavero 3D listo para imprimir.',
    emoji: '🔑',
    status: 'disponible',
    sort_order: 0
  },
  {
    slug: 'proximamente-1',
    name: 'Próximamente',
    short_description: 'Estamos preparando un nuevo configurador. Vuelve pronto.',
    emoji: '✨',
    status: 'proximamente',
    sort_order: 1
  }
];

const texts = {
  'home.hero.eyebrow': 'Impresión 3D a la medida',
  'home.hero.title_pre': 'Diseña tu producto, ',
  'home.hero.title_accent': 'imprímelo en 3D',
  'home.hero.subtitle':
    'En Bajaforma personalizas tu producto directamente en el navegador —nombre, tipografía, ' +
    'colores y tamaño— y ves el precio al instante. Sin pedidos mínimos, sin complicaciones.',
  'home.hero.cta_primary': 'Ver productos personalizados',
  'home.hero.cta_secondary': 'Preguntar por WhatsApp',
  'home.how.title': 'Cómo funciona',
  'home.how.step1.title': 'Personaliza',
  'home.how.step1.body': 'Elige un producto y ajústalo a tu gusto: texto, tipografía, color y tamaño.',
  'home.how.step2.title': 'Ve el precio al instante',
  'home.how.step2.body': 'La cotización se calcula en vivo según material, tamaño y cantidad.',
  'home.how.step3.title': 'Confirma tu pedido',
  'home.how.step3.body':
    'Nos escribes por WhatsApp o el formulario de contacto y coordinamos entrega/envío.',
  'contacto.intro':
    'La forma más rápida de cotizar es por WhatsApp. También puedes escribirnos aquí y te respondemos por correo.'
};

async function main() {
  for (const p of products) {
    await pool.query(
      `insert into products (slug, name, short_description, emoji, status, sort_order)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (slug) do update set
         name = excluded.name,
         short_description = excluded.short_description,
         emoji = excluded.emoji,
         status = excluded.status,
         sort_order = excluded.sort_order,
         updated_at = now()`,
      [p.slug, p.name, p.short_description, p.emoji, p.status, p.sort_order]
    );
  }
  console.log(`✔ ${products.length} productos sembrados`);

  for (const [key, value] of Object.entries(texts)) {
    await pool.query(
      `insert into site_texts (key, value) values ($1, $2)
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [key, value]
    );
  }
  console.log(`✔ ${Object.keys(texts).length} textos sembrados`);

  await pool.end();
}

main().catch((err) => {
  console.error('ERROR sembrando datos:', err);
  process.exit(1);
});
