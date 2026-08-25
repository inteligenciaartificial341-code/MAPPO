---
id: SPEC-mappo
companions:
  - glossary.md
  - ../../planning-artifacts/architecture/architecture-mappo-2026-08-22/ARCHITECTURE-SPINE.md
  - ../../../AGENTS.md
  - ../../../project-context.md
sources:
  - ../../planning-artifacts/prds/prd-mappo-2026-08-22/prd.md
  - ../../planning-artifacts/briefs/brief-mappo-2026-08-21/brief.md
  - ../../planning-artifacts/briefs/brief-mappo-2026-08-22/brief.md
  - ../../planning-artifacts/briefs/brief-mappo-2026-08-22/addendum.md
  - ../../../_audit/mappo-initial-audit.md
---

> **Canonical contract.** Este SPEC e os arquivos em `companions:` são o contrato completo, validado por preservação, do que construir, testar e validar. Os documentos em `sources:` servem só para rastreabilidade — consulte-os apenas se precisar de raciocínio narrativo que este contrato omite de propósito.

# SPEC: MAPPO — Pivô Multi-Tenant

## Why

MAPPO é hoje uma ferramenta interna real, em uso pela Elite Ar, de gestão de equipes em campo. A tese é que o mesmo motor — criar um atendimento, executar com checklist, localizar a equipe, prestar contas ao cliente — resolve o mesmo problema para qualquer empresa que despache técnicos a campo, não só climatização. É simultaneamente uma oportunidade a capturar (empresas do círculo do proprietário dispostas a testar de graça) e um risco crítico a resolver primeiro (autenticação cosmética e regras do Firestore desalinhadas, seguras o bastante para uma empresa, insustentáveis com dados reais de várias). Nenhuma parte deste trabalho decide preço ou quando cobrar — isso é adiado de propósito até o piloto validar valor.

## Capabilities

- **CAP-1 — Autenticação real por pessoa**
  - **intent:** Gestor e Técnico autenticam com conta Firebase real, uma por pessoa, com o perfil verificado no servidor via documento de membership — não mais login fixo em texto plano.
  - **success:** Nenhuma credencial existe em texto plano no código-cliente ou em documento do Firestore; alterar o estado do cliente não muda o perfil efetivamente aceito pelas regras.

- **CAP-2 — Isolamento multi-tenant por workspace**
  - **intent:** Cada Empresa Contratante opera num workspace isolado; nenhuma leitura ou escrita cruza workspaces, mesmo por erro de implementação.
  - **success:** No Firebase Emulator Suite, um usuário autenticado da Empresa A nunca lê nem escreve dado da Empresa B — testado para 5 perfis: não autenticado, autenticado sem workspace, gestor, técnico, usuário de outro workspace.

- **CAP-3 — Onboarding com Ramo e Template de Checklist**
  - **intent:** No cadastro, a Empresa Contratante escolhe um Ramo e recebe um Template de Checklist pronto, que o dono edita livremente sem afetar outras empresas.
  - **success:** Cadastro não avança sem Ramo selecionado; ao menos 2 Ramos têm template pronto no lançamento; editar o checklist de uma empresa nunca altera o que outra empresa do mesmo Ramo recebe.

- **CAP-4 — Ordem de Serviço com compressão de foto consistente**
  - **intent:** Gestor cria e Técnico executa Ordens de Serviço com checklist, foto e assinatura; toda foto é comprimida antes de gravar, em todo ponto de captura.
  - **success:** Nenhuma foto é gravada sem compressão em nenhum ponto de captura; documento do Firestore de uma OS com fotos nunca excede 1MB sem aviso visível ao usuário.

- **CAP-5 — GPS de campo com consentimento**
  - **intent:** Técnico registra localização em check-in pontual e pode ativar GPS ao vivo (até 10h), sempre com consentimento explícito visto e aceito antes da primeira ativação.
  - **success:** Nenhum Técnico tem GPS ao Vivo ativado sem ter aceitado a tela de consentimento ao menos uma vez; check-in sem GPS disponível não bloqueia o fluxo.

