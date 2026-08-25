<!-- bmad:context -->
<!-- Verified 2026-08-25 against 4667359. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## MAPPO (Elite Ar)

Sistema de gestão de campo (ordens de serviço, obras VRF, GPS, check-ins), em transição de single-tenant (Elite Ar) para produto multi-tenant. As 14 stories de `_bmad-output/specs/spec-mappo/stories.yaml` (todo o épico) estão implementadas e publicadas — autenticação real, onboarding por Ramo, compressão de foto, GPS com consentimento, link público com expiração/XSS, verificação de sincronização, PWA, aba financeira, VRF restrito ao Ramo, mapa com avatar/histórico, convite de prestador gerado pelo gestor, pontos de entrada (WhatsApp/Compartilhar), multi-obra no VRF, avaliação do app. App em `index.html` (HTML+CSS+JS, sem build, sem framework) sincronizado com Cloud Firestore (SDK compat v10.12.2); `manifest.json`/`sw.js` (Story 7) e `avatar-1.svg` a `avatar-6.svg` (Story 10, avatares do mapa) são os únicos outros arquivos-fonte da aplicação. Auditoria técnica original em `_audit/mappo-initial-audit.md` (pré-Story-1; vários achados já corrigidos, ver `deferred-work.md` para o que continua real).

## Policy

- `index.html` é o app inteiro em arquivo único — edite cirurgicamente (trecho/função específica); nunca reescreva ou reformate o arquivo inteiro, nem faça refactors amplos numa mesma tarefa.
- Uso de skills BMAD limitado a 4–5 por tarefa; se precisar de mais, quebre a tarefa em etapas menores com checagem ao final de cada uma.
- Ao final de cada etapa, pare e reporte um resumo do que foi feito seguido de uma pergunta direta pedindo autorização explícita antes de seguir pra próxima — nunca encadear etapas sem essa checagem. Não há um vocabulário fixo de status (`APROVADA`/`BLOQUEADA`) exigido; o que importa é a autorização explícita ter acontecido antes de avançar.
- Nunca executar deploy, alteração de `firestore.rules` em produção, ou migração de dados sem autorização explícita por escrito do proprietário — inclusive quando rodando em modo mais autônomo ("bmad loop"), esse gate nunca é afrouxado.
- Antes de qualquer migração de dados, exigir backup do Firestore/`localStorage` e um plano de rollback definido — nunca migrar "às cegas". Uma migração não-destrutiva (nunca apaga/sobrescreve a chave/dado original) é o padrão preferido — dobra como o próprio plano de rollback (reverter o commit basta).
- Nunca commitar direto em `main` sem autorização explícita do proprietário para o commit específico (na prática, todo o trabalho deste projeto roda direto em `main`, por escolha do proprietário — a autorização por commit é o que substitui o fluxo de branch).
- Nenhuma mudança em `firestore.rules`/`firestore.indexes.json` vai a produção sem teste prévio no Firebase Emulator Suite (`@firebase/rules-unit-testing`, projeto de teste isolado fora do repo — ver histórico das Stories 1, 5, 11 e 14 pra referência de setup e de como estender a suíte).
- Testar fluxos reais (cadastro, GPS, etc.) contra produção sempre com dados descartáveis e identificáveis como teste (nome/e-mail únicos) — não há emulador para o app em si, só para `firestore.rules`; limpar workspaces/contas de teste depois.

## Where things are

