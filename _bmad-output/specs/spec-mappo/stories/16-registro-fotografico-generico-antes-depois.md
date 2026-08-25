---
title: 'Registro fotográfico genérico (Antes/Depois) pra Ramos não-refrigeração'
type: 'feature'
created: '2026-08-25'
status: 'done'
review_loop_iteration: 1
baseline_commit: 'ace8815e1b607b75424b97cb4229fe5ee89567d9'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A etapa "Equipamentos" da execução de OS (marca/modelo + foto de Evaporadora/Condensadora por "Split N") é estrutural — não é só rótulo de texto — e ficou de fora da Story 15. Qualquer workspace não-refrigeração ainda vê essa etapa 100% AC-específica.

**Approach:** Refrigeração mantém 100% igual. Qualquer outro Ramo recebe a MESMA etapa, genericizada: "Item N" no lugar de "Split N", as 2 fotos por item viram "Antes"/"Depois" (texto fixo por ora), campos de marca/modelo somem da UI. Reaproveita a estrutura de dado já existente, só muda a exibição.

## Boundaries & Constraints

**Always:** Refrigeração (`ramoTemVRF()`) nunca muda de comportamento nesta story. Campos internos do dado (`fotoEvap`/`fotoCond`, array `equipamentos`) continuam com os MESMOS nomes pra qualquer Ramo — só o rótulo exibido muda, nunca o shape do dado (evita migração). "Antes"/"Depois" é texto fixo, não editável nesta story.

**Ask First:** Nenhuma — desenho já decidido com o proprietário nesta conversa.

**Never:** Tornar "Antes"/"Depois" editável (Non-goal do CAP-17, revisitar depois dos testes). Renomear os campos internos `fotoEvap`/`fotoCond` (quebraria dado já sincronizado). Tocar `firestore.rules`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Workspace Refrigeração | `ramoTemVRF()===true` | Tudo idêntico a hoje — "Split N", Evaporadora, Condensadora, marca, modelo | N/A |
| Workspace Predial ou customizado | `ramoTemVRF()===false` | "Item N", fotos "Antes"/"Depois", sem campos de marca/modelo | N/A |
| Gestor cria OS em workspace não-refrigeração | Campo "Quantidade de itens" | Aparece (não mais escondido), rótulo genérico | N/A |
| Execução de OS não-refrigeração | Técnico tira as 2 fotos de um item | Salva normalmente (mesma função de compressão), sem pedir marca/modelo | N/A |
| Card de OS / modal de detalhe / cabeçalho de execução | Workspace não-refrigeração | Badge de contagem sem "❄️", texto genérico ("N item(ns)") | N/A |
| Tela "Tarefas Adicionais" | Workspace não-refrigeração | Subtítulo usa o nome real do módulo, não "fora do Split e do VRF" | N/A |

</frozen-after-approval>

## Code Map

**Etapa de execução (técnico) — `index.html:6541-6627`:**
- `renderExecucao()` (`6550`) — título "2. Equipamentos" e subtítulo "Marca, modelo e foto das etiquetas de cada split" (`6567-6568`) viram condicionais a `ramoTemVRF()`. `equipTabs` (`6552`, rótulo "Split N") vira "Item N" pra não-refrigeração.
- `switchEquipTab()` (`6597-6614`) — campos `<div class="fg">` de Marca/Modelo (`6602-6603`) só renderizam quando `ramoTemVRF()`. Labels "📷 Etiqueta — Evaporadora"/"Condensadora" (`6604,6609`) viram "📷 Antes"/"📷 Depois" pra não-refrigeração — os `id`/`onchange`/campos internos (`fotoEvap`/`fotoCond`, `onEquipFoto(...,'evap'/'cond')`) continuam EXATAMENTE os mesmos, só o texto do `<label>` muda.
- `onEquipFoto()` (`6624`) — relabel da aba após foto salva ("✅ Split N" → "✅ Item N" condicional).
- Cabeçalho `page-desc` (`6556`, "❄️ N split(s)") vira condicional.

**Modal de detalhe (gestor) — `index.html:5500-5534`:**
- `equipHTML` (`5502-5511`) — mesmo tratamento: "Split N" → "Item N", Evaporadora/Condensadora → Antes/Depois, condicional a `ramoTemVRF()` (a variável já existe no escopo da função, `openDetalhe()`).
- Linha `5534` (`<label>Splits</label><div>❄️ N</div>`) — rótulo e emoji condicionais.

**Criação de OS — `index.html:5456`:**
- Campo `#oSplits` (hoje `${ramoTemVRF()?'<div>...Quantidade de splits...':''}`) — remove o `:''` (esconder inteiro); passa a sempre renderizar, com `<label>` condicional: "Quantidade de splits" (refrigeração) ou "Quantidade de itens" (outros Ramos). `criarOS()` (`5465+`) já lê `#oSplits` corretamente independente do rótulo — nenhuma mudança de lógica ali, só a visibilidade/rótulo do campo.

**Badges de contagem (3 lugares, mesmo padrão em cada):**
- Card de OS (`osCardHTML`, `~3399,5977`) e cabeçalho de execução (`6556`) — "❄️ N split(s)" vira condicional: refrigeração mantém, outros Ramos mostram "N item(ns)" sem emoji.

**Tarefas Adicionais:**
- `index.html:6280` — subtítulo fixo "Trabalhos personalizados fora do Split e do VRF" vira `` `Trabalhos personalizados fora do ${ramoTemVRF()?'Split':escapeHtml(moduloSplitAtual().nome)} e do VRF` `` (ou equivalente) — mesmo padrão condicional já usado por toda a Story 15.

