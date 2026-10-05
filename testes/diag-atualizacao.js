/* DIAGNOSTICO (mede, nao reprova) -- o aviso de versao nova dispara quando deveria?
 *
 * POR QUE EXISTE: o MAPPO tem uma faixa pronta e bem feita para avisar que saiu versao
 * nova ("Nova versao do MAPPO disponivel", index.html). O proprietario, que publicou
 * dezenas de vezes, nunca a viu -- so viu um toast de erro em UMA operacao (gerar convite),
 * que era o remendo da ausencia dela.
 *
 * O QUE ESTE ARQUIVO MEDIU EM 01/10/2026, ANTES DA CORRECAO (bd4bfd6):
 *   A (primeira visita)          faixa APARECE  -- e nao devia
 *   B (publiquei, sw.js igual)   faixa NAO aparece -- e devia
 *   C (publiquei, sw.js mudou)   faixa aparece
 * Confirmou a hipotese: a faixa depende de 'controllerchange', que so dispara quando o
 * navegador instala um Service Worker NOVO -- e ele so instala se os BYTES de sw.js mudarem.
 * O sw.js tinha UM commit (24/08/2026) e nunca mais mudou; o index.html mudou 41 vezes
 * depois dele. Na primeira visita o clients.claim() tambem dispara o evento, e era de onde
 * vinha o falso positivo.
 *
 * O CONTRATO QUE A CORRECAO INSTALOU, e que este arquivo passou a medir:
 *   A  primeira visita                 -> NAO avisa, nao recarrega
 *   B  publicacao real (index + CACHE_VERSION) -> avisa E recarrega sozinho
 *   C  a mesma publicacao, aba ocupada (modal aberto) -> avisa e NAO recarrega; espera
 *   D  publiquei e esqueci o CACHE_VERSION     -> nao avisa (e e por isso que existe a
 *      suite guardia testes/teste-atualizacao.js, que deixa o npm test vermelho antes disso
 *      chegar ao ar)
 *
 * "Hora segura" tem cinco motivos de bloqueio, e este arquivo imprime qual deles respondeu
 * (linha "pode recarregar agora?"): operacao em voo (foto comprimindo/gravando, envio), sobre-
 * posicao aberta (.overlay.open ou lightbox), campo em foco ou texto nao salvo, marca de
 * recarga ilegivel, e teto/carencia de recargas. Quem exercita os cinco um a um e a suite.
 *
 * ISTO E MEDICAO, NAO CORRECAO, e tambem nao e a rede: nada aqui reprova. A rede esta em
 * testes/teste-atualizacao.js. Este arquivo existe para ser rodado quando a pergunta e "o
 * que de fato acontece no navegador?", e para que a resposta de hoje fique comparavel com a
 * de antes da correcao.
 */
const { chromium } = require('playwright');
const path = require('path'), http = require('http'), fs = require('fs');
const RAIZ = process.env.MAPPO_RAIZ || path.resolve(__dirname, '..');

/* O servidor serve do disco, mas deixa "publicar" uma versao nova sem tocar no repositorio:
   um sufixo e anexado ao corpo entregue. Mudar o sufixo do index simula publicar o app;
   mudar o do sw simula o CACHE_VERSION novo que a suite guardia obriga. */
let sufixoIndex = '', sufixoSw = '';

