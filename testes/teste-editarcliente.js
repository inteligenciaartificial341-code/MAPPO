/* Editar cliente SEM desligar o cliente do próprio histórico.
   O nome do cliente é a CHAVE DE LIGAÇÃO: fica guardado em `o.cliente` (mappo_os) e
   `mn.cliente` (mappo_manut). Renomear sem arrastar o nome junto apaga o histórico de serviço
   executado da vista do gestor -- o mesmo defeito já corrigido com técnicos em da03885.
   Contra e910054 esta suíte FALHA no CHECK 1, porque lá não existe nem botão de editar nem
   openModalCliente(nome): o cadastro de cliente é só de ida.
   O CHECK 0 (nome de protótipo derrubando a tela de Clientes) também falha contra e910054 --
   é defeito anterior à edição, medido em 11/10/2026, que vive na função que esta entrega toca.
   Os CHECKs 8 e 10 a 14 sao da RODADA DE CORRECAO (F1..F6) e falham contra a rodada 1:
   8 = o link publico se republica sozinho (a rodada 1 abria um modal mandando regerar, e o
   CHECK 8 de la AFIRMAVA esse texto falso); 10 = fusao de historico por caixa avisa e pede
   confirmacao; 11 = endereco do registro vence o copiado da OS; 12 = contato aparece na tela;
   13 = memoria cheia no meio do arraste nao parte o historico; 14 = espaco duplo, largura zero
   e NBSP contam como duplicata.
   O CHECK 4 foi REESCRITO na rodada final (G1): a versao anterior afirmava que cadastrar um
   nome que existe so nas OS RECUSA, e isso era regressao contra e910054 -- teste que petrifica
   comportamento errado. Hoje ele afirma a regra decidida pelo proprietario em 12/10/2026:
   grafia exata permite, registro repetido e grafia diferente recusam. Por isso esta versao da
   suite falha contra a arvore da rodada anterior, nesse check.
   Os CHECKs 15 a 31 (G2) fecham as 16 garantias que a camada de mutacao achou SEM rede: o
   codigo estava CERTO em todas, e uma mutacao que desfazia cada uma passava pela suite inteira.
   Cada um desses checks nomeia, no proprio comentario, a mutacao contra a qual foi provado.
   O CHECK 32 (V6) e a RODADA VISUAL: ate 12/10/2026 esta suite media tudo no viewport padrao do
   Playwright (1280x720, desktop), e nenhum dos cinco defeitos de geometria em celular (V1 a V5)
   podia ser visto por ela. Ele abre o PROPRIO contexto de celular, nos quatro tamanhos, e falha
   contra a arvore de antes da correcao visual.
   Rodar: node testes/teste-editarcliente.js
   Contra a versão anterior: MAPPO_RAIZ=<copia de e910054> node testes/teste-editarcliente.js */
const { chromium } = require('playwright');
const path = require('path'), http = require('http'), fs = require('fs');
const RAIZ = process.env.MAPPO_RAIZ || path.resolve(__dirname, '..');
function assert(c, m) { if (!c) throw new Error('FALHOU: ' + m); console.log('  ok - ' + m); }

const osDe = (id, cliente, data, extra) => Object.assign({
  id: id, cliente: cliente, endereco: 'Rua ' + id + ', 10', tipo: 'Instalacao',
  tecnico: 'Paulo', data: data, hora: '08:00', status: 'concluida', qtdSplits: 1,
  equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }], checklist: []
}, extra || {});

