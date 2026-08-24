---
title: 'Onboarding com Ramo e Template de Checklist'
type: 'feature'
created: '2026-08-23'
status: 'done'
review_loop_iteration: 0
baseline_commit: '8c2d63a5843f3d2988209a85530eac5477af2879'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O cadastro de empresa (Story 1) não pergunta o Ramo, e o checklist de OS (`CHECKLIST_BASE`/`CHECKLIST_MANUT`) é uma constante global fixa, específica de refrigeração — toda empresa nova herdaria um checklist que não é dela.

**Approach:** Cadastro passa a coletar o Ramo (Refrigeração/Climatização ou Manutenção Predial Geral — 2 Ramos do MVP). Cada Ramo é uma constante JS (mesmo padrão de `VRF_FASES`), clonada para dentro do workspace novo como um documento comum (`mappo_checklist_config`). `checklistDoTipo` passa a ler do clone do workspace, não mais da constante global direto. Gestor pode editar o próprio clone depois, numa tela nova em Configurações.

## Boundaries & Constraints

**Always:** Cadastro não avança sem Ramo selecionado. Pelo menos 2 Ramos com template pronto (Refrigeração/Climatização reaproveitando `CHECKLIST_BASE`/`CHECKLIST_MANUT` existentes; Manutenção Predial Geral com templates novos). Editar o checklist de uma empresa nunca afeta outra empresa nem a constante-fonte (`RAMO_TEMPLATES` nunca é mutado em memória, só clonado). Workspace criado antes desta story (Elite Ar, sem `mappo_checklist_config`) cai num fallback idêntico ao comportamento de hoje — sem regressão, sem migração forçada.

**Ask First:** Nenhum — esta story não toca `firestore.rules` nem faz deploy.

**Never:** Mais de 2 Ramos. Trocar o Ramo de um workspace depois de criado (assunção do SPEC: um workspace tem um Ramo pra sempre). Editor de checklist elaborado (reordenar por drag-and-drop, categorias) — só adicionar/remover/editar rótulo de item, no mesmo espírito cirúrgico de `renderEquipeConfig`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Cadastro sem Ramo | Formulário sem seleção | Bloqueia, toast pedindo o Ramo | N/A |
| Cadastro com Ramo "predial" | Nome empresa válido + Ramo selecionado | Workspace nasce com `ramo:'predial'` e `mappo_checklist_config` clonado de `RAMO_TEMPLATES.predial` | N/A |
| Gestor edita item do checklist | Remove um item, edita o rótulo de outro | Só o workspace dele muda; `RAMO_TEMPLATES` e outros workspaces intactos | N/A |
| Workspace sem `mappo_checklist_config` (Elite Ar, pré-Story-2) | `checklistConfig` local é `null` | `checklistDoTipo` usa fallback (`CHECKLIST_BASE`/`CHECKLIST_MANUT`) — comportamento idêntico ao de hoje | N/A |
| Nova OS criada normalmente | Gestor cria OS de qualquer tipo | Checklist vem do clone do workspace, não da constante global | N/A |

</frozen-after-approval>

## Code Map

