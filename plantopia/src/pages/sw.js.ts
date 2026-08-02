// Service worker generado dinámicamente para que las rutas respeten el `base`
// configurado en astro.config.mjs. Astro inyecta BASE_URL en build time.
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL;
  // Cambia con cada build para invalidar el cache anterior automáticamente.
  const buildId = new Date().toISOString().slice(0, 16).replace('T', '-').replace(/:/g, '-');

  const body = `// Plantopia — service worker básico (offline-first shell)
// Estrategia: cache-first para assets estáticos, network-first para navegación.

const CACHE_NAME = 'plantopia-shell-${buildId}';
const BASE = ${JSON.stringify(base)};
const SHELL_ASSETS = [
  BASE,
  BASE + 'manifest.webmanifest',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Navegación: network-first ignorando HTTP cache, con fallback offline.
  // cache:'no-cache' evita que el browser sirva HTML viejo (GitHub Pages lo cachea 10 min).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((res) => res || caches.match(BASE)))
    );
    return;
  }

  // Solo cachear assets del mismo origen (JS, CSS, iconos).
  // Las requests a APIs externas (Supabase) pasan directo a la red para siempre
  // tener datos frescos — el SW nunca debe cachear respuestas de base de datos.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Assets estáticos locales: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/javascript' },
  });
};
