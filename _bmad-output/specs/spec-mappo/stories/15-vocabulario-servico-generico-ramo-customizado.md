---
title: 'Vocabulário de serviço genérico e editável por Ramo, + Ramo customizado no cadastro'
type: 'feature'
created: '2026-08-25'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'a6a7ccafdd91cb32bba3f83463327edfd6ade9d4'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** "Sistema Split", "Instalação Split" e "Quantidade de splits" são fixos em 9+ lugares do código pra QUALQUER Ramo — uma empresa Predial (ou qualquer Ramo futuro) vê vocabulário de ar-condicionado que não é dela. `PRECO_TEMPLATES.predial` hoje é cópia idêntica de `.refrigeracao`.

**Approach:** Refrigeração mantém tudo como está (nomes já bons). Qualquer outro Ramo — Predial existente ou um Ramo customizado digitado livremente no cadastro (opção nova "Outro, qual?") — recebe um pacote de vocabulário genérico e editável: rótulo de módulo, categorias de preço, dropdown "Tipo de Serviço" da OS. Mesmo padrão já usado pra checklist/preço (clone por workspace, accessor único, editável em Configurações).

## Boundaries & Constraints

**Always:** Refrigeração (`WORKSPACE_RAMO==='refrigeracao'` ou `null`, legado) nunca muda de comportamento nesta story. Dropdown "Tipo de Serviço" da OS e a tabela de preço usam a MESMA lista de categorias — nunca duas fontes que podem divergir. Ramo customizado nunca herda vocabulário de Refrigeração, nunca fica sem checklist (fallback genérico). Edição de rótulo/categoria em Configurações nunca afeta outro workspace.

**Ask First:** Nenhuma — desenho já decidido com o proprietário nesta conversa.

**Never:** Sugestão automática/IA de nomenclatura (Non-goal do CAP-16). Reescrever o checklist da Predial (já é razoavelmente genérico, fora de escopo). Tocar `firestore.rules` (é vocabulário/template, não regra de acesso).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Workspace Refrigeração (existente) | `WORKSPACE_RAMO==='refrigeracao'` | Tudo idêntico a hoje — "Sistema Split", "Instalação Split", "Quantidade de splits" visível | N/A |
| Workspace Predial (existente) | `WORKSPACE_RAMO==='predial'` | Rótulo/categorias genéricos, com hint de renomear; "Quantidade de splits" some do formulário de OS | N/A |
| Cadastro escolhe "Outro, qual?" | Texto livre no campo de Ramo | Workspace nasce com o mesmo pacote genérico da Predial; nunca sem checklist | Nome vazio → bloqueia, mesmo padrão de outros campos obrigatórios |
| Gestor edita o rótulo do módulo em Configurações | Workspace não-refrigeração | Nome novo aparece em todo lugar que hoje mostra "Sistema Split" (sidebar, dashboard, topo da tela, checkbox de técnico) | N/A |
| Gestor edita categoria de preço | Qualquer Ramo | Dropdown "Tipo de Serviço" da criação de OS reflete a mudança na hora (mesma fonte) | N/A |

</frozen-after-approval>

## Code Map

**Vocabulário do módulo ("Sistema Split" → genérico):**
- Novo `moduloConfig={nome,desc}` clonado por workspace no cadastro (mesmo padrão de `checklistConfig`/`precoConfig`, `index.html:2388-2456`) + accessor único `moduloSplitAtual()` (fallback: refrigeração usa `{nome:'Sistema Split',desc:'Instalação e serviço de splits'}`, qualquer outro Ramo usa um default genérico com hint "renomeie com sua atividade específica" — texto exato a critério de quem implementar).
- Grep `Sistema Split` no arquivo (9 ocorrências confirmadas: sidebar `index.html:913`, dashboard `2590,3118`, `VIEW_META.splits` `2901`, página `3411`, checkbox técnico `4907,4937`, card módulo `4943` é VRF não Split — conferir cada uma) — todas passam a ler `moduloSplitAtual()`. `VIEW_META.splits` (objeto estático) é atualizado/reatribuído no momento em que o Ramo resolve (boot) e sempre que `moduloConfig` for salvo, não lido direto como função.
- Nova UI em Configurações (mesma área de `renderPrecoConfig()`/checklist) pra editar `moduloConfig.nome`/`.desc`, só exibida quando `!ramoTemVRF()` (Refrigeração não precisa, nome já é o certo).

