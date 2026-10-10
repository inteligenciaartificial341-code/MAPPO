/* MAPPO — Service Worker mínimo (Story 7: instalação multiplataforma via PWA)
   Estratégia deliberada: network-first pro shell (index.html/navegação), cache-first
   só pros ícones (estáticos). O app está em publicação ativa -- cache-first pro shell
   prenderia usuários numa versão antiga. Cache só cobre o cenário "sem rede". */

/* CACHE_VERSION É A IMPRESSÃO DIGITAL DA CASCA, e muda a CADA publicação.
   Não é enfeite: o navegador só instala um Service Worker novo quando os BYTES deste
   arquivo mudam, e é essa instalação que avisa as abas abertas que saiu versão nova. Depois
   do commit 5792366 (24/08/2026), que criou este arquivo, o index.html mudou 41 vezes e este
   arquivo nenhuma -- então o aviso nunca chegou numa publicação real (medido em
   testes/diag-atualizacao.js).
   O valor é 'mappo-shell-' + 12 hex do sha256 do conteúdo de TODOS os arquivos de SHELL_URLS
   (ordenados; texto normalizado CRLF→LF). A casca inteira, não só o index.html, porque os
   ícones são servidos CACHE-FIRST aqui embaixo: trocar um ícone sem mexer no index deixaria o
   ícone antigo vivo para sempre em quem já tem o app instalado.
   A lista é lida DESTE arquivo pela suíte testes/teste-atualizacao.js -- acrescentar um
   arquivo em SHELL_URLS passa a exigir versão nova sozinho, sem ninguém lembrar de cadastrar
   nada. O manifest.json fica fora porque não está na casca: ele é rede-primeiro.
   Mudar a casca sem trocar esta linha deixa o npm test VERMELHO, com a linha exata para
   colar. Depender de lembrar não funcionou em nenhuma das 41 vezes. */
const CACHE_VERSION = 'mappo-shell-df2185cb00cb';
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
