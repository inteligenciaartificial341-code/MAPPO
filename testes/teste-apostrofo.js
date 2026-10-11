/* Impede que voltar: nome de cliente com apóstrofo ("Sant'Ana", "D'Ávila") deixa o cartão
   do cliente sem reação no clique. O nome vai para dentro de um onclick="...('NOME')" via
   escapeHtml, que transforma ' em &#39;; o parser de HTML desfaz isso ANTES do JavaScript
   ler, e aí o apóstrofo fecha a string no meio. Nome com apóstrofo é comum no Brasil.
   MEDIDO em 10/10/2026 contra d23f1d7: o cartão sem apóstrofo abre (controle positivo)
   e o com apóstrofo morre com "Uncaught SyntaxError: missing ) after argument list". */
const { chromium } = require('playwright');
const path = require('path'), http = require('http'), fs = require('fs');
const RAIZ = process.env.MAPPO_RAIZ || path.resolve(__dirname, '..');
function assert(c, m) { if (!c) throw new Error('FALHOU: ' + m); console.log('  ok - ' + m); }

const NOME = "Sant'Ana Comércio";

(async () => {
  const srv = http.createServer((rq, rs) => {
    const p = rq.url === '/' ? '/index.html' : rq.url.split('?')[0];
    const f = path.join(RAIZ, p);
    if (!fs.existsSync(f)) { rs.writeHead(404); rs.end(); return; }
    rs.writeHead(200); rs.end(fs.readFileSync(f));
  });
  await new Promise(r => srv.listen(0, r));
  const b = await chromium.launch();
  const pg = await b.newPage();
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto('http://localhost:' + srv.address().port + '/', { waitUntil: 'load' });
  await pg.waitForTimeout(400);

  /* Gestor com dois clientes: um com apóstrofo, um sem. O sem é o controle positivo
     DENTRO do teste -- se o clique nele também não abrir, o defeito é outro e a
     medição do apóstrofo não quer dizer nada. */
  await pg.evaluate((nome) => {
    session = { perfil: 'gestor', nome: 'Paulo', uid: 'u1', role: 'Gestor', workspaceId: 'ws' };
    _gravarTourVisto(); entrarApp(); fbReady = true; WORKSPACE = 'ws';
    _avisouSessaoExpirada = true;
    const s = document.getElementById('splashScreen'); if (s) s.remove();
    clientes = [
      { nome: nome, endereco: 'Rua A, 100', contato: '99999' },
      { nome: 'Cliente Normal', endereco: 'Rua B, 200', contato: '88888' }
    ];
    osList = [
      { id: 'os1', cliente: nome, endereco: 'Rua A, 100', tipo: 'Instalacao', tecnico: 'Paulo',
        data: '2026-10-01', hora: '08:00', status: 'concluida', qtdSplits: 1,
        equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }], checklist: [] },
      { id: 'os2', cliente: 'Cliente Normal', endereco: 'Rua B, 200', tipo: 'Instalacao',
        tecnico: 'Paulo', data: '2026-10-02', hora: '08:00', status: 'concluida', qtdSplits: 1,
        equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }], checklist: [] }
    ];
    nav('clientes');
  }, NOME);
  await pg.waitForTimeout(500);

  console.log('\n=== CHECK 1: os dois clientes aparecem na lista ===');
  const r1 = await pg.evaluate((nome) => {
    const cards = [...document.querySelectorAll('#app .os-card')];
    return {
      n: cards.length,
      nomes: cards.map(c => (c.querySelector('.os-client') || {}).textContent || ''),
      /* o atributo cru, como o navegador o guarda depois de decodificar as entidades */
      onclickDoApostrofo: (cards.find(c => ((c.querySelector('.os-client') || {}).textContent || '') === nome) || {}).outerHTML || ''
    };
  }, NOME);
  console.log('  cartoes:', r1.n, '|', JSON.stringify(r1.nomes));
  assert(r1.nomes.includes(NOME), 'o cliente com apostrofo aparece na lista');
  assert(r1.nomes.includes('Cliente Normal'), 'o cliente sem apostrofo tambem aparece (controle)');
  const mOn = r1.onclickDoApostrofo.match(/onclick="([^"]*)"/);
  console.log('  onclick gerado:', mOn ? mOn[1] : '(nao achei)');

  console.log('\n=== CHECK 2 (controle positivo): clicar no cliente SEM apostrofo abre o historico ===');
  const r2 = await pg.evaluate(() => {
    const card = [...document.querySelectorAll('#app .os-card')]
      .find(c => ((c.querySelector('.os-client') || {}).textContent || '') === 'Cliente Normal');
    card.click();
    const ov = document.getElementById('curOverlay');
    return { aberto: !!(ov && ov.classList.contains('open') && ov.textContent.includes('Cliente Normal')),
             txt: ov ? ov.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : '(sem overlay)' };
  });
  console.log('  modal:', r2.txt);
  assert(r2.aberto, 'CONTROLE: o clique funciona para nome sem apostrofo');

  await pg.evaluate(() => { closeModal(); });
  await pg.waitForTimeout(250);

  console.log('\n=== CHECK 3: clicar no cliente COM apostrofo tambem tem que abrir ===');
  const r3 = await pg.evaluate((nome) => {
    const antes = [];
    const onerr = (e) => antes.push(String(e.message || e));
    window.addEventListener('error', onerr);
    const card = [...document.querySelectorAll('#app .os-card')]
      .find(c => ((c.querySelector('.os-client') || {}).textContent || '') === nome);
    card.click();
    window.removeEventListener('error', onerr);
    const ov = document.getElementById('curOverlay');
    return { aberto: !!(ov && ov.classList.contains('open') && ov.textContent.includes(nome)),
             txt: ov ? ov.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : '(sem overlay)',
             errosNoClique: antes };
  }, NOME);
  console.log('  modal:', r3.txt);
  console.log('  erro no clique:', r3.errosNoClique.length ? r3.errosNoClique : '(nenhum)');
  assert(r3.aberto, 'o clique abre o historico do cliente com apostrofo');

  await pg.evaluate(() => { closeModal(); });
  await pg.waitForTimeout(250);

  /* O apóstrofo é o caso que o proprietário encontrou, mas não é o único caractere que
     quebra uma string JS dentro de atributo: aspas duplas fecham o próprio atributo,
     a barra invertida come o caractere seguinte, e o `<` é a porta do HTML injetado.
     Os quatro têm de abrir, e o `<` ainda tem de aparecer como TEXTO, nunca como tag. */
  const EXTRAS = ['Prefeitura "X"', 'A\\B', 'A<b>C'];

  console.log('\n=== CHECK 4: aspas duplas, barra invertida e "<" no nome tambem abrem ===');
  await pg.evaluate((extras) => {
    clientes = extras.map((n, i) => ({ nome: n, endereco: 'Rua E, ' + i, contato: '7777' }));
    osList = extras.map((n, i) => ({
      id: 'ox' + i, cliente: n, endereco: 'Rua E, ' + i, tipo: 'Instalacao', tecnico: 'Paulo',
      data: '2026-10-0' + (i + 1), hora: '08:00', status: 'concluida', qtdSplits: 1,
      equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }], checklist: []
    }));
    nav('clientes');
  }, EXTRAS);
  await pg.waitForTimeout(400);

  for (const nome of EXTRAS) {
    const r = await pg.evaluate((n) => {
      const card = [...document.querySelectorAll('#app .os-card')]
        .find(c => ((c.querySelector('.os-client') || {}).textContent || '') === n);
      if (!card) return { achou: false };
      const htmlNome = (card.querySelector('.os-client') || {}).innerHTML || '';
      card.click();
      const ov = document.getElementById('curOverlay');
      return {
        achou: true, htmlNome,
        aberto: !!(ov && ov.classList.contains('open') && ov.textContent.includes(n)),
        txt: ov ? ov.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : '(sem overlay)'
      };
    }, nome);
    console.log('  [' + nome + '] modal:', r.achou ? r.txt : '(cartao nao encontrado)');
    assert(r.achou, 'o cartao de ' + JSON.stringify(nome) + ' aparece na lista');
    assert(r.aberto, 'o clique abre o historico de ' + JSON.stringify(nome));
    if (nome.includes('<')) {
      console.log('  innerHTML do nome:', r.htmlNome);
      assert(r.htmlNome.includes('&lt;b&gt;') && !/<b>/i.test(r.htmlNome),
        'o "<b>" do nome fica como texto, nunca como tag');
    }
    await pg.evaluate(() => { closeModal(); });
    await pg.waitForTimeout(200);
  }

  /* O cartão do cliente era UM de três `onclick` com o mesmo defeito -- nome digitado
     entrando numa string JS por escapeHtml. Os dois de baixo são os irmãos, e cada um
     apaga ou esconde trabalho real quando o nome tem apóstrofo. */

  console.log('\n=== CHECK 5: a lixeira da nota de prestador com apostrofo FUNCIONA ===');
  const r5 = await pg.evaluate((nome) => {
    window.confirm = () => true;                   // o teste não responde caixa de diálogo
    financeiroPeriodo = 'todos';
    financeiroNotas = [
      { prestador: nome, data: '2026-10-01', hora: '09:00', valor: 150,
        obs: 'adiantamento', responsavel: 'Paulo' },
      { prestador: 'Prestador Normal', data: '2026-10-02', hora: '10:00', valor: 90,
        obs: '', responsavel: 'Paulo' }
    ];
    nav('financeiro');
    const lixeira = (quem) =>
      [...document.querySelectorAll('button[onclick^="removerNotaFinanceira"]')]
        .find(b => { const r = b.closest('.set-row'); return r && (r.textContent || '').includes(quem); });
    const bNormal = lixeira('Prestador Normal'), bApos = lixeira(nome);
    const onclickApos = bApos ? bApos.getAttribute('onclick') : '(sem botao)';
    const quebras = [];
    const onerr = (e) => quebras.push(String(e.message || e));
    window.addEventListener('error', onerr);
    if (bNormal) bNormal.click();                  // controle positivo: nome sem apóstrofo
    const normalRemovida = !!(financeiroNotas.find(n => n.prestador === 'Prestador Normal') || {}).removida;
    const b2 = lixeira(nome);                      // a view foi repintada pelo clique acima
    if (b2) b2.click();
    window.removeEventListener('error', onerr);
    return {
      achouNormal: !!bNormal, achouApos: !!bApos, onclickApos, normalRemovida,
      aposRemovida: !!(financeiroNotas.find(n => n.prestador === nome) || {}).removida,
      quebras
    };
  }, NOME);
  console.log('  onclick da lixeira:', r5.onclickApos);
  console.log('  erro no clique:', r5.quebras.length ? r5.quebras : '(nenhum)');
  assert(r5.achouNormal && r5.achouApos, 'as duas notas rendem lixeira na tela de financeiro');
  assert(r5.normalRemovida, 'CONTROLE: a lixeira do prestador SEM apostrofo remove a nota');
  assert(r5.aposRemovida, 'a lixeira do prestador COM apostrofo remove a nota');
  assert(/^removerNotaFinanceira\("/.test(r5.onclickApos),
    'os argumentos de texto da lixeira vao pelo escJsAttr (literal JS), nunca entre apostrofos a mao');

  console.log('\n=== CHECK 6: "ver no mapa" do check-in de tecnico com apostrofo FUNCIONA ===');
  const r6 = await pg.evaluate((nome) => {
    /* loadLeaflet busca o Leaflet num CDN: travar aqui deixa a medição do onclick
       independente de rede, que é o que este teste mede. O modal já foi pintado antes. */
    loadLeaflet = () => {};
    tarefas = [
      { id: 'tf1', nome: 'Obra Centro', descricao: '', tecnico: nome, maxFotos: 3,
        temNotas: false, status: 'pendente', fotos: [], nota: '',
        checkins: [{ data: '2026-10-01', hora: '08:00', lat: -23.5, lng: -46.6 }] },
      { id: 'tf2', nome: 'Obra Norte', descricao: '', tecnico: 'Tecnico Normal', maxFotos: 3,
        temNotas: false, status: 'pendente', fotos: [], nota: '',
        checkins: [{ data: '2026-10-02', hora: '09:00', lat: -23.4, lng: -46.5 }] }
    ];
    const quebras = [];
    const onerr = (e) => quebras.push(String(e.message || e));
    window.addEventListener('error', onerr);
    const medir = (idTarefa, quem) => {
      closeModal(); verTarefaDetalhe(idTarefa);
      const sp = document.querySelector('#curOverlay span[onclick^="abrirMapaCoord"]');
      if (!sp) return { achou: false };
      const onclick = sp.getAttribute('onclick');
      sp.click();
      const ov = document.getElementById('curOverlay');
      return { achou: true, onclick,
               temMapa: !!document.getElementById('coordMapaBox'),
               titulo: ov ? ov.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : '(sem overlay)',
               comNome: !!(ov && ov.textContent.includes(quem)) };
    };
    const normal = medir('tf2', 'Tecnico Normal');
    const apos = medir('tf1', nome);
    window.removeEventListener('error', onerr);
    closeModal();
    return { normal, apos, quebras };
  }, NOME);
  console.log('  [controle] onclick:', r6.normal.onclick, '| modal:', r6.normal.titulo);
  console.log('  [apostrofo] onclick:', r6.apos.onclick, '| modal:', r6.apos.titulo);
  console.log('  erro no clique:', r6.quebras.length ? r6.quebras : '(nenhum)');
  assert(r6.normal.achou && r6.apos.achou, 'os dois check-ins com GPS rendem "ver no mapa"');
  assert(r6.normal.temMapa && r6.normal.comNome,
    'CONTROLE: "ver no mapa" do tecnico SEM apostrofo abre o mapa com o rotulo');
  assert(r6.apos.temMapa, '"ver no mapa" do tecnico COM apostrofo abre o mapa');
  assert(r6.apos.comNome,
    'o rotulo chega inteiro a abrirMapaCoord (nome do tecnico + data), com apostrofo e tudo');

  await pg.waitForTimeout(200);

  console.log('\n=== erros de pagina ===');
  console.log(erros.length ? erros : '(nenhum)');
  assert(erros.length === 0, 'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e => { console.error('\n' + e.message); process.exit(1); });
