/* Runner das suites anti-regressao do MAPPO.
 *
 * Descobre sozinho os arquivos de teste em testes/, separa SUITES de DIAGNOSTICOS,
 * roda em serie com timeout, imprime a contagem em portugues e sai com codigo 1
 * se alguma SUITE falhar.
 *
 * Como classifica (e por que assim):
 *   - SUITE       = o nome comeca com "teste-", OU o arquivo contem o veredito
 *                   "TODOS OS CHECKS ... PASSARAM". Passa somente se a execucao
 *                   IMPRIMIR esse veredito e sair com codigo 0.
 *   - DIAGNOSTICO = o resto (por convencao, "diag-*" e "controle-*"). So mede.
 *                   Nunca reprova a execucao.
 *
 * A regra do nome existe para fechar um buraco: antes, apagar a linha do veredito
 * rebaixava a suite a diagnostico em silencio -- ela continuava rodando, continuava
 * lancando erro, e o runner dizia "nao reprova" e saia 0. Agora "teste-* e suite,
 * sempre": um teste-*.js que nao imprime o veredito e ERRO, nomeado na saida. E o
 * veredito continua promovendo qualquer arquivo a suite, entao nada que reprovava
 * antes deixou de reprovar.
 *
 * Uso:
 *   node testes/executar.js                     roda tudo menos os que batem em producao
 *   node testes/executar.js --lista              mostra a classificacao sem executar nada
 *   node testes/executar.js --com-producao       inclui os 3 que batem no site publicado
 *   node testes/executar.js --mostrar-diagnosticos  imprime a medicao dos diagnosticos
 *   node testes/executar.js link pdfos           roda so os arquivos cujo nome casa
 *
 * Ganchos para o auto-teste (testes/teste-runner.js), nao para uso normal:
 *   MAPPO_PASTA_TESTES     pasta onde procurar os arquivos (padrao: esta pasta)
 *   MAPPO_TESTE_TIMEOUT_MS timeout por arquivo em ms (padrao: 5 min)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PASTA = process.env.MAPPO_PASTA_TESTES
  ? path.resolve(process.env.MAPPO_PASTA_TESTES)
  : __dirname;
const RAIZ = path.resolve(__dirname, '..');
const VEREDITO = /TODOS OS CHECKS[^\n]*PASSARAM/;

const TIMEOUT_PADRAO_MS = 5 * 60 * 1000;
const TIMEOUT_MS = Number(process.env.MAPPO_TESTE_TIMEOUT_MS) > 0
  ? Number(process.env.MAPPO_TESTE_TIMEOUT_MS)
  : TIMEOUT_PADRAO_MS;

/* Quanto tempo esperar pelo 'close' depois de matar um filho. Se ele sobreviveu ao
 * kill, 'close' nunca chega e a promise nunca resolveria: o runner ficaria pendurado
 * ate o job do CI morrer, sem relatorio nenhum. */
const GRACA_POS_KILL_MS = 5000;

/* Teto do que se guarda da saida de cada arquivo. Uma suite verbosa (ou em loop)
 * pode imprimir sem limite; o relatorio so usa as ultimas linhas. */
const MAX_SAIDA = 200000;

/* Batem no site publicado (github.io) e no Firestore real: dependem de rede, de
 * producao e do estado da conta do proprietario. Ficam FORA da execucao normal e
 * fora do CI. Rodam so a mao, com --com-producao, quando o dono pedir. */
const FORA_DO_CI = ['diag-difer.js', 'diag-linkreal.js', 'diag-pubreal.js'];

const IGNORAR = ['executar.js'];

const FLAGS_CONHECIDAS = ['--lista', '--com-producao', '--mostrar-diagnosticos', '--ajuda'];

/* ---------- argumentos ---------- */

const args = process.argv.slice(2);
const flagsDadas = args.filter((a) => a.startsWith('-'));
const filtros = args.filter((a) => !a.startsWith('-'));

