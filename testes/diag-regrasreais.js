/* DIAGNOSTICO DE PRODUCAO (mede, nao reprova) -- as regras QUE O FIRESTORE ESTA APLICANDO
 * agora batem com o `firestore.rules` que a suite testou?
 *
 * BATE NO FIRESTORE REAL. Fica FORA do npm test e do CI (convencao da casa: testes/README.md).
 * Roda a mao, quando o proprietario pedir:  npm run test:producao
 *   ou direto:  node testes/diag-regrasreais.js
 *
 * POR QUE EXISTE: `npm run test:regras` prova o ARQUIVO -- ele sobe o Emulator com o
 * firestore.rules desta pasta e exercita todos os casos dela (a contagem sai na execucao --
 * PISO_CASOS e um piso, nao a contagem). Nada nele prova que o arquivo FOI
 * PUBLICADO. Publicar regra e um `firebase deploy --only firestore:rules` que alguem precisa
 * lembrar de rodar, e a CLI do Firebase nao tem comando para LER a regra que esta no ar (zero
 * comandos com "rules" de leitura, conferido em 08/10/2026). Entao a unica forma honesta de
 * medir producao e TENTAR o que a regra deve negar e ver o que o servidor responde.
 *
 * COMO LE "producao divergiu": qualquer sonda que PASSE. Uma negativa por permission-denied e
 * a regra funcionando; uma negativa por OUTRO erro (rede, projeto errado, caminho inexistente)
 * NAO e medicao nenhuma -- "nao consegui ler" nunca e "nao existe", e este arquivo separa os
 * dois em secoes diferentes de proposito.
 *
 * O CONTROLE POSITIVO e obrigatorio e vem primeiro: uma sonda que erra o caminho, o projeto ou
 * o workspace devolve permission-denied em TODAS as tentativas e imprimiria um verde perfeito
 * sem ter medido nada. Sao DOIS controles, com alcances diferentes:
 *   A (obrigatorio, nao depende de nada): a sessao anonima LE o PROPRIO userWorkspaces/{uid} --
 *     a regra permite (request.auth.uid == uid) -- e e NEGADA no ponteiro de outro uid. Isso
 *     prova que as respostas vem do motor de regras real do projeto certo, e que um caminho
 *     permitido nao volta como permission-denied. Se A falhar, nada e medido.
 *   B (ancora do WORKSPACE, opcional): com um link publico valido em MAPPO_DIAG_TOKEN, o mesmo
 *     documento data/pub_{token} e NEGADO sem sessao e LIDO com sessao anonima. Sem B, as
 *     sondas dentro de workspaces/{ws}/... ficam SEM ANCORA: um workspaceId errado nega tudo,
 *     e o diagnostico marca essas sondas como nao-ancoradas em vez de contar verde.
 *
 * NAO ESCREVE NADA NO FIRESTORE por padrao -- com um asterisco honesto: para sondar como o
 * visitante do link do cliente, ele faz login ANONIMO, e isso CRIA uma conta de verdade no
 * Firebase Auth do projeto. Ela e apagada no fim (deleteUser, no finally); se o apagamento
 * falhar, o diagnostico DIZ, com o uid, para o proprietario poder apagar a mao no Console.
 * As sondas sao tentativas que devem FALHAR; a unica sonda de
 * escrita possivel fica atras de MAPPO_DIAG_SONDA_ESCRITA=1, porque escrever em producao
 * precisa de autorizacao do proprietario (spec: "Ask First"). Mesmo ligada, ela mira um docId
 * que o app nao usa -- nunca os blobs de posicao reais, nunca um documento com dado de cliente.
 *
 * Ajustes por ambiente (todos opcionais):
 *   MAPPO_DIAG_WS=<workspaceId>        qual workspace sondar
 *   MAPPO_DIAG_TOKEN=<token>           token do link publico usado como controle positivo
 *   MAPPO_DIAG_SONDA_ESCRITA=1         liga a sonda de escrita (negada se as regras estao no ar)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = process.env.MAPPO_RAIZ || path.resolve(__dirname, '..');
const BASE = 'https://inteligenciaartificial341-code.github.io/MAPPO/';

/* O workspace vem do mesmo link publico que o diag-linkreal.js ja usa -- nenhum segredo novo
   entra no repositorio, e o link e publico por definicao.
   O TOKEN nao tem padrao de proposito (revisao de 09/10/2026): o token que estava embutido
   aqui JA NASCEU MORTO -- rodado contra producao em 08/10/2026 voltou permission-denied (link
   expirado, revogado ou apagado), e com isso 7 das 10 sondas ficaram sem ancora. Padrao que
   nao funciona e pior que nenhum: faz o diagnostico PARECER ancorado. Sem token, o controle B
   e declarado AUSENTE e as sondas de dentro do workspace saem marcadas como nao-medidas. */
