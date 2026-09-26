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
- `npm test` roda as 25 suítes em série e sai com código diferente de zero se alguma
  falhar. Nenhuma alteração é entregue com o comando vermelho.
- O GitHub Actions roda o mesmo `npm test` a cada push e PR (`.github/workflows/testes.yml`).
- Toda suíte nova precisa imprimir `TODOS OS CHECKS … PASSARAM` no fim: é esse veredito
  que faz o runner tratá-la como suíte. Sem ele o arquivo é diagnóstico e nunca reprova.
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
  desde 25/09/2026 (`testes/`, 25 suítes + 9 diagnósticos): validar com ela, e estendê-la
  quando o caso novo não estiver coberto.

## Proibido
- `catch` vazio ou engolir erros.
- Dependências novas sem aprovação.
- Refatoração ampla ou renomear funções públicas.
- Publicar com `npm test` vermelho.
- Entregar correção de defeito sem o teste que o reproduz.

## Ramo de trabalho
Corrigido em 25/09/2026: a regra anterior proibia "commit direto em `main`", mas a prática
real deste projeto sempre foi commitar em `main` e publicar de lá — um proprietário, um
ramo. A regra proibia o que todo commit do histórico faz, então não protegia nada.

O que vale agora:
- Commit em `main` é o caminho normal, **depois** do gate de supervisão e com `npm test` verde.
- O CI roda em todo push e marca o commit: é ele o guarda-corpo, não o ramo.
- Ramo separado só quando a mudança é grande ou arriscada o suficiente para o proprietário
  querer olhar antes de ela entrar em `main` — e aí ele pede.

## Padrões
- `async/await`. Sem `.then()` solto.
- Erros logados com `e.code` e `e.message`.
- Diff ao final de cada alteração.
