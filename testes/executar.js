/* Runner das suites anti-regressao do MAPPO.
 *
 * Descobre sozinho os arquivos de teste em testes/, separa SUITES de DIAGNOSTICOS,
 * roda em serie com timeout, imprime a contagem em portugues e sai com codigo 1
 * se alguma SUITE falhar.
 *
 * Como classifica (e por que assim):
 *   - SUITE       = o arquivo contem o veredito "TODOS OS CHECKS ... PASSARAM".
 *                   Passa somente se a execucao IMPRIMIR esse veredito e sair com codigo 0.
 *   - DIAGNOSTICO = o arquivo nao tem veredito: so mede. Nunca reprova a execucao.
 *
 * O intento vem do arquivo, o resultado vem da saida. Assim uma suite nova entra
 * sozinha (basta imprimir o veredito) e uma suite que PAROU de imprimir o veredito
 * aparece como falha, que e o comportamento certo.
 *
 * Uso:
 *   node testes/executar.js                 roda tudo menos os que batem em producao
 *   node testes/executar.js --lista         mostra a classificacao sem executar nada
 *   node testes/executar.js --com-producao  inclui os 3 que batem no site publicado
 *   node testes/executar.js link pdfos      roda so os arquivos cujo nome casa
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PASTA = __dirname;
const RAIZ = path.resolve(PASTA, '..');
const VEREDITO = /TODOS OS CHECKS[^\n]*PASSARAM/;
const TIMEOUT_MS = 5 * 60 * 1000;

/* Batem no site publicado (github.io) e no Firestore real: dependem de rede, de
 * producao e do estado da conta do proprietario. Ficam FORA da execucao normal e
 * fora do CI. Rodam so a mao, com --com-producao, quando o dono pedir. */
const FORA_DO_CI = ['diag-difer.js', 'diag-linkreal.js', 'diag-pubreal.js'];

const IGNORAR = ['executar.js'];

const args = process.argv.slice(2);
const soListar = args.includes('--lista');
const comProducao = args.includes('--com-producao');
const filtros = args.filter((a) => !a.startsWith('--'));

function linha() {
  console.log('-'.repeat(72));
}

/* ---------- preflight: sem navegador nao ha teste ---------- */

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

/* ---------- descoberta e classificacao ---------- */

function descobrir() {
  const arquivos = fs
    .readdirSync(PASTA)
    .filter((n) => n.endsWith('.js'))
    .filter((n) => !IGNORAR.includes(n))
    .sort();

  return arquivos.map((nome) => {
    const fonte = fs.readFileSync(path.join(PASTA, nome), 'utf8');
    return {
      nome,
      tipo: VEREDITO.test(fonte) ? 'suite' : 'diagnostico',
      producao: FORA_DO_CI.includes(nome),
    };
  });
}

function selecionar(todos) {
  let sel = todos;
  if (!comProducao) sel = sel.filter((a) => !a.producao);
  if (filtros.length) {
    sel = sel.filter((a) => filtros.some((f) => a.nome.includes(f)));
  }
  return sel;
}

/* ---------- execucao de um arquivo ---------- */

