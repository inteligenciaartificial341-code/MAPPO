/* Rede de regras do Firestore: prova que `firestore.rules` continua negando o que
 * tem que negar -- e permitindo o que tem que permitir.
 *
 * QUAL DEFEITO ISSO IMPEDE DE VOLTAR: defeito de regra nao tem sintoma. Ninguem
 * reclama, nada quebra na tela, e a empresa A le os dados da empresa B em silencio.
 * As verificacoes feitas a mao (19 para `c56d38b`, 50 para a auditoria de 01/09, 9 para
 * o ponteiro de workspace) rodaram em scripts efemeros e foram DESCARTADAS -- o
 * CLAUDE.md exigia "teste no Emulator" sem existir suite versionada nenhuma. Este
 * arquivo e o mecanismo que faltava.
 *
 * COMO FUNCIONA: sobe o Firestore Emulator (local, gratuito, sem credencial nenhuma),
 * carrega o `firestore.rules` DESTE repositorio e exercita cada regra nos DOIS
 * sentidos -- quem pode e quem NAO pode. Teste que so confirma o caminho feliz nao
 * protege de nada.
 *
 * NUNCA TOCA EM PRODUCAO: o projeto usado e `demo-mappo-regras`. O prefixo `demo-`
 * e a garantia do proprio Firebase de que nem o SDK nem o emulador falam com um
 * projeto real -- nao existe credencial, token nem rede envolvida.
 *
 * QUATRO DEFESAS CONTRA A PROPRIA SUITE ENCOLHER EM SILENCIO -- todas vieram da
 * revisao adversarial de 26/09/2026, que achou a suite verde cobrindo menos do que
 * afirmava:
 *   1. PISO DE CASOS. A contagem nao e so impressa, e CONFERIDA. Apagar um grupo
 *      inteiro deixava a suite verde com uma fracao da cobertura -- o mesmo buraco que
 *      o runner tinha um nivel acima. O piso sobe de proposito quando casos entram.
 *   2. ESPELHO DAS LISTAS DA REGRA. `isGestorOnlyDoc()` tem 10 docIds e `ramoValido()`
 *      8 chaves reservadas. A suite LE essas duas listas do proprio `firestore.rules` e
 *      reprova se a lista dela divergir -- acrescentar um docId na regra sem acrescentar
 *      o caso aqui e falha, nao silencio.
 *   3. LEITURA PERMITIDA CONFERE O DADO. Para um membro a regra permite ler documento
 *      que nao existe, entao "nao lancou" nao prova nada: se a semeadura mudar de nome,
 *      metade da rede vira no-op verde. Todo caso de leitura afirma o conteudo.
 *   4. TODAS AS FALHAS, NAO A PRIMEIRA. Abortar na primeira esconde o estado das outras
 *      ~150 verificacoes e faz uma regra afrouxada parecer um problema pontual.
 *
 * GAP ACEITO: alguns casos abaixo afirmam que uma operacao e PERMITIDA mesmo sendo um
 * risco conhecido (ex.: tecnico escreve `mappo_os`; o mesmo convite serve a duas
 * pessoas). Estao marcados "[GAP ACEITO]" com o porque, e a contagem final os separa
 * das garantias. O objetivo nao e reprovar a decisao do proprietario: e impedir que ela
 * mude sozinha, sem ele saber.
 *
 * ESTA SUITE TESTA, NAO CORRIGE. Se um caso e uma regra discordarem, o caso descreve o
 * que a regra faz HOJE e a divergencia vai ao proprietario. Afrouxar a regra para o
 * teste passar e proibido (CLAUDE.md).
 *
 * Fonte dos gaps: _bmad-output/implementation-artifacts/deferred-work.md e
 * _audit/mappo-initial-audit.md.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');

/* Mesmo gancho das outras suites: MAPPO_RAIZ aponta a pasta sob teste. Aqui ela
 * decide de QUAL `firestore.rules` e `firebase.json` o teste roda -- e o que
 * permite rodar esta suite contra a versao anterior das regras (o "controle"). */
const RAIZ = process.env.MAPPO_RAIZ || path.resolve(__dirname, '..');
const ARQ_REGRAS = path.join(RAIZ, 'firestore.rules');
const ARQ_FIREBASE = path.join(RAIZ, 'firebase.json');

const PROJETO = 'demo-mappo-regras';
const PORTA_PADRAO = 8080;
const HOST = '127.0.0.1';

/* Quanto esperar o emulador responder. Na primeira execucao de um clone novo ele
 * ainda baixa o .jar (~60 MB), por isso a janela e larga. O runner aborta o arquivo
 * inteiro em 5 min, entao o README manda baixar o emulador uma vez antes. */
const ESPERA_EMULADOR_MS = Number(process.env.MAPPO_EMU_ESPERA_MS) > 0
  ? Number(process.env.MAPPO_EMU_ESPERA_MS)
  : 180000;

/* ── Piso de cobertura (defesa 1) ──
 * Nao e um numero decorativo: se `conferidos` ficar abaixo dele, a suite REPROVA.
 * Apagar um `grupo(...)` inteiro derruba a contagem e fica vermelho, em vez de passar
 * verde cobrindo um terco do que dizia cobrir. Ao acrescentar casos, suba o piso no
 * mesmo commit -- e essa a parte deliberada. */
const PISO_CASOS = 160;
const PISO_GRUPOS = 11;

const FUTURO = Date.now() + 7 * 24 * 60 * 60 * 1000;
const PASSADO = Date.now() - 60 * 1000;

/* ─────────────────────── relatorio ─────────────────────── */

const falhas = [];
let conferidos = 0;
let gapsAceitos = 0;
const gruposRodados = [];

function linha() {
  console.log('-'.repeat(72));
}

/* Uma falha de regra precisa dizer QUAL regra e QUAL cenario -- "permission denied"
 * sozinho nao diz nem se o problema e a regra, a semeadura ou o emulador. Registra e
 * SEGUE (defesa 4): a primeira falha nao pode esconder as outras 150 verificacoes. */
function registrarFalha(regra, cenario, esperado, obtido) {
  falhas.push({ regra, cenario, esperado, obtido });
  console.log('  FALHOU  ' + cenario);
  console.log('          regra em firestore.rules: ' + regra);
  console.log('          esperado: ' + esperado);
  console.log('          obtido:   ' + obtido);
}

/* ─────────────────────── preflight ─────────────────────── */

function temJava() {
  const r = spawnSync('java', ['-version'], { stdio: 'ignore' });
  if (r.error) {
    console.error('\nO Firestore Emulator precisa de Java e nao encontrei o comando "java".');
    console.error('Instale o Java 21 (Temurin) e abra um terminal novo:');
    console.error('  https://adoptium.net/temurin/releases/?version=21');
    console.error('Detalhe: ' + r.error.code + ' - ' + r.error.message);
    return false;
  }
  if (r.status !== 0) {
    console.error('\nO comando "java" existe mas terminou com codigo ' + r.status + '.');
    console.error('Confira a instalacao do Java 21 (Temurin): java -version');
    return false;
  }
  return true;
}

function caminhoFirebaseCli() {
  try {
    return require.resolve('firebase-tools/lib/bin/firebase.js');
  } catch (e) {
    console.error('\nO pacote "firebase-tools" nao esta instalado (e quem sobe o emulador).');
    console.error('Rode:  npm install');
    console.error('Detalhe: ' + e.code + ' - ' + e.message);
    return null;
  }
}

function carregarBibliotecas() {
  try {
    return {
      rut: require('@firebase/rules-unit-testing'),
      fs9: require('firebase/firestore'),
    };
  } catch (e) {
    console.error('\nFalta um dos pacotes da suite de regras');
    console.error('("@firebase/rules-unit-testing" e "firebase").');
    console.error('Rode:  npm install');
    console.error('Detalhe: ' + e.code + ' - ' + e.message);
    return null;
  }
}

/* A porta vem do `firebase.json` de proposito: o emulador tem que subir igual na
 * maquina do proprietario e no CI, e um numero repetido em dois arquivos vira dois
 * numeros diferentes na primeira vez que alguem muda um deles. */
function portaDoFirebaseJson() {
  try {
    const cfg = JSON.parse(fs.readFileSync(ARQ_FIREBASE, 'utf8'));
    const p = cfg && cfg.emulators && cfg.emulators.firestore && cfg.emulators.firestore.port;
    if (Number(p) > 0) return Number(p);
    console.log('aviso: firebase.json sem emulators.firestore.port; usando ' + PORTA_PADRAO);
  } catch (e) {
    console.log('aviso: nao foi possivel ler ' + ARQ_FIREBASE + ' (' + e.code + '); usando ' + PORTA_PADRAO);
  }
  return PORTA_PADRAO;
}

/* ─────────────────────── espelho das listas da regra (defesa 2) ─────────────────────
 * Nao ha como a regra e o teste compartilharem a MESMA lista: `firestore.rules` nao
 * importa nada e o Firestore nao expoe as listas. O proximo melhor: ler as listas do
 * texto da regra e conferir contra as de ca. Assim "mexer na lista obriga a mexer no
 * teste" deixa de ser disciplina e passa a ser mecanismo. */

