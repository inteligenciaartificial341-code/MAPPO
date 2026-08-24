---
title: 'Convite de prestador gerado pelo gestor, revogável'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 0
baseline_commit: '04b387ab8d9515ceb0a51bb762bffee9483e0c4b'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Hoje o prestador gera sua própria conta e manda o UID cru pro gestor colar manualmente — nada verifica que quem mandou o UID é a pessoa esperada (risco já em `deferred-work.md`).

**Approach:** Inverte o fluxo — gestor gera um código de convite de uso único pra uma vaga de técnico já criada; prestador informa nome + código pra se auto-vincular via transação Firestore, sem o gestor colar nada. Colar UID manualmente vira fallback secundário, não é removido.

## Boundaries & Constraints

**Always:** Um convite vale pra uma única vaga (`tecnicos[]` com `uid:null`), consumido atomicamente via `runTransaction()` (nunca `batch()` solto — evita corrida de uso duplo). `members/{uid}` só é escrito por gestor OU pelo próprio uid citando um convite válido. Convite não expira por tempo, só por consumo ou revogação do gestor. `firestore.rules` testado no Emulator Suite antes de publicar; deploy de rules e commit exigem autorização explícita separada, mesmo rigor das Stories 1 e 5.

**Ask First:** Nenhuma decisão de produto em aberto. Caso real não coberto aqui → HALT e perguntar antes de inventar.

**Never:** Expiração por tempo do código. Remover o campo manual de UID. Cloud Functions/custom claims (AD-7). Nova dependência.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gestor gera convite pra vaga | Vaga com `uid:null` | Código de uso único exibido/copiável | N/A |
| Prestador informa nome+código válidos | Conta Auth já criada | `members/{uid}` criado, convite consumido, entra direto | N/A |
| Código errado/inexistente ou já usado/revogado | Qualquer conta | Nada é criado | "Código inválido ou já utilizado" |
| Gestor revoga convite pendente | Vaga com convite não consumido | Código para de valer; vínculo já feito antes não é desfeito | N/A |
| Duas tentativas concorrentes, mesmo código | Corrida real | No máximo uma cria `members/{uid}` | Transação falha na segunda |
| Gestor reabre Equipe após vínculo novo | `members` tem tecnico sem reflexo local | `uid`/`nome` preenchidos automaticamente na vaga certa | N/A |

</frozen-after-approval>

## Code Map

- `firestore.rules` -- nova coleção raiz `convites/{codigo}`: `allow get` (autenticado real; NÃO `allow read` — bloqueia `list`/enumeração), `allow create` (só `isGestor(request.resource.data.workspaceId)`, `usado==false`, `revogadoEm==null`), `allow update` (gestor revoga OU o próprio uid consome, diff restrito).
- `firestore.rules:59-66` (`match .../members/{uid}`) -- `allow create` ganha 3º ramo: `request.auth.uid==uid && role=='tecnico' && get(convites/$(request.resource.data.convite))` bate workspaceId/usado/revogadoEm.
- `index.html:4378` (campo `tUid`) -- botão "Gerar código de convite" pra vaga sem uid; campo UID manual vira "Avançado: colar UID manualmente" (fallback).
- `index.html` -- novas `gerarConviteTecnico(tecnicoId)`/`revogarConviteTecnico(tecnicoId)`, mesmo padrão de erro-logado de `_vincularAcessoTecnico` (`index.html:4414`).
- `index.html:805` -- link vira "Sou prestador de serviço"; `criarContaTecnico()` (`index.html:1393`) intacto.
- `index.html:830` (`semAcessoBox`, hoje só UID readonly) -- vira form nome+código; nova `_consumirConviteTecnico(nome,codigo)` roda `runTransaction()` (lê convite, valida, escreve `members/{uid}` + atualiza convite na mesma transação); sucesso chama `_resolverWorkspace` de novo (`index.html:1196`).
- `index.html` -- reconciliação na tela Equipe/Config: lê `members` (role tecnico), cruza por `tecnicoId` gravado em `members/{uid}`, backfilla `uid`/`nome` em `tecnicos[]`, `saveTecnicos()` só se mudou algo.

## Tasks & Acceptance

**Execution:**
- [x] `firestore.rules` -- regras de `convites/{codigo}` + 3º ramo de `members/{uid}` create
- [x] `index.html` -- `gerarConviteTecnico`/`revogarConviteTecnico` + UI no card do técnico
- [x] `index.html` -- renomear link pra "Sou prestador de serviço"
- [x] `index.html` -- `semAcessoBox` vira form nome+código; `_consumirConviteTecnico` via `runTransaction`
- [x] `index.html` -- reconciliação `members`→`tecnicos[]` na tela Equipe
- [x] `index.html` -- relabel do campo UID manual como avançado/fallback