- `index.html:1939-1948, 1951-1958` -- `CHECKLIST_BASE`/`CHECKLIST_MANUT`, viram o template-fonte do Ramo "Refrigeração/Climatização"
- `index.html:1961-1964` -- `ehManutencao`/`checklistDoTipo`: `checklistDoTipo` passa a ler do clone do workspace (`checklistConfig`), com fallback pras constantes globais
- `index.html:3854, 4011, 4680` -- 3 call sites de `checklistDoTipo(...)` (criação de OS nova, OS de manutenção agendada, reparo de checklist vazio) -- nenhum muda de assinatura, só o que `checklistDoTipo` lê por baixo
- `index.html:1967-1976` -- `corrigirChecklistSeVazio` -- usa `checklistDoTipo` internamente, sem mudança de lógica própria
- `index.html:1266-1310` -- `cadastrarEmpresa()` -- ganha leitura do Ramo selecionado, grava `ramo` no doc do workspace, clona o template escolhido pra `mappo_checklist_config` **antes** de `_resolverWorkspace`/`initSync` rodar (ver nota de seeding abaixo)
- `index.html:792-800` -- HTML de `#cadastroBox` -- ganha um `<select id="cadRamo">`
- `index.html:940-944` -- `SYNC_KEYS` -- ganha `'mappo_checklist_config'`
- `index.html:955, 957, 1345, 1348` -- `ITEM_LISTS`/`LEAF_MAPS`/`APPEND_LISTS`/`MERGE_MAPS` -- `mappo_checklist_config` **não** entra em nenhum (mesma categoria de `mappo_settings`/`mappo_vrf_obra`: objeto único, mais recente vence — `index.html:1409` e `1606-1616`)
- `index.html:1692-1704` (`fbSeedFromLocal`) -- só semeia uma chave se ela já existe em `localStorage`; `cadastrarEmpresa()` precisa gravar `mappo_checklist_config` localmente **antes** do primeiro `initSync()`, senão a chave nunca chega no Firestore
- Nenhuma tela de edição de checklist existe hoje (confirmado por busca) -- nova, no padrão de `renderEquipeConfig` (lista + modal)

## Tasks & Acceptance

**Execution:**
- [ ] `index.html` -- criar `RAMO_TEMPLATES` (registro `{refrigeracao, predial}`, cada um com `nome`/`instalacao`/`manutencao`) e os dois arrays novos `CHECKLIST_PREDIAL_BASE`/`CHECKLIST_PREDIAL_MANUT`
- [ ] `index.html` `#cadastroBox` -- adicionar `<select id="cadRamo">` com as 2 opções, obrigatório
- [ ] `index.html` `cadastrarEmpresa()` -- validar Ramo selecionado; gravar `ramo` no batch de `workspaces/{wsId}`; clonar o template escolhido (`JSON.parse(JSON.stringify(...))`, nunca a referência) para `checklistConfig` + `localStorage.setItem('mappo_checklist_config',...)` antes de `_resolverWorkspace`
- [ ] `index.html` `checklistDoTipo` -- ler de `checklistConfig` (variável de módulo carregada de `mappo_checklist_config`), com fallback pras constantes globais quando `checklistConfig` é `null`
- [ ] `index.html` -- nova tela "Checklist" em Configurações: lista os itens de `instalacao`/`manutencao` do workspace, permite adicionar/remover/editar rótulo; salva de volta em `checklistConfig`/`mappo_checklist_config`
- [ ] `index.html` `SYNC_KEYS` -- adicionar `'mappo_checklist_config'`

**Acceptance Criteria:**
- Given uma pessoa cadastrando empresa nova, when não seleciona Ramo, then o cadastro não avança.
- Given cadastro com Ramo "predial", when a empresa é criada, then `mappo_checklist_config` no Firestore do workspace contém os templates de Manutenção Predial Geral, não os de refrigeração.
- Given um gestor edita o checklist do próprio workspace, when outra empresa (de qualquer Ramo) consulta o template de origem, then nada mudou pra ela.
- Given o workspace da Elite Ar (criado antes desta story, sem `ramo`/`mappo_checklist_config`), when uma OS nova é criada, then o checklist usado é idêntico ao que já existia antes desta story (fallback), sem exigir recadastro.

## Design Notes

`RAMO_TEMPLATES` guarda os arrays-fonte; clonar sempre com `JSON.parse(JSON.stringify(...))` (nunca atribuir o array direto) — é o que garante que editar o clone de um workspace não muda a fonte nem vaza pra outro workspace (mesmo princípio do AD-4 da espinha, "depois de clonado, a cópia é autônoma").