const flagsRuins = flagsDadas.filter((f) => !FLAGS_CONHECIDAS.includes(f));
const soListar = flagsDadas.includes('--lista');
const comProducao = flagsDadas.includes('--com-producao');
const mostrarDiagnosticos = flagsDadas.includes('--mostrar-diagnosticos');
const pediuAjuda = flagsDadas.includes('--ajuda');

function linha() {
  console.log('-'.repeat(72));
}

function ajuda() {
  console.log('\nUso: node testes/executar.js [flags] [filtros]\n');
  console.log('  --lista                  classifica os arquivos e nao executa nada');
  console.log('  --com-producao           inclui os que batem no site publicado e no Firestore real');
  console.log('  --mostrar-diagnosticos   imprime a saida dos diagnosticos (eles so medem)');
  console.log('  --ajuda                  esta mensagem');
  console.log('\nFiltros sao pedacos de nome: "node testes/executar.js link pdfos".\n');
}

/* ---------- preflight ---------- */

function conferirNavegador() {
  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    console.error('\nO pacote "playwright" nao esta instalado.');
    console.error('Rode:  npm install');
    console.error('Detalhe: ' + e.code + ' - ' + e.message);
    return false;
  }
  let executavel;
  try {
    executavel = playwright.chromium.executablePath();
  } catch (e) {
    console.error('\nNao foi possivel descobrir o Chromium do Playwright.');
    console.error('Rode:  npx playwright install chromium');
    console.error('Detalhe: ' + e.code + ' - ' + e.message);
    return false;
  }
  if (!fs.existsSync(executavel)) {
    console.error('\nO Chromium do Playwright nao esta instalado neste computador.');
    console.error('Rode:  npx playwright install chromium');
    console.error('Esperado em: ' + executavel);
    return false;
  }
  return true;
}

/* A raiz sob teste e a pasta de onde o index.html e servido. Se ela estiver errada
 * -- o caso tipico e MAPPO_RAIZ apontando para um worktree que nao existe mais --
 * cada suite falharia por 404, e seriam 31 falhas para explicar uma pasta errada. */
function conferirRaiz() {
  const raiz = process.env.MAPPO_RAIZ || RAIZ;
  const alvo = path.join(raiz, 'index.html');
  if (fs.existsSync(alvo)) return true;
  console.error('\nA raiz sob teste nao tem index.html.');
  console.error('Raiz: ' + raiz);
  console.error('Esperado: ' + alvo);
  if (process.env.MAPPO_RAIZ) {
    console.error('\nEla veio de MAPPO_RAIZ. Confira o caminho, ou limpe a variavel para');
    console.error('usar o proprio repositorio.');
  }
  return false;
}

/* ---------- descoberta e classificacao ---------- */

function descobrir() {
  let nomes;
  try {
    nomes = fs.readdirSync(PASTA);
  } catch (e) {
    console.error('\nNao foi possivel ler a pasta de testes: ' + PASTA);
    console.error('Detalhe: ' + e.code + ' - ' + e.message);
    return null;
  }

  return nomes
    .filter((n) => n.endsWith('.js'))
    .filter((n) => !IGNORAR.includes(n))
    .sort()
    .map((nome) => {
      let fonte = '';
      try {
        fonte = fs.readFileSync(path.join(PASTA, nome), 'utf8');
      } catch (e) {
        console.error('aviso: nao foi possivel ler ' + nome + ': ' + e.code + ' - ' + e.message);
      }
      // "teste-*" e sempre suite; o veredito no texto promove qualquer outro a suite
      const tipo = /^teste-/.test(nome) || VEREDITO.test(fonte) ? 'suite' : 'diagnostico';
      return { nome, tipo, producao: FORA_DO_CI.includes(nome) };
    });
}

function selecionar(todos) {
  let sel = todos;
  if (!comProducao) sel = sel.filter((a) => !a.producao);
  if (filtros.length) sel = sel.filter((a) => filtros.some((f) => a.nome.includes(f)));
  return sel;
}

