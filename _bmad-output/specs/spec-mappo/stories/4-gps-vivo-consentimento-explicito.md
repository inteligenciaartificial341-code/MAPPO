---
title: 'GPS ao vivo com consentimento explícito'
type: 'feature'
created: '2026-08-23'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'f0e6d17e7cbab84cf433826cff87275897c396a3'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** FR-12 exige consentimento explícito antes da primeira ativação do GPS ao Vivo (rastreamento contínuo, até 10h) — hoje `iniciarLive()` liga o rastreamento direto ao clicar, sem nenhuma tela/aviso prévio (confirmado: zero menção a consentimento/LGPD no código).

**Approach:** Interceptar `toggleLive()` (caminho de ligar) com uma checagem de consentimento; se ausente, mostrar um modal explicando o que é coletado e por quanto tempo antes de liberar `iniciarLive()`. Check-in pontual (FR-11) não muda.

## Boundaries & Constraints

**Always:** Técnico nunca ativa GPS ao vivo sem ver e aceitar o consentimento ao menos uma vez (FR-12). Consentimento é perguntado uma vez por pessoa, reaberto só se o texto mudar (Consistency Conventions da espinha, versionado).

**Ask First:** A espinha sugere persistir o consentimento "no mesmo registro de membership" (`workspaces/{wsId}/members/{uid}`), mas `firestore.rules` hoje só permite o **gestor** atualizar esse doc (`allow update: if isGestor(wsId)`) — o técnico não pode gravar no próprio. Essa story usa `localStorage` por uid em vez disso (sem tocar regra). Se quiser a versão com sync entre aparelhos via Firestore, é decisão separada — muda `firestore.rules`, exige Emulator Suite + autorização explícita antes de produção.

**Never:** Adicionar consentimento ao check-in pontual (FR-11 é "existente, preservar"). Mudar duração/intervalo/precisão do GPS ao vivo (`LIVE_DURACAO_MS` etc.). Tocar `firestore.rules`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Primeira ativação | Técnico nunca consentiu, clica "Ativar GPS ao vivo" | Modal de consentimento aparece; GPS não liga ainda | N/A |
| Aceita o consentimento | Clica "Aceito, ativar GPS" no modal | Consentimento gravado localmente (por uid); GPS ao vivo ativa imediatamente (mesmo fluxo de `iniciarLive()` hoje) | N/A |
| Fecha/recusa o modal | Fecha sem aceitar | GPS não ativa, nada muda, pode tentar de novo depois | N/A |
| Já consentiu (mesma versão) | Técnico ativa de novo depois | Ativa direto, sem mostrar o modal | N/A |
| Check-in pontual (FR-11) | Técnico faz check-in de uma OS | Comportamento idêntico ao atual — sem consentimento, sem regressão | Falha/negação de GPS não bloqueia o check-in (já é assim) |

</frozen-after-approval>

## Code Map

- `index.html:4342-4348` -- constantes do GPS ao vivo (`LIVE_DURACAO_MS` etc.) -- referência, não muda
- `index.html:4385-4389` -- `toggleGPS`/`toggleLive` -- ponto de interceptação: antes de chamar `iniciarLive()`, checar consentimento
- `index.html:4391-4424` -- `iniciarLive()` -- não muda, só passa a ser chamada depois do consentimento confirmado
- `index.html:3974-3975` -- `showModal`/`closeModal` -- reaproveitado pro modal de consentimento, mesmo padrão usado no resto do app
- `session.uid` (var `session`, ~`index.html:2078`) -- disponível pra chave do consentimento por pessoa

## Tasks & Acceptance

**Execution:**
- [ ] `index.html` -- adicionar `GPS_CONSENT_VERSAO` + helpers `_temConsentimentoGPS()`/`_gravarConsentimentoGPS()` (localStorage, chave `mappo_gps_consent_<uid>`) -- persiste consentimento sem tocar `firestore.rules`
- [ ] `index.html` -- nova função `_mostrarConsentimentoGPS()` -- modal (`showModal`) com texto claro: o que é coletado (localização contínua), por quanto tempo (até 10h a partir do check-in), que é opcional; botão "Aceito, ativar GPS"
- [ ] `index.html` `toggleLive()` -- no caminho de ligar (não no de desligar), checar `_temConsentimentoGPS()`; se ausente, chamar `_mostrarConsentimentoGPS()` em vez de `iniciarLive()` direto; ao aceitar, gravar consentimento e então chamar `iniciarLive()`

**Acceptance Criteria:**
- Given um técnico nunca ativou o GPS ao vivo, when clica em "Ativar GPS ao vivo" pela primeira vez, then vê a tela de consentimento antes de qualquer ativação real.
- Given o técnico aceita o consentimento, when confirma, then o GPS ao vivo ativa imediatamente e o consentimento fica registrado pra próximas ativações.
- Given o técnico fecha/recusa o consentimento, when não aceita, then o GPS ao vivo não ativa e nada muda.
- Given o check-in pontual de uma OS (FR-11), when o técnico faz check-in, then nada muda — sem tela de consentimento, comportamento idêntico ao atual.

## Design Notes

Consentimento salvo em `localStorage` por uid, não no Firestore — ver Boundaries/Ask First para o porquê (regra hoje não permite o técnico escrever no próprio `members/{uid}`). Efeito colateral aceito: trocar de aparelho ou limpar dados reabre o consentimento — mais conservador do ponto de vista de LGPD, não é regressão do que FR-12 exige (que é "nunca ativar sem ter visto ao menos uma vez", não "nunca perguntar de novo").

Versionamento simples: `GPS_CONSENT_VERSAO` como constante; comparar com a versão salva localmente. Incrementar a constante no futuro (se o texto mudar) reabre o consentimento pra todo mundo automaticamente, sem lógica extra.

## Verification

**Manual checks (sem CLI/suíte de testes no projeto):**
- Em `http://localhost:5173`, como técnico, limpar `localStorage` (ou usar uid novo) e clicar "Ativar GPS ao vivo" — confirmar que o modal aparece e o GPS não liga.
- Aceitar o consentimento — confirmar que o GPS ativa (mesmo toast/comportamento de hoje) e que clicar de novo (após desativar) não mostra mais o modal.
- Fechar o modal sem aceitar — confirmar que nada foi ativado.
- Fazer um check-in pontual de OS — confirmar que nenhuma tela de consentimento aparece (FR-11 intacto).
- Testar também o botão "Ativar GPS ao vivo" dentro do card de check-in (não só o do cabeçalho) — os dois precisam passar pelo consentimento.

## Suggested Review Order

- Registro do consentimento (versão + timestamp, guarda contra `session` nula) — ponto de entrada do desenho.
  [`index.html:4353`](../../../../index.html#L4353)

- `toggleLive()` — interceptação: só chama `iniciarLive()` depois de confirmar consentimento.
  [`index.html:4405`](../../../../index.html#L4405)

- Modal de consentimento e confirmação (com aviso se a gravação local falhar).
  [`index.html:4412`](../../../../index.html#L4412) · [`index.html:4425`](../../../../index.html#L4425)

- Correção pós-review: segundo ponto de ativação (botão dentro do card de check-in) chamava `iniciarLive()` direto, pulando o consentimento — corrigido pra passar por `toggleLive()`.
  [`index.html:4569`](../../../../index.html#L4569)
