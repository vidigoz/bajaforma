// Capa de datos de tiempo de BUILD. Astro es estático: estas funciones se
// llaman desde el frontmatter de las páginas (corren una sola vez, al hacer
// `astro build`), nunca en el navegador del visitante.
//
// Todo tiene un fallback fijo: si DATABASE_URL no está configurada (o Neon
// no responde) el build no debe romperse — simplemente usa el contenido por
// defecto, igual que antes de que existiera el dashboard.

import { neon } from '@neondatabase/serverless';
import type { Product } from './products';

function client() {
  const url = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

// ══════════ Productos personalizados ══════════

const FALLBACK_PRODUCTS: Product[] = [
  {
    slug: 'llaveros-personalizados',
    name: 'Llaveros con nombre',
    shortDescription:
      'Escribe un nombre, elige tipografía y colores, y descarga tu llavero 3D listo para imprimir.',
    emoji: '🔑',
    imageUrl: null,
    toolUrl: '/tools/llaveros-personalizados.html',
    status: 'disponible'
  }
];

export async function getProducts(): Promise<Product[]> {
  const sql = client();
  if (!sql) return FALLBACK_PRODUCTS;

  try {
    const rows = await sql`
      select slug, name, short_description, emoji, image_key, tool_url, status
      from products
      order by sort_order asc, id asc
    `;
    if (!rows.length) return FALLBACK_PRODUCTS;
    return rows.map((r: any) => ({
      slug: r.slug,
      name: r.name,
      shortDescription: r.short_description,
      emoji: r.emoji,
      imageUrl: r.image_key ? `/api/product-image?key=${encodeURIComponent(r.image_key)}` : null,
      toolUrl: r.tool_url || null,
      status: r.status
    }));
  } catch (err) {
    console.warn('[db] No se pudo leer products de Neon, usando fallback:', (err as Error).message);
    return FALLBACK_PRODUCTS;
  }
}

// ══════════ Textos editables ══════════

const FALLBACK_TEXTS: Record<string, string> = {
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

export async function getTexts(): Promise<Record<string, string>> {
  const sql = client();
  if (!sql) return FALLBACK_TEXTS;

  try {
    const rows = await sql`select key, value from site_texts`;
    const fromDb: Record<string, string> = {};
    for (const r of rows as any[]) fromDb[r.key] = r.value;
    // Los del fallback rellenan cualquier llave que aún no exista en la base.
    return { ...FALLBACK_TEXTS, ...fromDb };
  } catch (err) {
    console.warn('[db] No se pudo leer site_texts de Neon, usando fallback:', (err as Error).message);
    return FALLBACK_TEXTS;
  }
}

// ══════════ Páginas libres (creadas desde el dashboard) ══════════

export type PageBlock = {
  id: number;
  type: 'heading_text' | 'faq' | 'cta';
  content: Record<string, any>;
};

export type CmsPage = {
  slug: string;
  title: string;
  metaDescription: string;
  navLabel: string | null;
  blocks: PageBlock[];
};

export async function getPublishedPages(): Promise<CmsPage[]> {
  const sql = client();
  if (!sql) return [];

  try {
    const pages = await sql`
      select id, slug, title, meta_description, nav_label
      from pages
      where published = true
      order by sort_order asc, id asc
    `;
    if (!pages.length) return [];

    const blocks = await sql`
      select id, page_id, position, type, content
      from page_blocks
      order by position asc, id asc
    `;

    return (pages as any[]).map((p) => ({
      slug: p.slug,
      title: p.title,
      metaDescription: p.meta_description,
      navLabel: p.nav_label,
      blocks: (blocks as any[])
        .filter((b) => b.page_id === p.id)
        .map((b) => ({ id: b.id, type: b.type, content: b.content }))
    }));
  } catch (err) {
    console.warn('[db] No se pudieron leer pages/page_blocks de Neon:', (err as Error).message);
    return [];
  }
}