/* ---------- acumulador de saida com teto ---------- */

function criarAcumulador(max) {
  const metade = Math.floor(max / 2);
  let inicio = '';
  let fim = '';
  let descartado = 0;
  return {
    add(t) {
      if (inicio.length < metade) {
        const cabe = metade - inicio.length;
        inicio += t.slice(0, cabe);
        t = t.slice(cabe);
        if (!t) return;
      }
      fim += t;
      if (fim.length > metade) {
        const excesso = fim.length - metade;
        fim = fim.slice(excesso);
        descartado += excesso;
      }
    },
    texto() {
      if (!descartado) return inicio + fim;
      return inicio + '\n... [' + descartado + ' caracteres do meio descartados pelo runner] ...\n' + fim;
    },
  };
}

/* ---------- execucao de um arquivo ---------- */

function matarArvore(filho) {
  if (process.platform === 'win32') {
    // o teste sobe um Chromium; matar so o node deixaria o navegador orfao
    const tk = spawn('taskkill', ['/pid', String(filho.pid), '/T', '/F'], { stdio: 'ignore' });
    // sem este listener, um taskkill ausente ou falhando emite 'error' sem ouvinte
    // e derruba o runner inteiro, fora de qualquer cadeia de promises
    tk.on('error', (e) => {
      console.error('   aviso: taskkill falhou (' + e.code + ' - ' + e.message + '); matando so o node');
      filho.kill('SIGKILL');
    });
    return;
  }
  try {
    process.kill(-filho.pid, 'SIGKILL');
  } catch (e) {
    console.error('   aviso ao encerrar o grupo de processos: ' + e.code + ' - ' + e.message);
    filho.kill('SIGKILL');
  }
}

function rodar(nome) {
  return new Promise((resolve) => {
    const inicio = Date.now();
    const acc = criarAcumulador(MAX_SAIDA);
    let resolvido = false;
    let estourou = false;
    let relogioGraca = null;

    const terminar = (codigo) => {
      if (resolvido) return;
      resolvido = true;
      clearTimeout(relogio);
      if (relogioGraca) clearTimeout(relogioGraca);
      resolve({
        saida: acc.texto(),
        codigo,
        estourou,
        segundos: (Date.now() - inicio) / 1000,
      });
    };

    const filho = spawn(process.execPath, [path.join(PASTA, nome)], {
      cwd: RAIZ,
      env: {
        ...process.env,
        // Se quem chamou ja definiu MAPPO_RAIZ (o "controle", contra uma versao
        // anterior do index.html), respeita. Senao, o proprio repositorio.
        MAPPO_RAIZ: process.env.MAPPO_RAIZ || RAIZ,
        // o filho nao herda os ganchos do runner, senao um auto-teste se aninharia
        MAPPO_PASTA_TESTES: '',
        MAPPO_TESTE_TIMEOUT_MS: '',
      },
      detached: process.platform !== 'win32',
    });

    // sem setEncoding, cada chunk e convertido isolado e um caractere UTF-8 partido
    // na fronteira vira mojibake -- justamente nas mensagens em portugues do relatorio
    filho.stdout.setEncoding('utf8');
    filho.stderr.setEncoding('utf8');
    filho.stdout.on('data', (t) => acc.add(t));
    filho.stderr.on('data', (t) => acc.add(t));

    const relogio = setTimeout(() => {
      estourou = true;
      matarArvore(filho);
      // rede de seguranca: se o filho sobreviveu ao kill, 'close' nunca chega
      relogioGraca = setTimeout(() => {
        acc.add('\n[o processo nao terminou depois do kill; o runner seguiu em frente]\n');
        try {
          filho.stdout.destroy();
          filho.stderr.destroy();
          filho.unref();
        } catch (e) {
          console.error('   aviso ao soltar o processo: ' + e.code + ' - ' + e.message);
        }
        terminar(1);
      }, GRACA_POS_KILL_MS);
    }, TIMEOUT_MS);

    filho.on('error', (e) => {
      acc.add('\nfalha ao iniciar o processo: ' + e.code + ' - ' + e.message);
      terminar(1);
    });

    filho.on('close', (codigo) => terminar(codigo === null ? 1 : codigo));
  });
}

