---
title: 'Instalação multiplataforma via PWA'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'fef662ad0b48d25fb51d132d6be4d18959a29a39'
context: ['{project-root}/AGENTS.md', '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O app não é instalável de forma confiável hoje — o manifest é inline via `data:` URI (`index.html:11`) apontando ícones pra um host externo (GitHub Pages), sem Service Worker, sem cache do shell (FR-17).

**Approach:** `manifest.json` como arquivo real (ícones locais, já existem no repo), Service Worker mínimo (`sw.js`) cacheando o shell, sem mudar nenhuma lógica do app.

## Boundaries & Constraints

**Always:** Chrome Android/desktop oferece o prompt "Instalar app"; Safari iPhone permite "Adicionar à Tela de Início", abre em modo standalone. Quem não instala continua usando o app exatamente como hoje.

**Ask First:** Nenhum — não toca `firestore.rules`, não muda lógica do app.

**Never:** Empacotamento `.apk`/TWA/Capacitor (PRD explícito, fora do MVP). Cache agressivo que prenda o usuário numa versão antiga do `index.html` para sempre — dado que o app está em publicação ativa (várias stories nesta mesma sprint), a estratégia do Service Worker precisa sempre buscar a versão mais nova quando online, só usando o cache quando genuinely offline.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Chrome Android/desktop, online | Visita o site | Prompt "Instalar app" disponível | N/A |
| Safari iPhone | "Adicionar à Tela de Início" | Abre em modo standalone (sem barra do navegador) | N/A |
| Offline, app já visitado antes | Sem rede | Shell carrega do cache, não fica em branco | N/A |
| Nova versão publicada, usuário online | Recarrega o app | Pega a versão nova, não fica preso na antiga | N/A |
| Navegador sem suporte a Service Worker | Registro falha | App continua funcionando normalmente, sem instalação | Silencioso, sem erro visível |

</frozen-after-approval>

## Code Map

- `index.html:11` -- `<link rel="manifest" href="data:...">` -- substituir por `<link rel="manifest" href="manifest.json">`
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` -- já existem na raiz do repo, reaproveitar como estão
- Novo arquivo `manifest.json` -- mesmo conteúdo do manifest inline atual, ícones apontando pros arquivos locais (`./icon-192.png`, `./icon-512.png`) em vez do host externo do GitHub Pages
- Novo arquivo `sw.js` -- Service Worker mínimo
- `index.html` (final do script, perto de `fbBoot()`) -- registro do Service Worker, condicional a `'serviceWorker' in navigator`

## Tasks & Acceptance

**Execution:**
- [ ] `manifest.json` -- criar com o mesmo conteúdo do manifest inline hoje, ícones locais -- elimina a dependência do host externo
- [ ] `index.html:11` -- trocar o `<link rel="manifest">` pra apontar pro arquivo novo
- [ ] `sw.js` -- criar: `install` cacheia o shell (`./`, `index.html`, ícones); `fetch` faz network-first pra navegação/`index.html` (sempre busca versão nova quando online, cache só como fallback offline) e cache-first pros ícones (estáticos, raramente mudam); `activate` limpa cache de versão antiga
- [ ] `index.html` -- registrar o Service Worker (`navigator.serviceWorker.register('sw.js')`), sem bloquear o boot do app, sem erro visível se não suportado

**Acceptance Criteria:**
- Given o app publicado com HTTPS (GitHub Pages já serve assim), when acessado no Chrome Android/desktop, then o navegador oferece "Instalar app".
- Given o mesmo link no Safari do iPhone, when o usuário usa "Adicionar à Tela de Início", then o app abre em modo standalone.
- Given o app já foi aberto uma vez (shell em cache), when o usuário abre offline, then o shell carrega (não fica em branco).
- Given uma nova versão do `index.html` publicada, when o usuário reabre o app online, then a versão nova é usada (network-first).

## Design Notes

Estratégia do Service Worker é deliberadamente **network-first pro shell, cache-first só pros ícones** — o app está em publicação ativa (5 stories já foram ao ar nesta sessão), então cache-first pro `index.html` prenderia usuários numa versão desatualizada até o cache expirar/ser limpo manualmente. Cache só existe pra cobrir o cenário "sem rede", não pra acelerar o caso comum (que já é rápido, é um único arquivo).

`description` do manifest **não** inclui "— Elite Ar" mesmo que o manifest inline antigo tivesse — mesmo motivo do Addendum A da Story 2 (produto agora é multi-tenant, texto genérico de branding não pode citar uma empresa específica). "Mesmo conteúdo do manifest inline atual" no Code Map se refere à estrutura/campos, não a esse texto específico.

`manifest.json` real (não mais `data:` URI) também é mais robusto: `data:` URIs em atributos `href` têm suporte inconsistente entre navegadores pra `rel="manifest"`, e um arquivo separado é o padrão documentado.

## Verification

**Manual checks (sem CLI/suíte de testes no projeto):**
- Abrir `http://localhost:5173` no Chrome desktop, DevTools → Application → Manifest: confirmar que carrega sem erro e mostra os ícones corretos.
- DevTools → Application → Service Workers: confirmar que registra sem erro.
- Simular offline (DevTools → Network → Offline) e recarregar -- confirmar que o shell ainda carrega.
- Testar instalação real num Android (Chrome) e num iPhone (Safari, "Adicionar à Tela de Início") quando possível.

## Suggested Review Order

- Manifest real (ícones locais, `id` fixo para não duplicar instalação se `start_url` mudar no futuro).
  [`manifest.json`](../../../../manifest.json)

- Service Worker -- estratégia network-first pro shell, cache-first pros ícones, com as correções pós-review (cache por item em vez de tudo-ou-nada, nunca cacheia resposta de erro, nunca devolve `undefined` pro navegador, aviso pro app via `postMessage` se algo não cachear).
  [`sw.js`](../../../../sw.js)

- Registro do Service Worker + listener de aviso, sem competir com o boot do app.
  [`index.html:5566`](../../../../index.html#L5566)