**Preço e tipo de serviço:**
- `PRECO_TEMPLATES.predial` (`index.html:2442-2449`) deixa de ser cópia de `.refrigeracao` — ganha categorias genéricas próprias com hint de renomear. Ramo customizado reusa esse MESMO array (nunca o de refrigeração) via `_fallbackPrecoRamo()` (`index.html:2463-2465`) — hoje só checa `PRECO_TEMPLATES[WORKSPACE_RAMO]`, ajustar pra cair no genérico quando a chave não existir e o Ramo não for refrigeração.
- `oTipo` (dropdown "Tipo de serviço" da criação de OS, `index.html:5287-5288`, hoje HTML fixo) passa a renderizar `<option>` a partir de `_precoCfgExibicao()` (`index.html:2474`, já existente) — mesma fonte da tabela de preço, garantindo que nunca divirjam.
- Campo "Quantidade de splits" (`index.html:5296`) só renderiza quando `ramoTemVRF()` for verdadeiro (mesmo gate já usado pro módulo VRF, `index.html:1005`).

**Checklist pra Ramo customizado:**
- `_fallbackChecklistRamo()` (`index.html:2397-2401`) — hoje cai em `CHECKLIST_BASE`/`CHECKLIST_MANUT` (refrigeração) quando `RAMO_TEMPLATES[WORKSPACE_RAMO]` não existe. Ajustar: só cai nos constantes de refrigeração quando `WORKSPACE_RAMO` é literalmente `null` (legado pré-Story-2); qualquer Ramo customizado (string não-vazia, não reconhecida) cai no checklist da Predial (`RAMO_TEMPLATES.predial`) — mesmo espírito já descrito na Assumption do SPEC ("Template genérico mais próximo").

**Cadastro (Ramo customizado):**
- `cadastroBox`/`#cadRamo` (`index.html:820-825`) ganha `<option value="outro">Outro, qual?</option>`; selecionar revela um `<input>` de texto livre (mesmo padrão de mostrar/esconder campo condicional já usado em outras telas).
- `cadastrarEmpresa()` (`index.html:1360+`) — quando `ramo==='outro'`, usa o texto digitado (slugificado só pro nome de exibição livre, o valor salvo em `workspaces/{wsId}.ramo` é a string digitada tal qual, não uma chave de `RAMO_TEMPLATES`) — clona checklist/preço/módulo do pacote genérico (Predial), nunca do de refrigeração.

## Tasks & Acceptance

**Execution:**
- [x] `index.html` -- `moduloConfig` clonado por workspace + `moduloSplitAtual()` + UI de edição em Configurações
- [x] `index.html` -- as ~9 ocorrências de "Sistema Split" migradas pro accessor (grep de verificação ao final: zero ocorrências fixas fora do fallback de refrigeração)
- [x] `index.html` -- `PRECO_TEMPLATES.predial` ganha categorias genéricas próprias (não mais cópia de refrigeração); `_fallbackPrecoRamo()` ajustado
- [x] `index.html` -- `oTipo` (dropdown Tipo de Serviço) renderiza a partir de `_precoCfgExibicao()`
- [x] `index.html` -- "Quantidade de splits" só aparece quando `ramoTemVRF()`
- [x] `index.html` -- `_fallbackChecklistRamo()` cai no checklist da Predial pra Ramo customizado, só cai no de refrigeração pro caso legado (`WORKSPACE_RAMO===null`)
- [x] `index.html` -- cadastro ganha "Outro, qual?" + campo de texto livre; `cadastrarEmpresa()` clona o pacote genérico pro Ramo customizado