const GESTOR_ONLY_DOCS = [
  'mappo_tecnicos', 'mappo_clientes', 'mappo_manut', 'mappo_settings',
  'mappo_checklist_config', 'mappo_preco_config', 'mappo_financeiro_notas',
  'mappo_vrf_fases_config', 'mappo_modulo_config', 'mappo_vrf_obras',
];

const RAMOS_RESERVADOS = [
  'constructor', 'prototype', 'tostring', 'valueof',
  'hasownproperty', 'isprototypeof', 'propertyisenumerable', 'tolocalestring',
];

/* Extrai o primeiro `[ ... ]` depois de um marcador e devolve as strings entre
 * apostrofos. Devolve null quando o marcador nao existe -- regra reestruturada nao pode
 * virar "lista vazia, nada a conferir". */
function listaDepoisDe(fonte, marcador) {
  const i = fonte.indexOf(marcador);
  if (i < 0) return null;
  const abre = fonte.indexOf('[', i);
  const fecha = fonte.indexOf(']', abre);
  if (abre < 0 || fecha < 0) return null;
  const achados = fonte.slice(abre + 1, fecha).match(/'[^']*'/g);
  return achados ? achados.map((s) => s.slice(1, -1)) : [];
}

function diferenca(a, b) {
  const fa = a.filter((x) => !b.includes(x));
  const fb = b.filter((x) => !a.includes(x));
  const partes = [];
  if (fa.length) partes.push('so na regra: ' + fa.join(', '));
  if (fb.length) partes.push('so no teste: ' + fb.join(', '));
  return partes.join(' | ');
}

/* ─────────────────────── emulador ─────────────────────── */

let emuladorFilho = null;

function matarArvore(filho) {
  if (process.platform === 'win32') {
    // o emulador e um java filho do node; matar so o node deixaria o java orfao
    // segurando a porta -- e a proxima execucao acharia um emulador de outro teste
    const tk = spawn('taskkill', ['/pid', String(filho.pid), '/T', '/F'], { stdio: 'ignore' });
    tk.on('error', (e) => {
      console.error('aviso: taskkill falhou (' + e.code + ' - ' + e.message + '); matando so o node');
      filho.kill('SIGKILL');
    });
    return;
  }
  try {
    process.kill(-filho.pid, 'SIGKILL');
  } catch (e) {
    console.error('aviso ao encerrar o grupo de processos: ' + e.code + ' - ' + e.message);
    filho.kill('SIGKILL');
  }
}

function encerrarEmulador() {
  if (!emuladorFilho) return;
  const f = emuladorFilho;
  emuladorFilho = null;
  matarArvore(f);
}

/* Sem isto, um Ctrl+C no meio da execucao deixava o Java orfao segurando a porta -- e a
 * execucao seguinte "reaproveitava" esse orfao, com as regras da rodada anterior
 * carregadas. Falha silenciosa e do pior tipo: verde por medir a coisa errada. */
for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => {
    console.error('\nInterrompido (' + sinal + ') -- encerrando o emulador para nao deixar');
    console.error('o Java orfao segurando a porta.');
    encerrarEmulador();
    process.exit(130);
  });
}

