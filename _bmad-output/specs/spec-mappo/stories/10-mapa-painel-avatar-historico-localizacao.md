---
title: 'Mapa -- painel recolhível, avatar do prestador, histórico de localização'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 0
baseline_commit: '04b387ab8d9515ceb0a51bb762bffee9483e0c4b'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O painel de info do prestador no mapa é o popup nativo do Leaflet — só abre/fecha por clique, sem estado controlável, e pode cobrir controles ao abrir perto da borda de `#mapaBox`. Marcadores são emoji fixo (👷/🏗️/📍, 3 pontos diferentes do código), sem escolha do prestador. Não existe histórico de localizações — `mappo_locations`/`mappo_live` guardam só a posição mais recente/sessão atual, nunca um log entre dias.

**Approach:** Painel próprio (não o popup nativo do Leaflet), com botão explícito de recolher/expandir. Prestador escolhe um avatar (asset estático, gerado uma vez) num novo ponto de entrada pro perfil dele — hoje não existe nenhuma tela de configuração pessoal pro técnico, esta story cria a mínima necessária. Novo log append-only de eventos de localização (check-in fixo, início de GPS ao vivo), exibido como lista abaixo do mapa.

## Boundaries & Constraints

**Always:** Painel de info nunca cobre um controle/botão de forma persistente — estado de aberto/fechado é controlado pelo próprio app, não pelo posicionamento automático do popup do Leaflet. Avatar é asset estático (SVG), sem dependência de runtime nova. Histórico é append-only (nunca perde entrada, mesmo padrão de `vrfCheckins`).

**Ask First:** Nenhum — não toca `firestore.rules`.

**Never:** Registrar cada ping de GPS ao vivo (a cada 5s) no histórico — log é por evento significativo (check-in, início de sessão ao vivo), não replay de trajeto. Trocar a biblioteca de mapa (continua Leaflet).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gestor clica num marcador | Painel abre com info do prestador | Botão explícito recolhe/expande, nunca cobre controle escondido | N/A |
| Prestador escolhe avatar | Tela de perfil (nova) | Próxima vez que a posição dele aparece no mapa, mostra o avatar escolhido | N/A |
| Prestador sem avatar escolhido | Qualquer momento | Cai no emoji padrão de hoje (👷), sem quebrar nada | N/A |
| Prestador em GPS ao vivo | Avatar no mapa | Anima ("andando", CSS leve) | N/A |
| Prestador em check-in fixo | Avatar no mapa | Parado, sem animação | N/A |
| Check-in ou início de GPS ao vivo | Qualquer prestador | Nova entrada no histórico (data/hora/tipo) | N/A |

</frozen-after-approval>

## Code Map

**Painel recolhível:**
- `index.html:4714-4760` -- `atualizarMarcadores()` -- troca `bindPopup(...)` por um handler de clique que abre/fecha um painel próprio
- Novo elemento no HTML de `renderMapa()` (`index.html:2897-2917`) -- painel fixo dentro de `#mapaBox`, com botão de recolher/expandir explícito

**Avatar:**
- `index.html:1877-1886` -- `tecnicos`/`saveTecnicos()` -- novo campo `t.avatar` (id de um conjunto pequeno pré-gerado, sincronizado via `mappo_tecnicos` como já é)
- Já existem: `avatar-1.svg` a `avatar-6.svg` na raiz do repo (mesmo padrão de `icon-192.png`), gerados antes desta implementação -- ver Design Notes pra estrutura exata (classes `avatar-leg-l`/`avatar-leg-r` prontas pra animação)
- Novo ponto de entrada pro técnico escolher o próprio avatar -- não existe hoje nenhuma tela de config pessoal pro técnico (`renderView` só trata `case'config'` no branch de gestor); candidato natural: botão perto do toggle de GPS em `renderTecnicoApp()` (`index.html:4781-4800`)
- `index.html:4714-4760` -- `atualizarMarcadores()` -- usa `t.avatar` (via `getTecnico(nome)`, `index.html:1888`) no lugar do emoji fixo quando definido; classe CSS de animação "andando" quando `lv.ativo&&Date.now()<lv.fimTs` (mesma condição que já decide o marcador "chip" ao vivo hoje)

**Histórico:**
- Novo: `mappo_localizacao_historico` em `SYNC_KEYS`/`APPEND_LISTS` (mesmo padrão de `mappo_vrf_checkins`) -- `{prestador,data,hora,tipo:'fixo'|'ao_vivo'}`
- `index.html:5030-5034` -- `salvarPosicao()` -- registra entrada tipo `'fixo'`
- `index.html:4922-4930` -- `iniciarLive()` -- registra entrada tipo `'ao_vivo'` (uma por sessão, não por ping)
- `index.html:2897-2917` -- `renderMapa()` -- nova seção abaixo do card "Equipe" (`renderEquipeMini`, `index.html:2753-2763`), lista por prestador com data/hora/dia da semana

## Tasks & Acceptance

