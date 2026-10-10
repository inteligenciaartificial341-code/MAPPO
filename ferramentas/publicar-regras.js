/* PUBLICAR AS REGRAS DO FIRESTORE -- com a suite na frente, sempre.
 *
 * Uso:
 *   npm run regras:publicar           roda a suite e, SO se ela passar, publica
 *   npm run regras:publicar -- --seco roda a suite e MOSTRA o comando, sem publicar
 *
 * POR QUE ISTO EXISTE: ate 08/10/2026 nao havia passo de publicacao em lugar nenhum do
 * projeto -- nem script, nem CI, nem documento. `npm test` ficava verde provando o ARQUIVO
 * firestore.rules no Emulator, enquanto o Firestore de producao podia estar aplicando outra
 * coisa: a regra so entra no ar com um `firebase deploy` que alguem precisa lembrar de rodar.
 * "Lembrar" nao e mecanismo. Este script e o mecanismo: a suite de regras na frente, e a
 * publicacao atras dela.
 *
 * O QUE ELE NAO FAZ, e nao deve parecer que faz:
 *   - nao prova que a regra PUBLICADA e esta: a CLI do Firebase nao tem comando para LER a
 *     regra que esta no ar. Quem mede producao e `node testes/diag-regrasreais.js`, por
 *     COMPORTAMENTO (tenta o que a regra deve negar).
 *   - nao publica indices (firestore.indexes.json), de proposito: `--only firestore:rules`.
 *     Indice nao tem rede de teste nenhuma neste projeto (CLAUDE.md), e publicar junto
 *     esconderia isso atras de um comando verde.
 *   - nao commita, nao faz push, nao toca em git.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');

function linha() { console.log('-'.repeat(72)); }

function abortar(mensagem, detalhe) {
  console.error('\nNAO PUBLIQUEI: ' + mensagem);
  if (detalhe) console.error(detalhe);
  linha();
  process.exit(1);
}

/* ══════════════ LISTA BRANCA DE ARGUMENTOS (revisao de 09/10/2026) ══════════════
   Este script publica regra em producao. Antes da revisao ele perguntava
   `argv.includes('--seco')`, e QUALQUER outra coisa caia no caminho de publicar:
     node ferramentas/publicar-regras.js --secco   → SECO=false → publicaria
     node ferramentas/publicar-regras.js --dry-run → SECO=false → publicaria
   A supervisora provocou isso sem querer ao conferir o achado, e so nao publicou porque um
   `head -6` matou o processo antes da chamada a API de regras. Foi sorte, nao mecanismo.
   Agora e lista branca: argv tem de ser exatamente [] ou ['--seco']. Mesmo princípio que
   testes/executar.js ja aplica com flagsRuins -- "uma flag digitada errada nao pode virar
   uma execucao que finge ter obedecido" --, e aqui o lado errado e mais caro.
   Fica ANTES de tudo: antes de ler arquivo, antes da suite, antes de qualquer decisao. */
const ARGS = process.argv.slice(2);
const FLAGS_CONHECIDAS = ['--seco'];
const ruins = ARGS.filter((a) => !FLAGS_CONHECIDAS.includes(a));
if (ruins.length) {
  console.error('\nNAO PUBLIQUEI: argumento que eu nao conheco: ' + ruins.join(', '));
  console.error('Conhecidos: ' + FLAGS_CONHECIDAS.join(', ') + ' (ou nenhum argumento).');
  console.error('');
  console.error('Nada foi publicado, e nada foi testado. Um argumento digitado errado neste');
  console.error('script publicaria regra em producao achando que estava em modo seco -- por');
  console.error('isso ele aborta em vez de "ignorar o que nao entendeu".');
  console.error('  npm run regras:publicar              publica, com a suite na frente');
  console.error('  npm run regras:publicar -- --seco    roda a suite e MOSTRA o comando');
  linha();
  process.exit(1);
}

/* A segunda armadilha, medida na mesma revisao: `npm run regras:publicar --seco` SEM o `--`
   nao chega aqui como argumento -- o npm o engole e vira a variavel de ambiente
   npm_config_seco. O script via argv vazio e publicava de verdade, com quem digitou
   convencido de que estava em modo seco. Qualquer npm_config_* booleana que nao seja do
   proprio npm e tratada como bandeira engolida. */
