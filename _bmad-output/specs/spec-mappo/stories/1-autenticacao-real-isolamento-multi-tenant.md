---
title: 'Autenticação real + isolamento multi-tenant'
type: 'feature'
created: '2026-08-22'
status: 'done'
baseline_commit: '9d264d5d0c2681fe1e73bca4e7e11c060bf2d9cd'
review_loop_iteration: 0
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Login hoje é cosmético (usuário/senha fixos em texto plano) e o app roda sob um único workspace fixo (`WORKSPACE='elite-ar'`) — nenhuma segunda empresa pode entrar sem vazar dados entre workspaces.

**Approach:** Substituir por contas reais do Firebase Auth (uma por pessoa), resolver o workspace de cada pessoa via um lookup global (`userWorkspaces/{uid}`) e um documento de membership (`workspaces/{workspaceId}/members/{uid}`) antes de liberar qualquer sync, tornando `WORKSPACE` dinâmico — sem tocar no motor de merge existente.

## Boundaries & Constraints

**Always:** Nenhuma credencial em texto plano em nenhum ponto novo. `WORKSPACE` resolvido uma única vez, depois de uid + membership + workspace confirmados, antes de `fbReady=true`. Motor de merge (`SYNC_KEYS`/`ITEM_LISTS`/etc.) inalterado — `mappo_tecnicos` continua mesclado por `'nome'`. Toda regra nova testada no Firebase Emulator Suite antes de qualquer publicação. Edição cirúrgica em `index.html` — sem reformatar/reescrever o arquivo.

**Ask First:** Publicar as novas `firestore.rules` em produção — exige confirmar antes quais regras estão de fato publicadas hoje (Open Question 1 do SPEC — pode ser incidente de exposição em andamento) e autorização explícita depois. Qualquer commit em `main`. Migrar os registros reais de `mappo_tecnicos` da Elite Ar (nome→uid) — fica fora desta story; se a implementação esbarrar em dado real, parar e perguntar antes de tocar.

**Never:** Cloud Functions, custom claims, ou qualquer backend novo. Autorização por recurso dentro do workspace (técnico restrito à própria OS). Onboarding self-service com UI polida — só o necessário pra criar o primeiro gestor + workspace funcionalmente.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Cadastro (bootstrap) | E-mail/senha novos, nenhum membership ainda | Cria workspace + `members/{uid}` role=gestor + `userWorkspaces/{uid}` | N/A |
| Login técnico convidado | uid já tem `userWorkspaces` + `members` role=tecnico | Resolve workspace/role, `fbReady=true`, sync inicia | N/A |
| uid autenticado sem `userWorkspaces` | Login ok, sem doc de workspace | Tela de "sem acesso" clara, não trava em loop | Loga `e.code`/`e.message` |
| `session.perfil` alterado via DevTools | localStorage adulterado pra 'gestor' | Regra nega a operação que o perfil real não permite | Rejeição na regra, sem crash |
| Offline no boot, cache anterior existe | Sem rede, uid/workspace já resolvidos antes | Usa cache local, não bloqueia | N/A |
| Regra publicada não confirmada (OQ-1) | — | Não avança sem confirmação humana explícita | HALT |

</frozen-after-approval>

## Code Map

- `index.html:924` -- const `WORKSPACE='elite-ar'`; usos em 1160, 1427, 1452, 1468, 4801, 4892 (todos montam `workspaces/{WORKSPACE}/data/{key}`)
- `index.html:1090-1110` -- `fbInit()`: cadeia de auth já corrigida nesta sessão (`onAuthStateChanged`+`signInAnonymously`); ponto de inserção do lookup de workspace/membership
- `index.html:1478-1493` -- `initSync()`/`fbBoot()`; chamadas em 4984 (boot) e 1522 (reconexão)
- `index.html:1569-1572` -- `CFG.gestorUser`/`gestorPass` a remover
- `index.html:1786-1804` -- `fazerLogin()`: comparação em texto plano a substituir por `signInWithEmailAndPassword`
- `index.html:1752,1769` -- `session` (declaração/persistência em `localStorage`)
- `index.html:1575-1583, 3424-3508` -- `mappo_tecnicos` (shape, cadastro `openModalTecnico`, salvamento `salvarTecnico`) -- adicionar `uid`, aposentar `senha` em registros novos
- `index.html:927-931, 942` -- `SYNC_KEYS`/`ITEM_LISTS` (merge key de `mappo_tecnicos` é `'nome'` -- não tocar)
- `firestore.rules` (13 linhas, raiz do repo) -- hoje espera `members` array em `workspaces/{wsId}`; não bate com o desenho novo, reescrever por completo
- Fluxo de cadastro de empresa: **não existe** hoje (confirmado por busca) -- construir novo

