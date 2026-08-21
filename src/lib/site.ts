// Datos generales de la empresa, centralizados para no repetirlos en cada
// página/componente. Todo lo marcado con TODO son placeholders: reemplázalos
// con los datos reales antes de publicar el sitio.

export const siteConfig = {
  name: 'Bajaforma',
  legalName: 'Bajaforma',
  tagline: 'Impresión 3D y productos personalizados',
  description:
    'Bajaforma imprime en 3D productos personalizados: llaveros con nombre, ' +
    'piezas a la medida y más. Diseña tu producto en línea y recibe tu ' +
    'cotización al instante.',

  // TODO: pon aquí el dominio real cuando esté conectado en Netlify.
  url: 'https://www.bajaforma.com',

  // TODO: número real en formato E.164 (ej. +5216641234567) para el link de WhatsApp.
  whatsapp: '+52XXXXXXXXXX',
  // TODO: correo real de contacto.
  email: 'hola@bajaforma.com',
  // TODO: ciudad/estado reales — se usan en el schema.org LocalBusiness.
  city: 'Tijuana',
  region: 'Baja California',
  country: 'MX',

  social: {
    // TODO: reemplaza con las URLs reales o quita las que no apliquen.
    instagram: '',
    facebook: '',
    tiktok: ''
  }
};

export function whatsappLink(message = '') {
  const digits = siteConfig.whatsapp.replace(/[^\d+]/g, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits.replace('+', '')}${text}`;
}
