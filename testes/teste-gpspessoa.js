/* POSICAO POR PESSOA: um documento por uid, so o dono escreve o dele -- e o blob antigo
 * NAO consegue mais falsificar a posicao de quem ja atualizou.
 *
 * QUAL DEFEITO ISSO IMPEDE DE VOLTAR: a posicao de toda a equipe vivia em dois blobs
 * compartilhados em workspaces/{ws}/data/ -- mappo_locations e mappo_live -- e a regra desse
 * caminho so exige ser membro do workspace. QUALQUER tecnico podia gravar a posicao de
 * QUALQUER colega. E a prova de onde a pessoa esteve, e ela era falsificavel: o unico item do
 * Bloco 2 em que falsificar tem consequencia real.
 *
 * E IMPEDE TAMBEM A CORRECAO DE FACHADA: na transicao o blob continua sendo LIDO (celular na
 * versao antiga so escreve lá). Se a juncao fosse por data -- o critério de _mergeMapa -- um
 * blob falsificado com ts de agora venceria a posicao legitima do documento por uid, e o
 * caminho novo rodaria ao lado do falsificavel com o falsificavel ganhando. O CHECK 7 e o que
 * mede isso.
 *
 * O QUE FOI OBSERVADO NA VERSAO ANTERIOR (`MAPPO_RAIZ` apontando para d58536b): a suite para
 * no primeiro assert, e o que se observou de fato foi o CHECK 1 -- o envio ainda grava
 * data/mappo_locations e data/mappo_live, e nenhum documento por uid. Os checks seguintes nao
 * chegam a rodar lá, entao esta suite nao afirma nada sobre eles naquela versao.
 */
const { chromium } = require('playwright');
const path = require('path'), http = require('http'), fs = require('fs');
const RAIZ = process.env.MAPPO_RAIZ || path.resolve(__dirname, '..');
function assert(c, m) { if (!c) throw new Error('FALHOU: ' + m); console.log('  ok - ' + m); }
const linha = () => console.log('');

/* O conjunto de chaves do envelope LIDO DO PROPRIO firestore.rules -- mesmo princípio do grupo 0
   de teste-regras.js, que já lê isGestorOnlyDoc()/ramoValido() da regra.
   POR QUE: a regra é o único ponto do app que restringe as chaves do documento, e quem monta o
   envelope é _gravarMesclado, helper COMPARTILHADO por todos os caminhos de envio. Acrescentar
   um quarto campo lá, por qualquer motivo, faria TODA escrita de live/{uid} falhar com
   permission-denied em produção -- e sem esta amarra isso acontecia com npm test verde. */
function chavesDoEnvelopeNaRegra() {
  const fonte = fs.readFileSync(path.join(RAIZ, 'firestore.rules'), 'utf8');
  const i = fonte.indexOf('match /workspaces/{wsId}/live/{uid}');
  if (i < 0) throw new Error(
    'firestore.rules da raiz sob teste NAO tem o bloco match /workspaces/{wsId}/live/{uid}.'
    + ' Se MAPPO_RAIZ aponta para uma versao anterior a esta entrega (ex.: d58536b), esta'
    + ' reprovacao e o resultado esperado do controle: lá o caminho por uid nem existe, e o'
    + ' envio ainda ia para os blobs data/mappo_locations e data/mappo_live.'
    + ' Se a raiz e o proprio repositorio, a regra foi removida ou reestruturada -- refaca a amarra.');
  const m = fonte.slice(i).match(/hasOnly\(\[([^\]]*)\]\)/);
  if (!m) throw new Error('nao achei hasOnly([...]) no bloco live/{uid} -- a regra foi reestruturada, refaca esta amarra');
  return m[1].split(',').map((x) => x.trim().replace(/^'|'$/g, '')).filter(Boolean);
}

