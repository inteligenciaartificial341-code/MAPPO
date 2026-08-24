---
title: 'Verificação de não-regressão da sincronização offline-first'
type: 'chore'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'fef662ad0b48d25fb51d132d6be4d18959a29a39'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

## Intent

Confirma CAP-7/AD-5 após as Stories 1-5: o motor de merge existente (`SYNC_KEYS`/`ITEM_LISTS`/`LEAF_MAPS`/`APPEND_LISTS`/`MERGE_MAPS`) continua com comportamento idêntico. É verificação, não feature nova — nenhuma mudança de código esperada além do que as Stories 1-5 já tocaram incidentalmente.

## O que mudou em `SYNC_KEYS`/classificação de merge nas Stories 1-5

Única mudança real: Story 2 adicionou `mappo_checklist_config` a `SYNC_KEYS` (`index.html:947-953`). Verificado que **não** entrou em nenhum dos 4 arrays especiais (`ITEM_LISTS`, `LEAF_MAPS`, `APPEND_LISTS`, `MERGE_MAPS`) — cai no branch final de `fbApply` ("Objeto único... o mais recente vence", `index.html:1632-1642`), mesma categoria de `mappo_settings`/`mappo_vrf_obra`. `_aplicarNaMemoria` tem o `case` correspondente (`index.html:1560`). Confirma o que o Design Notes da Story 2 já afirmava.

Nenhuma outra story tocou `SYNC_KEYS` ou os 4 arrays: Story 3 (compressão de foto) não muda formato de dado, só o valor gravado no mesmo campo já existente. Story 4 (consentimento GPS) é deliberadamente `localStorage`-only, fora do `SYNC_KEYS` inteiramente (ver Design Notes daquela story). Story 5 (`expiraEm`) vive em documentos `pub_{token}`, que **não fazem parte do `SYNC_KEYS`/motor de merge** — são publicados via `publicarAcompanhamento`, um caminho de escrita totalmente separado.

## Verificação

**Método:** extraídas as funções puras reais de `index.html` (`_porId`, `_mergeItens`, `_mergeLeafs`, `_mergeLista`, `_mergeMapa` — não reimplementadas) via script Node isolado, testadas contra cenários representativos das 4 categorias de merge. Não depende de Firebase/Emulator (funções puras, sem I/O).

**Resultado: 6/6 passou**
- `ITEM_LISTS`: merge por campo quando o mesmo item muda dos dois lados (nuvem manda o que não foi tocado aqui, local prevalece só no campo pendente) — idêntico.
- `ITEM_LISTS`: item criado offline (marcador `'*'`) sobrevive ao merge mesmo a nuvem não sabendo dele ainda — idêntico.
- `ITEM_LISTS`: sem pendência local, nuvem manda 100% — idêntico.
- `LEAF_MAPS`: dois técnicos em andares diferentes do VRF não se sobrescrevem — idêntico.
- `APPEND_LISTS`: união sem duplicar (mesmo prestador+data+hora) — idêntico.
- `MERGE_MAPS`: entrada mais recente por pessoa vence — idêntico.

**Verdict: sem regressão.** Nenhuma mudança de código necessária nesta story — comportamento de merge idêntico ao pré-Story-1, confirmado por leitura de código (rastreamento do `SYNC_KEYS`) e por execução real das funções de merge com cenários representativos.

## Achado incidental (não é regressão, registrado por transparência)

`fbApply`'s `catch(e){console.warn('[MAPPO] apply erro...',e.message);}` (`index.html:1643`) usa `console.warn` em vez do padrão `fbLog`/`e.code`+`e.message` usado no resto do projeto — mas é código pré-existente, não tocado por nenhuma das Stories 1-5, fora do escopo desta verificação (que é sobre regressão introduzida pelas stories, não auditoria geral).
