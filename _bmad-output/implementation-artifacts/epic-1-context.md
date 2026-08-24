# Epic 1 Context: MAPPO — Pivô Multi-Tenant

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

MAPPO is a real, daily-use field-team management tool for Elite Ar (service orders with checklist, photo, signature, technician GPS, client tracking via public link). Epic 1 is the only epic — it carries the whole multi-tenant pivot: any company dispatching field technicians signs up, picks a Ramo (line of business), gets an editable pre-configured checklist template, and operates fully isolated from every other company, plus a batch of product features on top (financial tracking, provider invites, map avatars, multi-obra VRF, WhatsApp/Share entry points, pilot feedback). No part of this epic decides pricing/billing.

**Foundation status:** Stories 1.1–1.7 (CAP-1..8 — real auth, multi-tenant isolation, Ramo onboarding, photo compression, GPS consent, public-link security, offline-sync verification, PWA) are already implemented and published; the production-rules exposure risk (former Open Question) is resolved (live rules were `allow read,write: if true`, now fixed and Emulator-tested). Stories 1.8–1.14 (CAP-9..15) build on that foundation but have **no dedicated architecture decisions yet** — the architecture spine only binds FR-1..17 (≈CAP-1..8). For those later stories, `SPEC.md` is the current contract.

## Stories

- Story 1.1: Autenticação real + isolamento multi-tenant (foundational, done)
- Story 1.2: Onboarding com Ramo e Template de Checklist
- Story 1.3: Compressão de foto consistente em todos os pontos de captura
- Story 1.4: GPS ao vivo com consentimento explícito
- Story 1.5: Link Público com expiração, revogação e sanitização contra XSS
- Story 1.6: Verificação de não-regressão da sincronização offline-first
- Story 1.7: Instalação multiplataforma via PWA
- Story 1.8: Aba Financeira por serviço e prestador
- Story 1.9: VRF restrito ao Ramo Refrigeração + checklist editável
- Story 1.10: Mapa — painel recolhível, avatar do prestador, histórico de localização
- Story 1.11: Convite de prestador gerado pelo gestor, revogável
- Story 1.12: Pontos de entrada novos — WhatsApp e Compartilhar app
- Story 1.13: Multi-obra no VRF
- Story 1.14: Avaliação do app (feedback do piloto)

## Requirements & Constraints

- **Auth/isolation:** one real Firebase Auth account per person, role decided server-side, never trusted from client state; cross-workspace isolation verified in the Emulator Suite across 5 profiles.
- **Onboarding:** signup requires a Ramo; ≥2 Ramos have a ready template; editing one company's checklist never touches another's; unmatched Ramo falls back to the closest generic template.
- **Photos:** every capture point compresses before persisting, present and future; an OS with photos should never exceed 1MB without a visible warning.
- **GPS:** live GPS (≤10h) needs one-time-per-person consent before first activation; check-in without GPS never blocks the flow.
- **Public link:** expired/revoked links never return data; all user-text fields are XSS-safe, including the public page; touches `firestore.rules`.
- **Sync (1.6):** pure verification — every offline→online sequence must behave identically to today; deviations are regressions, not improvements to apply.
- **PWA:** installable Android/desktop/iPhone; only makes sense once 1.1–1.6 are stable.
- **Financial (1.8):** price table editable per Ramo; OS value visible workspace-wide to manager, prestador sees only their own OS value, never another's or the advance-notes block; advance notes are free text, excluded from paid/owed math.
- **VRF restriction (1.9):** Sistema VRF shows only for Ramo Refrigeração/Climatização; other Ramos see "Criar Tarefas" (repoints to existing Tarefa Adicional, nothing new); phase checklist becomes editable without flattening phase structure.
- **Map (1.10):** collapsible provider panel must stop covering controls; avatar has exactly 2 static states (idle/"walking" via CSS, no sprite swap, no real-path replay); location history list per provider below map.
- **Provider invite (1.11):** manager-generated, single-use code, valid until revoked; replaces provider self-generating a UID; likely touches `firestore.rules`.
- **New entry points (1.12):** WhatsApp button on login → `62994299385`, pre-filled "sou gestor, queria utilizar o mappo"; "Compartilhar app" via Web Share API with copy-link fallback.
- **Multi-obra (1.13):** largest-scope story — `vrfObra` goes from single object to list; every VRF function assuming "the obra" must assume "the selected obra" (progress/photos/notes/check-ins isolated per obra); no budget/deadline/cost per obra.
- **Feedback (1.14):** low-risk — rating + free text, owner-only visibility, listed with date/workspace; no formal analytics/NPS panel.
- **Global constraints:** no `firestore.rules`/`firestore.indexes.json` change to production without a prior Emulator Suite run; no new backend (Cloud Functions/custom claims) — authorization stays in declarative rules; `index.html` stays single-file, changes surgical; no new dependency beyond pinned (Firebase compat SDK 10.12.2, Leaflet 1.9.4, jsPDF 2.5.1) without approval; real-data migrations need a Firestore backup + rollback plan; no direct commit to `main` without per-commit authorization.
- **Non-goals:** monetization/billing, generic PM pivot, full multi-company admin panel, self-service onboarding, non-PWA packaging, photo migration to Firebase Storage, >2 Ramos, self-service password recovery/social login, per-resource authorization, staging env, CI/CD, full accounting (1.8), generic per-Ramo "obra" modeling beyond VRF (1.9), real-path GPS replay (1.10), budget/cost per obra (1.13), formal NPS panel (1.14).
- **Success signal:** ≥1 pilot company uses MAPPO daily and would pay for it; non-negotiable regardless: no company's data ever appears to another, verified in the Emulator Suite before publish.

