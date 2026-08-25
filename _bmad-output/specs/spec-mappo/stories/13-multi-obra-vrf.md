---
title: 'Multi-obra no VRF'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 0
baseline_commit: '1bd5effea75b2a41ee80dbbed77c4bf849c91318'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `vrfObra` é um objeto único por workspace (`mappo_vrf_obra`, last-write-wins) — uma empresa que roda duas obras VRF ao mesmo tempo não tem como, hoje o app só sabe de "a obra".

**Approach:** `vrfObra` (objeto único) vira `vrfObras` (lista, `ITEM_LISTS` por id — mesmo padrão de `mappo_os`, AD-5 preservado). Gestor cria/seleciona a obra numa tela nova de lista; toda função que hoje lê a variável global `vrfObra` passa a ler `vrfObraAtual()` (obra selecionada), mesmo padrão de accessor único já usado em `vrfFasesAtuais()`/`precoConfig`. Técnico só vê as obras que o gestor atribuiu a ele (decisão confirmada com o Paulo).

## Boundaries & Constraints

**Always:** A obra real já em uso (Elite Ar) migra automaticamente pra 1ª entrada da lista nova, sem perda de dado e sem ação manual. Migração é NÃO-DESTRUTIVA por desenho -- lê `mappo_vrf_obra` (singular) e cria `mappo_vrf_obras` (plural) novo, nunca apaga/sobrescreve o documento singular original (é o próprio plano de rollback: reverter o commit basta, o código antigo continua lendo a chave intacta). Implementação em etapas com checkpoint humano entre elas: (1) modelo de dado + migração, revisado e testado isoladamente antes de seguir; (2) navegação/UI de seleção de obra; (3) acesso por técnico por obra. Export manual da obra atual da Elite Ar antes de publicar em produção, como reforço extra. `vrfProgresso`/`vrfFotos`/`vrfFotosMeta`/`vrfNotas` continuam `LEAF_MAPS` particionados por `andarId` (sem adicionar nível de `obraId`) — só o gerador de id de andar precisa virar globalmente único (hoje `'a'+Date.now()`, colide entre obras). `removerEtapaVrf` (purga de índice ao remover etapa do template) precisa varrer TODAS as obras, não só a selecionada. Workspace com exatamente 1 obra (caso comum logo após a migração) pula a tela de lista e entra direto nela — zero fricção nova pra quem só tem uma.

**Ask First:** Nenhuma — decisão de acesso por técnico já resolvida (atribuição por obra, não booleano único). Qualquer outro gap real → HALT e perguntar, não inventar.

**Never:** Não toca `firestore.rules` (nova `SYNC_KEY` cai na regra genérica já existente). Não resolve o risco de tamanho de documento Firestore de `vrfFotos` crescer mais rápido com várias obras — aceito e documentado como deferred (mesma categoria já aceita da migração pra Firebase Storage). Não constrói fluxo de excluir obra (lista só cresce, mesma política de `mappo_os`). Não adiciona orçamento/prazo/custo por obra (Non-goal do CAP-14). Não faz backfill retroativo de `obraId` em check-ins/relatórios antigos.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Workspace com a obra antiga (pré-story) | `mappo_vrf_obra` existe, `mappo_vrf_obras` não | Migra automaticamente pra lista de 1 item no primeiro boot pós-story | N/A |
| Workspace com 1 obra só (comum, pós-migração) | `vrfObras.length===1` | `nav('vrf')` entra direto na obra, sem tela de lista | N/A |
| Gestor cria uma 2ª obra | Nome novo (+ endereço opcional) | Nova entrada na lista, id globalmente único | Nome vazio → bloqueia, mesmo padrão de outros cadastros |
| Gestor remove uma etapa do template (Configurações) | 2+ obras com andares usando aquela etapa | Progresso/fotos/notas daquele índice purgados em TODAS as obras | N/A |
| Técnico sem obra atribuída abre VRF | `t.modulos.vrfObras` vazio/ausente | Cai no estado "sem obra liberada", sem erro | Mensagem clara, não tela em branco |
| Técnico com 2 obras atribuídas | `t.modulos.vrfObras.length>1` | Vê seletor pra escolher em qual obra está atuando agora | N/A |
| Dois andares de obras diferentes geram id no mesmo milissegundo | Corrida real (baixa probabilidade, já existia risco menor com 1 obra) | Ids não colidem (gerador globalmente único) | N/A |

</frozen-after-approval>

## Code Map

