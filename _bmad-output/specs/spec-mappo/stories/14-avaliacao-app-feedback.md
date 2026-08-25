---
title: 'Avaliação do app (feedback do piloto)'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 0
baseline_commit: '1bd5effea75b2a41ee80dbbed77c4bf849c91318'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Não existe canal nenhum dentro do app pra uma empresa do piloto avaliar o MAPPO — feedback hoje só chega informalmente (WhatsApp, conversa).

**Approach:** Nota (1-5) + texto livre, enviado pelo gestor de dentro do app; grava numa coleção nova, write-only do lado do cliente — visível só pro proprietário, direto no Firebase Console (sem painel/tela de leitura dentro do app, sem conceito de admin/super-usuário no client).

## Boundaries & Constraints

**Always:** Feedback carrega data, nome/id do workspace de origem e nome de quem enviou (mesmo espírito do CAP-15: "aparece pro proprietário com data e nome do workspace"). Escrita validada contra membership real (`isMember`), nunca um `workspaceId` arbitrário. `firestore.rules` testado no Emulator Suite antes de publicar; deploy de rules e commit exigem autorização explícita separada, mesmo rigor das Stories 1/5/11.

**Ask First:** Nenhuma — escopo já é o mínimo (SPEC.md explicitamente diz "não é painel de analytics/NPS formal").

**Never:** Tela/painel de leitura dentro do app (nenhum conceito de admin client-side existe hoje, AD-7 proíbe custom claims/Cloud Functions que resolveriam isso de outro jeito). Média/NPS calculado. Edição ou exclusão de feedback já enviado (nem pelo próprio autor).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gestor envia feedback válido | Nota 1-5 + texto | Grava com data, workspace e nome de quem enviou | N/A |
| Nota fora de 1-5 ou ausente | Tentativa de escrita | Rejeitado pela regra, não só pela UI | Toast de erro |
| Sem conexão | Gestor tenta enviar | Mensagem clara, não perde o texto digitado | Não trava a UI |
| Técnico tenta enviar (não é o público-alvo, mas não é bloqueado por perfil) | Sessão de técnico | Permitido — CAP-15 não restringe por perfil, só por ser membro real do workspace | N/A |

</frozen-after-approval>

## Code Map

- `firestore.rules` -- nova coleção raiz `feedback/{id}`: `allow create` (`isRealAuth() && isMember(request.resource.data.workspaceId)`, nota numérica 1-5 obrigatória), `allow read,update,delete: if false` (write-only do client — leitura só pelo proprietário via Console/Admin SDK, fora das regras).
- `index.html` -- sidebar, seção "Conta" (mesma área de Configurações/Compartilhar app, `index.html:903-914` da Story 12) -- novo item "Avaliar o app", abre modal com nota (1-5, ex.: estrelas/botões numerados) + textarea.
- `index.html` -- nova `enviarFeedbackApp(nota,texto)`: grava direto via `fbDB.collection('feedback').add({workspaceId:WORKSPACE, workspaceNome:WORKSPACE_NOME, nome:session.nome, nota, texto, criadoEm:serverTimestamp()})` -- fora do motor de sync existente (SYNC_KEYS/ITEM_LISTS/etc.), é write-only e não precisa vir de volta pro client. Mesmo padrão de erro-logado (`e.code`/`e.message`) das funções vizinhas.

## Tasks & Acceptance

**Execution:**
- [x] `firestore.rules` -- regra de `feedback/{id}` (create validado, read/update/delete sempre false)
- [x] `index.html` -- item "Avaliar o app" na sidebar + modal de nota+texto
- [x] `index.html` -- `enviarFeedbackApp()` -- grava fora do motor de sync, erro tratado sem perder o texto digitado

**Acceptance Criteria:**
- Given um gestor envia nota+texto válidos, when confirma, then o documento aparece no Firestore com data, workspace de origem e nome de quem enviou.
- Given uma tentativa de escrita sem nota válida (1-5), when a regra avalia, then rejeita — testado no Emulator, não só a UI escondendo o caso.
- Given qualquer cliente tenta LER a coleção `feedback`, when a regra avalia, then nega sempre, mesmo sendo o autor do próprio feedback.

## Verification

**Commands:**
- Firebase Emulator Suite (`@firebase/rules-unit-testing`) -- create válido/inválido, read sempre negado (inclusive pro próprio autor), sem regressão nos testes já existentes

**Manual checks (sem CLI de app):**
- Enviar feedback de dentro do app, confirmar no Firebase Console que o documento aparece certo (data, workspace, nota, texto).
- Tentar sem nota/com nota fora de 1-5, confirmar rejeição.

## Suggested Review Order

- `match /feedback/{id}` -- write-only real: `create` validado (membro real + nota 1-5), `read/update/delete` sempre `false`, inclusive pro próprio autor.
  [`firestore.rules:141`](../../../../firestore.rules#L141)

- `enviarFeedbackApp()` -- grava fora do motor de sync (nunca lido de volta pelo client); erro/offline nunca limpa o texto já digitado.
  [`index.html:2819`](../../../../index.html#L2819)

- `abrirAvaliarApp()` -- modal de nota+texto, item novo na sidebar (seção "Conta", mesma área de Configurações/Compartilhar app).
  [`index.html:2789`](../../../../index.html#L2789)
