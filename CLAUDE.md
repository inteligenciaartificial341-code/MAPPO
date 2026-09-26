# MAPPO — Regras Operacionais

## Identidade
App de gestão de OS da Elite AR. `index.html` single-file (~328KB), Firebase (Firestore + Auth anônimo).

## Fonte de verdade
- **Estado do produto (LER SEMPRE ANTES DE COMEÇAR QUALQUER TRABALHO):**
  - `MAPPO-O-QUE-TEM.md` — o que já está publicado
  - `MAPPO-O-QUE-FALTA.md` — o que está pendente, em andamento e as decisões que fecham caminhos
  - Não vasculhar o código para descobrir o que existe: começar por esses dois.
  - **Ao final de cada commit + publicação:** mover o item de `O-QUE-FALTA` para `O-QUE-TEM`
    (seção do recurso + linha no histórico). Um item vive em um arquivo só, nunca nos dois.
- Ideias futuras com parecer técnico: `plano-evolucao-mappo.md`
- Plano mestre: `project-context.md`
- Diagnóstico: `_audit/mappo-initial-audit.md`
- Como rodar e escrever testes: `testes/README.md`

## Testes (obrigatório)
- **Todo defeito relatado vira teste ANTES de virar correção.** O teste falha primeiro,
  provando que reproduz o defeito; só depois vem a correção, e aí ele passa. Sem isso,
  "corrigido" é opinião.
- A prova de que um teste pega o defeito é rodá-lo contra a versão anterior com
  `MAPPO_RAIZ` e ver que ele **falha** lá. Está explicado em `testes/README.md`.
- `npm test` roda as suítes em série e sai com código diferente de zero se alguma falhar.
  Nenhuma alteração é entregue com o comando vermelho.
- **Quantas são hoje: `npm run test:lista`.** É a fonte viva — número escrito à mão em
  documento vira mentira na primeira suíte nova.
- O GitHub Actions roda o mesmo `npm test` a cada push em `main` e a cada PR
  (`.github/workflows/testes.yml`).
- **Nome define o papel:** `teste-*.js` é suíte e **precisa** imprimir
  `TODOS OS CHECKS … PASSARAM` no fim — se não imprimir, o runner reprova nomeando o
  arquivo. `diag-*.js` e `controle-*.js` são diagnósticos: só medem, nunca reprovam.
  Não existe rebaixamento silencioso de suíte para diagnóstico.
- `diag-difer`, `diag-linkreal` e `diag-pubreal` batem no site publicado e no Firestore
  real: ficam fora do `npm test` e do CI. Só à mão (`npm run test:producao`), quando o
  proprietário pedir.
- O que navegador automatizado não alcança está em `testes/VERIFICACAO-MANUAL.md`.

## Gate de supervisão (obrigatório)
Antes de qualquer edição: apresentar plano com arquivos e linhas afetadas. Aguardar OK explícito.

## Restrições específicas do MAPPO
- `index.html` é single-file. Não refatorar para modular sem etapa dedicada e aprovada.
- Toda alteração em `index.html` deve ser cirúrgica e localizada.
- `firestore.rules` e `firestore.indexes.json` só mudam após teste no Emulator.
- Autenticação atual é cosmética: tratar como falha crítica, não como feature existente.
- Senhas em texto plano: migração exige plano de rollback e backup do Firestore.
- Nenhuma etapa é aprovada sem definir como será validada. Existe suíte anti-regressão
  desde 25/09/2026 em `testes/` (quantas, em `npm run test:lista`): validar com ela, e
  estendê-la quando o caso novo não estiver coberto.

## Proibido
- `catch` vazio ou engolir erros.
- Dependências novas sem aprovação.
- Refatoração ampla ou renomear funções públicas.
- Entregar correção de defeito sem o teste que o reproduz.
- Publicar com `npm test` vermelho. **Atenção: isto hoje é disciplina, não mecanismo** —
  leia a seção seguinte antes de confiar nela.

## O que o CI NÃO garante (leia antes de confiar no verde)
O job roda **depois** do commit já estar em `main`, e o GitHub Pages publica de `main` sem
consultar o resultado. Então o vermelho **avisa**, não impede: nada no estado atual bloqueia
uma publicação com teste quebrado.

O mecanismo que faria valer é **proteção de ramo em `main` exigindo o status check
`Suites anti-regressao`** — configuração no GitHub (Settings → Branches) que **só o
proprietário pode ligar**. Enquanto não estiver ligada, "proibido publicar com `npm test`
vermelho" depende de quem publica olhar antes.

Não escrever, aqui ou em outro documento, que o CI "impede" ou "bloqueia" publicação
enquanto essa proteção não existir.

**Para o proprietário, quando quiser transformar a disciplina em impedimento** (uma vez, ~2
minutos, sem custo — funciona no plano gratuito para repositório público):

1. Fazer pelo menos um push para que o job apareça ao menos uma vez — o GitHub só oferece
   um status check que já rodou.
2. No GitHub, abrir o repositório → **Settings** → **Branches**.
3. Em *Branch protection rules*, **Add branch protection rule**.
4. Em *Branch name pattern*, escrever `main`.
5. Marcar **Require status checks to pass before merging**.
6. No campo de busca que aparece, procurar e selecionar **`Suites anti-regressao`**
   (é o `name:` do job no workflow).
7. Opcional, e recomendado por ser um repositório de um só dono: marcar também
   **Do not allow bypassing the above settings**, senão o próprio dono continua podendo
   empurrar por cima do vermelho sem perceber.
8. **Create**.

Depois disso, atualizar esta seção: a proibição deixa de ser disciplina e passa a ser
mecanismo. Enquanto ninguém confirmar que está ligada, o texto acima continua valendo.

## Ramo de trabalho
Corrigido em 25/09/2026: a regra anterior proibia "commit direto em `main`", mas a prática
real deste projeto sempre foi commitar em `main` e publicar de lá — um proprietário, um
ramo. A regra proibia o que todo commit do histórico faz, então não protegia nada.

O que vale agora:
- Commit em `main` é o caminho normal — **mas nunca sem autorização explícita do
  proprietário para aquele commit.** É essa autorização, somada ao gate de supervisão, que
  substitui o fluxo de branch (mesma regra em `AGENTS.md`).
- Antes de pedir a autorização: `npm test` verde.
- O CI roda em todo push em `main` e **marca** o commit. Marcar não é impedir — veja a seção
  acima; hoje ele avisa, não bloqueia.
- Ramo separado só quando a mudança é grande ou arriscada o suficiente para o proprietário
  querer olhar antes de ela entrar em `main` — e aí ele pede.

## Padrões
- `async/await`. Sem `.then()` solto.
- Erros logados com `e.code` e `e.message`.
- Diff ao final de cada alteração.