**Modelo de dados:**
- `index.html:2090-2092` (`let vrfObra=...`) — vira `let vrfObras=[]` (lista), nova `SYNC_KEY`/`ITEM_LISTS` `mappo_vrf_obras` (chave `id`, mesmo padrão de `mappo_os` — `index.html:1018`). Migração one-shot no boot: se `mappo_vrf_obra` (singular) existir e `mappo_vrf_obras` (plural) não, envolve o objeto antigo numa lista `[{...antigo,id:'obra_migrada'}]`.
- **Achado na investigação, não estava no Code Map original:** toda referência à chave `mappo_vrf_obra` (singular) como STRING -- não como variável -- também precisa virar `mappo_vrf_obras`: `PUB_KEYS` (~`index.html:1104`) e o mapa de `reRender` de `fbOnRemoteChange` (~`index.html:1798`). Um grep por `\bvrfObra\b` sozinho não pega essas duas (são string literal, não identificador), então a verificação final da story precisa incluir também `grep -n "mappo_vrf_obra[^s]"` (aspas simples/duplas, singular sem o "s" de plural).
- **Achado na investigação, não estava no Code Map original:** a página pública (`gerarLinkObra`, `revogarLink('obra',...)`, `pubPayloadObra` -- `index.html:6291-6446`) lê `andar.pubToken`/`andar.pubExpira` de dentro de `(vrfObra.andares||[]).find(...)` -- precisa virar `vrfObraAtual()` igual todo o resto, senão link público/republicação automática quebram silenciosamente depois do rename.
- Novo `let vrfObraAtualId=null` (analogia direta a `mapaPainelAberto`, Story 10) + accessor `function vrfObraAtual(){return vrfObras.find(o=>o.id===vrfObraAtualId)||null;}` — todo ponto listado na investigação que hoje lê `vrfObra` direto (grep por `\bvrfObra\b`, ~50 ocorrências, `index.html:2124-6438`) passa a ler `vrfObraAtual()`.
- Gerador de id de andar (`index.html:3809`, `'a'+Date.now()`) — trocar por algo colisão-segura entre obras (ex.: `'a'+Date.now()+'_'+Math.random().toString(36).slice(2,6)`).

**Navegação/seleção de obra:**
- Nova tela "Obras" reaproveitando o padrão de card-lista de `renderVRFandares()` (`index.html:3607`) — criar/selecionar obra. `getNavItems()` (`index.html:2496-2525`) e `renderView()` (`index.html:2708-2820`, casos `vrf*`) ganham o gate "obra selecionada?" no mesmo padrão já usado pro gate `ramoTemVRF()`.
- `renderBemVindoGestor()`/`cardVRFdash()`/`renderTecnicoHome()` (`index.html:2859-2893`, `2409-2436`) — cards de atalho hoje fazem `nav('vrf')` direto; passam a resolver a obra (única → direto; 1+ → lista) antes de entrar.
- `vrfTemAtividade()`/`cardVRFdash()`/`vrfProgGeral()` (`index.html:2840,2875,2156`) — hoje assumem "a obra"; dashboard agrega across `vrfObras` (ex.: "N obras ativas").

**Acesso por técnico:**
- `t.modulos.vrf` (booleano, `index.html:2510-2511,4560-4564`) vira `t.modulos.vrfObras` (lista de ids; vazio/ausente = sem VRF, mesmo efeito do `false` de hoje). Migração: técnico com `vrf:true` hoje recebe todas as obras existentes no momento da migração (não perde acesso).
- Tela de Equipe (card/modal do técnico, `index.html:4451,4475` da Story 11) ganha os checkboxes de obra, só quando o workspace tem VRF e mais de 1 obra.
- Técnico com 2+ obras atribuídas (`renderVRFtecnico`, `index.html:3228`) ganha seletor de obra atual, mesmo padrão do lado gestor.

**Companheiras que NÃO mudam de shape (continuam `LEAF_MAPS`/`APPEND_LISTS` por `andarId`, só o id vira globalmente único):**
- `vrfProgresso`/`vrfFotos`/`vrfFotosMeta`/`vrfNotas` — nenhuma mudança estrutural.
- `vrfCheckins`/`vrfRelatorios` (`index.html:3212-3221,3521-3526`) — cada entrada nova ganha campo `obraId` (histórico antigo fica sem, aceito).

**Purga cross-obra:**
- `removerEtapaVrf` (`index.html:4264-4295`) — laço de purga passa de `vrfObra.andares` pra `vrfObras.flatMap(o=>o.andares)`.

## Tasks & Acceptance

**Execution:**
- [ ] `index.html` -- `vrfObra`→`vrfObras` (lista/`ITEM_LISTS`) + migração automática da obra existente + `vrfObraAtual()` accessor
- [ ] `index.html` -- gerador de id de andar globalmente único
- [ ] `index.html` -- tela "Obras" (criar/listar/selecionar), auto-entrada quando só existe 1
- [ ] `index.html` -- todo ponto de leitura de `vrfObra` migrado pra `vrfObraAtual()` (grep de verificação: zero ocorrências de `vrfObra\b` fora da declaração/migração ao final)
- [ ] `index.html` -- `t.modulos.vrf`→`t.modulos.vrfObras` + UI de atribuição na tela Equipe + migração dos técnicos existentes
- [ ] `index.html` -- `vrfCheckins`/`vrfRelatorios` ganham `obraId` nas entradas novas
- [ ] `index.html` -- `removerEtapaVrf` purga em todas as obras, não só a atual
- [ ] `index.html` -- dashboards (`cardVRFdash`, home do gestor/técnico) agregam por várias obras

