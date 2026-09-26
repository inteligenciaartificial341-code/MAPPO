---
title: 'Rede anti-regressão: suítes versionadas, um comando e CI'
type: 'chore'
created: '2026-09-25'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '5d93539dff3becabb2dc52a4b0162a21c49cb18a'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Em 24/09/2026 três defeitos apareceram juntos em funcionalidades que já
funcionavam. A causa raiz não foi um bug — foi a ausência de qualquer rede que pegasse a
regressão antes do usuário. Desde então 25 suítes Playwright e 9 diagnósticos foram escritos e
provaram cada correção (falham no código anterior, passam no corrigido), mas vivem numa pasta
temporária do sistema **já apagada três vezes**. Enquanto não estiverem versionados, não existem.

**Approach:** Versionar `testes/`, dar um comando único que roda tudo e conta o resultado, e
colocar o GitHub Actions rodando o mesmo comando a cada push — de graça. Mais a regra escrita de
que todo defeito relatado vira teste antes de virar correção.

## Boundaries & Constraints

**Always:**
- O comando distingue **suítes** (têm veredito `TODOS OS CHECKS … PASSARAM`, falham de verdade)
  de **diagnósticos** (só medem; nunca reprovam a execução).
- O CI **nunca** executa os 3 arquivos que batem no site publicado e no Firestore real
  (`diag-difer`, `diag-linkreal`, `diag-pubreal`): dependem de rede, de produção e do estado da
  conta do proprietário. Rodam só à mão, quando o dono pedir.
- Saída em português, com a contagem no fim e a lista do que falhou.
- Custo zero: só GitHub Actions no plano gratuito. O proprietário não tem plano pago e isso é
  restrição dura do projeto.
- Nenhuma alteração em `index.html`.

**Ask First:**
- Qualquer dependência nova além de `playwright` (já em uso).
- Qualquer mudança que faça o CI custar dinheiro (minutos em runner privado, serviço externo).

**Never:**
- Escrever testes novos: os 34 arquivos existem e são bons. O trabalho é dar-lhes casa, comando
  e execução automática.
- Reescrever ou "padronizar" as suítes para um framework (Jest, Playwright Test). Elas são
  scripts Node auto-contidos e funcionam; converter é risco sem ganho agora.
- Fazer o CI publicar, deployar ou tocar em produção.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Tudo passa | 25 suítes OK | Sai com código 0 e imprime `25/25 suítes passaram` | N/A |
| Uma suíte falha | 1 suíte quebra | Sai com código 1, nomeia a suíte e mostra as últimas linhas dela | Falha propagada ao CI |
| Diagnóstico "falha" | `teste-etiqueta` não imprime veredito | Contado como diagnóstico, **não** reprova | N/A |
| Suíte trava | Suíte passa de 5 min | Abortada, contada como falha, nomeada na saída | Timeout explícito, sem travar o CI |
| Sem navegador | Chromium ausente | Mensagem dizendo para rodar `npx playwright install chromium` | Sai com código 1 |

</frozen-after-approval>

## Code Map

- `testes/` -- 34 arquivos já copiados, ainda não versionados. **25 suítes** (`teste-*.js` que
  imprimem `TODOS OS CHECKS … PASSARAM`), **9 diagnósticos** sem veredito: `controle-fotosobra`,
  `diag-assinatura`, `diag-concluir`, `diag-difer`, `diag-linkreal`, `diag-mobile`,
  `diag-pubreal`, `teste-etiqueta`, `teste-publeak`.
- `testes/diag-difer.js`, `testes/diag-linkreal.js`, `testes/diag-pubreal.js` -- únicos que
  contêm `github.io`: batem no site publicado e no Firestore real. **Fora do CI.**
- 11 arquivos leem a variável `MAPPO_RAIZ` -- é assim que se roda uma suíte contra uma versão
  anterior do `index.html` (o "controle" que prova que o teste pega o defeito).
- Não existe `package.json` nem `.github/` no repositório hoje. Node v24.18.0 em uso.
- `CLAUDE.md` -- regras operacionais; hoje diz "Zero testes hoje" e proíbe commit em `main`,
  ambas desatualizadas (o proprietário decidiu em 25/09/2026 corrigir a regra de `main`).
- `project-context.md` -- carregado como fato base em toda execução do BMAD; também afirma
  "Zero testes hoje". Enganaria as próximas execuções.
