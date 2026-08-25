# Epic 1 Context: Pivô Multi-Tenant

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Transformar o MAPPO de ferramenta interna da Elite Ar (autenticação cosmética, workspace único fixo) numa plataforma multi-tenant: qualquer Empresa Contratante que despache técnicos a campo se cadastra, escolhe um Ramo, recebe um checklist pré-configurado editável, e opera isolada de qualquer outra empresa na mesma base — preservando 100% do motor de sincronização offline-first já validado em uso real. Único épico do projeto: autenticação real, isolamento por workspace, templates por Ramo, OS/foto/GPS/link público, PWA, financeiro, VRF multi-obra, convites, vocabulário de serviço por Ramo. Nota de estado: a Architecture Spine registra as 14 stories originais como implementadas e validadas em 2026-08-25; a Story 15 (CAP-16) foi adicionada depois dessa validação e ainda não está coberta por nenhum relatório existente.

## Stories

- Story 1.1: Autenticação real + isolamento multi-tenant (fundacional, bloqueante)
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
- Story 1.15: Vocabulário de serviço genérico e editável por Ramo, + Ramo customizado no cadastro

## Requirements & Constraints

- Nenhuma credencial em texto plano no cliente/Firestore; perfil é verificado no servidor — alterar estado local nunca muda o perfil efetivo aceito pelas regras.
- Isolamento de workspace é absoluto, testado no Emulator Suite para 5 perfis (não autenticado, autenticado sem workspace, gestor, técnico, usuário de outro workspace) antes de qualquer publicação de regra.
- Cadastro exige Ramo selecionado; ao menos 2 Ramos (Refrigeração/Climatização, Manutenção Predial) têm template pronto; Ramo sem template recebe o genérico mais próximo, sinalizado como ajustável.
- Toda foto é comprimida antes de gravar, em todo ponto de captura presente e futuro; OS com fotos não deve exceder 1MB sem aviso visível.
- GPS ao Vivo (até 10h) exige consentimento explícito, uma vez por pessoa; check-in sem GPS disponível nunca bloqueia o fluxo.
- Link Público tem validade e revogação manual; expirado/revogado nunca retorna dado; payload malicioso em qualquer campo de texto nunca executa, inclusive na página pública.
- Sincronização offline→online deve manter comportamento idêntico ao atual — qualquer desvio é regressão, não melhoria.
- Financeiro: preço por serviço é editável por Ramo; prestador só vê valor das próprias OS (nunca de outro nem notas de adiantamento, que nunca entram no cálculo de pago/a pagar).
- VRF (fases com fotos+nota) só aparece para Ramo Refrigeração; outros Ramos usam "Criar Tarefas" reaproveitando a Tarefa Adicional existente.
- Convite de prestador é código de uso único gerado pelo gestor, válido até revogação. Multi-obra VRF isola progresso/fotos/notas/checkins por obra, sem orçamento/prazo/custo por obra. Feedback do piloto é visível só ao proprietário.
- Vocabulário de serviço (categorias de preço, rótulo de módulo, dropdown "Tipo de Serviço") é genérico-editável para qualquer Ramo fora de Refrigeração, inclusive Ramo customizado — nunca herda o vocabulário de Refrigeração; corrigir o bug de `PRECO_TEMPLATES.predial` ser cópia de `refrigeracao`.
- Migração de dado real (`mappo_tecnicos`) exige backup do Firestore e plano de rollback antes de executar.
- Nenhuma dependência nova sem aprovação (stack pinada: Firebase compat 10.12.2, Leaflet 1.9.4, jsPDF 2.5.1); nenhum commit direto em `main`; mudança em `firestore.rules`/`firestore.indexes.json` só após teste no Emulator Suite e autorização explícita separada da autorização de commit.

## Technical Decisions