## Technical Decisions

- **Path-based isolation:** tenant data at `workspaces/{workspaceId}/data/{doc}`; `workspaceId` is never a query filter (app uses zero queries).
- **Authorization via membership doc:** `workspaces/{workspaceId}/members/{uid}` → `{role}`, read via `get()` in rules; nothing under `.../data/{doc}` is trusted for permission.
- **Global workspace lookup:** `userWorkspaces/{uid}` → `{workspaceId}`, one person = one workspace; `WORKSPACE` is module-level `let`, resolved once at boot (auth → lookup → membership → `fbReady`), cached in `localStorage` for offline boot.
- **Templates/price tables are code, cloned as data at signup:** each Ramo is a JS constant (pattern of `VRF_FASES`), cloned once into the workspace under one generic `SYNC_KEYS` entry (never key-per-Ramo); post-clone copy is independent. Same per-Ramo pattern applies to the 1.8 price table.
- **Merge engine untouched:** `SYNC_KEYS`/`ITEM_LISTS`/`LEAF_MAPS`/`APPEND_LISTS`/`MERGE_MAPS` and `_merge*` keep identical signature/behavior; Story 1.13's obra list reuses the existing `ITEM_LISTS` id-based merge (same as `mappo_os`), no new mechanism.
- **Envelope discipline:** `members/{uid}` is the only doc type with real top-level fields; everything else, including cloned checklists/price tables, uses the sync envelope `{json, updatedAt, by}`.
- **No new backend:** all authorization in `firestore.rules`, all business logic client-side.
- **Photo compression:** one shared canvas+JPEG routine, no bypass at any capture point.
- **Public link expiration:** `pub_{token}.expiraEm` checked client-side and in rules; revocation sets it to "now."
- **XSS sanitization:** one shared escape function at every `innerHTML` interpolation, same for authenticated app and public page.
- **Avatar (1.10):** static SVG asset, no new runtime dependency; "walking" is CSS animation, not sprite swap.
- **Stack frozen:** Firebase compat SDK 10.12.2, Leaflet 1.9.4, jsPDF 2.5.1.

## UX & Interaction Patterns

- Financial view (1.8): Financeiro → Serviço → Prestador → valores/status; OS value read-only for the prestador.
- VRF checklist editor (1.9) reuses the same editor as Configurações → Checklist (1.2); non-Refrigeração Ramos get "Criar Tarefas" pointing at existing Tarefa Adicional.
- Map panel (1.10) collapses/expands to stop covering controls; provider history list sits below the map.
- Invite flow (1.11) replaces manual UID paste/send as the primary path.
- WhatsApp entry (1.12) is a login-screen button; Share uses the native device sheet with copy-link fallback.
- Multi-obra (1.13): manager selects one obra from a list; checklist/progress/prestadores below reflect only that selection.

## Cross-Story Dependencies

- Story 1.1 is foundational for all others (already resolved/published).
- Stories 1.5 and 1.11 touch `firestore.rules` with the same Emulator Suite + explicit-authorization rigor as 1.1.
- Story 1.6 is a verification pass over 1.1–1.5, not new feature work.
- Story 1.7 (PWA) only makes sense once 1.1–1.6 are stable.
- Story 1.9's checklist editor and "Criar Tarefas" path reuse Story 1.2's editor and the existing Tarefa Adicional feature respectively.
- Story 1.8's per-Ramo price table follows the same pattern as Story 1.2's per-Ramo checklist template.
- Story 1.13 (largest scope) depends on Story 1.9's VRF/Ramo restriction already being in place.