function matarArvore(filho) {
  if (process.platform === 'win32') {
    // o teste sobe um Chromium; matar so o node deixaria o navegador orfao
    spawn('taskkill', ['/pid', String(filho.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  try {
    process.kill(-filho.pid, 'SIGKILL');
  } catch (e) {
    console.error('   aviso ao encerrar o processo: ' + e.code + ' - ' + e.message);
    filho.kill('SIGKILL');
  }
}

function rodar(nome) {
  return new Promise((resolve) => {
    const inicio = Date.now();
    const filho = spawn(process.execPath, [path.join(PASTA, nome)], {
      cwd: RAIZ,
      env: {
        ...process.env,
        // 20 dos 34 arquivos travam a raiz num caminho absoluto do computador do
        // proprietario; todos aceitam MAPPO_RAIZ. Apontar para o repositorio atual
        // e o que faz o teste rodar em qualquer clone e no CI. Se quem chamou ja
        // definiu MAPPO_RAIZ (o "controle", contra uma versao anterior), respeita.
        MAPPO_RAIZ: process.env.MAPPO_RAIZ || RAIZ.replace(/\\/g, '/'),
      },
      detached: process.platform !== 'win32',
    });

    let saida = '';
    const acumular = (b) => {
      saida += b.toString();
    };
    filho.stdout.on('data', acumular);
    filho.stderr.on('data', acumular);

    let estourou = false;
    const relogio = setTimeout(() => {
      estourou = true;
      matarArvore(filho);
    }, TIMEOUT_MS);

    filho.on('error', (e) => {
      clearTimeout(relogio);
      resolve({
        saida: saida + '\nfalha ao iniciar o processo: ' + e.code + ' - ' + e.message,
        codigo: 1,
        estourou: false,
        segundos: (Date.now() - inicio) / 1000,
      });
    });

    filho.on('close', (codigo) => {
      clearTimeout(relogio);
      resolve({
        saida,
        codigo: codigo === null ? 1 : codigo,
        estourou,
        segundos: (Date.now() - inicio) / 1000,
      });
    });
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

/* ---------- principal ---------- */

async function principal() {
  const todos = descobrir();
  const selecionados = selecionar(todos);

  const suites = todos.filter((a) => a.tipo === 'suite');
  const diagnosticos = todos.filter((a) => a.tipo === 'diagnostico');

  if (soListar) {
    console.log('\nClassificacao dos arquivos em testes/ (nada foi executado)\n');
    linha();
    console.log('SUITES (' + suites.length + ') -- imprimem o veredito e reprovam de verdade:');
    suites.forEach((a) => console.log('  ' + a.nome + (a.producao ? '   [fora do CI: producao]' : '')));
    console.log('\nDIAGNOSTICOS (' + diagnosticos.length + ') -- so medem, nunca reprovam:');
    diagnosticos.forEach((a) => console.log('  ' + a.nome + (a.producao ? '   [fora do CI: producao]' : '')));
    linha();
    console.log('Total: ' + todos.length + ' arquivos.');
    console.log('Fora da execucao normal (batem em producao): ' + FORA_DO_CI.join(', '));
    console.log('Seriam executados agora: ' + selecionados.length + ' arquivo(s).');
    return 0;
  }

  if (!conferirNavegador()) return 1;

  if (!selecionados.length) {
    console.error('\nNenhum arquivo casou com o filtro: ' + filtros.join(', '));
    return 1;
  }

  console.log('\nSuites anti-regressao do MAPPO');
  console.log('Raiz sob teste: ' + (process.env.MAPPO_RAIZ || RAIZ.replace(/\\/g, '/')));
  console.log(
    'A executar: ' +
      selecionados.length +
      ' arquivo(s) -- ' +
      selecionados.filter((a) => a.tipo === 'suite').length +
      ' suite(s) e ' +
      selecionados.filter((a) => a.tipo === 'diagnostico').length +
      ' diagnostico(s), em serie.'
  );
  if (!comProducao) {
    console.log('Fora desta execucao (batem em producao): ' + FORA_DO_CI.join(', '));
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
      medidos.push(alvo.nome);
      let nota = 'diagnostico (medido)';
      if (r.estourou) nota = 'diagnostico (abortado por tempo)';
      else if (r.codigo !== 0) nota = 'diagnostico (terminou com erro, nao reprova)';
      console.log(nota + '  ' + tempo);
      continue;
    }

    const temVeredito = VEREDITO.test(r.saida);
    if (!r.estourou && r.codigo === 0 && temVeredito) {
      passaram.push(alvo.nome);
      console.log('PASSOU  ' + tempo);
      continue;
    }

    let motivo;
    if (r.estourou) motivo = 'passou de ' + TIMEOUT_MS / 60000 + ' min e foi abortada';
    else if (!temVeredito && r.codigo === 0) motivo = 'terminou sem imprimir o veredito';
    else motivo = 'saiu com codigo ' + r.codigo;

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
      const trecho = ultimasLinhas(f.saida, 15);
      if (trecho) console.log(trecho);
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
  .then((codigo) => process.exit(codigo))
  .catch((e) => {
    console.error('\nO runner quebrou: ' + e.code + ' - ' + e.message);
    console.error(e.stack);
    process.exit(1);
  });
