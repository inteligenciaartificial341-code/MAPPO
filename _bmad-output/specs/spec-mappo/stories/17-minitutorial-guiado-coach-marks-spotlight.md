---
title: 'Minitutorial guiado (coach-marks/spotlight) pro primeiro acesso'
type: 'feature'
created: '2026-08-31'
status: 'done'
review_loop_iteration: 0
baseline_commit: '26561d4b04b34d26078853bdb383c26a1d3f3622'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Todo novo usuário (gestor ou prestador) fica perdido no primeiro acesso — não existe nenhuma orientação guiada mostrando o que cada opção do menu faz.

**Approach:** No primeiro login de cada pessoa, um tour por passos escurece a tela e ilumina (spotlight) o elemento real do menu da vez, com um card de texto explicando o que ele faz. Gestor e prestador recebem sequências distintas, cada uma cobrindo só as opções do próprio perfil. Um botão fixo reabre o tour a qualquer momento.

## Boundaries & Constraints

**Always:** Spotlight mira o elemento real do DOM via `querySelector` (nunca posição fixa em pixel/screenshot) — reposiciona em resize/scroll enquanto ativo. Um passo cujo seletor não existe no DOM no momento (ex.: item de menu condicional ausente) é pulado silenciosamente, nunca quebra o tour. Qualquer texto sobre o módulo genérico usa `moduloSplitAtual().nome`/`.desc` dinamicamente — nunca hardcodar vocabulário de Refrigeração. Flag "já viu" fica em `localStorage` por `session.uid` (mesmo padrão de `_temConsentimentoGPS`), nunca sincroniza com Firestore. Zero dependência nova (CSS+JS puro, reaproveitando `escapeHtml`/`svgIco`/z-index já em uso).

**Ask First:** Nenhuma — desenho já decidido com o proprietário nesta conversa.

**Never:** Tocar `firestore.rules` ou qualquer chave de `SYNC_KEYS`. Bloquear o uso do app enquanto o tour não é visto (usuário sempre pode pular). Reordenar/renomear `.nav-item`/`data-view`/`data-nav` existentes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Primeiro login de sempre (gestor ou prestador) | `localStorage` sem `mappo_tutorial_<uid>_visto` | Tour do próprio perfil inicia automaticamente ao fim de `entrarApp()` | N/A |
| Login seguinte (mesma pessoa, mesmo navegador) | Flag já gravada | Tour NÃO inicia sozinho | N/A |
| Usuário clica botão de reabrir | A qualquer momento, dado já visto ou não | Tour do perfil atual reinicia do passo 1 | N/A |
| Passo aponta pra item de menu condicional ausente (ex. VRF fora de Refrigeração) | Seletor não casa nenhum elemento | Passo é pulado, tour segue pro próximo | N/A |
| Usuário clica "Pular" em qualquer passo | Tour ativo | Overlay fecha, flag gravada como visto (mesmo efeito de terminar) | N/A |
| Redimensiona janela/rola a tela com tour ativo | Tour ativo, elemento-alvo muda de posição | Recorte/spotlight e card reposicionam sem fechar o tour | N/A |

</frozen-after-approval>

## Code Map

- `index.html:2638-2676` (`entrarApp()`) — melhor gancho: no fim da função (após `updateDate();startNotifChecker();`), checar flag e, se ausente, iniciar o tour do perfil (`session.perfil`).
- `index.html:1311` (`_aplicarSessaoResolvida`) — onde `session.uid`/`session.perfil` ficam definitivos antes de `entrarApp()` rodar.
- `index.html:6004-6021` (`_temConsentimentoGPS`/`_gravarConsentimentoGPS`) — precedente direto do padrão de flag em `localStorage` por `session.uid` a replicar (`mappo_tutorial_<uid>_visto`).
- Alvos do tour do **gestor** (sidebar estática, `index.html:912-937`): `[data-view="splits"]`, `[data-view="vrf"]` (só se `ramoTemVRF()`), `[data-view="tarefas"]`, `[data-view="financeiro"]`, `[data-view="config"]`, `[data-view="compartilhar"]`, `[data-view="avaliar"]`; navbar superior (`index.html:2153-2159`, `.navbtn[data-nav="..."]`): `dashboard`, `ordens`, `manutencoes`, `clientes`, `mapa`.
- Alvos do tour do **prestador** (navbar dinâmica, `getNavItems()` `index.html:2787-2826`): `.navbtn[data-nav="home"]`, `[data-nav="ordens"]` (só se `m.split`), `[data-nav="tarefas"]`, `[data-nav="manutencoes"]`, `[data-nav="vrf"]` (só se obras atribuídas e `ramoTemVRF()`) — todos condicionais, reforça a regra de "pular passo sem alvo".
- `index.html:939-948` (`.sidebar-footer`/`.sidebar-user`) — local do botão fixo de reabrir, ao lado de `.btn-sair` (linha 946).
- `index.html:5435-5436` (`showModal`/`closeModal`), CSS `.overlay` (linha 220) — padrão de overlay a inspirar (não reusar `showModal` diretamente, o tour precisa de recorte, não de card centralizado).
- `index.html:3088-3090` (`escapeHtml`), `index.html:2149` (`svgIco`, tabela `ICONS` linhas 2115-2148 — sem ícone de "ajuda" pronto, adicionar entrada nova).
- Z-index de referência: `.overlay` 200, `.toast` 999, `#loginScreen` 1000, `#splashScreen` 2000, `.pub-zoom` 3000 — tour usa o maior valor do arquivo (ex. 4000).
- `index.html:2575-2577` (`moduloSplitAtual()`), `index.html:1018` (`ramoTemVRF()`) — exemplo de uso lado a lado em `index.html:2699-2705`.
- Zona nova sugerida: logo após a seção `MODAIS` (`index.html:5432`) ou perto de `entrarApp()`/`montarNavbar()` (`index.html:2638-2900`), banner `TUTORIAL GUIADO (coach-marks)`, funções prefixadas `_tour*`.

