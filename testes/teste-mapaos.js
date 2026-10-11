/* Impede que voltar: o endereço da OS ser texto morto. O técnico tinha de digitar o endereço
   à mão no aplicativo de mapa, e o link que o cliente manda pelo WhatsApp não servia de nada.
   O botão "Abrir no mapa" existe nas duas telas (detalhe do gestor e execução do técnico) e
   decide sozinho: se o endereço já traz um link de mapa, abre ESSE link; se não, abre a busca
   pelo texto escrito.
   O que este teste guarda, além de "funciona":
   (a) `javascript:` / `data:` nunca executam -- e a garantia de ESQUEMA é medida com o filtro
       de host neutralizado, senão ela ficaria escondida atrás dele (CHECK 10);
   (b) host é casado por HOSTNAME e nunca por substring nem por sufixo solto --
       "https://evil.com/?x=maps.google.com" contém "maps.google" e NÃO é mapa, e
       "evilgoo.gl"/"notwaze.com"/"google.lol" são domínios compráveis;
   (c) a URL chega INTEIRA ao window.open: apóstrofo e aspas fazem parte de endereço real
       ("Rua D'Avila") e truncar a URL manda o técnico para o lugar errado SEM AVISO;
   (d) `)` só é podado quando está desbalanceado -- ".../place/Bar+(Centro)" guarda o seu;
   (e) o window.open vai SEM string de features (features = popup, e popup bloqueado não
       lança: o aviso ficava inalcançável), com o retorno testado e o opener anulado;
   (f) endereço vazio não rende botão, e o botão do gestor recebe o toque em 320×568. */
const { chromium } = require('playwright');
const path = require('path'), http = require('http'), fs = require('fs');
const RAIZ = process.env.MAPPO_RAIZ || path.resolve(__dirname, '..');
function assert(c, m) { if (!c) throw new Error('FALHOU: ' + m); console.log('  ok - ' + m); }

const BUSCA = 'https://www.google.com/maps/search/?api=1&query=';
function busca(end) { return BUSCA + encodeURIComponent(String(end).trim()); }

/* Cada caso é um endereço digitado e a URL que o botão TEM de abrir. `esperado:null`
   significa "cai na busca pelo endereço escrito" -- calculado na hora, para o teste não
   repetir à mão a montagem da URL de busca. */
