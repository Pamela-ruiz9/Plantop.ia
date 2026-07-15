// Manifest generado dinámicamente para que las rutas respeten el `base` configurado
// en astro.config.mjs (necesario porque public/ no se procesa con BASE_URL).
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL;

  const manifest = {
    name: 'Plantopia',
    short_name: 'Plantopia',
    description: 'Tu colección de plantas: sustrato, luz, riego y ciclo de vida en un solo lugar.',
    start_url: base,
    scope: base,
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#16a34a',
    orientation: 'any',
    lang: 'es',
    icons: [
      { src: `${base}icons/icon-192.png`, type: 'image/png', sizes: '192x192', purpose: 'any' },
      { src: `${base}icons/icon-192.png`, type: 'image/png', sizes: '192x192', purpose: 'maskable' },
      { src: `${base}icons/icon-512.png`, type: 'image/png', sizes: '512x512', purpose: 'any' },
      { src: `${base}icons/icon-512.png`, type: 'image/png', sizes: '512x512', purpose: 'maskable' },
    ],
    categories: ['lifestyle', 'utilities'],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
