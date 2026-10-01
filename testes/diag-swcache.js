/* DIAGNOSTICO DE PRODUCAO (mede, nao reprova) -- quanto o GitHub Pages atrasa o aviso de
 * versao nova, e o que de fato esta no ar.
 *
 * BATE NO SITE PUBLICADO. Fica FORA do npm test e do CI (convencao da casa: testes/README.md).
 * Roda a mao, quando o proprietario pedir:  npm run test:producao
 *
 * POR QUE EXISTE: a correcao de 01/10/2026 faz o CACHE_VERSION do sw.js mudar a cada
 * publicacao, porque o navegador so instala um Service Worker novo quando os BYTES do sw.js
 * mudam. Mas quem entrega esses bytes e o GitHub Pages, com o cabecalho de cache DELE -- e o
 * teste local serve o sw.js com no-store de proposito, para isolar a comparacao de bytes.
 * Entao existe uma pergunta que nenhuma suite responde: em producao, quanto tempo o navegador
 * pode ficar com o sw.js antigo na mao antes de perceber que ha versao nova?
 *
 * O QUE MEDE:
 *   1. os cabecalhos de cache do sw.js e do index.html publicados;
 *   2. se o que esta no ar satisfaz o guardiao -- ou seja, se o CACHE_VERSION do sw.js
 *      publicado e a impressao digital do index.html publicado. Se nao for, a publicacao
 *      saiu pela metade (um dos dois arquivos ainda e o antigo no CDN), e o aviso nao chega;
 *   3. se o servidor responde 304 a uma revalidacao (ETag), que e o que torna a reconsulta
 *      barata.
 *
 * O QUE NAO MEDE (e nao deve ser lido como se medisse):
 *   - o comportamento do Safari do iPhone, que e onde o app roda de verdade;
 *   - a regra do navegador para o script do Service Worker: com updateViaCache no padrao
 *     ('imports'), o navegador NAO usa o cache de HTTP para o script principal, e a
 *     especificacao manda ignorar o cache quando a resposta guardada tem mais de 24h. Ou
 *     seja: um max-age alto aqui NAO significa necessariamente atraso de max-age no aviso.
 *     O que esta medido abaixo e o cabecalho; a conduta do navegador em cima dele, nao.
 */
'use strict';
const crypto = require('crypto');
const fs = require('fs'), path = require('path');

const RAIZ = process.env.MAPPO_RAIZ || path.resolve(__dirname, '..');
const BASE = 'https://inteligenciaartificial341-code.github.io/MAPPO/';
const PREFIXO_VERSAO = 'mappo-shell-';

/* A MESMA regra da suíte testes/teste-atualizacao.js, de propósito: a impressão é da casca
   inteira (os arquivos de SHELL_URLS, lidos do próprio sw.js), texto com CRLF→LF, nomes
   ordenados. Se esta conta divergir da de lá, este diagnóstico passa a acusar "não batem"
   com a publicação inteira correta -- medir a forma antiga e mandar o proprietário caçar
   problema inexistente já custou um dia neste projeto. */
const EH_TEXTO = /\.(html|json|webmanifest|js|css|svg|txt)$/i;

function hashDeTexto(txt) {
  return crypto.createHash('sha256').update(txt.replace(/\r\n/g, '\n'), 'utf8').digest('hex');
}
function hashDeBytes(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}
function cascaDoSw(fonteSw) {
  const bloco = fonteSw.match(/const\s+SHELL_URLS\s*=\s*\[([\s\S]*?)\]/);
  if (!bloco) return null;
  const nomes = [];
  bloco[1].replace(/'([^']+)'/g, (_, u) => {
    const nome = u.replace(/^\.\//, '');
    if (nome && nomes.indexOf(nome) === -1) nomes.push(nome);
    return _;
  });
  return nomes.sort();
}
function juntarImpressao(partes) {
  return PREFIXO_VERSAO + crypto.createHash('sha256').update(partes.join('\n'), 'utf8').digest('hex').slice(0, 12);
}

const CABECALHOS = ['cache-control', 'etag', 'last-modified', 'age', 'expires', 'content-length', 'content-type', 'x-cache'];

/* Teto de tempo por requisição. Sem ele, um GitHub Pages que aceita a conexão e não responde
   penduraria o `npm run test:producao` para sempre: diagnóstico não tem o timeout do runner
   porque o dono roda à mão. É o `fetch` global do Node (>=18, declarado em engines do
   package.json) -- nenhuma dependência nova. */
