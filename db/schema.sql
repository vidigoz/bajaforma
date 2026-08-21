-- Esquema para Neon (Postgres). Corre esto una vez en tu proyecto de Neon
-- (SQL editor de la consola, o `psql $DATABASE_URL -f db/schema.sql`).

create table if not exists contact_messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  email text,
  phone text,
  product text,        -- slug del producto de interés, si vino de una página de producto
  message text not null
);