const WS = process.env.MAPPO_DIAG_WS || 'elite-ar-solucoes-em-refrigeracao-termic';
const TOKEN = process.env.MAPPO_DIAG_TOKEN || null;
const SONDA_ESCRITA = process.env.MAPPO_DIAG_SONDA_ESCRITA === '1';

const TETO_MS = 20000;
const DOC_SONDA = 'sonda_regras_diag';   // docId que o app NAO usa, nem agora nem antes

/* ─────────────────── config do app: a publicada, nao a inventada aqui ─────────────────── */

function lerConfigDe(texto) {
  const i = texto.indexOf('const firebaseConfig');
  if (i < 0) return null;
  const abre = texto.indexOf('{', i);
  const fecha = texto.indexOf('}', abre);
  if (abre < 0 || fecha < 0) return null;
  const cfg = {};
  texto.slice(abre + 1, fecha).replace(/(\w+)\s*:\s*"([^"]*)"/g, (_, k, v) => { cfg[k] = v; return _; });
  return Object.keys(cfg).length ? cfg : null;
}

async function configPublicada() {
  try {
    const r = await fetch(BASE + 'index.html', { signal: AbortSignal.timeout(TETO_MS) });
    if (!r.ok) return { erro: 'HTTP ' + r.status };
    const cfg = lerConfigDe(await r.text());
    return cfg ? { cfg } : { erro: 'nao achei o bloco firebaseConfig no index.html publicado' };
  } catch (e) {
    return { erro: ((e && e.code) || '?') + ' - ' + (e && e.message) };
  }
}