const CASOS = [
  { nome: 'link curto do Maps no meio do endereço',
    end: 'Rua X, 10 — https://maps.app.goo.gl/abc', esperado: 'https://maps.app.goo.gl/abc' },
  { nome: 'endereço sem link nenhum',
    end: 'Rua X, 10, Centro', esperado: null },
  { nome: 'link do Waze',
    end: 'Av Y, 5 https://waze.com/ul?ll=-23.5,-46.6&navigate=yes',
    esperado: 'https://waze.com/ul?ll=-23.5,-46.6&navigate=yes' },
  { nome: 'google.com/maps/place',
    end: 'Rua Z https://www.google.com/maps/place/Elite',
    esperado: 'https://www.google.com/maps/place/Elite' },
  { nome: 'maps.google.com',
    end: 'Rua W https://maps.google.com/?q=1', esperado: 'https://maps.google.com/?q=1' },
  { nome: 'javascript: no endereço NUNCA executa e cai na busca',
    end: 'Rua X javascript:alert(1)', esperado: null },
  { nome: 'data: no endereço cai na busca',
    end: 'Rua X data:text/html,<script>alert(1)</script>', esperado: null },
  { nome: 'host que IMITA o Maps na query nao e mapa',
    end: 'https://evil.com/?x=maps.google.com', esperado: null },
  { nome: 'subdominio que imita (google.evil.com) nao e mapa',
    end: 'https://google.evil.com/maps', esperado: null },
  { nome: 'URL que nao e de mapa nao sequestra o botao',
    end: 'Rua X, veja https://site.com/foto.jpg', esperado: null },
  { nome: 'duas URLs de mapa: abre a PRIMEIRA',
    end: 'https://maps.app.goo.gl/um e https://maps.app.goo.gl/dois',
    esperado: 'https://maps.app.goo.gl/um' },
  { nome: 'pontuacao em volta da URL nao entra no link',
    end: '(https://maps.app.goo.gl/abc).', esperado: 'https://maps.app.goo.gl/abc' },

  /* ---- F1: a URL tem de chegar INTEIRA. Excluir ' e " do padrão truncava a URL em
     silêncio, e o técnico ia para o lugar errado confiando no botão. O proprietário mediu:
     "https://www.google.com/maps/place/D'Avila+Comercio" abria ".../place/D". ---- */
  { nome: "apostrofo DENTRO da URL nao trunca (D'Avila)",
    end: "Rua D'Avila 10 https://www.google.com/maps/place/D'Avila+Comercio",
    esperado: "https://www.google.com/maps/place/D'Avila+Comercio" },
  /* aspas duplas ficam na URL; o próprio new URL().href as percent-encoda como %22, o que
     aponta para o MESMO lugar -- o que não pode é a URL ser cortada no primeiro ". */
  { nome: 'aspas duplas DENTRO da URL nao truncam',
    end: 'Rua Q https://www.google.com/maps/place/Loja_"Centro"',
    esperado: 'https://www.google.com/maps/place/Loja_%22Centro%22' },
  { nome: 'parentese que e PARTE da URL fica (Bar+(Centro))',
    end: 'Rua B https://www.google.com/maps/place/Bar+(Centro)',
    esperado: 'https://www.google.com/maps/place/Bar+(Centro)' },
  /* NAO REGREDIR: com ' e " dentro do conjunto da URL, aspas de DELIMITADOR passariam a
     entrar no link -- medido em 10/10/2026, ".../abc" virava ".../abc%22", que nao existe.
     Aspas em numero impar no fim sao de quem escreveu e saem; em numero par, ficam. */
  { nome: 'link entre aspas duplas: as aspas de delimitador nao entram no link',
    end: 'Endereco: "https://maps.app.goo.gl/abc"', esperado: 'https://maps.app.goo.gl/abc' },
  { nome: 'link entre apostrofos: o apostrofo de delimitador nao entra no link',
    end: "Endereco: 'https://maps.app.goo.gl/abc'", esperado: 'https://maps.app.goo.gl/abc' },

  /* ---- F6: lista de hosts. "Parece google" e "termina com .goo.gl" não servem. ---- */
  { nome: 'impostor de sufixo: evilgoo.gl cai na busca',
    end: 'Rua X https://evilgoo.gl/abc', esperado: null },
  { nome: 'impostor de sufixo: notwaze.com cai na busca',
    end: 'Rua X https://notwaze.com/x', esperado: null },
  { nome: 'TLD inventado: google.lol/maps cai na busca',
    end: 'Rua X https://google.lol/maps', esperado: null },
  { nome: 'TLD inventado: google.xyz/maps cai na busca',
    end: 'Rua X https://google.xyz/maps', esperado: null },
  { nome: 'encurtador genérico: goo.gl/qualquercoisa cai na busca',
    end: 'Rua X https://goo.gl/qualquercoisa', esperado: null },
  { nome: 'subdominio qualquer do Waze (evil.waze.com) cai na busca',
    end: 'Rua X https://evil.waze.com/x', esperado: null },
  { nome: 'esquema hostil com host de mapa no lugar do host cai na busca',
    end: 'Rua X javascript://maps.app.goo.gl/%0aalert(1)', esperado: null },
  /* positivos, para a lista não ficar apertada demais sem ninguém notar */
  { nome: 'CONTROLE: caminho qualquer em maps.google.com abre (e o Google mesmo)',
    end: 'Rua W https://maps.google.com/anything', esperado: 'https://maps.google.com/anything' },
  { nome: 'CONTROLE: goo.gl COM caminho /maps abre',
    end: 'Rua X https://goo.gl/maps/abc', esperado: 'https://goo.gl/maps/abc' },
  { nome: 'CONTROLE: google.com.br/maps abre (TLD da lista)',
    end: 'Rua X https://www.google.com.br/maps/place/Elite',
    esperado: 'https://www.google.com.br/maps/place/Elite' },
  { nome: 'CONTROLE: www.waze.com abre',
    end: 'Rua X https://www.waze.com/ul?ll=-23.5,-46.6', esperado: 'https://www.waze.com/ul?ll=-23.5,-46.6' }
];