**Execution:**
- [ ] `index.html` -- painel de info próprio no mapa, com toggle explícito, substituindo o popup nativo do Leaflet
- [ ] `index.html` -- campo `t.avatar` em `tecnicos` + 6-8 SVGs estáticos novos no repo
- [ ] `index.html` -- novo ponto de entrada pro técnico escolher seu avatar (tela mínima, perto do toggle de GPS)
- [ ] `index.html` -- `atualizarMarcadores()` usa avatar escolhido (fallback pro emoji atual) + classe de animação "andando" quando GPS ao vivo está ativo
- [ ] `index.html` -- `mappo_localizacao_historico` (append-only) + registro em `salvarPosicao()`/`iniciarLive()` + lista abaixo do mapa em `renderMapa()`

**Acceptance Criteria:**
- Given o gestor clica num marcador, when o painel abre, then existe um botão explícito pra recolher/expandir (não depende só do popup nativo do Leaflet).
- Given um prestador escolhe um avatar, when aparece no mapa, then mostra o avatar escolhido, parado ou "andando" conforme o tipo de localização (fixa/ao vivo).
- Given um prestador sem avatar escolhido, when aparece no mapa, then cai no emoji padrão de hoje, sem erro.
- Given um check-in ou início de GPS ao vivo acontece, when o gestor abre o mapa, then vê uma entrada nova na lista de histórico abaixo do mapa, com data/hora.

## Design Notes

Painel de info do prestador vira um elemento HTML próprio (não `bindPopup`), porque o popup nativo do Leaflet não tem estado controlável pelo app — é isso que causava o problema original ("cobre botão ao rolar"). Estado de aberto/fechado guardado numa variável simples (ex.: `mapaPainelAberto`), re-renderizado a cada clique de marcador.

Avatares: **já criados** -- `avatar-1.svg` a `avatar-6.svg` na raiz do repo (mesmo padrão de `icon-192.png`), 6 variações de cor/cabelo, mesma estrutura em todos: cabeça (`circle`), corpo (`rect`), e duas pernas cada uma envolvida em `<g class="avatar-leg avatar-leg-l">`/`avatar-leg-r` com `transform-origin` já definido (topo da perna) -- é só criar o `@keyframes` que alterna `transform:rotate(±Ndeg)` nessas duas classes quando o marcador estiver em GPS ao vivo, e não aplicar a classe/animação (perna parada) em check-in fixo. Não criar arquivos novos, usar os 6 que já existem.

`mappo_localizacao_historico` regista só eventos discretos (check-in, início de sessão ao vivo) -- nunca cada ping de 5s do GPS ao vivo, senão o log cresce sem controle. Mesma disciplina de `vrfCheckins`/`t.checkins` (já existentes, mesma forma).

Não existe hoje nenhuma tela de "meu perfil" pro técnico -- o ponto de entrada do avatar é a primeira peça desse tipo de tela; mínimo necessário pra esta story, não uma tela de configurações completa.

## Verification

**Manual checks (sem CLI/suíte de testes no projeto):**
- Abrir o mapa, clicar num marcador, confirmar que o painel abre e o botão de recolher/expandir funciona sem cobrir nada.
- Como técnico, escolher um avatar, fazer um check-in, confirmar que aparece no mapa do gestor.
- Ativar GPS ao vivo, confirmar que o avatar anima ("andando"); desativar, confirmar que volta a ficar parado.
- Conferir a lista de histórico abaixo do mapa depois de um check-in e de uma sessão de GPS ao vivo.

## Suggested Review Order

- `abrirPainelMapa()`/`_renderPainelMapa()` -- painel próprio do app (não `bindPopup` do Leaflet), estado em `mapaPainelAberto`/`mapaPainelColapsado`.
  [`index.html:4854`](../../../../index.html#L4854)

- Correção pós-review, o ponto mais importante: o reset desse estado saiu de `renderMapa()` (que roda também em re-renders de fundo disparados por sync remoto) e passou pra `nav(view)`, só quando `view==='mapa'` -- evita fechar o painel do gestor sem ele mexer em nada.
  [`index.html:2550`](../../../../index.html#L2550)

- `setMeuAvatar()` -- nunca `delete`a a chave, sempre escreve `{avatar,ts}` -- sem isso a remoção de avatar era desfeita pelo próprio merge (`_mergeMapa` não tem conceito de tombstone, só "ts mais recente vence").
  [`index.html:1927`](../../../../index.html#L1927)

- `mappo_avatares` como coleção nova (não `t.avatar` em `mappo_tecnicos`, que é gestor-only em `firestore.rules`) -- desvio deliberado do Code Map original, evita qualquer mudança em rules.
  [`index.html:988`](../../../../index.html#L988)

- `registrarHistoricoLocalizacao()` -- só eventos discretos (check-in, início de sessão ao vivo), nunca ping de 5s; `hora` com granularidade de segundo pra evitar colisão de dedup no mesmo minuto.
  [`index.html:2034`](../../../../index.html#L2034)
