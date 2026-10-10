/* Quem testa o publicador de regras?
 *
 * `ferramentas/publicar-regras.js` e a peca que decide "publica ou nao publica regra do
 * Firestore em producao, com dados de cliente". Ate 09/10/2026 ela nao tinha UMA linha de
 * teste: `testes/executar.js` so varre `testes/`, e nada no repositorio olhava para
 * `ferramentas/`. A revisao mediu o buraco: inverter o portao (`if (false)` no lugar de
 * `if (suite.status !== 0)`) deixava `npm test` VERDE -- a peca mais consequente do projeto
 * sem rede nenhuma.
 *
 * COMO TESTA SEM PUBLICAR NADA: monta uma RAIZ de mentira numa pasta temporaria --
 * index.html com um projectId falso, firestore.rules falso, firebase.json falso,
 * testes/teste-regras.js falso (sai 0 ou 1 conforme a variavel CODIGO_SUITE) e um
 * node_modules/.bin/firebase falso que, em vez de publicar, GRAVA UM ARQUIVO com os
 * argumentos que recebeu -- e copia o publicador DE VERDADE para dentro dela. O publicador
 * resolve tudo a partir de `path.resolve(__dirname, '..')`, entao a copia enxerga so a raiz
 * falsa. Nenhuma chamada sai desta maquina.
 *
 * O "marcador de publicacao" e o que torna o veredito observavel: se o arquivo existe, o
 * publicador CHAMOU o deploy. "Nao deu erro" nao prova que ele nao publicou.
 *
 * CHECK 7 e o controle positivo da propria suite: ele muta a copia (inverte o portao) e
 * confirma que a copia mutada PUBLICA com a suite vermelha. Sem ele, os checks 1-6 poderiam
 * estar medindo outra coisa e ninguem saberia.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ_REAL = path.resolve(__dirname, '..');
const PUBLICADOR_REAL = path.join(RAIZ_REAL, 'ferramentas', 'publicar-regras.js');
const PROJETO_FALSO = 'demo-publicar-teste';

function assert(c, m) { if (!c) throw new Error('FALHOU: ' + m); console.log('  ok - ' + m); }
const linha = () => console.log('');

const raizTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mappo-publicar-'));
let nCenario = 0;

/* Uma raiz falsa por cenario: um deploy de um cenario nao pode ser lido como o do outro. */
function montarRaizFalsa(opcoes) {
  const o = opcoes || {};
  const raiz = path.join(raizTmp, 'raiz-' + ++nCenario);
  fs.mkdirSync(path.join(raiz, 'testes'), { recursive: true });
  fs.mkdirSync(path.join(raiz, 'ferramentas'), { recursive: true });
  fs.mkdirSync(path.join(raiz, 'node_modules', '.bin'), { recursive: true });

  fs.writeFileSync(path.join(raiz, 'index.html'),
    '<script>\nconst firebaseConfig = {\n  apiKey: "x",\n  projectId: "' + PROJETO_FALSO + '"\n};\n</script>\n');
  fs.writeFileSync(path.join(raiz, 'firestore.rules'), "rules_version = '2';\n// regra de mentira\n");
  fs.writeFileSync(path.join(raiz, 'firebase.json'),
    JSON.stringify({ firestore: { rules: 'firestore.rules' } }, null, 2));

  /* A suite falsa grava que rodou -- e assim um check pode afirmar que ela NAO rodou, que e o
     que importa nos casos em que o publicador tem de abortar antes de qualquer coisa. */
  const marcadorSuite = path.join(raiz, 'SUITE-RODOU');
  fs.writeFileSync(path.join(raiz, 'testes', 'teste-regras.js'),
    'require("fs").writeFileSync(' + JSON.stringify(marcadorSuite) + ', "rodou");\n'
    + 'console.log("suite de mentira: codigo " + (process.env.CODIGO_SUITE || "0"));\n'
    + 'process.exit(Number(process.env.CODIGO_SUITE || 0));\n');

  /* O "firebase" falso: nao publica, registra os argumentos. */
  const marcadorDeploy = path.join(raiz, 'DEPLOY-CHAMADO');
  const alvoJs = path.join(raiz, 'node_modules', '.bin', 'fake-firebase.js');
  fs.writeFileSync(alvoJs,
    'require("fs").writeFileSync(' + JSON.stringify(marcadorDeploy) + ', process.argv.slice(2).join(" "));\n'
    + 'console.log("firebase de mentira: " + process.argv.slice(2).join(" "));\n');
  if (process.platform === 'win32') {
    fs.writeFileSync(path.join(raiz, 'node_modules', '.bin', 'firebase.cmd'),
      '@echo off\r\nnode "%~dp0fake-firebase.js" %*\r\n');
  } else {
    const sh = path.join(raiz, 'node_modules', '.bin', 'firebase');
    fs.writeFileSync(sh, '#!/bin/sh\nexec node "$(dirname "$0")/fake-firebase.js" "$@"\n');
    fs.chmodSync(sh, 0o755);
  }

  let fonte = fs.readFileSync(PUBLICADOR_REAL, 'utf8');
  if (o.mutacao) {
    const n = fonte.split(o.mutacao.de).length - 1;
    if (n !== 1) {
      throw new Error('FALHOU: a mutacao do CHECK 7 nao achou a ancora "' + o.mutacao.de
        + '" (casou ' + n + 'x) em publicar-regras.js -- o arquivo foi reescrito. Refaca a'
        + ' mutacao, senao este controle positivo deixa de provar qualquer coisa.');
    }
    fonte = fonte.replace(o.mutacao.de, o.mutacao.para);
  }
  fs.writeFileSync(path.join(raiz, 'ferramentas', 'publicar-regras.js'), fonte);

  return { raiz, marcadorSuite, marcadorDeploy };
}