function configLocal() {
  try {
    return { cfg: lerConfigDe(fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')) };
  } catch (e) {
    return { erro: ((e && e.code) || '?') + ' - ' + (e && e.message) };
  }
}

/* ─────────────────── o conferidor ─────────────────── */

const resultado = { negadas: [], passaram: [], naoMedidas: [] };

function comTeto(promessa, rotulo) {
  let relogio;
  const estouro = new Promise((_, falha) => {
    relogio = setTimeout(() => {
      const e = new Error('passou de ' + TETO_MS + 'ms sem resposta (' + rotulo + ')');
      e.code = 'deadline-local';
      falha(e);
    }, TETO_MS);
  });
  return Promise.race([promessa, estouro]).finally(() => clearTimeout(relogio));
}

/* Tenta uma operacao que a regra DEVE negar.
   `escopo`: 'raiz' (colecao de raiz, ancorada pelo controle A) ou 'ws' (dentro de
   workspaces/{ws}/..., que so o controle B ancora). */
async function sonda(regra, cenario, op, escopo) {
  let erro = null;
  try {
    await comTeto(op(), cenario);
  } catch (e) { erro = e; }

  if (erro === null) {
    resultado.passaram.push({ regra, cenario });
    console.log('  PASSOU !!  ' + cenario);
    console.log('             regra que deveria negar: ' + regra);
    return;
  }
  const cod = (erro && erro.code) || '?';
  const porRegra = cod === 'permission-denied'
    || /PERMISSION_DENIED|insufficient permissions|Missing or insufficient/i.test(String(erro && erro.message));
  if (porRegra) {
    resultado.negadas.push({ regra, cenario, escopo: escopo || 'raiz' });
    console.log('  negado     ' + cenario);
    return;
  }
  resultado.naoMedidas.push({ cenario, motivo: cod + ' - ' + (erro && erro.message) });
  console.log('  NAO MEDI   ' + cenario);
  console.log('             ' + cod + ' - ' + (erro && erro.message));
}

/* Operacao que a regra deve PERMITIR -- so os controles positivos. */
async function controle(cenario, op, conferir) {
  try {
    const v = await comTeto(op(), cenario);
    const veredito = conferir ? conferir(v) : true;
    if (veredito !== true) {
      console.log('  FALHOU     ' + cenario);
      console.log('             permitido, mas ' + veredito);
      return false;
    }
    console.log('  ok         ' + cenario);
    return true;
  } catch (e) {
    console.log('  FALHOU     ' + cenario);
    console.log('             ' + ((e && e.code) || '?') + ' - ' + (e && e.message));
    return false;
  }
}

/* ─────────────────── principal ─────────────────── */

(async () => {
  console.log('MAPPO — as regras NO AR batem com as que a suite testou?');
  console.log('hora local: ' + new Date().toLocaleString('pt-BR'));
  console.log('workspace sondado: ' + WS);

  const pub = await configPublicada();
  const loc = configLocal();
  const cfg = pub.cfg || loc.cfg;

  console.log('\n=== DE ONDE VEIO A CONFIGURACAO ===');
  if (pub.cfg) console.log('  do index.html PUBLICADO (' + BASE + '): projeto ' + pub.cfg.projectId);
  else console.log('  nao deu para ler a config publicada: ' + pub.erro);
  if (loc.cfg) console.log('  do index.html desta pasta: projeto ' + loc.cfg.projectId);
  else console.log('  nao deu para ler a config local: ' + loc.erro);
  if (pub.cfg && loc.cfg && pub.cfg.projectId !== loc.cfg.projectId) {
    console.log('  ATENCAO: os dois projetos DIFEREM. As sondas abaixo foram no projeto publicado.');
  }
  if (!cfg) {
    console.log('\nSem configuracao nao ha o que sondar. Nada medido.');
    return;
  }

  const { initializeApp, deleteApp } = require('firebase/app');
  const { getAuth, signInAnonymously, deleteUser } = require('firebase/auth');
  const {
    getFirestore, doc, getDoc, collection, getDocs, setDoc, terminate,
  } = require('firebase/firestore');

  const app = initializeApp(cfg, 'sonda-regras');
  const db = getFirestore(app);
  const auth = getAuth(app);

  try {
    console.log('\n=== CONTROLE POSITIVO A: o arnes alcanca o motor de regras? ===');
    /* Sem sessao nenhuma, um caminho que a regra abre para o dono do uid tem que ser negado:
       prova que a negativa vem da REGRA, nao de um caminho inexistente. */
    let anonimo = null;
    await sonda('match /userWorkspaces/{uid} -- allow read: request.auth != null',
      'SEM SESSAO tenta ler um ponteiro de workspace',
      () => getDoc(doc(db, 'userWorkspaces/qualquer-uid')));
    const negouSemSessao = resultado.negadas.length === 1;
    if (negouSemSessao) resultado.negadas.pop();   // e controle, nao garantia
    console.log('  ' + (negouSemSessao ? 'ok' : 'FALHOU') + '         sem sessao o ponteiro foi NEGADO');

    try {
      const cred = await comTeto(signInAnonymously(auth), 'login anonimo');
      anonimo = cred.user.uid;
      console.log('  ok         sessao ANONIMA aberta (uid ' + anonimo + ')');
    } catch (e) {
      console.log('  FALHOU     login anonimo: ' + ((e && e.code) || '?') + ' - ' + (e && e.message));
    }

    let harnesOk = false;
    if (anonimo) {
      /* A regra permite ler o PROPRIO ponteiro (request.auth.uid == uid). O documento nao
         existe para um anonimo -- e nao precisa: o que se mede e que um caminho PERMITIDO nao
         volta como permission-denied. Se este sucesso nao acontecer, "negado" abaixo nao
         distingue regra de projeto errado. */
      harnesOk = await controle('sessao ANONIMA LE o PROPRIO userWorkspaces/' + anonimo
        + ' -- caminho que a regra PERMITE (o documento nem existe, e nao precisa)',
        () => getDoc(doc(db, 'userWorkspaces/' + anonimo)));
    }

    if (!harnesOk || !negouSemSessao || !anonimo) {
      console.log('\n------------------------------------------------------------');
      /* A PRIMEIRA versao desta saida silenciava o achado mais grave que existe aqui
         (revisao de 09/10/2026): se a sonda SEM SESSAO nao foi negada, producao esta ABERTA --
         e o texto antigo chamava isso de "controle A falhou" e listava tres causas, nenhuma
         delas "a regra vazou", dando return sem imprimir o que passou. Negativa de arnes e
         vazamento de regra chegam pela mesma porta; separa-los e o trabalho. */
      if (resultado.passaram.length) {
        console.log('PRODUCAO ABERTA -- e isto NAO e falha de arnes:');
        resultado.passaram.forEach((p) => {
          console.log('  PASSOU: ' + p.cenario);
          console.log('    deveria ser negada por: ' + p.regra);
        });
        console.log('');
        console.log('Uma operacao que a regra deve negar foi ACEITA pelo servidor. Leve ao');
        console.log('proprietario agora: as regras publicadas divergem do firestore.rules que a');
        console.log('suite do Emulator prova. O comando que republica e:');
        console.log('  npm run regras:publicar');
        console.log('------------------------------------------------------------');
        return;
      }
      console.log('CONTROLE POSITIVO A FALHOU: nada abaixo foi medido de verdade.');
      console.log('Nenhuma sonda PASSOU -- ou seja, nao ha sinal de regra afrouxada aqui; o que');
      console.log('falhou foi o proprio arnes. As causas, em ordem de probabilidade:');
      console.log('  1. sem rede, ou o Firestore inalcancavel daqui;');
      console.log('  2. login anonimo desligado no Console do Firebase (o visitante do link do');
      console.log('     cliente depende dele -- se estiver desligado, e um defeito de producao);');
      console.log('  3. a regra de userWorkspaces/{uid} APERTOU e nem o dono do uid le mais --');
      console.log('     aperto nao vaza dado, mas quebra _resolverWorkspace no login de todo');
      console.log('     mundo; confira o allow read desse match antes de concluir "foi a rede".');
      console.log('Um caminho que nao existe responde "permission-denied" a tudo: seria um verde');
      console.log('perfeito medindo nada. Por isso o resto nao e executado.');
      console.log('------------------------------------------------------------');
      return;
    }

    console.log('\n=== CONTROLE POSITIVO B: o workspace sondado existe mesmo? ===');
    /* Esta e a ancora das sondas dentro de workspaces/{ws}/...: so um documento pub_* LIDO
       prova que aquele workspaceId existe e esta ativo. Sem ela, um id errado nega tudo. */
    const wsAncorado = TOKEN === null ? false : await controle(
      'sessao ANONIMA LE o link publico data/pub_' + TOKEN + ' do workspace ' + WS,
      () => getDoc(doc(db, 'workspaces/' + WS + '/data/pub_' + TOKEN)),
      (s) => (s.exists() ? true : 'o documento nao existe -- token apagado, ou workspaceId errado'));
    if (TOKEN === null) {
      console.log('  AUSENTE    nenhum token informado (MAPPO_DIAG_TOKEN). O controle B nao foi');
      console.log('             tentado: sem ele eu nao sei se o workspace sondado existe, e um');
      console.log('             workspaceId inexistente nega TUDO -- verde perfeito medindo nada.');
      console.log('             Pegue o token de um link de acompanhamento VIVO (o trecho depois');
      console.log('             do ultimo / na URL que o cliente recebe) e rode:');
      console.log('               MAPPO_DIAG_TOKEN=<token> node testes/diag-regrasreais.js');
    } else if (wsAncorado) {
      console.log('  ok         o link publico data/pub_' + TOKEN + ' foi LIDO: o workspace existe,');
      console.log('             esta ativo, e o carve-out de pub_* funciona no ar.');
    } else {
      console.log('  SEM ANCORA o link publico data/pub_' + TOKEN + ' foi negado. Pode ser:');
      console.log('             (1) o link expirou/foi revogado (revogar grava expiraEm no passado);');
      console.log('             (2) o documento foi apagado;  (3) o workspaceId esta errado.');
      console.log('             Enquanto nao houver ancora, as sondas DENTRO de workspaces/' + WS);
      console.log('             nao distinguem "regra negou" de "este workspace nao existe".');
      console.log('             Para ancorar: MAPPO_DIAG_TOKEN=<token de um link vivo> (e');
      console.log('             MAPPO_DIAG_WS, se a empresa for outra).');
    }

    console.log('\n=== SONDAS: o que as regras publicadas DEVEM negar ===');
    const R_DATA = 'match /workspaces/{wsId}/data/{docId}';
    const R_LIVE = 'match /workspaces/{wsId}/live/{uid}';

    await sonda(R_DATA + ' -- allow read: isMember(wsId)',
      'anonimo (nao-membro) tenta LER data/mappo_os -- as ordens de servico da empresa',
      () => getDoc(doc(db, 'workspaces/' + WS + '/data/mappo_os')), 'ws');

    await sonda(R_DATA + ' -- allow read: isMember(wsId)',
      'anonimo tenta LISTAR a colecao data/ inteira (todos os documentos de uma vez)',
      () => getDocs(collection(db, 'workspaces/' + WS + '/data')), 'ws');

    await sonda(R_DATA + ' -- allow read: isMember(wsId)',
      'anonimo tenta LER data/mappo_live -- o blob de posicao antigo, que continua na nuvem',
      () => getDoc(doc(db, 'workspaces/' + WS + '/data/mappo_live')), 'ws');

    await sonda(R_LIVE + ' -- allow read: isRealAuth() && isMember(wsId)',
      'anonimo tenta LISTAR workspaces/' + WS + '/live -- onde a equipe esteve, de uma vez',
      () => getDocs(collection(db, 'workspaces/' + WS + '/live')), 'ws');

    await sonda(R_LIVE + ' -- allow read: isRealAuth() && isMember(wsId)',
      'anonimo tenta LER a posicao de um uid qualquer em live/',
      () => getDoc(doc(db, 'workspaces/' + WS + '/live/uid-qualquer')), 'ws');

    await sonda('match /workspaces/{wsId} -- allow read: isMember(wsId)',
      'anonimo tenta LER o documento do workspace',
      () => getDoc(doc(db, 'workspaces/' + WS)), 'ws');

    await sonda('match /workspaces/{wsId}/members/{uid} -- allow read: isMember(wsId)',
      'anonimo tenta LISTAR os membros do workspace',
      () => getDocs(collection(db, 'workspaces/' + WS + '/members')), 'ws');

    await sonda('match /convites/{codigo} -- allow list: if false',
      'anonimo tenta LISTAR a colecao convites (enumerar codigos de acesso)',
      () => getDocs(collection(db, 'convites')));

    await sonda('match /feedback/{id} -- allow read: if false',
      'anonimo tenta LER a colecao feedback (as avaliacoes do app)',
      () => getDocs(collection(db, 'feedback')));

    await sonda('match /userWorkspaces/{uid} -- allow read: request.auth.uid == uid',
      'anonimo tenta LER o ponteiro de workspace de OUTRO uid',
      () => getDoc(doc(db, 'userWorkspaces/uid-de-outra-pessoa')));

    if (SONDA_ESCRITA) {
      console.log('\n  MAPPO_DIAG_SONDA_ESCRITA=1: a sonda de ESCRITA esta ligada.');
      await sonda(R_DATA + ' -- allow write: isMember(wsId)',
        'anonimo tenta ESCREVER data/' + DOC_SONDA + ' (docId que o app nao usa)',
        () => setDoc(doc(db, 'workspaces/' + WS + '/data/' + DOC_SONDA), { json: '{}' }), 'ws');
      if (resultado.passaram.some((p) => p.cenario.indexOf(DOC_SONDA) >= 0)) {
        console.log('  ATENCAO: a escrita PASSOU. Existe agora um documento data/' + DOC_SONDA);
        console.log('  nesse workspace -- apague-o no Console, e trate a regra como NAO publicada.');
      }
    } else {
      resultado.naoMedidas.push({
        cenario: 'escrita anonima em data/' + DOC_SONDA,
        motivo: 'sonda de escrita desligada (MAPPO_DIAG_SONDA_ESCRITA nao e 1)',
      });
      console.log('  NAO MEDI   nenhuma escrita foi tentada -- escrever em producao precisa de');
      console.log('             autorizacao do proprietario. Para ligar:  MAPPO_DIAG_SONDA_ESCRITA=1');
    }

    console.log('\n------------------------------------------------------------');
    console.log('O QUE FOI MEDIDO:');
    const negRaiz = resultado.negadas.filter((n) => n.escopo === 'raiz');
    const negWs = resultado.negadas.filter((n) => n.escopo === 'ws');
    console.log('  ' + resultado.negadas.length + ' sonda(s) NEGADAS pelo servidor (permission-denied).');
    console.log('    ' + negRaiz.length + ' em colecao de RAIZ (convites, feedback, userWorkspaces): ancoradas pelo');
    console.log('      controle A -- estas valem como medicao de producao.');
    if (wsAncorado) {
      console.log('    ' + negWs.length + ' dentro de workspaces/' + WS + ': ancoradas pelo controle B,');
      console.log('      que provou que esse workspace existe e esta ativo -- valem como medicao.');
    } else {
      console.log('    ' + negWs.length + ' dentro de workspaces/' + WS + ': SEM ANCORA -- o controle B '
        + (TOKEN === null ? 'NAO FOI TENTADO (sem MAPPO_DIAG_TOKEN).' : 'FALHOU (o token nao leu).'));
      console.log('      Um workspaceId que nao existe nega exatamente igual, entao estas');
      console.log('      NAO valem como medicao -- nao as leia como verde.');
    }
    if (resultado.passaram.length) {
      console.log('  ' + resultado.passaram.length + ' sonda(s) PASSARAM — PRODUCAO DIVERGIU do arquivo testado:');
      resultado.passaram.forEach((p) => {
        console.log('    - ' + p.cenario);
        console.log('      deveria ser negada por: ' + p.regra);
      });
      console.log('  Causa mais provavel: o firestore.rules desta pasta NAO foi publicado.');
      console.log('  O comando e:  npm run regras:publicar   (ele roda a suite antes e so publica verde)');
    } else {
      console.log('  0 sonda passou.');
    }
    if (resultado.naoMedidas.length) {
      console.log('  ' + resultado.naoMedidas.length + ' NAO foram medidas (nao e verde nem vermelho):');
      resultado.naoMedidas.forEach((n) => console.log('    - ' + n.cenario + ': ' + n.motivo));
    }

    console.log('\nO QUE ESTE DIAGNOSTICO NAO MEDE (e nao deve ser lido como se medisse):');
    console.log('  - A CLAUSULA isBlobPosicaoMorto (08/10/2026), que nega a escrita de');
    console.log('    data/mappo_locations e data/mappo_live. Ela so e ALCANCADA por uma sessao de');
    console.log('    MEMBRO do workspace: para um anonimo, isMember(wsId) ja nega antes. Sondar');
    console.log('    isso exigiria entrar com e-mail e senha de um membro e tentar escrever sobre');
    console.log('    um documento com dado real -- escrita em producao, que precisa de decisao do');
    console.log('    proprietario. Hoje quem prova essa clausula e npm run test:regras, no');
    console.log('    Emulator, no grupo 11: escrita por tecnico e por gestor nas duas chaves,');
    console.log('    create em workspace que ainda nao tem o documento, delete, leitura');
    console.log('    preservada e controle positivo. Quantos sao: npm run test:regras diz.');
    console.log('  - Nada do lado PERMITIDO das regras para membros (gestor-only, convite,');
    console.log('    membership): tudo isso exige credencial de membro, pelo mesmo motivo.');
    console.log('  - A regra que o Console MOSTRA. Nao existe comando na CLI do Firebase para ler');
    console.log('    a regra publicada; o que se mede aqui e o COMPORTAMENTO, que e o que vale.');
    console.log('------------------------------------------------------------');
  } finally {
    /* A conta anonima e a UNICA coisa que este diagnostico cria em producao. Sem apagar, cada
       execucao deixa um usuario novo no Firebase Auth para sempre, e o cabecalho que diz "nao
       escreve nada" fica torto (revisao de 09/10/2026). Apagar e barato: o proprio uid se
       apaga. Se falhar, DIZ o uid -- sumir com a falha deixaria lixo invisivel acumulando. */
    const u = auth.currentUser;
    if (u) {
      try {
        await comTeto(deleteUser(u), 'apagar a conta anonima');
        console.log('\n(limpeza) a conta anonima ' + u.uid + ' usada nas sondas foi apagada.');
      } catch (e) {
        console.log('\n(limpeza) NAO consegui apagar a conta anonima ' + u.uid + ': '
          + ((e && e.code) || '?') + ' - ' + (e && e.message));
        console.log('  Ela ficou no Firebase Auth do projeto. Apague no Console (Authentication');
        console.log('  -> Users) se incomodar; ela nao tem membership, entao nao le dado nenhum.');
      }
    }
    try { await terminate(db); } catch (e) { console.log('aviso ao encerrar o Firestore: ' + ((e && e.code) || '?') + ' - ' + (e && e.message)); }
    try { await deleteApp(app); } catch (e) { console.log('aviso ao encerrar o app: ' + ((e && e.code) || '?') + ' - ' + (e && e.message)); }
  }
})().then(() => {
  /* O SDK do Firestore deixa recursos de rede vivos; sem isto o processo fica pendurado
     depois de o diagnostico ter terminado de imprimir. */
  process.exit(0);
}).catch((e) => {
  console.error('\nO diagnostico quebrou: ' + ((e && e.code) || '?') + ' - ' + (e && e.message));
  console.error(e && e.stack);
  console.error('\nIsto NAO e um veredito sobre as regras: e o proprio diagnostico que nao');
  console.error('chegou ao fim. Nada pode ser concluido daqui.');
  process.exit(1);
});
