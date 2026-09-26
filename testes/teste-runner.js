/* Quem testa o testador?
 *
 * executar.js e o unico ponto do projeto que converte "uma suite falhou" em "o CI
 * fica vermelho". Se ele se enganar, TODAS as outras 25 suites ficam decorativas:
 * elas podem estar lancando erro e o commit passa verde. Nada no repositorio
 * exercitava esse caminho.
 *
 * Esta suite cria arquivos de mentira numa pasta temporaria e os roda PELO caminho
 * real de classificacao e execucao do runner, conferindo o veredito dele.
 *
 * Nao usa Playwright: nao abre navegador, nao serve o app. Por isso roda em segundos.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RUNNER = path.join(__dirname, 'executar.js');
const TIMEOUT_CURTO = '2500'; // injetado no runner para nao esperar os 5 min reais

function assert(c, m) {
  if (!c) throw new Error('FALHOU: ' + m);
  console.log('  ok - ' + m);
}

const raizTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mappo-runner-'));
let nPasta = 0;

/* cada cenario ganha sua propria pasta: assim um arquivo que trava nao entra na
   execucao dos outros cenarios */
function criarPasta(arquivos) {
  const p = path.join(raizTmp, 'cenario-' + ++nPasta);
  fs.mkdirSync(p);
  for (const [nome, corpo] of Object.entries(arquivos)) {
    fs.writeFileSync(path.join(p, nome), corpo, 'utf8');
  }
  return p;
}

const VEREDITO = "console.log('TODOS OS CHECKS PASSARAM.');";

const ARQ = {
  passa: VEREDITO,
  semVeredito: "console.log('medi alguma coisa e nao afirmei nada');",
  erroDepoisDoVeredito:
    VEREDITO + "\nconsole.error('MARCA-ERRO-APOS-VEREDITO');\nprocess.exit(1);",
  diagnostico: "console.log('MARCA-MEDICAO-DO-DIAGNOSTICO 42');",
  trava: 'setInterval(()=>{},1000);',
};

function rodarRunner(pasta, args, timeoutMs) {
  return new Promise((resolve) => {
    const filho = spawn(process.execPath, [RUNNER, ...args], {
      env: {
        ...process.env,
        MAPPO_PASTA_TESTES: pasta,
        MAPPO_TESTE_TIMEOUT_MS: timeoutMs || '',
      },
    });
    let saida = '';
    filho.stdout.setEncoding('utf8');
    filho.stderr.setEncoding('utf8');
    filho.stdout.on('data', (t) => (saida += t));
    filho.stderr.on('data', (t) => (saida += t));
    filho.on('error', (e) => resolve({ saida: saida + '\nerro: ' + e.code + ' ' + e.message, codigo: 1 }));
    filho.on('close', (c) => resolve({ saida, codigo: c === null ? 1 : c }));
  });
}

