# Bajaforma

Sitio de Bajaforma (impresión 3D + productos personalizados), hecho con
[Astro](https://astro.build) + Tailwind, pensado para desplegarse en Netlify
con Neon (Postgres) como base de datos opcional para el formulario de contacto.

## Estructura

```
src/
  layouts/Layout.astro      # SEO, meta tags, JSON-LD, header/footer
  components/                # Header, Footer, ProductCard
  lib/site.ts                 # Datos de la empresa (nombre, WhatsApp, correo…)
  lib/products.ts              # Catálogo de productos personalizados
  pages/
    index.astro                # Home
    productos/index.astro       # Catálogo
    productos/llaveros-personalizados/index.astro   # Página del producto + tool
    como-funciona/index.astro
    contacto/index.astro        # Formulario → Netlify Function → Neon

public/
  tools/llaveros-personalizados.html   # Configurador 3D (HTML/JS independiente)
  robots.txt, llms.txt, og-default.svg

netlify/functions/contacto.mjs   # Guarda el formulario de contacto en Neon
db/schema.sql                     # Tabla que necesita esa función
```

### Por qué la herramienta 3D vive aparte

`public/tools/llaveros-personalizados.html` es la app original del
configurador (Three.js + opentype.js), sin tocar. La página
`/productos/llaveros-personalizados/` la incrusta en un `<iframe>` y pone
alrededor todo el contenido de texto (descripción, cómo funciona, FAQ,
JSON-LD de Product/FAQPage) — eso es lo que Google y los agentes de IA
necesitan indexar; la app en sí no tiene texto que indexar.

Cuando hagas el siguiente configurador, puedes copiar ese mismo patrón:
1. El HTML de la herramienta va a `public/tools/<slug>.html`.
2. Agrégalo a `src/lib/products.ts`.
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
2. Corre `db/schema.sql` en el editor SQL de Neon (crea la tabla `contact_messages`).
3. Copia la cadena de conexión y ponla como `DATABASE_URL`:
   - Local: en un archivo `.env` (ver `.env.example`).
   - Producción: en Netlify → Site settings → Environment variables.

Si `DATABASE_URL` no está configurada, el formulario de contacto muestra un
error amigable y el sitio sigue funcionando normalmente (WhatsApp/correo
como alternativa).

## Despliegue en Netlify

1. Sube este repo a GitHub/GitLab y conéctalo en Netlify ("Import from Git").
2. Build command: `npm run build` — Publish directory: `dist` (ya están en `netlify.toml`).
3. Agrega la variable de entorno `DATABASE_URL` (ver arriba).
4. Conecta tu dominio real y actualiza `site` en `astro.config.mjs` + los datos en `src/lib/site.ts`.

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