## Tasks & Acceptance

**Execution:**
- [x] `index.html` -- execução de OS (técnico): título/subtítulo da etapa, rótulo "Split N"→"Item N", campos marca/modelo condicionais, labels Evaporadora/Condensadora→Antes/Depois -- tudo condicional a `ramoTemVRF()`
- [x] `index.html` -- modal de detalhe (gestor): mesmo tratamento no `equipHTML` e no rótulo "Splits"
- [x] `index.html` -- campo "Quantidade de splits"/"Quantidade de itens" sempre visível, rótulo condicional
- [x] `index.html` -- badges "❄️ N split(s)" (card de OS, cabeçalho de execução, modal de detalhe) condicionais
- [x] `index.html` -- "Tarefas Adicionais" usa `moduloSplitAtual().nome` pra não-refrigeração

**Acceptance Criteria:**
- Given um workspace de Refrigeração, when qualquer tela de execução/detalhe renderiza, then nada muda visualmente comparado a hoje.
- Given um workspace Predial ou customizado, when o técnico executa uma OS, then vê "Item N" com fotos "Antes"/"Depois", sem campos de marca/modelo.
- Given um workspace não-refrigeração, when o gestor cria uma OS, then o campo "Quantidade de itens" aparece (não mais escondido) e permite mais de 1 item.
- Given um workspace não-refrigeração, when o técnico registra as 2 fotos de um item, then o dado salva corretamente nos mesmos campos internos (`fotoEvap`/`fotoCond`), sem quebrar nenhuma leitura existente (PDF, relatório, etc.).

## Design Notes

Os campos internos (`fotoEvap`, `fotoCond`, o próprio array `equipamentos`) NUNCA mudam de nome nesta story — só o texto exibido ao lado deles. Isso evita qualquer migração de dado e mantém os poucos lugares que já leem esse array (ex.: geração de PDF, se houver) funcionando sem alteração. Se algum ponto de leitura desses campos fora dos já mapeados no Code Map for encontrado durante a implementação, aplicar o mesmo princípio (dado igual, rótulo condicional) em vez de reestruturar.

## Verification

**Manual checks (sem CLI/suíte de testes no projeto):**
- Criar e executar uma OS em workspace Refrigeração — confirmar zero diferença visual.
- Criar e executar uma OS em workspace Predial/customizado com 2+ itens — confirmar "Item 1"/"Item 2", fotos "Antes"/"Depois", sem marca/modelo.
- Conferir os 3 badges de contagem e a tela "Tarefas Adicionais" nos dois cenários de Ramo.

## Review Round

1 rodada de review (blind-hunter, proporcional ao tamanho da story — só exibição condicional, sem `firestore.rules`, sem novo shape de dado). 4 achados, todos aplicados pelo mesmo subagent implementador (mesmo contexto preservado via SendMessage):

1. Comentário acima de `#oSplits` (`~5474`) ainda dizia "campo escondido pra quem não é VRF" — desatualizado desde que a Story 16 tornou o campo sempre visível. Corrigido pra descrever o estado atual.
2. `switchEquipTab()` não tinha nenhum comentário explícito dizendo que `fotoEvap`/`fotoCond` nunca podem ser renomeados — risco de um dev futuro "limpar" os nomes ao ver "Antes"/"Depois" na tela. Adicionado comentário direto acima da função (`~6601-6603`).
3. Badge genérico ("N item(ns)") nos 3 lugares (`openDetalhe`, `secTec`, `renderExecucao`) estava sem ícone, com peso visual menor que o "❄️ N split(s)" da Refrigeração. Adicionado 📷 no lugar do ❄️.
4. Subtítulo da etapa 2 pra não-VRF era só "Foto de Antes e Depois de cada item" (aprovado inicialmente, mas fraco) — melhorado pra "Registre uma foto do item antes e depois do serviço", no mesmo tom instrucional do texto de Refrigeração ao lado.

Nenhum achado teve `defer`/`reject` — todos genuínos e de baixo risco, aplicados no mesmo patch round.

## Suggested Review Order

1. [index.html:6552-6560](../../../../index.html#L6552-L6560) — `renderExecucao()`: título/subtítulo/badge condicionais a `ramoTemVRF()`, ponto de entrada da etapa de execução.
2. [index.html:6601-6634](../../../../index.html#L6601-L6634) — `switchEquipTab()`/`onEquipFoto()`: o núcleo da story — labels condicionais, `fotoEvap`/`fotoCond` preservados, comentário anti-rename.
3. [index.html:5499-5537](../../../../index.html#L5499-L5537) — `openDetalhe()`: mesmo tratamento no modal do gestor (`equipHTML`, badge "Splits"/"Itens").
4. [index.html:5456,5474-5477](../../../../index.html#L5456) — `openModalOS()`/`criarOS()`: campo `#oSplits` sempre visível, rótulo condicional, guarda defensiva.
5. [index.html:6280](../../../../index.html#L6280) — `renderTarefasGestor()`: subtítulo dinâmico via `moduloSplitAtual().nome`.

**Baseline commit:** `ace8815e1b607b75424b97cb4229fe5ee89567d9`. `firestore.rules` confirmado intocado (`git diff --stat` vazio). Sintaxe de todos os blocos `<script>` verificada (`node -e` com `new Function`).