const TETO_MS = 15000;

async function baixar(caminho, extras) {
  const url = BASE + caminho;
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: extras || {}, redirect: 'follow', signal: AbortSignal.timeout(TETO_MS) });
    let corpo = '', bytes = null;
    if (r.status !== 304) {
      bytes = Buffer.from(await r.arrayBuffer());
      corpo = bytes.toString('utf8');      // só vale para os arquivos de texto
    }
    const h = {};
    CABECALHOS.forEach((c) => { const v = r.headers.get(c); if (v !== null) h[c] = v; });
    return { ok: true, status: r.status, h, corpo, bytes, ms: Date.now() - t0, url };
  } catch (e) {
    return { ok: false, erro: (e && e.code) + ' - ' + (e && e.message), ms: Date.now() - t0, url };
  }
}

/* Impressão da casca PUBLICADA: baixa cada arquivo de SHELL_URLS e soma igual à suíte. */
async function impressaoPublicada(nomes) {
  const partes = [], falhas = [];
  for (const nome of nomes) {
    const r = await baixar(nome);
    if (!r.ok || r.status !== 200) { falhas.push(nome + ' (' + (r.ok ? 'HTTP ' + r.status : r.erro) + ')'); continue; }
    partes.push(nome + ':' + (EH_TEXTO.test(nome) ? hashDeTexto(r.corpo) : hashDeBytes(r.bytes)));
  }
  return { impressao: falhas.length ? null : juntarImpressao(partes), falhas };
}

function impressaoLocal(nomes) {
  const partes = [], falhas = [];
  for (const nome of nomes) {
    const p = path.join(RAIZ, nome);
    try {
      partes.push(nome + ':' + (EH_TEXTO.test(nome) ? hashDeTexto(fs.readFileSync(p, 'utf8')) : hashDeBytes(fs.readFileSync(p))));
    } catch (e) { falhas.push(nome + ' (' + (e && e.code) + ')'); }
  }
  return { impressao: falhas.length ? null : juntarImpressao(partes), falhas };
}

function mostrar(rotulo, r) {
  console.log('\n=== ' + rotulo + ' ===');
  console.log('  ' + r.url);
  if (!r.ok) { console.log('  NAO DEU PARA BAIXAR: ' + r.erro + '  (' + r.ms + 'ms)'); return; }
  console.log('  HTTP ' + r.status + '   ' + r.ms + 'ms   ' + r.corpo.length + ' caracteres');
  CABECALHOS.forEach((c) => { if (r.h[c] !== undefined) console.log('  ' + c.padEnd(16, ' ') + r.h[c]); });
}

function segundosDoMaxAge(cc) {
  const m = (cc || '').match(/max-age=(\d+)/);
  return m ? Number(m[1]) : null;
}