**Acceptance Criteria:**
- Given gestor gera convite pra vaga vazia, when prestador usa nome+código corretos, then entra sem o gestor colar nada.
- Given código já usado, when reusado, then rejeitado, nenhum `members/{uid}` novo criado.
- Given convite revogado, when prestador tenta usá-lo depois, then rejeitado.
- Given duas tentativas concorrentes com o mesmo código, when corridas ao mesmo tempo, then no máximo uma cria `members/{uid}` -- verificado no Emulator Suite.
- Given prestador se vincula sozinho, when gestor reabre Equipe, then vaga mostra `uid` preenchido sem ação manual.

## Spec Change Log

## Design Notes

Transação, não batch: consumo do convite (`members/{uid}` create + `convites/{codigo}` update) precisa ser `runTransaction()`. Um `.batch()` valida cada write contra o estado já commitado, sem ver as outras writes do mesmo batch — não impede duas contas consumindo o mesmo código quase juntas. Transação re-lê e falha/repete se o convite mudou entre leitura e escrita.

`convites/{codigo}` é coleção raiz, não `workspaces/{wsId}/data/...`: prestador não sabe o `wsId` até consumir o código — mesmo raciocínio de `userWorkspaces/{uid}` já ser raiz (AD-11).

Vínculo por `tecnicoId` (id da vaga), não por nome digitado -- evita ambiguidade entre nomes parecidos ou grafias diferentes.

## Verification

**Commands:**
- Firebase Emulator Suite (`@firebase/rules-unit-testing`) -- cenários de convite válido/usado/revogado/concorrência passando, sem regressão nos 33 testes já existentes

**Manual checks (sem CLI de app):**
- Como gestor, gerar convite numa vaga nova, copiar o código.
- Como prestador (conta separada), criar conta, colar nome+código, confirmar entrada direta sem UID manual.
- Reusar o mesmo código numa terceira conta -- confirmar rejeição.
- Revogar convite não usado, confirmar rejeição subsequente.
- Reabrir Equipe como gestor, confirmar que a vaga mostra o uid novo sem edição manual.

## Suggested Review Order

**Regra de autorização (o núcleo de segurança da story)**

- Novo ramo de `allow create` em `members/{uid}`: o próprio uid só cria seu membership como `tecnico` citando um convite válido pra ESTE workspace, nunca um campo de perfil livre.
  [`firestore.rules:65-75`](../../../../firestore.rules#L65-L75)

- Coleção `convites/{codigo}`: `allow get` (nunca `allow read`) bloqueia enumeração; `allow update` separa em dois ramos disjuntos (gestor revoga OU o próprio uid consome), cada um restrito aos campos que pode tocar.
  [`firestore.rules:82-108`](../../../../firestore.rules#L82-L108)

**Consumo atômico pelo prestador**

- `_consumirConviteTecnico()` -- `runTransaction()`, não `batch()`: lê o convite, valida, cria `members/{uid}` + `userWorkspaces/{uid}` e marca o convite usado na mesma transação -- é isso que dá o uso único de verdade sob concorrência (verificado no Emulator Suite).
  [`index.html:1442`](../../../../index.html#L1442)

**Correções da revisão (2 achados confirmados por múltiplos revisores independentes)**

- `removerTecnico()` agora revoga qualquer convite pendente antes de apagar a vaga -- sem isso, um código já emitido continuava redimível depois da vaga sumir (backdoor real).
  [`index.html:4729`](../../../../index.html#L4729) · helper [`index.html:4612`](../../../../index.html#L4612)

- `_reconciliarEquipe()` ganhou a mesma guarda de nome duplicado que o fluxo manual já tinha -- sem ela, o rename automático via convite podia fundir o histórico de OS de dois técnicos com nomes coincidentes.
  [`index.html:4414`](../../../../index.html#L4414)

**Geração e gestão do convite (lado do gestor)**

- `gerarConviteTecnico()` -- recusa gerar um segundo código vivo pra mesma vaga; código de 8 caracteres via `crypto.getRandomValues()` (não `Math.random()`, é um bearer secret).
  [`index.html:4557`](../../../../index.html#L4557) · [`index.html:4543`](../../../../index.html#L4543)

- `salvarTecnico()`, vínculo manual (fallback) -- também revoga um convite pendente ao vincular por UID colado, fechando o mesmo gap por outra porta.
  [`index.html:4682`](../../../../index.html#L4682)

**Peça de UI (fallback preservado, não removido)**

- `semAcessoBox` -- form nome+código é o caminho principal agora; UID manual vira "Avançado", recolhido por padrão.
  [`index.html:827`](../../../../index.html#L827)

- `openModalTecnico()`/`renderEquipeConfig()` -- botão "Gerar código de convite" por vaga vazia; UID manual movido pra dentro de um `<details>`.
  [`index.html:4475`](../../../../index.html#L4475) · [`index.html:4451`](../../../../index.html#L4451)
