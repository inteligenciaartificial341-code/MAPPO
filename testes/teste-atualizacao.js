/* O aviso de versão nova chega quando deve, cala quando não deve, e a troca acontece sem
 * passar por cima do que a pessoa está fazendo.
 *
 * QUAL DEFEITO ISTO IMPEDE DE VOLTAR (medido em testes/diag-atualizacao.js, 01/10/2026 --
 * não deduzido do código):
 *   1. a faixa aparecia na PRIMEIRA visita, pedindo para atualizar um app recém-instalado:
 *      o clients.claim() de um Service Worker novo também dispara 'controllerchange';
 *   2. e ficava MUDA numa publicação real: o navegador só instala um SW novo quando os
 *      BYTES do sw.js mudam -- e o sw.js não mudou uma única vez desde que nasceu, enquanto
 *      o index.html mudou 41 vezes depois dele (78 na história toda do arquivo). O
 *      proprietário publicou dezenas de vezes e nunca viu a faixa.
 *
 * As duas metades são testadas aqui:
 *   PARTE 1 (sem navegador) -- o guardião: CACHE_VERSION é a impressão digital da CASCA
 *     (os arquivos de SHELL_URLS, lidos do próprio sw.js). Mudar a casca sem trocar essa linha
 *     reprova aqui, com a linha exata para colar. Isso faz o `npm test` ficar VERMELHO, o que
 *     AVISA -- não impede publicar: enquanto não houver proteção de ramo em main exigindo o
 *     status check, quem publica tem de olhar o vermelho antes (CLAUDE.md, "O que o CI NÃO
 *     garante"). Mais o CHECK 2, que confere que o diagnóstico de produção está fora do CI.
 *   PARTE 2 (navegador, Service Worker de verdade) -- primeira visita não avisa; publicação
 *     avisa e recarrega sozinha; ao VOLTAR ao app encontra versão nova sem navegar; cada regra
 *     de hora segura uma a uma (operação em voo, .overlay.open, lightbox, texto não salvo,
 *     teto, carência, marca ilegível); a foto comprimindo/gravando impede a recarga; a dedução
 *     do convite não envenena a detecção real; um aviso só; uma recarga só.
 *
 * O QUE ISTO NÃO COBRE (e por isso não deve ser lido como se cobrisse):
 *   - o Safari do iPhone, que é onde o app roda de verdade (aqui é Chromium);
 *   - o cabeçalho de cache que o GitHub Pages manda no sw.js (ver testes/diag-swcache.js);
 *   - o caminho reg.waiting ("fechei o app antes de recarregar"): com skipWaiting() no
 *     install o navegador não deixa o SW esperando por tempo suficiente para o teste pegar
 *     esse estado de forma estável. Está em testes/VERIFICACAO-MANUAL.md.
 *
 * COMO RODAR O CONTROLE (provar que esta suíte pega o defeito):
 *   MAPPO_RAIZ=<cópia de bd4bfd6> node testes/teste-atualizacao.js
 *   Com uma raiz externa a PARTE 1 não aborta: ela imprime a falha, guarda e deixa a PARTE 2
 *   rodar, para a CONDUTA também ser exercitada contra a versão anterior. O exit continua 1.
 *   MAPPO_SO_CONDUTA=1 pula a PARTE 1 de propósito.
 */
'use strict';
const { chromium } = require('playwright');
const path = require('path'), http = require('http'), fs = require('fs'), crypto = require('crypto');
const RAIZ = process.env.MAPPO_RAIZ || path.resolve(__dirname, '..');
function assert(c, m) { if (!c) throw new Error('FALHOU: ' + m); console.log('  ok - ' + m); }

/* Quando a raiz sob teste NÃO é este repositório (o "controle" com MAPPO_RAIZ), a PARTE 1 não
   aborta: ela registra a falha e deixa a PARTE 2 rodar. Sem isso o guardião estourava primeiro
   e os checks de CONDUTA nunca eram exercitados contra a versão anterior -- o critério do spec
   ("a suíte falha lá") valia na letra e não no espírito. O exit continua 1. */
const RAIZ_EXTERNA = !!process.env.MAPPO_RAIZ
  && path.resolve(process.env.MAPPO_RAIZ) !== path.resolve(__dirname, '..');
const SO_CONDUTA = process.env.MAPPO_SO_CONDUTA === '1';
const falhasAdiadas = [];

/* ─────────────────────────── PARTE 1: o guardião ───────────────────────────
   A impressão cobre a CASCA INTEIRA, não só o index.html: os ícones são servidos cache-first
   pelo sw.js, então trocar um ícone sem mexer no index deixaria o ícone antigo vivo para
   sempre em quem já tem o app instalado.
   A lista de arquivos é lida do PRÓPRIO sw.js (SHELL_URLS) -- mesmo princípio da suíte de
   regras, que lê as listas do firestore.rules: acrescentar um arquivo lá passa a exigir versão
   nova sozinho, sem ninguém lembrar de cadastrar nada aqui.
   Texto é normalizado CRLF→LF: sem isso a impressão mudaria só por o arquivo ter sido salvo no
   Windows em vez do Linux, e o teste acusaria mudança onde não houve. Binário (ícone) entra
   byte a byte. Os nomes são ordenados para a impressão não depender da ordem da lista. */
const PREFIXO_VERSAO = 'mappo-shell-';
const EH_TEXTO = /\.(html|json|webmanifest|js|css|svg|txt)$/i;

function lerCascaDoSw(fonteSw) {
  const bloco = fonteSw.match(/const\s+SHELL_URLS\s*=\s*\[([\s\S]*?)\]/);
  if (!bloco) return null;
  const nomes = [];
  bloco[1].replace(/'([^']+)'/g, (_, u) => {
    const nome = u.replace(/^\.\//, '');
    if (nome && nomes.indexOf(nome) === -1) nomes.push(nome);   // './' (= o index) sai da lista
    return _;
  });
  return nomes.sort();
}