/* Ambiente explicito: se quem rodou `npm test` tiver MAPPO_RAIZ definida (o gancho do
   controle), ela vazaria para TODOS os cenarios e o publicador abortaria em todos -- seis
   checks verdes medindo a mesma recusa. */
function rodar(cenario, args, extras) {
  const env = { ...process.env };
  delete env.MAPPO_RAIZ;
  Object.keys(env).filter((k) => k.startsWith('npm_config_')).forEach((k) => { delete env[k]; });
  Object.assign(env, extras || {});
  const r = spawnSync(process.execPath, [path.join(cenario.raiz, 'ferramentas', 'publicar-regras.js'), ...args], {
    cwd: cenario.raiz,
    env,
    encoding: 'utf8',
  });
  return {
    codigo: r.status === null ? 1 : r.status,
    saida: (r.stdout || '') + (r.stderr || ''),
    publicou: fs.existsSync(cenario.marcadorDeploy),
    argsDoDeploy: fs.existsSync(cenario.marcadorDeploy) ? fs.readFileSync(cenario.marcadorDeploy, 'utf8').trim() : null,
    suiteRodou: fs.existsSync(cenario.marcadorSuite),
  };
}

(() => {
  console.log('=== CHECK 1: suite VERDE publica, e publica no projeto lido do index.html ===');
  {
    const c = montarRaizFalsa();
    const r = rodar(c, [], { CODIGO_SUITE: '0' });
    console.log('  ', JSON.stringify({ codigo: r.codigo, publicou: r.publicou, args: r.argsDoDeploy }));
    assert(r.codigo === 0, 'sai com codigo 0');
    assert(r.suiteRodou === true, 'a suite de regras foi executada');
    assert(r.publicou === true, 'CONTROLE POSITIVO: com a suite verde ele DE FATO chama o deploy');
    assert(/PUBLICADO/.test(r.saida), 'e diz que publicou');
    assert(r.argsDoDeploy === 'deploy --only firestore:rules --project ' + PROJETO_FALSO,
      'com os argumentos certos -- apenas as regras, e no projeto do index.html: ' + r.argsDoDeploy);
    assert(/sha256 do firestore.rules: [0-9a-f]{64}/.test(r.saida),
      'e registra a impressao digital do que publicou (o caminho do arquivo nao identifica o conteudo)');
    assert(/git nao respondeu|HEAD: /.test(r.saida), 'e o HEAD, ou diz que o git nao respondeu');
  }

  linha(); console.log('=== CHECK 2: suite VERMELHA nao publica (o portao) ===');
  {
    const c = montarRaizFalsa();
    const r = rodar(c, [], { CODIGO_SUITE: '1' });
    console.log('  ', JSON.stringify({ codigo: r.codigo, publicou: r.publicou }));
    assert(r.suiteRodou === true, 'a suite rodou');
    assert(r.publicou === false, 'NADA foi publicado');
    assert(r.codigo !== 0, 'e o comando sai com codigo diferente de zero: ' + r.codigo);
    assert(/A SUITE DE REGRAS FALHOU/.test(r.saida), 'dizendo por que nao publicou');
  }

  linha(); console.log('=== CHECK 3: --seco roda a suite, mostra o comando e NAO publica ===');
  {
    const c = montarRaizFalsa();
    const r = rodar(c, ['--seco'], { CODIGO_SUITE: '0' });
    console.log('  ', JSON.stringify({ codigo: r.codigo, publicou: r.publicou }));
    assert(r.codigo === 0, 'sai com codigo 0');
    assert(r.suiteRodou === true, 'a suite rodou (modo seco nao e "nao testar")');
    assert(r.publicou === false, 'e nada foi publicado');
    assert(/MODO SECO/.test(r.saida) && /NADA FOI PUBLICADO/.test(r.saida),
      'e a saida diz, em letra grande, que nada foi publicado');
    assert(/deploy --only firestore:rules --project/.test(r.saida),
      'mostrando o comando que usaria');
  }

  linha(); console.log('=== CHECK 4: argumento desconhecido aborta ANTES de tudo ===');
  /* O achado da revisao de 09/10/2026: `--secco` e `--dry-run` caiam no caminho de PUBLICAR,
     porque o script so perguntava `includes("--seco")`. */
  for (const flag of ['--secco', '--dry-run', '--seco=1', 'publicar']) {
    const c = montarRaizFalsa();
    const r = rodar(c, [flag], { CODIGO_SUITE: '0' });
    assert(r.codigo !== 0, flag + ': sai com codigo diferente de zero');
    assert(r.publicou === false, flag + ': NAO publicou');
    assert(r.suiteRodou === false, flag + ': e nem chegou a rodar a suite (aborta antes de tudo)');
    assert(r.saida.indexOf(flag) >= 0, flag + ': a saida NOMEIA o argumento recusado');
  }
  {
    const c = montarRaizFalsa();
    const r = rodar(c, ['--seco', '--seco'], { CODIGO_SUITE: '0' });
    assert(r.codigo === 0 && r.publicou === false, 'CONTROLE: --seco repetido continua sendo modo seco, nao erro');
  }

  linha(); console.log('=== CHECK 5: bandeira ENGOLIDA pelo npm nao vira publicacao ===');
  /* `npm run regras:publicar --seco` (sem o `--`) nao passa argv nenhum: o npm consome a
     bandeira e deixa npm_config_seco=true no ambiente. O script via argv vazio e PUBLICAVA,
     com quem digitou convencido de estar em modo seco. */
  {
    const c = montarRaizFalsa();
    const r = rodar(c, [], { CODIGO_SUITE: '0', npm_config_seco: 'true' });
    console.log('  ', JSON.stringify({ codigo: r.codigo, publicou: r.publicou }));
    assert(r.codigo !== 0, 'sai com codigo diferente de zero');
    assert(r.publicou === false, 'NAO publicou');
    assert(r.suiteRodou === false, 'nem rodou a suite');
    assert(/engoliu uma bandeira/.test(r.saida) && /-- --seco/.test(r.saida),
      'e explica que faltaram os dois tracos');
  }
  {
    /* CONTROLE NEGATIVO: as npm_config_* que o proprio npm define em toda execucao nao podem
       ser lidas como bandeira engolida, senao `npm run regras:publicar` nunca publicaria. */
    const c = montarRaizFalsa();
    const r = rodar(c, [], {
      CODIGO_SUITE: '0',
      npm_config_user_agent: 'npm/10.0.0 node/v20',
      npm_config_cache: '/tmp/cache',
      npm_config_prefix: '/usr',
    });
    assert(r.publicou === true,
      'CONTROLE NEGATIVO: as npm_config_* normais do npm NAO bloqueiam a publicacao');
  }

  linha(); console.log('=== CHECK 6: MAPPO_RAIZ definida aborta (testaria uma pasta, publicaria outra) ===');
  {
    const c = montarRaizFalsa();
    const r = rodar(c, [], { CODIGO_SUITE: '0', MAPPO_RAIZ: raizTmp });
    console.log('  ', JSON.stringify({ codigo: r.codigo, publicou: r.publicou }));
    assert(r.codigo !== 0, 'sai com codigo diferente de zero');
    assert(r.publicou === false, 'NAO publicou');
    assert(r.suiteRodou === false, 'e nem rodou a suite');
    assert(/MAPPO_RAIZ/.test(r.saida), 'nomeando a variavel');
  }

  linha(); console.log('=== CHECK 7: CONTROLE POSITIVO -- o portao invertido PUBLICA com a suite vermelha ===');
  /* Sem este check, os seis acima poderiam estar medindo outra coisa: um script que nunca
     publicasse passaria o CHECK 2 sem ter portao nenhum. Aqui a copia e mutada de proposito
     -- o `if` do portao vira `if (false)` -- e o esperado e que ela PUBLIQUE mesmo com a
     suite vermelha. Se isto NAO acontecer, o CHECK 2 nao esta medindo o portao. */
  {
    const c = montarRaizFalsa({
      mutacao: { de: 'if (suite.status !== 0) {', para: 'if (false) {' },
    });
    const r = rodar(c, [], { CODIGO_SUITE: '1' });
    console.log('  ', JSON.stringify({ codigo: r.codigo, publicou: r.publicou }));
    assert(r.suiteRodou === true, 'a suite rodou (e saiu 1)');
    assert(r.publicou === true,
      'a copia COM O PORTAO INVERTIDO publicou mesmo com a suite vermelha -- '
      + 'e por isso o CHECK 2, que mede o contrario, prova o portao');
  }

  fs.rmSync(raizTmp, { recursive: true, force: true });
  console.log('\nTODOS OS CHECKS PASSARAM.');
})();