## Tasks & Acceptance

**Execution:**
- [x] `firestore.rules` -- reescrito cobrindo `userWorkspaces/{uid}`, `workspaces/{wsId}/members/{uid}`, `workspaces/{wsId}/data/{doc}` por perfil, com o predicado de bootstrap do primeiro gestor -- AD-1/AD-2/AD-11
- [x] `index.html` `fbInit`/`initSync` -- lookup `userWorkspaces/{uid}` + `members/{uid}` entre auth e `fbReady=true`; `WORKSPACE` virou `let` dinâmico -- AD-3/AD-11
- [x] `index.html` `fazerLogin` -- credenciais fixas trocadas por `signInWithEmailAndPassword`; `session` vem do resultado do lookup -- AD-6
- [x] `index.html` -- novo fluxo de cadastro de empresa (`cadastrarEmpresa`): cria conta, workspace, `members/{uid}` (bootstrap), `userWorkspaces/{uid}` em batch atômico
- [x] `index.html` `mappo_tecnicos` -- campo `uid` adicionado; convite de técnico grava `uid` (`_vincularAcessoTecnico`), `senha` removida de registros novos -- AD-6
- [x] Matriz de perfis no Firebase Emulator Suite -- **21/21 assertions passaram** (ver Verification)

**Acceptance Criteria:**
- Given uma pessoa nunca logada, when se cadastra como gestor pela primeira vez, then workspace + `members/{uid}` + `userWorkspaces/{uid}` são criados e ela só acessa o próprio workspace.
- Given duas pessoas de workspaces diferentes autenticadas, when uma tenta ler/escrever no workspace da outra no Emulator Suite, then a regra nega.
- Given um técnico altera `session.perfil` para `'gestor'` no `localStorage`, when tenta uma operação exclusiva de gestor, then a regra do Firestore rejeita — não só a UI escondendo o botão.
- Given o código-fonte do cliente, when inspecionado, then não há usuário/senha fixos nem senha de técnico em texto plano.

## Design Notes

Ordem de boot: `onAuthStateChanged(user)` → `get userWorkspaces/{uid}` → `get workspaces/{workspaceId}/members/{uid}` → seta `WORKSPACE` → `fbReady=true` → `initSync()`. Estende a garantia que `fbReady` já dá desde o fix desta sessão (`2702e80`/`9d264d5`): antes só esperava auth confirmar; agora espera auth + membership + workspace juntos.

Bootstrap do primeiro gestor: regra de criação em `members/{uid}` permite quando a subcoleção `members` do workspace ainda está vazia (ver AD-2 na espinha para o predicado exato em Rules).

## Verification

**Adendo pós-revisão (autorizado pelo proprietário, 2026-08-23): gate de aprovação manual.** `workspaces/{wsId}` ganhou `status:'pendente'|'ativo'` — nasce sempre `pendente` (regra impede auto-aprovação no `create`), e `data/{docId}` (toda leitura/escrita, incluindo `pub_*`) passa a exigir `isAtivo(wsId)` além de membership. Aprovação é manual, direto no Firebase Console (fora do alcance das regras — não é operação de cliente), sem UI nova. Resolve o achado de squatting/DoS do `deferred-work.md` (ninguém usa dado real sem o dono do projeto aprovar primeiro).

**Executado (Firebase Emulator Suite, `@firebase/rules-unit-testing`, projeto de teste isolado fora do repo):**
- **27/27 assertions passaram** na rodada final (pós-review, pós-patches, pós-reversão de uma mudança de regra indevida, pós-gate de aprovação), cobrindo os 5 perfis (não-autenticado, anônimo/link público, autenticado sem workspace, gestor, técnico, usuário de outro workspace), o caso crítico `cadastrarEmpresa()` com os 3 writes no mesmo `WriteBatch` (bootstrap atômico), um teste dedicado confirmando a correção do patch #1 (renomear técnico já vinculado via `update()` isolado em `members/{uid}`, sem tocar `userWorkspaces`), e 5 testes do gate de aprovação (auto-aprovação negada; gestor pendente lê o próprio status mas não dado; link público de workspace pendente negado).
- Auditoria por `grep` independente (não só o relato de quem implementou), repetida após os patches: zero ocorrências de credencial em texto plano em `index.html`.
- Sintaxe do `index.html` verificada com `node --check` de forma independente, repetida após os patches — OK.
- Reviewer gate rodou 3 camadas em paralelo (blind-hunter, edge-case-hunter, verification-gap) contra o diff completo; 0 achados `intent_gap`/`bad_spec`; 11 `patch` aplicados e reverificados; 6 `defer` registrados em `deferred-work.md`; o resto rejeitado por já estar coberto (non-goals do PRD/SPEC) ou por ser ruído.

