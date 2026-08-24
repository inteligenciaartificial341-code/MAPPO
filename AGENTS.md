<!-- bmad:context -->
<!-- Verified 2026-08-24 against 5792366. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## MAPPO (Elite Ar)

Sistema de gestão de campo (ordens de serviço, obras VRF, GPS, check-ins), em transição de single-tenant (Elite Ar) para produto multi-tenant. As 7 stories de `_bmad-output/specs/spec-mappo/stories.yaml` estão implementadas e publicadas (autenticação real, onboarding por Ramo, compressão de foto, GPS com consentimento, link público com expiração/XSS, verificação de sincronização, PWA). App em `index.html` (HTML+CSS+JS, sem build, sem framework) sincronizado com Cloud Firestore (SDK compat v10.12.2); `manifest.json`/`sw.js` (Story 7) são os únicos outros arquivos-fonte da aplicação. Auditoria técnica original em `_audit/mappo-initial-audit.md` (pré-Story-1; vários achados já corrigidos, ver `deferred-work.md` para o que continua real).

## Policy

- `index.html` é o app inteiro em arquivo único — edite cirurgicamente (trecho/função específica); nunca reescreva ou reformate o arquivo inteiro, nem faça refactors amplos numa mesma tarefa.
- Uso de skills BMAD limitado a 4–5 por tarefa; se precisar de mais, quebre a tarefa em etapas menores com checagem ao final de cada uma.
- Ao final de cada etapa, pare e reporte status explícito antes de seguir para a próxima: `APROVADA`, `APROVADA COM RESSALVAS` ou `BLOQUEADA`; nunca encadeie etapas sem essa checagem.
- Nunca executar deploy, alteração de `firestore.rules` em produção, ou migração de dados sem autorização explícita por escrito do proprietário — inclusive quando rodando em modo mais autônomo ("bmad loop"), esse gate nunca é afrouxado.
- Antes de qualquer migração de dados, exigir backup do Firestore/`localStorage` e um plano de rollback definido — nunca migrar "às cegas".
- Nunca commitar direto em `main` sem autorização explícita do proprietário para o commit específico (na prática, todo o trabalho deste projeto roda direto em `main`, por escolha do proprietário — a autorização por commit é o que substitui o fluxo de branch).
- Nenhuma mudança em `firestore.rules`/`firestore.indexes.json` vai a produção sem teste prévio no Firebase Emulator Suite (`@firebase/rules-unit-testing`, projeto de teste isolado fora do repo — ver histórico das Stories 1 e 5 pra referência de setup e de como estender a suíte).
- Testar fluxos reais (cadastro, GPS, etc.) contra produção sempre com dados descartáveis e identificáveis como teste (nome/e-mail únicos) — não há emulador para o app em si, só para `firestore.rules`; limpar workspaces/contas de teste depois.

## Where things are

- App inteiro: `index.html`, `manifest.json`, `sw.js` (não há outros arquivos-fonte de aplicação)
- Riscos e achados verificados: `_audit/mappo-initial-audit.md` (auditoria original, pré-Story-1) e `_bmad-output/implementation-artifacts/deferred-work.md` (achados reais de cada story, ainda abertos) — leia os dois antes de qualquer mudança em autenticação, Firestore, fotos ou GPS
- Contrato canônico do pivô multi-tenant: `_bmad-output/specs/spec-mappo/` (`SPEC.md`, `glossary.md`, `stories.yaml` — 7 stories, todas `done`)
- Rastreamento de implementação: `_bmad-output/implementation-artifacts/sprint-status.yaml` (status por story) e `deferred-work.md`
- Planejamento BMAD (briefs, PRD, arquitetura): `_bmad-output/planning-artifacts/` — a espinha de arquitetura (`architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md`) tem uma seção `Deferred` com opções de infraestrutura pra evoluir o produto (App Check, backup automático, observabilidade, hosting, etc.) — consultar antes de propor algo novo nessa área
- Plano mestre de fases (autoria do proprietário, não gerado por skill): `project-context.md` — visão de longo prazo em 27 fases; não duplicar aqui, só referenciar
- Config Firebase: `firebase.json` (só `firestore`, sem `hosting`), `firestore.rules` (versionado desde a Story 1, mudou de novo na Story 5), `firestore.indexes.json`, `.firebaserc`

## Running and verifying

- Não há `package.json`, build, lint, CI nem suíte de testes automatizada commitada no projeto — nenhuma mudança pode ser verificada automaticamente por padrão; teste manualmente no navegador e declare isso no report de status.
- Servidor local pra testar manualmente: `npx serve` (ou equivalente) servindo a raiz do repo, porta 5173 é a convenção usada até aqui.
- Emulator Suite exige Java no PATH desta sessão (não persiste entre chamadas): `export PATH="/c/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot/bin:$PATH"` antes de `firebase emulators:start`.
- `firebase.json` só cobre `firestore` (regras/índices); não há bloco `hosting` — `firebase deploy` hoje não publica o site (isso vai via `git push` para `main`, servido por GitHub Pages).

## Known pitfalls

- Todo workspace novo nasce `status:'pendente'` em `firestore.rules` — sem dado acessível até o dono do projeto aprovar manualmente no Firebase Console (editar o campo pra `'ativo'`, fora do alcance das regras). Esquecer esse passo depois de um cadastro parece bug ("não consigo ver meus dados"), mas é o gate funcionando como desenhado — não "corrigir" removendo o gate sem decisão explícita do proprietário.
- Vínculo de técnico ao workspace é por UID copiado/colado manualmente (sem verificação de identidade) — um UID errado ou malicioso concede acesso real a um estranho. Risco aceito para o piloto (poucas empresas conhecidas); não escalar sem revisar isso primeiro.
- Vocabulário de OS/técnico (dropdown "Tipo de Serviço", "Quantidade de splits", módulos ❄️Split/🌡️VRF) continua fixo em refrigeração pra qualquer Ramo — só o checklist é personalizado por Ramo (Story 2). Não é bug, é escopo intencionalmente menor (Addendum B, registrado em `deferred-work.md`) até uma conversa de desenho dedicada.
- `firestore.rules` não restringe a escrita de `mappo_checklist_config` a gestor (ao contrário de `mappo_tecnicos`) — qualquer membro do workspace pode escrevê-lo via SDK direto, mesmo a UI só expondo pra gestor. Ver `deferred-work.md`.
- Zero testes automatizados *commitados* no repo — mas cada story publicada nesta sprint foi verificada com um script efêmero real (Emulator Suite pra mudanças de regra, extração+execução das funções puras de merge, Playwright pra fluxos de UI), descartado ao final. Peça o padrão de teste da story anterior mais parecida antes de reinventar.

<!-- /bmad:context -->
