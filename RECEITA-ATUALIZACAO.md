<!-- Extraído de MAPPO-O-QUE-FALTA.md em 08/10/2026. Era material de CONSULTA ocupando 44% do
     arquivo de pendências, que existe para dizer o que FALTA. O mecanismo descrito aqui já está
     construído no MAPPO (0016f50, 42d2f8f, 5a34514) — isto fica como registro de onde a solução
     veio, e das ressalvas que o autor fez sobre o que ele mesmo NÃO testou. -->

# Atualizações do app

# Receita do mecanismo de atualização

Como o SONNAR IA passou a se atualizar sozinho no iPhone, com todos os
ajustes que foram necessários para funcionar — inclusive os dois que
travavam o app a ponto de exigir desinstalar e reinstalar.

Escrito a partir do código que está no ar, não de memória.

**Arquivos que fazem o trabalho:** `sw.js`, um trecho do `index.html` e o
teste `tests/casca-sw.test.js`. Os três são copiáveis inteiros.

---

## Como aparece na tela

![O aviso de atualização, com as cores e medidas do código](img/aviso-atualizacao.svg)

**Para ver funcionando:** abra `docs/demo-aviso-atualizacao.html` no
navegador. É a mesma barra, com o mesmo código, e os botões respondem —
melhor que uma captura parada, porque você toca e vê o que acontece.

---

## O problema que isto resolve

Um app instalado na tela inicial do celular **não tem barra de endereço**.
Não existe "recarregar" para o usuário. Se o navegador guardou a versão
antiga, ele fica nela — e, pior que o incômodo, **sem saber**: usa código
velho achando que é o novo, e conclui que o app está com defeito.

No Safari do iPhone isso é especialmente teimoso.

---

## A regra que organiza tudo

> **NUNCA MISTURAR GERAÇÕES.**

O app é uma página (`index.html`) mais um punhado de módulos (`/src/*.js`).
Se a página vier nova e os módulos velhos, o HTML chama funções que os
módulos antigos não têm. O app **abre, desenha a tela e não responde a
nada** — que é muito pior de diagnosticar do que uma tela de erro.

Tudo o que vem a seguir existe para garantir que a troca aconteça **de uma
vez só**, ou não aconteça.

---

## Passo 1 — a versão do cache

```js
const VERSAO = 'sonnar-v23';
```

Uma string. Trocar ela é o que:

- dispara o aviso de atualização nos aparelhos instalados;
- expulsa do cache os arquivos antigos.

**Esqueceu de subir = a atualização não chega.** Aconteceu aqui por quatro
publicações seguidas, com a versão parada em `v1` enquanto `/src` mudava. O
passo 6 existe para isso não depender de memória.

---

## Passo 2 — a casca

A lista de tudo que precisa existir para o app abrir sem internet:

```js
const CASCA = [
  '/', '/index.html', '/manifest.webmanifest',
  '/src/main.js',
  '/src/regras/editais.js',
  /* … um por módulo … */
  '/icones/icone-192.png', '/icones/icone-512.png'
];
```

Um módulo novo que não entre nesta lista **não abre offline** — e offline é
exatamente onde o usuário não tem como diagnosticar nada.

---

## Passo 3 — instalar e ativar

```js
self.addEventListener('install', (evento) => {
  evento.waitUntil((async () => {
    const cache = await caches.open(VERSAO);
    // um a um, não addAll: addAll falha inteiro se UM arquivo falhar
    await Promise.all(CASCA.map(url => cache.add(url).catch(() => {})));
  })());
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});
```

Dois detalhes que parecem preciosismo e não são:

- **`cache.add` um a um em vez de `addAll`.** Com `addAll`, um único arquivo
  que falhe derruba a instalação inteira e o app fica sem cache nenhum.
- **`activate` apaga as versões anteriores.** Sem isso o disco do celular só
  cresce, publicação após publicação.

---

## Passo 4 — como os arquivos são servidos

Aqui estavam **os dois defeitos que travavam o app**:

