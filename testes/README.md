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
npm run emulador:baixar            # baixa o Firestore Emulator (só a suíte de regras usa)
```

A versão do Playwright está travada em `package.json`, e é ela que fixa a versão do
navegador. Se o Chromium não estiver instalado, o runner avisa e diz o comando exato.

A terceira linha é só para a **suíte de regras do Firestore**, que roda contra o Emulator e
por isso também precisa de **Java 21**. Detalhes, e o que fazer quando o emulador não sobe:
[A suíte de regras do Firestore (Emulator)](#a-suíte-de-regras-do-firestore-emulator).

## Rodar tudo

```bash
npm test
```

Roda em **série** (uma suíte por vez), imprime o resultado de cada arquivo e termina com
a contagem — algo como:

```
26/26 suites passaram (em 4.3 min)
6 diagnostico(s) executado(s) -- medem, nao reprovam
```

(Os números acima são só ilustração de formato. Para saber quantas são **hoje**, rode
`npm run test:lista` — nenhum documento deste repositório guarda esse número, justamente
para não envelhecer.)

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
confirmar que ela foi reconhecida como suíte. **É também a resposta para "quantas são?"** —
o número vive aqui, não em documento.

## Todas as flags

| Flag | O que faz |
|---|---|
| `--lista` | classifica e não executa nada |
| `--com-producao` | inclui os que batem no site publicado e no Firestore real |
| `--mostrar-diagnosticos` | imprime a saída dos diagnósticos (a medição que eles existem para produzir) |
| `--ajuda` | resumo do uso |

Uma flag que o runner não conhece **não roda nada** e sai com erro nomeando a flag — um
`--producao` digitado no lugar de `--com-producao` não vai fingir que obedeceu.

Não existe flag para "rodar mesmo sem navegador" nem para "ignorar falha": se não há como
testar, o comando falha.

---

## Suítes e diagnósticos — a diferença que o runner usa

|  | Suíte | Diagnóstico |
|---|---|---|
| Nome | `teste-*.js` | `diag-*.js`, `controle-*.js` |
| Imprime `TODOS OS CHECKS … PASSARAM` | **obrigatório** | não |
| Reprova a execução | **sim** | **nunca** |
| Para que serve | provar que o comportamento certo continua certo | medir, investigar, reproduzir |

O runner decide assim:

- **O nome declara o papel.** `teste-*.js` é suíte, sempre. Qualquer outro nome é
  diagnóstico — a não ser que o arquivo contenha o veredito, que promove qualquer arquivo
  a suíte.
- **A saída decide o resultado.** Uma suíte só passa se a execução **imprimir** o veredito
  e sair com código 0.
- **Uma suíte que não imprime o veredito é ERRO**, nomeado na saída: *"não imprimiu o
  veredito — ou virou diagnóstico por engano, ou quebrou antes do fim"*.

Consequências: uma suíte nova **entra sozinha** (basta chamar-se `teste-algo.js`), sem
ninguém lembrar de cadastrá-la numa lista; e não existe rebaixamento silencioso de suíte
para diagnóstico.

> **Por que a regra do nome existe.** Antes ela era só o veredito, e apagar aquela linha
> rebaixava a suíte a diagnóstico **em silêncio**: ela continuava rodando, continuava
> lançando erro, e o runner dizia "não reprova" e saía verde. A defesa era humana — "olhe
> se a contagem caiu". Agora é mecânica. Foi por isso que `teste-etiqueta.js` e
> `teste-publeak.js` viraram `diag-etiqueta.js` e `diag-publeak.js`: eram diagnósticos com
> nome de suíte, e essa exceção é que impedia a regra.

**Quantas são hoje:** `npm run test:lista`. Esse comando é a fonte viva; número escrito
em documento vira mentira na primeira suíte nova.

## Os três que não rodam sozinhos

`diag-difer`, `diag-linkreal` e `diag-pubreal` batem no **site publicado** (`github.io`)
e no **Firestore real**. Dependem de rede, de produção e do estado da conta do
proprietário — então não rodam no `npm test` nem no CI. Só à mão, quando o dono pedir:

```bash
npm run test:producao
```

A exclusão vale em **duas camadas**: o runner os deixa de fora por padrão, e o workflow do
CI não passa nenhuma flag que os inclua. Não depende de o CI lembrar.

Os três são **diagnósticos**: eles medem, não reprovam. Por isso `test:producao` liga
`--mostrar-diagnosticos` — sem isso o comando imprimiria só "diagnostico (medido)" e
descartaria exatamente a medição que você foi buscar.

---

## A suíte de regras do Firestore (Emulator)

`testes/teste-regras.js` é a única suíte que **não** abre o `index.html`: ela sobe o
**Firestore Emulator** e exercita o `firestore.rules` deste repositório. É a rede da parte
mais consequente do app — isolamento entre empresas, token do link público, o que cada
papel pode escrever.

> **Por que ela existe.** Defeito de regra **não tem sintoma**: ninguém reclama, nada
> quebra na tela, e a empresa A lê os dados da empresa B em silêncio. O `CLAUDE.md` já
> exigia "teste no Emulator" antes de mexer nas regras, mas as verificações (19 para
> `c56d38b`, 50 para a auditoria de 01/09, 9 para o ponteiro de workspace) foram rodadas
> em scripts efêmeros e **descartadas**. Era regra escrita sem mecanismo.

**Nunca toca em produção.** O projeto usado é `demo-mappo-regras`. O prefixo `demo-` é a
garantia do próprio Firebase de que nem o SDK nem o emulador falam com um projeto real —
não há credencial, `firebase login` nem rede envolvida. Custo zero, local e no CI.

### Rodar só as regras

```bash
npm run test:regras          # == node testes/teste-regras.js
node testes/executar.js regras   # pelo runner, junto do relatório dele
```

Ela sobe o emulador, roda, imprime a contagem de casos e **encerra o emulador**. Se já
houver um emulador respondendo na porta, ela **reaproveita** e não o encerra — é o modo
cômodo para iterar: deixe `npx firebase emulators:start --only firestore` aberto num
terminal e cada execução passa a levar segundos.

### Instalação extra (uma vez por computador)

Além do `npm install`, a suíte de regras precisa de duas coisas:

```bash
java -version                # o emulador roda em Java -- precisa do 21 (Temurin)
npm run emulador:baixar      # baixa o .jar do emulador (~60 MB), uma vez só
```

O download acontece sozinho na primeira execução, mas aí ele conta dentro do timeout de
5 minutos do runner. Baixar antes evita a falha por tempo num clone novo.

### Quando o emulador não sobe

A suíte **não finge que passou**: sai com código 1 e imprime o que resolve. Na ordem:

| Sintoma na saída | O que resolve |
|---|---|
| `nao encontrei o comando "java"` | instalar o [Java 21 (Temurin)](https://adoptium.net/temurin/releases/?version=21) e abrir um terminal novo |
| `nao respondeu em 180s` | `npm run emulador:baixar` (o `.jar` pode não estar em cache) |
| `o emulador saiu com codigo 1` | ler as últimas linhas dele, que a suíte imprime; quase sempre é **porta 8080 ocupada** por outro emulador aberto |
| `"firebase-tools" nao esta instalado` | `npm install` |

A porta vem de `firebase.json` (`emulators.firestore.port`), **não** de um número escrito
dentro do teste: o emulador tem que subir igual aqui e no CI, e o mesmo número em dois
arquivos vira dois números diferentes na primeira vez que alguém muda um deles.

Duas variáveis de ambiente, só para casos de aperto: `MAPPO_EMU_ESPERA_MS` alarga a espera
pelo emulador, e `MAPPO_RAIZ` escolhe **de qual pasta** vêm o `firestore.rules` e o
`firebase.json` — é o mesmo gancho do "controle" das outras suítes, e serve para rodar a
suíte contra uma versão anterior das regras.

### Como adicionar um caso novo

Cada caso é uma linha. `negado(...)`, `permitido(...)` e `leu(...)` recebem, nesta ordem,
**qual regra** está sendo exercitada, **qual cenário** em português, e a operação:

```js
await negado(R_DATA + ' -- allow write: isGestor(wsId)',
  'tecnico tenta ESCREVER mappo_settings',
  () => setDoc(doc(db.tecA, 'workspaces/wsA/data/mappo_settings'), { json: 'x' }));

