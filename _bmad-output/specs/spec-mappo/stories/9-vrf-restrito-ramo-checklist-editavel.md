---
title: 'VRF restrito ao Ramo Refrigeração + checklist editável'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 0
baseline_commit: '04b387ab8d9515ceb0a51bb762bffee9483e0c4b'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O módulo Sistema VRF aparece pra qualquer Ramo hoje — o gate existente (`aplicarMenuTecnico`) só olha o módulo liberado do técnico, nunca o Ramo do workspace. `VRF_FASES` também é uma constante fixa, não editável, sem equivalente ao `checklistConfig` da Story 2.

**Approach:** Esconder Sistema VRF (menu, navbar, cards de atalho, módulo de técnico) pra workspaces cujo Ramo não é Refrigeração/Climatização. "Tarefa Adicional" (já existe, já é genérica) vira o item principal desses workspaces, relabelado "Criar Tarefas". Checklist do VRF vira editável via um clone por workspace (`vrfFasesConfig`, mesmo padrão de `checklistConfig`), preservando a divisão por fase.

## Boundaries & Constraints

**Always:** Workspace com `WORKSPACE_RAMO==null` (anterior à Story 2, ex.: Elite Ar) continua vendo VRF normalmente — mesmo fallback já usado por `checklistConfig`/`precoConfig`, sem regressão. `vrfFasesConfig` clonado nunca muta `VRF_FASES` (a constante-fonte).

**Ask First:** Nenhum — não toca `firestore.rules`.

**Never:** Achatar a estrutura de fases do VRF — editável é só adicionar/remover/renomear etapa dentro de cada fase, fases continuam fixas (10 fases, `f1`..`f10`) nesta story. Construir um sistema de "obra"/projeto novo pra outros Ramos — eles usam Tarefa Adicional como está.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Workspace Ramo Predial | Gestor/técnico logam | Nunca veem "Sistema VRF" (menu, navbar, cards, módulo de técnico) | N/A |
| Workspace Ramo Refrigeração | Idem | VRF continua exatamente como hoje, mais o checklist editável | N/A |
| Workspace sem Ramo (pré-Story-2) | Idem | VRF continua visível (mesmo fallback de `checklistConfig`) | N/A |
| Gestor edita etapa de uma fase do VRF | Configurações → Checklist VRF | Só aquele workspace muda; outros workspaces e `VRF_FASES` intactos | N/A |
| Ramo Predial | Menu lateral | Mostra "Criar Tarefas" (Tarefa Adicional relabelada) no lugar do VRF | N/A |

</frozen-after-approval>

## Code Map

**Gate por Ramo (7 pontos, todos condicionam por `WORKSPACE_RAMO==null||WORKSPACE_RAMO==='refrigeracao'`):**
- `index.html:2512` -- `aplicarMenuTecnico()` -- `m.vrf?'':'none'` vira `(m.vrf&&ramoTemVRF)?'':'none'`
- `index.html:2201-2202` -- `entrarApp()` (ramo gestor) -- depois do `forEach` que reabre tudo, esconder `[data-view="vrf"]` explicitamente se Ramo não tem VRF
- `index.html:2313-2319, 2325` -- `getNavItems()` (navbar, contexto técnico)
- `index.html:2327-2334` -- `getNavItems()` (navbar, contexto gestor)
- `index.html:2592-2597` -- `renderBemVindoGestor()` -- card de atalho VRF no dashboard
- `index.html:4110-4115` -- `openModalTecnico()` -- checkbox/card de módulo VRF (não faz sentido liberar um módulo que o workspace não usa)
- `index.html:871-873` -- sidebar "Tarefa Adicional" -- relabela texto pra "Criar Tarefas" quando Ramo não tem VRF (mantém "Tarefa Adicional" pra quem tem)

**Checklist editável (introduz uma camada nova, mesmo padrão de `checklistConfig`):**
- `index.html:1905-1917` -- `VRF_FASES`/`VRF_TOTAL_ETAPAS` -- vira a fonte-padrão (nunca mutada), não o dado ativo
- Novo: `vrfFasesConfig` (clonado por `JSON.parse(JSON.stringify(VRF_FASES))` no cadastro e sob demanda, mesmo padrão de `_garantirChecklistConfig`) + `vrfFasesAtuais()` (accessor, fallback pra `VRF_FASES` quando `vrfFasesConfig` é `null`)
- **14 call sites que leem `VRF_FASES` direto, precisam trocar por `vrfFasesAtuais()`:** `vrfProgAndar` (1963), `vrfProgFase` (1973), `vrfRenderMissaoPainel` (3019), `vrfRenderAndarPainel` (3054), `renderVRFgestor` (3247), `renderVRFandares` (3319/3327), `renderVRFfotos` (3418), `vrfVerFotoDetalhe` (3452), `vrfMissaoResumo` (3478), `vrfRenderMissaoSteps` (3562), `vrfAbrirAndar` (3601), `gerarPDFandar` (3708, 3739), `pubPayloadObra` (5531)
- Novo: tela de edição (Configurações → "Checklist VRF"), mesmo padrão de `renderChecklistConfig`/`editarItemChecklist` da Story 2, mas por fase (lista de fases, cada uma expande pra lista de etapas editável)