function impressaoDeTexto(txt) {
  return crypto.createHash('sha256').update(txt.replace(/\r\n/g, '\n'), 'utf8').digest('hex');
}

function impressaoDaCasca(raiz, nomes) {
  const partes = nomes.map((nome) => {
    const p = path.join(raiz, nome);
    let hash;
    if (EH_TEXTO.test(nome)) hash = impressaoDeTexto(fs.readFileSync(p, 'utf8'));
    else hash = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    return nome + ':' + hash;
  });
  return crypto.createHash('sha256').update(partes.join('\n'), 'utf8').digest('hex').slice(0, 12);
}

function parte1() {
  console.log('\n=== CHECK 1: o CACHE_VERSION do sw.js é a impressão digital da casca ===');
  const fonteSw = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8');

  const achado = fonteSw.match(/const\s+CACHE_VERSION\s*=\s*'([^']*)'/);
  /* A mensagem longa só sai na FALHA: ela é a instrução de conserto, não relatório de
     sucesso -- e um "ok" de dez linhas esconde os outros checks de quem lê a saída. */
  if (!achado) {
    throw new Error('FALHOU: o sw.js não declara CACHE_VERSION numa linha que este teste sabe ler.'
      + '\n\n  O padrão /const CACHE_VERSION = \'...\'/ não casou com nada em ' + path.join(RAIZ, 'sw.js') + '.'
      + '\n  Enquanto não casar, este guardião não guarda nada: zero casamentos e "nenhum'
      + '\n  problema" são indistinguíveis de fora.');
  }
  const nomes = lerCascaDoSw(fonteSw);
  if (!nomes || !nomes.length) {
    throw new Error('FALHOU: não deu para ler SHELL_URLS do sw.js.'
      + '\n\n  Sem a lista da casca este guardião não sabe o que conferir, e "nada mudou"'
      + '\n  fica indistinguível de "não olhei nada".');
  }
  const faltando = nomes.filter((n) => !fs.existsSync(path.join(RAIZ, n)));
  if (faltando.length) {
    throw new Error('FALHOU: SHELL_URLS cita arquivo que não existe: ' + faltando.join(', ')
      + '\n\n  O sw.js tentaria cachear um 404 na instalação.');
  }

  const atual = achado[1];
  const esperado = PREFIXO_VERSAO + impressaoDaCasca(RAIZ, nomes);
  console.log('  casca conferida (de SHELL_URLS): ' + nomes.join(', '));

  /* Controle positivo: antes de concluir "está certo", provar que esta conferência ACUSARIA
     se estivesse errado. Um comparador que casa com tudo devolve verde sem olhar nada. */
  const umIndex = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  assert(impressaoDeTexto(umIndex) !== impressaoDeTexto(umIndex + '\n<!-- x -->'),
    'controle positivo: a impressão muda quando o conteúdo muda');
  assert(esperado !== 'mappo-shell-v1',
    'controle positivo: o valor que ficou parado por 41 mudanças do index.html (mappo-shell-v1) NÃO passaria aqui');
  assert(nomes.indexOf('index.html') !== -1 && nomes.some((n) => /\.png$/i.test(n)),
    'controle positivo: a casca lida do sw.js tem o index.html E ícone (não é uma lista vazia que passaria calada)');

  if (atual !== esperado) {
    const recado = 'FALHOU: a casca do app mudou e o CACHE_VERSION do sw.js não.'
      + '\n'
      + '\n  No sw.js, troque a linha do CACHE_VERSION por exatamente esta:'
      + '\n'
      + '\n      const CACHE_VERSION = \'' + esperado + '\';'
      + '\n'
      + '\n  (está lá: ' + atual + ')'
      + '\n'
      + '\n  Arquivos da casca: ' + nomes.join(', ')
      + '\n'
      + '\n  Por que isto reprova: o navegador só instala um Service Worker novo quando os'
      + '\n  BYTES do sw.js mudam. Com o sw.js parado, nenhuma aba aberta descobre que saiu'
      + '\n  versão nova, e quem tem o app instalado na tela inicial continua rodando o'
      + '\n  código antigo -- foi exatamente o que aconteceu nas 41 publicações anteriores.'
      + '\n'
      + '\n  Isto reprova o npm test, que AVISA. Não impede publicar: enquanto não houver'
      + '\n  proteção de ramo em main exigindo o status check, quem publica tem de olhar o'
      + '\n  vermelho antes (está escrito no CLAUDE.md).';
    if (RAIZ_EXTERNA) { console.log('\n' + recado + '\n'); falhasAdiadas.push('CHECK 1 (guardião)'); return; }
    throw new Error(recado);
  }
  console.log('  ok - o CACHE_VERSION bate com a impressão digital da casca (' + esperado + ')');
}

/* O runner é quem decide o que roda no CI, e a exclusão de um diagnóstico de produção vive
   numa lista escrita à mão em executar.js. Um erro de digitação ali faria o npm test (e o CI)
   bater no site publicado, e NADA reprovaria: o auto-teste do runner usa uma pasta de mentira
   com outros nomes. Esta conferência é a única que olha a lista de verdade. */