await leu(R_DATA + ' -- allow read: isMember(wsId)',
  'membro de wsA LE mappo_os',
  () => getDoc(doc(db.tecA, 'workspaces/wsA/data/mappo_os')));   // exige que o doc exista
```

Use **`leu` para toda leitura permitida**, nunca `permitido`: `leu` confere o conteúdo
(veja a defesa 3 abaixo). Ele aceita uma expectativa no quarto argumento — `existe` (o
padrão), `naoExiste` ou `temItens` para listas.

Os contextos prontos estão em `db`: `gestorA`, `tecA`, `gestorB`, `tecB` (outra empresa),
`gestorP` (workspace pendente), `estranho` (autenticado sem membership), `prestador`,
`prestador2`, `prestador3` (para o uso único do convite), `fundador`, `invasor`, `anonimo`
(o cliente do link público — `sign_in_provider` é `anonymous`, então `isRealAuth()` é falso
para ele) e `semSessao` (`request.auth == null`). O cenário é semeado por `semear()`, que
roda **com as regras desligadas** e recomeça do zero antes de cada grupo — montar o cenário
não é o que está sob teste, e assim um `delete` ou o consumo de um convite de uso único não
contamina o grupo seguinte.

**Ao acrescentar casos, suba `PISO_CASOS`** (e `PISO_GRUPOS`, se criou um grupo) no mesmo
commit. É de propósito que isso dê trabalho — veja a defesa 1.

### As quatro defesas contra a própria suíte encolher

Uma rede que pode ficar verde cobrindo menos do que afirma é pior que rede nenhuma, porque
ensina a confiar. A revisão adversarial de 26/09/2026 encontrou a suíte exatamente assim, e
estas quatro defesas saíram dela. Se você mexer no arquivo, **não remova nenhuma.**

1. **Piso de cobertura.** A contagem não é só impressa, é **conferida** contra `PISO_CASOS`
   e `PISO_GRUPOS`. Antes, apagar um `grupo(...)` inteiro deixava a suíte verde com uma
   fração da cobertura — o mesmo buraco que o runner tinha um nível acima, um nível abaixo.
   Hoje isso reprova dizendo `COBERTURA ABAIXO DO PISO -- a suite encolheu`, com os dois
   números.
2. **Espelho das listas da regra.** `isGestorOnlyDoc()` tem **10** docIds e `ramoValido()`
   **8** chaves reservadas. A suíte **lê essas duas listas do próprio `firestore.rules`** e
   reprova se divergirem da lista dela. Antes ela exercitava 2 de 10 e 2 de 8: tirar
   `mappo_settings` ou `mappo_preco_config` da regra dava ao técnico escrita em configuração
   e tabela de preço, com a suíte verde. Acrescentar um item na regra agora **reprova** até
   o caso existir aqui — e aparece duas vezes: a divergência da lista, e o caso em si.
3. **Leitura permitida confere o dado.** Para um membro, a regra permite ler documento que
   **não existe** — então "não lançou exceção" não prova nada. Se a semeadura mudar de nome,
   metade da rede vira no-op verde. Por isso `leu`, e por isso a falha diz `PERMITIDO, mas o
   documento nao existe -- o caso virou no-op verde`.
4. **Todas as falhas, não a primeira.** Abortar na primeira esconde o estado das outras ~150
   verificações e faz uma regra afrouxada parecer um problema pontual. A suíte coleta tudo e
   reprova no fim com o relatório completo. Dentro de um grupo os casos compartilham a
   semeadura, então **a primeira falha de cada grupo é a mais confiável** — as seguintes
   podem ser consequência dela, e a própria saída avisa isso.

### Gap aceito não é garantia — e a contagem separa os dois

A contagem final é assim, de propósito:

```
160 verificacoes de regra, nos dois sentidos, em 11 grupos.
  153 sao garantias (o que a regra protege).
  7 sao gaps aceitos, documentados com o porque -- NAO sao garantias