function ultimasLinhas(texto, quantas) {
  return texto
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.length)
    .slice(-quantas)
    .map((l) => '      | ' + l)
    .join('\n');
}

function blocoSaida(texto, quantas) {
  const trecho = ultimasLinhas(texto, quantas);
  return trecho || '      | (nao imprimiu nada)';
}

/* ---------- principal ---------- */

async function principal() {
  if (pediuAjuda) {
    ajuda();
    return 0;
  }

  if (flagsRuins.length) {
    console.error('\nFlag desconhecida: ' + flagsRuins.join(', '));
    console.error('Conhecidas: ' + FLAGS_CONHECIDAS.join(', '));
    console.error('(nada foi executado -- uma flag digitada errada nao pode virar');
    console.error(' uma execucao que finge ter obedecido)');
    return 1;
  }

  const todos = descobrir();
  if (todos === null) return 1;

  const selecionados = selecionar(todos);
  const suites = todos.filter((a) => a.tipo === 'suite');
  const diagnosticos = todos.filter((a) => a.tipo === 'diagnostico');

  if (soListar) {
    console.log('\nClassificacao dos arquivos em ' + PASTA + ' (nada foi executado)\n');
    linha();
    console.log('SUITES (' + suites.length + ') -- reprovam de verdade:');
    suites.forEach((a) => console.log('  ' + a.nome + (a.producao ? '   [fora do CI: producao]' : '')));
    console.log('\nDIAGNOSTICOS (' + diagnosticos.length + ') -- so medem, nunca reprovam:');
    diagnosticos.forEach((a) => console.log('  ' + a.nome + (a.producao ? '   [fora do CI: producao]' : '')));
    linha();
    console.log('Total: ' + todos.length + ' arquivos.');
    console.log('Fora da execucao normal (batem em producao): ' + FORA_DO_CI.join(', '));
    console.log('Seriam executados agora: ' + selecionados.length + ' arquivo(s).');
    return 0;
  }

  const suitesSelecionadas = selecionados.filter((a) => a.tipo === 'suite');

  /* Zero suites e SEMPRE erro. Sem isto, um filtro digitado errado -- ou um que so
   * casa com diagnosticos -- imprimiria "0/0 suites passaram" e sairia verde: a
   * rede diria "tudo bem" sem ter verificado absolutamente nada. */
  if (!suitesSelecionadas.length) {
    if (filtros.length) {
      console.error('\nNenhuma SUITE casou com o filtro: ' + filtros.join(', '));
      const quaisquer = selecionados.map((a) => a.nome);
      if (quaisquer.length) {
        console.error('Casaram, mas sao diagnosticos (nao reprovam): ' + quaisquer.join(', '));
      }
      console.error('Veja os nomes com:  npm run test:lista');
    } else {
      console.error('\nNenhuma suite encontrada em ' + PASTA + '.');
    }
    console.error('\nSair com sucesso aqui seria dizer "tudo bem" sem ter testado nada.');
    return 1;
  }

  if (!conferirRaiz()) return 1;
  if (!conferirNavegador()) return 1;

  console.log('\nSuites anti-regressao do MAPPO');
  console.log('Raiz sob teste: ' + (process.env.MAPPO_RAIZ || RAIZ));
  console.log(
    'A executar: ' +
      selecionados.length +
      ' arquivo(s) -- ' +
      suitesSelecionadas.length +
      ' suite(s) e ' +
      selecionados.filter((a) => a.tipo === 'diagnostico').length +
      ' diagnostico(s), em serie.'
  );
  if (!comProducao) {
    console.log('Fora desta execucao (batem em producao): ' + FORA_DO_CI.join(', '));
  }
  if (TIMEOUT_MS !== TIMEOUT_PADRAO_MS) {
    console.log('Timeout por arquivo: ' + TIMEOUT_MS + ' ms (via MAPPO_TESTE_TIMEOUT_MS)');
  }
  linha();

  const passaram = [];
  const falharam = [];
  const medidos = [];
  const inicioTudo = Date.now();

  for (let i = 0; i < selecionados.length; i++) {
    const alvo = selecionados[i];
    const rotulo = '[' + (i + 1) + '/' + selecionados.length + '] ' + alvo.nome;
    process.stdout.write(rotulo.padEnd(46, ' '));

    const r = await rodar(alvo.nome);
    const tempo = r.segundos.toFixed(1) + 's';

    if (alvo.tipo === 'diagnostico') {
      // diagnostico so mede: nunca reprova a execucao, nem quando quebra
      const problema = r.estourou || r.codigo !== 0;
      medidos.push(alvo.nome);
      let nota = 'diagnostico (medido)';
      if (r.estourou) nota = 'diagnostico (abortado por tempo)';
      else if (r.codigo !== 0) nota = 'diagnostico (terminou com erro, nao reprova)';
      console.log(nota + '  ' + tempo);
      /* A medicao e a unica razao de um diagnostico existir: descartar a saida dele
       * fazia de "npm run test:producao" um comando decorativo. */
      if (mostrarDiagnosticos || problema) {
        console.log(blocoSaida(r.saida, mostrarDiagnosticos ? 40 : 15));
        console.log('');
      }
      continue;
    }

    const temVeredito = VEREDITO.test(r.saida);
    if (!r.estourou && r.codigo === 0 && temVeredito) {
      passaram.push(alvo.nome);
      console.log('PASSOU  ' + tempo);
      continue;
    }

    let motivo;
    if (r.estourou) {
      motivo = 'passou de ' + Math.round(TIMEOUT_MS / 1000) + 's e foi abortada';
    } else if (!temVeredito && r.codigo === 0) {
      motivo = 'nao imprimiu o veredito -- ou virou diagnostico por engano, ou quebrou antes do fim';
    } else if (!temVeredito) {
      motivo = 'saiu com codigo ' + r.codigo + ' e sem o veredito';
    } else {
      motivo = 'imprimiu o veredito mas saiu com codigo ' + r.codigo;
    }

    falharam.push({ nome: alvo.nome, motivo, saida: r.saida });
    console.log('FALHOU  ' + tempo + '  (' + motivo + ')');
  }

  const totalSuites = passaram.length + falharam.length;
  const minutos = ((Date.now() - inicioTudo) / 60000).toFixed(1);

  if (falharam.length) {
    linha();
    console.log('O que falhou:\n');
    falharam.forEach((f) => {
      console.log('  ' + f.nome + ' -- ' + f.motivo);
      console.log(blocoSaida(f.saida, 15));
      console.log('');
    });
  }

  linha();
  console.log(passaram.length + '/' + totalSuites + ' suites passaram (em ' + minutos + ' min)');
  if (medidos.length) {
    console.log(medidos.length + ' diagnostico(s) executado(s) -- medem, nao reprovam');
  }
  if (falharam.length) {
    console.log(falharam.length + ' suite(s) falharam: ' + falharam.map((f) => f.nome).join(', '));
    linha();
    return 1;
  }
  linha();
  return 0;
}

principal()
  .then((codigo) => {
    // exitCode em vez de process.exit(): com stdout num pipe (o caso do CI),
    // process.exit pode truncar escritas pendentes -- e o relatorio de falha,
    // que e o ultimo a ser escrito, e o primeiro a se perder
    process.exitCode = codigo;
  })
  .catch((e) => {
    console.error('\nO runner quebrou: ' + e.code + ' - ' + e.message);
    console.error(e.stack);
    process.exitCode = 1;
  });
