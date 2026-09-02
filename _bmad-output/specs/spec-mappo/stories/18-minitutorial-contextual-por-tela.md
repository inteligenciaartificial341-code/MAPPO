---
title: 'Minitutorial contextual por tela'
type: 'feature'
created: '2026-09-01'
status: 'done'
review_loop_iteration: 2
baseline_commit: '85d92049a8be8eeb7ac412be58a5635dae76df4e'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O tour de topo (Story 17) só explica o NOME de cada seção — não o que tem dentro dela. Testando em produção, o proprietário também achou um bug real: no modo "Desktop" (padrão do gestor), a barra de navegação de cima fica escondida (`display:none`) e vira um menu flutuante — o tour de topo mira só a barra escondida, então 5 dos seus passos nunca aparecem nesse modo.

**Approach:** Corrige o motor do tour pra abrir o container certo (sidebar ou menu flutuante) onde quer que o alvo esteja. Em cima disso, cada tela ganha seu próprio mini-tour, disparando sozinho na primeira vez que o usuário entra nela (via `nav(view)`), explicando os sub-elementos daquela tela especificamente. Reaproveita o MESMO motor de spotlight/card da Story 17 — não é mecanismo novo.

## Boundaries & Constraints

**Always:** Mini-tour de uma view só dispara depois que o usuário já viu/pulou o tour de topo (`_temTourVisto()` verdadeiro) — evita colisão com o `nav()` inicial que o próprio `entrarApp()` dispara antes do tour de topo rodar. Flag "já visto" por mini-tour é chaveada por `uid` E por nome da view (`mappo_tutorial_<uid>_view_<nome>_visto`), independente da flag do tour de topo. Profundidade proporcional ao que a tela de fato tem — nunca inventar passo em tela com só 1 botão óbvio. Qualquer texto sobre o módulo genérico usa `moduloSplitAtual()` dinamicamente.

**Ask First:** Nenhuma — desenho já decidido com o proprietário nesta conversa.

**Never:** Criar um segundo motor de tour — estender `_tourIniciar`/`_tourAvancar`/`_tourMostrarPasso`/`_tourReposicionar`/`_tourFechar` já existentes. Adicionar botão de reabrir dedicado pros mini-tours nesta rodada. Cobrir a tela de execução de uma OS específica (fora de escopo — já tem instrução própria na tela).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Primeira vez na view (tour de topo já visto) | Flag da view ausente | Mini-tour da view dispara ao fim de `nav(view)` | N/A |
| Segunda visita à mesma view | Flag da view já gravada | Mini-tour NÃO dispara de novo | N/A |
| Primeira navegação do app (nav inicial do `entrarApp()`, antes do tour de topo rodar) | `_temTourVisto()` falso | Mini-tour da view NÃO dispara (só o tour de topo, na sequência) | N/A |
| Modo Desktop (menu flutuante fechado), alvo do tour de topo dentro dele | `#floatMenuOptions` sem `.show` | Tour abre o menu flutuante sozinho, spotlight aparece corretamente | N/A |
| Tour termina (Concluir/Pular/clique fora) com o menu flutuante aberto por ele | — | Menu flutuante fecha junto (mesmo princípio já aplicado à sidebar) | N/A |
| View sem mini-tour definido (Clientes, Manutenções — se decidido não valer a pena) | `nav('clientes')` | Nada acontece, sem erro | N/A |

</frozen-after-approval>

## Code Map

**Fix do menu flutuante — `index.html:5573-5602` aprox. (`_tourElVisivel`), `5539` (`_tourElExiste`), `5683` (`_tourFechar`):**
- `_tourElVisivel(sel)` hoje só trata `el.closest('.sidebar')`. Generalizar: `sel` passa a aceitar lista separada por vírgula (`.navbtn[data-nav="ordens"], .float-menu-opt[data-nav="ordens"]`); tenta cada candidato em ordem via `document.querySelector`, abre o container certo do primeiro que existir no DOM (sidebar → `openSidebar()`, já existe; menu flutuante → `toggleFloatMenu(true)` se `el.closest('#floatMenuOptions')` e `!opts.classList.contains('show')`, `index.html:2939` `toggleFloatMenu`), mede visibilidade, senão tenta o próximo candidato.
- Menu flutuante anima (`floatOptIn`, CSS) — mesmo tratamento de "reposicionar após a transição" já usado pra sidebar (`_tourAdiarReposicaoAposAbrirSidebar`, `index.html:5553`) generalizar ou duplicar pro menu flutuante.
- `_tourElExiste(sel)` (sem efeito colateral, `index.html:5539`) tenta os mesmos candidatos SEM abrir nada — só mede o que já está visível.
- `_tourFechar(visto)` (`index.html:5683`) já chama `closeSidebar()` incondicional — adicionar `toggleFloatMenu(false)` incondicional também (seguro mesmo se não estava aberto).
- `montarFloatMenu(items)` (`index.html:2922`) repopula `#floatMenuOptions` do zero a cada abertura via `getNavItems()` — o `querySelector` do candidato `.float-menu-opt[data-nav="x"]` só encontra o elemento DEPOIS do menu ter sido aberto (`toggleFloatMenu(true)` chama `montarFloatMenu` internamente, `index.html:2947`).