```

Um caso `[GAP ACEITO]` afirma que a regra **permite** algo que é risco conhecido: técnico
escreve `mappo_os` e `pub_*` e pode apagá-los; gestor cria ponteiro de uid arbitrário;
convite legado sem `expiraEm` continua valendo; **e o mesmo convite serve a duas pessoas
enquanto ninguém o marcar como usado**. Ele não protege nada — só impede que a decisão mude
sozinha, sem o proprietário saber. Somar gap com garantia numa contagem única fazia quem lê
o verde **superestimar** a rede, então os dois números vivem separados.

Se uma linha `[GAP ACEITO]` passar a falhar, alguém **apertou** a regra. Ótimo — mas foi de
propósito? Confirme antes de só ajustar o teste.

### Provar que a suíte pega o defeito

Mesmo raciocínio do "controle", aplicado às regras: afrouxe uma regra numa **cópia** e
confira que a suíte fica vermelha lá.

```bash
mkdir /tmp/regras-afrouxadas
cp firebase.json firestore.indexes.json firestore.rules /tmp/regras-afrouxadas/
# em /tmp/regras-afrouxadas/firestore.rules, tire o "isAtivo(wsId) &&" do allow read de data

# SEMPRE pelo caminho direto, nunca pelo runner (veja o aviso abaixo):
MAPPO_RAIZ=/tmp/regras-afrouxadas node testes/teste-regras.js    # tem que FALHAR
node testes/teste-regras.js                                      # tem que PASSAR
```

> **Não rode o controle pelo runner.** `MAPPO_RAIZ=... node testes/executar.js regras` **não
> serve aqui:** o runner confere que a raiz sob teste tem `index.html` e que o Chromium está
> instalado **antes** de executar qualquer arquivo — e a pasta do controle só tem os três
> arquivos de regra. Ele abortaria sem avaliar uma única regra, com código 1, e esse código
> 1 **se pareceria exatamente** com o vermelho que você foi buscar. O controle só prova algo
> pelo caminho direto.

A falha nomeia **a regra e o cenário**, não só "permission denied":

```
FALHOU  cliente anonimo tenta LER pub_vivo de workspace PENDENTE -- link gerado durante a aprovacao nao pode vazar dado
  regra em firestore.rules: match /workspaces/{wsId}/data/{docId} -- allow read: isAtivo(wsId)
  esperado: NEGADO pela regra
  obtido:   PERMITIDO -- o emulador aceitou a operacao
