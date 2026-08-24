---
title: 'Link Público com expiração, revogação e sanitização contra XSS'
type: 'feature'
created: '2026-08-23'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'eb312db983e94b4c444ae0eeda44fdcb65614c69'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O link público (`pub_{token}`) nunca expira nem pode ser revogado — uma vez gerado, fica acessível pra sempre e é republicado automaticamente (FR-14). Em paralelo, 63 pontos do app interpolam dado de usuário (nome, endereço, observação, rótulo) em `innerHTML` sem escape — inclusive na própria página pública, que qualquer Cliente Final acessa sem login (FR-15, R07 da auditoria).

**Approach:** `expiraEm` (ms) vira campo estável em `os`/`andar`, gravado uma vez na criação do link e checado tanto no cliente quanto em `firestore.rules` (AD-10). Revogar = atualizar `expiraEm` pra agora — mesmo mecanismo da expiração natural, sem estado/mensagem nova. Uma função `escapeHtml()` única (AD-12) é aplicada nos pontos reais de interpolação de dado de usuário, por zona (OS/Clientes, VRF, Configurações, Execução, Página pública).

## Boundaries & Constraints

**Always:** `pub_{token}` sem `expiraEm` (link publicado antes desta story) nunca vira inacessível por causa da mudança — ausência do campo é tratada como "nunca expira". Revogar invalida o link imediatamente, sem esperar republicação. `escapeHtml()` é a única função de escape usada — nunca `.replace()` ad-hoc num ponto novo.

**Ask First:** Esta story toca `firestore.rules` (checagem de `expiraEm` na leitura de `pub_.*`) — igual à Story 1, exige teste completo no Firebase Emulator Suite antes de qualquer publicação, e autorização explícita separada pra: (a) publicar a regra nova em produção, (b) fazer o commit. Nenhuma das duas acontece sem essa autorização, mesmo com o resto da story pronta e testado.

**Never:** Migrar os pontos de `innerHTML` pra `textContent`/`createElement` — só envolver o dado interpolado com `escapeHtml()`, sem tocar na estrutura HTML ao redor (cirúrgico, não é refactor). Criar um segundo estado/mensagem "revogado" distinto de "expirado" — é o mesmo mecanismo. Tocar pontos que já usam `textContent` (ex.: `userName`, `toast`) — já são seguros, não precisam de escape.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Link novo | Gestor gera link de uma OS/andar | `pub_{token}` grava `expiraEm=Date.now()+PUB_VALIDADE_MS` | N/A |
| Link expirado | Cliente abre link após `expiraEm` | Mensagem "Link expirado — peça um novo link à empresa", sem dado técnico | N/A |
| Link revogado | Gestor clica "Revogar" | `expiraEm` atualizado pra agora; próxima leitura (inclusive listener já aberto) cai no mesmo caminho de "expirado" | N/A |
| Link antigo (pré-story) | `pub_{token}` sem campo `expiraEm` | Continua acessível normalmente — ausência de campo não expira | N/A |
| XSS em campo de texto | Nome/observação/rótulo contendo `<img src=x onerror=...>` | Renderiza como texto literal em toda tela (inclusive página pública), nunca executa | N/A |

</frozen-after-approval>

## Code Map

**Expiração/Revogação (toca `firestore.rules`):**
- `index.html:5290-5308` -- `gerarLinkOS`/`gerarLinkObra` -- gravar `os.pubExpira`/`andar.pubExpira=Date.now()+PUB_VALIDADE_MS` só na criação (não em republicações)
- `index.html:5275-5287` -- `publicarAcompanhamento` -- incluir `expiraEm` (lido do `pubExpira` local) no `.set()`
- `index.html:5310-5330` -- `abrirModalLink` -- novo botão "Revogar link"
- Nova função `revogarLink(tipo,id)` -- seta `pubExpira=Date.now()`, salva, republica
- `index.html:5394-5409` -- `_pubOuvirToken` -- no `err=>` (permission-denied) e na checagem de `d.expiraEm` recebido, mostrar `renderPublicoErro('Link expirado','Peça um novo link à empresa.')` em vez do genérico atual
- `firestore.rules` -- regra de `workspaces/{wsId}/data/{docId}`, ramo `pub_.*`: adicionar `(!('expiraEm' in resource.data) || resource.data.expiraEm > request.time.toMillis())`

**Sanitização XSS (não toca `firestore.rules`):**
- Nova função `escapeHtml(s)` (perto de outros helpers globais) -- escapa `&`, `<`, `>`, `"`, `'`
- Zona OS/Clientes (`index.html:2622-2647` `osCardHTML`, `4059-4071` modal de detalhe, `3978+` `openModalOS`) -- `os.cliente`, `os.endereco`, `os.obs`, `notaGestor`, autocomplete de clientes
- Zona VRF (`index.html:2941-2990` `vrfRenderAndarPainel`, inclui a linha 2978 que já faz escape parcial -- substituir pelo `escapeHtml()` novo)
- Zona Configurações (`index.html:3750-3768` `renderChecklistConfig`, `3806-3826` `renderEquipeConfig`, `3828+` `openModalTecnico`) -- rótulo de item, nome/UID de técnico
- Zona Execução (`index.html:4897`, `4938-4944` `switchEquipTab`) -- cliente/endereço, marca/modelo de equipamento
- Zona Página pública (`index.html:5426-5461` `renderPublico`/`cardEtapa`) -- `e.label`, `e.nota`, `d.titulo`, `d.endereco`, `d.empresa` (adendo da Story 2, já registrado em `deferred-work.md`)
- **Não mexer:** pontos que já usam `textContent` (`index.html:2107-2108`, `2340-2341`, `2376`) -- já seguros