**Motor de mini-tour por view — reaproveita as mesmas funções de `index.html:5510-5700` (zona "TUTORIAL GUIADO"), generalizando de "um array fixo por perfil" pra "um array por view":**
- Novo mapa `TOUR_VIEWS_GESTOR = {ordens: [...], config: [...], financeiro: [...], vrf: [...], mapa: [...], splits: [...], tarefas: [...], clientes: [...], manutencoes: [...]}` e `TOUR_VIEWS_TECNICO = {...}` (escopo do técnico a critério de quem implementar, ver Design Notes).
- Nova `_temTourViewVisto(view)`/`_gravarTourViewVisto(view)` — mesmo padrão de `_temTourVisto()`/`_gravarTourVisto()` (`index.html:5510-5524`), chave `'mappo_tutorial_'+session.uid+'_view_'+view+'_visto'`.
- Novo gancho em `nav(view)` (`index.html:3100-3116`): ao final (depois de `window.scrollTo(0,0)`), chamar algo como `_tourEntrarView(view)` que só prossegue se `_temTourVisto()` (tour de topo já visto) E existe um array de passos pra essa `view` E `!_temTourViewVisto(view)` — então chama o motor existente (`_tourPassos=arr;_tourIndice=-1;_tourAvancar(1);`, mas gravando a flag correta ao fechar — precisa generalizar `_tourFechar(visto)` pra saber qual flag gravar, ex. um `_tourContextoAtual` guardando `'topo'` ou o nome da view).

**Alvos por view (gestor) — seletores levantados por investigação real do código:**
- `ordens` (`renderOrdens`, `index.html:3429`): filtros `button[onclick="setFilter('todas')"]` / `'pendente'` / `'andamento'` / `'revisao'` / `'concluida'` / `'atrasada'`; botão `button[onclick="openModalOS()"]` (dentro do container da view, pra não colidir com o mesmo botão em `splits`).
- `config` (`renderConfig`, `index.html:4641`): `button[onclick="openModalTecnico()"]` (Equipe); área do card Checklist (`#novoItem_instalacao` ou o card pai); card Checklist VRF só se `ramoTemVRF()` (`.vrf-fase-cfg` primeiro, ou o card pai); card Nome do módulo só se `!ramoTemVRF()` (`#moduloNome`); card Notificações (`input[onchange*="toggleSet('notifPlataforma'"]` ou o card pai); card Google Agenda (`input[onchange*="toggleSet('googleAgenda'"]`); card Sincronização (`button[onclick="syncManual()"]`).
- `financeiro` (`renderFinanceiro`, `index.html:5064`): card tabela de preço (`renderPrecoConfig`, `#novaCategoriaPreco` ou card pai), card hierarquia (`renderFinanceiroHierarquia`, sem ação — mirar o card pai), card notas (`#notaValor` ou `button[onclick="adicionarNotaFinanceira()"]`).
- `vrf` (`renderVRFgestor`, `index.html:3998`): `.navbtn[data-nav="vrf-andares"]`, `[data-nav="vrf-mapa"]`, `[data-nav="vrf-fotos"]`, `[data-nav="vrf-relatorios"]` (sub-navegação, `getNavItems` `index.html:2893-2902`); `button[onclick="vrfConfigObra()"]`; `button[onclick="vrfConfigMissao()"]`; `button[onclick="nav('vrf-obras')"]` só se `vrfObras.length>1`.
- `mapa` (`renderMapa`, `index.html:3547`): `#mapaBox` (`index.html:3568`); card Equipe e card Histórico (`index.html:3571-3578`) **não têm id hoje — adicionar `id="mapaCardEquipe"`/`id="mapaCardHistorico"` nos `<div class="card">` que os envolvem, mudança aditiva sem risco**.
- `splits`, `tarefas`, `clientes`, `manutencoes`: 1 passo cada — `button[onclick="openModalOS()"]` (dentro do container de `splits`), `button[onclick="openModalTarefa()"]`, `button[onclick="openModalCliente()"]`, `button[onclick="openModalManut()"]`.