- `MAPPO-O-QUE-FALTA.md` item 1 -- a origem desta entrega; migra para `MAPPO-O-QUE-TEM.md`.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- criar com `scripts.test` e `playwright` como devDependency -- dá o comando único e fixa a versão do navegador
- [x] `testes/executar.js` -- runner: descobre `teste-*.js`, separa suítes de diagnósticos por presença do veredito, roda em série com timeout, imprime contagem e lista de falhas, sai com código 1 se alguma suíte falhar -- é o coração da entrega
- [x] `testes/README.md` -- como rodar tudo, como rodar uma só, como rodar o controle com `MAPPO_RAIZ`, e como escrever uma suíte nova -- sem isto o próximo a mexer não sabe o padrão
- [x] `.github/workflows/testes.yml` -- roda `npm test` a cada push e PR, com `npx playwright install --with-deps chromium`; exclui os 3 que batem em produção -- a rede que funciona mesmo quando eu esqueço
- [x] `testes/VERIFICACAO-MANUAL.md` -- lista curta do que nenhum navegador automatizado cobre (Google Agenda, notificação real, WhatsApp, câmera de celular) -- entregue ao proprietário
- [x] `CLAUDE.md` -- regra "todo defeito relatado vira teste ANTES da correção"; corrigir "Zero testes"; alinhar a regra de `main` à prática real -- regra escrita que ninguém segue é pior que regra nenhuma
- [x] `project-context.md` -- corrigir "Zero testes hoje" -- é fato base de toda execução do BMAD
- [x] `MAPPO-O-QUE-TEM.md` / `MAPPO-O-QUE-FALTA.md` -- mover o item 1 e registrar no histórico

**Acceptance Criteria:**
- Dado o repositório recém-clonado, quando rodar `npm install && npx playwright install chromium && npm test`, então as 25 suítes rodam e a saída termina com a contagem.
- Dado que uma suíte foi quebrada de propósito, quando rodar `npm test`, então o comando sai com código diferente de zero e nomeia a suíte.
- Dado um push para `main`, quando o GitHub Actions rodar, então executa as mesmas 25 suítes sem tocar em produção e marca o commit.
- Dado o CI, quando ele rodar, então `diag-difer`, `diag-linkreal` e `diag-pubreal` **não** são executados.

## Design Notes

**Corrigido na revisão adversarial de 25/09/2026.** A regra original era só "classifica pela
saída: suíte é o arquivo que imprime o veredito". A revisão demonstrou o buraco: apagar essa
única linha `console.log` reclassificava a suíte como diagnóstico — ela continuava rodando,
continuava lançando erro, e o runner registrava "não reprova" e saía verde. A defesa prevista
era o humano olhar a contagem. Rede cuja falha é silenciosa não é rede.

A regra vigente soma as duas coisas: **`teste-*.js` é suíte sempre, pelo nome**, e um
`teste-*.js` que não imprime o veredito é **erro nomeado**, nunca um diagnóstico silencioso.
O veredito continua promovendo arquivos de outros nomes. A propriedade que motivou o desenho
original está intacta — suíte nova entra sozinha, basta chamar `teste-algo.js`, sem cadastro
em lista nenhuma. Os dois diagnósticos que tinham nome de suíte (`teste-etiqueta`,
`teste-publeak`) viraram `diag-*`, que é o que eles sempre foram.

Buraco residual, conhecido e documentado: renomear `teste-foo.js` para `foo.js` ainda rebaixa
em silêncio. Fechar isso exigiria um manifesto, que destrói a propriedade acima. Fica registrado
em `testes/README.md`.

Execução **em série**. Cada suíte sobe um Chromium e um servidor HTTP; em paralelo, num runner
gratuito de 2 vCPUs, elas competem por CPU e os `setTimeout` dos próprios testes começam a
estourar — falha intermitente é pior que teste lento, porque ensina a ignorar o vermelho.

## Verification

**Commands:**
- `npm test` -- esperado: 25 suítes executadas, contagem no fim, código de saída 0
- `node testes/executar.js --lista` -- esperado: mostra o que classificou como suíte e como diagnóstico, sem executar
- `git status --short` -- esperado: `testes/`, `package.json` e `.github/` versionados

**Manual checks (if no CLI):**
- Após o push, abrir a aba **Actions** no GitHub e confirmar a execução verde no commit.