function sondar(porta) {
  return new Promise((resolve) => {
    const req = http.get({ host: HOST, port: porta, path: '/', timeout: 1500 }, (res) => {
      let corpo = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { if (corpo.length < 200) corpo += c; });
      res.on('end', () => resolve({ status: res.statusCode, corpo: corpo.trim() }));
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
  });
}

/* A 8080 e das portas mais disputadas que existe. Reaproveitar "o que estiver
 * respondendo" faria a suite rodar contra um servidor qualquer e reprovar tudo por
 * erro de rede -- ou pior, reaproveitar um emulador orfao com regras velhas. O
 * emulador do Firestore responde GET / com status 200 e corpo exatamente "Ok". */
function eOEmulador(r) {
  return !!r && r.status === 200 && r.corpo === 'Ok';
}

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function subirEmulador(porta, cli) {
  const jaTem = await sondar(porta);
  if (jaTem) {
    if (eOEmulador(jaTem)) {
      console.log('Emulador ja respondendo em ' + HOST + ':' + porta + ' -- reaproveitando (nao sera encerrado).');
      return null;
    }
    console.error('\nAlguma coisa responde em ' + HOST + ':' + porta + ', mas NAO e o Firestore Emulator.');
    console.error('Recebido: status ' + jaTem.status + ', corpo "' + jaTem.corpo.slice(0, 60) + '"');
    console.error('Esperado: status 200, corpo "Ok".');
    console.error('\nA suite nao roda contra um servidor desconhecido: as regras nao seriam');
    console.error('avaliadas e o vermelho diria "erro de rede" em vez de "regra afrouxada".');
    console.error('Libere a porta ' + porta + ', ou mude emulators.firestore.port no firebase.json.');
    return false;
  }

  console.log('Subindo o Firestore Emulator em ' + HOST + ':' + porta + ' (projeto ' + PROJETO + ')...');
  const filho = spawn(
    process.execPath,
    [cli, 'emulators:start', '--only', 'firestore', '--project', PROJETO],
    {
      cwd: RAIZ,
      env: { ...process.env, CI: '1', FORCE_COLOR: '0' },
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  emuladorFilho = filho;

  let log = '';
  const guardar = (t) => { log = (log + t).slice(-8000); };
  filho.stdout.setEncoding('utf8');
  filho.stderr.setEncoding('utf8');
  filho.stdout.on('data', guardar);
  filho.stderr.on('data', guardar);

  let morreu = null;
  filho.on('error', (e) => { morreu = 'falha ao iniciar: ' + e.code + ' - ' + e.message; });
  filho.on('exit', (c) => { if (morreu === null) morreu = 'o emulador saiu com codigo ' + c; });

  const limite = Date.now() + ESPERA_EMULADOR_MS;
  while (Date.now() < limite) {
    if (morreu) break;
    if (eOEmulador(await sondar(porta))) {
      console.log('Emulador pronto.');
      return filho;
    }
    await esperar(500);
  }

  encerrarEmulador();
  console.error('\nO Firestore Emulator nao subiu.');
  console.error(morreu ? 'Motivo: ' + morreu : 'Motivo: nao respondeu em ' + Math.round(ESPERA_EMULADOR_MS / 1000) + 's.');
  console.error('\nO que costuma resolver:');
  console.error('  1. baixar o emulador uma vez:  npm run emulador:baixar');
  console.error('  2. conferir o Java 21:         java -version');
  console.error('  3. liberar a porta ' + porta + ' (outro emulador aberto?)');
  console.error('\nUltimas linhas do emulador:');
  console.error(log ? log.split('\n').slice(-25).join('\n') : '(nao imprimiu nada)');
  return false;
}

/* ─────────────────────── principal ─────────────────────── */

async function principal() {
  if (!fs.existsSync(ARQ_REGRAS)) {
    console.error('\nNao achei o firestore.rules da raiz sob teste.');
    console.error('Esperado em: ' + ARQ_REGRAS);
    if (process.env.MAPPO_RAIZ) {
      console.error('A raiz veio de MAPPO_RAIZ -- confira o caminho.');
    }
    return 1;
  }

  if (!temJava()) return 1;
  const cli = caminhoFirebaseCli();
  if (!cli) return 1;
  const libs = carregarBibliotecas();
  if (!libs) return 1;

  const { initializeTestEnvironment } = libs.rut;
  const {
    doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, setLogLevel,
  } = libs.fs9;

  /* Metade dos casos aqui espera PERMISSION_DENIED, e o SDK loga 3 linhas de gRPC a
   * cada um -- centenas de linhas de ruido que empurrariam a falha de verdade fora das
   * 15 ultimas linhas que o runner mostra. Quem nomeia a regra e o cenario e o
   * relatorio desta suite, nao o log do SDK. */
  setLogLevel('silent');

  const fonteRegras = fs.readFileSync(ARQ_REGRAS, 'utf8');
  const porta = portaDoFirebaseJson();
  const emulador = await subirEmulador(porta, cli);
  if (emulador === false) return 1;

  let env = null;
  try {
    env = await initializeTestEnvironment({
      projectId: PROJETO,
      firestore: { host: HOST, port: porta, rules: fonteRegras },
    });

    console.log('Regras sob teste: ' + ARQ_REGRAS);
    linha();

    /* ── contextos ──
     * authenticatedContext() emite um token com sign_in_provider 'custom' por
     * padrao -- e isso e "autenticacao real" para isRealAuth(). Para o cliente do
     * link publico o provider tem que ser 'anonymous' explicitamente. */
    const ctx = {
      gestorA: env.authenticatedContext('gestorA'),
      tecA: env.authenticatedContext('tecA'),
      gestorB: env.authenticatedContext('gestorB'),
      tecB: env.authenticatedContext('tecB'),
      gestorP: env.authenticatedContext('gestorP'),
      estranho: env.authenticatedContext('estranho'),
      prestador: env.authenticatedContext('prestador'),
      prestador2: env.authenticatedContext('prestador2'),
      prestador3: env.authenticatedContext('prestador3'),
      fundador: env.authenticatedContext('fundador'),
      invasor: env.authenticatedContext('invasor'),
      anonimo: env.authenticatedContext('anonimo', { firebase: { sign_in_provider: 'anonymous' } }),
      semSessao: env.unauthenticatedContext(),
    };
    const db = {};
    for (const k of Object.keys(ctx)) db[k] = ctx[k].firestore();

    /* ── semeadura ──
     * Roda com as regras desligadas: montar o cenario nao e o que esta sob teste.
     * Recomeca do zero antes de cada grupo, para um caso destrutivo (delete, ou o
     * consumo de um convite de uso unico) nao contaminar o grupo seguinte. */
    async function semear() {
      await env.clearFirestore();
      await env.withSecurityRulesDisabled(async (livre) => {
        const d = livre.firestore();

        await setDoc(doc(d, 'workspaces/wsA'), { criado: true, status: 'ativo', ramo: 'refrigeracao' });
        await setDoc(doc(d, 'workspaces/wsB'), { criado: true, status: 'ativo', ramo: 'predial' });
        await setDoc(doc(d, 'workspaces/wsP'), { criado: true, status: 'pendente', ramo: 'predial' });

        await setDoc(doc(d, 'workspaces/wsA/members/gestorA'), { role: 'gestor' });
        await setDoc(doc(d, 'workspaces/wsA/members/tecA'), { role: 'tecnico' });
        await setDoc(doc(d, 'workspaces/wsA/members/sobra'), { role: 'tecnico' });
        await setDoc(doc(d, 'workspaces/wsB/members/gestorB'), { role: 'gestor' });
        await setDoc(doc(d, 'workspaces/wsB/members/tecB'), { role: 'tecnico' });
        await setDoc(doc(d, 'workspaces/wsP/members/gestorP'), { role: 'gestor' });

        const envelope = { json: '{}', updatedAt: 1, by: 'semeadura' };
        for (const ws of ['wsA', 'wsB', 'wsP']) {
          // os 10 docIds so-gestor, para o laco do grupo 4 ter o que ler e sobrescrever
          for (const id of GESTOR_ONLY_DOCS) {
            await setDoc(doc(d, 'workspaces/' + ws + '/data/' + id), envelope);
          }
          await setDoc(doc(d, 'workspaces/' + ws + '/data/mappo_os'), envelope);
          await setDoc(doc(d, 'workspaces/' + ws + '/data/pub_vivo'), { json: '{}', expiraEm: FUTURO });
          await setDoc(doc(d, 'workspaces/' + ws + '/data/pub_antigo'), { json: '{}' });
          await setDoc(doc(d, 'workspaces/' + ws + '/data/pub_vencido'), { json: '{}', expiraEm: PASSADO });
          // ancoragem do padrao 'pub_.*' (grupo 2): nomes vizinhos que NAO sao link publico
          await setDoc(doc(d, 'workspaces/' + ws + '/data/xpub_segredo'), envelope);
          await setDoc(doc(d, 'workspaces/' + ws + '/data/mappo_pub_os'), envelope);
          await setDoc(doc(d, 'workspaces/' + ws + '/data/pub_'), { json: '{}', expiraEm: FUTURO });
        }

        const cv = (extra) => Object.assign(
          { workspaceId: 'wsA', usado: false, revogadoEm: null, expiraEm: FUTURO, tecnicoId: 'vaga-1' },
          extra
        );
        await setDoc(doc(d, 'convites/cv-ok'), cv({}));
        await setDoc(doc(d, 'convites/cv-vencido'), cv({ expiraEm: PASSADO }));
        await setDoc(doc(d, 'convites/cv-usado'), cv({ usado: true, usadoPor: 'outraPessoa' }));
        await setDoc(doc(d, 'convites/cv-revogado'), cv({ revogadoEm: PASSADO }));
        // convite legado: nasceu antes da expiracao de 7 dias existir, sem o campo
        await setDoc(doc(d, 'convites/cv-legado'), { workspaceId: 'wsA', usado: false, revogadoEm: null, tecnicoId: 'vaga-9' });
        await setDoc(doc(d, 'convites/cv-outrows'), cv({ workspaceId: 'wsB' }));

        await setDoc(doc(d, 'userWorkspaces/tecA'), { workspaceId: 'wsA' });
        await setDoc(doc(d, 'userWorkspaces/tecB'), { workspaceId: 'wsB' });

        await setDoc(doc(d, 'feedback/f1'), { workspaceId: 'wsA', nota: 5, uid: 'tecA' });
      });
    }

    /* ── o conferidor ──
     * Nao basta "deu erro": para um caso NEGADO, o erro tem que ser permission-denied.
     * Um erro de outra natureza (caminho errado, semeadura faltando, emulador fora do
     * ar) tambem "falha" a operacao e passaria por negacao -- o teste ficaria verde sem
     * a regra ter sido exercitada uma vez.
     * E nao basta "nao lancou": para um MEMBRO, a regra permite ler documento que nao
     * existe, entao uma leitura permitida sem conferir o conteudo vira no-op verde no
     * dia em que a semeadura mudar de nome. Por isso `conferir`. */
    async function checar(esperado, regra, cenario, op, conferir) {
      conferidos++;
      if (cenario.includes('[GAP ACEITO]')) gapsAceitos++;

      let erro = null;
      let valor = null;
      try {
        valor = await op();
      } catch (e) {
        erro = e;
      }
      const negou = erro !== null;
      const porRegra = negou && (
        erro.code === 'permission-denied' ||
        /PERMISSION_DENIED|insufficient permissions/i.test(String(erro.message))
      );

      if (esperado === 'NEGADO') {
        if (!negou) {
          return registrarFalha(regra, cenario, 'NEGADO pela regra',
            'PERMITIDO -- o emulador aceitou a operacao');
        }
        if (!porRegra) {
          return registrarFalha(regra, cenario, 'NEGADO pela regra (permission-denied)',
            'negado por OUTRO erro, a regra pode nem ter sido avaliada: '
            + (erro.code || '?') + ' - ' + erro.message);
        }
      } else {
        if (negou) {
          return registrarFalha(regra, cenario, 'PERMITIDO',
            'NEGADO -- ' + (erro.code || '?') + ' - ' + erro.message);
        }
        if (conferir) {
          const veredito = conferir(valor);
          if (veredito !== true) {
            return registrarFalha(regra, cenario, 'PERMITIDO e com o dado esperado',
              'PERMITIDO, mas ' + veredito + ' -- o caso virou no-op verde');
          }
        }
      }
      console.log('  ok [' + esperado.padEnd(9) + '] ' + cenario);
    }

    /* Expectativas de conteudo para as leituras permitidas (defesa 3). */
    const existe = (snap) => (snap.exists()
      ? true : 'o documento nao existe -- esperava o dado da semeadura');
    const naoExiste = (snap) => (!snap.exists()
      ? true : 'o documento existe -- este caso exige justamente um doc ausente');
    const temItens = (snap) => (snap.size > 0
      ? true : 'a lista voltou vazia -- esperava os documentos da semeadura');

    const negado = (regra, cenario, op) => checar('NEGADO', regra, cenario, op);
    const permitido = (regra, cenario, op) => checar('PERMITIDO', regra, cenario, op);
    /* leitura permitida: por padrao exige que o documento exista */
    const leu = (regra, cenario, op, conferir) =>
      checar('PERMITIDO', regra, cenario, op, conferir || existe);

    function afirmar(regra, cenario, condicao, obtido) {
      conferidos++;
      if (condicao === true) {
        console.log('  ok [ESTRUTURA] ' + cenario);
        return;
      }
      registrarFalha(regra, cenario, 'a lista da regra e a do teste iguais', obtido);
    }

    async function grupo(titulo, fn, semSemear) {
      console.log('\n=== ' + titulo + ' ===');
      gruposRodados.push(titulo);
      if (!semSemear) await semear();
      await fn();
    }

    const R_DATA = 'match /workspaces/{wsId}/data/{docId}';
    const R_WS = 'match /workspaces/{wsId}';
    const R_MEMBERS = 'match /workspaces/{wsId}/members/{uid}';
    const R_CONVITES = 'match /convites/{codigo}';
    const R_FEEDBACK = 'match /feedback/{id}';
    const R_PONTEIRO = 'match /userWorkspaces/{uid}';

    /* ════════════════════════════════════════════════════════════════════
       0. As listas da regra e as do teste nao podem divergir
       ════════════════════════════════════════════════════════════════════ */
    await grupo('0. Espelho das listas de firestore.rules', async () => {
      const daRegraDocs = listaDepoisDe(fonteRegras, 'return docId in');
      afirmar('isGestorOnlyDoc(docId)',
        'os ' + GESTOR_ONLY_DOCS.length + ' docIds so-gestor do teste sao os mesmos da regra',
        daRegraDocs !== null && diferenca(daRegraDocs, GESTOR_ONLY_DOCS) === '',
        daRegraDocs === null
          ? 'nao achei a lista em isGestorOnlyDoc() -- a regra foi reestruturada, refaca o laco do grupo 4'
          : diferenca(daRegraDocs, GESTOR_ONLY_DOCS) + ' (acrescente o caso no grupo 4)');

      const daRegraRamos = listaDepoisDe(fonteRegras, 'ramo.lower() in');
      afirmar('ramoValido(ramo)',
        'as ' + RAMOS_RESERVADOS.length + ' chaves reservadas do teste sao as mesmas da regra',
        daRegraRamos !== null && diferenca(daRegraRamos, RAMOS_RESERVADOS) === '',
        daRegraRamos === null
          ? 'nao achei a lista em ramoValido() -- a regra foi reestruturada, refaca o laco do grupo 8'
          : diferenca(daRegraRamos, RAMOS_RESERVADOS) + ' (acrescente o caso no grupo 8)');
    }, true);

    /* ════════════════════════════════════════════════════════════════════
       1. Isolamento entre empresas, e enumeracao das colecoes raiz
       ════════════════════════════════════════════════════════════════════ */
    await grupo('1. Isolamento entre workspaces (multi-tenant) e enumeracao', async () => {
      await negado(R_DATA + ' -- allow read: isMember(wsId)',
        'membro do workspace B tenta LER workspaces/wsA/data/mappo_os',
        () => getDoc(doc(db.tecB, 'workspaces/wsA/data/mappo_os')));

      await negado(R_DATA + ' -- allow read: isMember(wsId)',
        'GESTOR do workspace B tenta LER workspaces/wsA/data/mappo_os',
        () => getDoc(doc(db.gestorB, 'workspaces/wsA/data/mappo_os')));

      await negado(R_DATA + ' -- allow write: isMember(wsId)',
        'membro do workspace B tenta ESCREVER em workspaces/wsA/data/mappo_os',
        () => setDoc(doc(db.tecB, 'workspaces/wsA/data/mappo_os'), { json: 'invadido' }));

      await negado(R_DATA + ' -- allow read: isMember(wsId)',
        'autenticado real SEM membership nenhuma tenta LER workspaces/wsA/data/mappo_os',
        () => getDoc(doc(db.estranho, 'workspaces/wsA/data/mappo_os')));

      await negado(R_DATA + ' -- allow read (list): isMember(wsId)',
        'membro do workspace B tenta LISTAR a colecao workspaces/wsA/data',
        () => getDocs(collection(db.tecB, 'workspaces/wsA/data')));

      await negado(R_WS + ' -- allow read: isMember(wsId)',
        'nao-membro tenta LER o metadado workspaces/wsA',
        () => getDoc(doc(db.estranho, 'workspaces/wsA')));

      await negado(R_MEMBERS + ' -- allow read: isMember(wsId)',
        'membro do workspace B tenta LER a equipe de wsA',
        () => getDocs(collection(db.tecB, 'workspaces/wsA/members')));

      /* Enumeracao das colecoes raiz. Listar `workspaces` entrega os wsId de TODA a
       * instalacao -- a leitura de maior valor para um atacante, porque e o primeiro
       * passo de qualquer outro ataque. Listar `userWorkspaces` entrega o mapa
       * pessoa -> empresa. Nenhuma das duas tem caso de uso legitimo no app: o membro
       * ja sabe o proprio wsId (vem do ponteiro), e ninguem precisa da lista dos outros. */
      for (const quem of ['tecA', 'estranho', 'anonimo', 'semSessao']) {
        await negado(R_WS + ' -- allow read (list): isMember(wsId) com wsId nao vinculado',
          quem + ' tenta LISTAR a colecao raiz workspaces (enumerar as empresas da instalacao)',
          () => getDocs(collection(db[quem], 'workspaces')));
      }
      for (const quem of ['tecA', 'estranho', 'anonimo', 'semSessao']) {
        await negado(R_PONTEIRO + ' -- allow read (list): request.auth.uid == uid',
          quem + ' tenta LISTAR a colecao raiz userWorkspaces (mapa pessoa -> empresa)',
          () => getDocs(collection(db[quem], 'userWorkspaces')));
      }

      // o outro sentido: dentro da propria empresa, tudo isso funciona
      await leu(R_DATA + ' -- allow read: isMember(wsId)',
        'membro de wsA LE workspaces/wsA/data/mappo_os',
        () => getDoc(doc(db.tecA, 'workspaces/wsA/data/mappo_os')));

      await leu(R_DATA + ' -- allow read (list): isMember(wsId)',
        'membro de wsA LISTA a colecao workspaces/wsA/data',
        () => getDocs(collection(db.tecA, 'workspaces/wsA/data')), temItens);

      await leu(R_WS + ' -- allow read: isMember(wsId)',
        'membro de wsA LE o metadado workspaces/wsA',
        () => getDoc(doc(db.tecA, 'workspaces/wsA')));

      await leu(R_MEMBERS + ' -- allow read: isMember(wsId)',
        'membro de wsA LE a propria equipe',
        () => getDocs(collection(db.tecA, 'workspaces/wsA/members')), temItens);
    });

    /* ════════════════════════════════════════════════════════════════════
       2. Link publico do cliente (pub_{token}) e a ancora do padrao
       ════════════════════════════════════════════════════════════════════ */
    await grupo('2. Link publico do cliente (pub_{token})', async () => {
      await leu(R_DATA + ' -- allow read: docId.matches(\'pub_.*\')',
        'cliente anonimo LE pub_vivo (expiraEm no futuro, workspace ativo)',
        () => getDoc(doc(db.anonimo, 'workspaces/wsA/data/pub_vivo')));

      await leu(R_DATA + ' -- allow read: !(\'expiraEm\' in resource.data)',
        '[GAP ACEITO] cliente anonimo LE pub_antigo, link pre-expiracao sem o campo -- '
        + 'invalidar todos de uma vez quebraria vinculos em andamento sem aviso',
        () => getDoc(doc(db.anonimo, 'workspaces/wsA/data/pub_antigo')));

      await leu(R_DATA + ' -- allow read: resource==null',
        'cliente anonimo LE pub_naoexiste: a regra permite de proposito, para o app '
        + 'poder dizer "link nao encontrado" em vez de "link expirado"',
        () => getDoc(doc(db.anonimo, 'workspaces/wsA/data/pub_naoexiste')), naoExiste);

      await negado(R_DATA + ' -- allow read: resource.data.expiraEm > request.time.toMillis()',
        'cliente anonimo tenta LER pub_vencido (expiraEm no passado -- inclui o revogado)',
        () => getDoc(doc(db.anonimo, 'workspaces/wsA/data/pub_vencido')));

      await negado(R_DATA + ' -- allow read: request.auth != null',
        'SEM SESSAO nenhuma (request.auth == null) tenta LER pub_vivo',
        () => getDoc(doc(db.semSessao, 'workspaces/wsA/data/pub_vivo')));

      await negado(R_DATA + ' -- allow read: docId.matches(\'pub_.*\') || isMember(wsId)',
        'cliente anonimo tenta LER mappo_os -- o carve-out vale SO para pub_*',
        () => getDoc(doc(db.anonimo, 'workspaces/wsA/data/mappo_os')));

      /* A ancora do padrao, provada pelo emulador e nao presumida pela regex: se
       * `matches('pub_.*')` casasse em qualquer posicao, um documento chamado
       * `xpub_segredo` ou `mappo_pub_os` seria legivel por qualquer anonimo da
       * internet -- vazamento com nome de documento interno. */
      await negado(R_DATA + ' -- allow read: docId.matches(\'pub_.*\') ancorado no inicio',
        'cliente anonimo tenta LER xpub_segredo (pub_ no meio do nome, nao no inicio)',
        () => getDoc(doc(db.anonimo, 'workspaces/wsA/data/xpub_segredo')));

      await negado(R_DATA + ' -- allow read: docId.matches(\'pub_.*\') ancorado no inicio',
        'cliente anonimo tenta LER mappo_pub_os (pub_ no meio do nome)',
        () => getDoc(doc(db.anonimo, 'workspaces/wsA/data/mappo_pub_os')));

      await leu(R_DATA + ' -- allow read: \'pub_\' casa com pub_.* (.* aceita vazio)',
        'cliente anonimo LE o documento chamado exatamente "pub_" -- nome degenerado, '
        + 'mas a regra o trata como link publico e o app nunca emite um token vazio',
        () => getDoc(doc(db.anonimo, 'workspaces/wsA/data/pub_')));

      await negado(R_DATA + ' -- allow read (list)',
        'cliente anonimo tenta LISTAR workspaces/wsA/data para enumerar todos os pub_* '
        + '(risco levantado na auditoria: achar os tokens sem adivinhar nenhum)',
        () => getDocs(collection(db.anonimo, 'workspaces/wsA/data')));

      await negado(R_DATA + ' -- allow write: isMember(wsId)',
        'cliente anonimo tenta ESCREVER em pub_vivo',
        () => setDoc(doc(db.anonimo, 'workspaces/wsA/data/pub_vivo'), { json: 'adulterado' }));

      await negado(R_DATA + ' -- allow read: isAtivo(wsId)',
        'cliente anonimo tenta LER pub_vivo de workspace PENDENTE -- link gerado '
        + 'durante a aprovacao nao pode vazar dado',
        () => getDoc(doc(db.anonimo, 'workspaces/wsP/data/pub_vivo')));
    });

    /* ════════════════════════════════════════════════════════════════════
       3. Workspace pendente de aprovacao (isAtivo)
       ════════════════════════════════════════════════════════════════════ */
    await grupo('3. Workspace pendente de aprovacao (isAtivo)', async () => {
      await negado(R_DATA + ' -- allow read: isAtivo(wsId)',
        'gestor de workspace PENDENTE tenta LER workspaces/wsP/data/mappo_os',
        () => getDoc(doc(db.gestorP, 'workspaces/wsP/data/mappo_os')));

      await negado(R_DATA + ' -- allow write: isAtivo(wsId)',
        'gestor de workspace PENDENTE tenta ESCREVER workspaces/wsP/data/mappo_os',
        () => setDoc(doc(db.gestorP, 'workspaces/wsP/data/mappo_os'), { json: '{}' }));

      await negado(R_DATA + ' -- allow read (list): isAtivo(wsId)',
        'gestor de workspace PENDENTE tenta LISTAR workspaces/wsP/data',
        () => getDocs(collection(db.gestorP, 'workspaces/wsP/data')));

      // o outro sentido: ele autentica e ve o proprio status, senao a tela de
      // "aguardando aprovacao" nao teria como existir
      await leu(R_WS + ' -- allow read: isMember(wsId), sem isAtivo',
        'gestor de workspace PENDENTE LE o proprio workspaces/wsP (para ver o status)',
        () => getDoc(doc(db.gestorP, 'workspaces/wsP')));

      await leu(R_MEMBERS + ' -- allow read: isMember(wsId)',
        'gestor de workspace PENDENTE LE a propria membership',
        () => getDoc(doc(db.gestorP, 'workspaces/wsP/members/gestorP')));

      await leu(R_DATA + ' -- allow read: isAtivo(wsId)',
        'o mesmo dado num workspace ATIVO e lido -- prova que foi o status que negou',
        () => getDoc(doc(db.gestorA, 'workspaces/wsA/data/mappo_os')));
    });

    /* ════════════════════════════════════════════════════════════════════
       4. Documentos so-gestor: a LISTA INTEIRA, nos dois sentidos
       ════════════════════════════════════════════════════════════════════ */
    await grupo('4. Documentos so-gestor (isGestorOnlyDoc): os ' + GESTOR_ONLY_DOCS.length + ' docIds', async () => {
      /* Laco sobre a lista inteira, nao sobre uma amostra. Antes a suite exercitava 2
       * dos 10: tirar `mappo_settings` ou `mappo_preco_config` da regra dava ao tecnico
       * escrita em configuracao e tabela de preco com a suite verde. O grupo 0 garante
       * que esta lista e a mesma da regra. */
      for (const id of GESTOR_ONLY_DOCS) {
        await negado(R_DATA + ' -- allow write: !isGestorOnlyDoc(docId) || isGestor(wsId)',
          'tecnico tenta ESCREVER ' + id,
          () => setDoc(doc(db.tecA, 'workspaces/wsA/data/' + id), { json: 'adulterado' }));
      }
      for (const id of GESTOR_ONLY_DOCS) {
        await permitido(R_DATA + ' -- allow write: isGestor(wsId)',
          'gestor ESCREVE ' + id,
          () => setDoc(doc(db.gestorA, 'workspaces/wsA/data/' + id), { json: '{}', updatedAt: 2, by: 'gestorA' }));
      }

      await negado(R_DATA + ' -- allow write: !isGestorOnlyDoc(docId) || isGestor(wsId)',
        'tecnico tenta APAGAR mappo_tecnicos (write cobre delete)',
        () => deleteDoc(doc(db.tecA, 'workspaces/wsA/data/mappo_tecnicos')));

      await leu(R_DATA + ' -- allow read: isMember(wsId)',
        'tecnico LE mappo_tecnicos -- so a ESCRITA e so-gestor, a leitura nao',
        () => getDoc(doc(db.tecA, 'workspaces/wsA/data/mappo_tecnicos')));

      await permitido(R_DATA + ' -- isGestorOnlyDoc(docId) == false para mappo_os',
        '[GAP ACEITO] tecnico ESCREVE mappo_os: ele precisa disso para check-in, '
        + 'checklist e foto, e o blob JSON unico (AD-8) nao permite validacao '
        + 'campo-a-campo na regra. Residuo: pode alterar valor/tecnico de QUALQUER OS '
        + 'do workspace. Exige separar o financeiro da OS, nao e patch de regra',
        () => setDoc(doc(db.tecA, 'workspaces/wsA/data/mappo_os'), { json: '{}', updatedAt: 2, by: 'tecA' }));

      await permitido(R_DATA + ' -- allow write: isMember(wsId)',
        '[GAP ACEITO] tecnico ESCREVE pub_vivo: e o mecanismo que leva o progresso do '
        + 'checklist ao vivo para a pagina publica -- restringir a gestor quebraria a '
        + 'feature. Residuo conhecido: ele pode reescrever o expiraEm do link',
        () => setDoc(doc(db.tecA, 'workspaces/wsA/data/pub_vivo'), { json: '{}', expiraEm: FUTURO }));

      await permitido(R_DATA + ' -- allow write cobre delete',
        '[GAP ACEITO] tecnico APAGA workspaces/wsA/data/mappo_os -- "write" inclui '
        + 'delete e a regra nao distingue; qualquer membro pode apagar dado do proprio '
        + 'workspace (mesmo modelo last-write-wins do resto do app)',
        () => deleteDoc(doc(db.tecA, 'workspaces/wsA/data/mappo_os')));
    });

    /* ════════════════════════════════════════════════════════════════════
       5. Convite de prestador -- criacao, leitura e revogacao
       ════════════════════════════════════════════════════════════════════ */
    await grupo('5. Convite de prestador: criar, ler, revogar', async () => {
      await negado(R_CONVITES + ' -- allow get: isRealAuth()',
        'cliente ANONIMO tenta LER convites/cv-ok (isRealAuth exige provedor real)',
        () => getDoc(doc(db.anonimo, 'convites/cv-ok')));

      await negado(R_CONVITES + ' -- allow get: isRealAuth()',
        'SEM SESSAO tenta LER convites/cv-ok',
        () => getDoc(doc(db.semSessao, 'convites/cv-ok')));

      await negado(R_CONVITES + ' -- allow list: if false',
        'autenticado real tenta LISTAR a colecao convites (enumerar codigos)',
        () => getDocs(collection(db.prestador, 'convites')));

      await negado(R_CONVITES + ' -- allow create: expiraEm is number',
        'gestor tenta criar convite SEM expiraEm (voltaria a ser eterno)',
        () => setDoc(doc(db.gestorA, 'convites/novo-sem-prazo'),
          { workspaceId: 'wsA', usado: false, revogadoEm: null, tecnicoId: 'v' }));

      await negado(R_CONVITES + ' -- allow create: expiraEm > request.time.toMillis()',
        'gestor tenta criar convite ja VENCIDO',
        () => setDoc(doc(db.gestorA, 'convites/novo-vencido'),
          { workspaceId: 'wsA', usado: false, revogadoEm: null, expiraEm: PASSADO, tecnicoId: 'v' }));

      await negado(R_CONVITES + ' -- allow create: usado == false',
        'gestor tenta criar convite ja nascido usado',
        () => setDoc(doc(db.gestorA, 'convites/novo-usado'),
          { workspaceId: 'wsA', usado: true, revogadoEm: null, expiraEm: FUTURO, tecnicoId: 'v' }));

      await negado(R_CONVITES + ' -- allow create: isGestor(request.resource.data.workspaceId)',
        'TECNICO tenta criar convite para o proprio workspace',
        () => setDoc(doc(db.tecA, 'convites/novo-do-tecnico'),
          { workspaceId: 'wsA', usado: false, revogadoEm: null, expiraEm: FUTURO, tecnicoId: 'v' }));

      await negado(R_CONVITES + ' -- allow create: isGestor(request.resource.data.workspaceId)',
        'gestor de wsB tenta criar convite para wsA (convite cruzado)',
        () => setDoc(doc(db.gestorB, 'convites/novo-cruzado'),
          { workspaceId: 'wsA', usado: false, revogadoEm: null, expiraEm: FUTURO, tecnicoId: 'v' }));

      await negado(R_CONVITES + ' -- allow update: isGestor(resource.data.workspaceId)',
        'gestor de wsB tenta REVOGAR um convite de wsA',
        () => updateDoc(doc(db.gestorB, 'convites/cv-ok'), { revogadoEm: Date.now() }));

      await negado(R_CONVITES + ' -- allow update: resource.data.usado == false',
        'gestor tenta revogar um convite JA CONSUMIDO (desfazer vinculo pela porta errada)',
        () => updateDoc(doc(db.gestorA, 'convites/cv-usado'), { revogadoEm: Date.now() }));

      await negado(R_CONVITES + ' -- allow delete: if false',
        'gestor tenta APAGAR o convite em vez de revogar (apagar some com o rastro)',
        () => deleteDoc(doc(db.gestorA, 'convites/cv-ok')));

      await negado(R_CONVITES + ' -- allow update: hasOnly([\'revogadoEm\'])',
        'gestor tenta revogar e, na mesma escrita, mudar o workspaceId do convite',
        () => updateDoc(doc(db.gestorA, 'convites/cv-ok'), { revogadoEm: Date.now(), workspaceId: 'wsB' }));

      // o outro sentido
      await leu(R_CONVITES + ' -- allow get: isRealAuth()',
        'autenticado real LE convites/cv-ok (quem tem o codigo especifico)',
        () => getDoc(doc(db.prestador, 'convites/cv-ok')));

      await permitido(R_CONVITES + ' -- allow create',
        'gestor cria convite valido (usado:false, revogadoEm:null, expiraEm no futuro)',
        () => setDoc(doc(db.gestorA, 'convites/novo-valido'),
          { workspaceId: 'wsA', usado: false, revogadoEm: null, expiraEm: FUTURO, tecnicoId: 'v' }));

      await permitido(R_CONVITES + ' -- allow update: revogacao pelo gestor',
        'gestor REVOGA um convite ainda pendente',
        () => updateDoc(doc(db.gestorA, 'convites/cv-ok'), { revogadoEm: Date.now() }));
    });

    /* ════════════════════════════════════════════════════════════════════
       6. Convite de prestador -- consumo, auto-vinculo e uso unico
       ════════════════════════════════════════════════════════════════════ */
    await grupo('6. Convite de prestador: consumo e auto-vinculo (Story 11)', async () => {
      const vinculo = (codigo, role) => ({ role: role || 'tecnico', convite: codigo, nome: 'Prestador' });

      await negado(R_MEMBERS + ' -- allow create: conviteNoPrazo(...)',
        'prestador tenta se auto-vincular com convite VENCIDO',
        () => setDoc(doc(db.prestador, 'workspaces/wsA/members/prestador'), vinculo('cv-vencido')));

      await negado(R_MEMBERS + ' -- allow create: convite.usado == false',
        'prestador tenta se auto-vincular com convite JA USADO',
        () => setDoc(doc(db.prestador, 'workspaces/wsA/members/prestador'), vinculo('cv-usado')));

      await negado(R_MEMBERS + ' -- allow create: convite.revogadoEm == null',
        'prestador tenta se auto-vincular com convite REVOGADO',
        () => setDoc(doc(db.prestador, 'workspaces/wsA/members/prestador'), vinculo('cv-revogado')));

      await negado(R_MEMBERS + ' -- allow create: convite.workspaceId == wsId',
        'prestador usa um convite de wsB para entrar em wsA',
        () => setDoc(doc(db.prestador, 'workspaces/wsA/members/prestador'), vinculo('cv-outrows')));

      await negado(R_MEMBERS + ' -- allow create: request.resource.data.role == \'tecnico\'',
        'prestador tenta entrar como GESTOR citando um convite valido (escalonamento)',
        () => setDoc(doc(db.prestador, 'workspaces/wsA/members/prestador'), vinculo('cv-ok', 'gestor')));

      await negado(R_MEMBERS + ' -- allow create: request.auth.uid == uid',
        'prestador tenta criar a membership de OUTRO uid com o convite dele',
        () => setDoc(doc(db.prestador, 'workspaces/wsA/members/terceiro'), vinculo('cv-ok')));

      await negado(R_CONVITES + ' -- allow update: request.resource.data.usadoPor == request.auth.uid',
        'prestador consome o convite gravando usadoPor de OUTRA pessoa',
        () => updateDoc(doc(db.prestador, 'convites/cv-ok'),
          { usado: true, usadoPor: 'outraPessoa', usadoEm: Date.now() }));

      await negado(R_CONVITES + ' -- allow update: hasOnly([\'usado\',\'usadoPor\',\'usadoEm\'])',
        'prestador consome o convite e, na mesma escrita, mexe em outro campo',
        () => updateDoc(doc(db.prestador, 'convites/cv-ok'),
          { usado: true, usadoPor: 'prestador', usadoEm: Date.now(), workspaceId: 'wsB' }));

      await negado(R_CONVITES + ' -- allow update: conviteNoPrazo(resource.data)',
        'prestador tenta consumir um convite VENCIDO',
        () => updateDoc(doc(db.prestador, 'convites/cv-vencido'),
          { usado: true, usadoPor: 'prestador', usadoEm: Date.now() }));

      await negado(R_CONVITES + ' -- allow update: resource.data.revogadoEm == null',
        'prestador tenta consumir um convite REVOGADO',
        () => updateDoc(doc(db.prestador, 'convites/cv-revogado'),
          { usado: true, usadoPor: 'prestador', usadoEm: Date.now() }));

      await negado(R_MEMBERS + ' -- allow create (3 ramos)',
        'anonimo tenta se auto-vincular com convite valido (isRealAuth)',
        () => setDoc(doc(db.anonimo, 'workspaces/wsA/members/anonimo'), vinculo('cv-ok')));

      // o outro sentido: o caminho legitimo tem que funcionar, senao o prestador
      // nunca entra e a Story 11 nao existe
      await permitido(R_MEMBERS + ' -- allow create: auto-vinculo por convite',
        'prestador se auto-vincula como tecnico citando um convite valido de wsA',
        () => setDoc(doc(db.prestador, 'workspaces/wsA/members/prestador'), vinculo('cv-ok')));

      /* USO UNICO -- o invariante central da Story 11, que nao tinha teste nenhum.
       * A regra de members/{uid} apenas LE convites/{codigo} e exige `usado == false`;
       * ela NAO exige que o convite seja marcado como usado na mesma escrita. O
       * comentario da regra diz "consumido na mesma transacao", mas isso e verdade do
       * CLIENTE (index.html), nao da regra: quem monta a chamada a mao pode criar a
       * membership e simplesmente nao consumir o codigo. */
      await permitido(R_MEMBERS + ' -- allow create: convite.usado == false (sem exigir o consumo)',
        '[GAP ACEITO] SEGUNDA pessoa se auto-vincula com o MESMO convite ainda nao '
        + 'consumido -- a regra confere `usado == false` mas nao obriga a marcar o '
        + 'convite na mesma escrita, entao "uso unico" e garantia do cliente, nao da '
        + 'regra. Levado ao proprietario em 26/09/2026; esta suite documenta o '
        + 'comportamento de hoje, nao o corrige',
        () => setDoc(doc(db.prestador2, 'workspaces/wsA/members/prestador2'), vinculo('cv-ok')));

      await permitido(R_CONVITES + ' -- allow update: consumo pelo proprio prestador',
        'prestador consome o convite (usado, usadoPor=proprio uid, usadoEm)',
        () => updateDoc(doc(db.prestador, 'convites/cv-ok'),
          { usado: true, usadoPor: 'prestador', usadoEm: Date.now() }));

      await negado(R_MEMBERS + ' -- allow create: convite.usado == false',
        'TERCEIRA pessoa tenta o mesmo convite DEPOIS de ele ser marcado como usado -- '
        + 'e o que fecha a janela do gap acima',
        () => setDoc(doc(db.prestador3, 'workspaces/wsA/members/prestador3'), vinculo('cv-ok')));

      await permitido(R_CONVITES + ' -- conviteNoPrazo: !(\'expiraEm\' in d)',
        '[GAP ACEITO] convite LEGADO sem expiraEm continua consumivel -- sao poucos, '
        + 'ficam visiveis na tela do gestor e podem ser revogados; invalidar todos de '
        + 'uma vez quebraria vinculos em andamento',
        () => updateDoc(doc(db.prestador, 'convites/cv-legado'),
          { usado: true, usadoPor: 'prestador', usadoEm: Date.now() }));
    });

    /* ════════════════════════════════════════════════════════════════════
       7. Avaliacao do app (feedback) -- write-only por desenho
       ════════════════════════════════════════════════════════════════════ */
    await grupo('7. Avaliacao do app (feedback): write-only por desenho', async () => {
      await negado(R_FEEDBACK + ' -- allow read: if false',
        'GESTOR tenta LER feedback/f1 (nao existe painel de leitura no app)',
        () => getDoc(doc(db.gestorA, 'feedback/f1')));

      await negado(R_FEEDBACK + ' -- allow read: if false',
        'o proprio autor (tecA) tenta LER de volta a avaliacao que enviou',
        () => getDoc(doc(db.tecA, 'feedback/f1')));

      await negado(R_FEEDBACK + ' -- allow read: if false',
        'qualquer um tenta LISTAR a colecao feedback',
        () => getDocs(collection(db.gestorA, 'feedback')));

      await negado(R_FEEDBACK + ' -- allow update: if false',
        'gestor tenta ALTERAR uma avaliacao enviada',
        () => updateDoc(doc(db.gestorA, 'feedback/f1'), { nota: 1 }));

      await negado(R_FEEDBACK + ' -- allow delete: if false',
        'gestor tenta APAGAR uma avaliacao enviada',
        () => deleteDoc(doc(db.gestorA, 'feedback/f1')));

      await negado(R_FEEDBACK + ' -- allow create: nota <= 5',
        'membro tenta enviar avaliacao com nota 6 (acima do teto)',
        () => setDoc(doc(db.tecA, 'feedback/nova-6'), { workspaceId: 'wsA', nota: 6 }));

      await negado(R_FEEDBACK + ' -- allow create: nota >= 1',
        'membro tenta enviar avaliacao com nota 0 (abaixo do piso) -- sem este caso, '
        + 'trocar o >= 1 por >= 0 na regra nao quebrava nada',
        () => setDoc(doc(db.tecA, 'feedback/nova-0'), { workspaceId: 'wsA', nota: 0 }));

      await negado(R_FEEDBACK + ' -- allow create: nota is number',
        'membro tenta enviar avaliacao com nota em texto',
        () => setDoc(doc(db.tecA, 'feedback/nova-txt'), { workspaceId: 'wsA', nota: '5' }));

      await negado(R_FEEDBACK + ' -- allow create: isMember(request.resource.data.workspaceId)',
        'membro de wsA tenta enviar avaliacao no nome de wsB',
        () => setDoc(doc(db.tecA, 'feedback/nova-ws'), { workspaceId: 'wsB', nota: 5 }));

      await negado(R_FEEDBACK + ' -- allow create: isRealAuth()',
        'anonimo tenta enviar avaliacao',
        () => setDoc(doc(db.anonimo, 'feedback/nova-anon'), { workspaceId: 'wsA', nota: 5 }));

      // o outro sentido: qualquer papel real do workspace envia, nos dois limites
      await permitido(R_FEEDBACK + ' -- allow create',
        'TECNICO de wsA envia avaliacao com nota 3 (CAP-15 nao restringe por perfil)',
        () => setDoc(doc(db.tecA, 'feedback/nova-tec'), { workspaceId: 'wsA', nota: 3 }));

      await permitido(R_FEEDBACK + ' -- allow create: nota >= 1',
        'GESTOR de wsA envia avaliacao com nota 1 (limite inferior aceito)',
        () => setDoc(doc(db.gestorA, 'feedback/nova-ges'), { workspaceId: 'wsA', nota: 1 }));

      await permitido(R_FEEDBACK + ' -- allow create: nota <= 5',
        'membro envia avaliacao com nota 5 (limite superior aceito)',
        () => setDoc(doc(db.tecA, 'feedback/nova-5'), { workspaceId: 'wsA', nota: 5 }));
    });

    /* ════════════════════════════════════════════════════════════════════
       8. Metadado do workspace: status, e as 8 chaves reservadas de ramo
       ════════════════════════════════════════════════════════════════════ */
    await grupo('8. Metadado do workspace: status pendente e ramo valido', async () => {
      const novo = (extra) => Object.assign({ criado: true, status: 'pendente', ramo: 'predial' }, extra);

      await negado(R_WS + ' -- allow update, delete: if false',
        'gestor de workspace PENDENTE tenta se AUTO-APROVAR (status pendente -> ativo)',
        () => updateDoc(doc(db.gestorP, 'workspaces/wsP'), { status: 'ativo' }));

      await negado(R_WS + ' -- allow update, delete: if false',
        'gestor tenta qualquer UPDATE no metadado do proprio workspace ativo',
        () => updateDoc(doc(db.gestorA, 'workspaces/wsA'), { ramo: 'outro' }));

      await negado(R_WS + ' -- allow update, delete: if false',
        'gestor tenta APAGAR o proprio workspace',
        () => deleteDoc(doc(db.gestorA, 'workspaces/wsA')));

      await negado(R_WS + ' -- allow create: status == \'pendente\'',
        'cria workspace novo ja nascendo ATIVO (auto-aprovacao na criacao)',
        () => setDoc(doc(db.fundador, 'workspaces/ws-ativo'), novo({ status: 'ativo' })));

      await negado(R_WS + ' -- allow create: request.resource.data.criado == true',
        'cria workspace novo sem o marcador criado:true',
        () => setDoc(doc(db.fundador, 'workspaces/ws-sem-marca'), { status: 'pendente', ramo: 'predial' }));

      /* Laco sobre as 8 chaves herdadas de Object.prototype, nao sobre duas delas.
       * Antes a suite testava `constructor` e `ToString`: as outras seis podiam sair da
       * regra sem nada falhar, e um ramo chamado `valueOf` fazia RAMO_TEMPLATES[ramo]
       * resolver para uma FUNCAO em vez de undefined, quebrando o fallback "||predial".
       * Duas formas de caixa por chave, porque a regra compara com ramo.lower(). */
      for (const chave of RAMOS_RESERVADOS) {
        const titulo = chave.charAt(0).toUpperCase() + chave.slice(1);
        await negado(R_WS + ' -- allow create: ramoValido(ramo) / ramo.lower() in [...]',
          'cria workspace com ramo reservado "' + chave + '"',
          () => setDoc(doc(db.fundador, 'workspaces/ws-ramo-' + chave), novo({ ramo: chave })));
        await negado(R_WS + ' -- allow create: ramo.lower() -- comparacao sem caixa',
          'cria workspace com ramo reservado "' + titulo + '" (outra caixa)',
          () => setDoc(doc(db.fundador, 'workspaces/ws-ramoT-' + chave), novo({ ramo: titulo })));
      }

      await negado(R_WS + ' -- allow create: ramo.size() <= 60',
        'cria workspace com ramo de 61 caracteres',
        () => setDoc(doc(db.fundador, 'workspaces/ws-61'), novo({ ramo: 'r'.repeat(61) })));

      await negado(R_WS + ' -- allow create: ramo.size() > 0',
        'cria workspace com ramo vazio',
        () => setDoc(doc(db.fundador, 'workspaces/ws-vazio'), novo({ ramo: '' })));

      await negado(R_WS + ' -- allow create: ramo is string',
        'cria workspace com ramo numerico',
        () => setDoc(doc(db.fundador, 'workspaces/ws-num'), novo({ ramo: 7 })));

      await negado(R_WS + ' -- allow create: isRealAuth()',
        'ANONIMO tenta criar workspace',
        () => setDoc(doc(db.anonimo, 'workspaces/ws-anon'), novo({})));

      // o outro sentido
      await permitido(R_WS + ' -- allow create',
        'autenticado real cria workspace novo: criado:true, status pendente, ramo valido',
        () => setDoc(doc(db.fundador, 'workspaces/ws-novo'), novo({})));

      await permitido(R_WS + ' -- allow create: ramo.size() <= 60',
        'cria workspace com ramo de EXATAMENTE 60 caracteres (limite aceito)',
        () => setDoc(doc(db.fundador, 'workspaces/ws-60'), novo({ ramo: 'r'.repeat(60) })));

      await permitido(R_WS + ' -- allow create: ramo customizado',
        'cria workspace com ramo customizado com acento e hifen',
        () => setDoc(doc(db.fundador, 'workspaces/ws-acento'), novo({ ramo: 'Manutencao Predial - Sao Joao' })));
    });

    /* ════════════════════════════════════════════════════════════════════
       9. Membership: papel vem do documento, nunca do cliente (AD-2)
       ════════════════════════════════════════════════════════════════════ */
    await grupo('9. Membership: papel pelo documento, nunca por campo do cliente', async () => {
      await negado(R_MEMBERS + ' -- allow create: isGestor(wsId)',
        'TECNICO tenta criar uma membership nova em wsA',
        () => setDoc(doc(db.tecA, 'workspaces/wsA/members/inventado'), { role: 'tecnico' }));

      await negado(R_MEMBERS + ' -- allow create: !exists(workspaces/$(wsId))',
        'invasor tenta o bootstrap de gestor num workspace que JA tem marcador',
        () => setDoc(doc(db.invasor, 'workspaces/wsA/members/invasor'), { role: 'gestor' }));

      await negado(R_MEMBERS + ' -- allow create: role == \'gestor\' no bootstrap',
        'bootstrap tentando nascer como tecnico, sem convite, em workspace sem marcador',
        () => setDoc(doc(db.fundador, 'workspaces/ws-virgem/members/fundador'), { role: 'tecnico' }));

      await negado(R_MEMBERS + ' -- allow update: isGestor(wsId)',
        'tecnico tenta se PROMOVER a gestor editando a propria membership',
        () => updateDoc(doc(db.tecA, 'workspaces/wsA/members/tecA'), { role: 'gestor' }));

      await negado(R_MEMBERS + ' -- allow update: isGestor(wsId)',
        'tecnico tenta promover um colega a gestor',
        () => updateDoc(doc(db.tecA, 'workspaces/wsA/members/sobra'), { role: 'gestor' }));

      await negado(R_MEMBERS + ' -- allow delete: isGestor(wsId)',
        'tecnico tenta APAGAR a membership do gestor',
        () => deleteDoc(doc(db.tecA, 'workspaces/wsA/members/gestorA')));

      await negado(R_MEMBERS + ' -- allow delete: request.auth.uid != uid',
        'gestor tenta apagar a PROPRIA membership (deixaria o workspace orfao)',
        () => deleteDoc(doc(db.gestorA, 'workspaces/wsA/members/gestorA')));

      await negado(R_MEMBERS + ' -- allow create: isRealAuth()',
        'ANONIMO tenta o bootstrap de gestor num workspace sem marcador',
        () => setDoc(doc(db.anonimo, 'workspaces/ws-virgem2/members/anonimo'), { role: 'gestor' }));

      // o outro sentido
      await permitido(R_MEMBERS + ' -- allow create: bootstrap do primeiro gestor',
        'fundador cria a PROPRIA membership de gestor antes do marcador do workspace existir',
        () => setDoc(doc(db.fundador, 'workspaces/ws-virgem/members/fundador'), { role: 'gestor' }));

      await permitido(R_MEMBERS + ' -- allow create: isGestor(wsId)',
        'gestor cria uma membership nova no proprio workspace',
        () => setDoc(doc(db.gestorA, 'workspaces/wsA/members/contratado'), { role: 'tecnico' }));

      await permitido(R_MEMBERS + ' -- allow update: isGestor(wsId)',
        'gestor promove um tecnico do proprio workspace',
        () => updateDoc(doc(db.gestorA, 'workspaces/wsA/members/sobra'), { role: 'gestor' }));

      await permitido(R_MEMBERS + ' -- allow delete: isGestor(wsId) && uid != proprio',
        'gestor remove a membership de um tecnico',
        () => deleteDoc(doc(db.gestorA, 'workspaces/wsA/members/tecA')));
    });

    /* ════════════════════════════════════════════════════════════════════
       10. Ponteiro de descoberta de workspace (userWorkspaces, AD-11)
       ════════════════════════════════════════════════════════════════════ */
    await grupo('10. Ponteiro userWorkspaces/{uid} (AD-11)', async () => {
      await negado(R_PONTEIRO + ' -- allow read: request.auth.uid == uid',
        'tecB tenta LER o ponteiro de tecA (descobrir o workspace de outra pessoa)',
        () => getDoc(doc(db.tecB, 'userWorkspaces/tecA')));

      await negado(R_PONTEIRO + ' -- allow read: request.auth != null',
        'SEM SESSAO tenta LER um ponteiro',
        () => getDoc(doc(db.semSessao, 'userWorkspaces/tecA')));

      await negado(R_PONTEIRO + ' -- allow update: if false',
        'gestor tenta REATRIBUIR o ponteiro de tecA (update e sempre negado)',
        () => updateDoc(doc(db.gestorA, 'userWorkspaces/tecA'), { workspaceId: 'wsB' }));

      /* Sem estes dois, afrouxar o ramo `isGestor(workspaceId)` do create para
       * `isMember(...)` passaria verde -- e qualquer tecnico poderia criar o ponteiro de
       * OUTRO uid. Como `update: if false` e so gestor apaga, isso TRAVA a pessoa
       * permanentemente: ela nunca mais entra em workspace nenhum. */
      await negado(R_PONTEIRO + ' -- allow create: uid == proprio || isGestor(workspaceId)',
        'TECNICO tenta criar o ponteiro de OUTRO uid (travaria a pessoa para sempre)',
        () => setDoc(doc(db.tecA, 'userWorkspaces/vitima'), { workspaceId: 'wsA' }));

      await negado(R_PONTEIRO + ' -- allow create: uid == proprio || isGestor(workspaceId)',
        'autenticado sem membership tenta criar o ponteiro de OUTRO uid',
        () => setDoc(doc(db.estranho, 'userWorkspaces/vitima2'), { workspaceId: 'wsA' }));

      await negado(R_PONTEIRO + ' -- allow create: isRealAuth()',
        'ANONIMO tenta criar o proprio ponteiro',
        () => setDoc(doc(db.anonimo, 'userWorkspaces/anonimo'), { workspaceId: 'wsA' }));

      await negado(R_PONTEIRO + ' -- allow delete: isGestor(resource.data.workspaceId)',
        'gestor de wsB tenta APAGAR o ponteiro de tecA, que aponta para wsA',
        () => deleteDoc(doc(db.gestorB, 'userWorkspaces/tecA')));

      await negado(R_PONTEIRO + ' -- allow delete: isGestor(...)',
        'tecnico tenta apagar o PROPRIO ponteiro (nao e gestor)',
        () => deleteDoc(doc(db.tecA, 'userWorkspaces/tecA')));

      // o outro sentido
      await leu(R_PONTEIRO + ' -- allow read: request.auth.uid == uid',
        'tecA LE o proprio ponteiro',
        () => getDoc(doc(db.tecA, 'userWorkspaces/tecA')));

      await permitido(R_PONTEIRO + ' -- allow create: request.auth.uid == uid',
        'autenticado real cria o PROPRIO ponteiro',
        () => setDoc(doc(db.estranho, 'userWorkspaces/estranho'), { workspaceId: 'wsA' }));

      await permitido(R_PONTEIRO + ' -- allow create: isGestor(workspaceId)',
        '[GAP ACEITO] gestor cria o ponteiro de um uid QUALQUER apontando para o proprio '
        + 'workspace -- a regra nao consegue conferir se aquele uid e um tecnico legitimo '
        + 'porque isso exigiria ler dentro do blob JSON de mappo_tecnicos, que o Firestore '
        + 'nao parseia',
        () => setDoc(doc(db.gestorA, 'userWorkspaces/uid-arbitrario'), { workspaceId: 'wsA' }));

      await permitido(R_PONTEIRO + ' -- allow delete: isGestor(resource.data.workspaceId)',
        'gestor de wsA apaga o ponteiro de tecA -- sem isso um tecnico removido nunca '
        + 'mais conseguia ser convidado, em NENHUMA empresa',
        () => deleteDoc(doc(db.gestorA, 'userWorkspaces/tecA')));
    });

    /* ─────────────────── veredito ─────────────────── */

    linha();

    if (falhas.length) {
      console.log('O que falhou (' + falhas.length + ' de ' + conferidos + '):\n');
      falhas.forEach((f, i) => {
        console.log('  ' + (i + 1) + '. ' + f.cenario);
        console.log('     regra em firestore.rules: ' + f.regra);
        console.log('     esperado: ' + f.esperado);
        console.log('     obtido:   ' + f.obtido);
        console.log('');
      });
      console.log('Dentro de um grupo os casos compartilham a mesma semeadura, entao a');
      console.log('PRIMEIRA falha de cada grupo e a mais confiavel: as seguintes podem ser');
      console.log('consequencia dela.');
      linha();
      return 1;
    }

    const garantias = conferidos - gapsAceitos;
    console.log(conferidos + ' verificacoes de regra, nos dois sentidos, em '
      + gruposRodados.length + ' grupos.');
    console.log('  ' + garantias + ' sao garantias (o que a regra protege).');
    console.log('  ' + gapsAceitos + ' sao gaps aceitos, documentados com o porque -- '
      + 'NAO sao garantias:');
    console.log('    eles fixam um risco que o proprietario ja conhece, so para que nao');
    console.log('    mude sozinho. Ler o verde como "tudo protegido" superestima a rede.');

    /* Piso de cobertura (defesa 1): a contagem nao pode ser so decorativa. */
    if (conferidos < PISO_CASOS || gruposRodados.length < PISO_GRUPOS) {
      linha();
      console.error('COBERTURA ABAIXO DO PISO -- a suite encolheu.');
      console.error('  casos:  ' + conferidos + '  (piso ' + PISO_CASOS + ')');
      console.error('  grupos: ' + gruposRodados.length + '  (piso ' + PISO_GRUPOS + ')');
      console.error('Grupos que rodaram: ' + (gruposRodados.join(' | ') || '(nenhum)'));
      console.error('');
      console.error('Todos os casos executados passaram, mas executou-se menos do que o');
      console.error('combinado: um grupo ou um bloco de casos saiu. Se a reducao foi de');
      console.error('proposito, baixe PISO_CASOS/PISO_GRUPOS no mesmo commit, explicando.');
      linha();
      return 1;
    }

    console.log('Nenhuma delas tocou em producao: projeto ' + PROJETO + ' no emulador local.');
    linha();
    console.log('\nTODOS OS CHECKS PASSARAM.');
    return 0;
  } finally {
    if (env) {
      try {
        await env.cleanup();
      } catch (e) {
        console.error('aviso ao encerrar o ambiente de teste: ' + (e.code || '?') + ' - ' + e.message);
      }
    }
    encerrarEmulador();
  }
}

principal()
  .then((codigo) => {
    process.exitCode = codigo;
  })
  .catch((e) => {
    console.error('\nA suite de regras quebrou antes de terminar: '
      + (e.code || '?') + ' - ' + e.message);
    console.error(e.stack);
    console.error('\nIsto NAO e uma falha de regra: e a propria suite (ou o emulador, ou a');
    console.error('semeadura) que nao chegou ao fim. Nenhum veredito pode ser tirado daqui.');
    process.exitCode = 1;
  });