(async () => {
  console.log('=== CHECK 1: suite que imprime o veredito e sai 0 conta como aprovada ===');
  {
    const pasta = criarPasta({ 'teste-passa.js': ARQ.passa, 'diag-mede.js': ARQ.diagnostico });
    const r = await rodarRunner(pasta, []);
    assert(r.codigo === 0, 'o runner sai com codigo 0');
    assert(/1\/1 suites passaram/.test(r.saida), 'conta 1/1 suites passaram');
    assert(/1 diagnostico\(s\) executado/.test(r.saida), 'conta o diagnostico separado da suite');
  }

  console.log('\n=== CHECK 2: teste-*.js que sai 0 SEM o veredito reprova (o buraco fechado) ===');
  {
    const pasta = criarPasta({ 'teste-mudo.js': ARQ.semVeredito });
    const r = await rodarRunner(pasta, []);
    assert(r.codigo === 1, 'o runner sai com codigo 1 mesmo o arquivo tendo saido 0');
    assert(/nao imprimiu o veredito/.test(r.saida), 'diz que nao imprimiu o veredito');
    assert(/teste-mudo\.js/.test(r.saida), 'nomeia o arquivo culpado');
    assert(!/nao reprova/.test(r.saida), 'NAO foi tratado como diagnostico');
  }

  console.log('\n=== CHECK 3: sair 1 depois do veredito reprova, e a saida aparece ===');
  {
    const pasta = criarPasta({ 'teste-quebra.js': ARQ.erroDepoisDoVeredito });
    const r = await rodarRunner(pasta, []);
    assert(r.codigo === 1, 'o runner sai com codigo 1');
    assert(/teste-quebra\.js/.test(r.saida), 'nomeia a suite');
    assert(/MARCA-ERRO-APOS-VEREDITO/.test(r.saida), 'a saida da suite aparece no relatorio');
    assert(/0\/1 suites passaram/.test(r.saida), 'conta 0/1');
  }

  console.log('\n=== CHECK 4: filtro que nao casa com suite nenhuma reprova ===');
  {
    const pasta = criarPasta({ 'teste-passa.js': ARQ.passa, 'diag-mede.js': ARQ.diagnostico });

    const semNada = await rodarRunner(pasta, ['naoexisteesse']);
    assert(semNada.codigo === 1, 'filtro sem nenhum casamento sai com codigo 1');
    assert(/Nenhuma SUITE casou/.test(semNada.saida), 'explica que nenhuma suite casou');

    const soDiag = await rodarRunner(pasta, ['diag-mede']);
    assert(soDiag.codigo === 1, 'filtro que casa so com diagnostico tambem sai com codigo 1');
    assert(/sao diagnosticos/.test(soDiag.saida), 'avisa que o que casou e diagnostico');
    assert(!/0\/0 suites passaram/.test(soDiag.saida), 'nao imprime o falso verde "0/0 passaram"');
  }

  console.log('\n=== CHECK 5: --com-producao inclui os 3 que batem em producao ===');
  {
    const pasta = criarPasta({
      'teste-passa.js': ARQ.passa,
      'diag-difer.js': ARQ.diagnostico,
      'diag-linkreal.js': ARQ.diagnostico,
      'diag-pubreal.js': ARQ.diagnostico,
    });

    const padrao = await rodarRunner(pasta, []);
    assert(padrao.codigo === 0, 'execucao padrao passa');
    assert(/A executar: 1 arquivo\(s\)/.test(padrao.saida), 'por padrao roda 1 arquivo, nao 4');

    const comProd = await rodarRunner(pasta, ['--com-producao']);
    assert(comProd.codigo === 0, 'com --com-producao passa');
    assert(/A executar: 4 arquivo\(s\)/.test(comProd.saida), 'com --com-producao roda os 4');
  }

  console.log('\n=== CHECK 6: --mostrar-diagnosticos imprime a medicao (senao o comando e decorativo) ===');
  {
    const pasta = criarPasta({ 'teste-passa.js': ARQ.passa, 'diag-mede.js': ARQ.diagnostico });

    const calado = await rodarRunner(pasta, []);
    assert(!/MARCA-MEDICAO-DO-DIAGNOSTICO/.test(calado.saida), 'sem a flag, a medicao nao polui a saida');

    const falante = await rodarRunner(pasta, ['--mostrar-diagnosticos']);
    assert(falante.codigo === 0, 'com a flag continua passando');
    assert(/MARCA-MEDICAO-DO-DIAGNOSTICO 42/.test(falante.saida), 'com a flag, a medicao aparece');
  }

  console.log('\n=== CHECK 7: diagnostico que quebra mostra a saida e NAO reprova ===');
  {
    const pasta = criarPasta({
      'teste-passa.js': ARQ.passa,
      'diag-quebrado.js': "console.log('MARCA-DIAG-QUEBRADO');process.exit(1);",
    });
    const r = await rodarRunner(pasta, []);
    assert(r.codigo === 0, 'diagnostico com erro nao reprova a execucao');
    assert(/nao reprova/.test(r.saida), 'a saida diz que nao reprova');
    assert(/MARCA-DIAG-QUEBRADO/.test(r.saida), 'mas mostra o que ele imprimiu, senao o erro fica invisivel');
  }

  console.log('\n=== CHECK 8: suite que trava e abortada, contada como falha e nomeada ===');
  {
    const pasta = criarPasta({ 'teste-trava.js': ARQ.trava });
    const inicio = Date.now();
    const r = await rodarRunner(pasta, [], TIMEOUT_CURTO);
    const s = (Date.now() - inicio) / 1000;
    assert(r.codigo === 1, 'suite travada faz o runner sair com codigo 1');
    assert(/foi abortada/.test(r.saida), 'diz que foi abortada');
    assert(/teste-trava\.js/.test(r.saida), 'nomeia a suite travada');
    assert(s < 60, 'o timeout injetado funciona (levou ' + s.toFixed(1) + 's, nao os 5 min)');
  }

  console.log('\n=== CHECK 9: flag desconhecida nao roda nada ===');
  {
    const pasta = criarPasta({ 'teste-passa.js': ARQ.passa });
    const r = await rodarRunner(pasta, ['--comproducao']);
    assert(r.codigo === 1, 'flag desconhecida sai com codigo 1');
    assert(/Flag desconhecida/.test(r.saida), 'nomeia a flag');
    assert(!/suites passaram/.test(r.saida), 'e nao executa nada');
  }

  console.log('\n=== CHECK 10: pasta sem suite nenhuma reprova ===');
  {
    const pasta = criarPasta({ 'diag-mede.js': ARQ.diagnostico });
    const r = await rodarRunner(pasta, []);
    assert(r.codigo === 1, 'pasta so com diagnosticos sai com codigo 1');
    assert(/Nenhuma suite encontrada/.test(r.saida), 'explica que nao ha suite');
  }

  console.log('\n=== CHECK 11: --lista classifica sem executar ===');
  {
    const pasta = criarPasta({
      'teste-passa.js': ARQ.passa,
      'teste-mudo.js': ARQ.semVeredito,
      'diag-mede.js': ARQ.diagnostico,
      'controle-algo.js': ARQ.diagnostico,
    });
    const r = await rodarRunner(pasta, ['--lista']);
    assert(r.codigo === 0, '--lista sai com codigo 0');
    assert(/SUITES \(2\)/.test(r.saida), 'os dois teste-*.js contam como suite, mesmo o mudo');
    assert(/DIAGNOSTICOS \(2\)/.test(r.saida), 'diag-* e controle-* contam como diagnostico');
    assert(!/MARCA-MEDICAO/.test(r.saida), 'nada foi executado');
  }

  fs.rmSync(raizTmp, { recursive: true, force: true });

  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch((e) => {
  console.error('\n' + e.message);
  try {
    fs.rmSync(raizTmp, { recursive: true, force: true });
  } catch (limpeza) {
    console.error('aviso ao limpar ' + raizTmp + ': ' + limpeza.code + ' - ' + limpeza.message);
  }
  process.exit(1);
});