- **CAP-6 — Link Público seguro**
  - **intent:** Cliente Final acompanha uma OS por link sem login, com validade configurável, revogável pelo Gestor, e imune a XSS mesmo com dado malicioso digitado por qualquer usuário.
  - **success:** Link expirado ou revogado nunca retorna dado, mostra mensagem clara; um payload de script cadastrado em qualquer campo de texto exposto nunca executa no navegador de outro usuário, incluindo a página pública.

- **CAP-7 — Sincronização offline-first preservada**
  - **intent:** O app funciona offline com `localStorage` como fonte local, sincroniza com o Firestore quando há rede, e resolve conflitos pelo motor de merge já existente — sem regressão de comportamento.
  - **success:** Toda sequência de uso offline→online hoje suportada continua funcionando de forma idêntica após a introdução do multi-tenant.

- **CAP-8 — Instalação multiplataforma via PWA**
  - **intent:** O MAPPO é instalável como app em Android, PC e iPhone, reaproveitando o código existente, sem exigir loja de aplicativos.
  - **success:** Chrome Android/desktop oferece o prompt de instalação; iPhone permite "Adicionar à Tela de Início" e abre em modo standalone.

- **CAP-9 — Aba Financeira por serviço/prestador**
  - **intent:** Gestor mantém uma tabela de preço editável por tipo de serviço, lança/acompanha valor por prestador e por Ordem de Serviço com status (pago/a pagar/total), mais um bloco de notas livre para adiantamentos; o valor lançado numa OS fica visível (só leitura) para o prestador dela.
  - **success:** Toda OS com valor lançado mostra esse valor para o prestador dela; a soma de pago/a pagar/total bate por prestador e por tipo de serviço; o bloco de notas de adiantamento nunca afeta o cálculo de valores por OS.

- **CAP-10 — VRF restrito ao Ramo + checklist editável**
  - **intent:** O módulo Sistema VRF (fases, fotos e notas preservadas) só aparece para workspaces do Ramo Refrigeração/Climatização; o checklist de cada fase vira editável (mesmo editor de Configurações → Checklist), sem achatar a estrutura de fases. Workspaces de outros Ramos veem "Criar Tarefas" (reaproveitando a Tarefa Adicional já existente) no lugar do VRF.
  - **success:** Um workspace de Ramo não-refrigeração nunca vê nem acessa o Sistema VRF; um workspace de Ramo refrigeração edita os itens de cada fase sem perder a divisão por fase.

- **CAP-11 — Mapa: painel recolhível, avatar do prestador, histórico de localização**
  - **intent:** O painel de informação do prestador no mapa recolhe/expande para não cobrir controles ao rolar a tela; cada prestador escolhe um avatar visual (parado em check-in fixo, "andando" em GPS ao vivo) que representa sua posição; abaixo do mapa, uma lista de prestadores mostra o histórico de localizações enviadas (dia/hora/semana).
  - **success:** O painel recolhido libera o botão hoje coberto; o avatar escolhido aparece no lugar do marcador padrão; o histórico lista as entradas por prestador com data/hora legível.

- **CAP-12 — Convite de prestador gerado pelo gestor, revogável**
  - **intent:** O gestor gera um código de convite e o envia ao prestador — inverte o fluxo atual (hoje o prestador gera/envia o próprio UID) — e o código fica válido até o gestor revogá-lo.
  - **success:** Um código revogado nunca mais autoriza um novo vínculo; o fluxo de colar UID manualmente deixa de ser o caminho principal de convite.

