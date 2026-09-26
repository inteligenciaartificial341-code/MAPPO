# Testes anti-regressão do MAPPO

Esta pasta é a **rede que pega o defeito antes do usuário**. Ela existe por um motivo
concreto: em 24/09/2026 três defeitos apareceram juntos em funcionalidades que já
funcionavam, e não havia como perceber. Não foi um bug — foi a ausência de rede.

> **Regra do projeto:** todo defeito relatado **vira teste antes de virar correção**.
> O teste falha primeiro (provando que reproduz o defeito), depois passa. Sem isso,
> "corrigido" é opinião. Está escrito em `CLAUDE.md`.

---

## Instalação (uma vez por computador)

```bash
npm install                        # instala o Playwright na versão fixada
npx playwright install chromium    # baixa o navegador dessa versão
```

A versão do Playwright está travada em `package.json`, e é ela que fixa a versão do
navegador. Se o Chromium não estiver instalado, o runner avisa e diz o comando exato.

## Rodar tudo

```bash
npm test
```

Roda em **série** (uma suíte por vez), imprime o resultado de cada arquivo e termina com
a contagem:

```
25/25 suites passaram (em 4.6 min)
6 diagnostico(s) executado(s) -- medem, nao reprovam
```

Sai com **código 0** se todas as suítes passarem e **código 1** se qualquer uma falhar —
é esse código que o GitHub Actions lê para marcar o commit.

Por que em série e não em paralelo: cada suíte sobe um Chromium e um servidor HTTP. Em
paralelo, num runner gratuito de 2 vCPUs, elas competem por CPU e os `setTimeout` dos
próprios testes começam a estourar. Falha intermitente é pior que teste lento, porque
ensina a ignorar o vermelho.

## Rodar uma só

Pelo runner, filtrando por parte do nome (aceita vários filtros):

```bash
node testes/executar.js link          # todos cujo nome contém "link"
node testes/executar.js pdfos osfotos
```

Ou direto, quando você quer ver a saída inteira sem o runner no meio:

```bash
node testes/teste-link.js
```

## Ver a classificação sem executar nada

```bash
npm run test:lista
```

Mostra o que o runner considera **suíte** e o que considera **diagnóstico**, e quais
ficam fora por baterem em produção. Útil depois de escrever uma suíte nova, para
confirmar que ela foi reconhecida como suíte.

---

## Suítes e diagnósticos — a diferença que o runner usa

|  | Suíte | Diagnóstico |
|---|---|---|
| Contém `TODOS OS CHECKS … PASSARAM` | sim | não |
| Reprova a execução | **sim** | **nunca** |
| Para que serve | provar que o comportamento certo continua certo | medir, investigar, reproduzir |

O runner decide assim:

- **O intento vem do arquivo.** Se o texto do arquivo contém o veredito
  `TODOS OS CHECKS … PASSARAM`, é uma suíte. Se não contém, é um diagnóstico.
- **O resultado vem da saída.** Uma suíte só passa se a execução **imprimir** o veredito
  e sair com código 0.

Duas consequências boas: uma suíte nova **entra sozinha**, sem ninguém lembrar de
cadastrá-la numa lista; e uma suíte que parou de imprimir o veredito aparece como
**falha**, que é o comportamento certo.

⚠️ **Uma armadilha para saber:** se alguém **apagar** a linha do veredito do código de uma
suíte, ela deixa de ser suíte e passa a ser contada como diagnóstico — ou seja, para de
reprovar em silêncio. A defesa é olhar a contagem: `npm test` diz quantas suítes rodaram.
Se o número cair sem que ninguém tenha apagado um arquivo, foi isso.

Hoje são **25 suítes** e **9 diagnósticos**.

## Os três que não rodam sozinhos

`diag-difer`, `diag-linkreal` e `diag-pubreal` batem no **site publicado** (`github.io`)
e no **Firestore real**. Dependem de rede, de produção e do estado da conta do
proprietário — então não rodam no `npm test` nem no CI. Só à mão, quando o dono pedir:

```bash
npm run test:producao
```

---

## O "controle": provar que o teste pega o defeito

Um teste que passa não prova nada por si só — pode estar passando porque não olha para o
lugar certo. A prova é rodá-lo contra a **versão anterior** do `index.html` e ver que ele
**falha** lá.

Todos os arquivos que servem o app localmente leem a variável `MAPPO_RAIZ`: é a pasta de
onde o `index.html` é servido. O runner a aponta para o próprio repositório, mas se você
já a definiu, ela é respeitada.

```bash
# 1. põe a versão anterior numa pasta à parte
git worktree add /tmp/mappo-antes <commit-anterior>

# 2. roda a suíte contra ela: tem que FALHAR
MAPPO_RAIZ=/tmp/mappo-antes node testes/teste-fotosobra.js

# 3. roda contra o código de hoje: tem que PASSAR
node testes/teste-fotosobra.js
```

No PowerShell, o passo 2 é:

```powershell
$env:MAPPO_RAIZ='C:/caminho/para/mappo-antes'; node testes/teste-fotosobra.js
```

Falhou antes e passou depois: o teste pega o defeito. É isso que transforma "corrigido"
de opinião em fato.

---

## Escrever uma suíte nova

O padrão é **um script Node auto-contido** — sem framework, sem `describe`/`it`. Ele sobe
um servidor HTTP na pasta do app, abre o `index.html` no Chromium, mexe no estado como o
app mexeria, e afirma o que tem que ser verdade. Copie o esqueleto:

```js
/* Uma linha dizendo QUAL defeito este teste impede de voltar, e por quê. */
const { chromium } = require('playwright');
const path = require('path'), http = require('http'), fs = require('fs');
const RAIZ = process.env.MAPPO_RAIZ || 'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c, m) { if (!c) throw new Error('FALHOU: ' + m); console.log('  ok - ' + m); }

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

  const r = await pg.evaluate(() => {
    // monta o caso dentro da página, chamando as funções reais do app
    return { /* o que você precisa medir */ };
  });

  assert(/* condição */ true, 'descrição do que tem que ser verdade');

  assert(erros.length === 0, 'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e => { console.error('\n' + e.message); process.exit(1); });
```

O que não pode faltar:

1. **`MAPPO_RAIZ` com fallback**, exatamente como acima — é o que faz o teste rodar no CI
   e permite o controle contra a versão anterior.
2. **`console.log('\nTODOS OS CHECKS PASSARAM.')` no fim.** Sem essa linha o arquivo é um
   diagnóstico e nunca vai reprovar nada.
3. **`.catch(...)` com `process.exit(1)`.** Sem ele, uma falha pode terminar com código 0
   e o runner considera que passou.
4. **Fechar o navegador e o servidor** (`b.close()`, `srv.close()`), senão o processo não
   termina e a suíte estoura o timeout de 5 minutos.
5. **Um comentário no topo dizendo qual defeito isso impede de voltar.** Daqui a seis
   meses é a única coisa que explica por que o teste existe.

Nomes: `teste-*.js` para suíte, `diag-*.js` para diagnóstico. O runner não usa o nome para
classificar — usa o veredito — mas a convenção ajuda quem lê.

Nada mais é preciso: salve na pasta e `npm test` já a inclui.

---

## O que os testes não cobrem

Navegador automatizado não alcança Google Agenda, notificação real, WhatsApp e câmera de
celular. Isso está em [VERIFICACAO-MANUAL.md](VERIFICACAO-MANUAL.md), que é uma lista curta
para conferir à mão antes de publicar.
