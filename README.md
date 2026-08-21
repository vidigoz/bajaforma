# Bajaforma

Sitio de Bajaforma (impresión 3D + productos personalizados), hecho con
[Astro](https://astro.build) + Tailwind, pensado para desplegarse en Netlify
con Neon (Postgres) como base de datos opcional para el formulario de contacto.

## Estructura

```
src/
  layouts/Layout.astro      # SEO, meta tags, JSON-LD, header/footer
  components/                # Header, Footer, ProductCard, BlockRenderer
  lib/site.ts                 # Datos de la empresa (nombre, WhatsApp, correo…)
  lib/db.ts                    # Lecturas a Neon EN BUILD (productos, textos, páginas)
  lib/products.ts               # Solo el tipo Product + fallback
  pages/
    index.astro                # Home (textos + productos vienen de Neon)
    productos/index.astro       # Catálogo (viene de Neon)
    productos/llaveros-personalizados/index.astro   # Página del producto + tool
    como-funciona/index.astro
    contacto/index.astro        # Formulario → Netlify Function → Neon
    paginas/[slug]/index.astro   # Páginas libres creadas desde /admin/
    admin/index.astro             # Dashboard (login + panel)

public/
  tools/llaveros-personalizados.html   # Configurador 3D (HTML/JS independiente)
  robots.txt, llms.txt, og-default.svg

netlify/functions/
  contacto.mjs                  # Formulario de contacto → Neon
  admin-login.mjs, admin-logout.mjs, admin-session.mjs   # Auth del dashboard
  admin-products.mjs, admin-texts.mjs, admin-pages.mjs, admin-blocks.mjs   # CRUD
  admin-upload-image.mjs         # Sube el thumbnail de un producto a Netlify Blobs
  product-image.mjs               # Sirve esos thumbnails (pública, sin auth)
  admin-publish.mjs             # Dispara el Build Hook de Netlify
  _lib/auth.mjs                  # Cookie de sesión firmada (compartido)

db/
  schema.sql                    # Todas las tablas (contact_messages, products,
                                 # site_texts, pages, page_blocks)
  seed.mjs                       # Siembra el contenido inicial (node db/seed.mjs)
```

### El dashboard (`/admin/`)

Panel con **una sola contraseña** (no hay cuentas de usuario), pensado para
que tú edites el sitio sin tocar código:

- **Productos** — el catálogo de `/productos/` (crear, editar, borrar, orden,
  y una foto de portada opcional — si no subes foto, se usa el emoji).
- **Textos** — los textos sueltos del home (título, subtítulo, pasos de "Cómo
  funciona"), identificados por una llave tipo `home.hero.title`.
- **Páginas** — páginas libres nuevas en `/paginas/<slug>/`, armadas con
  bloques (texto, preguntas frecuentes, llamado a la acción) que agregas,
  reordenas o borras. Si le pones "nombre en el menú", aparece en el header.
- **Publicar** — el sitio sigue siendo 100% estático: los cambios de arriba
  quedan guardados en Neon al instante, pero el sitio público no cambia hasta
  que aprietas "Publicar" (dispara un rebuild en Netlify, ~30-60s).

Todo lo que el dashboard edita se lee desde `src/lib/db.ts` **en tiempo de
build** (`getProducts`, `getTexts`, `getPublishedPages`) — si Neon no responde
o una tabla está vacía, cada función cae a un contenido por defecto para que
el build nunca se rompa.

### Por qué la herramienta 3D vive aparte

`public/tools/llaveros-personalizados.html` es la app original del
configurador (Three.js + opentype.js), sin tocar. La página
`/productos/llaveros-personalizados/` la incrusta en un `<iframe>` y pone
alrededor todo el contenido de texto (descripción, cómo funciona, FAQ,
JSON-LD de Product/FAQPage) — eso es lo que Google y los agentes de IA
necesitan indexar; la app en sí no tiene texto que indexar.

Cuando hagas el siguiente configurador, puedes copiar ese mismo patrón:
1. El HTML de la herramienta va a `public/tools/<slug>.html`.
2. Agrégalo al catálogo desde `/admin/` → Productos (o directo en la tabla
   `products` de Neon) con el mismo `slug`.
3. Crea `src/pages/productos/<slug>/index.astro` copiando la estructura de
   la página de llaveros.

## Pendientes antes de publicar (marcados como TODO en el código)

- `src/lib/site.ts`: número de WhatsApp real, correo, ciudad/estado, redes sociales.
- `astro.config.mjs`: dominio real en `site`.
- `public/og-default.svg`: reemplazar por una imagen 1200×630 real (png/jpg).
- Revisar/editar los textos de ejemplo en Home, Cómo funciona y las preguntas frecuentes.

## Desarrollo local

```bash
npm install
npm run dev
```

Para probar también la función de contacto (Neon) localmente, con la CLI de
Netlify (`npm i -g netlify-cli`):

```bash
npm run dev      # arranca Astro (queda corriendo en 2do plano, así es Astro 7)
netlify dev       # abre http://localhost:8888 — hace de proxy + sirve /api/contacto
```

Astro 7 mantiene su servidor de dev como un proceso persistente en 2do plano
(sobrevive aunque el comando que lo lanzó termine). Eso confunde al supervisor
de procesos de `netlify dev` si intenta lanzarlo él mismo, así que
`netlify.toml` ya trae un `[dev]` con `framework = "#custom"` apuntando al
puerto 4321 — por eso el orden de arriba (primero Astro, luego `netlify dev`)
es el que hay que seguir. Si el puerto 8888 ya está ocupado por otra cosa en
tu máquina, usa `netlify dev --port 8889`. Para parar el Astro de fondo:
`npx astro dev stop`.

## Neon (base de datos)

1. Crea un proyecto en [neon.tech](https://neon.tech).
2. Corre `db/schema.sql` en el editor SQL de Neon (crea todas las tablas —
   es seguro volver a correrlo, usa `if not exists`).
3. La primera vez, siembra el contenido inicial: `node db/seed.mjs` (lee
   `DATABASE_URL` de tu `.env` local).
4. Copia la cadena de conexión y ponla como `DATABASE_URL`:
   - Local: en un archivo `.env` (ver `.env.example`).
   - Producción: en Netlify → Site settings → Environment variables.

Si `DATABASE_URL` no está configurada, el formulario de contacto y el
dashboard muestran un error amigable y el sitio público sigue funcionando
con el contenido por defecto (WhatsApp/correo como alternativa).

## Despliegue en Netlify

1. Sube este repo a GitHub/GitLab y conéctalo en Netlify ("Import from Git").
2. Build command: `npm run build` — Publish directory: `dist` (ya están en `netlify.toml`).
3. Agrega las variables de entorno (Site settings → Environment variables):
   - `DATABASE_URL` — tu conexión de Neon.
   - `DASHBOARD_PASSWORD` — la contraseña para entrar a `/admin/`.
   - `DASHBOARD_SESSION_SECRET` — genera una con
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   - `NETLIFY_BUILD_HOOK_URL` — créalo en Site settings → Build & deploy →
     Build hooks (dale un nombre, ej. "dashboard"), pega la URL aquí. Es lo
     que usa el botón "Publicar" del dashboard para redesplegar el sitio.
4. Conecta tu dominio real y actualiza `site` en `astro.config.mjs` + los datos en `src/lib/site.ts`.

Las fotos de producto (Netlify Blobs) no necesitan ninguna variable de
entorno extra: quedan ligadas automáticamente a tu sitio, tanto en
producción como en local con `netlify dev`.

**Importante:** como el build ahora lee Neon (`getProducts`/`getTexts`/
`getPublishedPages`), `DATABASE_URL` tiene que estar configurada también para
el propio *build* de Netlify (no solo para las Functions) — si no, el sitio
se sigue publicando bien, pero con el contenido por defecto en vez del que
esté en la base.

## SEO / indexabilidad

- Astro genera HTML estático real en cada página (nada depende de JS para
  el contenido textual) — lo mejor posible para Google y para agentes de IA
  que leen HTML directamente.
- `@astrojs/sitemap` genera `sitemap-index.xml` automáticamente en cada build.
- `public/robots.txt` referencia ese sitemap.
- `public/llms.txt` da un resumen del sitio pensado para agentes de IA
  (convención [llms.txt](https://llmstxt.org)).
- Cada página trae su propio `<title>`, meta description, Open Graph/Twitter
  card y JSON-LD (`LocalBusiness` en todo el sitio; `Product`/`FAQPage` en
  las páginas de producto).