## Tasks & Acceptance

**Execution:**
- [ ] `index.html` -- criar `PUB_VALIDADE_MS` (constante) + gravar `pubExpira` na criação do link (não em republicações) -- Ask First: nenhum, é só código local
- [ ] `index.html` -- `publicarAcompanhamento` inclui `expiraEm` no payload publicado
- [ ] `index.html` -- botão "Revogar link" em `abrirModalLink` + função `revogarLink(tipo,id)`
- [ ] `index.html` -- `_pubOuvirToken`/`renderPublicoErro` -- mensagem específica de link expirado
- [ ] `firestore.rules` -- checagem de `expiraEm` na leitura de `pub_.*` -- **Ask First: testar no Emulator Suite antes, autorização explícita antes de publicar**
- [ ] `index.html` -- criar `escapeHtml()` e aplicar nas 5 zonas do Code Map, substituindo o escape parcial existente (linha 2978)

**Acceptance Criteria:**
- Given um link publicado antes desta story (sem `expiraEm`), when um cliente abre, then continua funcionando normalmente.
- Given um link recém-gerado, when o cliente abre dentro do prazo, then vê os dados normalmente.
- Given um link expirado ou revogado, when o cliente abre (ou já está com a aba aberta), then vê "Link expirado — peça um novo link à empresa", nunca os dados nem erro técnico.
- Given um nome/observação/rótulo com `<img src=x onerror=alert(1)>`, when renderizado em qualquer tela das 5 zonas (inclusive a página pública), then aparece como texto literal, nunca executa.

## Design Notes

`PUB_VALIDADE_MS` — nenhuma fonte (PRD/espinha) define um prazo padrão numérico; **[ASSUMPTION]** 30 dias (`30*24*60*60*1000`), valor conservador pra um link de acompanhamento de serviço já concluído/em andamento -- fácil de ajustar depois, é só uma constante.

Revogar = expirar agora é deliberado: evita um segundo estado/mensagem, reaproveita 100% do mecanismo de expiração natural (mesma checagem, cliente e regra, mesmo texto pro Cliente Final).

`escapeHtml()` escapa os 5 caracteres (`& < > " '`) pra funcionar tanto dentro de `innerHTML` quanto dentro de atributo `value="..."` com a mesma função -- nunca dois caminhos de sanitização (AD-12).

## Verification

**Commands:**
- Emulator Suite (mesmo setup da Story 1) -- expected: leitura de `pub_{token}` com `expiraEm` no passado negada; sem o campo, permitida; `mappo_tecnicos`/demais coleções sem regressão.

**Manual checks (sem CLI/suíte de testes no projeto):**
- Gerar um link, abrir em aba anônima, confirmar que funciona.
- Revogar o link, recarregar a aba anônima -- confirmar "Link expirado".
- Cadastrar um cliente/observação/rótulo com `<img src=x onerror=alert(1)>` -- confirmar que não executa em nenhuma das 5 zonas, inclusive no link público desse mesmo dado.

**Emulator Suite (rodado nesta sessão, 33/33 passou):**
- 27 testes originais da Story 1 -- sem regressão.
- 6 cenários novos: `expiraEm` no futuro (permitido), no passado (negado), ausente/link antigo (permitido), token nunca emitido (não erra -- fix do `resource==null`), gestor revoga (permitido), técnico republica progresso "ao vivo" (permitido).

## Suggested Review Order

**Expiração/Revogação (toca `firestore.rules`)**

- Regra nova: `expiraEm` checado no ramo `pub_.*`, com guarda contra `resource==null` (token nunca emitido).
  [`firestore.rules:76-89`](../../../../firestore.rules#L76-L89)

- `publicarAcompanhamento` grava `expiraEm` como campo próprio (fora do `json`), lido de `os.pubExpira`/`andar.pubExpira` -- nunca recalculado, só repassado, pra não "des-revogar" a cada republicação automática.
  [`index.html:5288`](../../../../index.html#L5288)

- `revogarLink` -- só confirma sucesso se a escrita realmente aconteceu.
  [`index.html:5350`](../../../../index.html#L5350)

- `_pubOuvirToken` -- mensagem específica de expirado, timer proativo pra abas já abertas.
  [`index.html:5435`](../../../../index.html#L5435)

**Sanitização XSS (não toca `firestore.rules`)**

- `escapeHtml()` -- função única, usada em 124 pontos (varredura completa, além das 5 zonas originalmente mapeadas -- inclui telas inteiras não previstas no spec: mapa do técnico, Tarefas Adicionais, manutenção do técnico).
  [`index.html:2383`](../../../../index.html#L2383)