```js
self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;     // outros domínios: rede
  if (url.pathname.startsWith('/api/')) return;        // dados vivos: NUNCA cache

  evento.respondWith((async () => {
    const cache = await caches.open(VERSAO);           // ① o cache DESTA versão
    const chave = (req.mode === 'navigate') ? '/index.html' : req;   // ②

    const guardado = await cache.match(chave);
    if (guardado) return guardado;

    try {
      const resposta = await fetch(req);
      if (resposta && resposta.status === 200 && resposta.type === 'basic') {
        cache.put(chave, resposta.clone());
      }
      return resposta;
    } catch (e) {
      return Response.error();                         // ③
    }
  })());
});
```

### ① `caches.open(VERSAO)` e nunca `caches.match(req)`

`caches.match` global procura em **todos** os caches abertos. Durante uma
atualização existem dois — o antigo e o que está sendo instalado — e o pedido
podia ser atendido por qualquer um deles. Mistura de gerações, do jeito mais
silencioso possível.

### ② A navegação vem do cache, não da rede

Este era o segundo defeito, e o mais contraintuitivo. O `index.html` era
buscado **sempre na rede**, enquanto os módulos vinham do cache. Resultado:
página nova pedindo funções que os módulos velhos não tinham.

Servir o `index.html` do mesmo cache dos módulos é o que garante que a troca
aconteça de uma vez, quando o service worker novo assume — e não arquivo por
arquivo.

### ③ Sem internet e sem cópia: falha à vista

Aqui havia um `caches.match('/index.html')` global de recurso — a mesma busca
que o arquivo condena vinte linhas acima. No caminho offline, ele devolveria
uma página de outra geração sobre os módulos desta.

"Sem conexão" é a verdade e o usuário entende. Um app remendado de duas
gerações desenha a tela, não responde, e ninguém descobre por quê.

### E as rotas de dados nunca vêm do cache

`/api/` sai da regra inteira. Devolver resposta velha de uma busca de edital
seria **pior que falhar**: o usuário decide entrada em licitação com esses
dados.

---

## Passo 5 — o aviso e a troca

No `index.html`:

```js
let _swEsperando = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const reg = await navigator.serviceWorker.register('/sw.js');

    // (a) já tem versão nova esperando de uma visita anterior?
    if (reg.waiting) _avisarVersaoNova(reg.waiting);

    // (b) apareceu uma agora?
    reg.addEventListener('updatefound', () => {
      const novo = reg.installing;
      if (!novo) return;
      novo.addEventListener('statechange', () => {
        // 'installed' COM controller = atualização; sem controller = 1ª visita
        if (novo.state === 'installed' && navigator.serviceWorker.controller) {
          _avisarVersaoNova(novo);
        }
      });
    });

    // (c) procura versão nova ao VOLTAR para o app, não só ao abrir
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) reg.update().catch(() => {});
    });
  });

  // (d) quando o novo assume, recarrega UMA vez
  let _recarregando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (_recarregando) return;
    _recarregando = true;
    window.location.reload();
  });
}
```

Os quatro pontos, e o que cada um evita:

**(a) `reg.waiting`** — a versão nova pode ter sido instalada numa visita
anterior e ficado esperando. Sem esta linha, quem fechou o app antes de
confirmar nunca mais via o aviso.

**(b) `navigator.serviceWorker.controller`** — é o que separa "atualização" de
"primeira visita". Sem essa checagem, **todo primeiro acesso** pediria para
atualizar um app recém-instalado.

**(c) `visibilitychange`** — app instalado quase nunca é fechado de verdade;
fica suspenso em segundo plano. Sem isto, a busca por atualização só
aconteceria num `load`, que pode demorar dias.

**(d) a trava `_recarregando`** — `controllerchange` pode disparar mais de uma
vez. Sem a trava, laço de recarga: o app pisca sem parar e não abre.

E o aviso em si:

```js
function _avisarVersaoNova(sw) {
  _swEsperando = sw;
  if (document.getElementById('aviso-versao')) return;   // nunca duas barras
  /* … monta a barra … */
  document.getElementById('btn-atualizar').onclick = () => {
    if (_swEsperando) _swEsperando.postMessage('ATUALIZAR_AGORA');
    barra.remove();
  };
  document.getElementById('btn-depois').onclick = () => barra.remove();
}
```