const manutDe = (id, cliente, data) => ({
  id: id, cliente: cliente, endereco: 'Rua ' + id + ', 10', dataAgendada: data,
  tecnico: 'Paulo', tipo: 'Limpeza', recorrencia: 'trimestral', obs: '',
  concluida: false, avisado: false, criadaEm: '2026-01-01T00:00:00.000Z'
});

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

  await pg.evaluate(() => {
    session = { perfil: 'gestor', nome: 'Paulo', uid: 'u1', role: 'Gestor', workspaceId: 'ws' };
    _gravarTourVisto(); entrarApp(); fbReady = true; WORKSPACE = 'ws';
    _avisouSessaoExpirada = true;
    const s = document.getElementById('splashScreen'); if (s) s.remove();
    window.confirm = () => true;   // o teste não responde caixa de diálogo do navegador
    _bootDone = true;              // é o que liga o interceptor de setItem -> agendarRepublicacao
    /* ESPIÃO de publicarAcompanhamento, instalado ANTES do primeiro check e NUNCA retirado: a
       sonda não fala com produção. É ele que mede a republicação automática do link (CHECK 8). */
    window.__pubs = [];
    publicarAcompanhamento = async (token, payload, pubExpira) => {
      window.__pubs.push({ token: token, titulo: payload && payload.titulo, pubExpira: pubExpira });
      return true;
    };
  });
  await pg.waitForTimeout(250);

  /* A tela de login tem transition:visibility .5s -- getComputedStyle já diz "hidden" no
     COMEÇO da transição, mas o elemento continua capturando elementFromPoint. Esperar o que
     de fato importa (o ponto do meio da tela não cai mais dentro do #loginScreen), com
     controle positivo: antes de entrarApp o ponto TINHA de cair lá dentro. */
  await pg.waitForFunction(() => {
    const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    const login = document.getElementById('loginScreen');
    return !!el && !(login && login.contains(el));
  }, null, { timeout: 5000 });
  console.log('  ok - o app esta de fato na frente (o ponto do meio nao cai mais no #loginScreen)');

  /* ══════════ CHECK 0: nome de protótipo não derruba a tela de Clientes ══════════ */
  /* renderClientes agrupa as visitas num mapa por nome. Com `{}` o mapa HERDA os membros do
     protótipo de Object, então mapC['toString'] já vem truthy, a entrada nunca é criada e o
     .push morre com "Cannot read properties of undefined (reading 'push')" -- a tela inteira
     cai. Não são cinco nomes: é qualquer membro do protótipo. Medido em 11/10/2026. */
  console.log('\n=== CHECK 0: cliente chamado como membro do prototipo de Object ===');
  const PROTO = ['__proto__', 'constructor', 'toString', 'valueOf', 'hasOwnProperty',
                 'propertyIsEnumerable',
                 'Cliente Normal'];   // <- o ultimo e o CONTROLE POSITIVO: nome comum renderiza
  for (const nome of PROTO) {
    const r = await pg.evaluate((n) => {
      const quebras = [];
      const onerr = (e) => quebras.push(String(e.message || e));
      window.addEventListener('error', onerr);
      clientes = [{ nome: n, endereco: 'Rua P, 1', contato: '' }];
      osList = [{
        id: 'op', cliente: n, endereco: 'Rua P, 1', tipo: 'Instalacao', tecnico: 'Paulo',
        data: '2026-10-01', hora: '08:00', status: 'concluida', qtdSplits: 1,
        equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }], checklist: []
      }];
      manutencoes = [];
      let erro = '';
      try { nav('clientes'); } catch (e) { erro = (e.name || 'Erro') + ': ' + e.message; }
      window.removeEventListener('error', onerr);
      const cards = [...document.querySelectorAll('#app .os-card')];
      return {
        erro: erro, quebras: quebras, n: cards.length,
        nomes: cards.map(c => (c.querySelector('.os-client') || {}).textContent || '')
      };
    }, nome);
    const ctrl = nome === 'Cliente Normal';
    console.log('  [' + nome + '] cartoes:', r.n, '| erro:', r.erro || (r.quebras[0] || '(nenhum)'));
    assert(!r.erro && !r.quebras.length,
      (ctrl ? 'CONTROLE: ' : '') + 'a tela de Clientes nao cai com o nome ' + JSON.stringify(nome));
    assert(r.nomes.length === 1 && r.nomes[0] === nome,
      (ctrl ? 'CONTROLE: ' : '') + 'o cliente ' + JSON.stringify(nome) + ' aparece no cartao, uma vez');
  }

  /* ══════════ CHECK 1: O CASO OBRIGATÓRIO — 5 OS continuam ligadas ══════════ */
  console.log('\n=== CHECK 1 (OBRIGATORIO): cliente com 5 OS renomeado continua com as 5 ===');
  const ANTIGO = 'Prefeitura Munucipal de Xaxim';   // erro de digitação de verdade
  const NOVO = 'Prefeitura Municipal de Xaxim';
  const r1 = await pg.evaluate((d) => {
    clientes = [{ nome: d.antigo, endereco: 'Praca Central, 1', contato: '4911' },
                { nome: 'Outro Cliente', endereco: 'Rua Z, 9', contato: '4922' }];
    osList = d.os; manutencoes = [];
    nav('clientes');
    const card = [...document.querySelectorAll('#app .os-card')]
      .find(c => ((c.querySelector('.os-client') || {}).textContent || '') === d.antigo);
    if (!card) return { achouCartao: false };
    const btn = [...card.querySelectorAll('button')]
      .find(x => /editar/i.test(x.textContent || ''));
    if (!btn) return { achouCartao: true, achouBotao: false };
    /* O cartão inteiro tem onclick de abrir o histórico. O botão novo só serve se NÃO abrir
       o histórico junto -- então o que se mede aqui é o título do modal que subiu. */
    btn.click();
    const ov = document.getElementById('curOverlay');
    const titulo = ov ? (ov.querySelector('.modal-head') || {}).textContent || '' : '';
    const abriuHistorico = /Hist.rico de visitas/.test(ov ? ov.textContent : '');
    const campos = {
      nome: (document.getElementById('cNome') || {}).value,
      endereco: (document.getElementById('cEndereco') || {}).value,
      contato: (document.getElementById('cContato') || {}).value
    };
    return { achouCartao: true, achouBotao: true, onclick: btn.getAttribute('onclick'),
             aberto: !!(ov && ov.classList.contains('open')), titulo: titulo.trim(),
             abriuHistorico, campos };
  }, { antigo: ANTIGO, os: [1, 2, 3, 4, 5].map(i => osDe('os' + i, ANTIGO, '2026-0' + i + '-10')) });

  assert(r1.achouCartao, 'o cartao do cliente aparece na tela de Clientes');
  assert(r1.achouBotao, 'o cartao tem botao de EDITAR cliente');
  console.log('  onclick do botao:', r1.onclick);
  assert(/stopPropagation/.test(r1.onclick || ''),
    'o botao de editar tem event.stopPropagation() (senao abriria o historico junto)');
  assert(r1.aberto, 'o botao de editar abre um modal');
  console.log('  titulo do modal:', JSON.stringify(r1.titulo));
  assert(!r1.abriuHistorico, 'o botao de editar NAO abre o historico do cliente');
  assert(/Editar/i.test(r1.titulo), 'o modal e o de EDICAO, nao o de novo cliente');
  console.log('  campos preenchidos:', JSON.stringify(r1.campos));
  assert(r1.campos.nome === ANTIGO, 'o campo de nome vem preenchido com o nome atual');
  assert(r1.campos.endereco === 'Praca Central, 1', 'o endereco vem preenchido');
  assert(r1.campos.contato === '4911', 'o contato vem preenchido');

  const r1b = await pg.evaluate((d) => {
    document.getElementById('cNome').value = d.novo;
    const salvar = [...document.querySelectorAll('#curOverlay .modal-foot button')]
      .find(x => /salvar/i.test(x.textContent || ''));
    if (!salvar) return { achouSalvar: false };
    salvar.click();
    /* openHistoricoCliente(nome) filtra por o.cliente===nome -- e a UNICA comparacao direta
       por nome no arquivo. E ela que prova se o historico continua ligado. */
    openHistoricoCliente(d.novo);
    const ov = document.getElementById('curOverlay');
    const noModal = ov ? (ov.textContent.match(/Hist.rico de visitas \((\d+)\)/) || [])[1] : null;
    closeModal();
    return {
      achouSalvar: true,
      noNomeNovo: osList.filter(o => o.cliente === d.novo).length,
      noNomeAntigo: osList.filter(o => o.cliente === d.antigo).length,
      noModal: noModal,
      registro: clientes.find(c => c.nome === d.novo) || null,
      sobrouAntigo: !!clientes.find(c => c.nome === d.antigo),
      gravadoOs: JSON.parse(localStorage.getItem('mappo_os') || '[]').filter(o => o.cliente === d.novo).length,
      gravadoClientes: JSON.parse(localStorage.getItem('mappo_clientes') || '[]').map(c => c.nome)
    };
  }, { antigo: ANTIGO, novo: NOVO });
  assert(r1b.achouSalvar, 'o modal de edicao tem botao de salvar');
  console.log('  OS no nome novo:', r1b.noNomeNovo, '| no nome antigo:', r1b.noNomeAntigo,
    '| o historico lista:', r1b.noModal);
  assert(r1b.noNomeNovo === 5, 'as 5 OS passaram a apontar para o nome novo');
  assert(r1b.noNomeAntigo === 0, 'nenhuma OS ficou para tras no nome antigo');
  assert(r1b.noModal === '5', 'openHistoricoCliente(nomeNovo) lista as 5 visitas');
  assert(r1b.gravadoOs === 5, 'o arraste foi GRAVADO em mappo_os, nao so no estado em memoria');
  assert(!!r1b.registro && r1b.registro.nome === NOVO, 'o registro em clientes ficou com o nome novo');
  assert(!r1b.sobrouAntigo, 'nao sobrou registro duplicado com o nome antigo');
  console.log('  mappo_clientes gravado:', JSON.stringify(r1b.gravadoClientes));
  assert(r1b.gravadoClientes.includes(NOVO) && !r1b.gravadoClientes.includes(ANTIGO),
    'mappo_clientes gravado tem o nome novo e nao o antigo');

  /* ══════════ CHECK 2: o arraste alcança as manutenções ══════════ */
  console.log('\n=== CHECK 2: cliente com 2 OS e 3 manutencoes -- as 5 seguem o nome novo ===');
  const r2 = await pg.evaluate((d) => {
    clientes = [{ nome: d.a, endereco: 'Rua M, 1', contato: '' }];
    osList = d.os; manutencoes = d.mn;
    nav('clientes');
    openModalCliente(d.a);
    document.getElementById('cNome').value = d.b;
    criarCliente(d.a);
    return {
      osNovo: osList.filter(o => o.cliente === d.b).length,
      mnNovo: manutencoes.filter(m => m.cliente === d.b).length,
      osAntigo: osList.filter(o => o.cliente === d.a).length,
      mnAntigo: manutencoes.filter(m => m.cliente === d.a).length,
      gravadoManut: JSON.parse(localStorage.getItem('mappo_manut') || '[]').filter(m => m.cliente === d.b).length
    };
  }, {
    a: 'Condominio Bela Vista', b: 'Condomínio Bela Vista',
    os: [1, 2].map(i => osDe('m' + i, 'Condominio Bela Vista', '2026-0' + i + '-05')),
    mn: [1, 2, 3].map(i => manutDe('mn' + i, 'Condominio Bela Vista', '2026-1' + i + '-05'))
  });
  console.log('  nome novo -> OS:', r2.osNovo, '| manutencoes:', r2.mnNovo,
    '| sobrou no antigo:', r2.osAntigo + r2.mnAntigo);
  assert(r2.osNovo === 2, 'as 2 OS seguiram o nome novo');
  assert(r2.mnNovo === 3, 'as 3 manutencoes seguiram o nome novo');
  assert(r2.osAntigo === 0 && r2.mnAntigo === 0, 'nada ficou no nome antigo');
  assert(r2.gravadoManut === 3, 'o arraste das manutencoes foi GRAVADO em mappo_manut');

  /* ══════════ CHECK 3: a guarda de nome repetido (união das duas fontes) ══════════ */
  console.log('\n=== CHECK 3: nome repetido recusa (uniao de clientes + osList) ===');
  const casos = [
    { rotulo: 'renomear para nome de OUTRO cliente de clientes',
      clientes: [{ nome: 'Alfa', endereco: '', contato: '' }, { nome: 'Beta', endereco: '', contato: '' }],
      os: [osDe('r1', 'Alfa', '2026-01-01')], editar: 'Alfa', digitar: 'Beta', aceita: false },
    { rotulo: 'o outro nome existe SO nas OS, nao em clientes',
      clientes: [{ nome: 'Alfa', endereco: '', contato: '' }],
      os: [osDe('r1', 'Alfa', '2026-01-01'), osDe('r2', 'Gama', '2026-01-02')],
      editar: 'Alfa', digitar: 'Gama', aceita: false },
    { rotulo: 'colide so pela caixa das letras (PREFEITURA vs Prefeitura)',
      clientes: [{ nome: 'Alfa', endereco: '', contato: '' }, { nome: 'PREFEITURA', endereco: '', contato: '' }],
      os: [osDe('r1', 'Alfa', '2026-01-01')], editar: 'Alfa', digitar: 'Prefeitura', aceita: false },
    { rotulo: 'trocar SO a caixa do PROPRIO nome e permitido',
      clientes: [{ nome: 'joão silva', endereco: '', contato: '' }],
      os: [osDe('r1', 'joão silva', '2026-01-01')], editar: 'joão silva', digitar: 'João Silva', aceita: true },
    { rotulo: 'nome vazio recusa',
      clientes: [{ nome: 'Alfa', endereco: '', contato: '' }],
      os: [osDe('r1', 'Alfa', '2026-01-01')], editar: 'Alfa', digitar: '', aceita: false },
    { rotulo: 'nome so com espacos recusa',
      clientes: [{ nome: 'Alfa', endereco: '', contato: '' }],
      os: [osDe('r1', 'Alfa', '2026-01-01')], editar: 'Alfa', digitar: '   ', aceita: false },
    { rotulo: 'espaco em volta e aparado',
      clientes: [{ nome: 'Alfa', endereco: '', contato: '' }],
      os: [osDe('r1', 'Alfa', '2026-01-01')], editar: 'Alfa', digitar: '  Prefeitura  ',
      aceita: true, esperado: 'Prefeitura' }
  ];
  for (const caso of casos) {
    const r = await pg.evaluate((c) => {
      clientes = JSON.parse(JSON.stringify(c.clientes));
      osList = JSON.parse(JSON.stringify(c.os));
      manutencoes = [];
      const antesOs = JSON.stringify(osList), antesClientes = JSON.stringify(clientes);
      nav('clientes');
      openModalCliente(c.editar);
      document.getElementById('cNome').value = c.digitar;
      criarCliente(c.editar);
      const esperado = c.esperado || c.digitar;
      const ov = document.getElementById('curOverlay');
      return {
        /* modal ainda aberto == a gravacao recusou e deixou o gestor corrigir */
        modalAberto: !!(ov && ov.classList.contains('open') && document.getElementById('cNome')),
        nomes: clientes.map(x => x.nome),
        /* quantas OS do cliente EDITADO seguiram o nome novo (as dos outros nao contam) */
        osNoEsperado: osList.filter(o => o.cliente === esperado).length,
        osNoAntigo: osList.filter(o => o.cliente === c.editar).length,
        nadaMudou: JSON.stringify(osList) === antesOs && JSON.stringify(clientes) === antesClientes,
        temEsperado: clientes.some(x => x.nome === esperado),
        aindaTemEditado: clientes.some(x => x.nome === c.editar),
        toast: (document.getElementById('toast') || {}).textContent || ''
      };
    }, caso);
    console.log('  [' + caso.rotulo + '] clientes:', JSON.stringify(r.nomes),
      '| modal aberto:', r.modalAberto, '| aviso:', JSON.stringify(r.toast));
    if (caso.aceita) {
      const esp = caso.esperado || caso.digitar;
      assert(r.temEsperado, caso.rotulo + ' -> PERMITE (nome ' + JSON.stringify(esp) + ' gravado)');
      assert(r.osNoEsperado === 1 && r.osNoAntigo === 0,
        caso.rotulo + ' -> e a OS do cliente seguiu junto');
      assert(!r.modalAberto, caso.rotulo + ' -> o modal fechou (gravou de verdade)');
    } else {
      assert(r.aindaTemEditado, caso.rotulo + ' -> RECUSA (o nome original ficou)');
      assert(r.nadaMudou,
        caso.rotulo + ' -> a tentativa recusada nao mexeu em NADA (OS e clientes intocados)');
      assert(r.modalAberto, caso.rotulo + ' -> o modal fica aberto para o gestor corrigir');
      assert(/j.*existe|informe o nome/i.test(r.toast), caso.rotulo + ' -> avisa por que recusou');
    }
  }

  /* ══════════ CHECK 4 (G1): a guarda do CADASTRO, que nao e a da edicao ══════════ */
  /* Decidido pelo proprietario em 12/10/2026, depois de medido contra e910054: la o cadastro de
     um cliente que existia SO nas OS salvava; a rodada anterior passou a recusar, e o endereco e
     o telefone recem-digitados eram perdidos. Regressao num fluxo legitimo -- o cliente existe
     so nas OS e "Novo cliente" e como ele finalmente ganha registro proprio.
     Esta versao do CHECK 4 afirma a regra nova; a anterior (`criar com nome que existe so em
     osList RECUSA`) petrificava o comportamento errado.
     O que continua recusando: registro ja existente em `clientes`, e grafia DIFERENTE no
     historico -- porque renderClientes agrupa por nome EXATO e nasceriam DOIS cartoes. */
  console.log('\n=== CHECK 4 (G1): cadastrar -- registro repetido e grafia diferente recusam, grafia exata permite ===');
  const r4 = await pg.evaluate(() => {
    clientes = [{ nome: 'Alfa', endereco: '', contato: '' }];
    osList = [{
      id: 'c1', cliente: 'SoNasOS', endereco: 'Rua S, 1', tipo: 'Instalacao', tecnico: 'Paulo',
      data: '2026-02-02', hora: '08:00', status: 'concluida', qtdSplits: 1,
      equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }], checklist: []
    }];
    manutencoes = [{
      id: 'cm1', cliente: 'SoNaManut', endereco: 'Rua M, 2', dataAgendada: '2026-12-01',
      tecnico: 'Paulo', tipo: 'Limpeza', recorrencia: 'trimestral', obs: '',
      concluida: false, avisado: false, criadaEm: '2026-01-01T00:00:00.000Z'
    }];
    nav('clientes');
    const criar = (n, contato) => {
      openModalCliente();
      document.getElementById('cNome').value = n;
      if (contato) document.getElementById('cContato').value = contato;
      criarCliente();
      const ov = document.getElementById('curOverlay');
      const aberto = !!(ov && ov.classList.contains('open') && document.getElementById('cNome'));
      closeModal();
      nav('clientes');
      return {
        aberto, nomes: clientes.map(c => c.nome),
        registro: clientes.find(c => c.nome === n) || null,
        toast: (document.getElementById('toast') || {}).textContent || '',
        cartoes: [...document.querySelectorAll('#app .os-card')]
          .map(c => ((c.querySelector('.os-client') || {}).textContent || ''))
      };
    };
    const dupClientes = criar('alfa');
    const outraGrafiaOs = criar('sonasos');
    const outraGrafiaMn = criar('sonamanut');
    const grafiaExata = criar('SoNasOS', '(49) 9111-2222');
    const novo = criar('Cliente Inedito');
    return {
      dupClientes, outraGrafiaOs, outraGrafiaMn, grafiaExata, novo,
      osIntactas: osList.filter(o => o.cliente === 'SoNasOS').length
    };
  });
  console.log('  registro repetido ->', JSON.stringify(r4.dupClientes.nomes), '|', JSON.stringify(r4.dupClientes.toast));
  console.log('  grafia diferente (OS) ->', JSON.stringify(r4.outraGrafiaOs.nomes), '|', JSON.stringify(r4.outraGrafiaOs.toast));
  console.log('  grafia diferente (manut) ->', JSON.stringify(r4.outraGrafiaMn.nomes), '|', JSON.stringify(r4.outraGrafiaMn.toast));
  console.log('  grafia EXATA ->', JSON.stringify(r4.grafiaExata.nomes), '| cartoes:',
    JSON.stringify(r4.grafiaExata.cartoes), '|', JSON.stringify(r4.grafiaExata.toast));
  console.log('  nome inedito ->', JSON.stringify(r4.novo.nomes));
  assert(r4.dupClientes.nomes.filter(n => n.toLowerCase() === 'alfa').length === 1,
    'cadastrar com nome que ja tem REGISTRO em clientes RECUSA (nao duplica)');
  assert(/existe cliente com esse nome: Alfa/.test(r4.dupClientes.toast),
    'e o aviso NOMEIA o registro que ja existe');
  assert(!r4.outraGrafiaOs.nomes.some(n => n === 'sonasos'),
    'cadastrar com grafia DIFERENTE da que esta nas OS recusa (nasceriam dois cartoes)');
  assert(/existe cliente com esse nome: SoNasOS/.test(r4.outraGrafiaOs.toast),
    'e o aviso diz a grafia que JA ESTA nas OS, para o gestor usar aquela');
  assert(!r4.outraGrafiaMn.nomes.some(n => n === 'sonamanut'),
    'o mesmo vale para o nome que existe so nas manutencoes');
  assert(/existe cliente com esse nome: SoNaManut/.test(r4.outraGrafiaMn.toast),
    'e o aviso nomeia a grafia que esta nas manutencoes');
  assert(!!r4.grafiaExata.registro,
    'cadastrar com a grafia EXATA de quem existe so nas OS PERMITE (era o fluxo perdido)');
  assert(r4.grafiaExata.registro.contato === '(49) 9111-2222',
    'e o contato digitado no cadastro fica guardado (era ele que se perdia na recusa)');

  /* ══════════ CHECK 4b: grafia exata PRESENTE junto com outra grafia ══════════
     Decidido pelo proprietario em 12/10/2026. O CHECK 4 prova que grafia DIFERENTE recusa;
     aqui o historico tem AS DUAS ('Acme' e 'ACME') e o gestor cadastra a que existe. Recusar
     nesse caso nao protegia nada: o cartao de 'Acme' ja esta na tela, e juntar as grafias e
     trabalho de "Editar cliente", que PERGUNTA antes de fundir (CHECK 10).
     Cenario proprio, para nao mexer na ordem das chamadas do CHECK 4, que ja esta provada. */
  console.log('\n=== CHECK 4b (G1): grafia exata permite MESMO havendo outra grafia ===');
  const r4b = await pg.evaluate(() => {
    clientes = [];
    manutencoes = [];
    osList = [
      { id: 'g1', cliente: 'Acme', endereco: 'Rua A, 1', tipo: 'Instalacao', tecnico: 'Paulo',
        data: '2026-01-01', hora: '08:00', status: 'concluida', qtdSplits: 1,
        equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }], checklist: [] },
      { id: 'g2', cliente: 'ACME', endereco: 'Rua Z, 9', tipo: 'Instalacao', tecnico: 'Paulo',
        data: '2026-02-01', hora: '08:00', status: 'concluida', qtdSplits: 1,
        equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }], checklist: [] }
    ];
    saveOS(); saveClientes(); saveManut();
    nav('clientes');
    openModalCliente();
    document.getElementById('cNome').value = 'Acme';
    document.getElementById('cContato').value = '(64) 95555-4444';
    criarCliente();
    const ov = document.getElementById('curOverlay');
    const recusou = !!(ov && ov.classList.contains('open') && document.getElementById('cNome'));
    closeModal();
    nav('clientes');
    return {
      recusou,
      registro: clientes.find(c => c.nome === 'Acme') || null,
      qtdRegistros: clientes.length,
      toast: (document.getElementById('toast') || {}).textContent || '',
      /* cadastrar nao renomeia nada: as duas grafias tem de ficar como estavam */
      osAcme: osList.filter(o => o.cliente === 'Acme').length,
      osACME: osList.filter(o => o.cliente === 'ACME').length
    };
  });
  console.log('  recusou=' + r4b.recusou, '| registros=' + r4b.qtdRegistros,
    '| OS Acme/ACME=' + r4b.osAcme + '/' + r4b.osACME, '|', JSON.stringify(r4b.toast));
  assert(!r4b.recusou && !!r4b.registro,
    'grafia EXATA permite mesmo havendo OUTRA grafia no historico');
  assert(r4b.registro.contato === '(64) 95555-4444',
    'e o contato digitado fica guardado');
  assert(r4b.qtdRegistros === 1, 'criou UM registro so');
  assert(r4b.osAcme === 1 && r4b.osACME === 1,
    'e CADASTRAR nao mexeu em nenhuma OS -- as duas grafias ficam como estavam');

  assert(!r4.grafiaExata.aberto, 'o modal fechou: o cadastro gravou de verdade');
  assert(r4.grafiaExata.cartoes.filter(n => n === 'SoNasOS').length === 1,
    'continua UM cartao de "SoNasOS", nao dois (registro e historico na mesma grafia)');
  assert(r4.osIntactas === 1, 'o cadastro nao mexeu na OS que ja existia');
  assert(r4.novo.nomes.includes('Cliente Inedito'),
    'CONTROLE: criar com nome inedito continua funcionando');
  assert(!r4.novo.aberto, 'CONTROLE: criar com nome inedito fecha o modal');

  /* ══════════ CHECK 5: cliente que só existe nas OS passa a ter registro ══════════ */
  console.log('\n=== CHECK 5: cliente que so existe nas OS pode ser editado e ganha registro ===');
  const r5 = await pg.evaluate(() => {
    clientes = [];
    osList = [1, 2].map(i => ({
      id: 'so' + i, cliente: 'Padaria do Ze', endereco: 'Rua Pao, 7', tipo: 'Manutencao',
      tecnico: 'Paulo', data: '2026-03-0' + i, hora: '08:00', status: 'concluida', qtdSplits: 1,
      equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }], checklist: []
    }));
    manutencoes = [];
    nav('clientes');
    openModalCliente('Padaria do Ze');
    const preenchido = {
      nome: document.getElementById('cNome').value,
      endereco: document.getElementById('cEndereco').value
    };
    document.getElementById('cNome').value = 'Padaria do Zé';
    document.getElementById('cContato').value = '4933';
    criarCliente('Padaria do Ze');
    return {
      preenchido,
      registro: clientes.find(c => c.nome === 'Padaria do Zé') || null,
      qtdRegistros: clientes.length,
      osNovo: osList.filter(o => o.cliente === 'Padaria do Zé').length
    };
  });
  console.log('  campos preenchidos da uniao:', JSON.stringify(r5.preenchido));
  assert(r5.preenchido.nome === 'Padaria do Ze',
    'o modal abre preenchido mesmo sem registro em clientes');
  assert(r5.preenchido.endereco === 'Rua Pao, 7',
    'o endereco vem da OS quando nao ha registro proprio');
  console.log('  registro criado:', JSON.stringify(r5.registro), '| OS no nome novo:', r5.osNovo);
  assert(!!r5.registro && r5.registro.contato === '4933',
    'ao salvar, o cliente passa a ter registro proprio em clientes');
  assert(r5.qtdRegistros === 1, 'criou UM registro, nao dois');
  assert(r5.osNovo === 2, 'as 2 OS seguiram o nome novo');

  /* ══════════ CHECK 6: editar sem renomear não toca OS nem manutenções ══════════ */
  console.log('\n=== CHECK 6: mudar so endereco/contato deixa OS e manutencoes intocadas ===');
  const r6 = await pg.evaluate((d) => {
    clientes = [{ nome: 'Mercado Central', endereco: 'Rua Velha, 1', contato: '111' }];
    osList = d.os; manutencoes = d.mn;
    const antesOs = JSON.stringify(osList), antesMn = JSON.stringify(manutencoes);
    nav('clientes');
    openModalCliente('Mercado Central');
    document.getElementById('cEndereco').value = 'Avenida Nova, 500';
    document.getElementById('cContato').value = '222';
    criarCliente('Mercado Central');
    return {
      registro: clientes.find(c => c.nome === 'Mercado Central') || null,
      osIgual: JSON.stringify(osList) === antesOs,
      mnIgual: JSON.stringify(manutencoes) === antesMn,
      toast: (document.getElementById('toast') || {}).textContent || ''
    };
  }, {
    os: [osDe('e1', 'Mercado Central', '2026-04-01')],
    mn: [manutDe('em1', 'Mercado Central', '2026-09-01')]
  });
  console.log('  registro:', JSON.stringify(r6.registro), '| aviso:', JSON.stringify(r6.toast));
  assert(!!r6.registro && r6.registro.endereco === 'Avenida Nova, 500' && r6.registro.contato === '222',
    'endereco e contato novos ficaram gravados');
  assert(r6.osIgual, 'as OS ficaram byte a byte iguais (nada foi arrastado sem necessidade)');
  assert(r6.mnIgual, 'as manutencoes ficaram byte a byte iguais');

  /* ══════════ CHECK 7: apóstrofo no nome ══════════ */
  console.log('\n=== CHECK 7: nome com apostrofo -- botao de editar e historico seguem abrindo ===');
  const r7 = await pg.evaluate(() => {
    clientes = [{ nome: "Sant'Ana Comércio", endereco: 'Rua A, 1', contato: '999' }];
    osList = [1, 2].map(i => ({
      id: 'ap' + i, cliente: "Sant'Ana Comércio", endereco: 'Rua A, 1', tipo: 'Instalacao',
      tecnico: 'Paulo', data: '2026-05-0' + i, hora: '08:00', status: 'concluida', qtdSplits: 1,
      equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }], checklist: []
    }));
    manutencoes = [];
    nav('clientes');
    const quebras = [];
    const onerr = (e) => quebras.push(String(e.message || e));
    window.addEventListener('error', onerr);
    const card = [...document.querySelectorAll('#app .os-card')][0];
    const btn = [...card.querySelectorAll('button')].find(x => /editar/i.test(x.textContent || ''));
    if (btn) btn.click();
    const abriuEdicao = !!document.getElementById('cNome');
    const nomeNoCampo = (document.getElementById('cNome') || {}).value;
    /* o onclick do botao de salvar tambem leva o nome antigo: se ele quebrar, o rename do
       cliente com apostrofo fica impossivel pela tela */
    const salvar = [...document.querySelectorAll('#curOverlay .modal-foot button')]
      .find(x => /salvar/i.test(x.textContent || ''));
    const onclickSalvar = salvar ? salvar.getAttribute('onclick') : '(sem botao)';
    if (salvar) { document.getElementById('cNome').value = "Sant'Ana Comércio Ltda"; salvar.click(); }
    window.removeEventListener('error', onerr);
    nav('clientes');
    const card2 = [...document.querySelectorAll('#app .os-card')][0];
    if (card2) card2.click();
    const ov = document.getElementById('curOverlay');
    const historico = ov ? (ov.textContent.match(/Hist.rico de visitas \((\d+)\)/) || [])[1] : null;
    closeModal();
    return {
      abriuEdicao, nomeNoCampo, onclickSalvar, quebras,
      osNovo: osList.filter(o => o.cliente === "Sant'Ana Comércio Ltda").length,
      historico
    };
  });
  console.log('  onclick do salvar:', r7.onclickSalvar);
  console.log('  erros no clique:', r7.quebras.length ? r7.quebras : '(nenhum)');
  assert(r7.abriuEdicao, 'o botao de editar abre a edicao para nome com apostrofo');
  assert(r7.nomeNoCampo === "Sant'Ana Comércio", 'o nome com apostrofo chega inteiro ao campo');
  assert(!r7.quebras.length, 'nenhum erro de JS no caminho do apostrofo');
  assert(r7.osNovo === 2, 'o rename do cliente com apostrofo arrasta as 2 OS');
  assert(r7.historico === '2', 'o cartao do nome novo continua abrindo o historico com as 2 visitas');

  /* ══════════ CHECK 8 (F1): o link público se atualiza SOZINHO, e nenhum modal aparece ══════════ */
  /* A rodada 1 abria um modal bloqueante mandando o gestor "gerar o link de novo", e o CHECK 8
     de lá AFIRMAVA esse texto. O texto era falso: `mappo_os` está em PUB_KEYS, então
     saveOS() -> interceptor de setItem -> _marcarAlteracaoLocal -> agendarRepublicacao() e,
     3 s depois, republicarAtivos() reescreve o documento público com `titulo:os.cliente` já
     corrigido -- sem o gestor fazer nada. Medido aqui espionando publicarAcompanhamento
     (instalado no preâmbulo): a sonda NUNCA publica de verdade. */
  console.log('\n=== CHECK 8 (F1): OS com pubToken -- o documento publico e republicado sozinho ===');
  assert(await pg.evaluate(() => typeof _avisoClienteLinkPublico === 'undefined'),
    'o modal _avisoClienteLinkPublico nao existe mais no app');

  await pg.evaluate((d) => {
    clientes = [{ nome: 'Escola Sao Jose', endereco: 'Rua E, 1', contato: '' }];
    osList = d.comToken; manutencoes = [];
    fbReady = true;
    /* GRAVAR o cenário: startNotifChecker tem um setInterval de 5 s que recarrega `osList` e
       `manutencoes` do localStorage (sync entre abas). Sem gravar, as esperas de 3,7 s abaixo
       deixariam esse intervalo trocar a montagem deste check pelo que havia no disco -- medido
       em 11/10/2026: o rename passava a arrastar 0 OS. */
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
  }, { comToken: [osDe('p1', 'Escola Sao Jose', '2026-06-01', { pubToken: 'tok1', pubExpira: Date.now() + 86400000 }),
                  osDe('p2', 'Escola Sao Jose', '2026-06-02')] });

  /* A gravação do cenário acima já agenda uma republicação (mappo_os está em PUB_KEYS): deixa
     ela acontecer e só então começa a medir. */
  await pg.waitForTimeout(3700);
  /* CONTROLE NEGATIVO: do zero, sem renomear nada, passados mais de 3 s, ZERO publicações. É o
     que prova que a publicação medida depois vem do rename, e não do relógio. */
  await pg.evaluate(() => { clearTimeout(_pubTimer); window.__pubs = []; });
  await pg.waitForTimeout(3700);
  const semRename = await pg.evaluate(() => window.__pubs.length);
  console.log('  [controle] publicacoes sem renomear nada:', semRename);
  assert(semRename === 0, 'CONTROLE: sem renomear, nenhuma publicacao acontece sozinha');

  const r8 = await pg.evaluate(() => {
    openModalCliente('Escola Sao Jose');
    document.getElementById('cNome').value = 'Escola São José';
    criarCliente('Escola Sao Jose');
    const ov = document.getElementById('curOverlay');
    return {
      aberto: !!(ov && ov.classList.contains('open')),
      osNovo: osList.filter(o => o.cliente === 'Escola São José').length,
      toast: (document.getElementById('toast') || {}).textContent || ''
    };
  });
  console.log('  modal aberto depois do rename:', r8.aberto, '| aviso:', JSON.stringify(r8.toast));
  /* closeModal() tira a classe `open` na hora e só limpa o #modalRoot 200 ms depois -- o TEXTO
     do modal anterior fica no DOM. Por isso o controle negativo aqui mede a CLASSE, e o texto
     só é medido depois de esperar a limpeza (logo abaixo). */
  assert(!r8.aberto, 'nenhum modal fica aberto depois do rename (o aviso bloqueante morreu)');
  assert(r8.osNovo === 2, 'o rename aconteceu normalmente');
  assert(!/nome antigo|gere o link|gerar o link|regerar/i.test(r8.toast),
    'o aviso na tela NAO manda o gestor regerar o link');

  await pg.waitForTimeout(500);
  const limpo = await pg.evaluate(() => (document.getElementById('modalRoot') || {}).textContent || '');
  assert(!/nome antigo|gere o link|gerar o link/i.test(limpo),
    'passada a animacao de saida, nao sobrou nenhum modal falando de regerar link');

  /* Agora o que importa: 3 s depois, o documento público sai com o nome NOVO. */
  await pg.waitForTimeout(3700);
  const pubs = await pg.evaluate(() => window.__pubs.slice());
  console.log('  publicacoes depois do rename:', JSON.stringify(pubs));
  assert(pubs.length >= 1, 'o app republicou o documento do link SOZINHO, sem o gestor pedir');
  assert(pubs.some(p => p.token === 'tok1' && p.titulo === 'Escola São José'),
    'o payload republicado leva o NOME NOVO em titulo (era isso que o modal dizia ser impossivel)');

  /* ── CHECK 8b: offline, a unica linha que o gestor precisa ler ── */
  console.log('\n=== CHECK 8b (F1): offline, o app diz que o link atualiza na proxima sincronizacao ===');
  const r8b = await pg.evaluate((d) => {
    clientes = [{ nome: 'Escola Offline', endereco: 'Rua O, 1', contato: '' }];
    osList = d.comToken; manutencoes = [];
    fbReady = false;                       // aparelho sem nuvem agora
    nav('clientes');
    openModalCliente('Escola Offline');
    document.getElementById('cNome').value = 'Escola Offline 2';
    criarCliente('Escola Offline');
    const ov = document.getElementById('curOverlay');
    return { toast: (document.getElementById('toast') || {}).textContent || '',
             aberto: !!(ov && ov.classList.contains('open')) };
  }, { comToken: [osDe('o1', 'Escola Offline', '2026-06-03', { pubToken: 'tok2', pubExpira: Date.now() + 86400000 })] });
  console.log('  offline, aviso:', JSON.stringify(r8b.toast));
  assert(/pr.xima sincroniza/i.test(r8b.toast),
    'offline e com link enviado, o app diz que o link atualiza na proxima sincronizacao');
  assert(!/gere o link|gerar o link|regerar/i.test(r8b.toast),
    'mesmo offline, o app NAO manda o gestor regerar o link');
  assert(!r8b.aberto, 'offline tambem nao abre modal nenhum');

  /* CONTROLE POSITIVO do 8b: online, a linha de "proxima sincronizacao" NAO aparece -- senao
     ela nao estaria medindo o offline, estaria sempre la. */
  const r8c = await pg.evaluate((d) => {
    clientes = [{ nome: 'Escola Online', endereco: 'Rua N, 1', contato: '' }];
    osList = d.comToken; manutencoes = [];
    fbReady = true;
    nav('clientes');
    openModalCliente('Escola Online');
    document.getElementById('cNome').value = 'Escola Online 2';
    criarCliente('Escola Online');
    return { toast: (document.getElementById('toast') || {}).textContent || '' };
  }, { comToken: [osDe('n1', 'Escola Online', '2026-06-04', { pubToken: 'tok3', pubExpira: Date.now() + 86400000 })] });
  console.log('  [controle] online, aviso:', JSON.stringify(r8c.toast));
  assert(!/pr.xima sincroniza/i.test(r8c.toast),
    'CONTROLE: com nuvem, a linha de "proxima sincronizacao" nao aparece');

  /* ══════════ CHECK 9: o seletor do minitutorial sobreviveu ══════════ */
  console.log('\n=== CHECK 9: o passo do tour ainda acha o botao "Novo cliente" ===');
  const r9 = await pg.evaluate(() => {
    clientes = [{ nome: 'Cliente Tour', endereco: 'Rua T, 1', contato: '' }];
    osList = []; manutencoes = [];
    nav('clientes');
    const alvo = document.querySelector('button[onclick="openModalCliente()"]');
    const editar = [...document.querySelectorAll('#app .os-card button')]
      .filter(b => /editar/i.test(b.textContent || ''));
    return {
      achou: !!alvo, texto: alvo ? alvo.textContent.trim() : '(nao achou)',
      /* o botao de editar NAO pode casar o mesmo seletor, senao o tour aponta pro lugar errado */
      editarCasaOSeletor: editar.some(b => b.matches('button[onclick="openModalCliente()"]')),
      qtdEditar: editar.length
    };
  });
  console.log('  alvo do tour:', JSON.stringify(r9.texto), '| botoes de editar:', r9.qtdEditar);
  assert(r9.achou, 'button[onclick="openModalCliente()"] continua existindo (passo do tour)');
  assert(/Novo cliente/.test(r9.texto), 'e o botao de Novo cliente, nao outro');
  assert(!r9.editarCasaOSeletor, 'o botao de editar NAO casa o seletor do tour');

  /* ══════════ CHECK 10 (F2): fundir dois históricos avisa e pede confirmação ══════════ */
  /* Em `bate()` a comparação sem caixa lia "ACME" como "sou eu mesma" e o arraste, sensível à
     caixa, levava só uma grafia: renomear `Acme` -> `ACME` juntava dois históricos de serviço
     executado em silêncio. Fusão não é recusada -- é CONFIRMADA, dizendo quanto vem de cada
     lado. E cancelar não muda nada em lugar nenhum. */
  console.log('\n=== CHECK 10 (F2): renomear so a caixa com colisao AVISA e pede confirmacao ===');
  const dados10 = () => ({
    clientes: [{ nome: 'Acme', endereco: 'Rua Acme, 1', contato: '' },
               { nome: 'ACME', endereco: '', contato: '4788' },
               { nome: 'acme', endereco: '', contato: '' }],
    os: [osDe('a1', 'Acme', '2026-01-01'), osDe('a2', 'Acme', '2026-01-02'),
         osDe('a3', 'Acme', '2026-01-03'),
         osDe('b1', 'ACME', '2026-02-01'), osDe('b2', 'ACME', '2026-02-02'),
         osDe('c1', 'acme', '2026-03-01')],
    mn: [manutDe('am1', 'Acme', '2026-11-01'), manutDe('bm1', 'ACME', '2026-12-01')]
  });

  const r10 = await pg.evaluate((d) => {
    clientes = JSON.parse(JSON.stringify(d.clientes));
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    const perguntas = [];
    const confOrig = window.confirm;
    window.confirm = (m) => { perguntas.push(String(m)); return true; };   // o gestor ACEITA
    nav('clientes');
    openModalCliente('Acme');
    document.getElementById('cNome').value = 'ACME';
    criarCliente('Acme');
    window.confirm = confOrig;
    return {
      perguntas: perguntas,
      osNoAlvo: osList.filter(o => o.cliente === 'ACME').length,
      osSobrando: osList.filter(o => o.cliente !== 'ACME').map(o => o.cliente),
      mnNoAlvo: manutencoes.filter(m => m.cliente === 'ACME').length,
      mnSobrando: manutencoes.filter(m => m.cliente !== 'ACME').map(m => m.cliente),
      nomes: clientes.map(c => c.nome),
      registro: clientes.find(c => c.nome === 'ACME') || null,
      gravadoOs: JSON.parse(localStorage.getItem('mappo_os') || '[]').filter(o => o.cliente === 'ACME').length,
      gravadoMn: JSON.parse(localStorage.getItem('mappo_manut') || '[]').filter(m => m.cliente === 'ACME').length,
      gravadoCl: JSON.parse(localStorage.getItem('mappo_clientes') || '[]').map(c => c.nome),
      toast: (document.getElementById('toast') || {}).textContent || ''
    };
  }, dados10());
  console.log('  perguntou', r10.perguntas.length, 'vez(es)');
  console.log('  pergunta:', JSON.stringify((r10.perguntas[0] || '').replace(/\s+/g, ' ')));
  assert(r10.perguntas.length === 1, 'a fusao de historicos PERGUNTA antes (uma vez)');
  const p10 = r10.perguntas[0] || '';
  assert(/juntar/i.test(p10), 'a pergunta diz que vai JUNTAR');
  assert(/"Acme": 3 visitas e 1 manuten/.test(p10), 'a pergunta diz o que vem do nome antigo (3 visitas, 1 manutencao)');
  assert(/"ACME": 2 visitas e 1 manuten/.test(p10), 'a pergunta diz o que ja existe do outro lado (2 visitas, 1 manutencao)');
  assert(/"acme": 1 visita e 0 manuten/.test(p10), 'a pergunta lista TODAS as grafias envolvidas, nao duas');
  console.log('  depois: OS no alvo', r10.osNoAlvo, '| sobrando', JSON.stringify(r10.osSobrando),
    '| manut no alvo', r10.mnNoAlvo, '| clientes', JSON.stringify(r10.nomes));
  assert(r10.osNoAlvo === 6 && r10.osSobrando.length === 0,
    'o arraste levou TODAS as grafias: 6 OS sob o nome novo, nenhuma sobrando');
  assert(r10.mnNoAlvo === 2 && r10.mnSobrando.length === 0, 'as 2 manutencoes tambem foram todas');
  assert(r10.nomes.length === 1 && r10.nomes[0] === 'ACME',
    'sobrou UM registro em clientes, nao tres com o mesmo nome');
  assert(!!r10.registro && r10.registro.endereco === 'Rua Acme, 1' && r10.registro.contato === '4788',
    'o registro sobrevivente ficou com o endereco digitado E com o contato que so o outro tinha');
  assert(r10.gravadoOs === 6 && r10.gravadoMn === 2 && r10.gravadoCl.length === 1,
    'a fusao foi GRAVADA no disco, nao so na memoria');
  assert(/juntad/i.test(r10.toast), 'o aviso na tela diz que os historicos foram juntados');

  console.log('\n=== CHECK 10b (F2): fusao CANCELADA nao muda nada, em memoria nem no disco ===');
  const r10b = await pg.evaluate((d) => {
    clientes = JSON.parse(JSON.stringify(d.clientes));
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    saveClientes(); saveOS(); saveManut();          // linha de base NO DISCO
    const base = { cl: localStorage.getItem('mappo_clientes'), os: localStorage.getItem('mappo_os'),
                   mn: localStorage.getItem('mappo_manut') };
    const antes = { cl: JSON.stringify(clientes), os: JSON.stringify(osList),
                    mn: JSON.stringify(manutencoes) };
    const perguntas = [];
    const confOrig = window.confirm;
    window.confirm = (m) => { perguntas.push(String(m)); return false; };  // o gestor CANCELA
    nav('clientes');
    openModalCliente('Acme');
    document.getElementById('cNome').value = 'ACME';
    document.getElementById('cEndereco').value = 'NAO DEVE ENTRAR';
    criarCliente('Acme');
    window.confirm = confOrig;
    const ov = document.getElementById('curOverlay');
    return {
      perguntou: perguntas.length,
      memIgual: JSON.stringify(clientes) === antes.cl && JSON.stringify(osList) === antes.os
                && JSON.stringify(manutencoes) === antes.mn,
      discoIgual: localStorage.getItem('mappo_clientes') === base.cl
                && localStorage.getItem('mappo_os') === base.os
                && localStorage.getItem('mappo_manut') === base.mn,
      nomes: clientes.map(c => c.nome),
      modalAberto: !!(ov && ov.classList.contains('open') && document.getElementById('cNome'))
    };
  }, dados10());
  console.log('  cancelou | memoria igual:', r10b.memIgual, '| disco igual:', r10b.discoIgual,
    '| clientes:', JSON.stringify(r10b.nomes));
  assert(r10b.perguntou === 1, 'perguntou antes de fundir (controle do caso cancelado)');
  assert(r10b.memIgual, 'cancelar nao mudou NADA em memoria (clientes, OS e manutencoes intactos)');
  assert(r10b.discoIgual, 'cancelar nao mudou NADA no disco (as tres chaves byte a byte iguais)');
  assert(r10b.modalAberto, 'o modal fica aberto para o gestor desistir ou corrigir');

  console.log('\n=== CHECK 10c (F2): trocar so a caixa SEM colisao nao pergunta nada ===');
  const r10c = await pg.evaluate((d) => {
    clientes = [{ nome: 'joão silva', endereco: 'Rua J, 1', contato: '' }];
    osList = d.os; manutencoes = [];
    const perguntas = [];
    const confOrig = window.confirm;
    window.confirm = (m) => { perguntas.push(String(m)); return true; };
    nav('clientes');
    openModalCliente('joão silva');
    document.getElementById('cNome').value = 'João Silva';
    criarCliente('joão silva');
    window.confirm = confOrig;
    return { perguntas: perguntas, nomes: clientes.map(c => c.nome),
             osNovo: osList.filter(o => o.cliente === 'João Silva').length };
  }, { os: [osDe('j1', 'joão silva', '2026-04-01')] });
  console.log('  perguntas:', r10c.perguntas.length, '| clientes:', JSON.stringify(r10c.nomes));
  assert(r10c.perguntas.length === 0,
    'CONTROLE: trocar so a caixa do proprio nome, sem outra grafia, nao pergunta nada');
  assert(r10c.nomes.length === 1 && r10c.nomes[0] === 'João Silva' && r10c.osNovo === 1,
    'CONTROLE: e a troca de caixa acontece normalmente, com a OS junto');

  /* ══════════ CHECK 11 (F3): o endereço do registro vence o copiado da OS ══════════ */
  console.log('\n=== CHECK 11 (F3): endereco editado aparece no cartao de cliente COM OS ===');
  const r11 = await pg.evaluate((d) => {
    clientes = [{ nome: 'Loja do Meio', endereco: 'ENDERECO NOVO, 999', contato: '4777' },
                { nome: 'Loja Sem Endereco', endereco: '', contato: '' }];
    osList = d.os; manutencoes = [];
    nav('clientes');
    const ler = (n) => {
      const c = [...document.querySelectorAll('#app .os-card')]
        .find(x => ((x.querySelector('.os-client') || {}).textContent || '') === n);
      if (!c) return { achou: false };
      return { achou: true, txt: c.textContent.replace(/\s+/g, ' ').trim(),
               addrs: [...c.querySelectorAll('.os-addr')].map(x => x.textContent.trim()) };
    };
    return { comReg: ler('Loja do Meio'), semReg: ler('Loja Sem Endereco') };
  }, {
    os: [osDe('x1', 'Loja do Meio', '2026-01-01', { endereco: 'Rua Antiga da OS, 1' }),
         osDe('x2', 'Loja Sem Endereco', '2026-01-02', { endereco: 'Rua da OS Preservada, 7' })]
  });
  console.log('  cartao com registro, linhas:', JSON.stringify(r11.comReg.addrs));
  console.log('  cartao com registro vazio, linhas:', JSON.stringify(r11.semReg.addrs));
  assert(r11.comReg.achou && r11.semReg.achou, 'os dois cartoes aparecem na tela de Clientes');
  assert(/ENDERECO NOVO, 999/.test(r11.comReg.txt),
    'o endereco do REGISTRO aparece no cartao de um cliente que ja tem OS');
  assert(!/Rua Antiga da OS/.test(r11.comReg.txt),
    'o endereco antigo, copiado da OS, nao aparece mais nesse cartao');
  assert(/Rua da OS Preservada, 7/.test(r11.semReg.txt),
    'CONTROLE: registro com endereco VAZIO nao apaga o endereco que a OS conhece');

  /* ══════════ CHECK 12 (F4): contato na tela -- cartão e detalhe ══════════ */
  console.log('\n=== CHECK 12 (F4): o contato aparece no cartao e no detalhe ===');
  assert(r11.comReg.addrs.length === 2 && /4777/.test(r11.comReg.addrs[1]),
    'o contato aparece no cartao, em linha propria, no padrao os-addr');
  assert(r11.semReg.addrs.length === 1,
    'cliente sem contato NAO ganha linha vazia no cartao (nenhum rotulo orfao)');

  await pg.evaluate((d) => {
    clientes = [{ nome: 'Casa do Contato', endereco: 'Av Detalhe, 10', contato: '(49) 9999-0000' },
                { nome: 'Casa Sem Contato', endereco: 'Av Detalhe, 20', contato: '' }];
    osList = d.os; manutencoes = [];
    nav('clientes');
  }, {
    os: [osDe('y1', 'Casa do Contato', '2026-05-01'), osDe('y2', 'Casa Sem Contato', '2026-05-02')]
  });
  /* um detalhe por evaluate, com pausa entre eles: closeModal() so limpa o #modalRoot 200 ms
     depois, e abrir o proximo modal dentro da mesma tarefa deixaria a limpeza atrasada apagar
     o modal novo. */
  const lerDetalhe = async (nome) => await pg.evaluate((n) => {
    openHistoricoCliente(n);
    const ov = document.getElementById('curOverlay');
    const metas = [...ov.querySelectorAll('.modal-body .os-meta-i')].map(x => x.textContent.trim());
    const txt = ov.textContent.replace(/\s+/g, ' ');
    const r = { metas: metas, txt: txt,
                posEnd: txt.indexOf('Av Detalhe'), posHist: txt.search(/Hist.rico de visitas/) };
    closeModal();
    return r;
  }, nome);
  const d12a = await lerDetalhe('Casa do Contato');
  await pg.waitForTimeout(320);
  const d12b = await lerDetalhe('Casa Sem Contato');
  await pg.waitForTimeout(320);
  console.log('  detalhe COM contato, campos:', JSON.stringify(d12a.metas));
  console.log('  detalhe SEM contato, campos:', JSON.stringify(d12b.metas));
  assert(d12a.metas.some(m => /Av Detalhe, 10/.test(m)), 'o endereco aparece no detalhe do cliente');
  assert(d12a.metas.some(m => /\(49\) 9999-0000/.test(m)), 'o contato aparece no detalhe do cliente');
  assert(d12a.posEnd >= 0 && d12a.posHist > d12a.posEnd,
    'endereco e contato vem ANTES do historico de visitas');
  assert(d12b.metas.length === 1 && /Av Detalhe, 20/.test(d12b.metas[0]),
    'cliente sem contato mostra so o endereco -- nenhum campo vazio no detalhe');
  assert(!/9999-0000/.test(d12b.txt), 'CONTROLE: o detalhe do outro cliente nao vaza o contato do primeiro');

  /* ══════════ CHECK 13 (F5): memória cheia no meio do arraste -- tudo ou nada ══════════ */
  /* Medido antes da correção com o setItem de `mappo_os` lançando QuotaExceededError: no disco o
     REGISTRO ficava com o nome novo e TODO o histórico no antigo; saveManut() nunca rodava; e em
     memória `osList` já estava renomeada e `manutencoes` não -- um saveOS() posterior gravaria o
     rename das OS deixando as manutenções órfãs para sempre. */
  console.log('\n=== CHECK 13 (F5): memoria cheia no meio do arraste -- ou tudo grava, ou nada ===');
  const r13 = await pg.evaluate((d) => {
    clientes = [{ nome: 'Padaria Atomica', endereco: 'Rua At, 1', contato: '555' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    saveClientes(); saveOS(); saveManut();          // linha de base NO DISCO, com o setItem real
    const base = { mappo_clientes: localStorage.getItem('mappo_clientes'),
                   mappo_os: localStorage.getItem('mappo_os'),
                   mappo_manut: localStorage.getItem('mappo_manut') };
    const antes = { cl: JSON.stringify(clientes), os: JSON.stringify(osList),
                    mn: JSON.stringify(manutencoes) };
    /* a memoria "enche" SO para mappo_os -- o patch fica POR CIMA do interceptor do app */
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === 'mappo_os') { const e = new Error('cota estourada (teste)'); e.name = 'QuotaExceededError'; throw e; }
      return orig.apply(this, arguments);
    };
    let lancou = '';
    nav('clientes');
    openModalCliente('Padaria Atomica');
    document.getElementById('cNome').value = 'Padaria Atômica';
    try { criarCliente('Padaria Atomica'); }
    catch (e) { lancou = (e.name || 'Erro') + ': ' + e.message; }
    Storage.prototype.setItem = orig;
    const discoCl = JSON.parse(localStorage.getItem('mappo_clientes') || '[]');
    const discoOs = JSON.parse(localStorage.getItem('mappo_os') || '[]');
    const discoMn = JSON.parse(localStorage.getItem('mappo_manut') || '[]');
    const r = {
      lancou: lancou,
      toast: (document.getElementById('toast') || {}).textContent || '',
      memIgual: JSON.stringify(clientes) === antes.cl && JSON.stringify(osList) === antes.os
                && JSON.stringify(manutencoes) === antes.mn,
      memNomes: clientes.map(c => c.nome),
      memOsNovo: osList.filter(o => o.cliente === 'Padaria Atômica').length,
      memMnNovo: manutencoes.filter(m => m.cliente === 'Padaria Atômica').length,
      discoIgual: ['mappo_clientes', 'mappo_os', 'mappo_manut']
                    .every(k => localStorage.getItem(k) === base[k]),
      discoNomes: discoCl.map(c => c.nome),
      discoOsNovo: discoOs.filter(o => o.cliente === 'Padaria Atômica').length,
      discoOsAntigo: discoOs.filter(o => o.cliente === 'Padaria Atomica').length,
      discoMnNovo: discoMn.filter(m => m.cliente === 'Padaria Atômica').length,
      discoMnAntigo: discoMn.filter(m => m.cliente === 'Padaria Atomica').length
    };
    _fecharAvisoMemoria();
    return r;
  }, {
    os: [osDe('q1', 'Padaria Atomica', '2026-07-01'), osDe('q2', 'Padaria Atomica', '2026-07-02')],
    mn: [manutDe('qm1', 'Padaria Atomica', '2026-08-01'), manutDe('qm2', 'Padaria Atomica', '2026-09-01')]
  });
  console.log('  memoria igual:', r13.memIgual, '| disco igual:', r13.discoIgual);
  console.log('  memoria -> clientes:', JSON.stringify(r13.memNomes), '| OS no nome novo:', r13.memOsNovo,
    '| manut no nome novo:', r13.memMnNovo);
  console.log('  disco   -> clientes:', JSON.stringify(r13.discoNomes), '| OS novo/antigo:',
    r13.discoOsNovo + '/' + r13.discoOsAntigo, '| manut novo/antigo:',
    r13.discoMnNovo + '/' + r13.discoMnAntigo);
  console.log('  aviso na tela:', JSON.stringify(r13.toast), '| estourou para quem clicou:',
    r13.lancou || '(nao)');
  assert(r13.memIgual, 'memoria cheia no meio: NADA mudou em memoria (clientes, OS e manutencoes)');
  assert(r13.discoIgual, 'memoria cheia no meio: NADA mudou no disco (as tres chaves iguais)');
  assert(r13.memNomes.length === 1 && r13.memNomes[0] === 'Padaria Atomica',
    'o registro em memoria continua com o nome ANTIGO');
  assert(r13.discoNomes.length === 1 && r13.discoNomes[0] === 'Padaria Atomica',
    'o registro NO DISCO continua com o nome ANTIGO (era aqui que ele ficava sozinho no novo)');
  assert(r13.memOsNovo === 0 && r13.memMnNovo === 0 && r13.discoOsNovo === 0 && r13.discoMnNovo === 0,
    'nenhuma OS nem manutencao ficou pela metade no nome novo');
  assert(r13.discoOsAntigo === 2 && r13.discoMnAntigo === 2,
    'o historico inteiro continua ligado ao nome antigo no disco');
  assert(/mem.ria do aparelho cheia/i.test(r13.toast),
    'o gestor E AVISADO (antes nao havia aviso nenhum vindo de criarCliente)');
  assert(/nada foi alterado/i.test(r13.toast), 'e o aviso diz que NADA foi alterado');
  assert(!r13.lancou, 'o erro nao sobe cru para quem clicou em salvar');

  /* CONTROLE POSITIVO do 13: com o setItem funcionando, o MESMO rename grava. Sem isto, o check
     acima passaria por qualquer motivo que impedisse o rename -- inclusive um defeito novo. */
  const r13b = await pg.evaluate(() => {
    nav('clientes');
    openModalCliente('Padaria Atomica');
    document.getElementById('cNome').value = 'Padaria Atômica';
    criarCliente('Padaria Atomica');
    return {
      nomes: clientes.map(c => c.nome),
      osNovo: osList.filter(o => o.cliente === 'Padaria Atômica').length,
      mnNovo: manutencoes.filter(m => m.cliente === 'Padaria Atômica').length,
      discoOsNovo: JSON.parse(localStorage.getItem('mappo_os') || '[]').filter(o => o.cliente === 'Padaria Atômica').length,
      discoMnNovo: JSON.parse(localStorage.getItem('mappo_manut') || '[]').filter(m => m.cliente === 'Padaria Atômica').length
    };
  });
  console.log('  [controle] com setItem normal -> clientes:', JSON.stringify(r13b.nomes),
    '| OS:', r13b.osNovo, '| manut:', r13b.mnNovo);
  assert(r13b.nomes[0] === 'Padaria Atômica' && r13b.osNovo === 2 && r13b.mnNovo === 2
    && r13b.discoOsNovo === 2 && r13b.discoMnNovo === 2,
    'CONTROLE: com o setItem funcionando, o mesmo rename grava tudo (memoria e disco)');

  /* ══════════ CHECK 14 (F6): furos de normalização ══════════ */
  /* Medidos como ACEITOS antes da correção contra "Prefeitura Municipal" já existente: espaço
     duplo no meio, U+200B (largura zero) e U+00A0 (NBSP). O resultado eram dois cartões
     idênticos na tela, cada um com parte do histórico. */
  console.log('\n=== CHECK 14 (F6): espaco duplo, largura zero e NBSP contam como duplicata ===');
  const furos = [
    { rotulo: 'espaco duplo no meio', digitar: 'Prefeitura  Municipal', aceita: false },
    { rotulo: 'largura zero (U+200B) no fim', digitar: 'Prefeitura Municipal​', aceita: false },
    { rotulo: 'NBSP (U+00A0) no lugar do espaco', digitar: 'Prefeitura Municipal', aceita: false },
    { rotulo: 'so caracteres invisiveis', digitar: '​ ​', aceita: false, vazio: true },
    { rotulo: 'CONTROLE nome legitimo diferente', digitar: 'Prefeitura Estadual', aceita: true }
  ];
  for (const f of furos) {
    const r = await pg.evaluate((c) => {
      clientes = [{ nome: 'Alfa', endereco: '', contato: '' },
                  { nome: 'Prefeitura Municipal', endereco: 'Praca 1', contato: '' }];
      osList = [{
        id: 'f1', cliente: 'Alfa', endereco: 'Rua F, 1', tipo: 'Instalacao', tecnico: 'Paulo',
        data: '2026-01-01', hora: '08:00', status: 'concluida', qtdSplits: 1,
        equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }], checklist: []
      }];
      manutencoes = [];
      const antes = { cl: JSON.stringify(clientes), os: JSON.stringify(osList) };
      nav('clientes');
      openModalCliente('Alfa');
      document.getElementById('cNome').value = c.digitar;
      criarCliente('Alfa');
      const ov = document.getElementById('curOverlay');
      return {
        nomes: clientes.map(x => x.nome),
        nadaMudou: JSON.stringify(clientes) === antes.cl && JSON.stringify(osList) === antes.os,
        modalAberto: !!(ov && ov.classList.contains('open') && document.getElementById('cNome')),
        toast: (document.getElementById('toast') || {}).textContent || ''
      };
    }, f);
    console.log('  [' + f.rotulo + '] clientes:', JSON.stringify(r.nomes), '| aviso:', JSON.stringify(r.toast));
    if (f.aceita) {
      assert(r.nomes.includes(f.digitar), f.rotulo + ' -> ACEITA (nome legitimo continua passando)');
      assert(!r.modalAberto, f.rotulo + ' -> o modal fechou (gravou de verdade)');
    } else {
      assert(r.nadaMudou, f.rotulo + ' -> RECUSA e nao mexe em NADA');
      assert(r.modalAberto, f.rotulo + ' -> o modal fica aberto para o gestor corrigir');
      assert(f.vazio ? /informe o nome/i.test(r.toast) : /j.*existe/i.test(r.toast),
        f.rotulo + ' -> avisa por que recusou');
    }
  }
  /* O nome é GUARDADO como o gestor digitou: a normalização é da comparação, não do dado. */
  const r14 = await pg.evaluate(() => {
    clientes = []; osList = []; manutencoes = [];
    nav('clientes');
    openModalCliente();
    document.getElementById('cNome').value = 'Casa  dos  Dois  Espacos';
    criarCliente();
    return { nomes: clientes.map(c => c.nome) };
  });
  console.log('  nome guardado como digitado:', JSON.stringify(r14.nomes));
  assert(r14.nomes[0] === 'Casa  dos  Dois  Espacos',
    'sem colisao, o nome e GUARDADO como o gestor digitou (a normalizacao e so da comparacao)');

  /* ══════════════════════════════════════════════════════════════════════════════════════
     CHECKs 15 a 31 (G2): as 16 garantias que a camada de mutacao achou SEM rede.
     Nenhuma delas e defeito hoje -- o codigo esta certo. Cada uma existe porque uma mutacao
     que a desfazia passou pela suite inteira sem reprovar: seriam regressoes invisiveis.
     Cada check abaixo diz, no comentario, A MUTACAO contra a qual ele foi provado.
     ══════════════════════════════════════════════════════════════════════════════════════ */

  /* ══════════ CHECK 15 (G2): o arraste NAO alcanca o cliente do lado ══════════ */
  /* Mutacao que provou a lacuna: em _aplicarCliente, trocar
       if(o.cliente===nome||alvos.indexOf(o.cliente)<0)return;
     por  if(o.cliente===nome)return;
     Renomear "Alfa" passava a mover TAMBEM as 2 OS de "Beta SA". Nenhum check tinha um segundo
     cliente COM HISTORICO no instante do rename -- entao ninguem via. */
  console.log('\n=== CHECK 15 (G2): renomear um cliente deixa o historico do OUTRO byte a byte igual ===');
  await pg.waitForTimeout(320);
  const r15 = await pg.evaluate((d) => {
    clientes = [{ nome: 'Alfa Refrigeracao', endereco: 'Rua A, 1', contato: '111' },
                { nome: 'Beta SA', endereco: 'Rua B, 2', contato: '222' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    const antesBeta = { os: JSON.stringify(osList.filter(o => o.cliente === 'Beta SA')),
                        mn: JSON.stringify(manutencoes.filter(m => m.cliente === 'Beta SA')) };
    nav('clientes');
    openModalCliente('Alfa Refrigeracao');
    document.getElementById('cNome').value = 'Alfa Refrigeração Ltda';
    criarCliente('Alfa Refrigeracao');
    return {
      betaOsIgual: JSON.stringify(osList.filter(o => o.cliente === 'Beta SA')) === antesBeta.os,
      betaMnIgual: JSON.stringify(manutencoes.filter(m => m.cliente === 'Beta SA')) === antesBeta.mn,
      betaOs: osList.filter(o => o.cliente === 'Beta SA').length,
      betaMn: manutencoes.filter(m => m.cliente === 'Beta SA').length,
      alfaOs: osList.filter(o => o.cliente === 'Alfa Refrigeração Ltda').length,
      alfaMn: manutencoes.filter(m => m.cliente === 'Alfa Refrigeração Ltda').length,
      nomes: clientes.map(c => c.nome),
      registroBeta: clientes.find(c => c.nome === 'Beta SA') || null
    };
  }, { os: [osDe('g1', 'Alfa Refrigeracao', '2026-01-01'), osDe('g2', 'Alfa Refrigeracao', '2026-01-02'),
            osDe('g3', 'Beta SA', '2026-02-01'), osDe('g4', 'Beta SA', '2026-02-02')],
       mn: [manutDe('gm1', 'Alfa Refrigeracao', '2026-11-01'), manutDe('gm2', 'Beta SA', '2026-12-01')] });
  console.log('  Beta SA -> OS:', r15.betaOs, '| manut:', r15.betaMn, '| byte a byte igual:',
    r15.betaOsIgual && r15.betaMnIgual);
  console.log('  Alfa renomeada -> OS:', r15.alfaOs, '| manut:', r15.alfaMn,
    '| clientes:', JSON.stringify(r15.nomes));
  assert(r15.betaOsIgual, 'o historico de OS do OUTRO cliente ficou byte a byte igual');
  assert(r15.betaMnIgual, 'as manutencoes do OUTRO cliente ficaram byte a byte iguais');
  assert(r15.betaOs === 2 && r15.betaMn === 1, 'o outro cliente continua com as suas 2 OS e 1 manutencao');
  assert(!!r15.registroBeta && r15.registroBeta.nome === 'Beta SA',
    'o registro do outro cliente em clientes nao foi tocado');
  assert(r15.alfaOs === 2 && r15.alfaMn === 1,
    'CONTROLE: o historico do cliente RENOMEADO seguiu o nome novo (2 OS e 1 manutencao)');

  /* ══════════ CHECK 16 (G2): ASPAS DUPLAS no nome, no caminho da EDICAO ══════════ */
  /* Mutacao que provou a lacuna: em openModalCliente, trocar
       value="${escapeHtml(c.nome)}"  por  value="${c.nome}"  (no campo cNome).
     `Restaurante "Bom Sabor"` abria o campo com apenas `Restaurante ` e salvar SO O TELEFONE
     renomeava o cliente e arrastava as OS para o nome truncado. O CHECK 7 usa apostrofo, que
     nao quebra value="...": a aspa dupla e outro caractere e outro caminho. */
  console.log('\n=== CHECK 16 (G2): nome com ASPAS DUPLAS -- salvar so o contato nao renomeia nada ===');
  await pg.waitForTimeout(320);
  const NOME_AD = 'Restaurante "Bom Sabor"';
  const r16 = await pg.evaluate((d) => {
    clientes = [{ nome: d.nome, endereco: 'Rua Q, 1', contato: '111' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    const antes = { os: JSON.stringify(osList), mn: JSON.stringify(manutencoes) };
    const quebras = [];
    const onerr = (e) => quebras.push(String(e.message || e));
    window.addEventListener('error', onerr);
    nav('clientes');
    const card = [...document.querySelectorAll('#app .os-card')]
      .find(c => ((c.querySelector('.os-client') || {}).textContent || '') === d.nome);
    if (!card) { window.removeEventListener('error', onerr); return { achouCartao: false }; }
    const btn = [...card.querySelectorAll('button')].find(x => /editar/i.test(x.textContent || ''));
    if (btn) btn.click();
    const noCampo = (document.getElementById('cNome') || {}).value;
    const cc = document.getElementById('cContato');
    if (cc) cc.value = '222';                       // SO o contato muda
    const salvar = [...document.querySelectorAll('#curOverlay .modal-foot button')]
      .find(x => /salvar/i.test(x.textContent || ''));
    if (salvar) salvar.click();
    window.removeEventListener('error', onerr);
    nav('clientes');
    return {
      achouCartao: true, noCampo: noCampo, quebras: quebras,
      nomes: clientes.map(c => c.nome),
      contato: (clientes.find(c => c.nome === d.nome) || {}).contato,
      osIgual: JSON.stringify(osList) === antes.os,
      mnIgual: JSON.stringify(manutencoes) === antes.mn,
      osNoNome: osList.filter(o => o.cliente === d.nome).length,
      cartoes: [...document.querySelectorAll('#app .os-client')].map(x => x.textContent)
    };
  }, { nome: NOME_AD,
       os: [osDe('q1', NOME_AD, '2026-03-01'), osDe('q2', NOME_AD, '2026-03-02')],
       mn: [manutDe('qm1', NOME_AD, '2026-10-01')] });
  console.log('  nome no campo:', JSON.stringify(r16.noCampo), '| clientes:', JSON.stringify(r16.nomes));
  console.log('  cartoes:', JSON.stringify(r16.cartoes), '| erros no clique:',
    r16.quebras && r16.quebras.length ? r16.quebras : '(nenhum)');
  assert(r16.achouCartao, 'o cartao do cliente com aspas duplas aparece com o nome inteiro');
  assert(r16.noCampo === NOME_AD, 'o nome com ASPAS DUPLAS chega INTEIRO ao campo de edicao');
  assert(!r16.quebras.length, 'nenhum erro de JS no caminho das aspas duplas');
  assert(r16.nomes.length === 1 && r16.nomes[0] === NOME_AD,
    'salvar so o contato NAO renomeou o cliente');
  assert(r16.contato === '222', 'CONTROLE: o contato novo foi de fato gravado');
  assert(r16.osIgual && r16.mnIgual,
    'as 2 OS e a manutencao ficaram byte a byte iguais (nada foi arrastado)');
  assert(r16.osNoNome === 2, 'as 2 OS continuam ligadas ao nome com aspas duplas');
  assert(r16.cartoes.filter(n => n === NOME_AD).length === 1,
    'continua UM cartao, com o nome inteiro -- nenhum cartao com nome truncado');

  /* ══════════ CHECK 17 (G2): CONTATO com HTML aparece LITERAL (cartao e detalhe) ══════════ */
  /* Mutacao que provou a lacuna: em renderClientes, trocar ${escapeHtml(c.contato)} por
     ${c.contato}; e em openHistoricoCliente, o mesmo no 📞. Um contato
     `<img src=x onerror=...>` nascia como elemento <img> DE VERDADE no cartao e no detalhe --
     e `contato` e justamente o campo que esta entrega passou a exibir. */
  console.log('\n=== CHECK 17 (G2): contato com HTML aparece literal, e nenhum <img> nasce ===');
  await pg.waitForTimeout(320);
  const PAYLOAD = '<img src=x onerror=window.__xssContato=1>';
  const r17 = await pg.evaluate((d) => {
    window.__xssContato = 0;
    clientes = [{ nome: 'Casa Contato HTML', endereco: 'Rua X, 1', contato: '4700-0000' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = [];
    nav('clientes');
    const imgAntes = document.querySelectorAll('img').length;     // linha de base do MESMO ecra
    clientes = [{ nome: 'Casa Contato HTML', endereco: 'Rua X, 1', contato: d.payload }];
    nav('clientes');
    const imgDepois = document.querySelectorAll('img').length;
    const card = [...document.querySelectorAll('#app .os-card')][0];
    const cartao = { txt: card ? card.textContent.replace(/\s+/g, ' ') : '',
                     imgs: card ? card.querySelectorAll('img').length : -1 };
    openHistoricoCliente('Casa Contato HTML');
    const ov = document.getElementById('curOverlay');
    const detalhe = { txt: ov ? ov.textContent.replace(/\s+/g, ' ') : '',
                      imgs: ov ? ov.querySelectorAll('img').length : -1 };
    closeModal();
    return { imgAntes, imgDepois, cartao, detalhe, xss: window.__xssContato };
  }, { payload: PAYLOAD, os: [osDe('x1', 'Casa Contato HTML', '2026-04-01')] });
  console.log('  <img> na pagina antes/depois:', r17.imgAntes + '/' + r17.imgDepois,
    '| no cartao:', r17.cartao.imgs, '| no detalhe:', r17.detalhe.imgs);
  console.log('  cartao:', JSON.stringify(r17.cartao.txt.slice(0, 120)));
  assert(r17.cartao.imgs === 0, 'o contato com HTML nao criou nenhum <img> dentro do cartao');
  assert(r17.detalhe.imgs === 0, 'nem dentro do detalhe do cliente');
  assert(r17.imgDepois === r17.imgAntes,
    'document.querySelectorAll("img").length NAO cresceu ao exibir o contato');
  assert(r17.cartao.txt.indexOf(PAYLOAD) >= 0, 'no cartao, o contato aparece LITERAL, como texto');
  assert(r17.detalhe.txt.indexOf(PAYLOAD) >= 0, 'no detalhe, o contato aparece LITERAL, como texto');
  assert(!r17.xss, 'nenhum onerror de dentro do contato chegou a rodar');

  /* ══════════ CHECK 18 (G2): o NOME com HTML aparece literal no cartao ══════════ */
  /* Mutacao que provou a lacuna: em renderClientes, trocar
       <div class="os-client">${escapeHtml(c.nome)}</div>  por  ${c.nome}.
     Hoje a rede disso e a teste-apostrofo.js CHECK 4 -- suite VIZINHA. A suite do item passa a
     ter o caso proprio, para a garantia nao depender de outro arquivo continuar existindo. */
  console.log('\n=== CHECK 18 (G2): nome com HTML aparece literal no cartao (sem depender da suite vizinha) ===');
  await pg.waitForTimeout(320);
  const NOME_HTML = 'Oficina <img src=x onerror=window.__xssNome=1>';
  const r18 = await pg.evaluate((d) => {
    window.__xssNome = 0;
    clientes = [{ nome: d.nome, endereco: 'Rua H, 1', contato: '' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = [];
    nav('clientes');
    const card = [...document.querySelectorAll('#app .os-card')][0];
    const alvo = card ? card.querySelector('.os-client') : null;
    return {
      texto: alvo ? alvo.textContent : '(sem cartao)',
      imgs: card ? card.querySelectorAll('img').length : -1,
      xss: window.__xssNome
    };
  }, { nome: NOME_HTML, os: [osDe('h1', NOME_HTML, '2026-04-02')] });
  console.log('  nome no cartao:', JSON.stringify(r18.texto), '| <img> no cartao:', r18.imgs);
  assert(r18.texto === NOME_HTML, 'o nome com HTML aparece LITERAL no cartao, inteiro');
  assert(r18.imgs === 0, 'nenhum <img> nasceu do nome');
  assert(!r18.xss, 'nenhum onerror de dentro do nome chegou a rodar');

  /* ══════════ CHECK 19 (G2): memoria cheia NA FUSAO -- ou tudo, ou nada ══════════ */
  /* Mutacao que provou a lacuna: em _aplicarCliente, apagar
       desfaz.push(()=>{clientes.splice(idx,0,obj);});
     (o passo 2, das OUTRAS grafias). Com a cota estourada no meio, `clientes` PERDIA a entrada
     da outra grafia -- e o toast dizia "NADA foi alterado". O CHECK 13 so cobre o rename
     simples, onde esse desfaz nem e usado. */
  console.log('\n=== CHECK 19 (G2): memoria cheia NA FUSAO -- a outra grafia nao desaparece ===');
  await pg.waitForTimeout(320);
  const r19 = await pg.evaluate((d) => {
    clientes = [{ nome: 'Gama Ar', endereco: 'Rua G, 1', contato: '' },
                { nome: 'GAMA AR', endereco: 'Rua G2, 2', contato: '9999' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    saveClientes(); saveOS(); saveManut();                 // linha de base NO DISCO
    const base = { mappo_clientes: localStorage.getItem('mappo_clientes'),
                   mappo_os: localStorage.getItem('mappo_os'),
                   mappo_manut: localStorage.getItem('mappo_manut') };
    const antes = { cl: JSON.stringify(clientes), os: JSON.stringify(osList),
                    mn: JSON.stringify(manutencoes) };
    const t = document.getElementById('toast'); if (t) t.textContent = '';
    /* a memoria enche SO para mappo_os -- o patch fica POR CIMA do interceptor do app */
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === 'mappo_os') { const e = new Error('cota estourada (teste)'); e.name = 'QuotaExceededError'; throw e; }
      return orig.apply(this, arguments);
    };
    const perguntas = [];
    const confOrig = window.confirm;
    window.confirm = (m) => { perguntas.push(String(m)); return true; };   // o gestor ACEITA fundir
    let lancou = '';
    nav('clientes');
    openModalCliente('Gama Ar');
    document.getElementById('cNome').value = 'GAMA AR';
    try { criarCliente('Gama Ar'); } catch (e) { lancou = (e.name || 'Erro') + ': ' + e.message; }
    Storage.prototype.setItem = orig;
    window.confirm = confOrig;
    const r = {
      perguntou: perguntas.length, lancou: lancou,
      toast: (document.getElementById('toast') || {}).textContent || '',
      memIgual: JSON.stringify(clientes) === antes.cl && JSON.stringify(osList) === antes.os
                && JSON.stringify(manutencoes) === antes.mn,
      nomes: clientes.map(c => c.nome),
      discoIgual: ['mappo_clientes', 'mappo_os', 'mappo_manut']
                    .every(k => localStorage.getItem(k) === base[k]),
      discoNomes: JSON.parse(localStorage.getItem('mappo_clientes') || '[]').map(c => c.nome)
    };
    _fecharAvisoMemoria();
    return r;
  }, { os: [osDe('u1', 'Gama Ar', '2026-01-01'), osDe('u2', 'Gama Ar', '2026-01-02'),
            osDe('u3', 'GAMA AR', '2026-02-01')],
       mn: [manutDe('um1', 'Gama Ar', '2026-11-01')] });
  console.log('  perguntou:', r19.perguntou, '| memoria igual:', r19.memIgual, '| disco igual:', r19.discoIgual);
  console.log('  clientes em memoria:', JSON.stringify(r19.nomes), '| no disco:', JSON.stringify(r19.discoNomes));
  console.log('  aviso:', JSON.stringify(r19.toast));
  assert(r19.perguntou === 1, 'CONTROLE: a fusao foi de fato tentada (perguntou uma vez)');
  assert(r19.nomes.length === 2 && r19.nomes.indexOf('Gama Ar') >= 0 && r19.nomes.indexOf('GAMA AR') >= 0,
    'a fusao que falhou devolveu as DUAS grafias a clientes -- nenhuma desapareceu');
  assert(r19.memIgual, 'memoria cheia na fusao: NADA mudou em memoria');
  assert(r19.discoIgual, 'memoria cheia na fusao: NADA mudou no disco (as tres chaves iguais)');
  assert(r19.discoNomes.length === 2, 'no disco tambem continuam os dois registros');
  assert(/nada foi alterado/i.test(r19.toast),
    'o aviso diz que NADA foi alterado -- e agora isso e verdade tambem na fusao');
  assert(!r19.lancou, 'o erro nao sobe cru para quem clicou em salvar');

  /* ══════════ CHECK 20 (G2): memoria cheia AO CADASTRAR -- nenhum cliente fantasma ══════════ */
  /* Mutacao que provou a lacuna: em criarCliente, no caminho de criar, apagar
       const i=clientes.indexOf(novo);if(i>=0)clientes.splice(i,1);
     do catch. O cliente ficava em MEMORIA (aparecia na tela, nao estava no disco) enquanto o
     toast dizia "o cliente NAO foi cadastrado" -- a tela mentindo para o gestor. */
  console.log('\n=== CHECK 20 (G2): memoria cheia ao CADASTRAR -- nada fica em memoria ===');
  await pg.waitForTimeout(320);
  const r20 = await pg.evaluate(() => {
    clientes = []; osList = []; manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    const base = localStorage.getItem('mappo_clientes');
    const t = document.getElementById('toast'); if (t) t.textContent = '';
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === 'mappo_clientes') { const e = new Error('cota estourada (teste)'); e.name = 'QuotaExceededError'; throw e; }
      return orig.apply(this, arguments);
    };
    let lancou = '';
    nav('clientes');
    openModalCliente();
    document.getElementById('cNome').value = 'Cliente Fantasma';
    document.getElementById('cContato').value = '333';
    try { criarCliente(); } catch (e) { lancou = (e.name || 'Erro') + ': ' + e.message; }
    Storage.prototype.setItem = orig;
    const r = {
      lancou: lancou, nomes: clientes.map(c => c.nome),
      discoIgual: localStorage.getItem('mappo_clientes') === base,
      discoNomes: JSON.parse(localStorage.getItem('mappo_clientes') || '[]').map(c => c.nome),
      toast: (document.getElementById('toast') || {}).textContent || ''
    };
    _fecharAvisoMemoria();
    /* CONTROLE POSITIVO: com o setItem funcionando, o MESMO cadastro grava. Sem isto o check
       passaria por qualquer motivo que impedisse o cadastro, inclusive um defeito novo. */
    nav('clientes');
    openModalCliente();
    document.getElementById('cNome').value = 'Cliente Fantasma';
    document.getElementById('cContato').value = '333';
    criarCliente();
    r.ctrlNomes = clientes.map(c => c.nome);
    r.ctrlDisco = JSON.parse(localStorage.getItem('mappo_clientes') || '[]').map(c => c.nome);
    return r;
  });
  console.log('  memoria:', JSON.stringify(r20.nomes), '| disco:', JSON.stringify(r20.discoNomes),
    '| aviso:', JSON.stringify(r20.toast));
  console.log('  [controle] com setItem normal -> memoria:', JSON.stringify(r20.ctrlNomes),
    '| disco:', JSON.stringify(r20.ctrlDisco));
  assert(r20.nomes.length === 0,
    'cota estourada ao cadastrar: NENHUM cliente fantasma ficou em memoria');
  assert(r20.discoIgual && r20.discoNomes.length === 0, 'e nada ficou no disco');
  assert(/n.o foi cadastrado/i.test(r20.toast), 'o aviso diz que o cliente NAO foi cadastrado');
  assert(/mem.ria do aparelho cheia/i.test(r20.toast), 'e diz que o motivo foi a memoria cheia');
  assert(!r20.lancou, 'o erro nao sobe cru para quem clicou em salvar');
  assert(r20.ctrlNomes.length === 1 && r20.ctrlDisco.length === 1,
    'CONTROLE: com o setItem funcionando, o mesmo cadastro grava (memoria e disco)');

  /* ══════════ CHECK 21 (G2): falha que NAO e de cota tambem avisa ══════════ */
  /* Mutacao que provou a lacuna: em _avisarFalhaCliente, trocar
       }else toast('Não foi possível salvar — '+oque,'warn');   por   }else{}
     A suite inteira passava: nenhum check exercitava falha que nao fosse QuotaExceededError, e
     o gestor ficava sem aviso nenhum num TypeError. */
  console.log('\n=== CHECK 21 (G2): falha generica (TypeError) tambem avisa, e sem modal de memoria ===');
  await pg.waitForTimeout(320);
  const r21 = await pg.evaluate(() => {
    clientes = []; osList = []; manutencoes = [];
    saveClientes();
    const t = document.getElementById('toast'); if (t) t.textContent = '';
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === 'mappo_clientes') throw new TypeError('falha generica (teste)');
      return orig.apply(this, arguments);
    };
    let lancou = '';
    nav('clientes');
    openModalCliente();
    document.getElementById('cNome').value = 'Cliente Generico';
    try { criarCliente(); } catch (e) { lancou = (e.name || 'Erro') + ': ' + e.message; }
    Storage.prototype.setItem = orig;
    const ov = document.getElementById('curOverlay');
    return {
      lancou: lancou, nomes: clientes.map(c => c.nome),
      toast: (document.getElementById('toast') || {}).textContent || '',
      avisoMemoria: _avisoMemoriaAberto,
      modalTxt: ov ? ov.textContent.replace(/\s+/g, ' ') : ''
    };
  });
  console.log('  aviso:', JSON.stringify(r21.toast), '| modal de memoria aberto:', r21.avisoMemoria);
  assert(/n.o foi poss.vel salvar/i.test(r21.toast),
    'falha que nao e de cota AVISA na tela (nao fica em silencio)');
  assert(/n.o foi cadastrado/i.test(r21.toast), 'e diz O QUE ficou de fora');
  assert(!/mem.ria do aparelho cheia/i.test(r21.toast),
    'e NAO culpa a memoria do aparelho, que nao e o caso');
  assert(r21.avisoMemoria === false && !/Mem.ria do aparelho cheia/.test(r21.modalTxt),
    'CONTROLE: falha generica nao abre o modal bloqueante de memoria cheia');
  assert(r21.nomes.length === 0, 'e o cliente nao fica em memoria');
  assert(!r21.lancou, 'o erro nao sobe cru para quem clicou em salvar');

  /* ══════════ CHECK 22 (G2): na cota, o modal BLOQUEANTE abre ══════════ */
  /* Mutacao que provou a lacuna: em _avisarFalhaCliente, apagar a linha
       _avisarMemoriaCheia();
     Sobrava so o toast, que some em 3,2 s -- e memoria cheia e o incidente em que o aviso
     PRECISA esperar o gestor. Nenhum check afirmava o modal, so o toast.
     (Neste caminho o modal vem de _avisarFalhaCliente mesmo: o patch do teste fica POR CIMA do
     interceptor do app, entao o erro nunca passa pelo _avisarMemoriaCheia do interceptor.) */
  console.log('\n=== CHECK 22 (G2): cota ao cadastrar abre o modal bloqueante de memoria cheia ===');
  await pg.waitForTimeout(320);
  const r22 = await pg.evaluate(() => {
    clientes = []; osList = []; manutencoes = [];
    saveClientes();
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === 'mappo_clientes') { const e = new Error('cota estourada (teste)'); e.name = 'QuotaExceededError'; throw e; }
      return orig.apply(this, arguments);
    };
    nav('clientes');
    openModalCliente();
    document.getElementById('cNome').value = 'Cliente Cota';
    try { criarCliente(); } catch (e) { /* medido no CHECK 20 */ }
    Storage.prototype.setItem = orig;
    const ov = document.getElementById('curOverlay');
    const r = {
      aberto: !!(ov && ov.classList.contains('open')),
      txt: ov ? ov.textContent.replace(/\s+/g, ' ') : '',
      travado: _avisoMemoriaAberto,
      temBotao: !!(ov && [...ov.querySelectorAll('button')].some(b => /entendi/i.test(b.textContent || '')))
    };
    _fecharAvisoMemoria();
    r.fechouDepois = _avisoMemoriaAberto;
    return r;
  });
  console.log('  modal aberto:', r22.aberto, '| trava ligada:', r22.travado,
    '| botao Entendi:', r22.temBotao);
  console.log('  texto:', JSON.stringify(r22.txt.slice(0, 90)));
  assert(r22.aberto, 'o modal fica ABERTO na tela (um toast sumiria em 3,2 s)');
  assert(/Mem.ria do aparelho cheia/.test(r22.txt), 'e e o aviso de memoria do aparelho cheia');
  assert(/n.o foi salva/.test(r22.txt), 'o modal diz que a ultima alteracao NAO foi salva');
  assert(r22.temBotao, 'e so sai por acao do gestor (botao Entendi)');
  assert(r22.travado === true && r22.fechouDepois === false,
    'CONTROLE: a trava de reabertura liga ao abrir e desliga ao fechar');

  /* ══════════ CHECK 23 (G2): a guarda tambem olha as MANUTENCOES ══════════ */
  /* Mutacao que provou a lacuna: em _clienteNomeEmUso, trocar
       return emManut?emManut.cliente:'';   por   return '';
     Cliente que existe SO em mappo_manut deixava de ser visto pela guarda da edicao. O CHECK 3
     cobre clientes e osList; manutencoes nao tinha caso nenhum. */
  console.log('\n=== CHECK 23 (G2): renomear para nome que existe SO nas manutencoes recusa ===');
  await pg.waitForTimeout(320);
  const r23 = await pg.evaluate((d) => {
    clientes = [{ nome: 'Alfa Guarda', endereco: 'Rua AG, 1', contato: '' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    const antes = { cl: JSON.stringify(clientes), os: JSON.stringify(osList),
                    mn: JSON.stringify(manutencoes) };
    const t = document.getElementById('toast'); if (t) t.textContent = '';
    const perguntas = [];
    const confOrig = window.confirm;
    window.confirm = (m) => { perguntas.push(String(m)); return true; };
    nav('clientes');
    openModalCliente('Alfa Guarda');
    document.getElementById('cNome').value = 'delta industria';   // existe so em manutencoes
    criarCliente('Alfa Guarda');
    window.confirm = confOrig;
    const ov = document.getElementById('curOverlay');
    return {
      perguntou: perguntas.length,
      nadaMudou: JSON.stringify(clientes) === antes.cl && JSON.stringify(osList) === antes.os
                 && JSON.stringify(manutencoes) === antes.mn,
      nomes: clientes.map(c => c.nome),
      modalAberto: !!(ov && ov.classList.contains('open') && document.getElementById('cNome')),
      toast: (document.getElementById('toast') || {}).textContent || ''
    };
  }, { os: [osDe('v1', 'Alfa Guarda', '2026-01-01')],
       mn: [manutDe('vm1', 'Delta Industria', '2026-12-01')] });
  console.log('  clientes:', JSON.stringify(r23.nomes), '| perguntou:', r23.perguntou,
    '| aviso:', JSON.stringify(r23.toast));
  assert(r23.nadaMudou, 'nome que existe so nas MANUTENCOES e visto pela guarda: nada mudou');
  assert(r23.modalAberto, 'o modal fica aberto para o gestor corrigir');
  assert(/existe cliente com esse nome: Delta Industria/.test(r23.toast),
    'e o aviso nomeia a grafia que esta nas manutencoes');
  assert(r23.perguntou === 0,
    'a guarda recusou ANTES da pergunta de fusao (nao houve fusao silenciosa)');

  /* ══════════ CHECK 24 (G2): o endereco que SO a manutencao conhece preenche o modal ══════════ */
  /* Mutacao que provou a lacuna: em _clienteUniao, apagar  ||(mn&&mn.endereco)  do endereco.
     Cliente que so tem manutencao abria o modal com o endereco VAZIO, e salvar gravava vazio --
     perdendo o unico endereco que o app conhecia dele. */
  console.log('\n=== CHECK 24 (G2): cliente que existe so em manutencoes abre com o endereco dela ===');
  await pg.waitForTimeout(320);
  const r24 = await pg.evaluate((d) => {
    clientes = []; osList = [];
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    nav('clientes');
    openModalCliente('Hotel Central');
    const soManut = { nome: (document.getElementById('cNome') || {}).value,
                      endereco: (document.getElementById('cEndereco') || {}).value };
    closeModal();
    /* CONTROLE POSITIVO: com registro proprio, o endereco do REGISTRO vence o da manutencao --
       senao este check estaria medindo um campo que sempre traz a mesma coisa. */
    clientes = [{ nome: 'Hotel Central', endereco: 'Rua do Registro, 9', contato: '' }];
    openModalCliente('Hotel Central');
    const comRegistro = { endereco: (document.getElementById('cEndereco') || {}).value };
    closeModal();
    return { soManut, comRegistro };
  }, { mn: [manutDe('wm1', 'Hotel Central', '2026-12-01')] });
  console.log('  so manutencao ->', JSON.stringify(r24.soManut),
    '| com registro ->', JSON.stringify(r24.comRegistro));
  assert(r24.soManut.nome === 'Hotel Central', 'o modal abre preenchido pelo nome');
  assert(r24.soManut.endereco === 'Rua wm1, 10',
    'o endereco vem da MANUTENCAO quando ela e a unica fonte que o conhece');
  assert(r24.comRegistro.endereco === 'Rua do Registro, 9',
    'CONTROLE: havendo registro proprio, o endereco dele vence o da manutencao');

  /* ══════════ CHECK 25 (G2): a fusao herda o ENDERECO da outra grafia ══════════ */
  /* Mutacao que provou a lacuna: em _aplicarCliente, passo 2, apagar
       if(!sobrev.endereco&&x.endereco){...}
     O CHECK 10 afirma a heranca do CONTATO; a do endereco nao tinha caso. Ausencia de um lado
     nunca apaga o que existe do outro -- e era justamente o que a mutacao fazia. */
  console.log('\n=== CHECK 25 (G2): fundindo, o endereco que so a outra grafia tinha sobrevive ===');
  await pg.waitForTimeout(320);
  const r25 = await pg.evaluate((d) => {
    const montar = () => {
      clientes = [{ nome: 'Beta Ar', endereco: '', contato: '' },
                  { nome: 'BETA AR', endereco: 'Rua Herdada, 5', contato: '' }];
      osList = JSON.parse(JSON.stringify(d.os));
      manutencoes = [];
      nav('clientes');
    };
    const perguntas = [];
    const confOrig = window.confirm;
    window.confirm = (m) => { perguntas.push(String(m)); return true; };
    montar();
    openModalCliente('Beta Ar');
    document.getElementById('cEndereco').value = '';            // o sobrevivente fica SEM endereco
    document.getElementById('cNome').value = 'BETA AR';
    criarCliente('Beta Ar');
    const herdou = { reg: clientes.find(c => c.nome === 'BETA AR') || null, qtd: clientes.length,
                     os: osList.filter(o => o.cliente === 'BETA AR').length };
    /* CONTROLE POSITIVO: quando o sobrevivente JA tem endereco, o da outra grafia NAO o
       sobrescreve -- a heranca preenche lacuna, nao substitui. */
    montar();
    openModalCliente('Beta Ar');
    document.getElementById('cEndereco').value = 'Rua Digitada, 1';
    document.getElementById('cNome').value = 'BETA AR';
    criarCliente('Beta Ar');
    const naoSobrescreve = { reg: clientes.find(c => c.nome === 'BETA AR') || null };
    window.confirm = confOrig;
    return { perguntou: perguntas.length, herdou, naoSobrescreve };
  }, { os: [osDe('z1', 'Beta Ar', '2026-01-01'), osDe('z2', 'BETA AR', '2026-02-01')] });
  console.log('  sobrevivente sem endereco ->', JSON.stringify(r25.herdou.reg));
  console.log('  [controle] sobrevivente com endereco ->', JSON.stringify(r25.naoSobrescreve.reg));
  assert(r25.perguntou === 2, 'CONTROLE: as duas fusoes foram de fato perguntadas');
  assert(!!r25.herdou.reg && r25.herdou.reg.endereco === 'Rua Herdada, 5',
    'o endereco que SO a outra grafia tinha sobreviveu a fusao');
  assert(r25.herdou.qtd === 1 && r25.herdou.os === 2,
    'e a fusao aconteceu normalmente (um registro, as 2 OS juntas)');
  assert(!!r25.naoSobrescreve.reg && r25.naoSobrescreve.reg.endereco === 'Rua Digitada, 1',
    'CONTROLE: endereco digitado NAO e sobrescrito pelo da outra grafia');

  /* ══════════ CHECK 26 (G2): offline SEM link enviado nao fala de link ══════════ */
  /* Mutacao que provou a lacuna: em _aplicarCliente, trocar
       if(o.pubToken)comLinkPublico++;   por   comLinkPublico++;
     O CHECK 8b afirma a frase QUANDO existe link enviado. Sem este caso, a mutacao fazia o app
     dizer "os links ja enviados se atualizam..." a um gestor que nunca enviou link nenhum --
     frase falsa na tela, do tipo que mandou o proprietario cacar problema inexistente. */
  console.log('\n=== CHECK 26 (G2): offline e sem link enviado, o app NAO fala de link ===');
  await pg.waitForTimeout(320);
  const r26 = await pg.evaluate((d) => {
    clientes = [{ nome: 'Escola Sem Link', endereco: 'Rua SL, 1', contato: '' }];
    osList = JSON.parse(JSON.stringify(d.os));          // NENHUMA OS tem pubToken
    manutencoes = [];
    fbReady = false;                                     // aparelho sem nuvem
    const t = document.getElementById('toast'); if (t) t.textContent = '';
    nav('clientes');
    openModalCliente('Escola Sem Link');
    document.getElementById('cNome').value = 'Escola Sem Link 2';
    criarCliente('Escola Sem Link');
    const r = { toast: (document.getElementById('toast') || {}).textContent || '',
                osNovo: osList.filter(o => o.cliente === 'Escola Sem Link 2').length,
                comToken: osList.filter(o => o.pubToken).length };
    fbReady = true;
    return r;
  }, { os: [osDe('sl1', 'Escola Sem Link', '2026-06-05'), osDe('sl2', 'Escola Sem Link', '2026-06-06')] });
  console.log('  OS com token no cenario:', r26.comToken, '| aviso:', JSON.stringify(r26.toast));
  assert(r26.comToken === 0, 'CONTROLE: o cenario de fato nao tem nenhuma OS com link enviado');
  assert(r26.osNovo === 2, 'CONTROLE: o rename aconteceu (2 OS seguiram o nome novo)');
  assert(/renomead/i.test(r26.toast), 'CONTROLE: houve aviso de rename na tela');
  assert(!/link/i.test(r26.toast),
    'offline e sem link enviado, o aviso NAO fala de link nenhum');
  assert(!/pr.xima sincroniza/i.test(r26.toast),
    'nem manda esperar a proxima sincronizacao por causa de um link que nao existe');

  /* ══════════ CHECK 27 (G2): o NUMERO no aviso de rename e o que de fato mudou ══════════ */
  /* Mutacao que provou a lacuna: em criarCliente, trocar
       const n=r.qtdOs+r.qtdManut;   por   const n=r.qtdOs;
     O aviso passava a contar so as OS e esquecer as manutencoes -- numero errado na tela, do
     tipo que faz o gestor achar que metade do historico nao foi. Nenhum check lia o numero. */
  console.log('\n=== CHECK 27 (G2): o numero do aviso soma OS E manutencoes ===');
  await pg.waitForTimeout(320);
  const r27 = await pg.evaluate((d) => {
    const medir = (os, mn, de, para) => {
      clientes = [{ nome: de, endereco: 'Rua N, 1', contato: '' },
                  { nome: 'Vizinho Com OS', endereco: 'Rua V, 2', contato: '' }];
      osList = JSON.parse(JSON.stringify(os));
      manutencoes = JSON.parse(JSON.stringify(mn));
      const t = document.getElementById('toast'); if (t) t.textContent = '';
      nav('clientes');
      openModalCliente(de);
      document.getElementById('cNome').value = para;
      criarCliente(de);
      const txt = (document.getElementById('toast') || {}).textContent || '';
      return { txt: txt, num: (txt.match(/—\s*(\d+)\s*registro/) || [])[1] || null,
               movidos: osList.filter(o => o.cliente === para).length
                        + manutencoes.filter(m => m.cliente === para).length };
    };
    return { cinco: medir(d.os5, d.mn5, 'Posto Norte', 'Posto Norte Ltda'),
             dois: medir(d.os2, d.mn2, 'Posto Norte', 'Posto Norte Ltda') };
  }, {
    os5: [osDe('n1', 'Posto Norte', '2026-01-01'), osDe('n2', 'Posto Norte', '2026-01-02'),
          osDe('n3', 'Posto Norte', '2026-01-03'), osDe('n4', 'Vizinho Com OS', '2026-01-04'),
          osDe('n5', 'Vizinho Com OS', '2026-01-05')],
    mn5: [manutDe('nm1', 'Posto Norte', '2026-11-01'), manutDe('nm2', 'Posto Norte', '2026-11-02'),
          manutDe('nm3', 'Vizinho Com OS', '2026-11-03')],
    os2: [osDe('n6', 'Posto Norte', '2026-02-01'), osDe('n7', 'Vizinho Com OS', '2026-02-02')],
    mn2: [manutDe('nm4', 'Posto Norte', '2026-12-01')]
  });
  console.log('  3 OS + 2 manut ->', JSON.stringify(r27.cinco.txt), '| movidos:', r27.cinco.movidos);
  console.log('  1 OS + 1 manut ->', JSON.stringify(r27.dois.txt), '| movidos:', r27.dois.movidos);
  assert(r27.cinco.movidos === 5, 'CONTROLE: o rename de fato moveu 5 registros');
  assert(r27.cinco.num === '5',
    'o aviso diz 5 registros -- soma as 3 OS com as 2 manutencoes, nao so as OS');
  assert(/5 registros do hist.rico atualizados/.test(r27.cinco.txt),
    'e o plural concorda com o numero');
  assert(r27.dois.movidos === 2 && r27.dois.num === '2',
    'CONTROLE: com 1 OS e 1 manutencao o aviso diz 2 (o numero nao e fixo)');

  /* ══════════ CHECK 28 (G2): o cartao nao fica mostrando o nome velho ══════════ */
  /* Mutacao que provou a lacuna: em criarCliente, no caminho de edicao, apagar a linha
       renderView(currentView);
     A gravacao acontecia certa, mas a tela continuava com o nome ANTIGO ate o gestor navegar
     para outra aba e voltar -- e ele nao tem como saber se salvou. Todos os checks chamavam
     nav() de novo antes de ler a tela, e por isso nenhum via. */
  console.log('\n=== CHECK 28 (G2): salvar redesenha a tela -- sem nav(), o cartao ja mostra o nome novo ===');
  await pg.waitForTimeout(320);
  const r28 = await pg.evaluate((d) => {
    clientes = [{ nome: 'Mercado Antigo', endereco: 'Rua MA, 1', contato: '' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = [];
    nav('clientes');
    const antes = [...document.querySelectorAll('#app .os-client')].map(x => x.textContent);
    openModalCliente('Mercado Antigo');
    document.getElementById('cNome').value = 'Mercado Novo';
    criarCliente('Mercado Antigo');
    /* DE PROPOSITO sem nav() aqui: e exatamente o que o gestor ve depois de clicar em salvar. */
    return { antes: antes,
             depois: [...document.querySelectorAll('#app .os-client')].map(x => x.textContent),
             view: currentView };
  }, { os: [osDe('ma1', 'Mercado Antigo', '2026-03-01')] });
  console.log('  cartoes antes:', JSON.stringify(r28.antes), '| depois:', JSON.stringify(r28.depois));
  assert(r28.antes.indexOf('Mercado Antigo') >= 0, 'CONTROLE: antes de salvar o cartao tinha o nome velho');
  assert(r28.view === 'clientes', 'CONTROLE: a tela continua sendo a de Clientes');
  assert(r28.depois.indexOf('Mercado Novo') >= 0,
    'depois de salvar, SEM navegar, o cartao ja mostra o nome novo');
  assert(r28.depois.indexOf('Mercado Antigo') < 0, 'e o nome velho nao ficou na tela');

  /* ══════════ CHECK 29 (G2): sem renomear, nada de saveOS/saveManut nem republicacao ══════════ */
  /* Mutacao que provou a lacuna: em _aplicarCliente, trocar
       if(qtdOs)gravar('mappo_os',saveOS);        por  gravar('mappo_os',saveOS);
       if(qtdManut)gravar('mappo_manut',saveManut); por  gravar('mappo_manut',saveManut);
     O CHECK 6 mede que as OS ficam iguais, o que continua verdade com a mutacao -- gravar o
     MESMO conteudo nao muda byte nenhum. O que a mutacao custa e invisivel ali: `mappo_os` esta
     em PUB_KEYS, entao a gravacao inutil dispara _marcarAlteracaoLocal, fbPush e uma
     republicacao inteira de todos os links ativos, so por editar um telefone. */
  console.log('\n=== CHECK 29 (G2): editar so o endereco nao grava OS/manut nem agenda republicacao ===');
  await pg.waitForTimeout(320);
  const r29 = await pg.evaluate((d) => {
    clientes = [{ nome: 'Loja Telefone', endereco: 'Rua LT, 1', contato: '111' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const chaves = [];
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { chaves.push(k); return orig.apply(this, arguments); };
    let agendou = 0;
    const agOrig = agendarRepublicacao;
    agendarRepublicacao = function () { agendou++; };     // nao chama o original: nada de timer solto
    openModalCliente('Loja Telefone');
    document.getElementById('cEndereco').value = 'Avenida Outra, 900';
    document.getElementById('cContato').value = '222';
    criarCliente('Loja Telefone');
    const semRename = { chaves: chaves.slice(), agendou: agendou,
                        registro: clientes.find(c => c.nome === 'Loja Telefone') || null };
    /* CONTROLE POSITIVO: o MESMO caminho, agora RENOMEANDO, grava as duas chaves e agenda a
       republicacao. Sem isto o check acima passaria se saveOS simplesmente nunca funcionasse. */
    chaves.length = 0; agendou = 0;
    openModalCliente('Loja Telefone');
    document.getElementById('cNome').value = 'Loja Telefone Nova';
    criarCliente('Loja Telefone');
    const comRename = { chaves: chaves.slice(), agendou: agendou };
    Storage.prototype.setItem = orig;
    agendarRepublicacao = agOrig;
    clearTimeout(_pubTimer);
    return { semRename, comRename };
  }, { os: [osDe('lt1', 'Loja Telefone', '2026-04-01')],
       mn: [manutDe('ltm1', 'Loja Telefone', '2026-11-01')] });
  console.log('  sem renomear -> chaves gravadas:', JSON.stringify(r29.semRename.chaves),
    '| republicacoes agendadas:', r29.semRename.agendou);
  console.log('  [controle] renomeando -> chaves:', JSON.stringify(r29.comRename.chaves),
    '| republicacoes agendadas:', r29.comRename.agendou);
  assert(!!r29.semRename.registro && r29.semRename.registro.endereco === 'Avenida Outra, 900'
    && r29.semRename.registro.contato === '222', 'CONTROLE: o endereco e o contato novos gravaram');
  assert(r29.semRename.chaves.indexOf('mappo_clientes') >= 0,
    'CONTROLE: mappo_clientes foi de fato gravada (a medicao esta vendo as gravacoes)');
  assert(r29.semRename.chaves.indexOf('mappo_os') < 0,
    'editar so endereco/contato NAO grava mappo_os');
  assert(r29.semRename.chaves.indexOf('mappo_manut') < 0,
    'nem mappo_manut');
  assert(r29.semRename.agendou === 0,
    'e NENHUMA republicacao de link e agendada so por editar um telefone');
  assert(r29.comRename.chaves.indexOf('mappo_os') >= 0
    && r29.comRename.chaves.indexOf('mappo_manut') >= 0,
    'CONTROLE: renomeando, as duas chaves do historico sao gravadas');
  assert(r29.comRename.agendou >= 1,
    'CONTROLE: renomeando, a republicacao do link E agendada (e por isso que o salvo-conduto importa)');

  /* ══════════ CHECK 30 (G2): grafia chamada "__proto__" na FUSAO ══════════ */
  /* Mutacao que provou a lacuna: em _clienteGrafias, trocar  Object.create(null)  por  {}.
     `vistos['__proto__']=true` num objeto comum e IGNORADO pelo setter do prototipo, entao a
     grafia "__proto__" saia da lista: a fusao nao perguntava nada e as 2 OS daquela grafia
     ficavam ORFAS, fora do cartao e fora do arraste. O CHECK 0 cobre o mesmo cuidado em
     renderClientes; a funcao irma nao tinha caso. */
  console.log('\n=== CHECK 30 (G2): grafia "__proto__" entra na fusao, e nenhuma OS fica orfa ===');
  await pg.waitForTimeout(320);
  const r30 = await pg.evaluate((d) => {
    clientes = [{ nome: '__PROTO__', endereco: 'Rua PR, 1', contato: '' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    const perguntas = [];
    const confOrig = window.confirm;
    window.confirm = (m) => { perguntas.push(String(m)); return true; };
    nav('clientes');
    openModalCliente('__PROTO__');
    document.getElementById('cNome').value = '__Proto__';
    criarCliente('__PROTO__');
    window.confirm = confOrig;
    return {
      perguntas: perguntas,
      grafias: _clienteGrafias('__proto__'),
      osNoAlvo: osList.filter(o => o.cliente === '__Proto__').length,
      osOrfas: osList.filter(o => o.cliente !== '__Proto__').map(o => o.cliente),
      mnNoAlvo: manutencoes.filter(m => m.cliente === '__Proto__').length,
      nomes: clientes.map(c => c.nome)
    };
  }, { os: [osDe('pr1', '__proto__', '2026-01-01'), osDe('pr2', '__proto__', '2026-01-02'),
            osDe('pr3', '__PROTO__', '2026-02-01')],
       mn: [manutDe('prm1', '__proto__', '2026-11-01')] });
  console.log('  perguntou', r30.perguntas.length, 'vez(es) |', JSON.stringify((r30.perguntas[0] || '').replace(/\s+/g, ' ').slice(0, 160)));
  console.log('  OS no alvo:', r30.osNoAlvo, '| orfas:', JSON.stringify(r30.osOrfas),
    '| clientes:', JSON.stringify(r30.nomes));
  assert(r30.perguntas.length === 1,
    'a grafia "__proto__" entra na lista de grafias: a fusao PERGUNTA em vez de acontecer calada');
  assert(/"__proto__": 2 visitas e 1 manuten/.test(r30.perguntas[0] || ''),
    'e a pergunta diz o que vem da grafia "__proto__" (2 visitas e 1 manutencao)');
  assert(r30.osNoAlvo === 3 && r30.osOrfas.length === 0,
    'as 3 OS ficaram sob o nome novo -- nenhuma OS orfa');
  assert(r30.mnNoAlvo === 1, 'a manutencao da grafia "__proto__" tambem foi arrastada');
  assert(r30.nomes.length === 1 && r30.nomes[0] === '__Proto__',
    'sobrou UM registro em clientes, com o nome novo');

  /* ══════════ CHECK 31 (G2): na EDICAO o nome tambem e guardado como digitado ══════════ */
  /* Mutacao que provou a lacuna: em _aplicarCliente, trocar
       reg.nome=nome;reg.endereco=endereco;reg.contato=contato;
     por reg.nome=_normNome(nome);...
     O ultimo check do CHECK 14 cobre o caminho de CRIAR; o de editar nao tinha caso. Normalizar
     na gravacao poe o registro numa grafia e o historico em outra -- e renderClientes agrupa
     por nome EXATO, entao nasceriam dois cartoes do mesmo cliente. */
  console.log('\n=== CHECK 31 (G2): editando, o nome e guardado como o gestor digitou ===');
  await pg.waitForTimeout(320);
  const DIGITADO = 'Casa  dos  TRES  Espacos';
  const r31 = await pg.evaluate((d) => {
    clientes = [{ nome: 'Casa Simples', endereco: 'Rua CS, 1', contato: '' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    nav('clientes');
    openModalCliente('Casa Simples');
    document.getElementById('cNome').value = d.digitado;
    criarCliente('Casa Simples');
    nav('clientes');
    return {
      nomes: clientes.map(c => c.nome),
      os: osList.map(o => o.cliente),
      mn: manutencoes.map(m => m.cliente),
      discoNomes: JSON.parse(localStorage.getItem('mappo_clientes') || '[]').map(c => c.nome),
      cartoes: [...document.querySelectorAll('#app .os-client')].map(x => x.textContent)
    };
  }, { digitado: DIGITADO,
       os: [osDe('cs1', 'Casa Simples', '2026-05-01')],
       mn: [manutDe('csm1', 'Casa Simples', '2026-11-01')] });
  console.log('  registro:', JSON.stringify(r31.nomes), '| no disco:', JSON.stringify(r31.discoNomes));
  console.log('  historico:', JSON.stringify(r31.os), JSON.stringify(r31.mn),
    '| cartoes:', JSON.stringify(r31.cartoes));
  assert(r31.nomes.length === 1 && r31.nomes[0] === DIGITADO,
    'editando, o registro guarda o nome EXATAMENTE como foi digitado (espaco duplo e caixa)');
  assert(r31.discoNomes.length === 1 && r31.discoNomes[0] === DIGITADO,
    'e no disco tambem, nao so em memoria');
  assert(r31.os[0] === DIGITADO && r31.mn[0] === DIGITADO,
    'a OS e a manutencao foram arrastadas para a MESMA grafia digitada');
  assert(r31.cartoes.filter(n => n === DIGITADO).length === 1 && r31.cartoes.length === 1,
    'e por isso continua UM cartao so -- registro e historico na mesma grafia');

  /* ══════════ CHECK 32 (V6): GEOMETRIA EM TELA DE CELULAR -- V1 a V5 ══════════ */
  /* Até 12/10/2026 esta suíte só rodava no viewport padrão do Playwright (1280x720, desktop):
     zero viewport, zero devices[...], zero getBoundingClientRect em 1.770 linhas. Nenhum dos cinco
     defeitos visuais corrigidos em 12/10/2026 podia ser VISTO pela rede -- é a mesma cegueira que
     deixou o botão de mapa nascer atrás do rodapé grudado na entrega anterior. O bloco abaixo abre
     o PRÓPRIO contexto, de celular, e não troca o viewport dos checks acima, que estão provados em
     desktop.
     As quatro armadilhas de medição desta tela, todas pagas em medição real:
       1. #loginScreen tem transition:visibility .5s -- getComputedStyle já diz "hidden" no começo
          da transição e o elemento continua capturando elementFromPoint. Espera-se o que importa
          (o ponto medido chegar DENTRO do #app), com controle positivo: antes de entrarApp o mesmo
          ponto tem de cair no #splashScreen, que é quem está na frente no carregamento.
       2. #tourRoot é overlay próprio e fica na frente de tudo por desenho: limpar antes.
       3. "modal aberto" é #curOverlay com a classe `open`: closeModal() tira a classe na hora e só
          limpa o #modalRoot 200 ms depois.
       4. startNotifChecker recarrega osList e manutencoes do localStorage a cada 5 s, e a varredura
          de rolagem demora mais que um piscar -- o cenário é GRAVADO, não só posto em memória,
          senão a recarga apaga os 10 clientes no meio da medição.
     O que este bloco NÃO afirma, de propósito: o estouro horizontal do CARTÃO com texto sem
     espaços (medido idêntico em e910054, é anterior e vive em .os-addr, classe global) e o botão de
     cartão que cai na faixa da barra inferior no meio da rolagem (comportamento normal de barra
     fixa, igual para qualquer cartão do app). Por isso o hit-test só mede pontos ACIMA da .navbar
     -- e CONTA quantos mediu, senão um filtro que excluísse tudo passaria calado. */
  console.log('\n=== CHECK 32 (V6): geometria do cliente em quatro tamanhos de celular ===');
  const BASE_URL = 'http://localhost:' + srv.address().port + '/';
  const TELAS = [[390, 844], [375, 667], [360, 640], [320, 568]];
  const LONGO = 'A'.repeat(200);
  const errosM = [];
  for (const [W, H] of TELAS) {
    const T = W + 'x' + H;
    const ctxM = await b.newContext({ viewport: { width: W, height: H }, isMobile: true,
                                      hasTouch: true, deviceScaleFactor: 2 });
    const pgM = await ctxM.newPage();
    pgM.on('pageerror', e => errosM.push(T + ': ' + e.message));
    await pgM.goto(BASE_URL, { waitUntil: 'load' });
    await pgM.waitForTimeout(400);
    console.log('\n  ----- ' + T + ' -----');

    /* armadilha 1 -- CONTROLE POSITIVO antes de qualquer hit-test */
    const antes = await pgM.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      const sp = document.getElementById('splashScreen'), ap = document.getElementById('app');
      return { noSplash: !!(el && sp && sp.contains(el)), noApp: !!(el && ap && ap.contains(el)) };
    });
    assert(antes.noSplash && !antes.noApp,
      'CONTROLE V6 ' + T + ': antes de entrarApp o meio da tela cai no #splashScreen, nao no #app');
    await pgM.evaluate(() => {
      session = { perfil: 'gestor', nome: 'Paulo', uid: 'u1', role: 'Gestor', workspaceId: 'ws' };
      _gravarTourVisto(); entrarApp(); fbReady = true; WORKSPACE = 'ws';
      _avisouSessaoExpirada = true;
      const s = document.getElementById('splashScreen'); if (s) s.remove();
      const t = document.getElementById('tourRoot'); if (t) t.innerHTML = '';   // armadilha 2
    });
    await pgM.waitForFunction(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      const lg = document.getElementById('loginScreen'), ap = document.getElementById('app');
      return !!el && !!ap && ap.contains(el) && !(lg && lg.contains(el));
    }, null, { timeout: 5000 });
    console.log('  ok - o app esta de fato na frente em ' + T);

    /* ---- V1 + V2: o botao "Editar cliente" do cartao, com 10 clientes e rolagem ---- */
    await pgM.evaluate(() => {
      clientes = []; osList = []; manutencoes = [];
      for (let i = 1; i <= 10; i++) {
        clientes.push({ nome: 'Cliente Numero ' + i, contato: '(49) 9000-000' + i,
                        endereco: 'Rua das Flores, ' + (i * 10) + ' - Centro' });
        osList.push({ id: 'vg' + i, cliente: 'Cliente Numero ' + i, tipo: 'Instalacao',
          endereco: 'Rua das Flores, ' + (i * 10), tecnico: 'Paulo', data: '2026-05-0' + (i % 9 + 1),
          hora: '08:00', status: 'concluida', qtdSplits: 1, checklist: [],
          equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }] });
      }
      localStorage.setItem('mappo_clientes', JSON.stringify(clientes));   // armadilha 4
      localStorage.setItem('mappo_os', JSON.stringify(osList));
      localStorage.setItem('mappo_manut', '[]');
      nav('clientes');
      const t = document.getElementById('tourRoot'); if (t) t.innerHTML = '';
    });
    await pgM.waitForTimeout(260);
    const g1 = await pgM.evaluate(() => {
      const fab = document.getElementById('fabNovo');
      const rf = fab.getBoundingClientRect();
      const noFab = document.elementFromPoint(Math.round(rf.left + rf.width / 2),
                                              Math.round(rf.top + rf.height / 2));
      const bts = [...document.querySelectorAll('#app .os-card button')];
      return {
        n: bts.length, fabDisplay: getComputedStyle(fab).display, fabLeft: Math.round(rf.left),
        instrumento: !!(noFab && fab.contains(noFab)),
        alturas: [...new Set(bts.map(x => Math.round(x.getBoundingClientRect().height)))],
        maiorRight: Math.max(...bts.map(x => Math.round(x.getBoundingClientRect().right))),
        textoCortado: bts.filter(x => x.scrollWidth > x.clientWidth).length
      };
    });
    console.log('  V1/V2 ' + T + ': ' + g1.n + ' botoes, alturas ' + JSON.stringify(g1.alturas)
      + ' | borda direita max ' + g1.maiorRight + ' | FAB em x=' + g1.fabLeft + ' (' + g1.fabDisplay + ')');
    assert(g1.n === 10, 'V6 ' + T + ': os 10 cartoes de cliente tem botao de editar');
    assert(g1.fabDisplay === 'flex',
      'CONTROLE V6 ' + T + ': o FAB "Nova OS" esta de fato na tela (no desktop e display:none, e o caso seria vazio)');
    assert(g1.instrumento,
      'CONTROLE V6 ' + T + ': mirar no meio do FAB devolve o proprio FAB -- o hit-test mede quem esta na frente');
    assert(g1.maiorRight <= g1.fabLeft,
      'V1 ' + T + ': nenhum botao de editar alcanca a coluna do FAB (borda direita ' + g1.maiorRight
      + ' <= ' + g1.fabLeft + ')');
    assert(g1.alturas.every(a => a >= 44),
      'V2 ' + T + ': todo botao de editar tem no minimo 44 px de altura (medido ' + JSON.stringify(g1.alturas) + ')');
    assert(g1.textoCortado === 0,
      'V2 ' + T + ': e o rotulo "Editar cliente" continua cabendo inteiro no botao mais estreito');

    /* Varredura de rolagem de 0 a 200 em passos de 10: a faixa do FAB tem 52 px de altura, então
       um passo de 10 px garante que o ponto medido de algum botão CAIA dentro dela -- e é isso que
       o controle `naFaixaDoFab` afirma. Sem esse controle, um filtro que excluísse justamente a
       linha perigosa deixaria o caso passar calado contando pontos inofensivos. */
    let medidos = 0, naFaixaDoFab = 0; const roubados = [];
    for (let sy = 0; sy <= 200; sy += 10) {
      const r = await pgM.evaluate((alvo) => {
        window.scrollTo(0, alvo);
        const barra = document.querySelector('.navbar');
        const limite = barra ? barra.getBoundingClientRect().top : window.innerHeight;
        const rfab = document.getElementById('fabNovo').getBoundingClientRect();
        const marca = (el) => el ? el.tagName.toLowerCase()
          + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '') : 'null';
        const out = [];
        [...document.querySelectorAll('#app .os-card button')].forEach((bt, i) => {
          const rc = bt.getBoundingClientRect();
          /* só pontos inteiramente visiveis E acima da barra inferior -- ver o cabecalho */
          if (rc.top < 0 || rc.bottom > limite) return;
          const y = Math.round(rc.top + rc.height / 2);
          const centro = document.elementFromPoint(Math.round(rc.left + rc.width / 2), y);
          const direita = document.elementFromPoint(Math.round(rc.right - 2), y);
          out.push({ i: i, naFaixa: y >= rfab.top && y <= rfab.bottom,
                     ok: !!(centro && bt.contains(centro)) && !!(direita && bt.contains(direita)),
                     centro: marca(centro), direita: marca(direita) });
        });
        return { sy: window.scrollY, out: out };
      }, sy);
      medidos += r.out.length;
      naFaixaDoFab += r.out.filter(x => x.naFaixa).length;
      r.out.filter(x => !x.ok).forEach(x => roubados.push('scrollY=' + r.sy + ' botao#' + x.i
        + ' centro->' + x.centro + ' direita->' + x.direita));
    }
    console.log('  V1 ' + T + ': ' + medidos + ' pontos medidos na varredura de rolagem ('
      + naFaixaDoFab + ' na faixa de altura do FAB), ' + roubados.length + ' roubados'
      + (roubados.length ? '\n     ' + roubados.slice(0, 6).join('\n     ') : ''));
    assert(medidos > 0,
      'CONTROLE V6 ' + T + ': a varredura mediu algum ponto (filtro que excluisse tudo passaria calado)');
    assert(naFaixaDoFab >= 1,
      'CONTROLE V6 ' + T + ': ao menos um ponto medido caiu na FAIXA DE ALTURA do FAB -- a varredura '
      + 'passou pela linha perigosa, nao so por linhas inofensivas');
    assert(roubados.length === 0,
      'V1 ' + T + ': em toda a rolagem, o centro E a borda direita do botao de editar recebem o proprio toque');
    await pgM.evaluate(() => window.scrollTo(0, 0));

    /* ---- V3: detalhe com endereco e contato de 200 caracteres sem espacos ---- */
    await pgM.evaluate((L) => {
      const r = document.getElementById('modalRoot'); if (r) r.innerHTML = '';
      clientes = [{ nome: 'Cliente Longo', endereco: L, contato: L }];
      osList = []; manutencoes = [];
      localStorage.setItem('mappo_clientes', JSON.stringify(clientes));
      localStorage.setItem('mappo_os', '[]'); localStorage.setItem('mappo_manut', '[]');
      nav('clientes'); openHistoricoCliente('Cliente Longo');
    }, LONGO);
    await pgM.waitForTimeout(280);
    const g3 = await pgM.evaluate(() => {
      const ov = document.getElementById('curOverlay');
      const body = ov.querySelector('.modal-body');
      const fechar = [...ov.querySelectorAll('.modal-foot button')].find(x => /Fechar/.test(x.textContent));
      const rf = fechar.getBoundingClientRect();
      const el = document.elementFromPoint(Math.round(rf.left + rf.width / 2),
                                           Math.round(rf.top + rf.height / 2));
      const out = { aberto: ov.classList.contains('open'), sw: body.scrollWidth, cw: body.clientWidth,
        fora: [...ov.querySelectorAll('.modal-body .os-meta-i')]
          .map(x => Math.round(x.getBoundingClientRect().right)).filter(x => x > window.innerWidth),
        fecharRecebe: !!(el && fechar.contains(el)) };
      closeModal();
      return out;
    });
    await pgM.waitForTimeout(320);
    console.log('  V3 ' + T + ': modal-body scrollWidth ' + g3.sw + ' / clientWidth ' + g3.cw
      + ' | campos fora da tela: ' + g3.fora.length);
    assert(g3.aberto, 'CONTROLE V6 ' + T + ': o detalhe do cliente esta aberto (classe open em #curOverlay)');
    assert(g3.sw === g3.cw,
      'V3 ' + T + ': com endereco e contato de 200 caracteres sem espacos o detalhe NAO rola na horizontal ('
      + g3.sw + ' === ' + g3.cw + ')');
    assert(g3.fora.length === 0, 'V3 ' + T + ': nenhum dos dois campos passa da borda da tela');
    assert(g3.fecharRecebe, 'V3 ' + T + ': e o botao Fechar continua recebendo o proprio toque');

    /* ---- V4: cartao e detalhe dizem a MESMA coisa sobre endereco ausente ---- */
    await pgM.evaluate(() => {
      const r = document.getElementById('modalRoot'); if (r) r.innerHTML = '';
      clientes = [{ nome: 'So Contato', endereco: '', contato: '(49) 8888-1111' },
                  { nome: 'Nem Endereco Nem Contato', endereco: '', contato: '' }];
      osList = []; manutencoes = [];
      localStorage.setItem('mappo_clientes', JSON.stringify(clientes));
      localStorage.setItem('mappo_os', '[]'); localStorage.setItem('mappo_manut', '[]');
      nav('clientes');
    });
    await pgM.waitForTimeout(260);
    for (const nome of ['So Contato', 'Nem Endereco Nem Contato']) {
      const g4 = await pgM.evaluate((n) => {
        const card = [...document.querySelectorAll('#app .os-card')]
          .find(c => (c.querySelector('.os-client') || {}).textContent === n);
        const noCartao = [...card.querySelectorAll('.os-addr')].map(x => x.textContent.trim());
        openHistoricoCliente(n);
        const ov = document.getElementById('curOverlay');
        const out = { noCartao: noCartao, aberto: ov.classList.contains('open'),
          noDetalhe: [...ov.querySelectorAll('.modal-body .os-meta-i')].map(x => x.textContent.trim()) };
        closeModal();
        return out;
      }, nome);
      await pgM.waitForTimeout(320);
      console.log('  V4 ' + T + ' [' + nome + ']: cartao ' + JSON.stringify(g4.noCartao)
        + ' | detalhe ' + JSON.stringify(g4.noDetalhe));
      assert(g4.aberto, 'CONTROLE V6 ' + T + ': o detalhe de "' + nome + '" abriu');
      assert(g4.noCartao.some(x => /Sem endere/.test(x)),
        'CONTROLE V4 ' + T + ': o cartao de "' + nome + '" diz "Sem endereco"');
      assert(JSON.stringify(g4.noDetalhe) === JSON.stringify(g4.noCartao),
        'V4 ' + T + ': cartao e detalhe de "' + nome + '" dizem a MESMA coisa -- '
        + JSON.stringify(g4.noCartao));
    }

    /* ---- V5: o rodape do modal de cliente, com atencao ao modo EDICAO ---- */
    for (const modo of ['cadastro', 'edicao']) {
      const g5 = await pgM.evaluate((m) => {
        const r = document.getElementById('modalRoot'); if (r) r.innerHTML = '';
        clientes = [{ nome: 'Cliente Rodape', endereco: 'Rua R, 1', contato: '(49) 7777-2222' }];
        osList = []; manutencoes = [];
        localStorage.setItem('mappo_clientes', JSON.stringify(clientes));
        localStorage.setItem('mappo_os', '[]'); localStorage.setItem('mappo_manut', '[]');
        if (m === 'cadastro') openModalCliente(); else openModalCliente('Cliente Rodape');
        const ov = document.getElementById('curOverlay');
        const foot = ov.querySelector('.modal-foot');
        const bts = [...foot.querySelectorAll('button')].map(bt => {
          const rc = bt.getBoundingClientRect();
          return { t: bt.textContent.trim(), top: Math.round(rc.top), w: Math.round(rc.width) };
        });
        const prim = bts.find(x => /salvar/i.test(x.t)), sec = bts.find(x => /cancelar/i.test(x.t));
        const out = { aberto: ov.classList.contains('open'), bts: bts,
          footH: Math.round(foot.getBoundingClientRect().height),
          linhas: [...new Set(bts.map(x => x.top))].length,
          temOsDois: !!prim && !!sec,
          primAcimaOuJunto: !!(prim && sec && prim.top <= sec.top) };
        closeModal();
        return out;
      }, modo);
      await pgM.waitForTimeout(320);
      console.log('  V5 ' + T + ' [' + modo + ']: rodape ' + g5.footH + 'px em ' + g5.linhas
        + ' linha(s) ' + JSON.stringify(g5.bts));
      assert(g5.aberto, 'CONTROLE V6 ' + T + ': o modal de cliente (' + modo + ') esta aberto');
      assert(g5.temOsDois, 'CONTROLE V6 ' + T + ': o rodape (' + modo + ') tem o Cancelar e o Salvar');
      assert(g5.linhas === 1,
        'V5 ' + T + ': o rodape do modal de cliente (' + modo + ') cabe em UMA linha');
      assert(g5.primAcimaOuJunto,
        'V5 ' + T + ': a acao primaria (Salvar) nunca fica ABAIXO do Cancelar (' + modo + ')');
    }
    await ctxM.close();
  }
  assert(errosM.length === 0, 'V6: nenhum erro de pagina nas quatro telas de celular'
    + (errosM.length ? ' -- ' + errosM.join(' | ') : ''));

  console.log('\n=== erros de pagina ===');
  console.log(erros.length ? erros : '(nenhum)');
  assert(erros.length === 0, 'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e => { console.error('\n' + (e && e.message ? e.message : e)); process.exit(1); });