**Acceptance Criteria:**
- Given um workspace de Refrigeração, when qualquer tela renderiza, then nada muda visualmente comparado a hoje.
- Given um workspace Predial (existente, já em produção), when o gestor abre Financeiro ou cria uma OS, then vê categorias genéricas (não mais "Instalação Split"), com indicação de que pode renomear.
- Given um gestor cadastra empresa escolhendo "Outro, qual?" e digita um Ramo, when o cadastro conclui, then o workspace nasce com checklist, preço e rótulo de módulo genéricos-editáveis, nunca vazios.
- Given um gestor renomeia o rótulo do módulo em Configurações, when navega pelo app, then o nome novo aparece em toda tela que hoje mostra o nome fixo.
- Given o gestor edita uma categoria de preço, when abre a criação de OS, then o dropdown "Tipo de Serviço" mostra a categoria já com o nome novo.

## Design Notes

Ramo customizado nunca vira uma nova chave em `RAMO_TEMPLATES`/`PRECO_TEMPLATES` — ele usa o MESMO conteúdo genérico que a Predial passa a usar. Evita precisar hardcodar um template novo pra cada Ramo que aparecer (motivo explícito do proprietário: "visando que brevemente entrará outras empresas de ramos diferentes").

`VIEW_META.splits` é um objeto estático hoje (`index.html:2901`), lido em `nav()` via lookup direto — mais barato que virar uma função chamada toda vez. Reatribuir seus 2 valores no momento certo (boot pós-resolução de Ramo, e de novo se o gestor salvar `moduloConfig`) preserva essa performance sem precisar reescrever `nav()`.

## Verification

**Manual checks (sem CLI/suíte de testes no projeto):**
- Testar os 3 casos de Ramo (Refrigeração, Predial existente, customizado novo) lado a lado, conferindo cada uma das 9 telas que hoje mostram "Sistema Split".
- Editar o rótulo do módulo e uma categoria de preço em Configurações, confirmar reflexo imediato em sidebar/dashboard/dropdown de OS.
- Cadastrar uma empresa com Ramo customizado, confirmar checklist não fica vazio.

## Suggested Review Order

**Achado crítico da revisão (confirmado por 3 revisores independentes)**

- `renderSplits()` -- filtro por substring "split" só se aplica quando `ramoTemVRF()`; qualquer outro Ramo mostra todas as OS. Sem isso, a própria tela do módulo ficava sempre vazia pra Predial/customizado.
  [`index.html:3520`](../../../../index.html#L3520)

**Segurança do Ramo customizado (confirmado por 2 revisores)**

- `_ramoCustomInvalido()` -- valida ANTES de qualquer escrita no Firebase: whitelist de caracteres, nomes reservados ('refrigeracao'/'predial'/'outro'), chaves perigosas de `Object.prototype` ('constructor', '__proto__' etc). Sem isso, digitar "refrigeracao" herdava o VRF de verdade.
  [`index.html:1378`](../../../../index.html#L1378)

**Vocabulário genérico (o núcleo da story)**

- `moduloSplitAtual()`/`_moduloDefaultParaRamo()` -- accessor único; default neutro pra Ramo não-refrigeração, sem instrução de "renomear" vazando pro técnico.
  [`index.html:2543`](../../../../index.html#L2543) · [`index.html:2554`](../../../../index.html#L2554)

- `_fallbackChecklistRamo`/`_fallbackPrecoRamo`/`_templateRamoFallback` -- só caem no conteúdo de refrigeração quando `WORKSPACE_RAMO` é literalmente `null` (legado); Ramo customizado cai no pacote genérico da Predial.
  [`index.html:2418`](../../../../index.html#L2418) · [`index.html:2489`](../../../../index.html#L2489) · [`index.html:4599`](../../../../index.html#L4599)

- `oTipo` (dropdown Tipo de Serviço) lê `_precoCfgExibicao()` -- mesma fonte da tabela de preço, nunca diverge; guarda contra ficar vazio se o gestor apagar todas as categorias.
  [`index.html:5402`](../../../../index.html#L5402)

**Cadastro**

- `cadRamo` ganha "Outro, qual?"; `cadastrarEmpresa()` clona o pacote genérico (nunca o de refrigeração) pro Ramo customizado.
  [`index.html:821`](../../../../index.html#L821)