**Não coberto por este teste (matriz do spec tinha 6 linhas; regras cobrem 4 delas por natureza):**
- "Offline no boot, cache anterior existe" — comportamento de `localStorage`, não de `firestore.rules`; não testável via Emulator Suite. Precisa verificação manual num navegador real (não disponível neste ambiente).
- "Regra publicada não confirmada (OQ-1)" — não é um teste, é um gate humano: confirmar no Firebase Console quais regras estão de fato publicadas em `mappo-13a30`. Nenhum teste local resolve isso.

**Fechado em 2026-08-23.** Publicado (`8c2d63a`, `origin/main` + `firestore.rules` liberado em produção) e validado manualmente pelo proprietário contra o Firestore real: cadastrou "Elite Ar", caiu em `pendente`, aprovou pelo Firebase Console, voltou e entrou — o fluxo completo funcionou de ponta a ponta. OQ-1 confirmado durante este ciclo: as regras publicadas antes deste deploy eram `allow read, write: if true` em `workspaces/{wsId}/**` (banco aberto), substituídas agora pelas regras revisadas desta story. Técnicos de exemplo (Carlos, João, Marcos, Rafael) não foram re-onboardados — eram só dado de exemplo, fica para quando o proprietário tiver técnicos reais para convidar.

## Suggested Review Order

**Regras do Firestore — o contrato de segurança**

- Ponto de entrada: as 4 coleções novas/mudadas e seus predicados de bootstrap.
  [`firestore.rules:1`](../../../../firestore.rules#L1)

**Cadeia de boot — auth → workspace → fbReady**

- `fbInit` para de assumir auth anônima como default; dois modos explícitos (app real vs. link público).
  [`index.html:1100`](../../../../index.html#L1100)
- Núcleo da AD-3/AD-11: resolve `userWorkspaces` → `members` → seta `WORKSPACE`, só então libera sync.
  [`index.html:1144`](../../../../index.html#L1144)
- Aplica a sessão resolvida; limpa dado local se o workspace mudou desde o último boot neste aparelho (AD-1).
  [`index.html:1184`](../../../../index.html#L1184)
- `WORKSPACE` vira `let`, resolvido em runtime, não mais constante fixa.
  [`index.html:929`](../../../../index.html#L929)

**Cadastro e login — credencial real substitui login cosmético**

- Bootstrap do primeiro gestor: cria conta, workspace e membership em um `WriteBatch` atômico.
  [`index.html:1245`](../../../../index.html#L1245)
- Login sem comparação local — só delega pro Firebase Auth.
  [`index.html:1982`](../../../../index.html#L1982)
- Conta de técnico convidado, sem workspace ainda — o gestor vincula depois.
  [`index.html:1291`](../../../../index.html#L1291)

**Gestão de equipe — UID substitui senha em texto plano**

- Concede acesso real ao workspace pro UID que o técnico enviou (só dispara em link novo/mudado, não em rename).
  [`index.html:3682`](../../../../index.html#L3682)
- Rename de técnico já vinculado vira `update()` leve, sem tocar `userWorkspaces` (aqui é onde o bug do patch #1 vivia).
  [`index.html:3701`](../../../../index.html#L3701)
- `salvarTecnico` decide quando é link novo vs. só rename.
  [`index.html:3707`](../../../../index.html#L3707)
- Remoção agora revoga acesso no servidor e avisa se a revogação falhar.
  [`index.html:3750`](../../../../index.html#L3750)

**Link público — rota ganhou o workspace**

- Token sozinho não basta mais; a URL carrega o workspace.
  [`index.html:4945`](../../../../index.html#L4945)
- Detecta formato de link antigo (pré-multi-tenant) e mostra aviso claro em vez de cair no login.
  [`index.html:5134`](../../../../index.html#L5134)

