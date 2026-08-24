---
title: 'Compressão de foto consistente em todos os pontos de captura'
type: 'feature'
created: '2026-08-23'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'a9a926e44db4cd9adb61a505403877ba24a119fa'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Duas telas de captura de foto na execução de OS (`onEquipFoto`, `onCheckFoto`) gravam o arquivo bruto (`FileReader.readAsDataURL` direto, sem redimensionar), diferente do fluxo VRF que já usa `vrfComprimirImagem` (canvas + JPEG). Foto de câmera moderna sem compressão arrisca estourar o limite de tamanho de documento do Firestore ao sincronizar.

**Approach:** Trocar as duas chamadas de `FileReader` bruto por `vrfComprimirImagem(file, cb)` — a mesma função já usada e validada no fluxo VRF, sem criar uma segunda rotina.

## Boundaries & Constraints

**Always:** Todo ponto de captura de foto presente (e futuro) passa por `vrfComprimirImagem` — nenhum bypass (AD-9). Fotos já gravadas antes desta mudança continuam exibindo normalmente, sem reprocessamento/migração.

**Ask First:** Nenhum — não toca `firestore.rules`, não faz deploy, não muda formato de dado armazenado (dataURL JPEG antes e depois).

**Never:** Renomear `vrfComprimirImagem` (mesmo saindo do escopo puramente VRF) — função pública, fora do escopo desta mudança cirúrgica. Alterar os parâmetros de compressão (1024px/qualidade 0.6) — mudaria o comportamento já validado do VRF, fora de escopo. Criar uma segunda função de compressão.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Foto de equipamento (evap/cond) | Técnico seleciona arquivo em "Equipamentos" | `execOS.equipamentos[i].fotoEvap/fotoCond` recebe dataURL JPEG redimensionado (máx. 1024px, qualidade 0.6) | N/A |
| Foto de item do checklist | Técnico seleciona arquivo em "Checklist" | `execOS.checklist[i].foto` recebe o mesmo padrão de dataURL comprimido | N/A |
| Seletor cancelado | `evt.target.files[0]` indefinido | Nada muda, sem erro (early return preservado) | N/A |
| OS com fotos antigas (pré-mudança) | Abrir OS já sincronizada | Fotos antigas (não comprimidas) continuam exibindo normalmente | N/A |

</frozen-after-approval>

## Code Map

- `index.html:3025-3039` -- `vrfComprimirImagem(file,cb)` -- função de compressão única (canvas+JPEG, 1024px, qualidade 0.6), reaproveitada sem alteração
- `index.html:4913-4924` -- `onEquipFoto(evt,i,tipo)` -- grava foto bruta via `FileReader.readAsDataURL`; troca pelo callback de `vrfComprimirImagem`
- `index.html:4962-4966` -- `onCheckFoto(evt,i)` -- mesmo padrão bruto; mesma troca
- `index.html:3040-3061` (`vrfSetupCamera`), `index.html:4721-4738` (`setupTarefaCam`) -- não mudam; servem de referência do padrão correto de chamada

## Tasks & Acceptance

**Execution:**
- [ ] `index.html` `onEquipFoto` -- substituir leitura direta (`new FileReader`/`readAsDataURL`) por `vrfComprimirImagem(file, b64=>{...})`, usando `b64` no lugar de `e.target.result` -- consolida no único ponto de compressão (AD-9)
- [ ] `index.html` `onCheckFoto` -- mesma troca -- idem

**Acceptance Criteria:**
- Given um técnico anexa foto de equipamento (evaporadora/condensadora), when o arquivo é selecionado, then a foto gravada é um dataURL JPEG redimensionado (mesmo padrão do VRF), não o arquivo bruto.
- Given um técnico anexa foto de um item do checklist, when o arquivo é selecionado, then o resultado é o mesmo dataURL comprimido, não o bruto.
- Given nenhum arquivo é selecionado, when o handler dispara, then nada muda (sem erro).
- Given uma OS com fotos gravadas antes desta mudança, when reaberta, then as fotos antigas continuam exibindo normalmente.

## Design Notes

`vrfComprimirImagem` já aceita `File` e devolve dataURL JPEG via callback — mesmo tipo de entrada/saída que `onEquipFoto`/`onCheckFoto` já usam hoje (`e.target.result` de `readAsDataURL` também é dataURL string). Troca é literal: mover o corpo hoje dentro de `r.onload=e=>{...}` para dentro do callback `cb`, trocando `e.target.result` por `b64`. Nome da função mantido `vrfComprimirImagem` apesar de deixar de ser exclusiva do fluxo VRF — renomear função pública está fora do escopo cirúrgico desta story (CLAUDE.md); aceito como inconsistência de nomenclatura, não bloqueador.

## Verification

**Manual checks (sem CLI/suíte de testes no projeto):**
- Em `http://localhost:5173`, numa OS de teste, anexar uma foto grande (câmera/arquivo >3MB) em "Equipamentos" e em "Checklist"; no console do navegador, conferir `execOS.equipamentos[0].fotoEvap.length`/`execOS.checklist[0].foto.length` — deve ficar na faixa de fotos já comprimidas do VRF (dezenas de KB, não MB).
- Conferir visualmente que a foto renderiza normalmente nas duas telas após a troca.
- Cancelar o seletor de arquivo (sem escolher nada) e confirmar que nada quebra.
- Selecionar um arquivo corrompido/não-imagem (renomear um .txt pra .jpg, por exemplo) e confirmar que aparece o toast de erro, sem foto salva e sem travar a conclusão da OS.
- Depois de uma falha, re-selecionar o mesmo arquivo (retry) e confirmar que o evento dispara de novo (`input.value` resetado).

## Suggested Review Order

- Fonte da correção pós-review: `vrfComprimirImagem` ganha tratamento de erro (leitura/decodificação falha, imagem degenerada 0×0) — beneficia os 4 pontos de chamada, não só os 2 novos desta story.
  [`index.html:3025`](../../../../index.html#L3025)

- `onEquipFoto` — troca de leitura bruta por `vrfComprimirImagem`, com reset do input pra permitir nova tentativa.
  [`index.html:4916`](../../../../index.html#L4916)

- `onCheckFoto` — mesma troca.
  [`index.html:4964`](../../../../index.html#L4964)
