---
title: 'Aba Financeira por serviço e prestador'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 0
baseline_commit: '04b387ab8d9515ceb0a51bb762bffee9483e0c4b'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Não existe hoje nenhum campo monetário no app — nem na OS, nem nos prestadores. Gestor não tem como registrar quanto cada serviço vale nem quanto já pagou/deve a cada prestador.

**Approach:** Tabela de preço editável por tipo de serviço, clonada por Ramo no cadastro (mesmo padrão do checklist, AD-4). Valor vira campo da própria OS (pré-preenchido pela tabela, ajustável), visível só-leitura pro prestador dela. Nova aba "Financeiro" no menu (só gestor) mostra a tabela + a hierarquia Serviço → Prestador → valores/status, mais um bloco de notas livre pra adiantamentos.

## Boundaries & Constraints

**Always:** Tabela de preço é por Ramo (`WORKSPACE_RAMO`), mesmo padrão de `RAMO_TEMPLATES`/`checklistConfig` — clonada uma vez, editável depois, sem afetar outros workspaces. Prestador só vê o valor das próprias OS, nunca o de outro prestador nem o bloco de notas. Workspace sem `precoConfig` (anterior a esta story) continua funcionando normalmente — ausência não bloqueia nada, só significa "sem pré-seleção de valor ainda".

**Ask First:** Nenhum — não toca `firestore.rules` (valor é mais um campo em `mappo_os`, já regido pela regra existente de `isMember`/`isAtivo`; aba Financeiro é gate de UI, mesmo padrão de Configurações não ser mostrada a técnico).

**Never:** Cálculo de imposto, integração com processador de pagamento, exportação fiscal — só registro manual. Mudar `ITEM_LISTS`/o motor de merge (AD-5) — valor é só mais um campo em `os`, sem chave de merge nova.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gestor edita tabela de preço | Ajusta valor de um tipo de serviço | Próxima OS desse tipo pré-preenche com o valor novo; OS já criadas não mudam retroativamente | N/A |
| Gestor lança valor numa OS | Abre detalhe da OS, define valor + status | Prestador dessa OS passa a ver o valor (só leitura) | N/A |
| Prestador abre sua OS | OS com valor lançado | Vê o valor, não consegue editar | N/A |
| Workspace sem tabela de preço (pré-story) | Abre aba Financeiro pela 1ª vez | Tabela vazia/genérica, editável a partir daí, sem quebrar nada | N/A |
| Nota de adiantamento | Gestor lança "adiantei R$200 pro João" | Entra no bloco de notas, nunca soma no total pago/a pagar por OS | N/A |
| Técnico tenta acessar Financeiro | Item de menu | Nunca aparece pro perfil técnico | N/A |

</frozen-after-approval>

## Code Map

- `index.html:950-955` -- `SYNC_KEYS` -- adicionar `'mappo_preco_config'`
- `index.html:1553-1571` -- `_aplicarNaMemoria` -- `case'mappo_preco_config':precoConfig=val;break;`
- `index.html:2012-2043` -- `RAMO_TEMPLATES`/`checklistConfig`/`_fallbackChecklistRamo`/`checklistDoTipo` -- padrão de referência a replicar pra preço (`PRECO_TEMPLATES`, `precoConfig`, fallback por `WORKSPACE_RAMO`)
- `index.html:3741-3773` -- `_templateRamoFallback`/`_garantirChecklistConfig`/`_checklistCfgExibicao`/`renderChecklistConfig` -- padrão de tela editável a replicar (`_garantirPrecoConfig`, `renderPrecoConfig`)
- `index.html:1284, 1318-1319` -- `cadastrarEmpresa()` -- clonar `PRECO_TEMPLATES[ramo]` pra `precoConfig` do mesmo jeito que já clona o checklist
- `index.html:4009-4029` -- `criarOS()` -- adicionar `valor:null, valorStatus:null` ao objeto `os`; pré-preencher `valor` a partir de `precoConfig`/`PRECO_TEMPLATES` pelo `tipo` escolhido
- `index.html:4032-4092` -- `openDetalhe(id)` -- novo campo de valor + status (edição, só gestor)
- `index.html:4325-4336` -- `secTec()` -- exibir valor (só leitura) no card da OS do próprio prestador, mesmo padrão dos outros `os-meta-i`
- `index.html:863-879` -- `sidebar-nav` -- novo item `data-view="financeiro"`
- `index.html:2411-2418` -- `aplicarMenuTecnico()` -- adicionar `[data-view="financeiro"]` à lista escondida do técnico
- `index.html:2316-2331, 2420-2452` -- `VIEW_META`/`renderView` -- entrada `financeiro` + `case'financeiro':c.innerHTML=renderFinanceiro();break;`
- Novo: `mappo_financeiro_notas` em `SYNC_KEYS` + `APPEND_LISTS` (mesmo padrão de `mappo_vrf_checkins`) -- bloco de notas de adiantamento, nunca perde entrada