```

Fazer isso numa cópia, e não no arquivo versionado, é de propósito: esta entrega **testa**
as regras, não as corrige. Se um teste e uma regra discordarem, o teste descreve o que a
regra faz **hoje** e a divergência vai ao proprietário — mudar a regra para o teste passar
é a única coisa que essa rede não pode deixar acontecer.

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
const RAIZ = process.env.MAPPO_RAIZ || path.resolve(__dirname, '..');
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

1. **O nome `teste-*.js`** — é o que faz o runner tratar o arquivo como suíte.
2. **`MAPPO_RAIZ` com fallback `path.resolve(__dirname, '..')`**, exatamente como acima. É o
   que faz o teste rodar em qualquer clone e no CI, e é o gancho do controle contra a versão
   anterior. **Nunca escreva um caminho absoluto aqui:** 20 dos arquivos originais tinham o
   caminho da máquina do proprietário embutido e não rodavam em nenhum outro lugar — quando
   rodavam, serviam uma pasta inexistente e davam 404 em silêncio, com o teste verde.
3. **`console.log('\nTODOS OS CHECKS PASSARAM.')` no fim.** Um `teste-*.js` que não imprime
   isso é tratado como falha, com o nome do arquivo na saída.
4. **`.catch(...)` com `process.exit(1)`.** Sem ele, uma falha pode terminar com código 0.
   (O runner ainda pegaria pela ausência do veredito, mas a mensagem fica pior.)
5. **Fechar o navegador e o servidor** (`b.close()`, `srv.close()`), senão o processo não
   termina e a suíte estoura o timeout de 5 minutos.
6. **Um comentário no topo dizendo qual defeito isso impede de voltar.** Daqui a seis
   meses é a única coisa que explica por que o teste existe.

Nomes: `teste-*.js` para suíte, `diag-*.js` (ou `controle-*.js`) para diagnóstico. **Aqui o
nome é regra, não convenção** — é por ele que o runner decide.

Nada mais é preciso: salve na pasta e `npm test` já a inclui.

## Quem testa o runner

`testes/teste-runner.js` é a suíte que testa o próprio `executar.js` — o único ponto que
converte "uma suíte falhou" em "CI vermelho". Ela cria arquivos de mentira numa pasta
temporária e confere que o runner: conta certo, reprova um `teste-*.js` sem veredito,
reprova quem sai com código 1, mostra a saída de quem falhou, não deixa um filtro vazio
passar verde, respeita `--com-producao`, imprime a medição com `--mostrar-diagnosticos`,
e aborta quem trava. Não usa Playwright, então roda em segundos.

Se você mexer em `executar.js`, rode `node testes/teste-runner.js`.

---

## O que os testes não cobrem

Navegador automatizado não alcança Google Agenda, notificação real, WhatsApp e câmera de
celular. Isso está em [VERIFICACAO-MANUAL.md](VERIFICACAO-MANUAL.md), que é uma lista curta
para conferir à mão antes de publicar.