function parte1bExclusaoDeProducao() {
  console.log('\n=== CHECK 2: o diagnóstico de produção está fora do npm test e do CI ===');
  const fonteRunner = fs.readFileSync(path.join(__dirname, 'executar.js'), 'utf8');
  const bloco = fonteRunner.match(/const\s+FORA_DO_CI\s*=\s*\[([\s\S]*?)\]/);
  assert(!!bloco, 'controle positivo: achei a lista FORA_DO_CI em executar.js (se não achasse, esta conferência não conferiria nada)');
  const lista = [];
  bloco[1].replace(/'([^']+)'/g, (_, n) => { lista.push(n); return _; });
  console.log('    FORA_DO_CI = ' + lista.join(', '));
  assert(lista.indexOf('diag-pubreal.js') !== -1, 'controle positivo: a lista traz os de produção que já existiam');
  assert(lista.indexOf('diag-swcache.js') !== -1,
    'diag-swcache.js está em FORA_DO_CI -- sem isso o npm test e o CI passariam a bater no site publicado');
  assert(fs.existsSync(path.join(__dirname, 'diag-swcache.js')),
    'e o arquivo existe com esse nome exato (um erro de digitação aqui excluiria um arquivo inexistente e incluiria o verdadeiro)');
  assert(lista.indexOf('teste-atualizacao.js') === -1,
    'controle positivo: a suíte NÃO está na lista -- ela tem de rodar no CI');
}

/* ───────────────── PARTE 2: a conduta, no navegador ─────────────────
   O servidor serve do disco, mas deixa "publicar" sem tocar no repositório: um sufixo é
   anexado ao corpo entregue. Mudar os dois sufixos juntos é uma publicação real (casca nova +
   CACHE_VERSION novo), que é o que o guardião da PARTE 1 obriga. */
let sufixoIndex = '', sufixoSw = '';

function tipo(p) {
  if (p.endsWith('.js')) return 'application/javascript';
  if (p.endsWith('.json') || p.endsWith('.webmanifest')) return 'application/json';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  return 'text/html; charset=utf-8';
}

function lerEstado(pg) {
  return pg.evaluate(() => {
    /* Em 02/10/2026 o aviso de versao saiu do #syncAlerta (faixa de sincronizacao, no topo do
       fluxo, cor de alerta) para o #avisoVersao (pilula position:fixed no rodape, paleta da
       logo). Este leitor passou a medir o elemento novo: a mesma pergunta, no lugar onde o
       aviso mora agora. A deteccao, que e o que esta suite guarda, nao mudou nada.
       O #avisoVersao tem markup ESTATICO no HTML (o JS so tira o `hidden`), entao o texto
       existe mesmo escondido -- por isso falaDeVersao exige `!el.hidden`, senao ele seria
       true desde o boot e a medicao nao distinguiria nada. */
    const el = document.getElementById('avisoVersao');
    const txt = el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
    let marca = null, erroMarca = null;
    try { marca = sessionStorage.getItem('mappo_recarga_versao'); }
    catch (e) { erroMarca = (e && e.code) + ' - ' + (e && e.message); }
    const logs = (typeof _fbLogs !== 'undefined' ? _fbLogs : []);
    return {
      bandeira: (typeof _versaoNovaDisponivel !== 'undefined') ? _versaoNovaDisponivel : null,
      detectada: (typeof _versaoNovaDetectada !== 'undefined') ? _versaoNovaDetectada : null,
      tinhaControlador: (typeof _TINHA_CONTROLADOR !== 'undefined') ? _TINHA_CONTROLADOR : null,
      controlado: !!navigator.serviceWorker.controller,
      oculta: !!(el && el.hidden),
      falaDeVersao: !!(el && !el.hidden && /Nova vers[ãa]o do MAPPO/i.test(txt)),
      motivo: (typeof _porQueNaoRecarregarAgora === 'function') ? _porQueNaoRecarregarAgora() : 'SEM FUNCAO',
      timerPendente: (typeof _timerRecarga !== 'undefined') ? _timerRecarga !== null : null,
      avisos: logs.filter((l) => /Vers[ãa]o nova do app dispon/i.test(l.msg)).length,
      adiados: logs.filter((l) => /recarga adiada/i.test(l.msg)).length,
      desligada: logs.filter((l) => /recarga autom[áa]tica desligada/i.test(l.msg)).length,
      suspeitas: logs.filter((l) => /Suspeita de vers[ãa]o velha/i.test(l.msg)).length,
      marca, erroMarca,
      texto: txt.slice(0, 140)
    };
  });
}

function marcaN(bruto) {
  if (!bruto) return 0;
  try { return Number(JSON.parse(bruto).n) || 0; } catch (e) { return -1; }
}

async function esperar(ms) { await new Promise((r) => setTimeout(r, ms)); }

/* Espera o Service Worker assumir o controle, em vez de um sleep fixo: num runner de 2 vCPUs
   (o do CI) instalar e ativar leva mais que na máquina do proprietário, e um sleep curto
   viraria falha intermitente -- que é pior que teste lento, porque ensina a ignorar o
   vermelho. Sai assim que assumir; o teto só existe para não pendurar a suíte. */
async function esperarControlador(pg, tetoMs) {
  const fim = Date.now() + tetoMs;
  while (Date.now() < fim) {
    await esperar(300);
    let ok = false;
    try { ok = await pg.evaluate(() => !!navigator.serviceWorker.controller); } catch (e) { ok = false; }
    if (ok) return true;
  }
  return false;
}

/* Espera a marca que o app grava em sessionStorage ANTES de recarregar. É a única evidência
   que sobrevive à recarga -- e a evaluate pode cair com "context destroyed" no meio dela,
   por isso cada tentativa é isolada. */
async function esperarMarca(pg, tetoMs) {
  const fim = Date.now() + tetoMs;
  while (Date.now() < fim) {
    await esperar(300);
    try {
      const m = await pg.evaluate(() => { try { return sessionStorage.getItem('mappo_recarga_versao'); } catch (e) { return null; } });
      if (m) return m;
    } catch (e) { /* contexto destruído pela recarga em curso: tenta de novo */ }
  }
  return null;
}

async function esperarAte(pg, fn, tetoMs) {
  const fim = Date.now() + tetoMs;
  while (Date.now() < fim) {
    await esperar(300);
    try { if (await pg.evaluate(fn)) return true; } catch (e) { /* navegação em curso */ }
  }
  return false;
}