const NPM_CONFIG_ESPERADAS = ['npm_config_user_agent', 'npm_config_cache', 'npm_config_globalconfig',
  'npm_config_global_prefix', 'npm_config_init_module', 'npm_config_local_prefix',
  'npm_config_metrics_registry', 'npm_config_node_gyp', 'npm_config_noproxy', 'npm_config_prefix',
  'npm_config_userconfig', 'npm_config_npm_version', 'npm_config_frozen_lockfile'];
const engolidas = Object.keys(process.env)
  .filter((k) => k.startsWith('npm_config_'))
  .filter((k) => !NPM_CONFIG_ESPERADAS.includes(k))
  .filter((k) => process.env[k] === 'true' || process.env[k] === 'false');
if (engolidas.length) {
  console.error('\nNAO PUBLIQUEI: o npm engoliu uma bandeira que voce passou: '
    + engolidas.map((k) => '--' + k.slice('npm_config_'.length).replace(/_/g, '-')).join(', '));
  console.error('');
  console.error('`npm run regras:publicar --seco` NAO passa --seco para o script: o npm a');
  console.error('consome como configuracao dele, o script recebe argv vazio, e o que eu faria');
  console.error('era PUBLICAR de verdade. Com os dois tracos a bandeira chega:');
  console.error('  npm run regras:publicar -- --seco');
  linha();
  process.exit(1);
}

const SECO = ARGS.includes('--seco');

/* O projectId sai do proprio index.html: publicar no projeto errado e um estrago silencioso,
   e um argumento explicito e mais seguro que o "projeto selecionado" invisivel da CLI. */
function projetoDoApp() {
  const arq = path.join(RAIZ, 'index.html');
  let txt;
  try {
    txt = fs.readFileSync(arq, 'utf8');
  } catch (e) {
    abortar('nao consegui ler ' + arq, (e.code || '?') + ' - ' + e.message);
  }
  const m = txt.match(/projectId:\s*"([^"]+)"/);
  if (!m) abortar('nao achei projectId no firebaseConfig de index.html -- sem isso eu nao sei em QUAL projeto publicaria.');
  return m[1];
}

function binarioFirebase() {
  const nome = process.platform === 'win32' ? 'firebase.cmd' : 'firebase';
  const p = path.join(RAIZ, 'node_modules', '.bin', nome);
  if (!fs.existsSync(p)) {
    abortar('nao achei a CLI do Firebase em node_modules/.bin/' + nome + '.',
      'Rode:  npm install');
  }
  return p;
}

console.log('MAPPO — publicar firestore.rules');
console.log('pasta: ' + RAIZ);
linha();

/* MAPPO_RAIZ e o gancho que faz as suites rodarem contra OUTRA pasta (a versao anterior, o
   controle). Publicar com ele ligado significaria "testei lá e publiquei daqui", que e
   exatamente o engano que este script existe para impedir. */
if (process.env.MAPPO_RAIZ) {
  abortar('MAPPO_RAIZ esta definida (' + process.env.MAPPO_RAIZ + ').',
    'Com ela ligada a suite testa OUTRA pasta e a publicacao sairia desta: as duas podem\n'
    + 'nao ser a mesma regra. Limpe a variavel e rode de novo.');
}

const regras = path.join(RAIZ, 'firestore.rules');
if (!fs.existsSync(regras)) abortar('nao existe firestore.rules nesta pasta: ' + regras);

const projeto = projetoDoApp();
console.log('projeto de destino (lido do index.html): ' + projeto);
console.log('arquivo a publicar: ' + regras);

/* ══════ O QUE EXATAMENTE ESTA SENDO PUBLICADO (revisao de 09/10/2026) ══════
   O caminho do arquivo nao identifica o conteudo. A area 6 de VERIFICACAO-MANUAL.md manda
   registrar "o commit publicado", e esse registro nasceria FALSO no estado normal de
   trabalho: publicar de arvore suja publica o arquivo do disco, nao o do commit. Imprimir a
   impressao digital do arquivo, o HEAD curto e o estado sujo/limpo DAQUELE arquivo e o que
   torna o registro verificavel depois -- e o diag-regrasreais mede comportamento, nao
   conteudo, entao nada mais liga "o que esta no ar" a "o que eu publiquei naquele dia". */