function tipo(p) {
  if (p.endsWith('.js')) return 'application/javascript';
  if (p.endsWith('.json') || p.endsWith('.webmanifest')) return 'application/json';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  return 'text/html; charset=utf-8';
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const srv = http.createServer((rq, rs) => {
    const p = rq.url === '/' ? '/index.html' : rq.url.split('?')[0];
    const f = path.join(RAIZ, p);
    /* isFile(), nao so existsSync: um pedido a um diretorio passava e derrubava o servidor
       no readFileSync com EISDIR. */
    let st = null;
    try { st = fs.statSync(f); } catch (e) { st = null; }
    if (!st || !st.isFile()) { rs.writeHead(404); rs.end(); return; }
    let corpo = fs.readFileSync(f);
    if (p.endsWith('index.html') && sufixoIndex) corpo = Buffer.concat([corpo, Buffer.from('\n<!-- ' + sufixoIndex + ' -->')]);
    if (p.endsWith('sw.js') && sufixoSw) corpo = Buffer.concat([corpo, Buffer.from('\n/* ' + sufixoSw + ' */')]);
    /* sw.js sem cache de HTTP: isola a medicao na comparacao de BYTES que o navegador faz.
       Em producao o GitHub Pages manda cabecalho proprio -- ver testes/diag-swcache.js. */
    rs.writeHead(200, { 'Content-Type': tipo(p), 'Cache-Control': 'no-store' });
    rs.end(corpo);
  });
  await new Promise((r) => srv.listen(0, r));
  const base = 'http://localhost:' + srv.address().port + '/';

  const b = await chromium.launch();

  /* Le o estado do aviso: a bandeira interna, o que a faixa mostra, e a marca que o app
     grava em sessionStorage ANTES de recarregar -- e a marca que sobrevive a recarga, e
     portanto a unica evidencia de que a recarga automatica aconteceu de proposito. */
  const lerAviso = (pg) => pg.evaluate(() => {
    /* Em 02/10/2026 o aviso de versao saiu do #syncAlerta para o #avisoVersao (pilula fixa no
       rodape). Este diagnostico passou a ler o elemento novo: medir o formato antigo devolveria
       "nenhum aviso" com o aviso na tela, e diagnostico que mede a forma antiga ja mandou o
       proprietario cacar problema inexistente uma vez (CLAUDE.md, "Regras sobre dado").
       O markup do #avisoVersao e estatico, entao `falaDeVersao` exige `!el.hidden`.
       SEM fallback para o #syncAlerta de proposito: cair na forma antiga quando o elemento novo
       some e exatamente o "diagnostico medindo a forma antiga" que o paragrafo acima condena --
       ele diria "nenhum aviso" com todo o aviso funcionando, ou o contrario. Elemento ausente
       aqui vira `null` e aparece como tal no relatorio. */
    const el = document.getElementById('avisoVersao');
    const txt = el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
    let marca = null;
    try { marca = sessionStorage.getItem('mappo_recarga_versao'); } catch (e) { marca = 'ERRO: ' + e.message; }
    return {
      bandeira: (typeof _versaoNovaDisponivel !== 'undefined') ? _versaoNovaDisponivel : null,
      faixaVisivel: !!(el && !el.hidden),
      falaDeVersao: !!(el && !el.hidden && /Nova vers[ãa]o do MAPPO/i.test(txt)),
      controlado: !!navigator.serviceWorker.controller,
      motivo: (typeof _porQueNaoRecarregarAgora === 'function') ? _porQueNaoRecarregarAgora() : '(função não existe nesta versão)',
      marca,
      texto: txt.slice(0, 110)
    };
  });

  /* Abre um perfil novo. comModal=true deixa um overlay aberto antes de o app detectar
     qualquer coisa -- e a "aba ocupada" do cenario C, do ponto de vista do app (ele procura
     #curOverlay, que e o que showModal cria). */
  async function novoPerfil(comModal) {
    const ctx = await b.newContext();
    const pg = await ctx.newPage();
    pg.estado = { nav: 0 };
    pg.on('framenavigated', (f) => { if (f === pg.mainFrame()) pg.estado.nav++; });
    pg.on('pageerror', (e) => console.log('  PAGEERROR: ' + e.message));
    if (comModal) {
      await pg.addInitScript(() => {
        document.addEventListener('DOMContentLoaded', () => {
          const raiz = document.getElementById('modalRoot') || document.body;
          const d = document.createElement('div');
          d.className = 'overlay open';
          d.id = 'curOverlay';
          d.innerHTML = '<div class="modal"><p>modal aberto pelo diagnóstico</p></div>';
          raiz.appendChild(d);
        });
      });
    }
    return { ctx, pg };
  }

  /* Visita a pagina e espera a poeira assentar. Se o app decidir recarregar sozinho, a
     evaluate pode cair com "execution context destroyed" -- por isso cada leitura tenta de
     novo em vez de abortar a medicao. */
  const leiturasPerdidas = [];
  async function visitar(pg, segundos) {
    await pg.goto(base, { waitUntil: 'load' }).catch((e) => console.log('  goto: ' + e.message.split('\n')[0]));
    let ultimo = null;
    for (let i = 0; i < segundos * 2; i++) {
      await espera(500);
      try {
        ultimo = await lerAviso(pg);
      } catch (e) {
        /* Quase sempre é a recarga automática destruindo o contexto no meio da leitura: a
           medição anterior continua valendo e a próxima volta já lê a página nova. Não é
           erro a reportar, mas também não se engole -- fica contado e sai no fim. */
        leiturasPerdidas.push((e && e.message || String(e)).split('\n')[0]);
      }
    }
    return ultimo;
  }

  function relatar(nome, pergunta, av, navs) {
    console.log('\n=== ' + nome + ' ===');
    console.log('  ' + pergunta);
    console.log('  service worker:   controlando=' + (av && av.controlado));
    console.log('  _versaoNovaDisponivel = ' + (av && av.bandeira));
    console.log('  aviso na tela:    ' + (av && av.falaDeVersao ? 'SIM — avisa versão nova'
      : (av && av.faixaVisivel ? 'visível, com outro texto: "' + av.texto + '"' : 'nenhum')));
    console.log('  recarga:          ' + (navs > 1 ? 'SIM, ' + (navs - 1) + ' recarga(s) automática(s)' : 'nenhuma')
      + '   marca=' + (av && av.marca));
    console.log('  pode recarregar agora? ' + (av && av.motivo === '' ? 'sim' : 'não — ' + (av && av.motivo)));
    return { avisou: !!(av && (av.falaDeVersao || av.marca)), recargas: navs - 1 };
  }

  console.log('MAPPO — diagnóstico do aviso de versão nova');
  console.log('raiz sob teste: ' + RAIZ);
  console.log('sw.js: ' + fs.statSync(path.join(RAIZ, 'sw.js')).size + ' bytes');
  const linhaVersao = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8').match(/const\s+CACHE_VERSION\s*=\s*'([^']*)'/);
  console.log('CACHE_VERSION: ' + (linhaVersao ? linhaVersao[1] : '(não encontrado)'));

  /* ---------- A e B: mesmo perfil, em sequência ---------- */
  const p1 = await novoPerfil(false);
  const avA = await visitar(p1.pg, 3);
  const A = relatar('CENÁRIO A — primeira visita, app recém-instalado',
    'NÃO deve avisar nem recarregar: não há versão nova, o app acabou de ser instalado.',
    avA, p1.pg.estado.nav);

  sufixoIndex = 'publicacao ' + Date.now();
  sufixoSw = 'cache v' + Date.now();
  const navAntes = p1.pg.estado.nav;
  const avB = await visitar(p1.pg, 8);
  const B = relatar('CENÁRIO B — publicação real (index.html E CACHE_VERSION novos)',
    'DEVE avisar e, em hora segura, recarregar sozinho.',
    avB, p1.pg.estado.nav - navAntes);
  await p1.ctx.close();

  /* ---------- C: a mesma publicação, com a aba ocupada ---------- */
  const p2 = await novoPerfil(true);
  await visitar(p2.pg, 3);                       // instala o SW desta "versão atual"
  sufixoIndex = 'publicacao ' + Date.now();
  sufixoSw = 'cache v' + Date.now();
  const navAntes2 = p2.pg.estado.nav;
  const avC = await visitar(p2.pg, 9);           // passa de RECARGA_ESPERA_MS mais de uma vez
  const C = relatar('CENÁRIO C — mesma publicação, mas com um modal aberto na tela',
    'DEVE avisar e NÃO recarregar: espera a hora segura, sem passar por cima do que a pessoa faz.',
    avC, p2.pg.estado.nav - navAntes2);
  await p2.ctx.close();

  /* ---------- D: publiquei e esqueci de subir o CACHE_VERSION ---------- */
  const p3 = await novoPerfil(false);
  await visitar(p3.pg, 3);
  sufixoIndex = 'publicacao ' + Date.now();      // só o index muda; sw.js fica igual
  const navAntes3 = p3.pg.estado.nav;
  const avD = await visitar(p3.pg, 5);
  const D = relatar('CENÁRIO D — publiquei o index.html e esqueci o CACHE_VERSION',
    'NÃO avisa, e isso é o limite do navegador: sem bytes novos no sw.js não há o que detectar.',
    avD, p3.pg.estado.nav - navAntes3);
  await p3.ctx.close();

  console.log('\n------------------------------------------------------------');
  console.log('MEDIDO:');
  console.log('  A) primeira visita            -> ' + (A.avisou ? 'AVISA  (falso positivo, era o defeito)' : 'não avisa  (correto)')
    + ', ' + A.recargas + ' recarga(s)');
  console.log('  B) publicação real            -> ' + (B.avisou ? 'avisa  (correto)' : 'NÃO AVISA  (o aviso não chega)')
    + ', ' + B.recargas + ' recarga(s) ' + (B.recargas === 1 ? '(correto)' : '(esperado: 1)'));
  console.log('  C) publicação, modal aberto   -> ' + (C.avisou ? 'avisa  (correto)' : 'NÃO AVISA')
    + ', ' + C.recargas + ' recarga(s) ' + (C.recargas === 0 ? '(correto: esperou)' : '(ERRADO: recarregou com modal aberto)'));
  console.log('  D) esqueci o CACHE_VERSION    -> ' + (D.avisou ? 'avisa' : 'não avisa  (limite do navegador)')
    + ', ' + D.recargas + ' recarga(s)');
  console.log('');
  if (!A.avisou && B.avisou && B.recargas === 1 && C.avisou && C.recargas === 0) {
    console.log('  Confere com o contrato da correção: cala na instalação, avisa na publicação,');
    console.log('  recarrega sozinho e espera quando a tela está ocupada.');
  } else {
    console.log('  NÃO confere com o contrato da correção -- antes de mexer no código, confira se a');
    console.log('  suíte testes/teste-atualizacao.js também está vermelha. Se ela estiver verde e');
    console.log('  isto aqui vermelho, o buraco está na suíte.');
  }
  if (!D.avisou) {
    console.log('  E mostra por que a suíte guardiã existe: publicar sem subir o CACHE_VERSION');
    console.log('  continua deixando o aviso mudo -- só que agora o npm test reprova antes.');
  }
  console.log('');
  if (leiturasPerdidas.length) {
    console.log('  Leituras que caíram no meio (a página recarregou enquanto media): ' + leiturasPerdidas.length);
    console.log('  primeira: ' + leiturasPerdidas[0]);
    console.log('  É esperado nos cenários que recarregam. Se aparecer em A ou D, que não');
    console.log('  deveriam recarregar, vale olhar.');
    console.log('');
  }
  console.log('O que isto NÃO mede:');
  console.log('  - o Safari do iPhone, que é onde o app roda de verdade (aqui é Chromium)');
  console.log('  - o cabeçalho de cache do GitHub Pages para o sw.js: aqui ele vai como no-store,');
  console.log('    o que isola a comparação de bytes. Em produção o navegador pode demorar a');
  console.log('    reler o sw.js, atrasando o aviso. Isso é medido em testes/diag-swcache.js.');
  console.log('  - aba que ficou aberta por dias: aqui cada cenário recarrega a página.');
  console.log('  - o caminho reg.waiting ("fechei o app antes de recarregar"): com skipWaiting()');
  console.log('    no install o navegador não deixa o SW esperando tempo suficiente para medir.');
  console.log('------------------------------------------------------------');

  await b.close();
  srv.close();
})();
