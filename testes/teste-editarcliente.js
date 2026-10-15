/* Editar cliente SEM desligar o cliente do próprio histórico.
   O nome do cliente é a CHAVE DE LIGAÇÃO: fica guardado em `o.cliente` (mappo_os) e
   `mn.cliente` (mappo_manut). Renomear sem arrastar o nome junto apaga o histórico de serviço
   executado da vista do gestor -- o mesmo defeito já corrigido com técnicos em da03885.
   ─── O QUE ESTA SUÍTE FAZ EM CADA ÁRVORE: MEDIDO, não deduzido ───
   Um rodar inteiro para no PRIMEIRO assert vermelho. Então "o CHECK N falha contra a árvore T"
   é frase INOBSERVÁVEL num rodar inteiro: depois do primeiro vermelho, nenhum CHECK seguinte
   chega a executar, e ninguém consegue conferir a frase rodando o comando.
   Corrigido em 14/10/2026 (R11). A frase anterior dizia "Contra e910054 esta suíte FALHA no
   CHECK 1" -- e isso era DEDUÇÃO escrita como medição: lá ela morre no CHECK 0, e o CHECK 1
   nunca é alcançado. Medido em 14/10/2026, exit code lido sem pipe:
     - contra e910054 (antes da edição de cliente): exit 1, morre no CHECK 0, no assert
       'a tela de Clientes nao cai com o nome "__proto__"' -- defeito anterior à edição, que
       vive na função que esta entrega toca. O CHECK 1 não é alcançado;
     - contra 42a291d (o publicado antes do menu ⋮): exit 1, morre no CHECK 1, no assert
       'o cartao tem o botao de acoes (menuCliente)';
     - contra a árvore de agora: exit 0, "TODOS OS CHECKS PASSARAM".

   ─── O QUE FOI MEDIDO UM POR UM ───
   Para medir caso por caso num rodar só, a conferência usa uma cópia INSTRUMENTADA da suíte,
   em que `assert` COLETA o vermelho em vez de interromper -- fora de `testes/`, para o runner
   nunca a tratar como suíte. É assim que as listas abaixo foram levantadas, e cada bloco de
   CHECKs repete a sua no próprio cabeçalho.
     - CHECKs 8 e 10 a 14 (F1..F6, rodada de correção): 8 = o link público se republica sozinho
       (a rodada 1 abria um modal mandando regerar, e o CHECK 8 de lá AFIRMAVA esse texto falso);
       10 = fusão de histórico por caixa avisa e pede confirmação; 11 = endereço do registro
       vence o copiado da OS; 12 = contato aparece na tela; 13 = memória cheia no meio do arraste
       não parte o histórico; 14 = espaço duplo, largura zero e NBSP contam como duplicata.
     - CHECK 4, REESCRITO na rodada G1: a versão anterior afirmava que cadastrar um nome que
       existe só nas OS RECUSA, e isso era regressão contra e910054 -- teste que petrifica
       comportamento errado. Hoje ele afirma a regra decidida pelo proprietário em 12/10/2026:
       grafia exata permite, registro repetido e grafia diferente recusam.
     - CHECKs 15 a 31 (G2) fecham as 16 garantias que a camada de mutação achou SEM rede: o
       código estava CERTO em todas, e uma mutação que desfazia cada uma passava pela suíte
       inteira. Cada um nomeia, no próprio comentário, a mutação contra a qual foi provado.
     - CHECK 32 (V6) é a RODADA VISUAL: até 12/10/2026 esta suíte media tudo no viewport padrão
       do Playwright (1280x720, desktop), e nenhum dos cinco defeitos de geometria em celular
       (V1 a V5) podia ser visto por ela. Ele abre o PRÓPRIO contexto de celular, nos quatro
       tamanhos.
     - CHECKs 48 a 51 (C, 13/10/2026): 48 = o aviso de excluir não promete mais que o cliente
       com SÓ manutenção continua na lista (ele sai); 49 = o aviso diz que a FIXAÇÃO também se
       perde; 50 e 51 = fixar passa pelas guardas do cadastro quando cria registro. A lista de
       asserts vermelhos na árvore anterior está no cabeçalho do bloco deles.
     - V7 a V9 e CHECKs 52 a 57 (R, 14/10/2026) são a rodada 2 do menu ⋮. Os dois grupos têm
       naturezas DIFERENTES, e misturá-los seria o mesmo erro de antes:
         * V7, V8 e V9 (R1 a R4) são DEFEITO, e ficam vermelhos na árvore anterior: 41 asserts
           vermelhos lá contra 0 na árvore de agora, medidos na cópia instrumentada. Nenhum
           deles é CONTROLE -- os controles ficaram verdes nas duas árvores;
         * CHECKs 52 a 57 e o fechamento do menu no CHECK 38 (R5 a R9) são LACUNA DE REDE: o
           código já estava certo, então eles NÃO podem ficar vermelhos na árvore anterior, e
           exigir isso deles seria exigir o impossível. A prova é por MUTAÇÃO: numa cópia com
           as oito garantias desfeitas de propósito, a suíte anterior achou 1 vermelho (e esse
           1 era o do R4, não mutação nenhuma) e esta achou 30.
       Dessa rodada é também o conserto do CONTROLE do CHECK 47 (R10) e deste cabeçalho (R11).
   Dessa mesma rodada C é a correcao da MEDICAO do CHECK 32: a varredura de rolagem reprovava
   2 vezes em 8 sem defeito nenhum porque a faixa #syncAlerta nascia no meio dela. O defeito era
   do controle, nao do produto, e esta explicado na armadilha 5 do cabecalho do bloco V6.
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

/* Razão de contraste da WCAG 2.1, para o item "Excluir" (R4). Fica aqui, em Node, e não dentro
   da página: o que a página devolve é a cor COMPUTADA (`rgb(...)`), e a conta tem de ser a mesma
   que o critério AA usa -- luminância relativa com a correção de gama, nunca "parece escuro". */