## Tasks & Acceptance

**Execution:**
- [ ] `index.html` -- `PRECO_TEMPLATES` (constante por Ramo) + `precoConfig` + `savePrecoConfig`/`_garantirPrecoConfig`/`_fallbackPrecoRamo` (mesmo padrão do checklist)
- [ ] `index.html` `cadastrarEmpresa()` -- clona `PRECO_TEMPLATES[ramo]` pra `precoConfig` na criação do workspace
- [ ] `index.html` `criarOS()`/`criarOSdeManut()` -- campos `valor`/`valorStatus` no objeto `os`, pré-preenchidos por `precoConfig` conforme o `tipo`
- [ ] `index.html` `openDetalhe()` -- UI de edição de valor/status (só gestor)
- [ ] `index.html` `secTec()` -- valor só-leitura no card da OS do prestador
- [ ] `index.html` -- item de menu "Financeiro" (só gestor) + `renderFinanceiro()`: tabela de preço editável (topo) + hierarquia Serviço → Prestador → valores/status (pago/a pagar/total) + bloco de notas de adiantamento (`mappo_financeiro_notas`, append-only)

**Acceptance Criteria:**
- Given o gestor ajusta a tabela de preço de um tipo de serviço, when cria uma OS nova desse tipo, then o valor vem pré-preenchido com o valor da tabela.
- Given o gestor lança/ajusta o valor de uma OS específica, when o prestador dela abre sua lista de OS, then vê o valor, sem conseguir editar.
- Given um workspace sem `precoConfig` (anterior a esta story), when o gestor abre a aba Financeiro pela primeira vez, then a tabela aparece vazia/editável, sem erro.
- Given o gestor registra uma nota de adiantamento, when confere o total pago/a pagar de um prestador, then a nota não altera esse total.
- Given um técnico está logado, when olha o menu lateral, then nunca vê "Financeiro".

## Design Notes

`precoConfig`/`PRECO_TEMPLATES` seguem exatamente o padrão já estabelecido por `checklistConfig`/`RAMO_TEMPLATES` (Story 2): clone por `JSON.parse(JSON.stringify(...))`, nunca por referência; fallback por `WORKSPACE_RAMO` quando o workspace ainda não tem `precoConfig`; objeto único em `SYNC_KEYS` (fora de `ITEM_LISTS`/`LEAF_MAPS`/`APPEND_LISTS`/`MERGE_MAPS`, last-write-wins).

`valor`/`valorStatus` são só mais dois campos no objeto `os` — `mappo_os` já é `ITEM_LISTS` com merge por `id`, nenhuma mudança no motor de merge.

Categorias exatas da tabela de preço dentro de cada Ramo ficam a critério da implementação — usar como base os tipos já existentes no dropdown "Tipo de Serviço" (`Instalação Split`, `Manutenção Preventiva`, `Manutenção Corretiva`, `Visita Técnica` pra Refrigeração) e o equivalente do Ramo Predial, mais uma opção de categoria livre se um valor não bater com nenhuma pré-definida.

## Verification

**Manual checks (sem CLI/suíte de testes no projeto):**
- Editar a tabela de preço, criar uma OS do tipo alterado, confirmar pré-preenchimento.
- Lançar valor numa OS, logar como o prestador dela, confirmar que aparece só-leitura.
- Logar como outro prestador, confirmar que não vê o valor da OS do primeiro.
- Registrar uma nota de adiantamento, confirmar que não entra na soma de pago/a pagar.
- Conferir que o menu do técnico nunca mostra "Financeiro".

## Suggested Review Order

- Tabela de preço por Ramo -- mesmo padrão de `RAMO_TEMPLATES`/`checklistConfig`.
  [`index.html:2082`](../../../../index.html#L2082)

- `financeiroResumo` -- 3 baldes (pago/a pagar/sem status) depois do code review, pra uma OS recém-criada não contar como "a pagar" antes do gestor confirmar.
  [`index.html:3971`](../../../../index.html#L3971)

- `renderFinanceiro` -- tabela + hierarquia + notas de adiantamento, tela só-gestor.
  [`index.html:4051`](../../../../index.html#L4051)

- `salvarValorOS` -- edição de valor/status na OS, com o aviso correto quando o valor digitado é inválido (não mais um "sucesso" silencioso).
  [`index.html:4371`](../../../../index.html#L4371)

- Correção pós-review: `_mergeLista` (reaproveitada por 3 chaves agora) ganhou `valor` na chave de dedup, pra não perder nota de adiantamento em sync concorrente.
  [`index.html:1463`](../../../../index.html#L1463)
