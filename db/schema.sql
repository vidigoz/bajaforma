-- Esquema para Neon (Postgres). Corre esto una vez en tu proyecto de Neon
-- (SQL editor de la consola, o `psql $DATABASE_URL -f db/schema.sql`).
-- Es seguro volver a correrlo: todo usa "if not exists".

create table if not exists contact_messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  email text,
  phone text,
  product text,        -- slug del producto de interés, si vino de una página de producto
  message text not null
);

-- ══════════ Dashboard / CMS ══════════
-- El sitio sigue siendo estático: estas tablas son la fuente de datos que se
-- lee en tiempo de BUILD (no en cada visita). Editar aquí + "Publicar" desde
-- el dashboard dispara un rebuild en Netlify (~30-60s) y ahí se ve el cambio.

-- Catálogo de "productos personalizados" (antes vivía en src/lib/products.ts)
create table if not exists products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  short_description text not null,
  emoji text not null default '✨',
  status text not null default 'proximamente' check (status in ('disponible', 'proximamente')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- Textos sueltos de las páginas fijas del sitio (home, cómo funciona, contacto…),
-- direccionados por una llave tipo "home.hero.title".
create table if not exists site_texts (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Páginas libres creadas desde el dashboard (viven en /paginas/<slug>/)
create table if not exists pages (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  meta_description text not null default '',
  nav_label text,               -- si no es NULL, aparece en el menú principal
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bloques/secciones ordenados dentro de cada página libre
create table if not exists page_blocks (
  id bigint generated always as identity primary key,
  page_id bigint not null references pages(id) on delete cascade,
  position int not null default 0,
  type text not null check (type in ('heading_text', 'faq', 'cta')),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists page_blocks_page_id_idx on page_blocks(page_id);