function osDeTeste(end) {
  return {
    id: 'os1', cliente: 'Jessika', endereco: end, tipo: 'Instalação', tecnico: 'Paulo',
    data: '2026-10-01', hora: '08:00', status: 'andamento', qtdSplits: 1, checkinTime: '07:57',
    equipamentos: [{ idx: 0, marca: '', modelo: '', fotoEvap: null, fotoCond: null }],
    checklist: []
  };
}

/* Instala `window.espionar()` DENTRO da página: ele espiona window.open em vez de deixar
   abrir aba de verdade, e troca o alert por um sinalizador -- se `javascript:alert(1)`
   for executado em algum caminho, o sinalizador acusa.
   A janela devolvida é um objeto de mentira com `opener` preenchido: sem string de features
   o navegador real devolve a referência da aba, e é isso que o app testa agora. `f` é
   guardado como null quando nada foi passado, para o teste poder exigir AUSÊNCIA de features.
   `espionar()` também zera a guarda de repique: cada caso da tabela é um toque de usuário
   diferente, e sem zerar os 500 ms de carência engoliriam o caso seguinte. O caso que mede
   o repique (CHECK 7) é o único que NÃO zera. */
function instalarEspiao() {
  window.espionar = () => {
    window.__abriu = [];
    window.__janelas = [];
    window.__alertou = false;
    window.__bloquear = false;
    window.alert = () => { window.__alertou = true; };
    window.open = (u, t, f) => {
      window.__abriu.push({ u: String(u), t: t === undefined ? null : String(t),
                            f: f === undefined ? null : String(f) });
      if (window.__bloquear) return null;            // popup bloqueado pelo navegador
      const falsa = { opener: window };
      window.__janelas.push(falsa);
      return falsa;
    };
    _ultimoMapaId = ''; _ultimoMapaEm = 0;
  };
  window.lerToast = () => {
    const t = document.getElementById('toast');
    return { txt: t ? t.textContent : '(sem #toast)',
             show: !!(t && t.className.indexOf('show') >= 0), cls: t ? t.className : '' };
  };
  window.openerAnulado = () => (window.__janelas || []).map(j => j.opener === null);
}