**Lado do técnico:** views mais simples (`home`, `ordens`, `tarefas`, `manutencoes`, `vrf` — este último a tela de execução por obra, não o painel do gestor). Levantamento exato de quais ganham mini-tour e com quantos passos cada, a critério de quem implementar — mesmo princípio de profundidade proporcional. Tela de execução de uma OS específica (`renderExecucao`) fica FORA de escopo.

## Tasks & Acceptance

**Execution:**
- [ ] `index.html` -- generalizar `_tourElVisivel`/`_tourElExiste` pra aceitar lista de seletores separada por vírgula, abrindo o menu flutuante (`toggleFloatMenu`) quando o alvo estiver lá dentro e fechado, mesmo tratamento já dado à sidebar
- [ ] `index.html` -- `_tourFechar` fecha o menu flutuante que o próprio tour tenha aberto, incondicional (seguro mesmo se não abriu)
- [ ] `index.html` -- atualizar os 5 passos afetados do `TOUR_GESTOR` (dashboard/ordens/manutencoes/clientes/mapa) pra seletor combinado navbtn+float-menu-opt
- [ ] `index.html` -- `_temTourViewVisto`/`_gravarTourViewVisto`, gancho em `nav(view)` disparando o mini-tour certo (só depois do tour de topo já visto)
- [ ] `index.html` -- arrays `TOUR_VIEWS_GESTOR`/`TOUR_VIEWS_TECNICO` com os passos de cada view listada no Code Map, textos instrutivos (não só o nome do elemento) no mesmo padrão de detalhe já estabelecido na Story 17
- [ ] `index.html` -- ids novos em `renderMapa()` pros cards Equipe/Histórico

**Acceptance Criteria:**
- Given o gestor no modo Desktop (padrão), when o tour de topo chega num passo da barra escondida, then o menu flutuante abre sozinho e o spotlight aparece no lugar certo.
- Given um usuário que já viu o tour de topo, when ele entra pela primeira vez numa view com mini-tour definido, then o mini-tour daquela view dispara sozinho.
- Given a mesma view visitada de novo, when o usuário navega pra ela outra vez, then o mini-tour NÃO dispara de novo.
- Given o `nav()` inicial disparado pelo próprio `entrarApp()` antes do tour de topo ter rodado, when essa navegação acontece, then nenhum mini-tour de view dispara nesse momento (só o tour de topo, na sequência).
- Given uma view sem mini-tour definido (ex.: Clientes, se decidido não precisar), when o usuário entra nela, then nada quebra, sem erro de console.

## Design Notes

O `_tourFechar(visto)` atual grava sempre a MESMA flag (`_gravarTourVisto`, do tour de topo) — precisa saber qual flag gravar conforme o contexto ativo (tour de topo vs. mini-tour de qual view). Uma variável de módulo tipo `_tourContextoAtual` (`null`/`'topo'` ou o nome da view) resolve isso sem duplicar o motor inteiro.

Escopo exato do lado do técnico (quais views, quantos passos) fica a critério de quem implementar — as telas dele são mais simples que as do gestor (confirmado por leitura rápida: não têm sub-aba nem card com múltiplas ações como Configurações/Financeiro têm). Não forçar profundidade que a tela não tem.

Textos devem seguir o mesmo padrão de detalhe já estabelecido na Story 17 (explicar o que tem E como usar, não só repetir o nome) — ver os arrays `TOUR_GESTOR`/`TOUR_TECNICO` já existentes como referência de tom e profundidade.

## Verification

**Manual checks (sem CLI/suíte de testes no projeto):**
- Playwright real: gestor no modo Desktop, disparar o tour de topo, confirmar que os 5 passos antes escondidos agora aparecem (menu flutuante abre sozinho).
- Navegar pela primeira vez em cada view com mini-tour definido, confirmar que dispara; navegar de novo, confirmar que não dispara.
- Confirmar que o `nav()` inicial do `entrarApp()` não dispara mini-tour de view antes do tour de topo.
- Testar em pelo menos 2 Ramos (Refrigeração e um genérico) pra confirmar que o texto do módulo genérico não hardcoda vocabulário errado.
- Sintaxe de todos os blocos `<script>` verificada.