const _lumRel = (r, g, b) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const _contraste = (c1, c2) => { const a = _lumRel(c1[0], c1[1], c1[2]), b = _lumRel(c2[0], c2[1], c2[2]);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
const _rgbDe = (s) => (String(s).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);

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
    /* 13/10/2026: o caminho da edição passou a ser o ⋮ do canto -> item "Editar" do menu.
       O botão largo "Editar cliente" do rodapé do cartão NÃO existe mais, e este check segue
       o caminho que o gestor segue de verdade -- não openModalCliente() chamada à mão. */
    const btn = [...card.querySelectorAll('button')]
      .find(x => /menuCliente/.test(x.getAttribute('onclick') || ''));
    if (!btn) return { achouCartao: true, achouBotao: false };
    /* O cartão inteiro tem onclick de abrir o histórico. O ⋮ só serve se NÃO abrir o
       histórico junto -- então o que se mede aqui é o título do modal que subiu. */
    btn.click();
    const ovm = document.getElementById('curOverlay');
    const menuAberto = !!(ovm && ovm.classList.contains('open'));
    const menuAbriuHistorico = /Hist.rico de visitas/.test(ovm ? ovm.textContent : '');
    const itensDoMenu = ovm ? [...ovm.querySelectorAll('.modal-body button')]
      .map(x => x.textContent.replace(/\s+/g, ' ').trim()) : [];
    const editar = ovm ? [...ovm.querySelectorAll('.modal-body button')]
      .find(x => /^editar$/i.test(x.textContent.replace(/\s+/g, ' ').trim())) : null;
    if (!editar) return { achouCartao: true, achouBotao: true, onclick: btn.getAttribute('onclick'),
                          menuAberto, menuAbriuHistorico, itensDoMenu, achouEditar: false };
    editar.click();
    const ov = document.getElementById('curOverlay');
    const titulo = ov ? (ov.querySelector('.modal-head') || {}).textContent || '' : '';
    const abriuHistorico = /Hist.rico de visitas/.test(ov ? ov.textContent : '');
    const campos = {
      nome: (document.getElementById('cNome') || {}).value,
      endereco: (document.getElementById('cEndereco') || {}).value,
      contato: (document.getElementById('cContato') || {}).value
    };
    return { achouCartao: true, achouBotao: true, onclick: btn.getAttribute('onclick'),
             menuAberto, menuAbriuHistorico, itensDoMenu, achouEditar: true,
             aberto: !!(ov && ov.classList.contains('open')), titulo: titulo.trim(),
             abriuHistorico, campos };
  }, { antigo: ANTIGO, os: [1, 2, 3, 4, 5].map(i => osDe('os' + i, ANTIGO, '2026-0' + i + '-10')) });

  assert(r1.achouCartao, 'o cartao do cliente aparece na tela de Clientes');
  assert(r1.achouBotao, 'o cartao tem o botao de acoes (menuCliente)');
  console.log('  onclick do botao:', r1.onclick);
  assert(/stopPropagation/.test(r1.onclick || ''),
    'o botao de acoes tem event.stopPropagation() (senao abriria o historico junto)');
  assert(r1.menuAberto, 'o toque no botao de acoes abre um modal');
  assert(!r1.menuAbriuHistorico, 'o botao de acoes NAO abre o historico do cliente');
  console.log('  itens do menu:', JSON.stringify(r1.itensDoMenu));
  assert(r1.achouEditar, 'o menu tem o item "Editar"');
  assert(r1.aberto, 'o item "Editar" do menu abre um modal');
  console.log('  titulo do modal:', JSON.stringify(r1.titulo));
  assert(!r1.abriuHistorico, 'o modal de edicao tambem NAO e o historico do cliente');
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
    /* O #modalRoot é LIMPO antes de medir: o CHECK anterior deixou um modal aberto, e sem esta
       linha o `document.getElementById('cNome')` lá embaixo achava o campo do modal VELHO --
       medido em 13/10/2026, o check passava lendo "Mercado Central" do CHECK 6. */
    const raiz = document.getElementById('modalRoot'); if (raiz) raiz.innerHTML = '';
    const card = [...document.querySelectorAll('#app .os-card')][0];
    /* o caminho de verdade: ⋮ do cartão -> item "Editar" do menu (13/10/2026) */
    const btn = [...card.querySelectorAll('button')]
      .find(x => /menuCliente/.test(x.getAttribute('onclick') || ''));
    if (btn) btn.click();
    const editar = [...document.querySelectorAll('#curOverlay .modal-body button')]
      .find(x => /^editar$/i.test(x.textContent.replace(/\s+/g, ' ').trim()));
    if (editar) editar.click();
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
  assert(r7.abriuEdicao, 'o ⋮ e o item Editar abrem a edicao para nome com apostrofo');
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
    /* ⋮ -> "Editar" (13/10/2026). O ⋮ tambem leva o nome DENTRO de uma string JS no onclick,
       entao as aspas duplas tem de sobreviver nos DOIS passos, nao so no modal. */
    const btn = [...card.querySelectorAll('button')]
      .find(x => /menuCliente/.test(x.getAttribute('onclick') || ''));
    if (btn) btn.click();
    const editar = [...document.querySelectorAll('#curOverlay .modal-body button')]
      .find(x => /^editar$/i.test(x.textContent.replace(/\s+/g, ' ').trim()));
    if (editar) editar.click();
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

  /* ╔══════════════════════════════════════════════════════════════════════════════════════╗
     ║  CHECKS 33 a 51 (M e C): O MENU DE TRÊS PONTOS, FIXAR NO TOPO E EXCLUIR CLIENTE      ║
     ║  Entrega de 13/10/2026.                                                              ║
     ║  O QUE FOI MEDIDO CONTRA 42a291d, e só isto (corrigido em 13/10/2026 -- a frase       ║
     ║  anterior dizia "contra 42a291d TODOS falham", e isso era DEDUÇÃO escrita como        ║
     ║  medição: rodando lá a suíte MORRE no CHECK 1, no assert "o cartao tem o botao de     ║
     ║  acoes (menuCliente)", e os CHECKs 33 em diante nunca chegam a executar):             ║
     ║    - a suíte inteira contra 42a291d: exit 1, morre no CHECK 1 (medido);               ║
     ║    - as cinco funções que esta família toda chama não existem lá: `menuCliente`,      ║
     ║      `fixarCliente`, `excluirCliente`, `_clienteFixado` e `selecionarVariosClientes`  ║
     ║      dão 0 ocorrências no index.html de 42a291d. Controle positivo da mesma busca,    ║
     ║      no mesmo arquivo: `criarCliente` 3, `openModalCliente` 4,                        ║
     ║      `_clienteNomeEmUsoAoCriar` 3 -- a busca ACHA o que existe.                       ║
     ║  Os CHECKs 48 a 51 são da RODADA DE CORREÇÃO (C2, C4, C3) e foram medidos UM POR UM   ║
     ║  contra a árvore imediatamente anterior a eles: 12 asserts vermelhos lá (4 no 48, 1   ║
     ║  no 49, 3 no 50, 4 no 51), e nenhum deles é CONTROLE -- os controles ficaram verdes   ║
     ║  nas duas árvores, que é o que distingue caso que reproduz de caso que só reclama.    ║
     ║  Armadilhas de medição respeitadas (testes/README.md): o #modalRoot é LIMPO antes de ║
     ║  cada medição (closeModal() só limpa 200 ms depois, e o texto do modal anterior fica ║
     ║  no DOM); "aberto" é a classe `open` em #curOverlay, nunca o texto; e todo cenário é ║
     ║  GRAVADO (saveClientes/saveOS/saveManut) porque startNotifChecker recarrega `osList` ║
     ║  e `manutencoes` do localStorage a cada 5 s.                                         ║
     ╚══════════════════════════════════════════════════════════════════════════════════════╝ */

  /* ══════════ CHECK 33 (M1): o ⋮ e o cartão não disputam o toque ══════════ */
  console.log('\n=== CHECK 33 (M1): toque FORA do ⋮ abre o historico; no ⋮ abre o menu ===');
  const r33 = await pg.evaluate((d) => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Oficina do Toque', endereco: 'Rua T, 1', contato: '111' }];
    osList = JSON.parse(JSON.stringify(d.os)); manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const card = document.querySelector('#app .os-card');
    /* 1) toque no CORPO do cartão (o nome) -- tem de abrir o histórico, como sempre */
    card.querySelector('.os-client').click();
    const ov1 = document.getElementById('curOverlay');
    const corpo = { aberto: !!(ov1 && ov1.classList.contains('open')),
                    historico: /Hist.rico de visitas/.test(ov1 ? ov1.textContent : '') };
    closeModal(); document.getElementById('modalRoot').innerHTML = '';
    /* 2) toque no ⋮ -- tem de abrir o MENU, e o histórico NÃO pode subir junto */
    const bt = [...card.querySelectorAll('button')]
      .find(x => /menuCliente/.test(x.getAttribute('onclick') || ''));
    if (bt) bt.click();
    const ov2 = document.getElementById('curOverlay');
    const pontos = { achou: !!bt, aberto: !!(ov2 && ov2.classList.contains('open')),
                     historico: /Hist.rico de visitas/.test(ov2 ? ov2.textContent : ''),
                     temExcluir: /Excluir/.test(ov2 ? ov2.textContent : '') };
    closeModal(); document.getElementById('modalRoot').innerHTML = '';
    return { corpo: corpo, pontos: pontos };
  }, { os: [osDe('tq1', 'Oficina do Toque', '2026-02-02')] });
  console.log('  toque no corpo:', JSON.stringify(r33.corpo), '| toque no ⋮:', JSON.stringify(r33.pontos));
  assert(r33.corpo.aberto && r33.corpo.historico,
    'CONTROLE M1: o toque no cartao FORA do ⋮ continua abrindo o historico');
  assert(r33.pontos.achou, 'o cartao tem o ⋮');
  assert(r33.pontos.aberto && r33.pontos.temExcluir, 'o toque no ⋮ abre o menu de acoes');
  assert(!r33.pontos.historico, 'o toque no ⋮ NAO abre o historico junto (stopPropagation)');

  /* ══════════ CHECK 34 (M2): a ordem das ações, a linha e o vermelho ══════════ */
  console.log('\n=== CHECK 34 (M2): ordem Editar/Fixar/Selecionar + LINHA + Excluir vermelho ===');
  const r34 = await pg.evaluate(() => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Cliente Menu', endereco: 'Rua M, 1', contato: '222' }];
    osList = []; manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    menuCliente('Cliente Menu');
    const ov = document.getElementById('curOverlay');
    const filhos = [...ov.querySelectorAll('.modal-body > *')].map(el => ({
      tag: el.tagName.toLowerCase(), txt: el.textContent.replace(/\s+/g, ' ').trim(),
      cor: getComputedStyle(el).color, alt: Math.round(el.getBoundingClientRect().height),
      svg: el.querySelectorAll('svg').length
    }));
    const out = { aberto: ov.classList.contains('open'), filhos: filhos };
    closeModal(); document.getElementById('modalRoot').innerHTML = '';
    return out;
  });
  const rotulos34 = r34.filhos.filter(x => x.tag === 'button').map(x => x.txt);
  console.log('  filhos do menu:', JSON.stringify(r34.filhos.map(x => x.tag + ':' + (x.txt || '(linha)'))));
  assert(r34.aberto, 'CONTROLE M2: o menu do cliente esta aberto (classe open em #curOverlay)');
  assert(JSON.stringify(rotulos34) === JSON.stringify(['Editar', 'Fixar no topo', 'Selecionar várias', 'Excluir']),
    'a ordem das acoes e Editar / Fixar no topo / Selecionar varias / Excluir -- medido '
    + JSON.stringify(rotulos34));
  const iEx34 = r34.filhos.findIndex(x => x.txt === 'Excluir');
  const linha34 = r34.filhos[iEx34 - 1];
  console.log('  elemento imediatamente antes do Excluir:', JSON.stringify(linha34));
  assert(!!linha34 && linha34.tag !== 'button' && linha34.alt === 1,
    'ha uma LINHA (1 px, nao botao) imediatamente antes do Excluir');
  console.log('  cor do Excluir:', r34.filhos[iEx34].cor, '| cor do Editar:', r34.filhos[0].cor);
  /* 14/10/2026 (R4): este assert fixava `rgb(229, 62, 62)` -- o --red cru, que mede 4,13:1 de
     contraste sobre branco e reprovava o minimo AA de 4,5:1. Fixar o valor exato amarrava a
     suite ao tom errado: corrigir o contraste deixava o teste vermelho POR TER SIDO CORRIGIDO,
     a mesma armadilha do antigo controle do CHECK 47. O que importa e afirmado agora em duas
     partes, e nenhuma delas e um literal de tom: aqui, que o Excluir e VERMELHO (o canal R
     domina com folga) e diferente dos outros itens; e no V9 do bloco V6, que a razao de
     contraste medida contra o fundo da folha chega ao AA. */
  const corEx34 = _rgbDe(r34.filhos[iEx34].cor);
  assert(corEx34[0] >= 150 && corEx34[0] - corEx34[1] >= 80 && corEx34[0] - corEx34[2] >= 80,
    'o Excluir e VERMELHO, que e a excecao de "cor com significado" -- medido '
    + r34.filhos[iEx34].cor);
  assert(_contraste(corEx34, [255, 255, 255]) >= 4.5,
    'e o vermelho dele tem contraste AA sobre branco -- medido '
    + _contraste(corEx34, [255, 255, 255]).toFixed(2) + ':1 (minimo 4.5:1)');
  assert(r34.filhos[iEx34].cor !== r34.filhos[0].cor,
    'CONTROLE M2: o Editar NAO e vermelho -- o vermelho e do Excluir, nao do menu todo');
  assert(r34.filhos.filter(x => x.tag === 'button').every(x => x.svg === 1),
    'cada acao do menu tem um icone do sistema (SVG), nenhum emoji');

  /* ══════════ CHECK 35 (M3): excluir cliente SEM OS -- sai da lista ══════════ */
  console.log('\n=== CHECK 35 (M3): excluir cliente sem historico -- sai da lista ===');
  const r35 = await pg.evaluate(() => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Vai Sair', endereco: 'Rua S, 1', contato: '1' },
                { nome: 'Fica', endereco: 'Rua F, 2', contato: '2' }];
    osList = []; manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const msgs = [];
    window.confirm = (m) => { msgs.push(m); return true; };
    const chaves = [];
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { chaves.push(k); return orig.apply(this, arguments); };
    menuCliente('Vai Sair');
    const bt = [...document.querySelectorAll('#curOverlay .modal-body button')]
      .find(x => /^excluir$/i.test(x.textContent.replace(/\s+/g, ' ').trim()));
    if (bt) bt.click();
    Storage.prototype.setItem = orig;
    window.confirm = () => true;
    const ov = document.getElementById('curOverlay');
    const out = { achou: !!bt, msgs: msgs, chaves: chaves,
      nomes: clientes.map(c => c.nome),
      cartoes: [...document.querySelectorAll('#app .os-client')].map(x => x.textContent),
      gravado: JSON.parse(localStorage.getItem('mappo_clientes') || '[]').map(c => c.nome),
      fechou: !(ov && ov.classList.contains('open')) };
    document.getElementById('modalRoot').innerHTML = '';
    return out;
  });
  console.log('  pergunta:', JSON.stringify(r35.msgs[0] || '(nenhuma)'));
  console.log('  clientes:', JSON.stringify(r35.nomes), '| cartoes:', JSON.stringify(r35.cartoes),
    '| chaves gravadas:', JSON.stringify(r35.chaves));
  assert(r35.achou, 'o menu tem o item "Excluir"');
  assert(r35.msgs.length === 1, 'excluir PERGUNTA antes (uma confirmacao, nao zero nem duas)');
  assert(JSON.stringify(r35.nomes) === JSON.stringify(['Fica']), 'o cliente excluido saiu de `clientes`');
  assert(JSON.stringify(r35.gravado) === JSON.stringify(['Fica']), 'e saiu GRAVADO em mappo_clientes');
  assert(r35.cartoes.indexOf('Vai Sair') < 0, 'o cartao dele saiu da tela sem precisar navegar');
  assert(r35.cartoes.indexOf('Fica') >= 0, 'CONTROLE M3: o cartao do OUTRO cliente continua la');
  /* `mappo_touch` entra na lista por desenho: é o relógio de sincronização que o interceptor
     de setItem grava junto de qualquer chave publicável. O que este caso afirma é que as
     chaves de HISTÓRICO ficam de fora, e que a de cadastro de fato entrou (controle). */
  assert(r35.chaves.indexOf('mappo_os') < 0 && r35.chaves.indexOf('mappo_manut') < 0,
    'excluir NAO escreve em mappo_os nem mappo_manut -- medido ' + JSON.stringify(r35.chaves));
  assert(r35.chaves.indexOf('mappo_clientes') >= 0,
    'CONTROLE M3: a sonda de gravacao MEDIU algo -- mappo_clientes foi gravado');
  assert(r35.fechou, 'o menu fecha depois de excluir');

  /* ══════════ CHECK 36 (M4): excluir cliente COM 3 OS -- o aviso diz 3, e as OS ficam ══════════ */
  /* A linha vermelha do projeto: OS e manutenção são prova de serviço executado. Excluir o
     CADASTRO não pode encostar nelas, e o gestor tem de saber ANTES quantas existem. */
  console.log('\n=== CHECK 36 (M4): excluir cliente com 3 OS e 1 manutencao -- nada do historico e tocado ===');
  const r36 = await pg.evaluate((d) => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Com Historico', endereco: 'Rua H, 1', contato: '9' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const antes = { os: JSON.stringify(osList), mn: JSON.stringify(manutencoes),
                    dOs: localStorage.getItem('mappo_os'), dMn: localStorage.getItem('mappo_manut') };
    const msgs = [];
    window.confirm = (m) => { msgs.push(m); return true; };
    const chaves = [];
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { chaves.push(k); return orig.apply(this, arguments); };
    excluirCliente('Com Historico');
    Storage.prototype.setItem = orig;
    window.confirm = () => true;
    const out = { msgs: msgs, chaves: chaves,
      osIgual: JSON.stringify(osList) === antes.os,
      mnIgual: JSON.stringify(manutencoes) === antes.mn,
      dOsIgual: localStorage.getItem('mappo_os') === antes.dOs,
      dMnIgual: localStorage.getItem('mappo_manut') === antes.dMn,
      registro: clientes.find(c => c.nome === 'Com Historico') || null,
      cartoes: [...document.querySelectorAll('#app .os-client')].map(x => x.textContent),
      visitas: [...document.querySelectorAll('#app .os-card .badge')].map(x => x.textContent.trim()) };
    document.getElementById('modalRoot').innerHTML = '';
    return out;
  }, { os: [1, 2, 3].map(i => osDe('ch' + i, 'Com Historico', '2026-0' + i + '-05')),
       mn: [manutDe('chm1', 'Com Historico', '2026-12-01')] });
  console.log('  pergunta:', JSON.stringify(r36.msgs[0] || '(nenhuma)'));
  console.log('  cartoes depois:', JSON.stringify(r36.cartoes), '| badge:', JSON.stringify(r36.visitas),
    '| chaves gravadas:', JSON.stringify(r36.chaves));
  assert(r36.msgs.length === 1, 'excluir cliente com historico tambem PERGUNTA antes');
  assert(/\b3 OS\b/.test(r36.msgs[0]), 'o aviso diz QUANTAS OS existem -- o numero 3, medido no texto');
  assert(/1 manutenç[ãa]o/.test(r36.msgs[0]), 'e quantas manutencoes -- 1, no singular');
  assert(r36.osIgual && r36.mnIgual, 'as 3 OS e a manutencao ficaram byte a byte iguais em MEMORIA');
  assert(r36.dOsIgual && r36.dMnIgual, 'e byte a byte iguais no DISCO (mappo_os e mappo_manut)');
  assert(r36.chaves.indexOf('mappo_os') < 0 && r36.chaves.indexOf('mappo_manut') < 0,
    'nenhuma escrita em mappo_os nem mappo_manut -- medido ' + JSON.stringify(r36.chaves));
  assert(r36.chaves.indexOf('mappo_clientes') >= 0,
    'CONTROLE M4: a sonda de gravacao MEDIU algo -- mappo_clientes foi gravado');
  assert(!r36.registro, 'o CADASTRO foi apagado de `clientes`');
  assert(r36.cartoes.indexOf('Com Historico') >= 0,
    'e o cliente CONTINUA na lista, montado pelas OS -- excluir cadastro nao apaga historico');
  assert(r36.visitas.some(x => /3 visita/.test(x)), 'o cartao dele continua dizendo 3 visitas');

  /* ══════════ CHECK 37 (M5): excluir CANCELADO não muda nada, memória e disco ══════════ */
  console.log('\n=== CHECK 37 (M5): cancelar a exclusao nao muda NADA (memoria e disco, byte a byte) ===');
  const r37 = await pg.evaluate((d) => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Nao Me Apague', endereco: 'Rua N, 1', contato: '7' },
                { nome: 'Vizinho', endereco: 'Rua V, 2', contato: '8' }];
    osList = JSON.parse(JSON.stringify(d.os));
    manutencoes = JSON.parse(JSON.stringify(d.mn));
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const antes = { cl: JSON.stringify(clientes), os: JSON.stringify(osList), mn: JSON.stringify(manutencoes),
                    dCl: localStorage.getItem('mappo_clientes'), dOs: localStorage.getItem('mappo_os'),
                    dMn: localStorage.getItem('mappo_manut') };
    const msgs = [];
    window.confirm = (m) => { msgs.push(m); return false; };     // o gestor CANCELA
    const chaves = [];
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { chaves.push(k); return orig.apply(this, arguments); };
    menuCliente('Nao Me Apague');
    const bt = [...document.querySelectorAll('#curOverlay .modal-body button')]
      .find(x => /^excluir$/i.test(x.textContent.replace(/\s+/g, ' ').trim()));
    if (bt) bt.click();
    Storage.prototype.setItem = orig;
    window.confirm = () => true;
    const ov = document.getElementById('curOverlay');
    const out = { perguntou: msgs.length, chaves: chaves,
      clIgual: JSON.stringify(clientes) === antes.cl,
      osIgual: JSON.stringify(osList) === antes.os,
      mnIgual: JSON.stringify(manutencoes) === antes.mn,
      dClIgual: localStorage.getItem('mappo_clientes') === antes.dCl,
      dOsIgual: localStorage.getItem('mappo_os') === antes.dOs,
      dMnIgual: localStorage.getItem('mappo_manut') === antes.dMn,
      menuAberto: !!(ov && ov.classList.contains('open')) };
    closeModal(); document.getElementById('modalRoot').innerHTML = '';
    return out;
  }, { os: [1, 2].map(i => osDe('nm' + i, 'Nao Me Apague', '2026-0' + i + '-07')),
       mn: [manutDe('nmm1', 'Nao Me Apague', '2026-09-09')] });
  console.log('  perguntou:', r37.perguntou, '| chaves gravadas:', JSON.stringify(r37.chaves),
    '| menu continua aberto:', r37.menuAberto);
  assert(r37.perguntou === 1, 'CONTROLE M5: a pergunta de fato apareceu (senao o caso seria vazio)');
  assert(r37.clIgual && r37.osIgual && r37.mnIgual,
    'cancelando, `clientes`, `osList` e `manutencoes` ficam byte a byte iguais em MEMORIA');
  assert(r37.dClIgual && r37.dOsIgual && r37.dMnIgual,
    'e byte a byte iguais no DISCO (mappo_clientes, mappo_os, mappo_manut)');
  assert(r37.chaves.length === 0, 'cancelando, NENHUMA chave foi gravada');
  assert(r37.menuAberto, 'cancelando, o menu continua aberto -- nada aconteceu, nem na tela');

  /* ══════════ CHECK 38 (M6): cliente que só existe nas OS não tem cadastro para apagar ══════════ */
  console.log('\n=== CHECK 38 (M6): cliente so nas OS -- avisa que nao ha cadastro, e as OS ficam ===');
  const r38 = await pg.evaluate((d) => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = []; osList = JSON.parse(JSON.stringify(d.os)); manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const antes = { os: JSON.stringify(osList), dOs: localStorage.getItem('mappo_os'),
                    cl: JSON.stringify(clientes), dCl: localStorage.getItem('mappo_clientes') };
    const msgs = [];
    window.confirm = (m) => { msgs.push(m); return true; };
    const chaves = [];
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { chaves.push(k); return orig.apply(this, arguments); };
    /* O MENU É ABERTO ANTES, e isso é o caso novo da rodada 2 (R9): até 14/10/2026 este check
       chamava excluirCliente() com o #modalRoot vazio, então o `closeModal()` do caminho
       "não tem cadastro" não era medido por ninguém. Uma mutação que o tirasse deixava o menu
       ABERTO por cima do toast, com o gestor olhando um menu que já não faz nada. */
    menuCliente('Somente nas OS');
    const menuAbriu = !!(document.getElementById('curOverlay') || {}).classList
      && document.getElementById('curOverlay').classList.contains('open');
    excluirCliente('Somente nas OS');
    Storage.prototype.setItem = orig;
    window.confirm = () => true;
    const t = document.getElementById('toast');
    const ov = document.getElementById('curOverlay');
    const out = { perguntou: msgs.length, chaves: chaves, menuAbriu: menuAbriu,
      menuFechou: !(ov && ov.classList.contains('open')),
      toast: t ? t.textContent : '', toastVisivel: !!(t && t.className.indexOf('show') >= 0),
      osIgual: JSON.stringify(osList) === antes.os,
      dOsIgual: localStorage.getItem('mappo_os') === antes.dOs,
      clIgual: JSON.stringify(clientes) === antes.cl,
      dClIgual: localStorage.getItem('mappo_clientes') === antes.dCl,
      cartoes: [...document.querySelectorAll('#app .os-client')].map(x => x.textContent) };
    document.getElementById('modalRoot').innerHTML = '';
    return out;
  }, { os: [1, 2].map(i => osDe('so' + i, 'Somente nas OS', '2026-0' + i + '-11')) });
  console.log('  aviso:', JSON.stringify(r38.toast), '| chaves gravadas:', JSON.stringify(r38.chaves));
  assert(r38.perguntou === 0, 'nao pergunta nada: nao ha cadastro para apagar');
  assert(r38.toastVisivel && /n[aã]o tem cadastro/i.test(r38.toast),
    'o app DIZ que nao ha cadastro para apagar -- nunca fica mudo');
  assert(r38.osIgual && r38.dOsIgual, 'as 2 OS ficaram byte a byte iguais, em memoria e no disco');
  assert(r38.clIgual && r38.dClIgual, 'e `clientes` nao ganhou nem perdeu nada');
  assert(r38.chaves.length === 0, 'nenhuma chave foi gravada');
  assert(r38.cartoes.indexOf('Somente nas OS') >= 0, 'o cliente continua na lista, pelas OS');
  assert(r38.menuAbriu, 'CONTROLE M6: o menu ⋮ de fato ABRIU antes (senao o caso do fechamento seria vazio)');
  assert(r38.menuFechou,
    'e o menu FECHA tambem no caminho "nao tem cadastro" -- menu aberto por cima do toast se le como app travado');

  /* ══════════ CHECK 39 (M7): fixar leva ao topo, com alfinete no cartão ══════════ */
  console.log('\n=== CHECK 39 (M7): fixar pelo menu leva o cliente ao TOPO, com alfinete ===');
  const r39 = await pg.evaluate(() => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Alfa', endereco: 'Rua A, 1', contato: '1' },
                { nome: 'Bravo', endereco: 'Rua B, 2', contato: '2' },
                { nome: 'Charlie', endereco: 'Rua C, 3', contato: '3' }];
    osList = []; manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const antes = [...document.querySelectorAll('#app .os-client')].map(x => x.textContent);
    const chaves = [];
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { chaves.push(k); return orig.apply(this, arguments); };
    menuCliente('Charlie');
    const rotuloNoMenu = [...document.querySelectorAll('#curOverlay .modal-body button')]
      .map(x => x.textContent.replace(/\s+/g, ' ').trim()).find(x => /fixar/i.test(x));
    const bt = [...document.querySelectorAll('#curOverlay .modal-body button')]
      .find(x => /^fixar no topo$/i.test(x.textContent.replace(/\s+/g, ' ').trim()));
    if (bt) bt.click();
    Storage.prototype.setItem = orig;
    const cards = [...document.querySelectorAll('#app .os-card')];
    const ov = document.getElementById('curOverlay');
    const out = { achou: !!bt, rotuloNoMenu: rotuloNoMenu, antes: antes, chaves: chaves,
      depois: cards.map(c => (c.querySelector('.os-client') || {}).textContent),
      comAlfinete: cards.filter(c => !!c.querySelector('.os-client svg'))
        .map(c => (c.querySelector('.os-client') || {}).textContent),
      registro: JSON.parse(localStorage.getItem('mappo_clientes') || '[]')
        .find(c => c.nome === 'Charlie') || null,
      fechou: !(ov && ov.classList.contains('open')) };
    document.getElementById('modalRoot').innerHTML = '';
    return out;
  });
  console.log('  ordem antes:', JSON.stringify(r39.antes), '| depois:', JSON.stringify(r39.depois));
  console.log('  cartoes com alfinete:', JSON.stringify(r39.comAlfinete),
    '| registro gravado:', JSON.stringify(r39.registro), '| chaves:', JSON.stringify(r39.chaves));
  assert(r39.achou && /^Fixar no topo$/i.test(r39.rotuloNoMenu || ''),
    'o menu de um cliente NAO fixado oferece "Fixar no topo"');
  assert(JSON.stringify(r39.antes) === JSON.stringify(['Alfa', 'Bravo', 'Charlie']),
    'CONTROLE M7: antes de fixar, a ordem era Alfa / Bravo / Charlie');
  assert(JSON.stringify(r39.depois) === JSON.stringify(['Charlie', 'Alfa', 'Bravo']),
    'depois de fixar, Charlie esta no TOPO e os outros mantem a ordem -- medido '
    + JSON.stringify(r39.depois));
  assert(JSON.stringify(r39.comAlfinete) === JSON.stringify(['Charlie']),
    'SO o cartao fixado tem o alfinete (icone do sistema no .os-client) -- medido '
    + JSON.stringify(r39.comAlfinete));
  assert(!!r39.registro && r39.registro.fixado === true,
    '`fixado` ficou gravado NO REGISTRO do cliente, em mappo_clientes');
  assert(r39.chaves.indexOf('mappo_os') < 0 && r39.chaves.indexOf('mappo_manut') < 0,
    'fixar nao escreve em mappo_os nem mappo_manut -- medido ' + JSON.stringify(r39.chaves));
  assert(r39.chaves.indexOf('mappo_clientes') >= 0,
    'CONTROLE M7: a sonda de gravacao MEDIU algo -- mappo_clientes foi gravado');
  assert(r39.fechou, 'o menu fecha depois de fixar');

  /* ══════════ CHECK 40 (M8): fixar cliente que só existe nas OS CRIA o registro ══════════ */
  console.log('\n=== CHECK 40 (M8): fixar cliente sem registro cria o registro com `fixado` ===');
  const r40 = await pg.evaluate((d) => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Com Registro', endereco: 'Rua R, 1', contato: '1' }];
    osList = JSON.parse(JSON.stringify(d.os)); manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const antesOs = JSON.stringify(osList);
    fixarCliente('Sem Registro');
    const cards = [...document.querySelectorAll('#app .os-card')];
    const cartaoDele = cards.find(c => (c.querySelector('.os-client') || {}).textContent === 'Sem Registro');
    const out = {
      ordem: cards.map(c => (c.querySelector('.os-client') || {}).textContent),
      registro: JSON.parse(localStorage.getItem('mappo_clientes') || '[]')
        .find(c => c.nome === 'Sem Registro') || null,
      quantos: clientes.length,
      osIgual: JSON.stringify(osList) === antesOs,
      enderecoNoCartao: cartaoDele ? (cartaoDele.querySelector('.os-addr') || {}).textContent : '' };
    document.getElementById('modalRoot').innerHTML = '';
    return out;
  }, { os: [osDe('sr1', 'Sem Registro', '2026-06-06', { endereco: 'Avenida da OS, 777' })] });
  console.log('  registro criado:', JSON.stringify(r40.registro), '| ordem:', JSON.stringify(r40.ordem));
  console.log('  endereco no cartao:', JSON.stringify(r40.enderecoNoCartao));
  assert(!!r40.registro && r40.registro.fixado === true,
    'fixar um cliente que so existia nas OS CRIA o registro dele, com `fixado`');
  assert(r40.quantos === 2, 'criou UM registro, nao dois');
  assert(r40.ordem[0] === 'Sem Registro', 'e ele vai para o topo da lista');
  assert(r40.osIgual, 'as OS dele ficaram byte a byte iguais');
  assert(/Avenida da OS, 777/.test(r40.enderecoNoCartao || ''),
    'o cartao continua mostrando o endereco DA OS -- o registro novo nao congelou uma copia velha');

  /* ══════════ CHECK 41 (M9): desafixar volta à ordem normal e tira o alfinete ══════════ */
  console.log('\n=== CHECK 41 (M9): desafixar -- volta a ordem de sempre e o alfinete some ===');
  const r41 = await pg.evaluate(() => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Um', endereco: 'Rua 1, 1', contato: '1' },
                { nome: 'Dois', endereco: 'Rua 2, 2', contato: '2', fixado: true }];
    osList = []; manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const antes = [...document.querySelectorAll('#app .os-client')].map(x => x.textContent);
    const alfineteAntes = [...document.querySelectorAll('#app .os-card')]
      .filter(c => !!c.querySelector('.os-client svg'))
      .map(c => (c.querySelector('.os-client') || {}).textContent);
    menuCliente('Dois');
    const rotulo = [...document.querySelectorAll('#curOverlay .modal-body button')]
      .map(x => x.textContent.replace(/\s+/g, ' ').trim()).find(x => /fixar/i.test(x));
    const bt = [...document.querySelectorAll('#curOverlay .modal-body button')]
      .find(x => /^desafixar do topo$/i.test(x.textContent.replace(/\s+/g, ' ').trim()));
    if (bt) bt.click();
    const cards = [...document.querySelectorAll('#app .os-card')];
    const out = { achou: !!bt, rotulo: rotulo, antes: antes, alfineteAntes: alfineteAntes,
      depois: cards.map(c => (c.querySelector('.os-client') || {}).textContent),
      alfineteDepois: cards.filter(c => !!c.querySelector('.os-client svg'))
        .map(c => (c.querySelector('.os-client') || {}).textContent),
      gravado: JSON.parse(localStorage.getItem('mappo_clientes') || '[]')
        .find(c => c.nome === 'Dois') || null };
    document.getElementById('modalRoot').innerHTML = '';
    return out;
  });
  console.log('  ordem antes:', JSON.stringify(r41.antes), '| depois:', JSON.stringify(r41.depois));
  console.log('  alfinete antes:', JSON.stringify(r41.alfineteAntes),
    '| depois:', JSON.stringify(r41.alfineteDepois), '| registro:', JSON.stringify(r41.gravado));
  assert(JSON.stringify(r41.antes) === JSON.stringify(['Dois', 'Um']),
    'CONTROLE M9: com `fixado` no registro, "Dois" ja comeca no topo');
  assert(JSON.stringify(r41.alfineteAntes) === JSON.stringify(['Dois']),
    'CONTROLE M9: e so ele tem o alfinete');
  assert(r41.achou && /^Desafixar do topo$/i.test(r41.rotulo || ''),
    'o menu de um cliente JA FIXADO oferece "Desafixar do topo", nao "Fixar"');
  assert(JSON.stringify(r41.depois) === JSON.stringify(['Um', 'Dois']),
    'desafixado, ele volta a ordem normal da lista');
  assert(r41.alfineteDepois.length === 0, 'e o alfinete sai do cartao');
  assert(!!r41.gravado && !('fixado' in r41.gravado),
    'o campo `fixado` sai do registro gravado, nao fica como false');

  /* ══════════ CHECK 42 (M10): vários fixados ficam todos no topo, na ordem de sempre ══════════ */
  console.log('\n=== CHECK 42 (M10): 3 fixados de 5 -- todos no topo, ordem de sempre entre eles ===');
  const r42 = await pg.evaluate(() => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = ['A', 'B', 'C', 'D', 'E'].map((n, i) => {
      const c = { nome: n, endereco: 'Rua ' + n + ', ' + (i + 1), contato: String(i) };
      if (n === 'B' || n === 'D' || n === 'E') c.fixado = true;
      return c;
    });
    osList = []; manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const cards = [...document.querySelectorAll('#app .os-card')];
    const out = { ordem: cards.map(c => (c.querySelector('.os-client') || {}).textContent),
      comAlfinete: cards.filter(c => !!c.querySelector('.os-client svg'))
        .map(c => (c.querySelector('.os-client') || {}).textContent) };
    document.getElementById('modalRoot').innerHTML = '';
    return out;
  });
  console.log('  ordem:', JSON.stringify(r42.ordem), '| com alfinete:', JSON.stringify(r42.comAlfinete));
  assert(JSON.stringify(r42.ordem) === JSON.stringify(['B', 'D', 'E', 'A', 'C']),
    'os 3 fixados ficam no topo preservando a ordem entre eles, e os outros atras -- medido '
    + JSON.stringify(r42.ordem));
  assert(JSON.stringify(r42.comAlfinete) === JSON.stringify(['B', 'D', 'E']),
    'os tres, e so os tres, tem alfinete');

  /* ══════════ CHECK 43 (M11): renomear um cliente fixado NÃO o desafixa ══════════ */
  /* `fixado` vive no registro, e o rename muta o registro no lugar. Lista de nomes à parte
     perderia o fixado aqui -- é o mesmo defeito de desligar o cliente do próprio dado. */
  console.log('\n=== CHECK 43 (M11): renomear um cliente FIXADO -- continua fixado ===');
  const r43 = await pg.evaluate((d) => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Padaria Fixa', endereco: 'Rua PF, 1', contato: '5', fixado: true },
                { nome: 'Outra Qualquer', endereco: 'Rua OQ, 2', contato: '6' }];
    osList = JSON.parse(JSON.stringify(d.os)); manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    openModalCliente('Padaria Fixa');
    document.getElementById('cNome').value = 'Padaria Fixa Ltda';
    criarCliente('Padaria Fixa');
    const cards = [...document.querySelectorAll('#app .os-card')];
    const out = {
      ordem: cards.map(c => (c.querySelector('.os-client') || {}).textContent),
      comAlfinete: cards.filter(c => !!c.querySelector('.os-client svg'))
        .map(c => (c.querySelector('.os-client') || {}).textContent),
      gravado: JSON.parse(localStorage.getItem('mappo_clientes') || '[]')
        .find(c => c.nome === 'Padaria Fixa Ltda') || null,
      osNoNomeNovo: osList.filter(o => o.cliente === 'Padaria Fixa Ltda').length };
    document.getElementById('modalRoot').innerHTML = '';
    return out;
  }, { os: [1, 2].map(i => osDe('pf' + i, 'Padaria Fixa', '2026-0' + i + '-14')) });
  console.log('  ordem:', JSON.stringify(r43.ordem), '| alfinete:', JSON.stringify(r43.comAlfinete));
  console.log('  registro gravado:', JSON.stringify(r43.gravado), '| OS no nome novo:', r43.osNoNomeNovo);
  assert(!!r43.gravado && r43.gravado.fixado === true,
    'renomeado, o registro gravado CONTINUA com `fixado`');
  assert(r43.ordem[0] === 'Padaria Fixa Ltda', 'e ele continua no topo da lista, com o nome novo');
  assert(JSON.stringify(r43.comAlfinete) === JSON.stringify(['Padaria Fixa Ltda']),
    'o alfinete continua nele, e so nele');
  assert(r43.osNoNomeNovo === 2, 'CONTROLE M11: o rename arrastou as 2 OS, como ja fazia');

  /* ══════════ CHECK 44 (M12): "Selecionar várias" avisa que vem em seguida ══════════ */
  /* Exclusão em lote tem entrega própria. O que esta entrega garante é que a opção NÃO fica
     muda -- botão que não responde se lê como app travado -- e que ela não mexe em dado. */
  console.log('\n=== CHECK 44 (M12): "Selecionar varias" diz que vem em seguida, e nao mexe em nada ===');
  const r44 = await pg.evaluate((d) => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Lote Um', endereco: 'Rua L, 1', contato: '1' },
                { nome: 'Lote Dois', endereco: 'Rua L, 2', contato: '2' }];
    osList = JSON.parse(JSON.stringify(d.os)); manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const t0 = document.getElementById('toast');
    t0.textContent = ''; t0.className = 'toast';
    const antes = { cl: JSON.stringify(clientes), os: JSON.stringify(osList),
                    mn: JSON.stringify(manutencoes) };
    const chaves = [];
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { chaves.push(k); return orig.apply(this, arguments); };
    menuCliente('Lote Um');
    const bt = [...document.querySelectorAll('#curOverlay .modal-body button')]
      .find(x => /^selecionar v[áa]rias$/i.test(x.textContent.replace(/\s+/g, ' ').trim()));
    if (bt) bt.click();
    Storage.prototype.setItem = orig;
    const t = document.getElementById('toast');
    const ov = document.getElementById('curOverlay');
    const out = { achou: !!bt, toast: t.textContent, visivel: t.className.indexOf('show') >= 0,
      chaves: chaves, menuAberto: !!(ov && ov.classList.contains('open')),
      clIgual: JSON.stringify(clientes) === antes.cl,
      osIgual: JSON.stringify(osList) === antes.os,
      mnIgual: JSON.stringify(manutencoes) === antes.mn };
    closeModal(); document.getElementById('modalRoot').innerHTML = '';
    return out;
  }, { os: [osDe('lu1', 'Lote Um', '2026-07-07')] });
  console.log('  aviso:', JSON.stringify(r44.toast), '| visivel:', r44.visivel,
    '| chaves gravadas:', JSON.stringify(r44.chaves));
  assert(r44.achou, 'o menu tem o item "Selecionar varias"');
  assert(r44.visivel && r44.toast.length > 0, 'tocar nele NAO fica mudo: um aviso aparece');
  assert(/pr[óo]xima atualiza|em seguida|vem a seguir/i.test(r44.toast),
    'e o aviso diz que o recurso vem em seguida -- medido ' + JSON.stringify(r44.toast));
  assert(r44.clIgual && r44.osIgual && r44.mnIgual,
    'e NADA muda em memoria: clientes, osList e manutencoes byte a byte iguais');
  assert(r44.chaves.length === 0, 'e nenhuma chave e gravada');

  /* ══════════ CHECK 45 (M13): nome com apóstrofo e nome de protótipo no menu ══════════ */
  /* O ⋮ leva o nome DENTRO de uma string JS no onclick, igual ao cartão; e `__proto__` é o
     nome que já derrubou a tela inteira de Clientes uma vez (CHECK 0). Os dois tem de abrir
     o menu, fixar e excluir. O terceiro nome é o CONTROLE POSITIVO. */
  console.log('\n=== CHECK 45 (M13): "Sant\'Ana" e "__proto__" -- o ⋮ abre e as acoes funcionam ===');
  for (const nome of ["Sant'Ana Refrigeração", '__proto__', 'Nome Comum']) {
    const r45 = await pg.evaluate((n) => {
      document.getElementById('modalRoot').innerHTML = '';
      const quebras = [];
      const onerr = (e) => quebras.push(String(e.message || e));
      window.addEventListener('error', onerr);
      clientes = [{ nome: n, endereco: 'Rua X, 1', contato: '1' },
                  { nome: 'Vizinho Dele', endereco: 'Rua Y, 2', contato: '2' }];
      osList = []; manutencoes = [];
      saveClientes(); saveOS(); saveManut();
      nav('clientes');
      const card = [...document.querySelectorAll('#app .os-card')]
        .find(c => ((c.querySelector('.os-client') || {}).textContent || '') === n);
      if (!card) { window.removeEventListener('error', onerr); return { achouCartao: false, quebras: quebras }; }
      const bt = [...card.querySelectorAll('button')]
        .find(x => /menuCliente/.test(x.getAttribute('onclick') || ''));
      if (bt) bt.click();
      const ov = document.getElementById('curOverlay');
      const abriu = !!(ov && ov.classList.contains('open') && /Excluir/.test(ov.textContent));
      /* FIXAR pelo menu */
      const fx = ov ? [...ov.querySelectorAll('.modal-body button')]
        .find(x => /^fixar no topo$/i.test(x.textContent.replace(/\s+/g, ' ').trim())) : null;
      if (fx) fx.click();
      const ordem = [...document.querySelectorAll('#app .os-client')].map(x => x.textContent);
      const fixou = !!(JSON.parse(localStorage.getItem('mappo_clientes') || '[]')
        .find(c => c.nome === n) || {}).fixado;
      /* EXCLUIR pelo menu */
      document.getElementById('modalRoot').innerHTML = '';
      const card2 = [...document.querySelectorAll('#app .os-card')]
        .find(c => ((c.querySelector('.os-client') || {}).textContent || '') === n);
      const bt2 = card2 ? [...card2.querySelectorAll('button')]
        .find(x => /menuCliente/.test(x.getAttribute('onclick') || '')) : null;
      if (bt2) bt2.click();
      const ex = [...document.querySelectorAll('#curOverlay .modal-body button')]
        .find(x => /^excluir$/i.test(x.textContent.replace(/\s+/g, ' ').trim()));
      if (ex) ex.click();
      window.removeEventListener('error', onerr);
      const out = { achouCartao: true, achouBotao: !!bt, abriu: abriu, ordem: ordem, fixou: fixou,
        aindaExiste: !!JSON.parse(localStorage.getItem('mappo_clientes') || '[]')
          .find(c => c.nome === n),
        cartoes: [...document.querySelectorAll('#app .os-client')].map(x => x.textContent),
        quebras: quebras };
      document.getElementById('modalRoot').innerHTML = '';
      return out;
    }, nome);
    const ctrl = nome === 'Nome Comum';
    console.log('  [' + nome + '] menu abriu:', r45.abriu, '| ordem apos fixar:',
      JSON.stringify(r45.ordem), '| erros:', r45.quebras.length ? r45.quebras : '(nenhum)');
    assert(r45.achouCartao && r45.achouBotao,
      (ctrl ? 'CONTROLE M13: ' : '') + 'o cartao de ' + JSON.stringify(nome) + ' tem o ⋮');
    assert(r45.abriu, (ctrl ? 'CONTROLE M13: ' : '') + 'o ⋮ de ' + JSON.stringify(nome) + ' abre o menu');
    assert(r45.ordem[0] === nome,
      (ctrl ? 'CONTROLE M13: ' : '') + 'fixar ' + JSON.stringify(nome) + ' leva ele ao topo');
    assert(r45.fixou === true,
      (ctrl ? 'CONTROLE M13: ' : '') + '`fixado` gravado no registro de ' + JSON.stringify(nome));
    assert(!r45.aindaExiste,
      (ctrl ? 'CONTROLE M13: ' : '') + 'excluir ' + JSON.stringify(nome) + ' apaga o cadastro dele');
    assert(r45.cartoes.indexOf('Vizinho Dele') >= 0,
      (ctrl ? 'CONTROLE M13: ' : '') + 'e o cliente do lado continua na lista');
    assert(!r45.quebras.length,
      (ctrl ? 'CONTROLE M13: ' : '') + 'nenhum erro de JS no caminho de ' + JSON.stringify(nome));
  }

  /* ══════════ CHECK 46 (M14): a FUSÃO não desfixa em silêncio ══════════ */
  /* Ausência de um lado não apaga o que existe do outro -- a mesma regra que já vale para
     endereço e contato na fusão. Sem isto, fundir a grafia fixada numa não fixada devolvia o
     cliente para o meio da lista sem o gestor pedir. */
  console.log('\n=== CHECK 46 (M14): fundir grafias -- o `fixado` da outra grafia sobrevive ===');
  const r46 = await pg.evaluate((d) => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'acme ar', endereco: 'Rua AC, 1', contato: '1' },
                { nome: 'ACME AR', endereco: '', contato: '', fixado: true }];
    osList = JSON.parse(JSON.stringify(d.os)); manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    openModalCliente('acme ar');
    document.getElementById('cNome').value = 'ACME AR';
    criarCliente('acme ar');          // o window.confirm global responde "sim" à fusão
    const gravados = JSON.parse(localStorage.getItem('mappo_clientes') || '[]');
    const out = { quantos: gravados.length, registro: gravados.find(c => c.nome === 'ACME AR') || null,
      ordem: [...document.querySelectorAll('#app .os-client')].map(x => x.textContent),
      osNoNome: osList.filter(o => o.cliente === 'ACME AR').length };
    document.getElementById('modalRoot').innerHTML = '';
    return out;
  }, { os: [osDe('ac1', 'acme ar', '2026-08-01'), osDe('ac2', 'ACME AR', '2026-08-02'),
            osDe('vz1', 'Vizinho Neutro', '2026-08-03')] });
  console.log('  registros gravados:', r46.quantos, '| sobrevivente:', JSON.stringify(r46.registro),
    '| ordem:', JSON.stringify(r46.ordem));
  assert(r46.quantos === 1, 'CONTROLE M14: a fusao deixou UM registro, nao dois');
  assert(r46.osNoNome === 2, 'CONTROLE M14: as 2 OS das duas grafias ficaram sob o nome unico');
  assert(!!r46.registro && r46.registro.fixado === true,
    'o `fixado` que so a outra grafia tinha SOBREVIVEU a fusao');
  assert(r46.ordem[0] === 'ACME AR', 'e o cliente fundido continua no topo');

  /* ══════════ CHECK 47 (M15): o cartão de cliente não tem mais emoji ══════════ */
  /* Regra do CLAUDE.md de 12/10/2026: ícone é silhueta do ICONS, nunca emoji colorido. O que
     esta entrega varre são os QUATRO emojis do cartão de cliente (endereço, telefone,
     concluídas, em aberto); os outros do arquivo são entrega própria.
     O CONTROLE POSITIVO é um LITERAL, e isso foi corrigido em 14/10/2026 (R10): até aqui ele
     afirmava que o DETALHE do cliente ainda tem emoji, isto é, apoiava-se num débito do
     produto. No dia em que o detalhe cumprisse a regra e trocasse o pino por svgIco, esta suíte
     ficaria VERMELHA POR TER SIDO CORRIGIDA -- teste que petrifica débito é teste que pune o
     acerto. O que o controle precisa provar é só que o detector enxerga emoji quando existe,
     e um literal prova isso sem depender de nada do app.
     O estado do detalhe continua MEDIDO e IMPRESSO no log, para ninguém perder o débito de
     vista -- mas não é afirmado, porque não é garantia desta entrega. */
  console.log('\n=== CHECK 47 (M15): o cartao de cliente usa icone do sistema, nao emoji ===');
  const r47 = await pg.evaluate(() => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Sem Emoji', endereco: 'Rua SE, 1', contato: '(49) 1234-5678' }];
    osList = []; manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const card = document.querySelector('#app .os-card');
    const out = { textoDoCartao: card.textContent, svgs: card.querySelectorAll('svg').length };
    openHistoricoCliente('Sem Emoji');
    const ov = document.getElementById('curOverlay');
    out.textoDoDetalhe = ov ? ov.querySelector('.modal-body').textContent : '';
    closeModal(); document.getElementById('modalRoot').innerHTML = '';
    return out;
  });
  const temEmoji = (s) => /\p{Extended_Pictographic}/u.test(s);
  console.log('  SVGs no cartao:', r47.svgs, '| emoji no cartao:', temEmoji(r47.textoDoCartao),
    '| emoji no detalhe (so medido, nao afirmado):', temEmoji(r47.textoDoDetalhe));
  assert(r47.svgs >= 5,
    'o cartao tem os 4 icones do sistema (endereco, telefone, concluidas, em aberto) mais o ⋮');
  assert(temEmoji('📍 x') && temEmoji('📞') && !temEmoji('Rua das Flores, 10 - Centro'),
    'CONTROLE M15: o detector de emoji ACHA emoji num literal e NAO acha em texto comum -- '
    + 'controle autossuficiente, que nao fica vermelho no dia em que o produto for corrigido');
  assert(!temEmoji(r47.textoDoCartao), 'nenhum emoji sobrou no cartao de cliente');

  /* ══════════ CHECK 48 (C2): excluir cliente que SÓ tem manutenção -- o aviso não mente ══════════ */
  /* `renderClientes` monta a lista de `osList` + `clientes`, NUNCA de `manutencoes`. Então o
     cliente com 1 manutenção e 0 OS DESAPARECE da lista quando o cadastro é excluído -- e a
     mensagem de 13/10/2026 prometia o contrário ("continua aparecendo na lista por causa desse
     histórico"). O gestor aceitava com base numa promessa falsa e perdia endereço, contato e o
     caminho de volta ao cartão. A manutenção em si sempre ficou intacta, e continua.
     CONTROLE POSITIVO embutido: o MESMO cliente, com 1 OS, recebe a mensagem que DIZ "continua
     aparecendo" -- sem ele, "a mensagem não promete" e "a sonda não lê a mensagem" seriam
     indistinguíveis de fora. A lista NÃO passou a agregar manutenções: isso faria aparecer
     cliente que hoje não aparece, é decisão de produto do proprietário, e está registrada. */
  console.log('\n=== CHECK 48 (C2): aviso de excluir com 1 manutencao e 0 OS -- diz que SAI da lista ===');
  const r48 = await pg.evaluate((d) => {
    document.getElementById('modalRoot').innerHTML = '';
    const medir = (cen) => {
      clientes = [{ nome: 'So Manutencao', endereco: 'Rua SM, 1', contato: '(49) 1111-2222' }];
      osList = JSON.parse(JSON.stringify(cen.os)); manutencoes = JSON.parse(JSON.stringify(cen.mn));
      saveClientes(); saveOS(); saveManut();
      nav('clientes');
      const antes = { mn: JSON.stringify(manutencoes), dMn: localStorage.getItem('mappo_manut'),
                      os: JSON.stringify(osList), dOs: localStorage.getItem('mappo_os') };
      const msgs = [], chaves = [];
      window.confirm = (m) => { msgs.push(m); return true; };
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { chaves.push(k); return orig.apply(this, arguments); };
      excluirCliente('So Manutencao');
      Storage.prototype.setItem = orig;
      window.confirm = () => true;
      const t = document.getElementById('toast');
      return { msg: msgs[0] || '', chaves: chaves, toast: t ? t.textContent : '',
        mnIgual: JSON.stringify(manutencoes) === antes.mn,
        dMnIgual: localStorage.getItem('mappo_manut') === antes.dMn,
        osIgual: JSON.stringify(osList) === antes.os,
        dOsIgual: localStorage.getItem('mappo_os') === antes.dOs,
        cartoes: [...document.querySelectorAll('#app .os-client')].map(x => x.textContent) };
    };
    const soManut = medir({ os: [], mn: d.mn });
    const comOs = medir({ os: d.os, mn: d.mn });
    document.getElementById('modalRoot').innerHTML = '';
    return { soManut: soManut, comOs: comOs };
  }, { mn: [manutDe('smm1', 'So Manutencao', '2026-12-10')],
       os: [osDe('smo1', 'So Manutencao', '2026-03-03')] });
  console.log('  so manutencao -- pergunta:', JSON.stringify(r48.soManut.msg));
  console.log('  so manutencao -- cartoes depois:', JSON.stringify(r48.soManut.cartoes),
    '| chaves gravadas:', JSON.stringify(r48.soManut.chaves), '| aviso:', JSON.stringify(r48.soManut.toast));
  console.log('  CONTROLE com 1 OS -- pergunta:', JSON.stringify(r48.comOs.msg));
  assert(r48.soManut.msg.length > 0, 'excluir cliente que so tem manutencao PERGUNTA antes');
  assert(/1 manutenç[ãa]o/.test(r48.soManut.msg), 'o aviso diz que existe 1 manutencao');
  assert(!/continua aparecendo na lista/i.test(r48.soManut.msg),
    'e NAO promete que o cliente continua aparecendo na lista -- porque ele sai');
  assert(/sai da lista/i.test(r48.soManut.msg),
    'a mensagem diz que ele SAI DA LISTA -- medido ' + JSON.stringify(r48.soManut.msg));
  assert(/continuam? agendada|aparecem? em Manuten/i.test(r48.soManut.msg),
    'e diz que a manutencao agendada continua existindo');
  assert(r48.soManut.cartoes.indexOf('So Manutencao') < 0,
    'medido NA TELA: o cartao desaparece mesmo -- a mensagem descreve o que de fato acontece');
  assert(r48.soManut.mnIgual && r48.soManut.dMnIgual,
    'a manutencao ficou byte a byte igual em memoria E no disco');
  assert(r48.soManut.chaves.indexOf('mappo_manut') < 0 && r48.soManut.chaves.indexOf('mappo_os') < 0,
    'nenhuma escrita em mappo_manut nem mappo_os -- medido ' + JSON.stringify(r48.soManut.chaves));
  assert(r48.soManut.chaves.indexOf('mappo_clientes') >= 0,
    'CONTROLE C2: a sonda de gravacao MEDIU algo -- mappo_clientes foi gravado');
  assert(!/o hist[óo]rico continua l[áa]/i.test(r48.soManut.toast),
    'e o aviso final nao diz "o historico continua la" num cartao que acabou de sair da lista');
  assert(/continua aparecendo na lista/i.test(r48.comOs.msg),
    'CONTROLE C2: com 1 OS a mensagem DIZ que continua aparecendo -- a sonda le a frase quando ela existe');
  assert(r48.comOs.cartoes.indexOf('So Manutencao') >= 0,
    'CONTROLE C2: e com OS o cartao de fato continua na lista');

  /* ══════════ CHECK 49 (C4): excluir cadastro de cliente FIXADO avisa que a fixação se perde ══════════ */
  /* Medido em 13/10/2026: cliente `fixado:true` com OS -- depois de excluir, o cartão continua
     (pelas OS) mas o alfinete some e ele sai do topo, e a mensagem enumerava só "endereço e
     contato". Perda silenciosa de uma escolha do gestor.
     CONTROLE NEGATIVO embutido: o mesmo cliente NÃO fixado não recebe a frase -- senão uma
     mensagem que falasse de fixação sempre passaria por este check sem medir nada. */
  console.log('\n=== CHECK 49 (C4): excluir cliente FIXADO -- o aviso diz que a fixacao se perde ===');
  const r49 = await pg.evaluate((d) => {
    document.getElementById('modalRoot').innerHTML = '';
    const medir = (fix) => {
      const reg = { nome: 'Fixado Com OS', endereco: 'Rua F, 1', contato: '(49) 3333-4444' };
      if (fix) reg.fixado = true;
      clientes = [reg, { nome: 'Outro Solto', endereco: 'Rua O, 2', contato: '5' }];
      osList = JSON.parse(JSON.stringify(d.os)); manutencoes = [];
      saveClientes(); saveOS(); saveManut();
      nav('clientes');
      const comAlfinete = () => [...document.querySelectorAll('#app .os-card')]
        .filter(c => !!c.querySelector('.os-client svg'))
        .map(c => (c.querySelector('.os-client') || {}).textContent);
      const alfineteAntes = comAlfinete();
      const ordemAntes = [...document.querySelectorAll('#app .os-client')].map(x => x.textContent);
      const msgs = [];
      window.confirm = (m) => { msgs.push(m); return true; };
      excluirCliente('Fixado Com OS');
      window.confirm = () => true;
      return { msg: msgs[0] || '', alfineteAntes: alfineteAntes, ordemAntes: ordemAntes,
        alfineteDepois: comAlfinete(),
        cartoes: [...document.querySelectorAll('#app .os-client')].map(x => x.textContent) };
    };
    const fixado = medir(true), solto = medir(false);
    document.getElementById('modalRoot').innerHTML = '';
    return { fixado: fixado, solto: solto };
  }, { os: [osDe('fo1', 'Fixado Com OS', '2026-06-06')] });
  console.log('  FIXADO -- pergunta:', JSON.stringify(r49.fixado.msg));
  console.log('  FIXADO -- alfinete antes:', JSON.stringify(r49.fixado.alfineteAntes),
    '| depois:', JSON.stringify(r49.fixado.alfineteDepois),
    '| cartoes depois:', JSON.stringify(r49.fixado.cartoes));
  console.log('  CONTROLE nao fixado -- pergunta:', JSON.stringify(r49.solto.msg));
  assert(r49.fixado.alfineteAntes.indexOf('Fixado Com OS') >= 0,
    'CONTROLE C4: o cliente estava de fato FIXADO antes -- alfinete no cartao');
  assert(r49.fixado.ordemAntes[0] === 'Fixado Com OS', 'CONTROLE C4: e estava no topo da lista');
  assert(/fixa[çc][ãa]o/i.test(r49.fixado.msg),
    'a mensagem avisa que a FIXACAO tambem se perde -- medido ' + JSON.stringify(r49.fixado.msg));
  assert(!/fixa[çc][ãa]o/i.test(r49.solto.msg),
    'CONTROLE C4: cliente NAO fixado -- a mensagem nao fala de fixacao');
  assert(r49.fixado.alfineteDepois.indexOf('Fixado Com OS') < 0,
    'medido: depois de excluir o alfinete some mesmo, e a mensagem avisou');
  assert(r49.fixado.cartoes.indexOf('Fixado Com OS') >= 0,
    'e o cartao continua na lista pelas OS -- excluir cadastro nao apaga historico');

  /* ══════════ CHECK 50 (C3a): fixar NÃO cria cliente sem nome visível ══════════ */
  /* `fixarCliente` era o ÚNICO caminho do app que criava registro de cliente sem passar por
     nenhuma guarda do cadastro. Medido em 13/10/2026: fixar um nome feito só de caractere
     invisível gravava {"nome":"<invisível>"} -- exatamente o que `criarCliente` recusa, porque
     `trim()` não tira largura zero.
     CONTROLE POSITIVO: o caminho legítimo continua -- fixar um cliente que existe só nas OS,
     com nome visível, CRIA o registro (é o CHECK 40, repetido aqui de propósito: sem ele, uma
     guarda que recusasse TUDO passaria por este check). */
  console.log('\n=== CHECK 50 (C3a): fixar nome invisivel NAO cria registro; nome visivel cria ===');
  const r50 = await pg.evaluate(() => {
    document.getElementById('modalRoot').innerHTML = '';
    const INVIS = '​';
    const medir = (nome) => {
      clientes = [];
      osList = [{ id: 'iv1', cliente: nome, endereco: 'Rua I, 1', tipo: 'Instalacao',
        tecnico: 'Paulo', data: '2026-04-04', hora: '08:00', status: 'concluida', qtdSplits: 1,
        equipamentos: [{ marca: '', modelo: '', fotoEvap: null, fotoCond: null }], checklist: [] }];
      manutencoes = [];
      saveClientes(); saveOS(); saveManut();
      nav('clientes');
      const t0 = document.getElementById('toast'); t0.textContent = ''; t0.className = 'toast';
      const chaves = [];
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { chaves.push(k); return orig.apply(this, arguments); };
      fixarCliente(nome);
      Storage.prototype.setItem = orig;
      const t = document.getElementById('toast');
      return { quantos: clientes.length, nomes: clientes.map(c => c.nome), chaves: chaves,
               toast: t.textContent, disco: localStorage.getItem('mappo_clientes') };
    };
    const invisivel = medir(INVIS), visivel = medir('Nome Visivel');
    document.getElementById('modalRoot').innerHTML = '';
    return { invisivel: invisivel, visivel: visivel };
  });
  console.log('  invisivel -- registros:', r50.invisivel.quantos, '| chaves:',
    JSON.stringify(r50.invisivel.chaves), '| aviso:', JSON.stringify(r50.invisivel.toast));
  console.log('  CONTROLE visivel -- registros:', r50.visivel.quantos, '| nomes:',
    JSON.stringify(r50.visivel.nomes), '| chaves:', JSON.stringify(r50.visivel.chaves));
  assert(r50.invisivel.quantos === 0,
    'fixar um nome so de caractere invisivel NAO cria registro -- medido ' + JSON.stringify(r50.invisivel.nomes));
  assert(r50.invisivel.chaves.indexOf('mappo_clientes') < 0,
    'e nada e gravado no disco -- medido ' + JSON.stringify(r50.invisivel.chaves));
  assert(r50.invisivel.toast.length > 0 && /nome/i.test(r50.invisivel.toast),
    'o gestor e avisado do porque, nao fica no silencio -- medido ' + JSON.stringify(r50.invisivel.toast));
  assert(r50.visivel.quantos === 1 && r50.visivel.nomes[0] === 'Nome Visivel',
    'CONTROLE C3a: o caminho legitimo continua -- cliente so nas OS ganha registro ao ser fixado');
  assert(r50.visivel.chaves.indexOf('mappo_clientes') >= 0,
    'CONTROLE C3a: e esse caminho de fato grava -- a sonda de gravacao mede');

  /* ══════════ CHECK 51 (C3b): fixar NÃO cria segundo registro que normaliza igual ══════════ */
  /* Medido em 13/10/2026: com `clientes` = ["Acme"] e as OS em "ACME", fixar "ACME" deixava
     ["Acme","ACME"] -- dois registros que normalizam igual, que o próprio código chama de dado
     corrompido (ver _clienteNomeEmUsoAoCriar). Agora recusa, nomeia a grafia que já existe e
     manda para "Editar", que é quem PERGUNTA antes de fundir histórico.
     CONTROLE POSITIVO: fixar a grafia que TEM registro continua funcionando e gravando. */
  console.log('\n=== CHECK 51 (C3b): fixar outra grafia NAO cria segundo registro ===');
  const r51 = await pg.evaluate((d) => {
    document.getElementById('modalRoot').innerHTML = '';
    const medir = (nome) => {
      clientes = [{ nome: 'Acme', endereco: 'Rua A, 1', contato: '(49) 5555-6666' }];
      osList = JSON.parse(JSON.stringify(d.os)); manutencoes = [];
      saveClientes(); saveOS(); saveManut();
      nav('clientes');
      const t0 = document.getElementById('toast'); t0.textContent = ''; t0.className = 'toast';
      const chaves = [];
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { chaves.push(k); return orig.apply(this, arguments); };
      fixarCliente(nome);
      Storage.prototype.setItem = orig;
      const t = document.getElementById('toast');
      return { quantos: clientes.length, nomes: clientes.map(c => c.nome), chaves: chaves,
               toast: t.textContent, fixados: clientes.filter(c => c.fixado).map(c => c.nome),
               discoNomes: JSON.parse(localStorage.getItem('mappo_clientes') || '[]').map(c => c.nome) };
    };
    const outraGrafia = medir('ACME'), grafiaDoRegistro = medir('Acme');
    document.getElementById('modalRoot').innerHTML = '';
    return { outraGrafia: outraGrafia, grafiaDoRegistro: grafiaDoRegistro };
  }, { os: [osDe('ac9', 'ACME', '2026-05-05')] });
  console.log('  fixar "ACME" com registro "Acme" -- registros:', JSON.stringify(r51.outraGrafia.nomes),
    '| disco:', JSON.stringify(r51.outraGrafia.discoNomes), '| chaves:', JSON.stringify(r51.outraGrafia.chaves),
    '| aviso:', JSON.stringify(r51.outraGrafia.toast));
  console.log('  CONTROLE fixar "Acme" -- fixados:', JSON.stringify(r51.grafiaDoRegistro.fixados),
    '| registros:', JSON.stringify(r51.grafiaDoRegistro.nomes));
  assert(r51.outraGrafia.quantos === 1 && r51.outraGrafia.nomes[0] === 'Acme',
    'fixar outra grafia NAO cria segundo registro -- medido ' + JSON.stringify(r51.outraGrafia.nomes));
  assert(r51.outraGrafia.discoNomes.length === 1,
    'e no disco tambem continua UM registro -- medido ' + JSON.stringify(r51.outraGrafia.discoNomes));
  assert(r51.outraGrafia.chaves.indexOf('mappo_clientes') < 0,
    'nada foi gravado -- medido ' + JSON.stringify(r51.outraGrafia.chaves));
  assert(/Acme/.test(r51.outraGrafia.toast) && /Editar/i.test(r51.outraGrafia.toast),
    'o aviso nomeia a grafia que ja existe e manda para "Editar" -- medido ' + JSON.stringify(r51.outraGrafia.toast));
  assert(r51.grafiaDoRegistro.fixados.length === 1 && r51.grafiaDoRegistro.fixados[0] === 'Acme',
    'CONTROLE C3b: fixar a grafia QUE TEM registro continua funcionando');
  assert(r51.grafiaDoRegistro.chaves.indexOf('mappo_clientes') >= 0,
    'CONTROLE C3b: e esse caminho grava -- a sonda de gravacao mede');

  /* ╔══════════════════════════════════════════════════════════════════════════════════════╗
     ║  CHECKS 52 a 57 (R): AS LACUNAS DE REDE DA RODADA 2 -- 14/10/2026                    ║
     ║  Nenhuma delas é defeito vivo: o código está CERTO nas seis. O que faltava era o      ║
     ║  caso que REPROVA se a garantia voltar atrás, e a camada de mutação provou a lacuna   ║
     ║  desfazendo cada uma com a suíte inteira verde.                                      ║
     ║  COMO ESTES SEIS FORAM PROVADOS, e por que NÃO é "falha na árvore anterior": na      ║
     ║  árvore anterior o código já estava certo, então exigir vermelho lá seria exigir o    ║
     ║  impossível -- e um caso que fica verde nas duas árvores por esse motivo não é caso   ║
     ║  que só reclama, é caso de REGRESSÃO FUTURA. A prova é por MUTAÇÃO, medida em          ║
     ║  14/10/2026 numa cópia da árvore (nunca no arquivo vivo) com as oito garantias         ║
     ║  desfeitas de propósito, uma linha cada:                                             ║
     ║    - a suíte ANTERIOR, contra essa cópia mutada: 1 assert vermelho -- e esse 1 era o  ║
     ║      do contraste do Excluir (R4), não mutação nenhuma. Quer dizer: ela era CEGA às   ║
     ║      oito;                                                                           ║
     ║    - esta suíte, contra a mesma cópia: 30 asserts vermelhos, distribuídos assim --    ║
     ║      CHECK 38 fechamento do menu 1; CHECK 52 (excluir) 8; CHECK 53 (fixar/desafixar/  ║
     ║      criar registro) 12; CHECK 54 (XSS no h2) 3; CHECK 55 (plural) 2; CHECK 56        ║
     ║      (ícone com cor) 1; CHECK 57 (nome acessível) 3.                                 ║
     ║  Controle positivo da medição instrumentada: a MESMA cópia instrumentada contra a     ║
     ║  árvore de agora devolve 0 vermelhos, e contra a árvore anterior devolve 41 (que são  ║
     ║  os do R1 a R4). Sem esses dois números, "30 vermelhos" não diria nada.               ║
     ╚══════════════════════════════════════════════════════════════════════════════════════╝ */

  /* ══════════ CHECK 52 (R5a): o disco recusa ao EXCLUIR -- o cliente não some da tela ══════════ */
  /* O `catch` de excluirCliente desfaz o splice e avisa. Sem rede, uma mutação que engolisse o
     erro (ou que não devolvesse o registro à posição dele) deixava o cliente SUMIR DA TELA e
     FICAR NO DISCO: o gestor via "excluído", nenhum aviso, e o cliente ressuscitava na próxima
     recarga. É a família que o CLAUDE.md chama de "ausência não é instrução de apagar", do lado
     oposto -- aqui a presença no disco é que não pode virar ausência na tela.
     A POSIÇÃO importa: `clientes.splice(i,0,reg)` devolve o registro ao lugar, e a comparação é
     da string JSON inteira, que mede ordem. */
  console.log('\n=== CHECK 52 (R5a): o disco recusa ao excluir -- nada muda, e o gestor e AVISADO ===');
  const r52 = await pg.evaluate(() => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Primeiro', endereco: 'Rua P, 1', contato: '1' },
                { nome: 'Some Da Tela', endereco: 'Rua S, 2', contato: '2' },
                { nome: 'Terceiro', endereco: 'Rua T, 3', contato: '3' }];
    osList = []; manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    const antes = { cl: JSON.stringify(clientes), dCl: localStorage.getItem('mappo_clientes') };
    nav('clientes');
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === 'mappo_clientes') { const e = new Error('cota estourada (teste)'); e.name = 'QuotaExceededError'; throw e; }
      return orig.apply(this, arguments);
    };
    let lancou = '';
    menuCliente('Some Da Tela');
    try { excluirCliente('Some Da Tela'); } catch (e) { lancou = (e.name || 'Erro') + ': ' + e.message; }
    Storage.prototype.setItem = orig;
    const t = document.getElementById('toast');
    const ov = document.getElementById('curOverlay');
    const out = { lancou: lancou,
      toast: t ? t.textContent : '', toastVisivel: !!(t && t.className.indexOf('show') >= 0),
      memIgual: JSON.stringify(clientes) === antes.cl,
      nomes: clientes.map(c => c.nome),
      discoIgual: localStorage.getItem('mappo_clientes') === antes.dCl,
      discoNomes: JSON.parse(localStorage.getItem('mappo_clientes') || '[]').map(c => c.nome),
      cartoes: [...document.querySelectorAll('#app .os-client')].map(x => x.textContent),
      menuAberto: !!(ov && ov.classList.contains('open')),
      avisoMemoria: _avisoMemoriaAberto === true };
    _fecharAvisoMemoria();
    document.getElementById('modalRoot').innerHTML = '';
    return out;
  });
  console.log('  memoria:', JSON.stringify(r52.nomes), '| disco:', JSON.stringify(r52.discoNomes));
  console.log('  cartoes na tela:', JSON.stringify(r52.cartoes), '| aviso:', JSON.stringify(r52.toast),
    '| modal de memoria:', r52.avisoMemoria, '| estourou para quem clicou:', r52.lancou || '(nao)');
  assert(r52.memIgual,
    'o disco recusando, `clientes` fica byte a byte igual em MEMORIA -- medido ' + JSON.stringify(r52.nomes));
  assert(r52.discoIgual, 'e byte a byte igual no DISCO (mappo_clientes)');
  assert(r52.nomes.length === 3 && r52.nomes[1] === 'Some Da Tela',
    'o registro volta para a MESMA POSICAO do array, nao para o fim');
  assert(r52.cartoes.indexOf('Some Da Tela') >= 0,
    'o cartao dele CONTINUA na tela -- sumir da tela e ficar no disco e o defeito que este caso existe para pegar');
  assert(r52.toastVisivel && /mem[óo]ria do aparelho cheia/i.test(r52.toast),
    'o gestor E AVISADO, nunca fica mudo -- medido ' + JSON.stringify(r52.toast));
  assert(/N[ÃA]O foi exclu[íi]do/i.test(r52.toast),
    'e o aviso diz exatamente o que NAO aconteceu -- medido ' + JSON.stringify(r52.toast));
  assert(r52.avisoMemoria, 'na cota, o modal bloqueante de memoria cheia tambem abre');
  assert(r52.menuAberto, 'o menu NAO fecha quando a exclusao falha -- fechar se leria como "deu certo"');
  assert(!r52.lancou, 'o erro nao sobe cru para quem clicou');

  /* CONTROLE POSITIVO do 52: com o setItem funcionando, a MESMA exclusão grava. Sem ele, o caso
     acima passaria por qualquer motivo que impedisse a exclusão -- inclusive um defeito novo. */
  const r52b = await pg.evaluate(() => {
    document.getElementById('modalRoot').innerHTML = '';
    nav('clientes');
    excluirCliente('Some Da Tela');
    const out = { nomes: clientes.map(c => c.nome),
      discoNomes: JSON.parse(localStorage.getItem('mappo_clientes') || '[]').map(c => c.nome),
      toast: (document.getElementById('toast') || {}).textContent || '' };
    document.getElementById('modalRoot').innerHTML = '';
    return out;
  });
  console.log('  [controle] setItem normal -> memoria:', JSON.stringify(r52b.nomes),
    '| disco:', JSON.stringify(r52b.discoNomes), '| aviso:', JSON.stringify(r52b.toast));
  assert(r52b.nomes.indexOf('Some Da Tela') < 0 && r52b.discoNomes.indexOf('Some Da Tela') < 0,
    'CONTROLE R5a: com o setItem funcionando, a mesma exclusao de fato grava (memoria e disco)');

  /* ══════════ CHECK 53 (R5b): o disco recusa ao FIXAR, DESAFIXAR e ao CRIAR registro ══════════ */
  /* Três caminhos, e o terceiro é o que mais importa: fixar cliente que só existe nas OS CRIA
     registro, e uma falha ali sem desfazer deixava um registro FANTASMA em memória -- presente
     na tela com alfinete, ausente do disco, e some na recarga. Erro genérico (TypeError) de
     propósito: a cota já é medida no 52, e o ramo não-cota do _avisarFalhaCliente é outro. */
  console.log('\n=== CHECK 53 (R5b): o disco recusa ao fixar/desafixar/criar registro -- nada muda, e avisa ===');
  const r53 = await pg.evaluate((d) => {
    const cenario = (nome, cls, os, prepara) => {
      document.getElementById('modalRoot').innerHTML = '';
      clientes = JSON.parse(JSON.stringify(cls));
      osList = JSON.parse(JSON.stringify(os)); manutencoes = [];
      saveClientes(); saveOS(); saveManut();
      const antes = { cl: JSON.stringify(clientes), dCl: localStorage.getItem('mappo_clientes') };
      nav('clientes');
      if (prepara) prepara();
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === 'mappo_clientes') throw new TypeError('o disco recusou (teste)');
        return orig.apply(this, arguments);
      };
      let lancou = '';
      menuCliente(nome);
      try { fixarCliente(nome); } catch (e) { lancou = (e.name || 'Erro') + ': ' + e.message; }
      Storage.prototype.setItem = orig;
      const t = document.getElementById('toast');
      const ov = document.getElementById('curOverlay');
      const out = { lancou: lancou, toast: t ? t.textContent : '',
        toastVisivel: !!(t && t.className.indexOf('show') >= 0),
        memIgual: JSON.stringify(clientes) === antes.cl,
        discoIgual: localStorage.getItem('mappo_clientes') === antes.dCl,
        quantos: clientes.length, fixados: clientes.filter(c => c.fixado).map(c => c.nome),
        temChaveFixado: clientes.some(c => Object.prototype.hasOwnProperty.call(c, 'fixado')),
        menuAberto: !!(ov && ov.classList.contains('open')),
        avisoMemoria: _avisoMemoriaAberto === true };
      _fecharAvisoMemoria();
      document.getElementById('modalRoot').innerHTML = '';
      return out;
    };
    const fixar = cenario('Vai Fixar', [{ nome: 'Vai Fixar', endereco: 'Rua F, 1', contato: '1' }], []);
    const desafixar = cenario('Ja Fixado', [{ nome: 'Ja Fixado', endereco: 'Rua J, 1', contato: '2', fixado: true }], []);
    const criaRegistro = cenario('Somente nas OS', [], d.os);
    return { fixar: fixar, desafixar: desafixar, criaRegistro: criaRegistro };
  }, { os: [osDe('fx1', 'Somente nas OS', '2026-03-03')] });
  for (const [rot, r] of [['fixar', r53.fixar], ['desafixar', r53.desafixar], ['cria registro', r53.criaRegistro]]) {
    console.log('  [' + rot + '] memoria igual:', r.memIgual, '| disco igual:', r.discoIgual,
      '| registros:', r.quantos, '| fixados:', JSON.stringify(r.fixados),
      '| aviso:', JSON.stringify(r.toast), '| menu aberto:', r.menuAberto);
    assert(r.memIgual, '[' + rot + '] o disco recusando, `clientes` fica byte a byte igual em MEMORIA');
    assert(r.discoIgual, '[' + rot + '] e byte a byte igual no DISCO');
    assert(r.toastVisivel, '[' + rot + '] o gestor E AVISADO -- o `catch` nunca volta mudo');
    assert(/N[ÃA]O foi (fixado|desafixado)/i.test(r.toast),
      '[' + rot + '] e o aviso diz o que NAO aconteceu -- medido ' + JSON.stringify(r.toast));
    assert(!/mem[óo]ria do aparelho cheia/i.test(r.toast) && !r.avisoMemoria,
      '[' + rot + '] falha que NAO e de cota nao fala de memoria cheia nem abre o modal bloqueante');
    assert(r.menuAberto, '[' + rot + '] o menu NAO fecha quando a gravacao falha');
    assert(!r.lancou, '[' + rot + '] o erro nao sobe cru para quem clicou');
  }
  assert(!r53.fixar.temChaveFixado,
    'fixar e falhar NAO deixa a chave `fixado` no registro -- medido ' + JSON.stringify(r53.fixar.fixados));
  assert(r53.desafixar.fixados.length === 1 && r53.desafixar.fixados[0] === 'Ja Fixado',
    'desafixar e falhar deixa o cliente AINDA FIXADO -- o alfinete nao mente sobre o disco');
  assert(r53.criaRegistro.quantos === 0,
    'fixar cliente que so existe nas OS e falhar NAO deixa registro FANTASMA em memoria -- medido '
    + r53.criaRegistro.quantos + ' registro(s)');

  /* CONTROLE POSITIVO do 53: com o setItem funcionando, os três caminhos de fato gravam. */
  const r53b = await pg.evaluate((d) => {
    const cenario = (nome, cls, os) => {
      document.getElementById('modalRoot').innerHTML = '';
      clientes = JSON.parse(JSON.stringify(cls));
      osList = JSON.parse(JSON.stringify(os)); manutencoes = [];
      saveClientes(); saveOS(); saveManut();
      nav('clientes');
      fixarCliente(nome);
      const disco = JSON.parse(localStorage.getItem('mappo_clientes') || '[]');
      const out = { fixados: clientes.filter(c => c.fixado).map(c => c.nome),
        discoFixados: disco.filter(c => c.fixado).map(c => c.nome), quantos: clientes.length };
      document.getElementById('modalRoot').innerHTML = '';
      return out;
    };
    return { fixar: cenario('Vai Fixar', [{ nome: 'Vai Fixar', endereco: 'Rua F, 1', contato: '1' }], []),
      desafixar: cenario('Ja Fixado', [{ nome: 'Ja Fixado', endereco: 'Rua J, 1', contato: '2', fixado: true }], []),
      criaRegistro: cenario('Somente nas OS', [], d.os) };
  }, { os: [osDe('fx2', 'Somente nas OS', '2026-03-04')] });
  console.log('  [controle] setItem normal -> fixar:', JSON.stringify(r53b.fixar.discoFixados),
    '| desafixar:', JSON.stringify(r53b.desafixar.discoFixados),
    '| cria registro:', r53b.criaRegistro.quantos, JSON.stringify(r53b.criaRegistro.discoFixados));
  assert(r53b.fixar.discoFixados.length === 1 && r53b.desafixar.discoFixados.length === 0
    && r53b.criaRegistro.quantos === 1 && r53b.criaRegistro.discoFixados.length === 1,
    'CONTROLE R5b: com o setItem funcionando, fixar, desafixar e criar registro de fato gravam no disco');

  /* ══════════ CHECK 54 (R6): nome com HTML no menu ⋮ aparece LITERAL ══════════ */
  /* O `<h2>` do menuCliente é sumidouro NOVO: a suíte varre o nome no cartão (CHECK 18) e o
     contato (CHECK 17), e nenhum dos dois passa por aqui. Com escapeHtml trocado por
     interpolação crua, o nome do cliente -- dado que o gestor digita -- nasce como MARCAÇÃO
     dentro de um modal, e o `onerror` de um `<img>` roda. */
  console.log('\n=== CHECK 54 (R6): nome com HTML no menu de tres pontos aparece literal ===');
  const XSS = '<img src=x onerror="window.__xssMenu=1">Loja &amp; Cia <b>teste</b>';
  const r54 = await pg.evaluate((nome) => {
    document.getElementById('modalRoot').innerHTML = '';
    delete window.__xssMenu; delete window.__xssCtrl;
    clientes = [{ nome: nome, endereco: 'Rua XS, 1', contato: '(49) 1111-2222' }];
    osList = []; manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    menuCliente(nome);
    const ov = document.getElementById('curOverlay');
    const h2 = ov.querySelector('.modal-head h2');
    /* CONTROLE POSITIVO da sonda: a MESMA string, posta como innerHTML, CRIA elementos.
       Sem isto, "0 elementos" e "a sonda nao conta elementos" seriam indistinguiveis. */
    const ctrl = document.createElement('div');
    ctrl.innerHTML = nome.replace('__xssMenu', '__xssCtrl');
    return { aberto: ov.classList.contains('open'),
      filhos: h2.querySelectorAll('*').length, texto: h2.textContent,
      imgs: h2.querySelectorAll('img').length,
      ctrlFilhos: ctrl.querySelectorAll('*').length, ctrlImgs: ctrl.querySelectorAll('img').length };
  }, XSS);
  await pg.waitForTimeout(400);     // o onerror de um <img src=x> é assíncrono
  const r54b = await pg.evaluate(() => {
    const out = { disparou: window.__xssMenu === 1, ctrlDisparou: window.__xssCtrl === 1 };
    closeModal(); document.getElementById('modalRoot').innerHTML = '';
    return out;
  });
  console.log('  h2 -> filhos:', r54.filhos, '| <img>:', r54.imgs, '| onerror disparou:', r54b.disparou);
  console.log('  [controle] a mesma string como innerHTML -> filhos:', r54.ctrlFilhos,
    '| <img>:', r54.ctrlImgs, '| onerror do controle disparou:', r54b.ctrlDisparou);
  assert(r54.aberto, 'CONTROLE R6: o menu de tres pontos esta aberto (classe open em #curOverlay)');
  assert(r54.ctrlFilhos >= 2 && r54.ctrlImgs === 1,
    'CONTROLE R6: a MESMA string posta como innerHTML cria elementos -- a sonda enxerga marcacao quando existe');
  assert(r54.filhos === 0 && r54.imgs === 0,
    'nenhum elemento nasceu dentro do h2 do menu -- medido ' + r54.filhos + ' filho(s)');
  assert(r54.texto === XSS, 'o nome aparece LITERAL, caractere por caractere -- medido ' + JSON.stringify(r54.texto));
  assert(!r54b.disparou, 'e nenhum onerror do nome rodou');

  /* ══════════ CHECK 55 (R7): o TOAST de excluir, nos três casos, e o plural ══════════ */
  /* Antes desta rodada o toast final de excluirCliente só era afirmado por NEGAÇÃO num caso
     (CHECK 48: "nao diz que o historico continua la"). Os três textos positivos e os ramos
     PLURAIS -- de pergunta e de toast -- não tinham cenário nenhum: uma mutação que trocasse
     "as manutenções continuam agendadas" por "a manutenção continua agendada" ficava verde. */
  console.log('\n=== CHECK 55 (R7): o toast de excluir nos tres casos, e o plural de manutencoes ===');
  const r55 = await pg.evaluate((d) => {
    const cenario = (nome, os, mn) => {
      document.getElementById('modalRoot').innerHTML = '';
      clientes = [{ nome: nome, endereco: 'Rua E, 1', contato: '0' }];
      osList = JSON.parse(JSON.stringify(os)); manutencoes = JSON.parse(JSON.stringify(mn));
      saveClientes(); saveOS(); saveManut();
      nav('clientes');
      const msgs = [];
      window.confirm = (m) => { msgs.push(m); return true; };
      excluirCliente(nome);
      window.confirm = () => true;
      const t = document.getElementById('toast');
      const out = { msg: msgs[0] || '', toast: t ? t.textContent : '',
        toastVisivel: !!(t && t.className.indexOf('show') >= 0) };
      document.getElementById('modalRoot').innerHTML = '';
      return out;
    };
    return {
      comOs: cenario('Com Tres OS', d.os3, []),
      soManut1: cenario('So Uma Manut', [], d.mn1),
      soManut2: cenario('So Duas Manut', [], d.mn2),
      semNada: cenario('Sem Nada', [], []),
      doisEDois: cenario('Dois E Dois', d.os2, d.mn2d)
    };
  }, {
    os3: [1, 2, 3].map(i => osDe('t3' + i, 'Com Tres OS', '2026-0' + i + '-15')),
    os2: [1, 2].map(i => osDe('t2' + i, 'Dois E Dois', '2026-0' + i + '-16')),
    mn1: [manutDe('tm1', 'So Uma Manut', '2026-11-01')],
    mn2: [manutDe('tm2', 'So Duas Manut', '2026-11-02'), manutDe('tm3', 'So Duas Manut', '2026-12-02')],
    mn2d: [manutDe('td1', 'Dois E Dois', '2026-11-03'), manutDe('td2', 'Dois E Dois', '2026-12-03')]
  });
  for (const [rot, r] of [['com OS', r55.comOs], ['1 manut', r55.soManut1], ['2 manut', r55.soManut2],
                          ['sem nada', r55.semNada], ['2 OS + 2 manut', r55.doisEDois]]) {
    console.log('  [' + rot + '] pergunta:', JSON.stringify(r.msg.slice(0, 120)));
    console.log('  [' + rot + '] toast:', JSON.stringify(r.toast));
    assert(r.toastVisivel, '[' + rot + '] o toast final de fato APARECEU na tela');
  }
  assert(/hist[óo]rico continua l[áa]/i.test(r55.comOs.toast),
    'com OS, o toast diz que o historico continua la -- medido ' + JSON.stringify(r55.comOs.toast));
  assert(/saiu da lista/i.test(r55.soManut1.toast) && /a manuten[çc][ãa]o continua agendada/i.test(r55.soManut1.toast),
    'com 1 manutencao e 0 OS, o toast diz que saiu da lista e usa o SINGULAR -- medido '
    + JSON.stringify(r55.soManut1.toast));
  assert(/saiu da lista/i.test(r55.soManut2.toast) && /as manuten[çc][õo]es continuam agendadas/i.test(r55.soManut2.toast),
    'com 2 manutencoes e 0 OS, o toast usa o PLURAL -- medido ' + JSON.stringify(r55.soManut2.toast));
  assert(/As manuten[çc][õo]es continuam agendadas e aparecem/i.test(r55.soManut2.msg),
    'e a PERGUNTA tambem usa o plural -- medido ' + JSON.stringify(r55.soManut2.msg));
  assert(/A manuten[çc][ãa]o continua agendada e aparece/i.test(r55.soManut1.msg),
    'CONTROLE R7: com 1 manutencao a pergunta usa o SINGULAR -- o par que prova que o ramo e escolhido, nao fixo');
  assert(/^Cliente exclu[íi]do$/i.test(r55.semNada.toast.trim()),
    'sem OS e sem manutencao, o toast e so "Cliente excluido" -- medido ' + JSON.stringify(r55.semNada.toast));
  assert(/\b2 OS\b/.test(r55.doisEDois.msg) && /2 manuten[çc][õo]es/.test(r55.doisEDois.msg),
    'com 2 OS e 2 manutencoes a pergunta diz "2 OS e 2 manutencoes", no plural -- medido '
    + JSON.stringify(r55.doisEDois.msg));
  assert(/hist[óo]rico continua l[áa]/i.test(r55.doisEDois.toast),
    'e o toast desse caso e o de quem TEM OS -- medido ' + JSON.stringify(r55.doisEDois.toast));

  /* ══════════ CHECK 56 (R8): a regra dos ícones ganha MECANISMO ══════════ */
  /* O CLAUDE.md diz "ícone é silhueta, nunca cor própria", e o próprio CLAUDE.md diz que regra
     sem mecanismo é decoração. Medido pela camada de mutação: trocar um ícone do ICONS para
     ter `fill="#ff0000"` deixava a suíte INTEIRA verde. Este check é o mecanismo.
     Varre o ICONS do app rodando -- não o texto do arquivo -- então comentário não entra na
     conta, e um ícone novo é varrido no dia em que nascer, sem ninguém se lembrar. */
  console.log('\n=== CHECK 56 (R8): nenhum icone do ICONS tem cor propria ===');
  const r56 = await pg.evaluate(() => {
    const COR = /\bfill\s*=|\bstroke\s*=|\bcolor\s*=|\bstyle\s*=|#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(/;
    const nomes = Object.keys(ICONS);
    const comCor = nomes.filter(n => COR.test(ICONS[n]));
    const vazios = nomes.filter(n => !ICONS[n] || !String(ICONS[n]).trim());
    /* CONTROLE POSITIVO da busca: um icone FORJADO com fill tem de ser pego. Resultado negativo
       exige controle positivo -- uma expressao que nao casa com nada devolve a mesma lista vazia
       que uma expressao certa num conjunto limpo. */
    const forjados = ['<path fill="#ff0000" d="M0 0"/>', '<circle stroke="red" cx="1" cy="1" r="1"/>',
                      '<path style="fill:#0f0" d="M0 0"/>', '<rect fill="rgb(255,0,0)" x="0" y="0"/>'];
    const pegou = forjados.filter(s => COR.test(s)).length;
    /* os tres pontos sao LINHAS DEGENERADAS, nao circulos: x1===x2 e o comprimento e ~zero, e o
       stroke-linecap:round do .ico transforma cada uma num ponto redondo. O app usa 0.01 de
       diferenca (igual ao icone `mobile`), nao zero exato -- linha de comprimento zero exato
       nao e desenhada por parte dos motores. */
    const at = (s, a) => { const m = s.match(new RegExp('\\b' + a + '="([^"]*)"')); return m ? parseFloat(m[1]) : NaN; };
    const linhas = (String(ICONS['tres-pontos']).match(/<line[^>]*>/g) || []);
    const degeneradas = linhas.filter(l => at(l, 'x1') === at(l, 'x2')
      && Math.abs(at(l, 'y2') - at(l, 'y1')) > 0 && Math.abs(at(l, 'y2') - at(l, 'y1')) <= 0.05);
    /* o SVG montado tambem nao pode ganhar cor pelo caminho do svgIco */
    const montado = svgIco('tres-pontos', 'ico-sm');
    const sonda = document.createElement('div');
    sonda.innerHTML = montado;
    document.body.appendChild(sonda);
    const est = getComputedStyle(sonda.querySelector('svg'));
    const out = { quantos: nomes.length, comCor: comCor, vazios: vazios, pegou: pegou,
      linhas: linhas.length, degeneradas: degeneradas.length,
      alfineteIgualPin: ICONS.alfinete === ICONS.pin,
      montadoComCor: COR.test(montado.replace(/class="[^"]*"/, '')),
      fill: est.fill, stroke: est.stroke };
    sonda.remove();
    return out;
  });
  console.log('  icones varridos:', r56.quantos, '| com cor propria:', JSON.stringify(r56.comCor),
    '| vazios:', JSON.stringify(r56.vazios));
  console.log('  [controle] icones FORJADOS com cor que a busca pegou:', r56.pegou, '/4');
  console.log('  tres-pontos:', r56.linhas, 'linhas,', r56.degeneradas, 'degeneradas | alfinete === pin:',
    r56.alfineteIgualPin, '| .ico computado: fill', r56.fill, 'stroke', r56.stroke);
  assert(r56.quantos >= 35, 'CONTROLE R8: a varredura MEDIU o ICONS inteiro -- ' + r56.quantos + ' icones');
  assert(r56.pegou === 4,
    'CONTROLE R8: a busca pega os 4 icones FORJADOS com cor -- medido ' + r56.pegou
    + '/4 (sem este controle, "nenhum com cor" e "a busca nao acha cor" seriam a mesma coisa)');
  assert(r56.comCor.length === 0,
    'nenhum icone do ICONS tem fill, stroke, style nem cor literal -- medido ' + JSON.stringify(r56.comCor));
  assert(r56.vazios.length === 0, 'e nenhum icone esta vazio -- medido ' + JSON.stringify(r56.vazios));
  assert(!r56.montadoComCor, 'o svgIco tambem nao acrescenta cor ao montar o SVG');
  assert(r56.fill === 'none' && /currentcolor|rgb/i.test(r56.stroke),
    'o .ico herda a cor do contexto: fill none e stroke do texto -- medido fill ' + r56.fill
    + ', stroke ' + r56.stroke);
  assert(r56.linhas === 3 && r56.degeneradas === 3,
    'o ⋮ sao TRES linhas degeneradas (x1===x2, comprimento quase zero), nao circulos -- medido '
    + r56.linhas + ' linhas, ' + r56.degeneradas + ' degeneradas');
  assert(!r56.alfineteIgualPin,
    'o alfinete de "fixado" e DESENHO DIFERENTE do pin de endereco -- o mesmo desenho com dois '
    + 'significados no mesmo cartao seria ambiguidade desenhada');

  /* ══════════ CHECK 57 (R9): o ⋮ tem nome acessível ══════════ */
  /* O ⋮ é SVG puro: textContent vazio. Sem `aria-label`/`title` ele fica SEM NOME -- leitor de
     tela anuncia "botão", e o único caminho para Editar, Fixar e Excluir não tem nome. Medido
     pela camada de mutação: tirar os dois atributos deixava a suíte verde. */
  console.log('\n=== CHECK 57 (R9): o ⋮ do cartao tem nome acessivel ===');
  const r57 = await pg.evaluate(() => {
    document.getElementById('modalRoot').innerHTML = '';
    clientes = [{ nome: 'Cliente Nomeado', endereco: 'Rua NA, 1', contato: '5' }];
    osList = []; manutencoes = [];
    saveClientes(); saveOS(); saveManut();
    nav('clientes');
    const bt = document.querySelector('#app .os-card button');
    const itens = (() => { menuCliente('Cliente Nomeado');
      const r = [...document.querySelectorAll('#curOverlay .modal-body button')]
        .map(x => x.textContent.replace(/\s+/g, ' ').trim());
      closeModal(); return r; })();
    return { achou: !!bt, texto: (bt.textContent || '').trim(),
      aria: bt.getAttribute('aria-label') || '', title: bt.getAttribute('title') || '',
      svgs: bt.querySelectorAll('svg').length, itens: itens };
  });
  await pg.waitForTimeout(320);
  console.log('  ⋮ -> texto proprio:', JSON.stringify(r57.texto), '| aria-label:', JSON.stringify(r57.aria),
    '| title:', JSON.stringify(r57.title), '| SVGs dentro:', r57.svgs);
  console.log('  itens do menu (que tem texto proprio):', JSON.stringify(r57.itens));
  assert(r57.achou, 'CONTROLE R9: o cartao tem o botao ⋮');
  assert(r57.svgs === 1 && r57.texto === '',
    'CONTROLE R9: o ⋮ e SVG puro, sem texto proprio -- e por isso que o nome acessivel precisa vir de atributo');
  assert(r57.aria.length > 0, 'o ⋮ tem aria-label -- medido ' + JSON.stringify(r57.aria));
  assert(r57.title.length > 0, 'e title, para o toque longo no celular -- medido ' + JSON.stringify(r57.title));
  assert(/a[çc][õo]es/i.test(r57.aria) && /cliente/i.test(r57.aria),
    'e o nome diz do que se trata ("acoes do cliente") -- medido ' + JSON.stringify(r57.aria));
  assert(r57.itens.length === 4 && r57.itens.every(t => t.length > 0),
    'CONTROLE R9: os quatro itens do menu tem texto proprio, e nao dependem de atributo -- medido '
    + JSON.stringify(r57.itens));

  /* ══════════ CHECK 32 (V6): GEOMETRIA EM TELA DE CELULAR -- V1 a V5 ══════════ */
  /* Até 12/10/2026 esta suíte só rodava no viewport padrão do Playwright (1280x720, desktop):
     zero viewport, zero devices[...], zero getBoundingClientRect em 1.770 linhas. Nenhum dos cinco
     defeitos visuais corrigidos em 12/10/2026 podia ser VISTO pela rede -- é a mesma cegueira que
     deixou o botão de mapa nascer atrás do rodapé grudado na entrega anterior. O bloco abaixo abre
     o PRÓPRIO contexto, de celular, e não troca o viewport dos checks acima, que estão provados em
     desktop.
     As cinco armadilhas de medição desta tela, todas pagas em medição real:
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
       5. A FAIXA #syncAlerta nasce no meio da varredura e desce a lista inteira 122 px.
          `entrarApp()` agenda `setTimeout(_vigiarConexao; _atualizarAlertaSync, 4000)` -- e a
          varredura de rolagem começa por volta de 1,5 s e dura uns 2 a 4 s, então o relógio de
          4 s cai DENTRO dela, num passo que depende da velocidade da máquina. Medido em
          13/10/2026, 6 rodadas de 6 a 360x640: `document.documentElement.scrollHeight` salta de
          2252 para 2374 e o `top` de todo cartão ganha +122 px no meio do caminho.
          Consequência: os pontos medidos deixam de atravessar a faixa de altura do FAB e o
          controle `naFaixaDoFab` reprovava sem haver defeito nenhum -- 2 vermelhos em 8 rodadas.
          NÃO era rolagem não assentada: nas 63 leituras da sonda, `window.scrollY`,
          `document.scrollingElement.scrollTop` e `visualViewport.pageTop` bateram EXATAMENTE
          com o valor pedido, e a leitura imediata só diferia da leitura depois de dois quadros
          de animação no passo em que a faixa aparecia.
          O que resolve é medir com LAYOUT ASSENTADO: forçar a faixa ao estado final antes de
          varrer, e, se a altura do documento mudar no meio, declarar a medição INVÁLIDA e
          varrer de novo -- nunca contar o número torto como se fosse medida.
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
  /* Os QUATRO tamanhos são medidos sempre, e a reprovação vem no fim nomeando quais falharam.
     Até 13/10/2026 o primeiro assert vermelho (sempre 360x640) abortava a suíte e 320x568
     nunca chegava a ser medido -- cobertura afirmada e não medida. */
  const falhasPorTela = [];
  for (const [W, H] of TELAS) {
    const T = W + 'x' + H;
    const ctxM = await b.newContext({ viewport: { width: W, height: H }, isMobile: true,
                                      hasTouch: true, deviceScaleFactor: 2 });
    const pgM = await ctxM.newPage();
    pgM.on('pageerror', e => errosM.push(T + ': ' + e.message));
    try {
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

      /* ---- V1 + V2: o ⋮ do cartao, com 10 clientes e rolagem ----
         13/10/2026: o alvo medido aqui era o botao largo "Editar cliente" do rodape do cartao,
         que SAIU. Quem ocupa o lugar dele e o ⋮ do canto superior direito, e ele herda o MESMO
         risco medido: a coluna do FAB "Nova OS" (fixo, right 16px, 52px) come os 28 px da ponta
         direita do cartao em 390/375/360/320. Por isso o ⋮ tem margin-right de 28px -- e e esta
         varredura que prova que nenhum ponto dele e roubado em nenhuma posicao de rolagem. */
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
          larguras: [...new Set(bts.map(x => Math.round(x.getBoundingClientRect().width)))],
          maiorRight: Math.max(...bts.map(x => Math.round(x.getBoundingClientRect().right))),
          textoCortado: bts.filter(x => x.scrollWidth > x.clientWidth).length
        };
      });
      console.log('  V1/V2 ' + T + ': ' + g1.n + ' botoes, alturas ' + JSON.stringify(g1.alturas)
        + ' | borda direita max ' + g1.maiorRight + ' | FAB em x=' + g1.fabLeft + ' (' + g1.fabDisplay + ')');
      assert(g1.n === 10, 'V6 ' + T + ': os 10 cartoes de cliente tem o botao de acoes (⋮)');
      assert(g1.fabDisplay === 'flex',
        'CONTROLE V6 ' + T + ': o FAB "Nova OS" esta de fato na tela (no desktop e display:none, e o caso seria vazio)');
      assert(g1.instrumento,
        'CONTROLE V6 ' + T + ': mirar no meio do FAB devolve o proprio FAB -- o hit-test mede quem esta na frente');
      assert(g1.maiorRight <= g1.fabLeft,
        'V1 ' + T + ': nenhum ⋮ alcanca a coluna do FAB (borda direita ' + g1.maiorRight
        + ' <= ' + g1.fabLeft + ')');
      assert(g1.alturas.every(a => a >= 44),
        'V2 ' + T + ': todo ⋮ tem no minimo 44 px de altura (medido ' + JSON.stringify(g1.alturas) + ')');
      assert(g1.larguras.every(a => a >= 44),
        'V2 ' + T + ': e no minimo 44 px de largura (medido ' + JSON.stringify(g1.larguras) + ')');
      assert(g1.textoCortado === 0,
        'V2 ' + T + ': e o conteudo do ⋮ continua cabendo inteiro no botao');

      /* Varredura de rolagem em passos de 10: a faixa do FAB tem 52 px de altura, então um passo
         de 10 px garante que o ponto medido de algum botão CAIA dentro dela -- e é isso que
         o controle `naFaixaDoFab` afirma. Sem esse controle, um filtro que excluísse justamente a
         linha perigosa deixaria o caso passar calado contando pontos inofensivos.
         Três coisas aqui são sobre MEDIR, e nenhuma afrouxa o que é exigido (armadilha 5 do
         cabeçalho deste bloco, medida em 13/10/2026):
           a. O ALCANCE sai da geometria medida, não de um 0..200 fixo. Com o alcance fixo, bastou
              a lista descer 122 px (a faixa #syncAlerta nascendo) para a varredura inteira passar
              POR FORA da linha perigosa e o controle reprovar sem defeito nenhum. Varrer um passo
              de cartão (`passo`) a mais garante que algum centro atravesse a faixa do FAB em
              qualquer altura de lista.
           b. A faixa #syncAlerta é levada ao ESTADO FINAL antes de varrer, com controle positivo
              de que a chamada de fato aconteceu.
           c. A altura do documento é lida em TODO passo. Se mudar no meio, a medição está
              INVÁLIDA e a varredura é refeita; se não assentar em 3 tentativas, o check REPROVA
              dizendo isso. Número medido com o chão se movendo não é medida -- é sorteio, e
              sorteio verde vale tanto quanto sorteio vermelho: nada. */
      const assentou = await pgM.evaluate(() => {
        try { _vigiarConexao(); _atualizarAlertaSync(); return { ok: true, erro: '' }; }
        catch (e) { return { ok: false, erro: (e.code || '') + ' ' + e.message }; }
      });
      assert(assentou.ok, 'CONTROLE V6 ' + T + ': a faixa #syncAlerta foi levada ao estado final ANTES '
        + 'de medir -- senao ela nasce no meio da varredura e desce a lista 122 px' + (assentou.erro ? ' -- ' + assentou.erro : ''));
      let medidos = 0, naFaixaDoFab = 0, roubados = [], alturas = [], alcance = 0;
      let base = null, valida = false, tentativas = 0;
      while (tentativas < 3 && !valida) {
        tentativas++;
        base = await pgM.evaluate(async () => {
          window.scrollTo(0, 0);
          await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
          const ys = [...document.querySelectorAll('#app .os-card button')]
            .map(x => { const r = x.getBoundingClientRect(); return r.top + r.height / 2; });
          return { docH: document.documentElement.scrollHeight,
                   passo: ys.length > 1 ? Math.round(ys[1] - ys[0]) : 200,
                   maxScroll: document.documentElement.scrollHeight - window.innerHeight };
        });
        alcance = Math.min(base.maxScroll, Math.max(200, base.passo + 20));
        medidos = 0; naFaixaDoFab = 0; roubados = []; alturas = [];
        for (let sy = 0; sy <= alcance; sy += 10) {
          const r = await pgM.evaluate(async (alvo) => {
            window.scrollTo(0, alvo);
            /* a rolagem E o layout assentam antes da leitura -- dois quadros de animação */
            await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
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
            return { sy: window.scrollY, docH: document.documentElement.scrollHeight, out: out };
          }, sy);
          alturas.push(r.docH);
          medidos += r.out.length;
          naFaixaDoFab += r.out.filter(x => x.naFaixa).length;
          r.out.filter(x => !x.ok).forEach(x => roubados.push('scrollY=' + r.sy + ' botao#' + x.i
            + ' centro->' + x.centro + ' direita->' + x.direita));
        }
        const mexeu = [...new Set(alturas.filter(h => h !== base.docH))];
        valida = mexeu.length === 0;
        if (!valida) console.log('  V1 ' + T + ': MEDICAO INVALIDA na tentativa ' + tentativas
          + ' -- a altura do documento mudou no meio da varredura (' + base.docH + ' -> '
          + mexeu.join(',') + '), varrendo de novo');
      }
      console.log('  V1 ' + T + ': ' + medidos + ' pontos medidos na varredura de rolagem 0..'
        + alcance + ' (' + naFaixaDoFab + ' na faixa de altura do FAB), ' + roubados.length
        + ' roubados | tentativa ' + tentativas + ', altura do documento ' + base.docH
        + ', estavel: ' + valida
        + (roubados.length ? '\n     ' + roubados.slice(0, 6).join('\n     ') : ''));
      assert(valida, 'CONTROLE V6 ' + T + ': a varredura mediu com a ALTURA DO DOCUMENTO estavel -- '
        + 'medicao com o chao se movendo nao e medida, e foi isso que deixou este controle '
        + 'reprovar 2 vezes em 8 sem defeito nenhum (3 tentativas invalidadas)');
      assert(medidos > 0,
        'CONTROLE V6 ' + T + ': a varredura mediu algum ponto (filtro que excluisse tudo passaria calado)');
      assert(naFaixaDoFab >= 1,
        'CONTROLE V6 ' + T + ': ao menos um ponto medido caiu na FAIXA DE ALTURA do FAB -- a varredura '
        + 'passou pela linha perigosa, nao so por linhas inofensivas');
      assert(roubados.length === 0,
        'V1 ' + T + ': em toda a rolagem, o centro E a borda direita do ⋮ recebem o proprio toque');
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
        /* O que V4 afirma é o TEXTO, não a decoração: desde 13/10/2026 o cartão de cliente usa
           ícone do sistema (SVG, que não entra no textContent) e o detalhe ainda usa o emoji
           de endereço e telefone -- a varredura dos emojis restantes é entrega própria,
           registrada no CLAUDE.md.
           Comparar os textos crus faria este caso reprovar por causa da decoração, que é
           justamente o que ele NÃO mede. O corte tira só o prefixo não-textual do começo. */
        const soTexto = (s) => s.replace(/^[^\p{L}\p{N}(]+/u, '').trim();
        console.log('  V4 ' + T + ' [' + nome + ']: cartao ' + JSON.stringify(g4.noCartao)
          + ' | detalhe ' + JSON.stringify(g4.noDetalhe));
        assert(g4.aberto, 'CONTROLE V6 ' + T + ': o detalhe de "' + nome + '" abriu');
        assert(g4.noCartao.some(x => /Sem endere/.test(x)),
          'CONTROLE V4 ' + T + ': o cartao de "' + nome + '" diz "Sem endereco"');
        assert(JSON.stringify(g4.noDetalhe.map(soTexto)) === JSON.stringify(g4.noCartao.map(soTexto)),
          'V4 ' + T + ': cartao e detalhe de "' + nome + '" dizem a MESMA coisa -- '
          + JSON.stringify(g4.noCartao.map(soTexto)));
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

      /* ---- V7 (R1): O ⋮ NÃO SAI DA TELA, e é regressão medida contra o publicado ----
         Com nome de 120 caracteres sem espaço (ou endereço de 200 sem espaço), a coluna de texto
         do .os-card-top esticava pelo min-content e levava o ⋮ para x=1742 numa tela de 320 a
         390: FORA da tela, com elementFromPoint no centro dele devolvendo `null`. Aquele cliente
         ficava SEM PORTA NENHUMA para Editar, Fixar ou Excluir sem arrastar a página na
         horizontal -- e o botão largo que o ⋮ substituiu ficava em x=44 e recebia o toque na
         base-42a291d, nos mesmos cenários. O estouro horizontal do cartão é anterior a esta
         família; levar o CONTROLE embora não era.
         Medido na árvore anterior (visual-M), 14/10/2026: x=1742 e alvo `null` com o nome de
         120, x=1611 e `null` com o endereço de 200, nos QUATRO tamanhos. */
      const SEM_ESPACO_120 = 'N'.repeat(120);
      const SEM_ESPACO_200 = 'E'.repeat(200);
      for (const cen of ['nome de 120 sem espaco', 'endereco de 200 sem espaco', 'CONTROLE: nome curto']) {
        const g7 = await pgM.evaluate((d) => {
          const r = document.getElementById('modalRoot'); if (r) r.innerHTML = '';
          const nome = d.cen === 'nome de 120 sem espaco' ? d.n120 : 'Cliente Curto';
          const end = d.cen === 'endereco de 200 sem espaco' ? d.e200 : 'Rua das Flores, 10 - Centro';
          clientes = [{ nome: nome, endereco: end, contato: '(49) 9000-0001' }];
          osList = []; manutencoes = [];
          localStorage.setItem('mappo_clientes', JSON.stringify(clientes));   // armadilha 4
          localStorage.setItem('mappo_os', '[]'); localStorage.setItem('mappo_manut', '[]');
          nav('clientes');
          const t = document.getElementById('tourRoot'); if (t) t.innerHTML = '';   // armadilha 2
          const bt = document.querySelector('#app .os-card button');
          if (!bt) return { achou: false };
          const rc = bt.getBoundingClientRect();
          const cx = Math.round(rc.left + rc.width / 2), cy = Math.round(rc.top + rc.height / 2);
          const el = document.elementFromPoint(cx, cy);
          const marca = (e) => e ? e.tagName.toLowerCase()
            + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : '') : 'null';
          /* CONTROLE da sonda, no mesmo estado de tela: mirar no meio do FAB devolve o FAB.
             Sem ele, "o ⋮ nao recebe o toque" e "elementFromPoint nao esta medindo" seriam
             indistinguiveis -- e os dois devolvem a mesma coisa. */
          const fab = document.getElementById('fabNovo');
          const rf = fab.getBoundingClientRect();
          const noFab = document.elementFromPoint(Math.round(rf.left + rf.width / 2),
                                                  Math.round(rf.top + rf.height / 2));
          return { achou: true, x: Math.round(rc.left), right: Math.round(rc.right),
            dentro: rc.left >= 0 && rc.right <= window.innerWidth,
            recebe: !!(el && bt.contains(el)), alvo: marca(el),
            instrumento: !!(noFab && fab.contains(noFab)),
            docSW: document.documentElement.scrollWidth, iw: window.innerWidth };
        }, { cen: cen, n120: SEM_ESPACO_120, e200: SEM_ESPACO_200 });
        console.log('  V7 ' + T + ' [' + cen + ']: ⋮ em x=' + g7.x + '..' + g7.right
          + ' dentro da tela=' + g7.dentro + ' recebe o toque=' + g7.recebe + ' (' + g7.alvo + ')'
          + ' | document.scrollWidth ' + g7.docSW + ' vs innerWidth ' + g7.iw);
        assert(g7.achou, 'CONTROLE V7 ' + T + ' [' + cen + ']: o cartao tem o botao ⋮');
        assert(g7.instrumento, 'CONTROLE V7 ' + T + ' [' + cen + ']: mirar no meio do FAB devolve o '
          + 'proprio FAB -- o hit-test esta medindo quem esta na frente');
        assert(g7.dentro, 'V7 ' + T + ' [' + cen + ']: o ⋮ fica DENTRO da tela (medido x=' + g7.x
          + '..' + g7.right + ', largura ' + g7.iw + ')');
        assert(g7.recebe, 'V7 ' + T + ' [' + cen + ']: e RECEBE o proprio toque -- sem isso o cliente '
          + 'fica sem porta para Editar, Fixar e Excluir (medido alvo ' + g7.alvo + ')');
        assert(g7.docSW === g7.iw, 'V7 ' + T + ' [' + cen + ']: e a pagina nao rola na horizontal ('
          + g7.docSW + ' === ' + g7.iw + ')');
      }

      /* ---- V8 (R2 + R3) + V9 (R4): a folha do ⋮ com nome comprido ----
         Duas formas de nome comprido, e cada uma quebrava de um jeito diferente:
           R2, nome de 120 COM espaços: o h2 de 24 px quebrava em 9 linhas (261 px de cabeçalho)
           e a 320x568 "Selecionar várias" e "Excluir" deixavam de receber o próprio toque --
           elementFromPoint devolvia div.modal-foot e div.overlay, e o toque perdido no rodapé
           grudado não dispara NADA. O que ficava escondido era a ação destrutiva.
           R3, nome de 120 SEM espaços: .modal-head h2 é display:flex e item flex não quebra
           palavra sozinho -- a folha rolava na horizontal (scrollWidth 2155 contra clientWidth
           350/335/320/280, idêntico nos quatro tamanhos).
         Medido na árvore anterior (visual-M), 14/10/2026: COM espaços, 3 de 5 opções recebiam o
         toque a 320x568 e a folha ROLAVA na vertical a 375, 360 e 320; SEM espaços, scrollWidth
         2155 nos quatro tamanhos. As cinco opções são as quatro do corpo mais o Fechar do rodapé.
         V9: o item Excluir media 4,13:1 de contraste sobre branco (rgb(229,62,62) em 14 px peso
         600), abaixo do mínimo AA de 4,5:1, enquanto os outros três medem 8,61:1 -- o único
         sinal de "isto é destrutivo" era o de pior leitura da folha. */
      const COM_ESPACO_120 = (() => { let s = ''; while (s.length < 120) s += 'Nome Comprido '; return s.slice(0, 120).trim(); })();
      for (const [rot, nome] of [['120 COM espacos', COM_ESPACO_120], ['120 SEM espacos', SEM_ESPACO_120]]) {
        const g8 = await pgM.evaluate((d) => {
          const r = document.getElementById('modalRoot'); if (r) r.innerHTML = '';
          clientes = [{ nome: d.nome, endereco: 'Rua V8, 1', contato: '(49) 5555-0000' }];
          osList = []; manutencoes = [];
          localStorage.setItem('mappo_clientes', JSON.stringify(clientes));
          localStorage.setItem('mappo_os', '[]'); localStorage.setItem('mappo_manut', '[]');
          nav('clientes');
          const t = document.getElementById('tourRoot'); if (t) t.innerHTML = '';
          menuCliente(d.nome);
          const t2 = document.getElementById('tourRoot'); if (t2) t2.innerHTML = '';
          const ov = document.getElementById('curOverlay');
          const modal = ov.querySelector('.modal');
          const h2 = ov.querySelector('.modal-head h2');
          const marca = (e) => e ? e.tagName.toLowerCase()
            + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : '') : 'null';
          const medir = (bt) => {
            const rc = bt.getBoundingClientRect();
            const el = document.elementFromPoint(Math.round(rc.left + rc.width / 2),
                                                 Math.round(rc.top + rc.height / 2));
            return { t: bt.textContent.replace(/\s+/g, ' ').trim(),
              y: Math.round(rc.top) + '-' + Math.round(rc.bottom),
              recebe: !!(el && bt.contains(el)), alvo: marca(el), cor: getComputedStyle(bt).color };
          };
          const itens = [...ov.querySelectorAll('.modal-body button'),
                         ...ov.querySelectorAll('.modal-foot button')].map(medir);
          const out = { aberto: ov.classList.contains('open'),
            msw: modal.scrollWidth, mcw: modal.clientWidth,
            rolaVertical: modal.scrollHeight - modal.clientHeight > 1,
            h2h: Math.round(h2.getBoundingClientRect().height),
            h2sw: h2.scrollWidth, h2cw: h2.clientWidth,
            itens: itens, fundo: getComputedStyle(modal).backgroundColor };
          closeModal();
          return out;
        }, { nome: nome });
        await pgM.waitForTimeout(320);
        const recebem = g8.itens.filter(x => x.recebe).length;
        const excluir = g8.itens.find(x => /^excluir$/i.test(x.t));
        const razao = excluir ? _contraste(_rgbDe(excluir.cor), _rgbDe(g8.fundo)) : 0;
        console.log('  V8 ' + T + ' [' + rot + ']: modal scrollWidth ' + g8.msw + ' / clientWidth '
          + g8.mcw + ' | rola na vertical: ' + g8.rolaVertical + ' | h2 ' + g8.h2h + 'px | '
          + recebem + ' de ' + g8.itens.length + ' opcoes recebem o proprio toque');
        g8.itens.filter(x => !x.recebe).forEach(x => console.log('     ROUBADO: "' + x.t + '" y '
          + x.y + ' -> ' + x.alvo));
        console.log('  V9 ' + T + ' [' + rot + ']: Excluir em ' + (excluir ? excluir.cor : '(nao achou)')
          + ' sobre ' + g8.fundo + ' -> contraste ' + razao.toFixed(2) + ':1');
        assert(g8.aberto, 'CONTROLE V8 ' + T + ' [' + rot + ']: a folha do ⋮ esta aberta (classe open)');
        assert(g8.itens.length === 5, 'CONTROLE V8 ' + T + ' [' + rot + ']: as CINCO opcoes foram '
          + 'medidas (4 do corpo + Fechar) -- medido ' + g8.itens.length);
        assert(!!excluir, 'CONTROLE V9 ' + T + ' [' + rot + ']: o item Excluir foi encontrado na medicao');
        assert(recebem === 5, 'V8 ' + T + ' [' + rot + ']: as cinco opcoes recebem o PROPRIO toque, '
          + 'sem rolar -- medido ' + recebem + '/5'
          + (recebem < 5 ? ' (' + g8.itens.filter(x => !x.recebe).map(x => x.t + '->' + x.alvo).join(', ') + ')' : ''));
        assert(!g8.rolaVertical, 'V8 ' + T + ' [' + rot + ']: e a folha nao precisa ROLAR para chegar nelas');
        assert(g8.msw === g8.mcw, 'V8/R3 ' + T + ' [' + rot + ']: a folha NAO rola na horizontal ('
          + g8.msw + ' === ' + g8.mcw + ')');
        assert(razao >= 4.5, 'V9 ' + T + ' [' + rot + ']: o item Excluir tem contraste AA sobre o fundo '
          + 'da folha -- medido ' + razao.toFixed(2) + ':1 (minimo 4.5:1), cor ' + excluir.cor);
      }
    } catch (e) {
      /* Cada tamanho é medido ATÉ O FIM: antes, o primeiro assert vermelho em 360x640 abortava a
         suíte e 320x568 NUNCA era medido -- enquanto o comentário do index.html afirmava
         cobertura "nos quatro tamanhos". A falha é colhida e nomeada, e a reprovação vem no fim. */
      falhasPorTela.push(T + ' -> ' + (e && e.message ? e.message : String(e)));
      console.log('  !! ' + T + ' FALHOU: ' + (e && e.message ? e.message : e));
    } finally {
      await ctxM.close();
    }
  }
  assert(errosM.length === 0, 'V6: nenhum erro de pagina nas quatro telas de celular'
    + (errosM.length ? ' -- ' + errosM.join(' | ') : ''));
  console.log('\n  V6: tamanhos medidos ' + TELAS.map(t => t[0] + 'x' + t[1]).join(', ')
    + ' | falharam: ' + (falhasPorTela.length ? falhasPorTela.length : 'nenhum'));
  assert(falhasPorTela.length === 0, 'V6: os QUATRO tamanhos de celular passaram'
    + (falhasPorTela.length ? ' -- FALHARAM: ' + falhasPorTela.join('  ||  ') : ''));

  console.log('\n=== erros de pagina ===');
  console.log(erros.length ? erros : '(nenhum)');
  assert(erros.length === 0, 'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e => { console.error('\n' + (e && e.message ? e.message : e)); process.exit(1); });