(async () => {
  const srv = http.createServer((rq, rs) => {
    const p = rq.url === '/' ? '/index.html' : rq.url.split('?')[0];
    const f = path.join(RAIZ, p);
    if (!fs.existsSync(f)) { rs.writeHead(404); rs.end(); return; }
    rs.writeHead(200); rs.end(fs.readFileSync(f));
  });
  await new Promise(r => srv.listen(0, r));
  const base = 'http://localhost:' + srv.address().port + '/';
  const b = await chromium.launch();
  const erros = [];

  /* ---------- TELA 1: detalhe da OS, sessão de GESTOR ---------- */
  const pgG = await b.newPage();
  pgG.on('pageerror', e => erros.push('[gestor] ' + e.message));
  await pgG.goto(base, { waitUntil: 'load' });
  await pgG.waitForTimeout(400);
  await pgG.evaluate(() => {
    fbReady = true; WORKSPACE = 'ws'; _avisouSessaoExpirada = true;
    session = { perfil: 'gestor', nome: 'Paulo', uid: 'u1', role: 'Gestor', workspaceId: 'ws' };
    tecnicos = [{ id: 't1', nome: 'Paulo', ativo: true, modulos: { split: true, vrfObras: [] } }];
    _gravarTourVisto(); entrarApp();
    const s = document.getElementById('splashScreen'); if (s) s.remove();
    nav('ordens');
  });
  await pgG.evaluate(instalarEspiao);
  await pgG.waitForTimeout(300);

  console.log('\n=== CHECK 1: o botao "Abrir no mapa" existe no detalhe da OS (gestor) ===');
  const r1 = await pgG.evaluate((o) => {
    osList = [o];
    closeModal(); openDetalhe('os1');
    const ov = document.getElementById('curOverlay');
    const btns = [...(ov ? ov.querySelectorAll('button') : [])]
      .filter(x => (x.textContent || '').includes('Abrir no mapa'));
    return {
      aberto: !!(ov && ov.classList.contains('open')),
      n: btns.length,
      onclick: btns.length ? btns[0].getAttribute('onclick') : '(sem botao)',
      /* F3: o botão mora no rodapé grudado, que é a parte sempre visível do modal.
         Dentro do corpo ele nascia ATRÁS do .modal-foot e não recebia o toque. */
      noRodape: btns.length ? !!btns[0].closest('.modal-foot') : false
    };
  }, osDeTeste('Rua X, 10, Centro'));
  console.log('  modal aberto:', r1.aberto, '| botoes:', r1.n, '| onclick:', r1.onclick);
  console.log('  no .modal-foot:', r1.noRodape);
  assert(r1.aberto, 'CONTROLE: o detalhe da OS abre');
  assert(r1.n === 1, 'ha exatamente um botao "Abrir no mapa" no detalhe da OS');
  /* o id vai pelo escJsAttr (JSON.stringify + escapeHtml), nunca cru entre apóstrofos:
     id com apóstrofo vindo da nuvem quebraria este onclick igual ao do cartão do cliente. */
  assert(r1.onclick === 'abrirMapaDaOS("os1")',
    'o onclick leva o ID da OS escapado pelo escJsAttr, nunca cru nem o texto do endereco');
  assert(r1.noRodape, 'o botao do gestor fica no .modal-foot (nao atras dele)');

  console.log('\n=== CHECK 2: endereco vazio ou so espaco NAO rende botao (gestor) ===');
  for (const vazio of ['', '   ']) {
    const rv = await pgG.evaluate((o) => {
      osList = [o];
      closeModal(); openDetalhe('os1');
      const ov = document.getElementById('curOverlay');
      return {
        aberto: !!(ov && ov.classList.contains('open')),
        n: [...(ov ? ov.querySelectorAll('button') : [])]
          .filter(x => (x.textContent || '').includes('Abrir no mapa')).length
      };
    }, osDeTeste(vazio));
    assert(rv.aberto, 'CONTROLE: o detalhe abre mesmo com endereco ' + JSON.stringify(vazio));
    assert(rv.n === 0, 'sem botao para endereco ' + JSON.stringify(vazio));
  }

  console.log('\n=== CHECK 3: para cada endereco, o botao abre a URL certa (gestor) ===');
  for (const c of CASOS) {
    const esp = c.esperado === null ? busca(c.end) : c.esperado;
    const r = await pgG.evaluate((arg) => {
      osList = [arg.o];
      closeModal(); openDetalhe('os1');
      espionar();
      const ov = document.getElementById('curOverlay');
      const btn = [...(ov ? ov.querySelectorAll('button') : [])]
        .find(x => (x.textContent || '').includes('Abrir no mapa'));
      if (!btn) return { achou: false };
      btn.click();
      return { achou: true, abriu: window.__abriu.slice(), alertou: window.__alertou,
               opener: openerAnulado() };
    }, { o: osDeTeste(c.end) });
    console.log('  [' + c.nome + ']');
    console.log('    endereco:', JSON.stringify(c.end));
    console.log('    abriu   :', r.achou ? JSON.stringify(r.abriu) : '(sem botao)');
    assert(r.achou, 'o botao existe para: ' + c.nome);
    assert(r.abriu.length === 1, 'o botao abriu exatamente uma aba: ' + c.nome);
    assert(r.abriu[0].u === esp, 'abriu a URL certa (' + esp + ') em: ' + c.nome);
    /* F4: aba de verdade, SEM string de features. Com features o navegador trata como popup,
       e popup bloqueado não lança -- o aviso ficava inalcançável. O opener é anulado depois. */
    assert(r.abriu[0].t === '_blank', 'abriu em aba nova (_blank): ' + c.nome);
    assert(r.abriu[0].f === null,
      'window.open foi chamado SEM string de features (features = popup): ' + c.nome);
    assert(r.opener.length === 1 && r.opener[0] === true,
      'o opener da aba nova foi anulado: ' + c.nome);
    assert(r.alertou === false, 'nada de alert() foi executado em: ' + c.nome);
    assert(!/^javascript:/i.test(r.abriu[0].u) && !/^data:/i.test(r.abriu[0].u),
      'a URL aberta nunca e javascript: nem data: em: ' + c.nome);
  }

  console.log('\n=== CHECK 4 (F4): aba bloqueada pelo navegador AVISA, nao fica em silencio ===');
  const rBloq = await pgG.evaluate((o) => {
    osList = [o];
    closeModal(); openDetalhe('os1');
    espionar();
    window.__bloquear = true;
    const ov = document.getElementById('curOverlay');
    const btn = [...ov.querySelectorAll('button')]
      .find(x => (x.textContent || '').includes('Abrir no mapa'));
    btn.click();
    const t1 = lerToast();
    /* bloqueio nao arma a guarda de repique: o tecnico tem de poder tentar de novo na hora */
    window.__bloquear = false;
    btn.click();
    return { tentativas: window.__abriu.length, toast: t1, abriuDepois: window.__janelas.length };
  }, osDeTeste('Rua X, 10 — https://maps.app.goo.gl/abc'));
  console.log('  tentativas:', rBloq.tentativas, '| toast:', JSON.stringify(rBloq.toast.txt),
              '| classe:', rBloq.toast.cls, '| abriu na 2a:', rBloq.abriuDepois);
  assert(rBloq.toast.show, 'aba bloqueada mostra toast (nada acontecer em silencio e o defeito)');
  assert(/bloque/i.test(rBloq.toast.txt), 'o toast diz que a aba foi bloqueada');
  assert(rBloq.abriuDepois === 1, 'bloqueio nao arma o repique: o 2o toque abre de verdade');

  console.log('\n=== CHECK 5 (F8): abrirMapaDaOS chamada direto avisa e NAO abre ===');
  const rDir = await pgG.evaluate(() => {
    osList = [{ id: 'outra', endereco: 'Rua Z, 1' }];
    espionar();
    abrirMapaDaOS('nao-existe');
    const t1 = lerToast(), n1 = window.__abriu.length;
    espionar();
    osList = [{ id: 'os1', endereco: '   ' }];
    abrirMapaDaOS('os1');
    const t2 = lerToast(), n2 = window.__abriu.length;
    return { t1, n1, t2, n2 };
  });
  console.log('  id inexistente -> toast:', JSON.stringify(rDir.t1.txt), '| abriu:', rDir.n1);
  console.log('  endereco vazio -> toast:', JSON.stringify(rDir.t2.txt), '| abriu:', rDir.n2);
  assert(rDir.n1 === 0, 'id inexistente nao abre nada');
  assert(rDir.t1.show && /ordem de servi/i.test(rDir.t1.txt), 'id inexistente AVISA');
  assert(rDir.n2 === 0, 'endereco vazio nao abre nada nem na chamada direta');
  assert(rDir.t2.show && /endere/i.test(rDir.t2.txt), 'endereco vazio AVISA');

  console.log('\n=== CHECK 6 (F8): OS so em execOS, ausente de osList, continua funcionando ===');
  const rExec = await pgG.evaluate((o) => {
    espionar();
    osList = [];                                   // o tecnico reabriu o app: lista vazia
    execOS = o;
    abrirMapaDaOS('os1');
    const r = { abriu: window.__abriu.slice(), toast: lerToast() };
    execOS = null;
    return r;
  }, osDeTeste('Rua X, 10 — https://maps.app.goo.gl/abc'));
  console.log('  abriu:', JSON.stringify(rExec.abriu));
  assert(rExec.abriu.length === 1 && rExec.abriu[0].u === 'https://maps.app.goo.gl/abc',
    'o ramo execOS resolve a OS sozinho, sem osList');

  console.log('\n=== CHECK 7 (F7): tres toques rapidos abrem UMA vez ===');
  const rRep = await pgG.evaluate((o) => {
    osList = [o];
    closeModal(); openDetalhe('os1');
    espionar();                                     // zera a guarda, depois NAO zera mais
    const ov = document.getElementById('curOverlay');
    const btn = [...ov.querySelectorAll('button')]
      .find(x => (x.textContent || '').includes('Abrir no mapa'));
    btn.click(); btn.click(); btn.click();
    return { abriu: window.__abriu.slice() };
  }, osDeTeste('Rua X, 10 — https://maps.app.goo.gl/abc'));
  console.log('  aberturas em 3 toques:', rRep.abriu.length, JSON.stringify(rRep.abriu));
  assert(rRep.abriu.length === 1, 'tres toques rapidos abrem o mapa UMA vez');

  /* ---------- TELA 2: execução, sessão de TÉCNICO ---------- */
  const pgT = await b.newPage({ viewport: { width: 390, height: 844 } });
  pgT.on('pageerror', e => erros.push('[tecnico] ' + e.message));
  await pgT.goto(base, { waitUntil: 'load' });
  await pgT.waitForTimeout(400);
  await pgT.evaluate(() => {
    fbReady = true; WORKSPACE = 'ws'; _avisouSessaoExpirada = true;
    session = { perfil: 'tecnico', nome: 'Paulo', uid: 'u', role: 'Técnico de Campo', workspaceId: 'ws' };
    tecnicos = [{ id: 't1', nome: 'Paulo', ativo: true, modulos: { split: true, vrfObras: [] } }];
    _gravarTourVisto(); entrarApp();
    const s = document.getElementById('splashScreen'); if (s) s.remove();
    nav('ordens');
  });
  await pgT.evaluate(instalarEspiao);
  await pgT.waitForTimeout(300);

  console.log('\n=== CHECK 8: o mesmo botao na tela de execucao (tecnico) ===');
  const r4 = await pgT.evaluate((o) => {
    osList = [o]; localStorage.setItem('mappo_os', JSON.stringify(osList));
    abrirExecucao('os1');
    const area = document.getElementById('contentArea');
    const btns = [...area.querySelectorAll('button')]
      .filter(x => (x.textContent || '').includes('Abrir no mapa'));
    return {
      naTela: !!document.getElementById('equipPanelArea'),
      n: btns.length,
      onclick: btns.length ? btns[0].getAttribute('onclick') : '(sem botao)'
    };
  }, osDeTeste('Rua X, 10 — https://maps.app.goo.gl/abc'));
  console.log('  execucao aberta:', r4.naTela, '| botoes:', r4.n, '| onclick:', r4.onclick);
  assert(r4.naTela, 'CONTROLE: a tela de execucao abriu');
  assert(r4.n === 1, 'ha exatamente um botao "Abrir no mapa" na execucao');
  assert(r4.onclick === 'abrirMapaDaOS("os1")',
    'o onclick leva o ID escapado na execucao tambem');

  console.log('\n=== CHECK 9: na execucao, link e busca funcionam (tecnico) ===');
  for (const c of [CASOS[0], CASOS[1], CASOS[7], CASOS[12]]) {
    const esp = c.esperado === null ? busca(c.end) : c.esperado;
    const r = await pgT.evaluate((arg) => {
      osList = [arg.o]; execOS = null;
      abrirExecucao('os1');
      espionar();
      const btn = [...document.getElementById('contentArea').querySelectorAll('button')]
        .find(x => (x.textContent || '').includes('Abrir no mapa'));
      if (!btn) return { achou: false };
      btn.click();
      return { achou: true, abriu: window.__abriu.slice(), alertou: window.__alertou };
    }, { o: osDeTeste(c.end) });
    console.log('  [' + c.nome + '] abriu:', r.achou ? JSON.stringify(r.abriu) : '(sem botao)');
    assert(r.achou, 'o botao existe na execucao para: ' + c.nome);
    assert(r.abriu.length === 1 && r.abriu[0].u === esp,
      'a execucao abriu a URL certa (' + esp + ') em: ' + c.nome);
    assert(r.alertou === false, 'nada de alert() foi executado na execucao em: ' + c.nome);
  }

  console.log('\n=== CHECK 10 (F8): a garantia de ESQUEMA nao depende do filtro de host ===');
  /* Hoje quem segura `javascript://maps.app.goo.gl/%0aalert(1)` é o padrão de descoberta,
     que só aceita http(s). Se o filtro de host fosse a única coisa no caminho, a garantia
     de esquema poderia sumir sem ninguém notar. Aqui o filtro de host é NEUTRALIZADO
     (passa a aceitar qualquer host) e o esquema hostil continua sem passar. */
  const rEsq = await pgT.evaluate(() => {
    const orig = _ehHostDeMapa;
    _ehHostDeMapa = () => true;                     // o filtro de host deixa de proteger
    const hostis = ['javascript://maps.app.goo.gl/%0aalert(1)',
                    'javascript:alert(1)',
                    'data:text/html,<script>alert(1)</script>',
                    'vbscript:msgbox(1)',
                    'file:///etc/passwd'];
    const achados = hostis.map(h => urlDeMapaNoTexto('Rua X ' + h));
    const controle = urlDeMapaNoTexto('Rua X https://qualquer-host-do-mundo.com/x');
    _ehHostDeMapa = orig;
    return { achados, controle, voltou: _ehHostDeMapa === orig };
  });
  console.log('  com o filtro de host desligado, urlDeMapaNoTexto devolveu:',
              JSON.stringify(rEsq.achados));
  console.log('  CONTROLE POSITIVO (host liberado, esquema https):', rEsq.controle);
  assert(rEsq.controle === 'https://qualquer-host-do-mundo.com/x',
    'CONTROLE: com o filtro de host desligado uma URL https E aceita (a sonda funciona)');
  assert(rEsq.achados.every(a => a === ''),
    'nenhum esquema fora de http/https passa, mesmo sem o filtro de host');
  assert(rEsq.voltou, 'o filtro de host original foi restaurado');

  console.log('\n=== CHECK 11: endereco vazio NAO rende botao na execucao ===');
  const r6 = await pgT.evaluate((o) => {
    osList = [o]; execOS = null;
    abrirExecucao('os1');
    return {
      naTela: !!document.getElementById('equipPanelArea'),
      n: [...document.getElementById('contentArea').querySelectorAll('button')]
        .filter(x => (x.textContent || '').includes('Abrir no mapa')).length
    };
  }, osDeTeste('   '));
  console.log('  execucao aberta:', r6.naTela, '| botoes:', r6.n);
  assert(r6.naTela, 'CONTROLE: a execucao abre mesmo sem endereco');
  assert(r6.n === 0, 'sem botao na execucao quando o endereco e so espaco');

  /* ---------- TELA 3 (F3): 320×568, o aparelho mais estreito que o app atende ---------- */
  console.log('\n=== CHECK 12 (F3): em 320x568 o botao RECEBE o toque, gestor e tecnico ===');
  const pgP = await b.newPage({ viewport: { width: 320, height: 568 } });
  pgP.on('pageerror', e => erros.push('[320] ' + e.message));
  await pgP.goto(base, { waitUntil: 'load' });
  await pgP.waitForTimeout(400);
  await pgP.evaluate(() => {
    fbReady = true; WORKSPACE = 'ws'; _avisouSessaoExpirada = true;
    session = { perfil: 'gestor', nome: 'Paulo', uid: 'u1', role: 'Gestor', workspaceId: 'ws' };
    tecnicos = [{ id: 't1', nome: 'Paulo', ativo: true, modulos: { split: true, vrfObras: [] } }];
    _gravarTourVisto(); entrarApp();
    const s = document.getElementById('splashScreen'); if (s) s.remove();
    nav('ordens');
  });
  await pgP.evaluate(instalarEspiao);
  /* #loginScreen.hidden tem transition de .5s em visibility: medir antes disso faz o
     elementFromPoint devolver a tela de login, que ainda está visível saindo de cena. */
  await pgP.waitForTimeout(900);
  const loginSumiu = await pgP.evaluate(() =>
    getComputedStyle(document.getElementById('loginScreen')).visibility);
  console.log('  visibility do #loginScreen:', loginSumiu);
  assert(loginSumiu === 'hidden', 'CONTROLE: a tela de login saiu de cena antes da medicao');

  /* elementFromPoint no CENTRO do botão: é o que o dedo acerta. Se vier outro elemento que
     não está dentro do botão, o toque vai para ele -- foi exatamente o DIV.modal-foot que a
     revisão mediu na rodada 1, com o botão nascendo dentro do corpo do modal. */
  const hitG = await pgP.evaluate((o) => {
    osList = [o];
    closeModal(); openDetalhe('os1');
    /* o mini-tour da view (Story 18) é um overlay PROPRIO, com backdrop, e por desenho fica
       na frente de tudo: ele não tem nada a ver com a camada medida aqui. */
    const tr = document.getElementById('tourRoot'); if (tr) tr.innerHTML = '';
    const ov = document.getElementById('curOverlay');
    const quemRecebe = (btn) => {
      const r = btn.getBoundingClientRect();
      const el = document.elementFromPoint(Math.round(r.left + r.width / 2),
                                           Math.round(r.top + r.height / 2));
      return { rotulo: (btn.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28),
               rect: { w: Math.round(r.width), h: Math.round(r.height), t: Math.round(r.top) },
               recebe: !!(el && (el === btn || btn.contains(el))),
               quem: el ? (el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : '')) : '(nada)' };
    };
    const mapa = [...ov.querySelectorAll('button')]
      .find(x => (x.textContent || '').includes('Abrir no mapa'));
    return {
      mapa: mapa ? quemRecebe(mapa) : null,
      rodape: [...ov.querySelectorAll('.modal-foot button')].map(quemRecebe)
    };
  }, osDeTeste('Rua X, 10 — https://maps.app.goo.gl/abc'));
  console.log('  botao do mapa:', JSON.stringify(hitG.mapa));
  for (const r of hitG.rodape) console.log('    rodape:', JSON.stringify(r));
  assert(hitG.mapa !== null, 'o botao do mapa existe em 320x568 (gestor)');
  assert(hitG.mapa.rect.w > 0 && hitG.mapa.rect.h > 0, 'o botao do mapa tem area de toque');
  assert(hitG.mapa.recebe,
    'em 320x568 o toque no centro do botao do mapa chega NELE (veio: ' + hitG.mapa.quem + ')');
  assert(hitG.rodape.length >= 4 && hitG.rodape.every(r => r.recebe),
    'nenhum outro botao do rodape perdeu o toque: ' +
    JSON.stringify(hitG.rodape.filter(r => !r.recebe)));

  const hitT = await pgP.evaluate((o) => {
    session = { perfil: 'tecnico', nome: 'Paulo', uid: 'u', role: 'Técnico de Campo', workspaceId: 'ws' };
    closeModal();
    osList = [o]; execOS = null;
    abrirExecucao('os1');
    const tr = document.getElementById('tourRoot'); if (tr) tr.innerHTML = '';
    const btn = [...document.getElementById('contentArea').querySelectorAll('button')]
      .find(x => (x.textContent || '').includes('Abrir no mapa'));
    if (!btn) return { achou: false };
    btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect();
    const el = document.elementFromPoint(Math.round(r.left + r.width / 2),
                                         Math.round(r.top + r.height / 2));
    return { achou: true, recebe: !!(el && (el === btn || btn.contains(el))),
             quem: el ? (el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : '')) : '(nada)' };
  }, osDeTeste('Rua X, 10 — https://maps.app.goo.gl/abc'));
  console.log('  botao do tecnico em 320x568:', JSON.stringify(hitT));
  assert(hitT.achou, 'o botao da execucao existe em 320x568 (tecnico)');
  assert(hitT.recebe,
    'em 320x568 o toque no botao da execucao chega NELE (veio: ' + hitT.quem + ')');

  console.log('\n=== erros de pagina ===');
  console.log(erros.length ? erros : '(nenhum)');
  assert(erros.length === 0, 'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e => { console.error('\n' + e.message); process.exit(1); });