- **CAP-13 — Pontos de entrada novos (WhatsApp + compartilhar)**
  - **intent:** A tela de login ganha um botão "Sou gestor novo, gostaria de acesso" linkando pro WhatsApp do proprietário; o app do gestor ganha "Compartilhar app" no menu lateral, via Web Share API nativa.
  - **success:** O botão do WhatsApp abre uma conversa pré-preenchida com o número do proprietário; "Compartilhar" aciona o menu nativo do dispositivo, com fallback de copiar link se a API não existir no navegador.

- **CAP-14 — Multi-obra no VRF**
  - **intent:** Sistema VRF passa de uma única obra por workspace para uma lista de obras (uma empresa pode tocar mais de uma ao mesmo tempo); gestor vê a lista, seleciona uma, vê o checklist e os prestadores dela especificamente.
  - **success:** Um workspace com 2+ obras ativas mantém progresso/fotos/notas/checkins de cada uma isolados entre si; trocar de obra selecionada nunca mistura dado de outra.

- **CAP-15 — Avaliação do app (feedback do piloto)**
  - **intent:** Empresas do piloto enviam feedback (nota + texto livre) sobre o app, visível só para o proprietário.
  - **success:** Um feedback enviado aparece para o proprietário com data e nome do workspace de origem.

- **CAP-16 — Vocabulário de serviço genérico e editável por Ramo, + Ramo customizado no cadastro**
  - **intent:** Refrigeração mantém todo o vocabulário atual (rótulo de módulo, categorias de preço, campo de quantidade de splits) sem mudança. Qualquer outro Ramo — Predial ou um Ramo customizado digitado livremente no cadastro — recebe categorias de preço, rótulo de módulo e o dropdown "Tipo de Serviço" da OS genéricos e próprios (nunca cópia do vocabulário de Refrigeração), com indicação de que são editáveis, e o gestor edita cada um em Configurações sem afetar outro workspace.
  - **success:** Um workspace de Ramo não-refrigeração nunca mostra "Instalação Split"/"Sistema Split"/"Quantidade de splits" a menos que o próprio gestor tenha digitado isso; o cadastro aceita um Ramo fora dos 2 pré-definidos e esse workspace nunca herda o vocabulário de Refrigeração.

- **CAP-17 — Registro fotográfico genérico (Antes/Depois) pra Ramos não-refrigeração**
  - **intent:** A etapa "Equipamentos" da execução de OS (marca/modelo + foto de Evaporadora/Condensadora por "Split N") é estrutural e ficou de fora do CAP-16. Refrigeração mantém 100% igual. Qualquer outro Ramo recebe a mesma etapa genericizada — "Item N" no lugar de "Split N", as 2 fotos por item viram "Antes"/"Depois" (texto fixo por ora), campos de marca/modelo somem da UI.
  - **success:** Um workspace não-refrigeração nunca mostra "Split"/"Evaporadora"/"Condensadora"/"marca"/"modelo" na execução de OS; Refrigeração continua idêntica.

## Constraints