## Review Round

2 rodadas. `firestore.rules` ficou com diff vazio nas duas (confirmado via `git diff --stat` repetidamente) — nenhuma mudança de regra nesta story.

**Rodada 1** — 3 revisores em paralelo (blind-hunter, edge-case-hunter, verification-gap) contra o diff cheio da implementação inicial:

1. FALSO POSITIVO (blind-hunter): alegou uma chave extra sobrando em `_tourFechar` que quebraria a sintaxe do resto do arquivo. Rejeitado após verificação independente — `node -e` com `new Function(src)` por bloco `<script>` passou limpo antes e depois da alegação, e a leitura direta de `index.html:5936-5957` confirma exatamente uma chave de fechamento de função, corretamente posicionada. Não repassado ao implementador.
2. REAL (edge-case-hunter, verificado): `entrarApp()` aplica `desktop-clean` incondicionalmente independente de `session.perfil` (`index.html:2717`) — o `TOUR_TECNICO` (tour de topo do técnico) nunca tinha ganhado o fallback `.float-menu-opt[data-nav="x"]` aplicado ao `TOUR_GESTOR`, então os 5 passos do técnico podiam falhar silenciosamente em qualquer tela desktop. Corrigido: os 5 seletores do `TOUR_TECNICO` passaram a `'.navbtn[data-nav="x"], .float-menu-opt[data-nav="x"]'`, mesmo padrão do gestor.
3. REAL (verification-gap, bem evidenciado): um mini-tour aberto ficava com o spotlight desalinhado se `fbOnRemoteChange` (listener de sincronização remota do Firestore) chamasse `renderView(currentView)` direto, por fora do fluxo de `nav()` — nada reposicionava o spotlight depois desse re-render. Afetava praticamente toda view com mini-tour, já que o mapa de re-render de `fbOnRemoteChange` cobre `mappo_os→ordens`, `mappo_tecnicos→config,mapa,vrf`, `mappo_preco_config→financeiro`, etc. Corrigido dividindo `renderView(v)` em `_renderViewConteudo(v)` (corpo original, renomeado, lógica intacta) + um `renderView(v)` fino que chama `_renderViewConteudo(v)` e reposiciona o tour se houver um ativo — como todo chamador (`nav()`, `fbOnRemoteChange`, botão "Atualizar" do mapa) já usa o nome `renderView`, o fix se aplica sem tocar nenhum call site.

Achados 2 e 3 corrigidos pelo mesmo subagent implementador (contexto preservado via `SendMessage`).

**Verificação independente própria (não veio de nenhum revisor)** — testando manualmente com Playwright real (não jsdom/raciocínio), encontrei 2 problemas reais que nenhum revisor tinha sinalizado:

4. Alvos abaixo da dobra em views altas com múltiplos cards (Financeiro, Configurações) nunca eram rolados pra dentro da viewport — `_tourReposicionar` só lia `getBoundingClientRect()`, nunca chamava `scrollIntoView()`. A Story 17 nunca expôs isso porque todos os alvos dela viviam na sidebar/navbar, sempre visível por design. Corrigido: `_tourReposicionar` ganhou um parâmetro `scrollPrimeiro`, `true` só na primeira exibição de um passo (chamado de `_tourMostrarPasso`) — `el.scrollIntoView({block:'center'})` antes de ler o rect final, sem `behavior:'smooth'` (lê o rect no mesmo tick). Reposições subsequentes (resize/scroll, reabertura de sidebar/menu flutuante, re-render remoto do achado 3) chamam sem argumento — nunca forçam scroll de novo.
5. Confirmado (relembrado de mais cedo nesta mesma sessão): `window.X` não é alias de um `let X` de nível de módulo neste `<script>` clássico — só leitura/escrita via identificador nu (`session`, `_tourContextoAtual`) funciona dentro de `page.evaluate`. Não é um bug do produto, é uma característica do próprio `<script>` sem módulo — documentado aqui só porque invalidou a primeira tentativa do meu próprio harness de teste, não do código da story.