(async () => {
  if (SO_CONDUTA) console.log('\n[MAPPO_SO_CONDUTA=1] PARTE 1 pulada de propósito: só a conduta no navegador.');
  else { parte1(); parte1bExclusaoDeProducao(); }

  const srv = http.createServer((rq, rs) => {
    const p = rq.url === '/' ? '/index.html' : rq.url.split('?')[0];
    const f = path.join(RAIZ, p);
    /* isFile(), não só existsSync: um pedido a um diretório ('/testes') passava pelo
       existsSync e derrubava a suíte no readFileSync com EISDIR. */
    let st = null;
    try { st = fs.statSync(f); } catch (e) { st = null; }
    if (!st || !st.isFile()) { rs.writeHead(404); rs.end(); return; }
    let corpo = fs.readFileSync(f);
    if (p.endsWith('index.html') && sufixoIndex) corpo = Buffer.concat([corpo, Buffer.from('\n<!-- ' + sufixoIndex + ' -->')]);
    if (p.endsWith('sw.js') && sufixoSw) corpo = Buffer.concat([corpo, Buffer.from('\n/* ' + sufixoSw + ' */')]);
    /* sw.js sem cache de HTTP: isola o teste na comparação de BYTES que o navegador faz.
       Em produção o GitHub Pages manda cabeçalho próprio -- ver testes/diag-swcache.js. */
    rs.writeHead(200, { 'Content-Type': tipo(p), 'Cache-Control': 'no-store' });
    rs.end(corpo);
  });
  await new Promise((r) => srv.listen(0, r));
  const base = 'http://localhost:' + srv.address().port + '/';

  const b = await chromium.launch();
  const erros = [];

  function novaAba(ctx, rotulo) {
    return ctx.newPage().then((pg) => {
      const est = { nav: 0 };
      pg.on('framenavigated', (f) => { if (f === pg.mainFrame()) est.nav++; });
      pg.on('pageerror', (e) => erros.push(rotulo + ': ' + e.message));
      return { pg, est };
    });
  }

  /* ========== A: primeira visita, publicação real, e a volta ao app ========== */
  const ctxA = await b.newContext();      // perfil limpo: nenhum SW instalado ainda
  const A = await novaAba(ctxA, 'A');

  console.log('\n=== CHECK 3: primeira visita não avisa (e nada recarrega) ===');
  await A.pg.goto(base, { waitUntil: 'load' });
  await esperarControlador(A.pg, 15000);  // instala, ativa, reclama o controle
  await esperar(1500);                    // e sobra tempo para um aviso errado aparecer
  /* Guarda de legibilidade do CONTROLE: rodando com MAPPO_RAIZ apontando para uma versão
     anterior (onde o aviso ainda era o #syncAlerta), esta suíte reprovava com um TypeError de
     "null.hidden" lá no CHECK 14, longe da causa. Aqui ela diz o que falta, na primeira vez
     que o elemento é necessário. Prova exigida que sai ilegível não é prova. */
  const temAviso = await A.pg.evaluate(() => !!document.getElementById('avisoVersao'));
  assert(temAviso === true, 'o #avisoVersao existe nesta versão do app (o aviso de versão saiu do #syncAlerta em 02/10/2026)');
  const e3 = await lerEstado(A.pg);
  console.log('   ', JSON.stringify({ controlado: e3.controlado, bandeira: e3.bandeira, nav: A.est.nav, marca: e3.marca }));
  /* Controle positivo: sem SW instalado, "não avisou" não prova nada -- seria o mesmo
     resultado de um Service Worker que nunca rodou. */
  assert(e3.controlado === true, 'controle positivo: o Service Worker instalou e está controlando a página');
  assert(e3.bandeira === false, 'nenhum aviso de versão nova na primeira visita');
  assert(e3.detectada === false, 'e nada foi detectado como atualização');
  assert(e3.tinhaControlador === false, 'a página sabe que abriu SEM controlador (é instalação, não atualização)');
  assert(e3.oculta === true, 'o aviso de versão continua escondido');
  assert(A.est.nav === 1, 'nenhuma recarga automática (só a navegação do goto)');
  assert(e3.marca === null, 'nenhuma marca de recarga foi gravada');

  console.log('\n=== CHECK 4: publicação real avisa e recarrega sozinha ===');
  sufixoIndex = 'publicacao ' + Date.now();
  sufixoSw = 'cache v' + Date.now();      // o que o guardião da PARTE 1 obriga a fazer
  const navAntes = A.est.nav;
  await A.pg.goto(base, { waitUntil: 'load' });
  const marca4 = await esperarMarca(A.pg, 25000);
  await esperar(1500);
  console.log('    marca=' + marca4 + '  navegações desde o goto=' + (A.est.nav - navAntes));
  assert(!!marca4, 'a aba antiga detectou a versão nova e recarregou sozinha (marca gravada)');
  assert(marcaN(marca4) === 1, 'recarregou UMA vez só, não em laço (contador da sessão = 1)');
  assert(A.est.nav - navAntes >= 2, 'houve a navegação do goto mais a recarga automática');

  /* Esta é a única forma de encontrar versão nova numa aba que NUNCA navega -- a vida normal
     de um app instalado na tela inicial, que é exatamente o caso que deixou o aviso mudo por
     41 publicações. Apagar o bloco de visibilitychange do index.html tem de reprovar AQUI:
     sem ele, nada procura, e quem "detectava" nos outros checks era o goto. */
  console.log('\n=== CHECK 5: ao VOLTAR ao app (sem navegar), procura e encontra versão nova ===');
  await A.pg.evaluate(() => {
    window.__updates = 0;
    const orig = ServiceWorkerRegistration.prototype.update;
    ServiceWorkerRegistration.prototype.update = function () { window.__updates++; return orig.apply(this, arguments); };
  });
  sufixoIndex = 'publicacao ' + Date.now();
  sufixoSw = 'cache v' + Date.now();
  const navAntes5 = A.est.nav;
  await A.pg.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const achou5 = await esperarAte(A.pg, () => _versaoNovaDetectada === true, 20000);
  await esperar(800);
  const e5 = await lerEstado(A.pg);
  const updates5 = await A.pg.evaluate(() => window.__updates);
  console.log('    reg.update() chamado ' + updates5 + 'x   detectada=' + e5.detectada + '   motivo=' + e5.motivo + '   nav=' + (A.est.nav - navAntes5));
  assert(updates5 >= 1, 'o evento de volta ao app disparou reg.update() (é o listener, não o goto)');
  assert(achou5 === true && e5.detectada === true, 'a versão nova foi detectada sem nenhuma navegação');
  assert(e5.falaDeVersao === true, 'e o aviso de versão aparece na tela');
  assert(e5.motivo === 'recarga recente', 'a carência da recarga anterior é o motivo de não recarregar agora');
  assert(A.est.nav - navAntes5 === 0, 'nenhuma recarga: a carência de 60s segurou, como manda o contrato');
  await ctxA.close();

  /* ========== B: a definição de hora segura, regra por regra ========== */
  const ctxB = await b.newContext();
  const B = await novaAba(ctxB, 'B');
  await B.pg.goto(base, { waitUntil: 'load' });
  await esperarControlador(B.pg, 15000);
  await esperar(500);

  console.log('\n=== CHECK 6: cada regra de hora segura, uma a uma ===');
  const r6 = await B.pg.evaluate(async () => {
    const out = {};
    out.limpo = _porQueNaoRecarregarAgora();

    /* 1. Sobreposição que NÃO é o #curOverlay (showModal não é o único jeito de abrir uma). */
    const ov = document.createElement('div');
    ov.className = 'overlay open'; ov.id = 'overlayQualquer';
    document.body.appendChild(ov);
    out.overlayQualquer = _porQueNaoRecarregarAgora();
    ov.remove();

    /* 2. Lightbox: foto em tela cheia é sobreposição própria, com classe própria. */
    const lb = document.getElementById('lightbox');
    out.temLightbox = !!lb;
    if (lb) { lb.classList.add('open'); out.lightbox = _porQueNaoRecarregarAgora(); lb.classList.remove('open'); }

    /* 3. Texto digitado e não salvo, FORA de modal e SEM foco -- o caso do #notaGestor, que
       só é salvo pelo botão. defaultValue é o que foi pintado (= o já salvo). */
    const area = document.createElement('div');
    area.innerHTML = '<textarea id="notaGestor">nota salva</textarea>'
      + '<textarea id="campoQueSalvaSozinho" oninput="void 0">nota salva</textarea>';
    document.body.appendChild(area);
    const nota = document.getElementById('notaGestor');
    const auto = document.getElementById('campoQueSalvaSozinho');
    out.igualAoSalvo = _porQueNaoRecarregarAgora();          // ainda não digitou nada
    nota.value = 'nota salva' + ' com coisa nova';
    nota.blur();
    out.textoNaoSalvo = _porQueNaoRecarregarAgora();
    /* E depois de salvar pelo BOTÃO tem de parar de bloquear. salvarNota salva sem repintar a
       tela, então sem sincronizar defaultValue o campo ficaria com cara de não salvo para
       sempre e esta aba nunca mais se atualizaria sozinha nesta tela. */
    const osAntes = osList;
    osList = [{ id: 'os_teste_nota', notaGestor: 'nota salva' }];
    salvarNota('os_teste_nota');
    out.depoisDeSalvarPeloBotao = _porQueNaoRecarregarAgora();
    out.notaGuardada = osList[0].notaGestor;
    osList = osAntes;
    nota.value = nota.defaultValue;   // o salvar acima mudou o defaultValue: zera pelo que vale agora
    out.notaNeutralizada = _porQueNaoRecarregarAgora();
    auto.value = 'digitando na execução da OS';
    out.campoQueSalvaSozinho = _porQueNaoRecarregarAgora();  // tem oninput: já está salvo
    area.remove();

    /* 4. Operação em voo: a gravação no armazém do aparelho. O motivo é lido SÍNCRONO, antes
       de qualquer await, porque é assim que a janela do defeito existe. */
    const p = guardarFotoNoAparelho('mappo_foto__teste_em_voo', 'data:image/gif;base64,R0lGODlhAQABAAAAACw=');
    out.gravandoFoto = _porQueNaoRecarregarAgora();
    out.opsDuranteGravacao = _opsEmVooTotal();
    try { await p; } catch (e) { out.erroGravacao = (e && e.code) + ' - ' + (e && e.message); }
    out.depoisDaGravacao = _porQueNaoRecarregarAgora();

    /* 5. Teto de recargas da sessão. ts=0 de propósito: assim a carência NÃO responde e o
       único motivo possível é o teto -- senão a carência mascara o teto apagado. */
    try { sessionStorage.setItem('mappo_recarga_versao', JSON.stringify({ n: 3, ts: 0 })); } catch (e) { out.erroSemear = e.message; }
    out.teto = _porQueNaoRecarregarAgora();
    try { sessionStorage.removeItem('mappo_recarga_versao'); } catch (e) { /* medido em out.erroSemear */ }
    out.depoisDeLimpar = _porQueNaoRecarregarAgora();
    return out;
  });
  console.log('   ', JSON.stringify(r6));
  assert(r6.limpo === '', 'controle positivo: sem nada acontecendo, a hora É segura (senão todo assert abaixo passaria por acidente)');
  assert(r6.overlayQualquer === 'modal aberto', 'uma .overlay.open qualquer bloqueia, não só o #curOverlay');
  assert(r6.temLightbox === true, 'controle positivo: o #lightbox existe na página');
  assert(r6.lightbox === 'foto aberta em tela cheia', 'foto aberta em tela cheia bloqueia a recarga');
  assert(r6.igualAoSalvo === '', 'texto igual ao salvo não bloqueia');
  assert(/^texto digitado e não salvo/.test(r6.textoNaoSalvo), 'texto digitado e não salvo bloqueia mesmo sem foco e fora de modal');
  assert(r6.notaGuardada === 'nota salva com coisa nova', 'controle positivo: salvarNota de fato guardou o texto novo');
  assert(r6.depoisDeSalvarPeloBotao === '', 'salvo pelo botão, para de bloquear (senão a aba nunca mais se atualizaria nessa tela)');
  assert(r6.notaNeutralizada === '', 'controle do próprio teste: a nota voltou a não bloquear antes do check seguinte');
  assert(r6.campoQueSalvaSozinho === '', 'campo que salva a cada tecla (oninput) NÃO bloqueia -- senão a execução de OS nunca atualizaria');
  assert(r6.opsDuranteGravacao >= 1, 'a gravação da foto conta como operação em voo');
  assert(r6.gravandoFoto === 'operação em voo: gravando foto no aparelho', 'e é esse o motivo de não recarregar');
  assert(r6.depoisDaGravacao === '', 'terminada a gravação, volta a ser hora segura');
  assert(r6.teto === 'teto de recargas automáticas desta sessão', 'o teto de recargas da sessão bloqueia (com ts=0, a carência não responde)');
  assert(r6.depoisDeLimpar === '', 'limpa a marca, volta a ser hora segura');

  /* O defeito que a revisão achou, exatamente como ele acontece: onEquipFoto limpa o input e
     só então comprime e grava, de forma assíncrona. A trava _fotoEmProcessamento que já
     existia é liberada ANTES do callback, então ela NÃO cobre a gravação -- e é na gravação
     que a recarga apagaria a foto para sempre. */
  console.log('\n=== CHECK 7: a foto comprimindo/gravando impede a recarga (foto não se perde) ===');
  const r7 = await B.pg.evaluate(async () => {
    const out = {};
    const file = await new Promise((res) => {
      const c = document.createElement('canvas'); c.width = c.height = 8;
      const cx = c.getContext('2d'); cx.fillStyle = '#123456'; cx.fillRect(0, 0, 8, 8);
      c.toBlob((bl) => res(new File([bl], 'teste.png', { type: 'image/png' })), 'image/png');
    });
    out.antes = _porQueNaoRecarregarAgora();
    await new Promise((res) => {
      vrfComprimirImagem(file, async (b64) => {
        out.recebeuB64 = typeof b64 === 'string' && b64.indexOf('data:image/jpeg') === 0;
        out.travaAntigaNoCb = _fotoEmProcessamento;        // já está false: era o buraco
        out.motivoNoCb = _porQueNaoRecarregarAgora();
        /* a janela real: depois do primeiro await, com o input já limpo pelo chamador */
        await new Promise((r) => setTimeout(r, 400));
        out.motivoDepoisDoAwait = _porQueNaoRecarregarAgora();
        _avisarVersaoNova('teste: versão nova chegando no meio da foto');
        out.motivoAoAvisar = _porQueNaoRecarregarAgora();
        out.timerArmado = _timerRecarga !== null;
        /* Abre o modal AQUI, ainda dentro da janela da foto: a tentativa agendada roda em 4s
           e, sem isto, ela encontraria hora segura entre este check e o próximo e recarregaria
           a aba no meio da suíte. Também é o que deixa o CHECK 8 pronto. */
        showModal('<p>modal de teste</p>');
        res();
      });
    });
    /* Um tique de folga: res() é chamado DENTRO do callback, então a promessa do callback
       (que é quem fecha a operação em voo) ainda não assentou neste ponto. */
    await new Promise((r) => setTimeout(r, 150));
    out.depois = _porQueNaoRecarregarAgora();
    out.detectada = _versaoNovaDetectada;
    return out;
  });
  console.log('   ', JSON.stringify(r7));
  assert(r7.antes === '', 'controle positivo: antes da foto, a hora era segura');
  assert(r7.recebeuB64 === true, 'controle positivo: a compressão de verdade rodou e devolveu a imagem');
  assert(r7.travaAntigaNoCb === false,
    'controle positivo: a trava antiga (_fotoEmProcessamento) JÁ está liberada no callback -- é por isso que ela não bastava');
  assert(/^operação em voo/.test(r7.motivoNoCb), 'a gravação da foto é operação em voo logo no começo do callback');
  assert(/^operação em voo/.test(r7.motivoDepoisDoAwait), 'e continua em voo DEPOIS do await -- a janela exata em que a foto se perderia');
  assert(/^operação em voo/.test(r7.motivoAoAvisar), 'versão nova chegando nessa janela NÃO recarrega');
  assert(r7.timerArmado === true, 'fica uma nova tentativa agendada (o aviso não é descartado)');
  assert(r7.detectada === true, 'e a detecção foi registrada normalmente');
  /* 'modal aberto' e não 'operação em voo' prova que a operação FECHOU quando a foto terminou:
     operação em voo tem prioridade sobre modal, então ela não está mais lá. */
  assert(r7.depois === 'modal aberto', 'terminada a foto, a operação em voo fechou (o motivo passou a ser o modal que ficou aberto)');
  assert(B.est.nav === 1, 'nada recarregou durante a foto');

  console.log('\n=== CHECK 8: modal aberto ADIA a recarga (e o aviso é um só) ===');
  await B.pg.evaluate(() => {
    _avisarVersaoNova('teste: evento 1');
    _avisarVersaoNova('teste: evento 2');     // 'controllerchange' pode repetir
  });
  const e8 = await lerEstado(B.pg);
  console.log('   ', JSON.stringify({ motivo: e8.motivo, timer: e8.timerPendente, avisos: e8.avisos, adiados: e8.adiados, nav: B.est.nav }));
  assert(e8.motivo === 'modal aberto', 'o app sabe dizer por que não pode recarregar agora');
  assert(e8.bandeira === true, 'o aviso de versão nova está de pé');
  assert(e8.falaDeVersao === true && e8.oculta === false, 'o aviso de versão está na tela');
  assert(e8.avisos === 1, 'três chamadas, UM aviso só no log (o aviso não duplica)');
  assert(e8.timerPendente === true, 'ficou uma nova tentativa agendada (o aviso não foi descartado)');
  /* A linha de base é lida DEPOIS da primeira tentativa com este motivo: entre o CHECK 7 e
     agora o motivo mudou de propósito (de "operação em voo" para "modal aberto"), e mudança de
     motivo DEVE ser logada. O que não pode é repetir o mesmo motivo a cada 4s. */
  await esperar(5000);
  const base8 = (await lerEstado(B.pg)).adiados;
  await esperar(9000);                        // mais duas tentativas, mesmo motivo
  const e8b = await lerEstado(B.pg);
  console.log('    adiamentos logados: ' + base8 + ' -> ' + e8b.adiados + ' (em 9s de tentativas)');
  assert(B.est.nav === 1, 'com o modal aberto, continua sem recarregar mesmo depois de tentar de novo');
  assert(e8b.adiados === base8, 'e o adiamento é logado uma vez por MOTIVO, não a cada 4s (o anel de log tem 60 linhas)');
  assert(!!(await B.pg.evaluate(() => !!document.getElementById('curOverlay'))), 'o modal continua aberto');

  console.log('\n=== CHECK 9: campo em foco ADIA a recarga ===');
  await B.pg.evaluate(() => {
    closeModal();
    const i = document.createElement('input');
    i.id = '__focoDoTeste';
    document.body.appendChild(i);
    i.focus();
  });
  await esperar(600);
  const e9 = await lerEstado(B.pg);
  console.log('    motivo=' + e9.motivo);
  assert(e9.motivo === 'campo em foco', 'fechado o modal, o campo em foco continua barrando a recarga');
  await esperar(5000);
  assert(B.est.nav === 1, 'com o cursor num campo, não recarrega -- nem na tentativa seguinte');
  assert(e9.bandeira === true, 'e o aviso continua de pé, esperando a hora');

  console.log('\n=== CHECK 10: quando fica seguro, recarrega sozinho -- uma vez ===');
  await B.pg.evaluate(() => {
    const i = document.getElementById('__focoDoTeste');
    if (i) { i.blur(); i.remove(); }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  });
  const recarregou = !!(await esperarMarca(B.pg, 20000));   // a tentativa agendada roda sozinha
  await esperar(1200);
  const e10 = await lerEstado(B.pg);
  console.log('    marca=' + e10.marca + '  navegações=' + B.est.nav);
  assert(recarregou === true, 'passada a hora insegura, a tentativa agendada recarregou sozinha');
  assert(B.est.nav === 2, 'exatamente uma recarga (nenhuma durante a foto, o modal ou o foco)');
  assert(marcaN(e10.marca) === 1, 'o contador de recargas da sessão é 1');

  console.log('\n=== CHECK 11: depois de recarregar, não recarrega de novo em seguida ===');
  const e11 = await B.pg.evaluate(() => {
    _avisarVersaoNova('teste: de novo, logo depois');
    return { motivo: _porQueNaoRecarregarAgora(), bandeira: _versaoNovaDisponivel };
  });
  await esperar(1500);
  /* A BANDEIRA NÃO BASTA: desde 02/10/2026 _versaoNovaDisponivel não é lida em lugar nenhum do
     index.html -- é só telemetria. Provar a presença do aviso por ela deixaria este check verde
     com a pílula nunca aparecendo na tela. Por isso o elemento é medido junto. */
  const e11el = await lerEstado(B.pg);
  console.log('    motivo=' + e11.motivo + '  navegações=' + B.est.nav + '  avisoNaTela=' + e11el.falaDeVersao);
  assert(e11.motivo === 'recarga recente', 'a carência depois de uma recarga é o motivo de não recarregar');
  assert(e11.bandeira === true, 'o aviso de versão aparece de novo -- o que não acontece é a recarga automática');
  assert(e11el.falaDeVersao === true && e11el.oculta === false,
    'e o aviso está MESMO na tela (elemento visível com o texto), não só a bandeira ligada');
  assert(B.est.nav === 2, 'nenhuma segunda recarga: a trava atravessa a própria recarga');
  await ctxB.close();

  /* ========== C: a dedução do convite não pode envenenar a detecção real ========== */
  console.log('\n=== CHECK 12: convite negado avisa, e a atualização REAL depois ainda recarrega ===');
  const ctxC = await b.newContext();
  const C = await novaAba(ctxC, 'C');
  await C.pg.goto(base, { waitUntil: 'load' });
  await esperarControlador(C.pg, 15000);
  await esperar(500);
  const e12a = await C.pg.evaluate(() => {
    _avisarVersaoVelhaPorErro('teste: a regra do servidor negou o convite');
    return {
      bandeira: _versaoNovaDisponivel, detectada: _versaoNovaDetectada,
      timer: _timerRecarga !== null, motivo: _porQueNaoRecarregarAgora()
    };
  });
  await esperar(1500);
  const e12b = await lerEstado(C.pg);
  console.log('    dedução:', JSON.stringify(e12a), ' nav=' + C.est.nav);
  assert(e12a.bandeira === true && e12b.falaDeVersao === true, 'a dedução acende o aviso de versão');
  assert(e12b.suspeitas === 1, 'e deixa rastro no log (suspeita de versão velha)');
  assert(e12a.detectada === false, 'mas NÃO marca como detectada: dedução não é detecção');
  assert(e12a.timer === false && C.est.nav === 1, 'e não recarrega sozinha nem agenda recarga');
  assert(e12a.motivo === '', 'controle positivo: a hora ERA segura -- se a recarga não veio, foi por ser dedução, não por falta de hora');

  const navAntes12 = C.est.nav;
  await C.pg.evaluate(() => { setTimeout(() => _avisarVersaoNova('teste: atualização real depois do convite'), 0); });
  const marca12 = await esperarMarca(C.pg, 15000);
  await esperar(1000);
  console.log('    depois da detecção real: marca=' + marca12 + '  nav=' + (C.est.nav - navAntes12));
  assert(!!marca12, 'a detecção REAL depois da dedução AINDA arma a recarga (era o defeito: uma falha de convite desligava a recarga da aba para sempre)');
  assert(C.est.nav - navAntes12 === 1, 'e recarregou exatamente uma vez');
  const e12c = await lerEstado(C.pg);
  assert(e12c.avisos >= 0, 'leitura do log depois da recarga não quebra');
  await ctxC.close();

  /* ========== D: marca ilegível -- desconhecido é inseguro, nunca zero ========== */
  console.log('\n=== CHECK 13: se a marca não pode ser lida, NÃO recarrega ===');
  const ctxD = await b.newContext();
  const D = await novaAba(ctxD, 'D');
  await D.pg.addInitScript(() => {
    /* sessionStorage que lança em qualquer acesso: é o que acontece em navegador com
       armazenamento bloqueado por política. O app tem de tratar como inseguro. */
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() { const e = new Error('armazenamento bloqueado pelo teste'); e.code = 'SecurityError'; throw e; }
    });
  });
  await D.pg.goto(base, { waitUntil: 'load' });
  await esperarControlador(D.pg, 15000);
  await esperar(500);
  const e13 = await D.pg.evaluate(() => {
    let lancou = false;
    try { sessionStorage.getItem('x'); } catch (e) { lancou = true; }
    _avisarVersaoNova('teste: versão nova com armazenamento bloqueado');
    return {
      lancou, motivo: _porQueNaoRecarregarAgora(), timer: _timerRecarga !== null,
      bandeira: _versaoNovaDisponivel,
      desligada: (_fbLogs || []).filter((l) => /recarga autom[áa]tica desligada/i.test(l.msg)).length,
      logouFalha: (_fbLogs || []).filter((l) => /marca de recarga/i.test(l.msg)).length
    };
  });
  await esperar(2000);
  console.log('   ', JSON.stringify(e13), ' nav=' + D.est.nav);
  assert(e13.lancou === true, 'controle positivo: neste contexto o sessionStorage realmente lança');
  assert(e13.motivo === 'não deu para ler a marca de recarga', 'marca ilegível é tratada como hora INSEGURA, não como zero');
  assert(D.est.nav === 1, 'e nada recarregou');
  /* mesma razão do CHECK 11: a bandeira sozinha não prova que a pessoa VÊ alguma coisa */
  const e13el = await lerEstado(D.pg);
  assert(e13.bandeira === true, 'a bandeira do aviso de versão está ligada');
  assert(e13el.falaDeVersao === true && e13el.oculta === false,
    'e o aviso está na tela, com o botão "Atualizar" -- é por ele que a pessoa resolve, já que a recarga automática desistiu');
  assert(e13.timer === false, 'não fica tentando de novo para sempre: o motivo não se resolve esperando');
  assert(e13.desligada >= 1, 'e o log diz que a recarga automática foi desligada, com o motivo');
  assert(e13.logouFalha >= 1, 'a falha de leitura foi registrada (não engolida)');
  await ctxD.close();

  /* ========== E: navegador sem Service Worker ========== */
  console.log('\n=== CHECK 14: sem Service Worker, o app abre normalmente e não avisa ===');
  const ctxE = await b.newContext({ serviceWorkers: 'block' });
  const E = await novaAba(ctxE, 'E');
  await E.pg.goto(base, { waitUntil: 'load' });
  await esperar(2500);
  const e14 = await E.pg.evaluate(() => ({
    bandeira: _versaoNovaDisponivel,
    controlado: !!navigator.serviceWorker.controller,
    oculta: !!document.getElementById('avisoVersao').hidden,
    logSw: (_fbLogs || []).filter((l) => /Service Worker/i.test(l.msg)).map((l) => l.msg.slice(0, 90))
  }));
  console.log('   ', JSON.stringify(e14));
  assert(e14.controlado === false, 'controle positivo: nenhum Service Worker assumiu esta página');
  assert(e14.bandeira === false, 'nenhum aviso de versão nova');
  assert(e14.oculta === true, 'nenhum aviso de versão na tela');
  assert(E.est.nav === 1, 'nada recarregou');
  assert(e14.logSw.some((m) => /não registrado|nao registrado/i.test(m)),
    'a falha de registro foi registrada no log com o motivo (não engolida)');
  await ctxE.close();

  console.log('\n=== erros de pagina ===');
  console.log(erros.length ? erros : '(nenhum)');
  assert(erros.length === 0, 'nenhum erro de pagina');

  await b.close();
  srv.close();

  /* Falha adiada existe só no controle (MAPPO_RAIZ apontando para outra versão): ali a PARTE 1
     não aborta, para a conduta também ser exercitada. O exit continua 1 e sem veredito. */
  if (falhasAdiadas.length) {
    console.error('\nFALHOU (adiado, raiz externa): ' + falhasAdiadas.join(', '));
    process.exit(1);
  }
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch((e) => { console.error('\n' + e.message); process.exit(1); });
