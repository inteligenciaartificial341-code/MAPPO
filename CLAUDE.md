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

## Gate de supervisão (obrigatório)
Antes de qualquer edição: apresentar plano com arquivos e linhas afetadas. Aguardar OK explícito.

## Restrições específicas do MAPPO
- `index.html` é single-file. Não refatorar para modular sem etapa dedicada e aprovada.
- Toda alteração em `index.html` deve ser cirúrgica e localizada.
- `firestore.rules` e `firestore.indexes.json` só mudam após teste no Emulator.
- Autenticação atual é cosmética: tratar como falha crítica, não como feature existente.
- Senhas em texto plano: migração exige plano de rollback e backup do Firestore.
- Zero testes hoje: nenhuma etapa é aprovada sem definir como será validada.

## Proibido
- `catch` vazio ou engolir erros.
- Dependências novas sem aprovação.
- Refatoração ampla ou renomear funções públicas.
- Commit direto em `main`.

## Padrões
- `async/await`. Sem `.then()` solto.
- Erros logados com `e.code` e `e.message`.
- Diff ao final de cada alteração.
