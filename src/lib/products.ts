// Catálogo de "productos personalizados" (configuradores interactivos).
// Cada uno vive en su propia página bajo /productos/<slug>/. Añade aquí
// los que vengan después — la página de catálogo se arma sola a partir
// de esta lista.

export type Product = {
  slug: string;
  name: string;
  shortDescription: string;
  emoji: string;
  status: 'disponible' | 'proximamente';
};

export const products: Product[] = [
  {
    slug: 'llaveros-personalizados',
    name: 'Llaveros con nombre',
    shortDescription:
      'Escribe un nombre, elige tipografía y colores, y descarga tu llavero 3D listo para imprimir.',
    emoji: '🔑',
    status: 'disponible'
  },
  {
    slug: 'proximamente-1',
    name: 'Próximamente',
    shortDescription: 'Estamos preparando un nuevo configurador. Vuelve pronto.',
    emoji: '✨',
    status: 'proximamente'
  }
];
