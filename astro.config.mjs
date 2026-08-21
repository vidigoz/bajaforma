// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: cambiar por el dominio real cuando esté conectado en Netlify
  // (necesario para que se genere bien el sitemap.xml y las URLs canónicas).
  site: 'https://www.bajaforma.com',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});