function montarFake(CFG) {
  /* O fake NEGA o que a regra negaria. Sem isto o fake era mais permissivo que produção: um
     quarto campo no envelope passava aqui e morria no servidor. */
  window.__chavesEnvelope = CFG.chavesEnvelope;
  /* Nuvem falsa com CAMINHO, nao so nome de documento: a diferenca entre 'data/mappo_live' e
     'live/u-paulo' e justamente o que esta entrega muda, e um fake que ignora a colecao nao
     enxergaria o defeito. */
  window.__nuvem = {};
  window.__negarLive = false;      // escrita em live/* negada (regra nao publicada)
  window.__negarLeitura = false;   // leitura da colecao live negada
  window.__cbs = {};               // callbacks de onSnapshot, por colecao
  window.__errs = {};
  const negar = (detalhe) => {
    const e = new Error('Missing or insufficient permissions.' + (detalhe ? ' (' + detalhe + ')' : ''));
    e.code = 'permission-denied';
    throw e;
  };
  const negarEscrita = (k, d) => {
    if (k.indexOf('live/') !== 0) return;              // a regra governa só este caminho
    if (window.__negarLive) negar('regra nao publicada');
    // hasOnly([...]) e json is string, exatamente como firestore.rules exige
    const extras = Object.keys(d || {}).filter((x) => window.__chavesEnvelope.indexOf(x) < 0);
    if (extras.length) negar('campo fora do envelope: ' + extras.join(','));
    if (typeof (d || {}).json !== 'string') negar('json nao e string');
  };
  const fazerRef = (col, id) => {
    const k = col + '/' + id;
    return {
      __k: k,
      get: async () => ({ exists: window.__nuvem[k] !== undefined, data: () => ({ json: window.__nuvem[k] }) }),
      set: async (d) => { negarEscrita(k, d); window.__nuvem[k] = d.json; },
      delete: async () => { delete window.__nuvem[k]; },
      onSnapshot: () => () => {},
    };
  };
  const fazerCol = (col) => ({
    doc: (id) => fazerRef(col, id),
    where: function () { return this; },
    onSnapshot: (ok, err) => { window.__cbs[col] = ok; window.__errs[col] = err; return () => {}; },
    get: async () => {
      if (col === 'live' && window.__negarLeitura) {
        const e = new Error('Missing or insufficient permissions.');
        e.code = 'permission-denied';
        throw e;
      }
      const ids = Object.keys(window.__nuvem)
        .filter((k) => k.indexOf(col + '/') === 0)
        .map((k) => k.slice(col.length + 1));
      return {
        size: ids.length,
        forEach: (fn) => ids.forEach((id) => fn({ id, data: () => ({ json: window.__nuvem[col + '/' + id] }) })),
      };
    },
  });
  fbDB = {
    collection: () => ({ doc: () => ({ collection: fazerCol }) }),
    runTransaction: async (fn) => fn({
      get: async (r) => ({ exists: window.__nuvem[r.__k] !== undefined, data: () => ({ json: window.__nuvem[r.__k] }) }),
      set: (r, d) => { negarEscrita(r.__k, d); window.__nuvem[r.__k] = d.json; },
    }),
  };
  firebase = { firestore: { FieldValue: { serverTimestamp: () => Date.now() }, FieldPath: { documentId: () => '__name__' } } };
  fbReady = true; WORKSPACE = 'ws'; _avisouSessaoExpirada = true;
  session = { perfil: 'tecnico', nome: 'Paulo', uid: 'u-paulo', role: 'Técnico de Campo', workspaceId: 'ws' };
  window.equipePadrao = () => [
    { id: 't1', nome: 'Paulo', uid: 'u-paulo', ativo: true, modulos: { split: true, vrfObras: [] } },
    { id: 't2', nome: 'Jorge', uid: 'u-jorge', ativo: true, modulos: { split: true, vrfObras: [] } },
  ];
  tecnicos = equipePadrao();

  window.posDe = (lat, ts) => ({ lat, lng: -49.25, acc: 8, ts: ts || Date.now() });
  window.liveDe = (lat, ts, quantos) => {
    const t = ts || Date.now();
    const pontos = [];
    for (let i = 0; i < (quantos || 1); i++) pontos.push({ lat: lat + i / 100000, lng: -49.25, ts: t - i * 5000 });
    return { pontos, atual: { lat, lng: -49.25, acc: 8, ts: t }, ativo: true, inicioTs: t - 60000, fimTs: t + 36000000 };
  };
  window.setLocs = (v) => {
    _quietWrite = true; localStorage.setItem('mappo_locations', JSON.stringify(v)); _quietWrite = false;
    _snapshot['mappo_locations'] = JSON.stringify(v);
  };
  window.setLives = (v) => {
    _quietWrite = true; localStorage.setItem('mappo_live', JSON.stringify(v)); _quietWrite = false;
    liveTracks = v; _snapshot['mappo_live'] = JSON.stringify(v);
  };
  window.getLocs = () => JSON.parse(localStorage.getItem('mappo_locations') || '{}');
  window.getLives = () => JSON.parse(localStorage.getItem('mappo_live') || '{}');
  window.docsLive = () => Object.keys(window.__nuvem).filter((k) => k.indexOf('live/') === 0).sort();
  window.docsData = () => Object.keys(window.__nuvem).filter((k) => k.indexOf('data/') === 0).sort();
  window.zerar = () => {
    window.__nuvem = {}; window.__negarLive = false; window.__negarLeitura = false;
    window.__cbs = {}; window.__errs = {};
    _pend = {}; _localTouch = {}; _falhasEnvio = {}; _falhasLeitura = {}; _chavesQuaseCheias = {};
    // cancela envios agendados por checks anteriores (mesmo motivo do zerar de teste-fototarefa)
    Object.keys(_pushTimers).forEach((k) => { clearTimeout(_pushTimers[k]); delete _pushTimers[k]; });
    // na versao anterior este cache nem existe -- typeof em identificador nao declarado nao lanca
    if (typeof _posicoesPorUid !== 'undefined') Object.keys(_posicoesPorUid).forEach((k) => { delete _posicoesPorUid[k]; });
    tecnicos = equipePadrao();
    session.nome = 'Paulo'; session.uid = 'u-paulo'; session.perfil = 'tecnico';
    setLocs({}); setLives({});
  };
  window.montarFaixa = () => {
    let el = document.getElementById('syncAlerta');
    if (!el) { el = document.createElement('div'); el.id = 'syncAlerta'; document.body.appendChild(el); }
    el.hidden = true; el.className = 'sync-alerta'; el.innerHTML = '';
    return el;
  };
  window.faixa = () => {
    const el = document.getElementById('syncAlerta');
    return {
      escondida: !el || el.hidden === true,
      texto: el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '',
    };
  };
  window.ultimosLogs = (n) => _fbLogs.slice(-(n || 5)).map((l) => l.msg).join(' | ');
  window.linhasDaTabela = () => {
    let div = document.getElementById('diagTamanhos');
    if (!div) { div = document.createElement('div'); div.id = 'diagTamanhos'; document.body.appendChild(div); }
    renderDiagTamanhos();
    return [...div.querySelectorAll('.diag-tam')].map((e) => e.textContent.replace(/\s+/g, ' ').trim());
  };
  /* Entrega um snapshot da colecao live ao callback REAL que fbStartListeners registrou. */
  window.entregarSnapshotLive = (mudancas) => {
    if (typeof window.__cbs['live'] !== 'function') throw new Error('fbStartListeners nao registrou listener na colecao live');
    window.__cbs['live']({ docChanges: () => mudancas });
  };
  window.docFalso = (id, corpo) => ({ type: 'added', doc: { id, data: () => ({ json: JSON.stringify(corpo) }) } });
  /* Observa QUE atrasos foram agendados durante fn() -- serve para provar que algo NAO foi
     agendado, que é o que a queima de cota exige medir. */
  window.atrasosAgendados = async (fn) => {
    const orig = window.setTimeout;
    const vistos = [];
    window.setTimeout = (f, ms) => { vistos.push(ms); return orig(f, ms); };
    try { await fn(); } finally { window.setTimeout = orig; }
    return vistos;
  };
}