- Nenhuma mudança em `firestore.rules`/`firestore.indexes.json` vai a produção sem teste prévio no Firebase Emulator Suite.
- Nenhum backend novo (Cloud Functions, serviço HTTP próprio) — toda autorização vive em regras declarativas do Firestore.
- `index.html` é o app inteiro em arquivo único — toda mudança é cirúrgica; nenhum refactor amplo ou reformatação de arquivo inteiro nesta rodada.
- O motor de merge existente (`SYNC_KEYS`/`ITEM_LISTS`/`LEAF_MAPS`/`APPEND_LISTS`/`MERGE_MAPS`) mantém assinatura e comportamento idênticos — multi-tenant é só um parâmetro de caminho a mais, não um redesenho.
- Migração de dado real (ex.: registros existentes de `mappo_tecnicos` da Elite Ar) exige backup do Firestore e plano de rollback definido antes de executar.
- Nenhum commit direto em `main` sem autorização explícita do proprietário para o commit específico.
- Nenhuma dependência nova sem aprovação — nada além do que já está pinado (Firebase compat SDK 10.12.2, Leaflet 1.9.4, jsPDF 2.5.1).
- Qualidade do Template de Checklist de um Ramo não é sacrificada por velocidade de lançar mais Ramos — um Ramo malfeito prejudica mais a percepção de "feito sob medida" do que ajuda ter mais opções no catálogo.
- CAP-12 muito provavelmente toca `firestore.rules` (hoje só gestor escreve em `members/{uid}`; o convite reverso precisa de um mecanismo novo de autorização) — mesmo gate de sempre: Emulator Suite antes de qualquer publicação, autorização explícita separada para a regra e para o commit.
- CAP-9: valores de OS visíveis por perfil — gestor vê tudo do workspace; prestador vê só o valor das próprias OS, nunca o de outro prestador nem o bloco de notas de adiantamento (dado financeiro sensível, mesmo espírito de `members/{uid}` não ser confiável via campo enviado pelo cliente). Tabela de preço é por Ramo, mesmo padrão do template de checklist (AD-4) — categorias exatas por Ramo, não genéricas pro workspace.
- CAP-12: código de convite é de uso único — 1 convite = 1 prestador, consumido ao vincular.
- CAP-13: WhatsApp do proprietário é `62994299385`, mensagem pré-preenchida "sou gestor, queria utilizar o mappo".
- CAP-14 é o item de maior escopo do pacote — `vrfObra` hoje é objeto único, não lista; virar lista reaproveita o padrão já existente de merge por id (`ITEM_LISTS`, igual `mappo_os`), sem inventar mecanismo novo (AD-5 preservado), mas toda função do VRF que assume "a obra" precisa passar a assumir "a obra selecionada" — superfície grande, atenção extra de desenho na story.
- CAP-16: `PRECO_TEMPLATES.predial` hoje é cópia idêntica de `PRECO_TEMPLATES.refrigeracao` (bug de origem que motivou a capacidade) — corrigir junto. O dropdown "Tipo de Serviço" da criação de OS é lista HTML fixa hoje; vira Ramo-aware, pareado com a mesma lista de categorias da tabela de preço (nunca duas listas que podem divergir). Campo "Quantidade de splits" passa a aparecer só para Refrigeração. Ramo customizado nunca cai no pacote de vocabulário de Refrigeração — sempre no genérico-editável.
- CAP-17: reaproveita a mesma estrutura de dado já existente (array `equipamentos`, campos internos `fotoEvap`/`fotoCond`, mesma função de compressão de foto) — só a exibição muda por Ramo, nomes de campo internos continuam os mesmos, evita migração de dado. Campo "Quantidade de splits" (escondido pra não-refrigeração desde o CAP-16) passa a SEMPRE aparecer, com rótulo "Quantidade de splits" (Refrigeração) ou "Quantidade de itens" (outros Ramos) — revisão consciente do limite que o CAP-16 tinha posto. Badge "❄️ N split(s)" (3 lugares: modal de detalhe, card de OS, cabeçalho de execução) vira texto genérico sem o emoji de neve pra quem não é Refrigeração. Página "Tarefas Adicionais" troca o subtítulo fixo "fora do Split e do VRF" por `moduloSplitAtual().nome` pra quem não é Refrigeração.

## Non-goals