(async () => {
  console.log('MAPPO — diagnóstico de cache do Service Worker em PRODUÇÃO');
  console.log('base: ' + BASE);
  console.log('hora local: ' + new Date().toLocaleString('pt-BR'));

  const sw = await baixar('sw.js');
  mostrar('sw.js publicado', sw);

  const idx = await baixar('index.html');
  mostrar('index.html publicado', idx);

  console.log('\n------------------------------------------------------------');
  console.log('O QUE ESTÁ NO AR:');

  if (!sw.ok || !idx.ok) {
    console.log('  Um dos dois arquivos não baixou — sem rede, ou o site fora do ar.');
    console.log('  Nada a concluir: "não consegui ler" não é "não existe".');
    console.log('------------------------------------------------------------');
    return;
  }

  const achado = sw.corpo.match(/const\s+CACHE_VERSION\s*=\s*'([^']*)'/);
  const versaoNoAr = achado ? achado[1] : null;
  const nomes = cascaDoSw(sw.corpo);
  console.log('  CACHE_VERSION no sw.js publicado: ' + (versaoNoAr || '(não encontrado — o formato da linha mudou?)'));
  if (!nomes || !nomes.length) {
    console.log('  Não deu para ler SHELL_URLS do sw.js publicado: sem a lista da casca não há o que comparar.');
    console.log('------------------------------------------------------------');
    return;
  }
  console.log('  casca publicada (de SHELL_URLS): ' + nomes.join(', '));
  const pub = await impressaoPublicada(nomes);
  if (!pub.impressao) {
    console.log('  Não deu para baixar toda a casca: ' + pub.falhas.join('; '));
    console.log('  Nada a concluir: "não consegui ler" não é "não bate".');
    console.log('------------------------------------------------------------');
    return;
  }
  console.log('  impressão da casca publicada:      ' + pub.impressao);
  if (versaoNoAr === pub.impressao) {
    console.log('  BATEM: a publicação está inteira, e quem abrir o app recebe o aviso de versão nova.');
  } else if (!versaoNoAr) {
    console.log('  Não deu para comparar: a linha do CACHE_VERSION não foi encontrada no arquivo publicado.');
  } else {
    console.log('  NÃO BATEM. As causas, em ordem de probabilidade:');
    console.log('   1. o que está no ar é um commit ANTERIOR ao desta pasta (veja a comparação abaixo);');
    console.log('   2. o CDN do GitHub Pages ainda está entregando algum dos arquivos antigo');
    console.log('      (espere alguns minutos e rode de novo — o teste é barato);');
    console.log('   3. o commit publicado tem casca nova com CACHE_VERSION antigo, que é');
    console.log('      exatamente o que a suíte testes/teste-atualizacao.js existe para impedir.');
    console.log('      Nesse caso, quem tem o app instalado NÃO vai ser avisado.');
  }

  /* Separa "a publicação saiu torta" de "ainda não publiquei": sem isto os dois chegam como
     a mesma negativa, e foi assim que um dia inteiro se gastou caçando problema inexistente. */
  console.log('\nO AR É ESTA PASTA?');
  const loc = impressaoLocal(nomes);
  console.log('  pasta: ' + RAIZ);
  if (!loc.impressao) {
    console.log('  Não deu para ler a casca local: ' + loc.falhas.join('; '));
  } else {
    let versaoLocal = '(não encontrado)';
    try {
      const m = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8').match(/const\s+CACHE_VERSION\s*=\s*'([^']*)'/);
      if (m) versaoLocal = m[1];
    } catch (e) { versaoLocal = '(não deu para ler o sw.js local: ' + (e && e.code) + ')'; }
    console.log('  impressão da casca local:          ' + loc.impressao);
    console.log('  CACHE_VERSION do sw.js local:      ' + versaoLocal);
    if (loc.impressao === pub.impressao) console.log('  A casca no ar é a desta pasta.');
    else console.log('  A casca no ar é DIFERENTE da desta pasta: há mudança local ainda não publicada.');
  }

  console.log('\nATRASO POSSÍVEL NO AVISO:');
  const maxAgeSw = segundosDoMaxAge(sw.h['cache-control']);
  console.log('  cache-control do sw.js: ' + (sw.h['cache-control'] || '(nenhum)'));
  if (maxAgeSw === null) {
    console.log('  Sem max-age declarado: o navegador decide sozinho quando reconsultar.');
  } else {
    console.log('  max-age = ' + maxAgeSw + 's (' + Math.round(maxAgeSw / 60) + ' min). É o teto do que o');
    console.log('  cache de HTTP guardaria — mas o script do Service Worker não vem do cache de HTTP');
    console.log('  com updateViaCache no padrão, então isto é o pior caso teórico, não o medido.');
  }
  if (sw.h['age'] !== undefined) console.log('  age = ' + sw.h['age'] + 's: é a idade da cópia que este CDN entregou agora.');

  console.log('\nREVALIDAÇÃO (ETag):');
  if (!sw.h['etag']) {
    console.log('  O servidor não mandou ETag: cada reconsulta baixa o arquivo inteiro.');
  } else {
    const r304 = await baixar('sw.js', { 'If-None-Match': sw.h['etag'] });
    if (!r304.ok) console.log('  A segunda consulta falhou: ' + r304.erro);
    else if (r304.status === 304) console.log('  HTTP 304: reconsultar é barato (não rebaixa o arquivo quando nada mudou).');
    else console.log('  HTTP ' + r304.status + ' em vez de 304: a revalidação baixa o arquivo inteiro de novo.');
  }

  console.log('\nPARA CONFERIR À MÃO (o que nenhum script aqui alcança):');
  console.log('  Abrir o app instalado no iPhone depois de uma publicação e cronometrar quanto');
  console.log('  tempo leva até a faixa aparecer. É o único número que vale para o uso real.');
  console.log('  Está em testes/VERIFICACAO-MANUAL.md.');
  console.log('------------------------------------------------------------');
})().catch((e) => {
  /* Diagnóstico não reprova, mas também não engole: o erro aparece inteiro. */
  console.error('\nO diagnóstico quebrou: ' + (e && e.code) + ' - ' + (e && e.message));
  console.error(e && e.stack);
});