## Tasks & Acceptance

**Execution:**
- [x] `index.html` -- criar função `_tourIniciar(perfil)` + `_tourMostrarPasso(i)` + `_tourFechar(visto)` + arrays `TOUR_GESTOR`/`TOUR_TECNICO` (seletor/título/texto por passo, pulando passo sem elemento no DOM) -- núcleo do mecanismo
- [x] `index.html` -- overlay+recorte via elemento posicionado sobre `getBoundingClientRect()` do alvo (`box-shadow` grande), card de instrução ancorado perto do alvo com título/texto/dots de progresso/Pular/Próximo (Concluir no último passo) -- reaproveita `escapeHtml`, sem dependência nova
- [x] `index.html` -- `_temTourVisto()`/`_gravarTourVisto()` em `localStorage` por `session.uid`, mesmo padrão de `_temConsentimentoGPS` -- persistência local, sem Firestore
- [x] `index.html` -- gancho em `entrarApp()`: dispara `_tourIniciar(session.perfil)` automaticamente se `!_temTourVisto()`
- [x] `index.html` -- botão fixo "?" em `.sidebar-footer`/`.sidebar-user` chamando `_tourIniciar(session.perfil)` manualmente a qualquer momento
- [x] `index.html` -- listener de resize/scroll enquanto tour ativo reposiciona recorte+card; removido ao fechar

**Acceptance Criteria:**
- Given um uid que nunca logou neste navegador, when `entrarApp()` termina, then o tour do perfil correto inicia sozinho, sem travar navegação nem exigir conclusão.
- Given o mesmo uid num login seguinte, when `entrarApp()` termina, then o tour NÃO inicia sozinho.
- Given o tour ativo, when o usuário clica "Pular" ou termina o último passo, then o overlay fecha e a flag fica gravada.
- Given um passo cujo seletor não existe no DOM (ex. VRF ausente), when o tour chega nesse passo, then ele é pulado sem erro no console.
- Given o botão "?" clicado, when o tour reabre, then reinicia do passo 1 independente da flag.

## Design Notes

Recorte via elemento auxiliar posicionado sobre o alvo (`getBoundingClientRect()`), `border-radius` leve e `box-shadow: 0 0 0 9999px rgba(0,0,0,.75)` — escurece tudo ao redor sem precisar de `clip-path`/máscara SVG, técnica padrão e leve. Card de texto sempre visível e legível: calcular se cabe abaixo ou acima do alvo (não sair da viewport). Texto exato de cada passo, quantidade final e ícone/posição exata do botão "?" ficam a critério de quem implementar — usar os alvos listados no Code Map como mínimo, seguir o tom direto já usado em `toast`/textos de UI existentes.

## Verification

**Manual checks (sem CLI/suíte de testes no projeto):**
- Script Playwright efêmero (padrão já usado nas stories anteriores): logar como gestor novo (uid nunca visto), confirmar tour inicia sozinho, avançar todos os passos, confirmar overlay fecha e flag grava; recarregar e confirmar que não reabre sozinho; clicar "?" e confirmar reabertura.
- Repetir o mesmo roteiro pra um uid de prestador.
- `node -e` com `new Function` em cada bloco `<script>` pra checar sintaxe.
- Conferir visualmente (screenshot) que o recorte cobre exatamente o item de menu certo em pelo menos 2 passos, e que redimensionar a janela reposiciona sem quebrar.

## Review Round

1 rodada de review (blind-hunter + edge-case-hunter + verification-gap, proporcional ao tamanho da story — mecanismo novo, toca a sidebar/navbar dos dois perfis). Os 3 revisores convergiram independentemente em 2 dos 5 achados reais, sinal forte. 5 achados corrigidos, aplicados pelo mesmo subagent implementador (mesmo contexto preservado via SendMessage):