function hashDoArquivo(p) {
  try {
    return require('crypto').createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  } catch (e) { return '(nao consegui ler: ' + (e.code || '?') + ')'; }
}
function git(args) {
  try {
    return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' }).trim();
  } catch (e) { return null; }
}
const impressao = hashDoArquivo(regras);
const head = git(['rev-parse', '--short', 'HEAD']);
const sujoRegras = git(['status', '--porcelain', '--', 'firestore.rules']);
console.log('sha256 do firestore.rules: ' + impressao);
console.log('HEAD: ' + (head || '(git nao respondeu)'));
if (sujoRegras === null) {
  console.log('estado do arquivo: (git nao respondeu -- nao sei se bate com o commit)');
} else if (sujoRegras === '') {
  console.log('estado do arquivo: LIMPO -- e identico ao do commit ' + (head || '?'));
} else {
  console.log('estado do arquivo: SUJO (' + sujoRegras.trim() + ')');
  console.log('  ATENCAO: o que vai para producao e o arquivo do DISCO, nao o do commit.');
  console.log('  Ao registrar na area 6 de testes/VERIFICACAO-MANUAL.md, anote o sha256 acima');
  console.log('  -- "commit ' + (head || '?') + '" sozinho seria registro falso.');
}

/* ── 1. a suite de regras, SEMPRE antes ── */
console.log('\n[1/2] Rodando a suite de regras no Emulator (npm run test:regras)...\n');
const suite = spawnSync(process.execPath, [path.join(RAIZ, 'testes', 'teste-regras.js')], {
  cwd: RAIZ,
  stdio: 'inherit',
});
if (suite.error) {
  abortar('nao consegui rodar a suite de regras.',
    (suite.error.code || '?') + ' - ' + suite.error.message);
}
if (suite.status !== 0) {
  console.error('\n' + '-'.repeat(72));
  console.error('A SUITE DE REGRAS FALHOU (codigo ' + suite.status + ').');
  console.error('');
  console.error('Nada foi publicado. A regra que esta no ar continua a de antes -- e isso e');
  console.error('proposito: publicar uma regra que a rede reprova e a unica coisa pior que nao');
  console.error('publicar. A saida completa da suite esta acima; ela nomeia cada caso que falhou');
  console.error('e a linha de firestore.rules correspondente.');
  console.error('');
  console.error('Se a suite falhou por falta de Java ou do emulador, as instrucoes estao em');
  console.error('testes/README.md (npm run emulador:baixar).');
  console.error('-'.repeat(72));
  process.exit(1);
}

/* ── 2. a publicacao ── */
const bin = binarioFirebase();
const args = ['deploy', '--only', 'firestore:rules', '--project', projeto];
console.log('\n[2/2] Suite verde. Comando de publicacao:');
console.log('      ' + bin + ' ' + args.join(' '));

if (SECO) {
  linha();
  console.log('MODO SECO (--seco): NADA FOI PUBLICADO.');
  console.log('A regra no ar continua a de antes. Rode sem --seco para publicar de verdade.');
  linha();
  process.exit(0);
}

const deploy = spawnSync(bin, args, {
  cwd: RAIZ,
  stdio: 'inherit',
  shell: process.platform === 'win32',   // .cmd nao e executavel direto no Windows
});
if (deploy.error) {
  abortar('a CLI do Firebase nao rodou.',
    (deploy.error.code || '?') + ' - ' + deploy.error.message
    + '\nA suite passou, mas a publicacao nao aconteceu: a regra no ar continua a de antes.');
}
if (deploy.status !== 0) {
  console.error('\n' + '-'.repeat(72));
  console.error('A PUBLICACAO FALHOU (codigo ' + deploy.status + ').');
  console.error('A suite passou, entao o problema nao e a regra: e a CLI, a autenticacao');
  console.error('(firebase login) ou a rede. A regra no ar continua a de antes.');
  console.error('-'.repeat(72));
  process.exit(deploy.status || 1);
}

linha();
console.log('PUBLICADO: as regras no ar passaram a ser as desta pasta.');
console.log('  sha256 do que foi publicado: ' + impressao);
console.log('  HEAD no momento: ' + (head || '?') + (sujoRegras ? '  (arquivo SUJO: nao e o do commit)' : ''));
console.log('  Registre estes dois na area 6 de testes/VERIFICACAO-MANUAL.md.');
console.log('');
console.log('Confira por COMPORTAMENTO, nao por memoria -- a CLI nao le a regra publicada:');
console.log('  node testes/diag-regrasreais.js');
linha();