(async () => {
  const srv = http.createServer((rq, rs) => {
    const p = rq.url === '/' ? '/index.html' : rq.url.split('?')[0];
    const f = path.join(RAIZ, p);
    if (!fs.existsSync(f)) { rs.writeHead(404); rs.end(); return; }
    rs.writeHead(200); rs.end(fs.readFileSync(f));
  });
  await new Promise((r) => srv.listen(0, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const pg = await ctx.newPage();
  const erros = []; pg.on('pageerror', (e) => erros.push(e.message));
  pg.on('dialog', (d) => d.accept());
  await pg.goto('http://localhost:' + srv.address().port + '/', { waitUntil: 'load' });
  await pg.waitForTimeout(400);
  await pg.evaluate(montarFake, { chavesEnvelope: chavesDoEnvelopeNaRegra() });

  linha(); console.log('=== CHECK 1: O CASO VIVO -- o envio vai para live/{uid}, NAO para o blob ===');
  const r1 = await pg.evaluate(async () => {
    zerar();
    setLocs({ Paulo: posDe(-16.68) });
    setLives({ Paulo: liveDe(-16.68, null, 3) });
    await _doPush('mappo_live');
    await _doPush('mappo_locations');
    const corpo = window.__nuvem['live/u-paulo'] || '';
    let d = {}; try { d = JSON.parse(corpo); } catch (e) {}
    return { live: docsLive(), data: docsData(), temPos: !!d.pos, temLive: !!d.live };
  });
  console.log('  ', JSON.stringify(r1));
  assert(r1.live.length === 1 && r1.live[0] === 'live/u-paulo', 'gravou UM documento, o do proprio uid: ' + r1.live.join(','));
  assert(r1.data.length === 0, 'e NAO escreveu blob nenhum em data/ (o defeito): ' + r1.data.join(','));
  assert(r1.temPos === true, 'o documento leva a posicao simples (equivale a mappo_locations[nome])');
  assert(r1.temLive === true, 'e o rastro do GPS ao vivo');

  linha(); console.log('=== CHECK 2: o app nunca escreve a posicao de OUTRA pessoa ===');
  const r2 = await pg.evaluate(async () => {
    zerar();
    setLocs({ Paulo: posDe(-16.68, 1000), Jorge: posDe(-16.70, 2000) });
    setLives({ Jorge: liveDe(-16.70, 2000, 2) });
    await _doPush('mappo_locations');
    await _doPush('mappo_live');
    const corpo = window.__nuvem['live/u-paulo'] || '';
    return { live: docsLive(), data: docsData(), citaJorge: /Jorge|16\.7/.test(corpo) };
  });
  console.log('  ', JSON.stringify(r2));
  assert(r2.live.length === 1 && r2.live[0] === 'live/u-paulo', 'so o meu documento foi escrito -- nada em live/u-jorge');
  assert(r2.data.length === 0, 'e nada no blob compartilhado');
  assert(r2.citaJorge === false, 'o documento nao leva nada da posicao do colega');

  linha(); console.log('=== CHECK 3: a posicao do colega chega por uid e o NOME vem de tecnicos ===');
  const r3 = await pg.evaluate(() => {
    zerar();
    _aplicarPosicaoDeUid('u-jorge', JSON.stringify({ pos: posDe(-16.70), live: liveDe(-16.70, null, 4) }));
    const l = getLocs(), v = getLives();
    return {
      nomes: Object.keys(l), temLive: !!v['Jorge'],
      emMemoria: !!(liveTracks && liveTracks['Jorge']),
      leituraReal: getTecnicoLoc('Jorge') !== null,
      online: nomesTecnicos().filter((t) => { const x = l[t]; return x && Date.now() - x.ts < 300000; }).length,
    };
  });
  console.log('  ', JSON.stringify(r3));
  assert(r3.nomes.length === 1 && r3.nomes[0] === 'Jorge', 'remontou sob o nome resolvido pela lista de tecnicos');
  assert(r3.temLive === true, 'o rastro ao vivo tambem foi remontado');
  assert(r3.emMemoria === true, 'e chegou na variavel em memoria (liveTracks) que a tela le');
  assert(r3.leituraReal === true, 'getTecnicoLoc("Jorge") -- a leitura real do mapa -- ve a posicao');
  assert(r3.online === 1, 'renderMapa contaria 1 tecnico online');

  linha(); console.log('=== CHECK 4: A ANCORA DE SEGURANCA -- nome DENTRO do documento nao vale nada ===');
  /* O documento CARREGA um nome: o campo 'by' que _gravarMesclado estampa. O que segura a
     correcao e o leitor ignorar esse campo -- e e isso que este check mede. */
  const r4 = await pg.evaluate(() => {
    zerar();
    setLocs({ Paulo: posDe(-16.60, 1000) });
    _aplicarPosicaoDeUid('u-jorge', JSON.stringify({
      nome: 'Paulo', by: 'Paulo', prestador: 'Paulo',
      pos: posDe(-99.99, Date.now() + 999999),
    }));
    const l = getLocs();
    return { paulo: l['Paulo'] && l['Paulo'].lat, jorge: l['Jorge'] && l['Jorge'].lat };
  });
  console.log('  ', JSON.stringify(r4));
  assert(r4.paulo === -16.60, 'a posicao de Paulo ficou INTACTA, mesmo o documento se dizendo dele');
  assert(r4.jorge === -99.99, 'o dado foi para Jorge, o dono do uid -- "by"/"nome" de dentro foram ignorados');

  linha(); console.log('=== CHECK 5: uid desconhecido e IGNORADO, e nada e apagado ===');
  const r5 = await pg.evaluate(() => {
    zerar();
    setLocs({ Paulo: posDe(-16.60, 1000) });
    setLives({ Paulo: liveDe(-16.60, 1000, 2) });
    _aplicarPosicaoDeUid('u-fantasma', JSON.stringify({ pos: posDe(-99.99, Date.now() + 999999) }));
    return { nomes: Object.keys(getLocs()).sort(), paulo: getLocs()['Paulo'].lat, escritas: docsLive().concat(docsData()) };
  });
  console.log('  ', JSON.stringify(r5));
  assert(r5.nomes.length === 1 && r5.nomes[0] === 'Paulo', 'nenhum marcador novo apareceu pelo uid desconhecido');
  assert(r5.paulo === -16.60, 'e nada existente foi alterado');
  assert(r5.escritas.length === 0, 'nem apagado na nuvem -- o documento desconhecido fica onde esta');

  linha(); console.log('=== CHECK 6: TRANSICAO -- o blob antigo continua sendo lido ===');
  const r6 = await pg.evaluate(async () => {
    zerar();
    await fbApply('mappo_locations', JSON.stringify({ Jorge: posDe(-16.70) }), Date.now());
    await fbApply('mappo_live', JSON.stringify({ Jorge: liveDe(-16.70, null, 2) }), Date.now());
    return { temLoc: !!getLocs()['Jorge'], temLive: !!getLives()['Jorge'], leituraReal: getTecnicoLoc('Jorge') !== null };
  });
  console.log('  ', JSON.stringify(r6));
  assert(r6.temLoc === true && r6.temLive === true, 'quem ainda usa o blob antigo continua chegando');
  assert(r6.leituraReal === true, 'e continua visivel no mapa');

  linha(); console.log('=== CHECK 7: O BLOCO DA FACHADA -- blob falsificado NAO vence o documento por uid ===');
  const r7 = await pg.evaluate(async () => {
    const velho = Date.now() - 120000;   // documento legitimo de Jorge, de 2 min atras
    const agora = Date.now();            // blob falsificado, com ts de AGORA

    // (a) documento primeiro, blob depois -- o pior caso para "mais recente vence"
    zerar();
    _aplicarPosicaoDeUid('u-jorge', JSON.stringify({ pos: posDe(-16.70, velho), live: liveDe(-16.70, velho, 2) }));
    await fbApply('mappo_locations', JSON.stringify({ Jorge: posDe(-99.99, agora) }), agora);
    await fbApply('mappo_live', JSON.stringify({ Jorge: liveDe(-99.99, agora, 2) }), agora);
    const a = { pos: getLocs()['Jorge'].lat, live: getLives()['Jorge'].atual.lat };

    // (b) blob primeiro, documento depois
    zerar();
    await fbApply('mappo_locations', JSON.stringify({ Jorge: posDe(-99.99, agora) }), agora);
    _aplicarPosicaoDeUid('u-jorge', JSON.stringify({ pos: posDe(-16.70, velho) }));
    const bb = { pos: getLocs()['Jorge'].lat };

    // (c) A METADE QUE NAO PODE QUEBRAR: o MEU proprio ping local vence o meu documento velho
    zerar();
    _aplicarPosicaoDeUid('u-paulo', JSON.stringify({ pos: posDe(-16.10, velho), live: liveDe(-16.10, velho, 2) }));
    setLocs(Object.assign(getLocs(), { Paulo: posDe(-16.68, agora) }));   // como salvarPosicao grava
    setLives(Object.assign(getLives(), { Paulo: liveDe(-16.68, agora, 2) }));
    _remontarPosicoes();
    const meuDepoisDaRemontagem = getLocs()['Paulo'].lat;
    await _doPush('mappo_live');
    let subiu = {}; try { subiu = JSON.parse(window.__nuvem['live/u-paulo'] || '{}'); } catch (e) {}
    /* (d) O QUE VOLTA DA TRANSACAO tem que ser aplicado aqui. No boot a ordem e
       fbPullAll -> fbSeedFromLocal -> fbStartListeners: nesse momento NAO existe listener, e
       sem aplicar o retorno de _gravarMesclado o rastro do MEU outro aparelho nunca chegaria
       a este. Aqui o documento na nuvem tem live MAIS NOVO que o local, e so o push acontece. */
    zerar();
    window.__nuvem['live/u-paulo'] = JSON.stringify({ live: liveDe(-16.30, agora, 2) });
    setLocs({ Paulo: posDe(-16.68, velho) });
    await _doPush('mappo_locations');
    const voltou = { live: (getLives()['Paulo'] || {}).atual && getLives()['Paulo'].atual.lat,
                     pos: (getLocs()['Paulo'] || {}).lat };

    return { a, bb, meuDepoisDaRemontagem, subiuLat: subiu.pos && subiu.pos.lat, docsLive: docsLive(), voltou };
  });
  console.log('  ', JSON.stringify(r7));
  assert(r7.a.pos === -16.70, '(a) blob com ts FRESCO nao venceu a posicao do documento de Jorge');
  assert(r7.a.live === -16.70, '(a) nem o rastro ao vivo');
  assert(r7.bb.pos === -16.70, '(b) e o documento sobrepoe o blob que chegou antes');
  assert(r7.meuDepoisDaRemontagem === -16.68, '(c) o MEU ping local mais novo NAO foi revertido pelo meu documento velho');
  assert(r7.subiuLat === -16.68, '(c) e foi ele que subiu para o servidor');
  assert(r7.docsLive.length === 1, '(c) num documento so, o meu');
  assert(r7.voltou.live === -16.30, '(d) o rastro que estava SO na nuvem (outro aparelho meu) foi aplicado aqui, sem listener');
  assert(r7.voltou.pos === -16.68, '(d) e a posicao deste aparelho continuou valendo');

  linha(); console.log('=== CHECK 8: ausencia nao apaga -- documento SEM pos nao remove a pos local ===');
  const r8 = await pg.evaluate(() => {
    zerar();
    setLocs({ Jorge: posDe(-16.70) });
    _aplicarPosicaoDeUid('u-jorge', JSON.stringify({ live: liveDe(-16.71, null, 2) }));
    return { loc: getLocs()['Jorge'] && getLocs()['Jorge'].lat, temLive: !!getLives()['Jorge'] };
  });
  console.log('  ', JSON.stringify(r8));
  assert(r8.loc === -16.70, 'a posicao simples que so existia aqui sobreviveu');
  assert(r8.temLive === true, 'e o rastro que o documento tinha foi aplicado');

  linha(); console.log('=== CHECK 9: renomear tecnico -- a posicao NAO se perde (a chave e o uid) ===');
  const r9 = await pg.evaluate(() => {
    zerar();
    _aplicarPosicaoDeUid('u-jorge', JSON.stringify({ pos: posDe(-16.70), live: liveDe(-16.70, null, 3) }));
    const antes = { loc: !!getLocs()['Jorge'], live: !!getLives()['Jorge'] };
    // ordem de salvarTecnico(): nome novo em tecnicos[] primeiro, cascata depois
    tecnicos.find((t) => t.uid === 'u-jorge').nome = 'Jorge Silva';
    _renomearTecnicoEmDados('Jorge', 'Jorge Silva');
    return {
      antes,
      locNovo: !!getLocs()['Jorge Silva'], liveNovo: !!getLives()['Jorge Silva'],
      leituraReal: getTecnicoLoc('Jorge Silva') !== null,
    };
  });
  console.log('  ', JSON.stringify(r9));
  assert(r9.antes.loc && r9.antes.live, 'a posicao estava no nome antigo');
  assert(r9.locNovo === true, 'depois do rename ela aparece no nome novo');
  assert(r9.liveNovo === true, 'e o rastro do GPS ao vivo tambem (a cascata antiga so movia a posicao simples)');
  assert(r9.leituraReal === true, 'o mapa ve a posicao no nome novo');

  linha(); console.log('=== CHECK 10: _reconciliarEquipe -- ordem do rename e vinculo de uid ===');
  /* A cascata remonta as posicoes, e _nomeDoUid resolve pela lista: se o rename rodar ANTES de
     t.nome=d.nome, a posicao volta sob o nome que esta sendo DESCARTADO. */
  const r10 = await pg.evaluate(async () => {
    zerar();
    session.perfil = 'gestor';
    // vaga local sem uid, e o prestador ja se vinculou no servidor com outro nome
    tecnicos = [{ id: 'vaga-9', nome: 'Vaga Nova', uid: null, ativo: true, modulos: { split: true, vrfObras: [] } }];
    const membros = [{ id: 'u-novo', data: () => ({ role: 'tecnico', tecnicoId: 'vaga-9', nome: 'Rafael' }) }];
    const colReal = fbDB.collection;
    fbDB.collection = () => ({ doc: () => ({ collection: (c) => (c === 'members'
      ? { get: async () => ({ forEach: (f) => membros.forEach(f) }) }
      : colReal().doc().collection(c)) }) });
    // a posicao de Rafael JA esta baixada, e ainda nao casa com tecnico nenhum
    _aplicarPosicaoDeUid('u-novo', JSON.stringify({ pos: posDe(-16.75), live: liveDe(-16.75, null, 2) }));
    const antes = Object.keys(getLocs());
    await _reconciliarEquipe();
    fbDB.collection = colReal;
    return {
      antes,
      nomeFinal: tecnicos[0].nome, uidFinal: tecnicos[0].uid,
      nomes: Object.keys(getLocs()).sort(),
      leituraReal: getTecnicoLoc('Rafael') !== null,
    };
  });
  console.log('  ', JSON.stringify(r10));
  assert(r10.antes.length === 0, 'antes da reconciliacao a posicao nao tinha nome (uid desconhecido)');
  assert(r10.nomeFinal === 'Rafael' && r10.uidFinal === 'u-novo', 'a reconciliacao vinculou uid e nome');
  assert(r10.nomes.join(',') === 'Rafael', 'a posicao aparece sob o nome NOVO, nao sob "Vaga Nova" (ordem do rename)');
  assert(r10.leituraReal === true, 'e o mapa a ve, sem esperar o proximo ping');

  linha(); console.log('=== CHECK 10b: reconciliacao que vincula SO o uid (nome igual) tambem remonta ===');
  /* Sem esta metade, apagar o _remontarPosicoes() do if(mudou) passava verde: o CHECK 10 tinha
     rename, e a cascata do rename remonta por conta propria. */
  const r10b = await pg.evaluate(async () => {
    zerar();
    session.perfil = 'gestor';
    tecnicos = [{ id: 'vaga-7', nome: 'Bruno', uid: null, ativo: true, modulos: { split: true, vrfObras: [] } }];
    const membros = [{ id: 'u-bruno', data: () => ({ role: 'tecnico', tecnicoId: 'vaga-7', nome: 'Bruno' }) }];
    const colReal = fbDB.collection;
    fbDB.collection = () => ({ doc: () => ({ collection: (c) => (c === 'members'
      ? { get: async () => ({ forEach: (f) => membros.forEach(f) }) }
      : colReal().doc().collection(c)) }) });
    _aplicarPosicaoDeUid('u-bruno', JSON.stringify({ pos: posDe(-16.55), live: liveDe(-16.55, null, 2) }));
    const antes = Object.keys(getLocs());
    await _reconciliarEquipe();
    fbDB.collection = colReal;
    return { antes, uid: tecnicos[0].uid, nome: tecnicos[0].nome,
             nomes: Object.keys(getLocs()).sort(), leituraReal: getTecnicoLoc('Bruno') !== null };
  });
  console.log('  ', JSON.stringify(r10b));
  assert(r10b.antes.length === 0, 'antes: posicao sem nome (uid ainda nao vinculado)');
  assert(r10b.uid === 'u-bruno' && r10b.nome === 'Bruno', 'a reconciliacao vinculou o uid e NAO renomeou');
  assert(r10b.nomes.join(',') === 'Bruno', 'mesmo sem rename, a posicao passou a aparecer');
  assert(r10b.leituraReal === true, 'e o mapa a ve');

  linha(); console.log('=== CHECK 11: colar o codigo de acesso (uid) faz a posicao aparecer ===');
  /* Pelo salvarTecnico() DE VERDADE, com o formulario do gestor. Chamar saveTecnicos() e
     _remontarPosicoes() na mao deixaria a mutacao "apagar o _remontarPosicoes de
     salvarTecnico" passar verde -- foi o que aconteceu na primeira versao deste check. */
  const r11 = await pg.evaluate(async () => {
    zerar();
    session.perfil = 'gestor';
    tecnicos = [{ id: 'tx', nome: 'Marcos', uid: null, ativo: true, modulos: { split: true, vrfObras: [] } }];
    _aplicarPosicaoDeUid('u-marcos', JSON.stringify({ pos: posDe(-16.80), live: liveDe(-16.80, null, 2) }));
    const antes = Object.keys(getLocs());
    // formulario de Configuracoes -> Equipe, com o mesmo NOME e o uid colado agora
    const box = document.createElement('div');
    box.innerHTML = '<input id="tNome" value="Marcos"><input id="tUid" value="u-marcos">'
      + '<input type="checkbox" id="tSplit" checked>';
    document.body.appendChild(box);
    // a concessao de acesso em si bate na rede; aqui o que se mede e a remontagem
    const vinc = window._vincularAcessoTecnico, revo = window._revogarConviteSeExistir;
    const fechar = window.closeModal, render = window.renderView;
    window._vincularAcessoTecnico = async () => true;
    window._revogarConviteSeExistir = async () => {};
    window.closeModal = () => {}; window.renderView = () => {};
    try { await salvarTecnico('tx'); }
    finally {
      window._vincularAcessoTecnico = vinc; window._revogarConviteSeExistir = revo;
      window.closeModal = fechar; window.renderView = render; box.remove();
    }
    return { antes, uid: tecnicos[0].uid, nomes: Object.keys(getLocs()).sort(),
             leituraReal: getTecnicoLoc('Marcos') !== null };
  });
  console.log('  ', JSON.stringify(r11));
  assert(r11.antes.length === 0, 'antes do vinculo a posicao estava invisivel (uid desconhecido)');
  assert(r11.uid === 'u-marcos', 'salvarTecnico() gravou o uid colado');
  assert(r11.nomes.join(',') === 'Marcos', 'depois do vinculo ela aparece sob o nome da vaga');
  assert(r11.leituraReal === true, 'e o mapa a ve na hora, sem esperar o proximo ping');

  linha(); console.log('=== CHECK 12: o LISTENER de tempo real (nao a funcao interna) ===');
  /* Sem passar por fbStartListeners, trocar a colecao 'live' por um nome errado deixava a
     suite VERDE -- e esse e o caminho de maior frequencia da entrega. */
  const r12 = await pg.evaluate(() => {
    zerar();
    fbStopListeners();
    fbStartListeners();
    const registrou = typeof window.__cbs['live'] === 'function';
    entregarSnapshotLive([docFalso('u-jorge', { pos: posDe(-16.70), live: liveDe(-16.70, null, 2) })]);
    return { registrou, depoisDoAdded: Object.keys(getLocs()).sort() };
  });
  console.log('  ', JSON.stringify(r12));
  assert(r12.registrou === true, 'fbStartListeners abriu listener na colecao live');
  // a aplicacao passa por _naFilaSync (assincrona): espera o efeito
  await pg.waitForTimeout(300);
  const r12b = await pg.evaluate(() => ({ nomes: Object.keys(getLocs()).sort(), leituraReal: getTecnicoLoc('Jorge') !== null }));
  console.log('  ', JSON.stringify(r12b));
  assert(r12b.nomes.join(',') === 'Jorge', 'um docChange {type:"added"} remontou a posicao');
  assert(r12b.leituraReal === true, 'e o mapa a ve');

  linha(); console.log('=== CHECK 13: documento REMOVIDO da nuvem nao apaga a posicao daqui ===');
  /* O docChange 'removed' do Firestore vem COM o ultimo conteudo conhecido do documento.
     Um payload vazio nao mediria nada (aplicar {} nao muda coisa alguma, e a mutacao que tira
     o `return` passava verde -- foi o que aconteceu na primeira versao deste check). Aqui o
     'removed' carrega uma posicao DIFERENTE: se ele fosse aplicado, sobreporia a que esta
     aqui, porque para as outras pessoas o documento por uid ganha sempre. */
  /* Autossuficiente: monta o proprio estado em vez de herdar o que o CHECK 12 deixou, e entrega
     o snapshot pelo helper entregarSnapshotLive (que confere que o listener existe). */
  const antes13 = await pg.evaluate(() => {
    zerar();
    fbStopListeners(); fbStartListeners();
    entregarSnapshotLive([docFalso('u-jorge', { pos: posDe(-16.70), live: liveDe(-16.70, null, 2) })]);
    return true;
  });
  await pg.waitForTimeout(300);
  const meio13 = await pg.evaluate(() => {
    const antes = getLocs()['Jorge'] && getLocs()['Jorge'].lat;
    entregarSnapshotLive([
      { type: 'removed', doc: { id: 'u-jorge', data: () => ({ json: JSON.stringify({ pos: posDe(-88.88), live: liveDe(-88.88, null, 2) }) }) } },
    ]);
    return antes;
  });
  /* A aplicacao passa por _naFilaSync (assincrona): sem esperar, um 'removed' que FOSSE
     aplicado ainda nao teria chegado ao localStorage e o check passaria verde sem medir nada. */
  await pg.waitForTimeout(300);
  const r13 = await pg.evaluate(() => ({
    depois: getLocs()['Jorge'] && getLocs()['Jorge'].lat,
    live: (getLives()['Jorge'] || {}).atual && getLives()['Jorge'].atual.lat,
  }));
  r13.antes = meio13;
  console.log('  ', JSON.stringify({ ...r13, montou: antes13 }));
  assert(r13.antes === -16.70, 'a posicao estava aqui');
  assert(r13.depois === -16.70, 'e SOBREVIVEU ao removed, sem ser sobreposta pelo conteudo antigo dele');
  assert(r13.live === -16.70, 'o rastro tambem ficou intacto (ausencia nao apaga)');

  linha(); console.log('=== CHECK 14: o pull INICIAL (fbPullAll) traz as posicoes ===');
  const r14 = await pg.evaluate(async () => {
    zerar();
    window.__nuvem['live/u-jorge'] = JSON.stringify({ pos: posDe(-16.70), live: liveDe(-16.70, null, 2) });
    window.__nuvem['live/u-fantasma'] = JSON.stringify({ pos: posDe(-99.99) });
    await fbPullAll();     // pelo caminho de verdade, nao chamando _pullPosicoes direto
    return { nomes: Object.keys(getLocs()).sort(), leituraReal: getTecnicoLoc('Jorge') !== null };
  });
  console.log('  ', JSON.stringify(r14));
  assert(r14.nomes.join(',') === 'Jorge', 'so o uid conhecido virou posicao; o desconhecido foi ignorado');
  assert(r14.leituraReal === true, 'e o mapa ja a ve no primeiro carregamento');

  linha(); console.log('=== CHECK 15: a lista de tecnicos mudando remonta o que estava ignorado ===');
  const r15 = await pg.evaluate(() => {
    zerar();
    // documento de um uid que AINDA nao esta na equipe
    _aplicarPosicaoDeUid('u-recem', JSON.stringify({ pos: posDe(-16.90), live: liveDe(-16.90, null, 2) }));
    const antes = Object.keys(getLocs());
    // chega mappo_tecnicos da nuvem com a pessoa dentro
    tecnicos = equipePadrao().concat([{ id: 't9', nome: 'Recem', uid: 'u-recem', ativo: true, modulos: { split: true, vrfObras: [] } }]);
    fbOnRemoteChange('mappo_tecnicos');
    return { antes, nomes: Object.keys(getLocs()).sort(), leituraReal: getTecnicoLoc('Recem') !== null };
  });
  console.log('  ', JSON.stringify(r15));
  assert(r15.antes.length === 0, 'o documento estava ignorado (uid fora da equipe)');
  assert(r15.nomes.join(',') === 'Recem', 'a lista nova fez a posicao aparecer, sem esperar ping');
  assert(r15.leituraReal === true, 'e o mapa a ve');

  linha(); console.log('=== CHECK 16: regra nao publicada acende a faixa NOS DOIS LADOS ===');
  const r16 = await pg.evaluate(async () => {
    // (a) ESCRITA negada
    zerar(); montarFaixa();
    window.__negarLive = true;
    setLocs({ Paulo: posDe(-16.68) });
    await _doPush('mappo_locations');
    const esc = {
      escritas: docsLive().concat(docsData()),
      chave: Object.keys(_falhasEnvio).join(','),
      // UMA chave para o recurso: nem 'mappo_locations' nem 'mappo_live' -- ver BLOQUEIA 4
      mensagem: (_falhasEnvio['mappo_posicoes'] || {}).erro || '',
      faixa: faixa(), log: ultimosLogs(2),
    };
    // (b) LEITURA negada -- mesmo sinal de regra nao publicada
    zerar(); montarFaixa();
    window.__negarLeitura = true;
    await fbPullAll();
    const lei = {
      // estado PROPRIO: falha de leitura nao mora em _falhasEnvio, senao um envio que da certo
      // a apagaria e a faixa sumiria com o mapa da equipe ainda sem carregar
      chave: Object.keys(_falhasLeitura).join(','),
      mensagem: (_falhasLeitura['mappo_posicoes'] || {}).erro || '',
      escritaVazia: Object.keys(_falhasEnvio).length === 0,
      faixa: faixa(), log: ultimosLogs(2),
    };
    /* (c) UM ENVIO QUE DA CERTO nao pode apagar a falha de LEITURA: eram limpas juntas, e a
       faixa sumia enquanto o mapa da equipe continuava sem carregar. */
    window.__negarLive = false;                 // escrita volta a funcionar
    setLocs({ Paulo: posDe(-16.68) });
    await _doPush('mappo_live');
    const cruzado = { faixaAindaAcesa: !faixa().escondida,
                      leitura: Object.keys(_falhasLeitura).join(','),
                      escrita: Object.keys(_falhasEnvio).join(','),
                      texto: faixa().texto };
    /* (d) E A FAIXA TEM QUE APAGAR quando o proprietario publica a regra: sem isto a tela do
       tecnico fica vermelha apontando um problema JA RESOLVIDO ate ele recarregar. */
    window.__negarLeitura = false;
    await fbPullAll();
    const limpou = { escondida: faixa().escondida,
                     leitura: Object.keys(_falhasLeitura).join(','),
                     escrita: Object.keys(_falhasEnvio).join(',') };
    return { esc, lei, cruzado, limpou };
  });
  console.log('   ESCRITA:', JSON.stringify(r16.esc));
  console.log('   LEITURA:', JSON.stringify(r16.lei));
  console.log('   CRUZADO:', JSON.stringify(r16.cruzado));
  console.log('   LIMPOU :', JSON.stringify(r16.limpou));
  assert(r16.esc.escritas.length === 0, 'escrita negada: nada subiu');
  assert(r16.esc.chave === 'mappo_posicoes', 'a falha usa UMA chave para o recurso, venha de locations ou de live');
  assert(/regra|live/i.test(r16.esc.mensagem), 'a mensagem diz o que provavelmente falta: ' + r16.esc.mensagem);
  assert(r16.esc.faixa.escondida === false, 'A FAIXA ACENDEU na escrita');
  assert(/não está sendo salvo/i.test(r16.esc.faixa.texto), 'e diz que algo nao esta sendo SALVO: ' + r16.esc.faixa.texto);
  assert(/permission-denied/.test(r16.esc.log), 'o log registrou o e.code da escrita');
  assert(r16.lei.chave === 'mappo_posicoes', 'LEITURA negada usa a MESMA chave -- mesma causa-raiz, um nome so');
  assert(r16.lei.escritaVazia === true, 'e fica em estado PROPRIO, nao em _falhasEnvio');
  assert(/regra|live/i.test(r16.lei.mensagem), 'com mensagem que diz o que falta: ' + r16.lei.mensagem);
  assert(r16.lei.faixa.escondida === false, 'A FAIXA ACENDEU na leitura -- nao so no log');
  assert(/não estou conseguindo ler|não está chegando aqui/i.test(r16.lei.faixa.texto),
    'e o texto fala de LEITURA, nao de "nao esta sendo salvo": ' + r16.lei.faixa.texto);
  assert(/não está sendo salvo/i.test(r16.lei.faixa.texto) === false,
    'a faixa de leitura NAO afirma que algo deixou de ser salvo: ' + r16.lei.faixa.texto);
  assert(/Posições da equipe/.test(r16.lei.faixa.texto), 'e nomeia o recurso: ' + r16.lei.faixa.texto);
  assert(/permission-denied/.test(r16.lei.log), 'o log registrou o e.code da leitura');
  assert(r16.cruzado.faixaAindaAcesa === true, 'um envio bem-sucedido NAO apagou a falha de leitura');
  assert(r16.cruzado.leitura === 'mappo_posicoes', 'a falha de leitura continua registrada');
  assert(r16.cruzado.escrita === '', 'e a de escrita foi apagada, que e a que de fato voltou');
  assert(r16.limpou.escondida === true, 'com a regra publicada, a faixa APAGA (sem precisar recarregar)');
  assert(r16.limpou.leitura === '' && r16.limpou.escrita === '', 'e nao sobra falha nenhuma registrada');

  linha(); console.log('=== CHECK 16b: sessao sem uid acende a faixa e fala UMA vez ===');
  /* Sem uid nao existe documento possivel (a regra e request.auth.uid == uid). Calado, isto e
     GPS que simplesmente nao sai do aparelho. E como o envio e tentado a cada 5-8 s, repetir a
     mesma linha enche o log de 60 entradas e esconde o que importa. */
  const r16b = await pg.evaluate(async () => {
    zerar(); montarFaixa();
    _fbLogs.length = 0;
    session.uid = null;
    await _doPush('mappo_live');
    await _doPush('mappo_live');
    await _doPush('mappo_locations');
    const linhas = _fbLogs.filter((l) => /sess(ã|a)o sem uid/i.test(l.msg)).length;
    const f = faixa();
    session.uid = 'u-paulo';
    return { linhas, escondida: f.escondida, texto: f.texto, chaves: Object.keys(_falhasEnvio).sort().join(',') };
  });
  console.log('  ', JSON.stringify(r16b));
  assert(r16b.escondida === false, 'a faixa acendeu -- nao ficou so no log');
  assert(r16b.linhas === 1, 'e o log falou UMA vez, nao uma por tentativa (foram 3): ' + r16b.linhas);
  assert(r16b.chaves === 'mappo_posicoes', 'a falha foi registrada sob o nome do recurso: ' + r16b.chaves);

  linha(); console.log('=== CHECK 16c: aviso PREVENTIVO de tamanho do documento por pessoa ===');
  /* O aviso de 76% do teto de 1 MiB existia para o blob e nao podia simplesmente desaparecer
     quando o documento passou a ser por pessoa: e ele que avisa ANTES do servidor recusar. */
  const r16c = await pg.evaluate(async () => {
    zerar(); montarFaixa();
    const pontos = [];
    for (let i = 0; i < 18000; i++) pontos.push({ lat: -16.68 + i / 1e6, lng: -49.25, ts: Date.now() - i * 1000 });
    setLives({ Paulo: { pontos, atual: { lat: -16.68, lng: -49.25, acc: 8, ts: Date.now() }, ativo: true, inicioTs: 1, fimTs: Date.now() + 1e7 } });
    const bytes = JSON.stringify(_meuCorpoPosicao()).length;
    await _doPush('mappo_live');
    const f = faixa();
    return { bytes, acimaDoAlerta: bytes >= DOC_ALERTA_BYTES, medido: _chavesQuaseCheias['mappo_posicoes'] !== undefined,
             escondida: f.escondida, texto: f.texto, subiu: docsLive() };
  });
  console.log('  ', JSON.stringify({ ...r16c, texto: r16c.texto.slice(0, 120) }));
  assert(r16c.acimaDoAlerta === true, 'o cenario de fato passa do limiar de aviso (' + r16c.bytes + ' bytes)');
  assert(r16c.medido === true, 'o documento por pessoa FOI medido contra o teto de 1 MiB');
  assert(r16c.escondida === false, 'e a faixa preventiva acendeu');
  assert(r16c.subiu.length === 1, 'o envio aconteceu de qualquer forma (aviso, nao bloqueio)');

  linha(); console.log('=== CHECK 16d: blob de COLEGA chegando nao agenda envio meu (queima de cota) ===');
  /* Defeito criado pela propria supremacia: a condicao generica do ramo MERGE_MAPS
     (mergedStr!==jsonStr) virou permanentemente verdadeira, porque o mapa local passou a ter as
     posicoes por-uid dos colegas, que NUNCA estao no blob. Cada escrita de blob de um aparelho
     antigo agendava uma transacao no MEU documento, a cada 5-8 s, sem nunca convergir. */
  const r16d = await pg.evaluate(async () => {
    zerar();
    // meu documento e o meu local em PERFEITO acordo: nao ha nada meu para subir
    setLocs({ Paulo: posDe(-16.68, 1000) });
    setLives({});
    await _doPush('mappo_live');
    const nuvemAntes = JSON.stringify(window.__nuvem);
    // um colega com documento por-uid (entra no localStorage pela supremacia)
    _aplicarPosicaoDeUid('u-jorge', JSON.stringify({ pos: posDe(-16.70, 2000) }));
    // e agora um aparelho na versao antiga escreve o blob
    const atrasos = await atrasosAgendados(async () => {
      await fbApply('mappo_locations', JSON.stringify({ Jorge: posDe(-16.70, 2000) }), Date.now());
    });
    return { atrasos, nuvemAntes, temJorge: !!getLocs()['Jorge'] };
  });
  await pg.waitForTimeout(800);   // se algo foi agendado em 400 ms, ja rodou
  const r16d2 = await pg.evaluate(() => ({ mudouNuvem: JSON.stringify(window.__nuvem) }));
  console.log('  ', JSON.stringify({ atrasos: r16d.atrasos, temJorge: r16d.temJorge,
    igual: r16d2.mudouNuvem === r16d.nuvemAntes }));
  assert(r16d.temJorge === true, 'a posicao do colega chegou (a supremacia continua valendo)');
  assert(r16d.atrasos.indexOf(400) < 0, 'NENHUM envio foi agendado por causa do blob: ' + JSON.stringify(r16d.atrasos));
  assert(r16d2.mudouNuvem === r16d.nuvemAntes, 'e nada foi escrito na nuvem depois de esperar');

  linha(); console.log('=== CHECK 16e: ping local que nao subiu AINDA e reenviado (sem chamar _doPush) ===');
  /* E o UNICO retry de um ping local: a repescagem da vigilancia continua nao cobre, porque
     _setLocalQuiet atualiza _snapshot[key] e ela nunca ve diferenca. Sem isto, o ultimo estado
     do pararLive (ativo:false) fica so no celular. */
  const r16e = await pg.evaluate(() => {
    zerar();
    _bootDone = true;
    // documento meu na nuvem com um estado VELHO; o local tem o desligamento do GPS ao vivo
    window.__nuvem['live/u-paulo'] = JSON.stringify({ live: liveDe(-16.68, Date.now() - 60000, 2) });
    _guardarPosicaoDeUid('u-paulo', window.__nuvem['live/u-paulo']);
    const encerrado = Object.assign(liveDe(-16.68, Date.now(), 2), { ativo: false, encerradoTs: Date.now() });
    setLives({ Paulo: encerrado });
    _remontarPosicoes();            // ninguem chama _doPush aqui
    return { antesAtivo: JSON.parse(window.__nuvem['live/u-paulo']).live.ativo };
  });
  await pg.waitForTimeout(900);     // o reenvio e agendado em 400 ms
  const r16e2 = await pg.evaluate(() => {
    let d = {}; try { d = JSON.parse(window.__nuvem['live/u-paulo'] || '{}'); } catch (e) {}
    return { ativoNaNuvem: d.live && d.live.ativo };
  });
  console.log('  ', JSON.stringify({ ...r16e, ...r16e2 }));
  assert(r16e.antesAtivo === true, 'a nuvem tinha o GPS ao vivo ainda LIGADO');
  assert(r16e2.ativoNaNuvem === false, 'e o desligamento subiu sozinho, sem ninguem chamar _doPush');

  linha(); console.log('=== CHECK 16f: o envelope do documento e o que a REGRA aceita ===');
  /* A regra e o unico ponto que restringe as chaves, e quem monta o envelope e _gravarMesclado,
     compartilhado por TODOS os caminhos de envio. O fake recusa o que a regra recusaria, com o
     conjunto de chaves lido do proprio firestore.rules -- entao um quarto campo ali reprova
     aqui, em vez de matar o GPS em producao com npm test verde. */
  const r16f = await pg.evaluate(async () => {
    zerar();
    setLocs({ Paulo: posDe(-16.68) });
    await _doPush('mappo_live');
    const gravado = JSON.parse(JSON.stringify(window.__nuvem));
    // controle positivo do proprio arnes: um campo a mais TEM que ser recusado
    let recusou = false, msg = '';
    try {
      await fbDB.collection('workspaces').doc('ws').collection('live').doc('u-paulo')
        .set({ json: '{}', updatedAt: 1, by: 'x', dispositivo: 'abc' });
    } catch (e) { recusou = e.code === 'permission-denied'; msg = e.message; }
    let recusouJson = false;
    try {
      await fbDB.collection('workspaces').doc('ws').collection('live').doc('u-paulo')
        .set({ json: { pos: 1 }, updatedAt: 1, by: 'x' });
    } catch (e) { recusouJson = e.code === 'permission-denied'; }
    return { subiu: Object.keys(gravado).filter((k) => k.indexOf('live/') === 0),
             chaves: window.__chavesEnvelope, recusou, msg, recusouJson };
  });
  console.log('  ', JSON.stringify(r16f));
  assert(r16f.chaves.join(',') === 'json,updatedAt,by', 'as chaves vieram do firestore.rules: ' + r16f.chaves.join(','));
  assert(r16f.subiu.length === 1, 'o envio real passou pela conferencia do envelope');
  assert(r16f.recusou === true, 'CONTROLE POSITIVO: um campo a mais e recusado como permission-denied (' + r16f.msg + ')');
  assert(r16f.recusouJson === true, 'e json que nao e string tambem');

  linha(); console.log('=== CHECK 16g: sair da conta nao deixa a equipe anterior para o proximo login ===');
  /* O login seguinte acontece na MESMA pagina, sem reload. */
  const r16g = await pg.evaluate(() => {
    zerar(); montarFaixa();
    _aplicarPosicaoDeUid('u-jorge', JSON.stringify({ pos: posDe(-16.70), live: liveDe(-16.70, null, 2) }));
    _falhasEnvio['mappo_posicoes'] = { erro: 'x', hora: '00:00' };
    _falhasLeitura['mappo_posicoes'] = { erro: 'y', hora: '00:00' };
    _avisouPosicaoSemUid = true; _avisouSemPosicaoLocal = true;
    const antes = { uids: Object.keys(_posicoesPorUid).length, nomes: Object.keys(getLocs()).length };
    logout();                                        // o caminho de verdade (o dialog e aceito)
    // o proximo usuario entra: outra pessoa, outro workspace
    session = { perfil: 'gestor', nome: 'Outra', uid: 'u-outra', workspaceId: 'ws2' };
    fbReady = true;
    setLocs({}); setLives({});
    tecnicos = [{ id: 'z', nome: 'Jorge', uid: 'u-jorge', ativo: true, modulos: { split: true, vrfObras: [] } }];
    _remontarPosicoes();
    return { antes, uidsDepois: Object.keys(_posicoesPorUid).length,
             nomesDepois: Object.keys(getLocs()).length,
             falhas: Object.keys(_falhasEnvio).length + Object.keys(_falhasLeitura).length,
             avisos: [_avisouPosicaoSemUid, _avisouSemPosicaoLocal] };
  });
  console.log('  ', JSON.stringify(r16g));
  assert(r16g.antes.uids === 1 && r16g.antes.nomes === 1, 'antes do logout havia posicao da equipe');
  assert(r16g.uidsDepois === 0, 'o logout limpou o cache por uid');
  assert(r16g.nomesDepois === 0, 'e a primeira remontagem do novo usuario NAO reaplicou a equipe anterior');
  assert(r16g.falhas === 0, 'as falhas do usuario que saiu nao ficaram na faixa do proximo');
  assert(r16g.avisos[0] === false && r16g.avisos[1] === false, 'e os avisos "uma vez" foram rearmados');

  linha(); console.log('=== CHECK 16h: tecnico DESATIVADO e nome AMBIGUO nao entram no mapa ===');
  const r16h = await pg.evaluate(() => {
    zerar();
    // (a) desativado
    tecnicos = [{ id: 't2', nome: 'Jorge', uid: 'u-jorge', ativo: false, modulos: { split: true, vrfObras: [] } }];
    _aplicarPosicaoDeUid('u-jorge', JSON.stringify({ pos: posDe(-16.70) }));
    const desativado = Object.keys(getLocs()).length;
    // (b) dois ativos com o MESMO nome: resolver faria um sobrepor o outro
    zerar();
    tecnicos = [
      { id: 'a', nome: 'Ze', uid: 'u-a', ativo: true, modulos: { split: true, vrfObras: [] } },
      { id: 'b', nome: 'Ze', uid: 'u-b', ativo: true, modulos: { split: true, vrfObras: [] } },
    ];
    _aplicarPosicaoDeUid('u-a', JSON.stringify({ pos: posDe(-16.70) }));
    _aplicarPosicaoDeUid('u-b', JSON.stringify({ pos: posDe(-99.99) }));
    const ambiguo = Object.keys(getLocs()).length;
    const avisou = _fbLogs.some((l) => /dois t(é|e)cnicos ativos/i.test(l.msg));
    return { desativado, ambiguo, avisou };
  });
  console.log('  ', JSON.stringify(r16h));
  assert(r16h.desativado === 0, 'tecnico desativado nao volta ao mapa por uma posicao antiga');
  assert(r16h.ambiguo === 0, 'nome ambiguo nao vira marcador (um sobreporia o outro)');
  assert(r16h.avisou === true, 'e a ambiguidade NAO e silenciosa: fica no log');

  linha(); console.log('=== CHECK 16i: leitura negada tem RETRY (nao espera recarregar o app) ===');
  /* _pullPosicoes so rodava no boot: uma negativa transitoria (rede caindo, ou a regra publicada
     um minuto depois) mantinha a faixa acesa ate alguem recarregar. O retry e espacado em 30 s
     de proposito -- e um .get() de colecao, nao cabe na ronda de 3 s da vigilancia. */
  const r16i = await pg.evaluate(async () => {
    zerar(); montarFaixa();
    window.__negarLeitura = true;
    await fbPullAll();
    const depoisDaFalha = { acesa: !faixa().escondida, leitura: Object.keys(_falhasLeitura).join(',') };
    // ainda dentro da janela de 30 s: NAO tenta de novo
    window.__nuvem['live/u-jorge'] = JSON.stringify({ pos: posDe(-16.70) });
    window.__negarLeitura = false;
    _retentarLeituraPosicoes();
    await new Promise((r) => setTimeout(r, 120));
    const cedo = { aindaAcesa: !faixa().escondida, temJorge: !!getLocs()['Jorge'] };
    // passados os 30 s (relogio adiantado a mao), tenta e resolve
    _proximaTentativaLeitura = 0;
    _retentarLeituraPosicoes();
    await new Promise((r) => setTimeout(r, 200));
    return { depoisDaFalha, cedo,
             depois: { escondida: faixa().escondida, temJorge: !!getLocs()['Jorge'],
                       leitura: Object.keys(_falhasLeitura).join(',') } };
  });
  console.log('  ', JSON.stringify(r16i));
  assert(r16i.depoisDaFalha.acesa === true, 'a leitura negada acendeu a faixa');
  assert(r16i.cedo.aindaAcesa === true, 'dentro dos 30 s NAO ha nova tentativa (nao vira enxurrada de .get())');
  assert(r16i.cedo.temJorge === false, 'e nada foi lido ainda');
  assert(r16i.depois.temJorge === true, 'passada a janela, o retry LEU as posicoes sem ninguem recarregar');
  assert(r16i.depois.escondida === true, 'e a faixa apagou sozinha');
  assert(r16i.depois.leitura === '', 'sem falha de leitura registrada');

  linha(); console.log('=== CHECK 17: o debounce de 8 s / 5 s continua o mesmo (observado) ===');
  /* Observa o AGENDAMENTO, nao a grafia do codigo: assim um rename inofensivo nao reprova, e
     um debounce derrotado por outro caminho nao passa. */
  const r17 = await pg.evaluate(() => {
    const orig = window.setTimeout;
    const vistos = [];
    window.setTimeout = (fn, ms) => { vistos.push(ms); return orig(() => {}, 0); };
    try {
      fbPush('mappo_locations');
      fbPush('mappo_live');
      fbPush('mappo_clientes');
    } finally { window.setTimeout = orig; }
    return { locations: vistos[0], live: vistos[1], outra: vistos[2] };
  });
  console.log('  ', JSON.stringify(r17));
  assert(r17.locations === 8000, 'mappo_locations agenda o envio em 8000 ms');
  assert(r17.live === 5000, 'mappo_live agenda em 5000 ms');
  assert(r17.outra === 600, 'e uma chave comum segue em 600 ms (a mudanca nao vazou para as outras)');

  linha(); console.log('=== CHECK 18: o seed inicial nao semeia mais os blobs de posicao ===');
  const r18 = await pg.evaluate(async () => {
    zerar();
    setLocs({ Paulo: posDe(-16.68), Jorge: posDe(-16.70) });
    setLives({ Paulo: liveDe(-16.68, null, 2), Jorge: liveDe(-16.70, null, 2) });
    await fbSeedFromLocal();
    return {
      blobs: docsData().filter((k) => k === 'data/mappo_locations' || k === 'data/mappo_live'),
      live: docsLive(),
    };
  });
  console.log('  ', JSON.stringify(r18));
  assert(r18.blobs.length === 0, 'nenhum blob de posicao foi semeado: ' + r18.blobs.join(','));
  assert(r18.live.length === 1 && r18.live[0] === 'live/u-paulo', 'e a MINHA posicao subiu no meu documento');

  linha(); console.log('=== CHECK 19: a tabela de espaco mede SO o documento que este aparelho envia ===');
  const r19 = await pg.evaluate(() => {
    zerar();
    setLocs({ Paulo: posDe(-16.68), Jorge: posDe(-16.70) });
    setLives({ Paulo: liveDe(-16.68, null, 120), Jorge: liveDe(-16.70, null, 120) });
    const linhas = linhasDaTabela();
    return {
      minha: linhas.filter((l) => /Minha posição/.test(l)),
      deOutros: linhas.filter((l) => /Jorge/.test(l)),
      blob: linhas.filter((l) => /GPS ao vivo|Localizações/.test(l)),
    };
  });
  console.log('  ', JSON.stringify(r19));
  assert(r19.minha.length === 1, 'uma linha: o MEU documento, que e o unico que este aparelho de fato envia');
  assert(r19.deOutros.length === 0, 'nenhuma linha medindo a copia parcial do documento de outra pessoa');
  assert(r19.blob.length === 0, 'e nenhuma medindo o blob da equipe inteira');

  linha(); console.log('=== erros de pagina ==='); console.log(erros.length ? erros : '(nenhum)');
  assert(erros.length === 0, 'nenhum erro de pagina');
  await b.close(); srv.close();
  linha(); console.log('TODOS OS CHECKS PASSARAM.');
})().catch((e) => { console.error('\n' + e.message); process.exit(1); });
