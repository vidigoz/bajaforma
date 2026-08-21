// El catálogo de productos ahora vive en Neon (tabla `products`, editable
// desde /admin/) — ver getProducts() en ./db.ts. Este archivo solo conserva
// el tipo compartido y el fallback usado cuando la base no responde.

export type Product = {
  slug: string;
  name: string;
  shortDescription: string;
  emoji: string;
  status: 'disponible' | 'proximamente';
};