**Acceptance Criteria:**
- Given o workspace da Elite Ar (obra real já em uso) atualiza pra esta story, when o gestor abre o VRF pela primeira vez depois, then vê a mesma obra de sempre, sem perda de progresso/fotos/notas/check-ins.
- Given um workspace com 2+ obras, when o gestor navega pro VRF, then escolhe explicitamente qual obra antes de ver painel/andares/mapa/fotos/relatórios.
- Given um técnico atribuído só à Obra A, when ele abre o VRF, then não vê nenhum dado da Obra B.
- Given o gestor remove uma etapa do template de checklist, when isso afeta obras diferentes, then o progresso/fotos/notas daquele índice são purgados em todas, não só na obra aberta no momento.

## Design Notes

`vrfProgresso`/`vrfFotos`/`vrfFotosMeta`/`vrfNotas` deliberadamente NÃO ganham um nível `obraId` — o `andarId` já é o particionamento real (`LEAF_MAPS`, grupo=andarId) e, uma vez que os ids de andar sejam globalmente únicos (não só únicos dentro de 1 obra), essas 4 estruturas continuam corretas sem nenhuma mudança de shape. Menos superfície tocada, menos risco de regressão nos 4 mecanismos de sync já estáveis.

Risco aceito e não resolvido aqui: `vrfFotos`/`vrfFotosMeta` são documentos Firestore únicos por workspace com fotos em base64 inline — mais obras acumulando fotos no mesmo documento aproxima do teto de 1MB do Firestore mais rápido do que hoje. Mesma categoria de risco já registrada em `deferred-work.md` (migração pra Firebase Storage) — esta story não particiona por obra, só documenta que o risco cresce mais rápido agora.

## Verification

**Manual checks (sem CLI/suíte de testes no projeto):**
- Testar a migração num workspace com a obra real da Elite Ar (ou uma cópia dos dados) antes de publicar — confirmar que nada some.
- Criar uma 2ª obra, confirmar isolamento total de progresso/fotos/notas/check-ins/relatórios entre as duas.
- Atribuir um técnico a só uma das duas obras, confirmar que ele não alcança a outra por nenhum caminho (nav direto incluso).
- Remover uma etapa do template com 2 obras usando fases, confirmar purga nas duas.
- Conferir que um workspace com só 1 obra (a maioria hoje) não ganhou nenhuma tela nova no caminho — zero fricção.

## Suggested Review Order

**Migração (o ponto mais sensível — dado real de produção)**

- Migração não-destrutiva `mappo_vrf_obra`→`mappo_vrf_obras`: a chave singular nunca é apagada/sobrescrita — é o próprio plano de rollback.
  [`index.html:2103`](../../../../index.html#L2103)

- Mesmo princípio aplicado à migração por técnico (`t.modulos.vrf`→`t.modulos.vrfObras`): quem tinha `vrf:true` recebe todas as obras existentes no momento da migração, nunca perde acesso.
  [`index.html:2147`](../../../../index.html#L2147)

**Isolamento entre obras (correção pós-review, o ponto mais importante depois da migração)**

- `_vrfPertenceObra()`/`_vrfPertenceObraAtual()` — critério único de "este registro é desta obra?", usado em todo lugar que hoje filtra check-ins/relatórios. Sem isso, Mapa e Relatórios de uma obra vazavam dado de outras (achado por 2 revisores independentes).
  [`index.html:2141`](../../../../index.html#L2141)

- `republicarAtivos()` -- percorre todas as obras, não só a selecionada na sessão; `pubPayloadObra()` resolve a obra dona de cada andar sozinho. Sem isso, links públicos de obras não-selecionadas expiravam silenciosamente.
  [`index.html:6767`](../../../../index.html#L6767)

**Isolamento por técnico (a novidade real desta story: restrição dentro do mesmo workspace)**

- `vrfObrasPermitidas()`/`vrfObrasDoTecnico()` -- gestor vê tudo, técnico só o atribuído; usado pelo gate central de navegação.
  [`index.html:2155`](../../../../index.html#L2155)

- `vrfSelecionarObra()` -- defesa em profundidade: nunca troca pra uma obra fora do permitido, mesmo via chamada direta.
  [`index.html:3833`](../../../../index.html#L3833)

**Navegação/seleção de obra**

- `vrfResolverObraAtual(permitidas)` -- 1 obra resolve sozinha (zero fricção); 2+ sem seleção cai na tela "Obras".
  [`index.html:2118`](../../../../index.html#L2118)

- Gate em `renderView()`/`getNavItems()`, mesmo padrão do gate de Ramo já existente.
  [`index.html:2839`](../../../../index.html#L2839)

**Criação/edição de obra**

- `vrfCriarObra()` -- guard de gestor-only + nome duplicado; `vrfSalvarObra()` -- endereço editável depois da criação + mesmo guard de nome.
  [`index.html:3817`](../../../../index.html#L3817) · [`index.html:4071`](../../../../index.html#L4071)