1. `_tourExisteProximoVisivel` (usada só pra decidir o texto do botão "Próximo"/"Concluir") chamava `_tourElVisivel`, que tem o efeito colateral de abrir a sidebar — renderizar um passo fora da sidebar podia abri-la sozinha por causa de um passo 2-3 posições à frente. Corrigido com `_tourElExiste`, uma checagem pura sem efeito colateral, usada só pra "olhar adiante/atrás".
2. `openSidebar()` e a leitura de `getBoundingClientRect()` do alvo aconteciam no mesmo tick síncrono — o spotlight nascia na posição do drawer ainda fechado, só corrigindo se um resize/scroll disparasse depois (podia nunca acontecer no mobile). Corrigido com `_tourAdiarReposicaoAposAbrirSidebar`, que reposiciona de novo no `transitionend` do drawer (com timeout de 320ms como rede de segurança).
3. `_tourFechar()` nunca fechava a sidebar que o próprio tour tinha aberto — violava uma convenção que o próprio código já documenta (comentário de `compartilharApp()`: quem abre a sidebar fora do fluxo de `nav()` precisa fechá-la de novo). No mobile, o primeiro acesso do gestor podia terminar com o drawer travado aberto por cima do dashboard. Corrigido com uma chamada incondicional a `closeSidebar()` no fechamento do tour.
4. `.tour-backdrop` não fechava ao clicar fora, quebrando a convenção que todo outro overlay do app já ensina (`showModal`/`.overlay`). Corrigido com `onclick="_tourFechar(true)"`.
5. Não existia jeito de voltar um passo — inconsistente com o padrão "← Voltar" que o próprio app acabou de adotar em outras telas (commit a6a7cca). Corrigido com um botão "← Voltar" condicional (só aparece quando existe passo anterior visível), e um bug latente exposto por essa mudança (`_tourAvancar` fechava o tour ao "voltar" além do primeiro passo) foi corrigido junto.

4 achados reais mas fora do escopo desta story foram registrados em `deferred-work.md` (reabertura do tour dentro do sub-contexto VRF do técnico mostra poucos passos; ausência de suporte a teclado/ARIA; ausência de telemetria de conclusão/abandono; listeners de resize/scroll sem debounce). Achados sobre um possível papel `'prestador'`/`'cliente'` distinto de `'tecnico'` foram verificados contra o código real e descartados — só existem os papéis `gestor`/`tecnico` no fluxo de membership.

## Suggested Review Order

**Núcleo do mecanismo (entry point)**

- Motor do tour: avança/volta pulando passos sem alvo visível, fecha como concluído só ao esgotar os passos à frente.
  [`index.html:5613`](../../../../index.html#L5613)

- Renderiza o passo atual (spotlight, card, dots, botões Pular/Voltar/Próximo) a partir do alvo real do DOM.
  [`index.html:5622`](../../../../index.html#L5622)

- Arrays de passos por perfil — texto do módulo genérico usa `moduloSplitAtual()` dinamicamente, nunca hardcoded.
  [`index.html:5483`](../../../../index.html#L5483)

**Gancho de disparo**

- `entrarApp()` dispara o tour do perfil certo só quando a flag ainda não existe — não reabre sozinho em login seguinte.
  [`index.html:2704`](../../../../index.html#L2704)

**Alvo real do DOM e correção da corrida com o drawer da sidebar**

- Elemento realmente exibido: abre o drawer da sidebar se preciso, some silenciosamente se não houver alvo visível.
  [`index.html:5573`](../../../../index.html#L5573)

- Reposiciona depois que a transição do drawer termina, em vez de medir a posição no meio da animação.
  [`index.html:5553`](../../../../index.html#L5553)

- Checagem pura de existência (sem abrir o drawer) usada só pra decidir se mostra "Voltar"/"Concluir".
  [`index.html:5539`](../../../../index.html#L5539)

- Segue o alvo em resize/scroll enquanto o tour está ativo; listeners removidos ao fechar.
  [`index.html:5658`](../../../../index.html#L5658)

**Fechamento, persistência e reabertura manual**

- Fecha o drawer que o próprio tour possa ter aberto (mesmo padrão de `compartilharApp()`), grava a flag só se "visto".
  [`index.html:5683`](../../../../index.html#L5683)

- Flag "já viu" em `localStorage` por `session.uid`, mesmo padrão de `_temConsentimentoGPS`.
  [`index.html:5510`](../../../../index.html#L5510)

- Botão "?" no rodapé da sidebar reabre o tour a qualquer momento.
  [`index.html:966`](../../../../index.html#L966)

**Peripherals**

- Ícone de ajuda novo na tabela `ICONS`, sem dependência nova.
  [`index.html:2172`](../../../../index.html#L2172)

- CSS do overlay/spotlight/card, z-index 4000+ (acima do maior valor pré-existente do arquivo).
  [`index.html:777`](../../../../index.html#L777)

**Baseline commit:** `26561d4b04b34d26078853bdb383c26a1d3f3622`. `firestore.rules` confirmado intocado (`git diff --stat` vazio). Sintaxe de todos os blocos `<script>` verificada de forma independente (`node -e` com `new Function`).