**Rodada 2** — verificação independente dos 3 patches (achados 2-4), sem novo review dispatch (patches pequenos e localizados, proporcional ao risco):
- Leitura direta de cada patch no arquivo final (não só o diff) confirmando estrutura, guard clauses e comentários explicativos.
- `node -e` com `new Function(src)` por bloco `<script>`: limpo.
- Playwright real, 3 cenários direcionados exatamente aos 3 patches, viewport 1280×800, `entrarApp()` real (não simulado) com `desktop-clean` de fato aplicado:
  - (a) Mini-tour de Financeiro, card `#finHierarquiaCard` empurrado artificialmente 2400px abaixo da dobra — `scrollIntoView` trouxe o alvo real pra dentro da viewport e o spotlight ficou alinhado com a posição pós-scroll. ✅
  - (b) Tour de topo do técnico em `desktop-clean` (confirmado `.navbar{display:none}` de fato aplicado): os 4 passos com alvo existente (Início/Ordens/Tarefas/Manutenções) apareceram via fallback do menu flutuante — nenhum pulado silenciosamente. VRF ficou de fora porque o técnico de teste não tinha obra atribuída, mesmo skip já validado na Story 17 (não é regressão). ✅
  - (c) Mini-tour de Financeiro aberto no passo 1 (`#novaCategoriaPreco`), então `renderView(currentView)` chamado direto (simulando `fbOnRemoteChange`) — confirmado que o nó DOM antigo de fato foi substituído por um novo (marcador `data-instancia-antiga` sumiu), o tour permaneceu no mesmo passo lógico, e o spotlight resincronizou com as coordenadas do NOVO nó, não ficou preso nas coordenadas do nó removido. ✅
  - Zero erros de console/página em todo o roteiro (3 sessões distintas, `_tourFechar` entre cenários).
- Único ruído durante a verificação: com um intervalo curto (120ms) entre cliques, o passo "Manutenções" do cenário (b) às vezes não aparecia — não é regressão do patch, é o mecanismo pré-existente de reposicionamento adiado após abrir o menu flutuante (`_tourAdiarReposicaoAposAbrirFloatMenu`, herdado da Rodada 1) precisando do seu fallback de 320ms; com 400ms de margem o resultado ficou determinístico nas repetições. Nenhuma mudança de código motivada por isso — é característica já existente, não nova.

Nenhum achado adicional na Rodada 2.

## Suggested Review Order

**Fallback de menu flutuante (achado 2 + fix original do Code Map)**

- `_tourElExiste`: checa candidatos separados por vírgula sem efeito colateral (usada só pra decidir Voltar/Concluir).
  [`index.html:5715`](../../../../index.html#L5715)

- `_tourElVisivel`: mesma lista de candidatos, mas abre o container certo (sidebar ou menu flutuante) do primeiro que existir.
  [`index.html:5768`](../../../../index.html#L5768)

- `TOUR_TECNICO`: os 5 seletores agora incluem o fallback `.float-menu-opt[data-nav="x"]`.
  [`index.html:5575`](../../../../index.html#L5575)

**Mini-tour por view (capacidade nova)**

- `TOUR_VIEWS_GESTOR`: array/função por view, condicional a `ramoTemVRF()`/`vrfObras.length` onde relevante.
  [`index.html:5592`](../../../../index.html#L5592)

- `TOUR_VIEWS_TECNICO`: escopo mais enxuto, telas simples.
  [`index.html:5641`](../../../../index.html#L5641)

- `_tourIniciarView`/`_tourEntrarView`: gancho real, com toda a cadeia de guarda (tour de topo visto → sem tour ativo → passos definidos → view ainda não vista → alvo já existe agora).
  [`index.html:5819`](../../../../index.html#L5819)

- `nav(view)`: chama `_tourEntrarView(view)` como último passo.
  [`index.html:3100`](../../../../index.html#L3100)

**Patches da Rodada 1 (achados 3-4, verificados na Rodada 2)**

- `renderView`/`_renderViewConteudo`: funil único de re-render que reposiciona o tour ativo, cobrindo `fbOnRemoteChange` e qualquer outro chamador fora de `nav()`.
  [`index.html:3286`](../../../../index.html#L3286)

- `_tourReposicionar`: `scrollPrimeiro` traz o alvo pra viewport só na primeira exibição de um passo, nunca em reposições de fundo.
  [`index.html:5910`](../../../../index.html#L5910)

- `_tourFechar`: fecha o menu flutuante incondicionalmente; grava a flag certa (`'topo'` vs. nome da view) via `_tourContextoAtual`.
  [`index.html:5936`](../../../../index.html#L5936)