- MAPPO não se torna uma ferramenta de gestão de projeto genérica — pressupõe uma OS executada por um Técnico em campo.
- Monetização, plano pago, ou qualquer fluxo de cobrança.
- Painel administrativo completo multi-empresa — só o suficiente para acompanhamento manual do piloto.
- Onboarding self-service sem intervenção manual.
- Empacotamento além de PWA (TWA/Capacitor, Play Store, app nativo iOS).
- Migração de fotos para Firebase Storage — mantém-se só o aviso tático de limite de 1MB.
- Recuperação de senha self-service, login social.
- Autorização por recurso dentro do mesmo workspace (ex.: Técnico restrito só às próprias OS).
- Ambiente de staging / projeto Firebase separado.
- Pipeline de CI/CD, ambientes separados dev/homolog/prod.
- CAP-9 não é sistema de contabilidade/faturamento completo — sem cálculo de imposto, sem integração com processador de pagamento, só registro manual de valor e status.
- CAP-10 não modela um sistema de "obra"/projeto grande genérico por Ramo — a estrutura de fases fica exclusiva do VRF/Refrigeração; outros Ramos usam Tarefa Adicional (já existente), não um equivalente novo por Ramo.
- CAP-11 não inclui replay de trajeto real no mapa — avatar tem só 2 estados visuais (parado/andando), não segue o caminho percorrido de verdade.
- CAP-14 não inclui orçamento, prazo ou gestão de custo por obra — só o checklist/progresso já existente, agora por obra em vez de único.
- CAP-15 não é um painel de analytics/NPS formal — só captura e lista o feedback bruto pro proprietário ler.
- CAP-16 não inclui sugestão automática/IA de nomenclatura por Ramo — o vocabulário genérico é fixo e o gestor edita manualmente, sem geração assistida.
- CAP-17 não torna "Antes"/"Depois" editável pelo gestor nesta rodada — texto fixo, revisitar conforme feedback do piloto.

## Success signal

Ao menos uma Empresa Contratante do piloto usa o MAPPO na operação diária real — não um teste pontual — e, perguntada diretamente, confirma que pagaria por isso. E, condição não-negociável do mesmo sucesso: nenhum dado de uma empresa jamais aparece para outra, verificado no Emulator Suite antes de qualquer publicação.

## Assumptions

- Uma pessoa (`uid`) pertence a exatamente um workspace — o produto não modela hoje pertencimento a múltiplas empresas simultâneas.
- Nenhuma meta de prazo foi dada para o início do piloto — tratado como "quando o bloqueante de segurança (CAP-1, CAP-2) estiver resolvido".
- Os 2 Ramos com vocabulário próprio hoje: Refrigeração/Climatização (reaproveita o checklist VRF/VRV existente) e Manutenção Predial Geral — os dois implementados e no ar (Story 2). Desde CAP-16, o cadastro aceita qualquer Ramo digitado livremente, que recebe o pacote genérico-editável (nunca o vocabulário de Refrigeração).
- Empresas que exigem app nativo desde o dia 1 (sem aceitar PWA) ficam fora do v1.
- Se uma Empresa Contratante escolher um Ramo sem Template de Checklist pronto ainda (fora dos 2 do MVP), o sistema oferece o Template genérico mais próximo e sinaliza que pode ser ajustado manualmente.

## Open Questions

- Quantas empresas e quais Ramos exatos entram no piloto?
- O projeto Firebase está no plano Spark (gratuito) ou Blaze (pago)?
- Recuperação de senha self-service entra em alguma fase futura, ou fica indefinidamente fora?
- Existe requisito de prazo para retenção/expurgo de dados de GPS e histórico de check-in (LGPD)?
- Os técnicos já consentiram formalmente com o rastreamento de GPS ao vivo hoje, fora do app (termo assinado)?
- Testes unitários das funções de merge (`_mergeItens`, `_mergeLeafs`, etc.) entram nesta rodada, ou ficam para depois?
- CAP-9: categorias exatas de serviço da tabela de preço, dentro de cada Ramo — a decidir na hora de construir a story (estrutura já definida: tabela por Ramo, "Conserto" foi só exemplo).
- CAP-16: quantidade exata de categorias de preço genéricas default e o texto exato do hint "renomeie com sua atividade específica" — a decidir na hora de construir a story, mesmo espírito já usado pro texto do template de checklist.
- CAP-17: rótulo exato da etapa genérica (hoje "Equipamentos") e o texto exato da instrução pro técnico — a decidir na hora de construir a story.