## Tasks & Acceptance

**Execution:**
- [ ] `index.html` -- gate por Ramo nos 7 pontos listados acima
- [ ] `index.html` -- `vrfFasesConfig` + `_garantirVrfFasesConfig()` + `vrfFasesAtuais()` (mesmo padrão de `checklistConfig`)
- [ ] `index.html` -- clonar `VRF_FASES` pra `vrfFasesConfig` em `cadastrarEmpresa()` quando Ramo é refrigeração (mesmo momento do clone do checklist/preço)
- [ ] `index.html` -- trocar as 14 leituras diretas de `VRF_FASES` por `vrfFasesAtuais()`
- [ ] `index.html` -- tela de edição do checklist VRF (por fase, adicionar/remover/renomear etapa)

**Acceptance Criteria:**
- Given um workspace de Ramo diferente de refrigeração, when qualquer usuário (gestor ou técnico) navega o app, then "Sistema VRF" nunca aparece em nenhum dos pontos de entrada (menu, navbar, cards, módulos de técnico).
- Given um workspace sem Ramo definido (pré-Story-2), when navega o app, then VRF continua exatamente como funcionava antes desta story.
- Given o gestor de um workspace refrigeração edita uma etapa de uma fase, when confere outro workspace do mesmo Ramo, then o outro workspace não mudou.
- Given uma etapa é removida de uma fase, when o progresso da obra é recalculado, then `VRF_TOTAL_ETAPAS`/progresso refletem a fase editada, não a original.

## Design Notes

Maior escopo do pacote desta rodada (como já sinalizado no `SPEC.md`) — os 14 call sites de `VRF_FASES` são leitura direta espalhada, não um ponto único; a troca por `vrfFasesAtuais()` é mecânica (mesma assinatura de retorno, array de fases) mas toca muitas funções. Se preferir, dá pra quebrar em duas entregas menores (gate por Ramo primeiro, checklist editável depois) — decisão pra você no CHECKPOINT 1, já que esta story tem `spec_checkpoint: true`.

`WORKSPACE_RAMO==null` cai no mesmo fallback de "mostra VRF" que `_fallbackChecklistRamo`/`_templateRamoFallback` já usam pra checklist/preço — consistência com o padrão já estabelecido, sem regressão pra Elite Ar.

## Verification

**Manual checks (sem CLI/suíte de testes no projeto):**
- Logar num workspace Predial (gestor e técnico) — confirmar que VRF não aparece em lugar nenhum.
- Logar num workspace Refrigeração — confirmar que nada mudou, e que o checklist editável funciona (editar etapa, ver refletido no progresso).
- Logar num workspace sem Ramo (Elite Ar) — confirmar que VRF continua igual a antes desta story.

## Suggested Review Order

- `ramoTemVRF()` -- fonte única de verdade do gate, `null` cai no fallback de refrigeração (sem regressão pra Elite Ar).
  [`index.html:963`](../../../../index.html#L963)

- Correção pós-review, o ponto mais importante: `renderView()` passou a checar `ramoTemVRF()` na própria renderização da tela (não só nos atalhos de menu) -- um `nav('vrf')` direto não bypassa mais o gate.
  [`index.html:2590`](../../../../index.html#L2590) · [`index.html:2602`](../../../../index.html#L2602)

- `vrfFasesAtuais()` -- accessor que os ~15 pontos de leitura de `VRF_FASES` passaram a usar.
  [`index.html:1966`](../../../../index.html#L1966)

- Editor de checklist VRF -- só a última etapa de cada fase pode ser removida (evita deslocar índice de progresso já registrado), com purga do próprio registro pra não vazar em uma etapa nova adicionada depois.
  [`index.html:4041`](../../../../index.html#L4041)

- Tela de edição por fase.
  [`index.html:4003`](../../../../index.html#L4003)