`checklistConfig` é carregado uma vez no boot (mesmo padrão de `tecnicos`/`session`) e sincronizado como objeto único (sem merge por campo) — se dois dispositivos editarem o checklist ao mesmo tempo, o último a sincronizar vence; aceitável, mesmo comportamento que `mappo_settings` já tem hoje.

## Verification

**Manual checks (sem CLI/suíte de testes no projeto):**
- Em `http://localhost:5173`, cadastrar uma segunda empresa de teste com Ramo "Manutenção Predial Geral"; confirmar no Firestore (Console) que `mappo_checklist_config` tem os itens prediais, não os de refrigeração.
- Criar uma OS nessa empresa nova e confirmar que o checklist exibido é o predial.
- Editar um item do checklist e confirmar que a empresa Elite Ar (Ramo refrigeração) continua com o checklist de sempre, sem alteração.
- Recarregar a sessão da Elite Ar (workspace sem `mappo_checklist_config`) e confirmar que criar uma OS ainda funciona exatamente como antes desta story.

## Suggested Review Order

**Cadastro e clonagem do template por Ramo**

- Ponto de entrada do desenho: registro dos 2 templates do MVP e a função que resolve fallback quando o clone do workspace ainda não existe/chegou.
  [`index.html:2006`](../../../../index.html#L2006)

- `cadastrarEmpresa()` valida o Ramo selecionado e, após o batch commitar, clona `RAMO_TEMPLATES[ramo]` (nunca por referência) pra `checklistConfig` antes de `_resolverWorkspace` rodar.
  [`index.html:1278`](../../../../index.html#L1278)

- Novo campo obrigatório no formulário de cadastro.
  [`index.html:796`](../../../../index.html#L796)

**Correção pós-review: fallback deixa de assumir refrigeração**

- `_resolverWorkspace` agora lê `ramo` do doc do workspace (mesmo fetch que já lia `status`) e mantém `WORKSPACE_RAMO` vivo pela sessão — é o que permite o fallback abaixo acertar o Ramo certo mesmo antes do `checklistConfig` sincronizar.
  [`index.html:1160`](../../../../index.html#L1160)

- `_cacheWorkspace` ganhou o parâmetro `ramo`, pra sobreviver ao fallback offline.
  [`index.html:1197`](../../../../index.html#L1197)

- `checklistDoTipo` consulta `_fallbackChecklistRamo` (que usa `WORKSPACE_RAMO`) em vez de cair direto nas constantes de refrigeração quando `checklistConfig` ainda não chegou.
  [`index.html:2025`](../../../../index.html#L2025) · [`index.html:2032`](../../../../index.html#L2032)

- `_garantirChecklistConfig`/`_checklistCfgExibicao` usam o mesmo fallback ciente do Ramo, pra não persistir refrigeração por cima de um workspace predial só porque o gestor editou antes do primeiro sync.
  [`index.html:3727`](../../../../index.html#L3727) · [`index.html:3734`](../../../../index.html#L3734)

**Editor de checklist em Configurações**

- Tela nova, no espírito cirúrgico de `renderEquipeConfig`: lista + adicionar/remover/editar rótulo, sem reordenar nem categorias.
  [`index.html:3741`](../../../../index.html#L3741)

- Ações do editor — cada uma clona o objeto na primeira edição real, nunca no boot.
  [`index.html:3760`](../../../../index.html#L3760) · [`index.html:3771`](../../../../index.html#L3771) · [`index.html:3780`](../../../../index.html#L3780)

**Sincronização**

- `mappo_checklist_config` como objeto único (last-write-wins, sem merge por campo, mesma categoria de `mappo_settings`) — declaração da variável local e a entrada nova no mapa de re-render remoto.
  [`index.html:2016`](../../../../index.html#L2016) · [`index.html:1655`](../../../../index.html#L1655)

## Addendum A — Nome real da empresa substitui "Elite Ar" hardcoded

Descoberto no teste manual do usuário: ao testar o cadastro com Ramo "predial", a interface (menu lateral, PDF de relatório, mensagem de WhatsApp do link público, e a própria página pública de acompanhamento) continuava mostrando literalmente "Elite Ar" — herança do app ter nascido single-tenant, não coberta pelo Intent original desta story nem da Story 1.

**Decisão do usuário:** corrigir agora, como adendo, só a parte do nome (o vocabulário Split/VRF/campos de OS específicos de refrigeração — achado maior, ligado — fica registrado em `deferred-work.md` para uma conversa de desenho dedicada, ver Addendum B abaixo).

**O que mudou:**
- Novo `WORKSPACE_NOME` (mesmo ciclo de vida de `WORKSPACE_RAMO`): lido do doc do workspace em `_resolverWorkspace`, cacheado em `_cacheWorkspace`/`_lerCacheWorkspace` para o fallback offline.
  [`index.html:1161`](../../../../index.html#L1161) · [`index.html:1202`](../../../../index.html#L1202)
- Rótulo do menu lateral generalizado ("Sistemas Elite Ar" → "Sistemas").
  [`index.html:863`](../../../../index.html#L863)
- PDF de relatório (cabeçalho e rodapé) e o card "Sobre" em Configurações usam o nome real ou caem em "MAPPO" quando desconhecido.
  [`index.html:3576`](../../../../index.html#L3576) · [`index.html:3650`](../../../../index.html#L3650) · [`index.html:3700`](../../../../index.html#L3700)
- Mensagem de WhatsApp do link de acompanhamento usa o nome real.
  [`index.html:5268`](../../../../index.html#L5268)
- Payloads públicos (`pubPayloadOS`/`pubPayloadObra`) passam a carregar `empresa:WORKSPACE_NOME`; a página pública (`renderPublico`) exibe esse nome, com fallback gracioso pra links já publicados antes deste adendo (sem o campo).
  [`index.html:5170`](../../../../index.html#L5170) · [`index.html:5216`](../../../../index.html#L5216) · [`index.html:5407`](../../../../index.html#L5407)

**Verificação:** cadastro de teste real (Ramo predial, nome "Verificacao Adendo A") confirmou `WORKSPACE_NOME` resolvendo certo e o menu sem "Elite Ar"; `renderPublico` testado em memória (sem publicar no Firestore) nos dois cenários — com `empresa` e sem (payload legado) — ambos corretos, sem quebrar.

**Risco assumido, registrado em `deferred-work.md`:** o nome da empresa (texto livre do cadastro) agora entra sem escape em `innerHTML` na página pública (`d.empresa`) — mesma categoria de risco já existente em `d.titulo`/`d.servico`/etc. nessa mesma função, reservada pra Story 5 (AD-12). Não é ponto novo de exposição isolado, mas é um ponto novo que a varredura da Story 5 precisa cobrir (não estava nas 63 ocorrências da auditoria original).

## Addendum B — Vocabulário interno ainda fixo em refrigeração (registrado, não implementado)

Ainda visível após o Addendum A: menu ("Sistema Split"/"Sistema VRF"), painel, dropdown "Tipo de Serviço" (só opções de AC), campo "Quantidade de splits", checkboxes de módulo por técnico (❄️ Split / 🌡️ VRF) — nada disso varia por Ramo. Registrado em `deferred-work.md`.

**Direção que o usuário deu pra uma conversa futura de desenho:** poucas "áreas" padrão pra começar (2 a 4), cada uma definida em conjunto (usuário + Claude) já com tarefas/perguntas padrão prontas; se a área do gestor não estiver na lista, um campo livre permite digitar a área e responder um questionário padrão pra montar um relatório/checklist inicial editável — o gestor pode adicionar, remover ou substituir itens manualmente depois. Não implementado nesta sessão — fica para uma conversa dedicada de desenho antes de qualquer código, dado o tamanho (toca modelo de dados de OS, módulos de técnico, e possivelmente visibilidade do módulo VRF por Ramo).
