/* MAPPO — Service Worker mínimo (Story 7: instalação multiplataforma via PWA)
   Estratégia deliberada: network-first pro shell (index.html/navegação), cache-first
   só pros ícones (estáticos). O app está em publicação ativa -- cache-first pro shell
   prenderia usuários numa versão antiga. Cache só cobre o cenário "sem rede". */

const CACHE_VERSION = 'mappo-shell-v1';
const SHELL_URLS = [
  './',
  './index.html',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];
const ICON_PATHS = ['/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.all(SHELL_URLS.map((url) =>
        cache.add(url).catch((e) => {
          console.log('[MAPPO SW] falhou ao cachear', url, e && e.message);
          // best-effort: avisa qualquer aba aberta via fbLog do app (não bloqueia nada)
          self.clients.matchAll().then((cs) =>
            cs.forEach((c) => c.postMessage({ type: 'sw-cache-warning', detail: url + ': ' + (e && e.message) }))
          ).catch(() => {});
        })
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_VERSION)
          .map((nome) => caches.delete(nome))
      )
    )
      .catch((e) => console.log('[MAPPO SW] limpeza de cache falhou', e && e.message))
      .then(() => self.clients.claim())
  );
});

function ehIcone(url) {
  return ICON_PATHS.some((p) => url.pathname.endsWith(p));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // não intercepta escritas/POST

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // não intercepta Firestore/Google Fonts/etc.

  // Navegação e index.html: network-first (sempre busca a versão mais nova quando online)
  if (req.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            const copia = resp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copia)).catch(() => {});
          }
          return resp;
        })
        .catch(() =>
          caches.match(req)
            .then((cached) => cached || caches.match('./index.html'))
            .then((r) => r || new Response('Offline', { status: 504, statusText: 'Offline' }))
        )
    );
    return;
  }

  // Ícones: cache-first (estáticos, raramente mudam)
  if (ehIcone(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((resp) => {
          if (resp && resp.ok) {
            const copia = resp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copia)).catch(() => {});
          }
          return resp;
        });
      })
    );
    return;
  }

  // Demais recursos same-origin: network-first com fallback ao cache
  event.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp && resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copia)).catch(() => {});
        }
        return resp;
      })
      .catch(() =>
        caches.match(req).then((r) => r || new Response('Offline', { status: 504, statusText: 'Offline' }))
      )
  );
});