- Paradigma ratificado: local-first monolith em `index.html` único, sem build/framework — `localStorage` é fonte local, Firestore é camada de sync via motor de merge próprio. Zonas por comentário-banner; prefixos `fb*` (Firestore), `_*` (helper interno), `SCREAMING_SNAKE` (constante), `camelCase` (estado/UI) são o único encapsulamento — preservar.
- Todo dado de tenant vive em `workspaces/{workspaceId}/data/{doc}`; `workspaceId` é sempre o caminho, nunca campo filtrado em query.
- Autorização via documento de membership (`workspaces/{workspaceId}/members/{uid}`, `{role}`), lido por `get()` nas regras — nunca custom claims/Cloud Functions. `WORKSPACE` é variável de sessão resolvida uma vez após auth+membership, nunca parâmetro passado função a função.
- Descoberta de workspace por uid é lookup global separado: `userWorkspaces/{uid}` → `{workspaceId}`, coleção de topo, cada uid só lê o próprio doc. Boot: auth → `userWorkspaces` → `members/{uid}` → `role` → `WORKSPACE` → `fbReady=true`. Cache local reusado offline sem revalidar (risco aceito de acesso residual até próximo boot com rede).
- Templates de Checklist/preço por Ramo são constantes JS (padrão `VRF_FASES`), clonadas como dado comum no workspace no cadastro — nunca coleção Firestore de templates. Um workspace tem um Ramo e uma chave genérica por tipo de template (nunca uma chave por Ramo).
- Motor de merge (`SYNC_KEYS`/`ITEM_LISTS`/`LEAF_MAPS`/`APPEND_LISTS`/`MERGE_MAPS`) mantém assinatura e comportamento idênticos — única mudança é `WORKSPACE` virar dinâmico.
- `uid` é campo adicional em `mappo_tecnicos`, chave de junção com `members/{uid}` — não é nova chave de merge (continua por `nome`; duplicidade de nome no mesmo workspace segue sem solução).
- Nenhum backend novo: toda autorização em `firestore.rules`, toda lógica no cliente.
- Só `members/{uid}` usa campos reais no topo; todo outro dado sincronizado usa o envelope `{json,updatedAt,by}`. Coleções-raiz write-only com campos reais (`userWorkspaces`, `convites/{codigo}`, `feedback/{id}`) são o padrão para dado que nunca volta ao cliente via sync — nunca entram em `SYNC_KEYS`.
- Toda captura de foto passa por função de compressão única (canvas+JPEG); nenhum ponto grava direto do `FileReader`.
- Expiração de Link Público é campo `expiraEm` checado em dois lugares (UI e regra); revogação manual zera `expiraEm`. Sanitização XSS é função de escape única, compartilhada entre app autenticado e página pública.
- Lista de atribuição de técnico a subconjunto de recurso (ex.: obras VRF) vive como array dentro do próprio registro em `mappo_tecnicos` — nunca como campo "quem tem acesso" na entidade-alvo, porque só `mappo_tecnicos` tem escrita travada a gestor hoje. Gate hoje é só client-side, regra não valida a lista em si (debt conhecido).

## Cross-Story Dependencies

- Story 1.1 é fundacional — todas as demais dependem dela (workspace, membership e regras precisam existir antes).
- Sequência obrigatória: Story 1.1 antes de regras por perfil consolidadas, antes de Story 1.5 (revogação segura de link). Story 1.3 é independente e pode rodar em paralelo.
- Story 1.6 verifica não-regressão do motor de sync após as Stories 1.1–1.5 — não é feature nova; desvio é bug a reportar, não melhoria a aplicar.
- Story 1.7 (PWA) só depois das Stories 1.1–1.6 estáveis.
- Story 1.9 reaproveita o editor de checklist construído na Story 1.2.
- Story 1.11 toca `firestore.rules` com o mesmo rigor de Emulator Suite/autorização das Stories 1.1 e 1.5.
- Story 1.13 reaproveita o padrão de merge por id já existente — maior escopo do épico, toda função do VRF que assume "a obra" única passa a assumir "a obra selecionada".
- Story 1.15 depende da Story 1.8 (corrige o bug de `PRECO_TEMPLATES.predial` herdado dela) e da Story 1.2 (fallback de checklist genérico-editável reaproveita `RAMO_TEMPLATES`); reverte conscientemente o non-goal anterior de "máx. 2 Ramos".