E do outro lado, no `sw.js`:

```js
self.addEventListener('message', (evento) => {
  if (evento.data === 'ATUALIZAR_AGORA') self.skipWaiting();
});
```

> **`skipWaiting()` só sob comando do usuário.** Chamá-lo direto no `install`
> — como muito exemplo na internet ensina — troca a versão no meio do uso. A
> pessoa estava escrevendo uma busca e a página recarrega sozinha. O app
> instalado é usado em obra e em visita; perder o que se digitou ali custa
> mais que esperar um toque.

---

## Passo 6 — o guardião, para não depender de memória

Este é o ajuste que impede o erro voltar. `tests/casca-sw.test.js` calcula
uma **impressão digital** do conteúdo de todos os arquivos da casca. Se algum
mudar e a `VERSAO` ficar parada, o teste fica vermelho e diz o que fazer:

```
A casca do app mudou.
No sw.js, troque VERSAO ('sonnar-v23') por uma versão nova.
Aqui neste arquivo, troque IMPRESSAO_ESPERADA por '5a8fe62a60b6'
e VERSAO_ESPERADA pela versão que você escolheu.

Sem isso, quem já tem o app instalado recebe o index.html novo
com os módulos velhos, e o app quebra na mão do usuário.
```

Dois detalhes do cálculo que evitam falso alarme:

- **Ordena os arquivos** antes de somar, para a impressão não depender da
  ordem em que a lista foi escrita.
- **Normaliza a quebra de linha** (`\r\n` → `\n`). Sem isso a impressão muda
  só por o arquivo ter sido salvo no Windows em vez do Linux, e o teste
  acusaria mudança onde não houve.

O teste também confere que **todo módulo de `/src/regras/` está na casca** —
um módulo novo esquecido quebraria o app offline.

---

## Como levar para outro app

| Arquivo | O que trocar |
|---|---|
| `sw.js` → `VERSAO` | o prefixo do nome (`seuapp-v1`) |
| `sw.js` → `CASCA` | a lista dos seus arquivos |
| `sw.js` → `/api/` | o prefixo das suas rotas de dados |
| `index.html` → cores da barra | `#11808c`, `#cfeaf0` pela sua paleta |
| `casca-sw.test.js` | os dois valores esperados, na primeira execução |

O resto é igual: a lógica não tem nada específico deste app.

**Se o seu app não tiver módulos separados** (um HTML único, sem `/src`),
ainda assim vale servir o `index.html` do cache. O motivo muda — não é mais
mistura de gerações, é o app abrir offline —, mas o desenho é o mesmo.

---

## Como conferir se ficou certo

1. **Publique uma mudança visível** (troque uma palavra na tela) e suba a
   `VERSAO`.
2. **No iPhone, abra o app instalado.** Em alguns segundos a barra aparece.
   Se não aparecer, confira se a `VERSAO` mudou de verdade.
3. **Toque em Atualizar.** A tela recarrega uma vez e a palavra nova aparece.
4. **Teste o adiar:** feche a barra no ×, saia do app e volte. Ela tem que
   voltar.
5. **Teste offline:** ative o modo avião e abra o app. Tem que abrir.
6. **Teste a primeira visita:** instale num aparelho limpo. A barra **não**
   pode aparecer.

O passo 6 é o mais esquecido, e o mais constrangedor quando falha.

---

## O que não foi verificado

- O mecanismo foi exercitado no Safari do iPhone e no Chrome de desktop.
  **Android instalado não foi testado aqui** — o comportamento deve ser o
  mesmo, porque a API é padrão, mas é afirmação de manual, não medição.
- A demonstração `demo-aviso-atualizacao.html` reproduz a aparência e os
  textos, mas simula a conversa com o service worker: ela não instala nada.
- Os tempos de detecção dependem do navegador. O `visibilitychange` pede a
  verificação; quando ela de fato acontece é decisão dele.