- App inteiro: `index.html`, `manifest.json`, `sw.js`, `avatar-1.svg`..`avatar-6.svg` (não há outros arquivos-fonte de aplicação)
- Riscos e achados verificados: `_audit/mappo-initial-audit.md` (auditoria original, pré-Story-1) e `_bmad-output/implementation-artifacts/deferred-work.md` (achados reais de cada story, ainda abertos) — leia os dois antes de qualquer mudança em autenticação, Firestore, fotos ou GPS
- Contrato canônico do pivô multi-tenant: `_bmad-output/specs/spec-mappo/` (`SPEC.md`, `glossary.md`, `stories.yaml` — 14 stories, todas `done`, épico fechado)
- Rastreamento de implementação: `_bmad-output/implementation-artifacts/sprint-status.yaml` (status por story) e `deferred-work.md`
- Planejamento BMAD (briefs, PRD, arquitetura): `_bmad-output/planning-artifacts/` — a espinha de arquitetura (`architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md`) tem uma seção `Deferred` com opções de infraestrutura pra evoluir o produto (App Check, backup automático, observabilidade, hosting, etc.) — consultar antes de propor algo novo nessa área
- Plano mestre de fases (autoria do proprietário, não gerado por skill): `project-context.md` — visão de longo prazo em 27 fases; não duplicar aqui, só referenciar
- Config Firebase: `firebase.json` (só `firestore`, sem `hosting`), `firestore.rules` (versionado desde a Story 1; mudou de novo nas Stories 5, 11 e 14), `firestore.indexes.json`, `.firebaserc`

## Running and verifying

- Não há `package.json`, build, lint, CI nem suíte de testes automatizada commitada no projeto — nenhuma mudança pode ser verificada automaticamente por padrão; teste manualmente no navegador e declare isso no report de status.
- Servidor local pra testar manualmente: `npx serve` (ou equivalente) servindo a raiz do repo, porta 5173 é a convenção usada até aqui.
- Emulator Suite exige Java no PATH desta sessão (não persiste entre chamadas): `export PATH="/c/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot/bin:$PATH"` antes de `firebase emulators:start`.
- `firebase.json` só cobre `firestore` (regras/índices); não há bloco `hosting` — `firebase deploy` hoje não publica o site (isso vai via `git push` para `main`, servido por GitHub Pages).

## Known pitfalls

- Todo workspace novo nasce `status:'pendente'` em `firestore.rules` — sem dado acessível até o dono do projeto aprovar manualmente no Firebase Console (editar o campo pra `'ativo'`, fora do alcance das regras). Esquecer esse passo depois de um cadastro parece bug ("não consigo ver meus dados"), mas é o gate funcionando como desenhado — não "corrigir" removendo o gate sem decisão explícita do proprietário.
- Vínculo de técnico ao workspace: desde a Story 11, o caminho principal é o gestor gerar um código de convite de uso único (`convites/{codigo}`, revogável) que o próprio prestador consome (nome + código, sem o gestor colar nada). O fluxo antigo (colar UID copiado manualmente, sem verificação de identidade) continua existindo só como fallback "Avançado", e carrega o mesmo risco residual de sempre se usado — mas deixou de ser o caminho principal.
- Vocabulário de OS/técnico (dropdown "Tipo de Serviço", "Quantidade de splits", módulos ❄️Split/🌡️VRF) continua fixo em refrigeração pra qualquer Ramo — só o checklist é personalizado por Ramo (Story 2). Não é bug, é escopo intencionalmente menor (Addendum B, registrado em `deferred-work.md`) até uma conversa de desenho dedicada.
- `firestore.rules` não restringe a escrita de `mappo_checklist_config` a gestor (ao contrário de `mappo_tecnicos`) — qualquer membro do workspace pode escrevê-lo via SDK direto, mesmo a UI só expondo pra gestor. Ver `deferred-work.md`.
- Zero testes automatizados *commitados* no repo — mas cada story publicada foi verificada com um script efêmero real (Emulator Suite pra mudanças de regra, extração+execução das funções puras de merge, Playwright pra fluxos de UI e migrações de dado), descartado ao final. Peça o padrão de teste da story anterior mais parecida antes de reinventar.
- Sistema VRF: `vrfObra` (objeto único) virou `vrfObras` (lista, Story 13) — um workspace pode ter várias obras, cada uma com progresso/fotos/notas/check-ins/relatórios isolados; técnico só vê as obras que o gestor atribuiu a ele. A chave antiga (`mappo_vrf_obra`, singular) continua em `SYNC_KEYS` de propósito — nunca é apagada, é o próprio plano de rollback da migração.

<!-- /bmad:context -->
