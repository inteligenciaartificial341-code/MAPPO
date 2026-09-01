# Deferred Work

Itens reais, encontrados durante revisão, que não são problema desta story específica ou exigem decisão maior que um patch. Não modificar entradas existentes; só adicionar.

- source_spec: `_bmad-output/specs/spec-mappo/stories/1-autenticacao-real-isolamento-multi-tenant.md`
  summary: Qualquer usuário autenticado real pode pré-criar `workspaces/{wsId}` (com `criado:true`, sem members) para um slug que não é dele, bloqueando permanentemente o cadastro real daquela empresa — sem recuperação (`update/delete: false`).
  evidence: Confirmado lendo `firestore.rules` — `allow create` em `workspaces/{wsId}` só exige `isRealAuth() && criado==true`, sem checar se o autor tem relação com o nome da empresa. Dado que o piloto é privado (empresas que o Paulo já conhece), vale reconsiderar se signup deveria ter algum gate de convite em vez de ficar aberto.

- source_spec: `_bmad-output/specs/spec-mappo/stories/1-autenticacao-real-isolamento-multi-tenant.md`
  summary: Vínculo de acesso de técnico (copiar/colar UID) não verifica que o UID pertence à pessoa certa — um UID errado ou malicioso concede acesso real a um estranho.
  evidence: Inerente à escolha deliberada de "fluxo mínimo sem UI polida" já registrada no spec. Vale um sanity-check de produto antes de expandir o piloto além de poucas empresas conhecidas.

- source_spec: `_bmad-output/specs/spec-mappo/stories/1-autenticacao-real-isolamento-multi-tenant.md`
  summary: Nenhum listener em tempo real no próprio `members/{uid}` — um técnico removido com aba já aberta continua com acesso de leitura via listeners existentes até recarregar manualmente.
  evidence: `removerTecnico()` deleta `members/{uid}` no servidor mas nada no cliente observa essa remoção para forçar logout. Precisa de uma feature nova (listener de membership própria), não é ajuste pontual.

- source_spec: `_bmad-output/specs/spec-mappo/stories/1-autenticacao-real-isolamento-multi-tenant.md`
  summary: O único/último gestor de um workspace pode se auto-rebaixar para técnico via `update` em `members/{uid}`, deixando o workspace sem ninguém que possa gerenciar a equipe.
  evidence: A regra de `update` só checa `isGestor(wsId)` no momento da escrita, não se é o último. Contar gestores restantes não é trivial em `firestore.rules` sem um campo contador mantido à parte — exige desenho, não é patch.

- source_spec: `_bmad-output/specs/spec-mappo/stories/1-autenticacao-real-isolamento-multi-tenant.md`
  summary: Links públicos já compartilhados pela Elite Ar hoje (formato antigo, sem segmento de workspace) vão quebrar quando esta story for publicada.
  evidence: `_pubRotaToken()` mudou de `#/ac/{token}` para `#/ac/{ws}/{token}` — mudança de rota necessária pro multi-tenant, mas os links já enviados a clientes reais da Elite Ar deixam de funcionar. Precisa de plano de comunicação/migração, é decisão de negócio, não de código.

- source_spec: `_bmad-output/specs/spec-mappo/stories/1-autenticacao-real-isolamento-multi-tenant.md`
  summary: A limpeza de dado local na troca de workspace (`_aplicarSessaoResolvida`, salvaguarda do AD-1) e o fallback de cache offline em `_resolverWorkspace` não têm nenhum teste automatizado — só revisão manual de código.
  evidence: Nenhum framework de teste existe no projeto para exercitar essas funções (`_aplicarSessaoResolvida`, `_resolverWorkspace`, `_cacheWorkspace`). Candidato natural para quando a Open Question 7 do SPEC (testes unitários das funções de merge/sync) for resolvida.

- source_spec: `_bmad-output/specs/spec-mappo/stories/2-onboarding-ramo-template-checklist.md`
  summary: O formulário de criação de OS (`criarOS`, campos "splits"/evaporadora/condensadora) e os toggles de módulo do técnico (❄️ Split / 🌡️ VRF em `openModalTecnico`/`renderEquipeConfig`) continuam fixos no vocabulário de refrigeração para qualquer `ramo` — uma empresa "Manutenção Predial Geral" só teve o checklist personalizado, o resto do domínio de OS continua específico de AC.
  evidence: Fora do escopo desta story por desenho — o Intent congelado só cobre `checklistDoTipo`/template de checklist, não o modelo de dados da OS nem os módulos de técnico. Vale decisão de produto sobre até onde a personalização por Ramo deve ir antes de expandir pra um 3º Ramo.

- source_spec: `_bmad-output/specs/spec-mappo/stories/2-onboarding-ramo-template-checklist.md`
  summary: `firestore.rules` não restringe a escrita de `workspaces/{wsId}/data/mappo_checklist_config` a gestor, ao contrário de `mappo_tecnicos` — qualquer membro autenticado do workspace (inclusive técnico) pode escrever esse doc direto via SDK/console, embora a UI só exponha o editor de checklist a gestores.
  evidence: `firestore.rules` (regra de `workspaces/{wsId}/data/{docId}`) só tem carve-out gestor-only pro `docId=='mappo_tecnicos'`; `mappo_checklist_config` caiu na regra genérica de membro. Esta story não altera `firestore.rules` por desenho ("Ask First: Nenhum"); mudança de regra exige teste no Emulator Suite e autorização explícita do proprietário antes de produção.

- source_spec: `_bmad-output/specs/spec-mappo/stories/2-onboarding-ramo-template-checklist.md`
  summary: O rótulo de item do checklist (`it.label`), digitado livre via `prompt()`/input no novo editor de Configurações, é interpolado sem escape em `innerHTML` — tanto na tela de edição quanto na execução da OS.
  evidence: Risco real (XSS armazenado), mas a espinha de arquitetura (AD-12/FR-15) já reserva a correção pra uma função única de escape compartilhada, aplicada em todos os pontos de `innerHTML` do projeto de uma vez (63 ocorrências mapeadas na auditoria) — story dedicada (5-link-publico-expiracao-revogacao-xss). Corrigir aqui de forma pontual violaria a própria regra do AD-12 ("nunca escape ad-hoc por chamada").

- source_spec: `_bmad-output/specs/spec-mappo/stories/2-onboarding-ramo-template-checklist.md`
  summary: O adendo que substitui "Elite Ar" hardcoded pelo nome real da empresa (`WORKSPACE_NOME`) adicionou mais um ponto de `innerHTML` sem escape na página pública (`renderPublico`, `d.empresa`) — o nome da empresa (texto livre digitado no cadastro) agora chega sem sanitização na tela que qualquer cliente final vê, sem login. Não estava nas 63 ocorrências originais da auditoria (é código novo).
  evidence: Mesma decisão do item acima (AD-12: função única de escape, sem ad-hoc) — mas como é ponto novo, não coberto pela auditoria original, fica registrado aqui explicitamente pra a Story 5 não deixar passar ao varrer os pontos já mapeados.

- source_spec: `_bmad-output/specs/spec-mappo/stories/3-compressao-foto-consistente.md`
  summary: `vrfComprimirImagem` (index.html:3025-3039) não preenche fundo branco antes de exportar pra JPEG — qualquer imagem com canal alfa (PNG com transparência, screenshot) vira preto sólido nas áreas transparentes. Também só limita a largura (`maxW/img.width`); fotos em retrato (o caso comum de foto tirada com celular) não têm a altura limitada, então o "máx. 1024px" não limita de fato a maior dimensão da imagem.
  evidence: Pré-existente na função (já afetava o fluxo VRF antes desta story); esta story só reaproveita a função como está, sem tocar no algoritmo de desenho — "alterar os parâmetros de compressão" está explicitamente fora do escopo desta story (Boundaries do spec). Achado dos 3 revisores independentes (blind-hunter e edge-case-hunter).

- source_spec: `_bmad-output/specs/spec-mappo/stories/3-compressao-foto-consistente.md`
  summary: Nenhum dos 4 pontos que usam `vrfComprimirImagem` (agora incluindo os 2 novos desta story) desabilita o input/botão enquanto a compressão assíncrona roda — selecionar/tirar foto duas vezes rápido antes do primeiro callback resolver pode fazer a seleção mais lenta sobrescrever a mais recente fora de ordem.
  evidence: Característica pré-existente do padrão de callback já usado no fluxo VRF (`vrfSetupCamera`/`setupTarefaCam`), não piorada especificamente por esta story — corrigir exigiria um token de cancelamento por chamada, não é um patch trivial. Achado do blind-hunter e edge-case-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/3-compressao-foto-consistente.md`
  summary: Qualidade fixa (0.6) e largura máxima fixa (1024px) em `vrfComprimirImagem`, aplicadas iguais pra toda foto — inclusive fotos de etiqueta de equipamento (`onEquipFoto`), cujo propósito é manter texto impresso legível. Não há validação registrada de que 0.6/1024px preserva legibilidade de etiqueta.
  evidence: Explicitamente fora do escopo desta story (Boundaries: "Alterar os parâmetros de compressão... fora de escopo") — decisão de produto real pra quando/se for revisitada, não bug de implementação.

- source_spec: `_bmad-output/specs/spec-mappo/stories/3-compressao-foto-consistente.md`
  summary: `saveOS`/`saveExecOS`/`saveTarefas` gravam em `localStorage` sem `try/catch` — em um dispositivo com muitas fotos comprimidas acumuladas, um `QuotaExceededError` do navegador (~5-10MB por origem) não é tratado, vira exceção não capturada.
  evidence: Pré-existente em toda a camada de persistência local (não específico de fotos nem introduzido por esta story) — achado do blind-hunter, real mas amplo demais pra um patch cirúrgico desta story.

- source_spec: `_bmad-output/specs/spec-mappo/stories/3-compressao-foto-consistente.md`
  summary: Nenhuma checagem de tamanho de arquivo antes de `reader.readAsDataURL(file)` em `vrfComprimirImagem` — uma foto grande de celular moderno é lida e decodificada de forma síncrona no canvas, sem indicador de carregamento, risco de travar a thread principal por alguns segundos em aparelhos Android de entrada (o público real dos técnicos de campo).
  evidence: Pré-existente no padrão já usado pelo fluxo VRF; esta story só reaproveita a função como está. Achado do blind-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/3-compressao-foto-consistente.md`
  summary: `vrfComprimirImagem` usa callbacks aninhados (`FileReader.onload` → `Image.onload` → `cb`) em vez de `Promise`/`async-await`, divergindo do padrão que o próprio CLAUDE.md pede pra código novo.
  evidence: Função pré-existente, não criada por esta story; reescrevê-la pra async/await seria refactor fora do escopo cirúrgico ("Alterar os parâmetros de compressão... fora de escopo" cobre a lógica interna da função). Candidato a limpeza futura, não bug funcional hoje.

- source_spec: `_bmad-output/specs/spec-mappo/stories/4-gps-vivo-consentimento-explicito.md`
  summary: CORREÇÃO a uma decisão de desenho registrada no próprio spec da Story 4 — o Design Notes/Ask First dessa story justificou guardar o consentimento só em `localStorage` (não no Firestore) alegando que `firestore.rules` só permite o gestor gravar em `members/{uid}`. Isso é verdade pra `members/{uid}` especificamente, mas incompleto: a regra de `workspaces/{wsId}/data/{docId}` já permite **qualquer membro** (não só gestor) escrever, com a única exceção de `mappo_tecnicos` (`allow write: if isMember(wsId) && isAtivo(wsId) && (docId != 'mappo_tecnicos' || isGestor(wsId))`). Ou seja, dava pra guardar o consentimento como mais uma chave sincronizada (`mappo_gps_consent`, mesmo padrão de `mappo_live`/`mappo_locations`) com registro durável, sincronizado entre aparelhos, e **sem mudar nenhuma regra**.
  evidence: Achado por um revisor independente (blind-hunter) durante o code review da Story 4, verificado por mim contra o texto real de `firestore.rules`. A implementação atual (localStorage por uid) continua funcional e segura — só menos durável do que precisava ser. Não revertida/refeita nesta sessão (mudaria o formato de armazenamento e a lógica de leitura de `_temConsentimentoGPS`/`_gravarConsentimentoGPS`, e introduziria uma nova questão de timing — esperar o sync antes de saber se já consentiu — que merece decisão explícita, não um patch silencioso em modo autônomo). Candidato real pra uma iteração futura da Story 4.

- source_spec: `_bmad-output/specs/spec-mappo/stories/4-gps-vivo-consentimento-explicito.md`
  summary: Incrementar `GPS_CONSENT_VERSAO` (mecanismo pra reabrir o consentimento se o texto mudar) não afeta uma sessão de GPS ao vivo já em andamento — o técnico continua sendo rastreado sob o texto de consentimento antigo até desativar e reativar manualmente.
  evidence: Edge case real mas raro (só importa se o texto mudar com alguém ativamente rastreado no momento) — achado do blind-hunter. Sessões expiram sozinhas em até 10h de qualquer forma.

- source_spec: `_bmad-output/specs/spec-mappo/stories/4-gps-vivo-consentimento-explicito.md`
  summary: O texto do consentimento explica o que é coletado e por quanto tempo (fica ativo), mas não fala de retenção/exclusão — quanto tempo os pontos gravados (`mappo_live`/`mappo_locations`) ficam guardados depois que o rastreamento termina, nem como o técnico pediria exclusão.
  evidence: Acha do blind-hunter; liga diretamente à Open Question 5 do PRD ("Retenção/expurgo de dados de GPS e histórico de check-in — existe requisito de prazo?"), já registrada como pergunta em aberto — não é gap novo desta story, é a mesma pergunta ainda sem resposta.

- source_spec: `_bmad-output/specs/spec-mappo/stories/4-gps-vivo-consentimento-explicito.md`
  summary: Não existe tela/ação no app pra um técnico revogar/resetar o próprio consentimento já dado (só limpando dados do navegador manualmente).
  evidence: Achado do blind-hunter — exigiria uma tela nova de privacidade/configurações, fora do escopo cirúrgico desta story.

- source_spec: `_bmad-output/specs/spec-mappo/stories/5-link-publico-expiracao-revogacao-xss.md`
  summary: `firestore.rules` não valida o tipo/formato de `expiraEm` (ex.: `is number`) — um membro escrevendo um valor não-numérico ou absurdamente grande em `pub_{token}` deixaria a comparação da regra imprevisível ou "des-expiraria" um link de propósito.
  evidence: Mesma categoria de risco já documentada na auditoria original (R08: "Regras do Firestore não validam schema/tamanho/tipo do campo json") — não é gap novo desta story, é o mesmo padrão de confiança já aceito em todo o resto do app (nenhum campo synced tem validação de schema na regra hoje).

- source_spec: `_bmad-output/specs/spec-mappo/stories/5-link-publico-expiracao-revogacao-xss.md`
  summary: Qualquer membro do workspace (não só gestor) pode escrever em `pub_{token}` sem o campo `expiraEm` — como ausência de campo significa "nunca expira", isso pode "des-revogar" um link silenciosamente. Existe também uma janela de corrida real (não só teórica): `republicarAtivos()` roda em QUALQUER cliente (inclusive o do técnico, disparado pelo monitor de sincronização ao editar checklist/execução) e republica usando o `pubExpira` que estiver na cópia local daquele cliente — um dispositivo com uma cópia desatualizada (antes do revoke chegar via sync) pode reescrever o `expiraEm` antigo por cima.
  evidence: Investigado e decidido NÃO restringir a escrita de `pub_*` a gestor (como já é feito com `mappo_tecnicos`) porque o técnico PRECISA escrever em `pub_*` legitimamente — é o mecanismo que leva o progresso do checklist em tempo real pra página pública ("ao vivo" do UJ-3); restringir quebraria essa feature. `mappo_os` (de onde `pubExpira` é lido) já é `IMMEDIATE_KEYS` (sync sem delay), então a janela de corrida na prática é estreita, não persistente — mas existe. Corrigir de verdade exigiria um campo separado gestor-only pra `expiraEm` (fora do `.set()` geral do payload) ou lógica de reconciliação server-side (Cloud Functions, proibido por AD-7) — redesenho, não patch cirúrgico.

- source_spec: `_bmad-output/specs/spec-mappo/stories/5-link-publico-expiracao-revogacao-xss.md`
  summary: Depois de revogar um link, não existe like nenhum jeito de reemitir/reativar um link funcional pro mesmo cliente sem código novo — `pubToken` continua o mesmo e `gerarLinkOS`/`gerarLinkObra` só geram token+prazo novos "na criação" (quando `pubToken` ainda não existe).
  evidence: Gap de produto real (não bug) — FR-14 pediu expiração+revogação, não reemissão; fica registrado como extensão natural pra decidir depois.

- source_spec: `_bmad-output/specs/spec-mappo/stories/5-link-publico-expiracao-revogacao-xss.md`
  summary: O modal "Link de acompanhamento" (`abrirModalLink`) não mostra a validade do link (30 dias) nem indica visualmente se o link já foi revogado — o gestor reabrindo o modal de uma OS já revogada vê a mesma tela de um link saudável.
  evidence: Gap de UX real, não fazia parte dos critérios de aceite desta story (só "revogar invalida imediatamente" e "expirado mostra mensagem clara" no lado do Cliente Final) — acrescentar um indicador de status exige ler o doc `pub_` de volta antes de renderizar o modal, escopo maior que o cirúrgico.

- source_spec: `_bmad-output/specs/spec-mappo/stories/5-link-publico-expiracao-revogacao-xss.md`
  summary: `expiraEm` é calculado no relógio do cliente (`Date.now()` no dispositivo do gestor) mas comparado contra `request.time` (relógio do servidor) na regra — um relógio de cliente muito errado geraria um prazo levemente incorreto (mas a checagem em si, no servidor, continua correta e não é burlável por isso).
  evidence: Limitação inerente a qualquer timestamp calculado no cliente sem Cloud Functions (proibidas por AD-7); baixo risco prático (a maioria dos dispositivos tem relógio correto via NTP), achado do blind-hunter, não corrigido.

- source_spec: `_bmad-output/specs/spec-mappo/stories/7-instalacao-multiplataforma-pwa.md`
  summary: Quando uma nova versão do Service Worker assume o controle (`skipWaiting`/`clients.claim`), uma aba já aberta continua com o JS antigo em memória enquanto suas próximas requisições já são servidas pelo SW novo — sem aviso nem recarregamento automático.
  evidence: Decisão de produto real, não bug: forçar reload automático interromperia um técnico no meio do preenchimento de um checklist (dado já fica em `localStorage`, mas a interrupção em si incomoda). Como a estratégia é network-first pra navegação, a próxima vez que a pessoa recarregar manualmente já pega a versão nova — a única lacuna é não ter um aviso "nova versão disponível". Achado do edge-case-hunter e blind-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/7-instalacao-multiplataforma-pwa.md`
  summary: `ehIcone()` casa o caminho por `endsWith('/icon-192.png')` etc. em vez de comparar o caminho absoluto exato — um recurso futuro que por coincidência termine com o mesmo nome de arquivo seria tratado (e cacheado) como ícone estático.
  evidence: Risco baixo hoje (conjunto de ícones fixo e pequeno); corrigir direito exigiria montar o caminho absoluto a partir do escopo do próprio Service Worker — mais código do que o cirúrgico pedia. Achado do blind-hunter e edge-case-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/7-instalacao-multiplataforma-pwa.md`
  summary: Ícones declaram só `purpose:"any"` — sem variante `maskable`, o Android pode cortar a arte de forma imprevisível ao aplicar a máscara adaptativa do ícone instalado.
  evidence: Exigiria arte nova com margem de segurança pro recorte, não reaproveita o ícone existente como o "Approach" desta story pedia — decisão de design, não bug de código. Achado do blind-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/7-instalacao-multiplataforma-pwa.md`
  summary: `orientation:"portrait"` no manifest (herdado do manifest inline antigo, não é decisão nova desta story) trava a orientação do app instalado — inclusive em tablet/desktop, onde o SO respeita esse campo.
  evidence: Não é regressão desta story (já existia no manifest inline anterior); fica registrado pra confirmar se ainda é a intenção agora que o produto mira em mais dispositivos/Ramos, não só celular de técnico em campo. Achado do blind-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/8-aba-financeira-servico-prestador.md`
  summary: Isolamento de "prestador vê só o valor das próprias OS" é só de UI, não de dado -- `mappo_os`, `mappo_preco_config` e `mappo_financeiro_notas` sincronizam como blob completo pra QUALQUER membro do workspace (gestor ou técnico), mesmo modelo que o resto do app já usa hoje (nenhum campo synced tem filtragem por destinatário). Um técnico abrindo DevTools/IndexedDB vê o valor de todos os colegas, a tabela de preço inteira e as notas de adiantamento.
  evidence: Achado dos 3 revisores independentes. NÃO é regressão introduzida por esta story -- é a mesma característica que já existe pra `osList`/`mappo_tecnicos`/etc., aceita desde a arquitetura original (AD-7: nenhum backend novo; item já registrado na espinha como "Autorização por recurso dentro do mesmo workspace" no Deferred). O que muda é que agora esse canal já-aberto carrega dado financeiro/salarial, mais sensível que o resto. Resolver de verdade exigiria autorização por campo (Cloud Functions/Cloud Run, já mapeado como opção futura na Architecture Spine, reabrindo AD-7 conscientemente) -- fora do que se pode fazer hoje sem essa decisão maior. Vale o proprietário saber que essa exposição existe, mesmo sendo consistente com o resto do app.

- source_spec: `_bmad-output/specs/spec-mappo/stories/8-aba-financeira-servico-prestador.md`
  summary: Não existe edição nem exclusão de uma nota de adiantamento já registrada -- só criação. Um valor/prestador digitado errado fica lá permanentemente (sem correção via UI).
  evidence: Fora do escopo pedido nesta story (Tasks não incluíam editar/apagar nota) -- gap real, mas extensão natural, não bug.

- source_spec: `_bmad-output/specs/spec-mappo/stories/8-aba-financeira-servico-prestador.md`
  summary: Sem filtro de período/data na hierarquia financeira nem nas notas -- ambas mostram o histórico completo desde sempre, sem recorte por mês/intervalo. Fica difícil de usar conforme o volume de OS cresce.
  evidence: Gap real de UX, fora do escopo desta story (AC não pedia filtro). Achado do blind-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/8-aba-financeira-servico-prestador.md`
  summary: A hierarquia financeira agrupa por nome do técnico (string), não por id estável -- se um técnico for renomeado, o histórico dele fica fragmentado entre o nome antigo e o novo, cada um com seu próprio total de pago/a pagar.
  evidence: Mesma limitação já registrada em AD-6 ("duplicidade de nome em mappo_tecnicos... não resolvida por esta espinha") -- não é regressão nova desta story, é o mesmo merge-por-nome de sempre alcançando mais uma tela. Achado do blind-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/8-aba-financeira-servico-prestador.md`
  summary: `_normTipo()` usa um caractere de marca combinante literal (invisível) no regex de remoção de acento, em vez da notação explícita `̀-ͯ`. Funciona hoje, mas é frágil pra qualquer ferramenta que não preserve os bytes Unicode exatos (copiar/colar, lint, patch).
  evidence: Estilo já usado em outros pontos do arquivo (não é invenção nova desta story), funcional e testado (sintaxe válida). Achado do blind-hunter, risco baixo e teórico.

- source_spec: `_bmad-output/specs/spec-mappo/stories/8-aba-financeira-servico-prestador.md`
  summary: Parsing de valor monetário (`parseFloat` com troca de vírgula por ponto) não trata separador de milhar no formato brasileiro (`1.234,56`) corretamente -- o patch desta rodada deixa isso mais seguro (só troca vírgula por ponto quando não há ponto já presente), mas não resolve o caso completo de milhar+decimal juntos.
  evidence: Campos são `type="number"`, que já restringe boa parte do que o navegador aceita digitar/colar -- risco prático baixo, mas real se o navegador permitir colar um valor formatado. Resolver por completo exigiria um parser de moeda dedicado. Achado do blind-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/9-vrf-restrito-ramo-checklist-editavel.md`
  summary: `vrfFasesConfig` sincroniza como objeto único (mais recente vence, sem merge por campo) -- dois gestores editando o checklist VRF em aparelhos diferentes ao mesmo tempo (um removendo etapa da fase 3, outro adicionando na fase 5) fazem uma edição sobrescrever a outra silenciosamente, sem aviso de conflito.
  evidence: Mesmo padrão já aceito em `checklistConfig`/`precoConfig` (Stories 2 e 8) -- não é regressão nova desta story, é a mesma característica de "objeto único, last-write-wins" que todo esse tipo de configuração já tem. Achado do blind-hunter e edge-case-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/9-vrf-restrito-ramo-checklist-editavel.md`
  summary: Fases do VRF (10 fixas, `f1`..`f10`) não podem ser adicionadas, removidas nem reordenadas -- só as etapas dentro de cada uma são editáveis, por desenho desta story (Boundaries: "nunca achatar/reordenar fases").
  evidence: Decisão explícita do spec, não é gap -- registrado aqui só por completude, caso vire pedido real no futuro.

- source_spec: `_bmad-output/specs/spec-mappo/stories/10-mapa-painel-avatar-historico-localizacao.md`
  summary: Qualquer técnico pode escrever no avatar de outro (`mappo_avatares`) ou em `mappo_locations`/`mappo_live` via SDK direto -- `firestore.rules` não restringe a escrita à própria entrada dentro do mapa por-pessoa, só exige ser membro do workspace.
  evidence: Mesmo padrão de confiança que `mappo_locations`/`mappo_live` já têm desde a Story 1 -- não é regressão nova desta story, é a mesma característica de "sem autorização por campo/por-recurso" já registrada como Deferred na Architecture Spine. Achado do blind-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/10-mapa-painel-avatar-historico-localizacao.md`
  summary: Sem validação de schema em `mappo_avatares` (um técnico pode gravar um id de avatar inválido ou payload maior que o esperado) -- só filtrado na exibição (`AVATAR_IDS.includes(...)`), não na escrita.
  evidence: Mesmo padrão de "regras sem validação de schema/tamanho" já registrado na auditoria original (R08) -- não é gap novo desta story. Achado do blind-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/10-mapa-painel-avatar-historico-localizacao.md`
  summary: `mappo_localizacao_historico` cresce indefinidamente num único documento do Firestore (sem paginação/arquivamento) -- em uso prolongado pode se aproximar do limite de 1MB por documento, mesmo risco de estouro já conhecido pra fotos (Story 3/PRD FR-16).
  evidence: Mesma categoria de risco já aceita e registrada (migração completa pra Firebase Storage é PRD §6.2, fora do MVP) -- não resolvido por esta story, mitigar exigiria arquitetura de paginação/rotação, fora do escopo cirúrgico. Achado do blind-hunter.

- source_spec: `_bmad-output/specs/spec-mappo/stories/11-convite-prestador-gerado-gestor.md`
  summary: A regra de `members/{uid}` (ramo de auto-vínculo por convite) confirma workspaceId/usado/revogadoEm do convite citado, mas não trava `request.resource.data.tecnicoId` contra o `tecnicoId` real gravado no próprio convite, nem restringe quais outros campos o cliente pode gravar no novo `members/{uid}` (sem `hasOnly`).
  evidence: Confirmado lendo o novo ramo em `firestore.rules` (match .../members/{uid}, 3º branch do allow create) -- um cliente malicioso que monte a chamada Firestore à mão (fora da UI) poderia citar um convite válido só seu, mas gravar um `tecnicoId` de OUTRA vaga vazia no mesmo workspace. Não é escalonamento de privilégio (role continua fixo em 'tecnico' pela própria condição da regra) -- na pior hipótese, a reconciliação (`_reconciliarEquipe`) vincularia o prestador errado à vaga errada. Endurecer exige outro ciclo de Emulator Suite; fora do escopo cirúrgico desta story.

- source_spec: `_bmad-output/specs/spec-mappo/stories/11-convite-prestador-gerado-gestor.md`
  summary: Não existe uma tela/lista agregada pro gestor ver todos os convites pendentes do workspace de uma vez -- só o botão "Ver convite" por vaga individual em `tecnicos[]`.
  evidence: `firestore.rules` bloqueia `allow list` em `convites/{codigo}` de propósito (evita enumeração) -- uma visão agregada exigiria o gestor já saber os códigos (via `tecnicos[].conviteCodigo`, que é exatamente o que a UI atual expõe). Fora dos Acceptance Criteria da story; possível melhoria de UX futura, não um bug.

- source_spec: `_bmad-output/specs/spec-mappo/stories/11-convite-prestador-gerado-gestor.md`
  summary: Um técnico removido de um workspace e reconvidado depois (novo convite, mesmo uid) nunca consegue consumir o novo código -- `userWorkspaces/{uid}` já existe apontando pro workspace antigo, e a regra bloqueia update nesse documento (`allow update, delete: if false`), então a transação inteira falha com permission-denied.
  evidence: Mesma limitação já existe no fluxo manual antigo (`_vincularAcessoTecnico` faz o mesmo `set()` sem merge) -- não é regressão desta story, é a mesma assunção documentada em AD-11/comentário da própria regra ("uma pessoa pertence a 1 workspace", sem reatribuição modelada). Falha de forma segura (permission-denied, nenhum dado corrompido), só a mensagem de erro genérica não explica a causa real pro usuário.

- source_spec: `_bmad-output/specs/spec-mappo/stories/15-vocabulario-servico-generico-ramo-customizado.md`
  summary: Ícone do módulo (`svgIco('splits')`, um aparelho de ar-condicionado) e o emoji ❄️ no checkbox do técnico continuam fixos mesmo depois do gestor renomear o módulo -- uma empresa "Manutenção Elétrica" ainda vê ícone de ar-condicionado em todo lugar.
  evidence: Achado do blind-hunter -- genericizar o rótulo de texto foi feito, mas o ícone é um SVG fixo (`ICONS.splits`), não um parâmetro do `moduloConfig`. Corrigir direito exige desenhar/escolher um ícone genérico, decisão de design fora do escopo cirúrgico desta story.

- source_spec: `_bmad-output/specs/spec-mappo/stories/15-vocabulario-servico-generico-ramo-customizado.md`
  summary: O texto do Ramo customizado digitado no cadastro (ex.: "Elétrica Predial") não é reaproveitado como sugestão de nome do módulo -- o gestor digita a mesma informação de novo em Configurações logo depois de cadastrar.
  evidence: Achado do blind-hunter -- `_moduloDefaultParaRamo` só decide refrigeração-vs-não, não lê o texto do Ramo customizado. Melhoria de UX real, não um bug; baixo custo de implementar depois se o proprietário quiser.

- source_spec: `_bmad-output/specs/spec-mappo/stories/15-vocabulario-servico-generico-ramo-customizado.md`
  summary: Nome de Ramo customizado sem normalização (maiúsculas/acentos) nem limite de tamanho -- "Elétrica"/"eletrica"/"ELÉTRICA" viram Ramos diferentes pro app, e o campo aceita texto de qualquer tamanho.
  evidence: Achado do blind-hunter -- mesmo risco que qualquer campo de texto livre já aceito no app hoje (ex.: nome da empresa também não é normalizado). Baixa severidade -- afeta só o próprio workspace de quem digitou, não vaza pra outra empresa.

- source_spec: `_bmad-output/specs/spec-mappo/stories/17-minitutorial-guiado-coach-marks-spotlight.md`
  summary: Reabrir o tour do prestador via botão "?" enquanto ele está dentro do sub-contexto VRF (`navbarContexto==='vrf'`) mostra quase nenhum passo -- `getNavItems()` troca os itens da navbar pra `vrf`/`vrf-mapa`/`vrf-fotos`/`home` nesse contexto, então os seletores `data-nav="ordens"/"tarefas"/"manutencoes"` de `TOUR_TECNICO` não existem no DOM e são pulados (comportamento tecnicamente correto pela regra de "pular passo sem alvo", mas o resultado prático é um tour quase vazio).
  evidence: `getNavItems()` (index.html ~2797-2805) confirma a troca de itens nesse contexto; `TOUR_TECNICO` não tem variante ciente de `navbarContexto`. Resolver exigiria um terceiro roteiro de tour (ou lógica de contexto), fora do escopo desta story.

- source_spec: `_bmad-output/specs/spec-mappo/stories/17-minitutorial-guiado-coach-marks-spotlight.md`
  summary: O tour não tem suporte a teclado (Esc/Enter/setas) nem semântica ARIA (`role="dialog"`, `aria-live` nos passos, rótulo acessível nos dots de progresso) -- usuário de leitor de tela ou navegação só por teclado não consegue operar o tour.
  evidence: Revisão confirmou ausência total de handlers de teclado e atributos ARIA no `.tour-card`/`.tour-dots`. Consistente com o padrão de acessibilidade já baixo do resto do app (nenhum outro modal/overlay existente tem ARIA), então não é regressão introduzida por esta story especificamente, mas é uma lacuna real que vale endereçar numa passada de acessibilidade dedicada.

- source_spec: `_bmad-output/specs/spec-mappo/stories/17-minitutorial-guiado-coach-marks-spotlight.md`
  summary: Nenhuma telemetria registra se o usuário concluiu, pulou, ou abandonou o tour num passo específico -- não há como saber se o minitutorial está ajudando ou onde as pessoas desistem.
  evidence: Ideia de produto legítima (mesmo espírito do CAP-15/feedback), mas explicitamente fora do escopo desta story -- exigiria uma nova coleção-raiz write-only (padrão AD-13) e decisão de design própria.

- source_spec: `_bmad-output/specs/spec-mappo/stories/17-minitutorial-guiado-coach-marks-spotlight.md`
  summary: Os listeners de `resize`/`scroll` do tour (`_tourReposicionar`) não usam debounce/`requestAnimationFrame`, e o de `scroll` usa `capture:true` (dispara em qualquer scroll de container interno da página) -- cada disparo faz `querySelector`+`getBoundingClientRect`+escritas de estilo sem lote.
  evidence: Baixo risco prático dado o volume de eventos esperado (tour ativo só por segundos, poucos elementos na tela), mas é o padrão correto a seguir se o mecanismo for reaproveitado em algo com mais reposicionamentos por segundo no futuro.

## Auditoria completa 2026-09-01 (firestore.rules + index.html)

Rodada de auditoria dedicada, fora do fluxo de story: `firebase-security-rules-auditor` em `firestore.rules` + `bmad-review` (lentes adversarial/edge-case-hunter/verification-gap) no `index.html` inteiro. Nenhum item abaixo foi corrigido ainda -- aguardando priorização do proprietário.

- source_spec: none
  summary: "[CRÍTICO] firestore.rules:130 só trava escrita a gestor pra mappo_tecnicos -- qualquer técnico pode escrever em praticamente todo outro dado do workspace (financeiro, preço, VRF obras/atribuição, checklist, OS) via SDK direto, mesmo com a UI restringindo a tela a gestor. Inclui poder se auto-conceder acesso a obras VRF não atribuídas (AD-14) e alterar o próprio status de pagamento numa OS."
  evidence: "Leitura direta de firestore.rules:130 -- allow write: if isMember(wsId) && isAtivo(wsId) && (docId != 'mappo_tecnicos' || isGestor(wsId)); -- confirmado que isso é bem mais amplo que o achado antigo (só mappo_checklist_config), que já estava registrado aqui."

- source_spec: none
  summary: "[GRAVE] wsId é slug determinístico do nome da empresa (_slugify(empresa), index.html:1387-1390, sem UID/aleatoriedade), e workspaces/{wsId} create (firestore.rules:51-52) não tem dono nem checa duplicidade. Qualquer conta real pode sequestrar o slug de uma empresa-alvo digitando o mesmo nome no cadastro público, antes dela se cadastrar (workspace fica travado em update:false, sem recuperação)."
  evidence: "Confirmado lendo _slugify() e o fluxo de cadastrarEmpresa() (index.html:1446,1463) contra firestore.rules:47-53. Estende um achado já registrado aqui (Story 1) confirmando o mecanismo exato -- é 1:1 com o nome digitado, sem ofuscação nenhuma."

- source_spec: none
  summary: "[MODERADO] userWorkspaces/{uid} permite um gestor criar o ponteiro de qualquer outro uid apontando pro próprio workspace, sem checar se aquele uid já pertence a outra empresa -- combinado com update:false, permite sequestrar permanentemente o ponteiro de alguém (exige saber o uid da vítima)."
  evidence: "firestore.rules:37-41 -- branch isGestor(request.resource.data.workspaceId) sem checagem de posse prévia do uid alvo."

- source_spec: none
  summary: "[MODERADO] Convite de prestador (convites/{codigo}) é um credencial portador puro -- quem tiver o código consome como se fosse a pessoa certa, sem vínculo de identidade (nome não é validado contra o tecnicoId da vaga na regra). A entropia do código em si está ótima (8 chars de 32 símbolos via crypto.getRandomValues, ~2^40 combinações -- NÃO é bruteforçável, verificado e descartado como risco)."
  evidence: "firestore.rules:94-107 (branch de consumo) só checa usado==false e revogadoEm==null, nunca o nome. index.html:5188-5194 confirma a entropia real do código."

- source_spec: none
  summary: "[XSS confirmado, 6 pontos] renderClientes() (index.html:3454) e verTarefaDetalhe() (index.html:6605) interpolam nome de cliente/técnico em onclick=\"fn('...')\" escapando só aspas simples, não aspas duplas -- quebra o atributo HTML. Funções de render de etapa VRF (index.html ~3742,3803,4386,4427) renderizam texto sem escapeHtml, inconsistente com o campo nota vizinho que É escapado. openModalOS() (index.html:5710) lista técnicos no select sem escapar (inconsistente com os mesmos dados escapados em index.html:4982,5861). vrfNotaTxt (index.html:3899) prefila textarea sem escapar. Config de e-mail/telefone do gestor (index.html:4621-4622) sem escapar."
  evidence: "Confirmado por 3 revisores independentes (adversarial, edge-case-hunter, verification-gap) do bmad-review, convergência em 3 dos 6 pontos. Todos os campos envolvidos são texto livre editável."

- source_spec: none
  summary: "[BUG real] _aplicarSessaoResolvida() grava localStorage.setItem('mappo_last_ws',...) sem try/catch logo antes de location.reload() (fix do vazamento cross-tenant desta sessão) -- se o setItem falhar silenciosamente (quota/private browsing), o reload detecta o mesmo mismatch de novo, entrando num loop de reload+wipe de SYNC_KEYS a cada tentativa."
  evidence: "index.html ~1329, achado pela lente edge-case-hunter. Risco concentrado no exato trecho que a correção do vazamento cross-tenant desta mesma sessão introduziu."

- source_spec: none
  summary: "[BUG real] ehManutencao() (função canônica pra detectar OS de manutenção) não é usada em openDetalhe() (index.html:5827) -- o botão Agendar retorno usa um teste ad-hoc (os.tipo.includes('Manutenção')) que quebra silenciosamente se o gestor renomear a categoria (editável desde a Story 15) pra qualquer texto sem a palavra exata Manutenção."
  evidence: "ehManutencao definida em index.html:2477 como /manuten/i.test(tipo||''), não reusada em openDetalhe. Achado pela lente adversarial."

- source_spec: none
  summary: "[BUG real] Duas entradas de tecnicos[] podem compartilhar o mesmo Firebase uid via o fallback de colar UID manualmente (salvarTecnico(), sem checagem de duplicidade) -- o segundo salvamento sobrescreve members/{uid}.nome silenciosamente, órfã o primeiro técnico do próprio histórico/acesso de módulo."
  evidence: "index.html ~5356-5380, achado pela lente edge-case-hunter -- gap novo, distinto do risco já conhecido de UID errado/malicioso."

- source_spec: none
  summary: "[BUG real] criarOS() permite criar OS sem nenhum técnico cadastrado (#oTecnico sem opções) -- OS nasce com tecnico:'', nunca aparece na fila de nenhum técnico, órfã silenciosamente (ao contrário do #oTipo vazio, que já é bloqueado explicitamente)."
  evidence: "index.html ~5725-5754, achado pela lente edge-case-hunter."

- source_spec: none
  summary: "[Gap de UX] copiarLinkPub() (index.html:7299-7305) não tem o mesmo try/catch que _copiarConviteCodigo() e compartilharApp() já aprenderam (comentários no próprio código documentam a falha) -- toast Link copiado aparece mesmo quando execCommand('copy') falha sem lançar, e o gestor compartilha um link que nunca foi de fato copiado."
  evidence: "Padrão já corrigido em 2 lugares irmãos (index.html:5296-5304, index.html:2951-2962), terceiro local nunca foi atualizado. Achado pela lente verification-gap."

- source_spec: none
  summary: "[Código morto] ico() (index.html:2175, alias de svgIco) e fmtDateShort() (index.html:3102) não têm nenhuma chamada no arquivo inteiro."
  evidence: "Confirmado por contagem de frequência de identificador no arquivo inteiro, achado independentemente por 2 revisores (adversarial + verification-gap) pro fmtDateShort."

- source_spec: none
  summary: "[Duplicação] Mapeamento de mensagem de erro de GPS existe como função compartilhada (msgErroGPS, reusada em tarefaCheckin()) mas é reimplementado inline com texto ligeiramente diferente em vrfFazerCheckin() e execCheckin() -- 3 cópias já divergentes da mesma mensagem."
  evidence: "index.html:6474-6481 vs ~3620-3622 vs ~6955. Achado pela lente adversarial."

- source_spec: none
  summary: "[Segurança-adjacente, baixa prioridade] Nenhum script/CSS de CDN (firebase-*-compat.js, Leaflet, jsPDF) usa Subresource Integrity (integrity/crossorigin) -- comprometimento de qualquer um dos 3 CDNs rodaria script arbitrário na sessão autenticada do app, sem mitigação nenhuma."
  evidence: "index.html:798-800 + carregamento dinâmico do Leaflet/jsPDF. Achado pela lente adversarial -- tail risk, mas fix é barato (hashes SRI são públicos/estáveis por versão pinada)."

- source_spec: none
  summary: "[Hygiene, baixa prioridade] _ramoCustomInvalido() (a única defesa contra ramo colidir com chave reservada/perigosa) só roda client-side em cadastrarEmpresa() -- firestore.rules não valida o campo ramo de jeito nenhum, então uma escrita direta via SDK (fora da UI) pode reintroduzir o bug que essa função foi criada pra fechar."
  evidence: "index.html:1391-1413 sem equivalente em firestore.rules (workspaces/{wsId} create não valida tipo/conteúdo de ramo). Achado pela lente adversarial."

## Atualização 2026-09-01 -- achado crítico corrigido

- source_spec: none
  summary: "[RESOLVIDO, parcial] O achado CRÍTICO acima (firestore.rules:130 só travava mappo_tecnicos) foi corrigido -- firestore.rules ganhou isGestorOnlyDoc(), agora trava escrita a gestor pra 10 docIds (mappo_tecnicos, mappo_clientes, mappo_manut, mappo_settings, mappo_checklist_config, mappo_preco_config, mappo_financeiro_notas, mappo_vrf_fases_config, mappo_modulo_config, mappo_vrf_obras). Isso fecha o auto-acesso a obras VRF (AD-14) e a adulteração de checklist/preço/vocabulário/clientes/manutenções. mappo_os fica de fora DE PROPÓSITO -- técnico precisa escrevê-la pra check-in/checklist/foto, e o blob JSON único (AD-8) não permite validação campo a campo na regra. Um técnico ainda pode, via SDK direto, alterar valor/valorStatus/tecnico de QUALQUER OS do workspace (não só a própria) -- esse resíduo é estrutural, exige separar o dado financeiro da OS numa coleção própria ou migrar mappo_os pra documentos individuais, não é mais um patch de regra."
  evidence: "50/50 testes no Firebase Emulator Suite (gestor mantém acesso total; técnico negado nos 10 docIds; técnico mantém acesso às coleções que precisa -- mappo_os e as 11 outras da execução; não-membro segue negado em tudo). Testado e descartado, script efêmero fora do repo, mesmo padrão das Stories 1/5/11/14."

- source_spec: none
  summary: "[RESOLVIDO] Os 6 pontos de XSS confirmados na auditoria (achado acima) foram corrigidos -- 14 locais reais no total (a auditoria original agrupou visualmente em 6 pontos, mas o mesmo padrão de fase/etapa VRF sem escapeHtml se repetia em 9 sites diferentes, não só 4). Todos agora passam por escapeHtml() antes de entrar em innerHTML/atributo: nome de cliente (renderClientes), nome de técnico (verTarefaDetalhe), select de técnico (openModalOS), nota VRF prefilled (vrfNotaTxt), e-mail/telefone do gestor (Configurações), e toda fase.nome/etapa de VRF em vrfRenderMissaoPainel/vrfRenderAndarPainel/vrfRenderMissaoSteps/vrfAbrirAndar/vrfVerFotoDetalhe/vrfMissaoResumo/render de Fotos da Obra."
  evidence: "Verificado com checagem determinística de escapeHtml (payload de aspas duplas e de tag <img onerror> ambos neutralizados, nome normal com/sem acento inalterado) + execução real via Playwright de renderClientes() e vrfRenderAndarPainel() com payload malicioso, confirmando zero execução de script injetado no DOM real e HTML de saída sem a string bruta do payload. Sintaxe de todos os blocos <script> verificada (node -e com new Function)."

- source_spec: none
  summary: "[RESOLVIDO] O achado GRAVE de wsId=slug determinístico do nome da empresa (sequestro de slug) foi corrigido -- cadastrarEmpresa() agora compõe wsId como slug+sufixo aleatório de 5 caracteres (_gerarSufixoWs, crypto.getRandomValues, mesmo padrão de _gerarCodigoConvite, ~33,5 milhões de combinações por slug), tornando o wsId real não-adivinhável a partir só do nome público da empresa. wsId nunca é exibido em nenhuma tela (confirmado via grep), então o sufixo não tem custo de UX. workspaces/{wsId} também ganhou o campo criadoPor:uid (rastreabilidade extra pro dono do projeto, não checado em regra hoje -- não precisou de mudança em firestore.rules, já que o create não tem hasOnly)."
  evidence: "Checagem determinística confirmando slug/sufixo/espaço de combinações + git diff --stat de firestore.rules vazio (fix inteiro em index.html) + sintaxe de todos os blocos <script> verificada."

- source_spec: none
  summary: "[CORRIGIDO -- achado mais sério do que o listado] O item moderado \"UID duplicado entre técnicos\" foi investigado a fundo: o cenário original (sobrescrita silenciosa) já não acontecia na prática, porque userWorkspaces/{uid} já era update:false e o batch falha inteiro se qualquer parte falhar. Mas a investigação achou um bug real e mais sério: removerTecnico() nunca apagava userWorkspaces/{uid} ao remover alguém -- o ponteiro antigo ficava travado pra sempre (update:false), então um técnico removido NUNCA MAIS conseguia ser convidado de novo, em NENHUMA empresa (não só na que o removeu). firestore.rules ganhou allow delete em userWorkspaces/{uid}, restrito ao gestor do workspace que o ponteiro aponta agora; removerTecnico() passou a apagar o ponteiro junto com members/{uid}."
  evidence: "9/9 testes no Firebase Emulator Suite: gestor de outro workspace negado, não-membro negado, gestor dono do ponteiro consegue apagar, técnico consegue ser re-vinculado a outro workspace depois de removido (o bug real, confirmado corrigido), create/read/update não regrediram."

- source_spec: none
  summary: "[RESOLVIDO] Lote de 6 achados menores/moderados da auditoria de 2026-09-01, todos só em index.html (sem tocar firestore.rules): (1) loop de reload+wipe -- _aplicarSessaoResolvida() ganhou trava de no máximo 1 tentativa de reload por aba (sessionStorage), evitando loop infinito se o localStorage.setItem falhar; (2) ehManutencao() agora reusada em openDetalhe() no lugar do teste ad-hoc que quebrava com categoria renomeada; (3) criarOS() bloqueia criação de OS sem nenhum técnico cadastrado, mesmo padrão do bloqueio já existente pro #oTipo vazio; (4) copiarLinkPub() ganhou o mesmo try/catch de _copiarConviteCodigo/compartilharApp; (5) código morto removido (ico(), alias nunca chamado; fmtDateShort(), nunca chamada); (6) as 2 cópias divergentes da mensagem de erro de GPS (vrfFazerCheckin, execCheckin) agora chamam msgErroGPS() em vez de reimplementar o texto."
  evidence: "Sintaxe de todos os blocos <script> verificada (node -e com new Function); grep confirmando zero chamada remanescente a ico()/fmtDateShort(); git diff --stat de firestore.rules vazio."

- source_spec: none
  summary: "[RESOLVIDO] SRI (Subresource Integrity) adicionado aos 6 recursos de CDN pinados por versão (firebase-app/auth/firestore-compat 10.12.2, Leaflet 1.9.4 JS+CSS, jsPDF 2.5.1) -- comprometimento de qualquer um dos 3 CDNs (gstatic/unpkg/cdnjs) não roda mais script arbitrário na sessão autenticada sem que o navegador barre o carregamento."
  evidence: "Hash sha384 calculado direto contra o conteúdo real servido pela versão pinada (curl+openssl); CORS (Access-Control-Allow-Origin:*) confirmado nos 3 CDNs antes de aplicar crossorigin; verificado com Playwright real contra o app rodando local -- Firebase SDK, Leaflet (via loadLeaflet()) e jsPDF (via carregarJsPDF()) carregam normalmente, zero erro de integrity/CORS."

- source_spec: none
  summary: "[RESOLVIDO] firestore.rules ganhou ramoValido() -- espelha a parte de SEGURANÇA de _ramoCustomInvalido() (índice.html): nega workspaces/{wsId} create se ramo for uma das 8 chaves herdadas de Object.prototype (case-insensitive), não for string, ou passar de 60 caracteres. Não replica a checagem de nome reservado (refrigeracao/predial/outro colidir) -- isso é regra de produto, não abre brecha de segurança."
  evidence: "19/19 testes no Firebase Emulator Suite: valores legítimos (refrigeracao, predial, customizado com acento/hífen) aceitos; as 8 chaves perigosas negadas em 3 variações de case cada; ramo vazio/ausente/não-string/61+ chars negados; exatamente 60 chars aceito; regra antiga (status!=pendente) não regrediu."

- source_spec: none
  summary: "[RESOLVIDO, fora da auditoria original] SEO básico adicionado -- meta description, Open Graph, Twitter Card, canonical, meta robots, robots.txt e sitemap.xml, nada disso existia antes (só tags de PWA). Resolve o app não aparecer nem quando alguém busca o nome exato -- não é ranqueamento competitivo (exigiria domínio próprio/conteúdo público/backlinks, fora de escopo, o app fica atrás de login por natureza)."
  evidence: "Confirmado que o site já está publicado e no ar (https://inteligenciaartificial341-code.github.io/MAPPO/, HTTP 200) -- o problema era ausência total de sinal de SEO, não falta de publicação. Submissão ao Google Search Console fica pendente (exige conta/verificação do proprietário, fora do alcance de uma alteração de código)."

- source_spec: none
  summary: "[SEM CORREÇÃO BARATA -- aceito] 2 achados moderados da auditoria de 2026-09-01 não têm correção de baixo risco disponível hoje, mesma limitação estrutural do achado do mappo_os: (1) gestor pode criar userWorkspaces/{uid} de qualquer uid, sem verificar se aquele uid já é um técnico legítimo do próprio workspace -- checar isso exigiria a regra ler dentro do blob JSON de mappo_tecnicos, que o Firestore não consegue parsear; (2) convite de prestador é credencial portador por desenho (nome+código, sem o gestor colar UID) -- quem tiver o código consome como se fosse a pessoa certa. A entropia do código (2^40 combinações) já foi verificada e não é bruteforçável -- o resíduo é só a ausência de vínculo de identidade, uma escolha consciente de UX que só muda se o desenho do convite mudar."
  evidence: "Investigação confirmou que não há forma de expressar a checagem necessária em firestore.rules sem reestruturar mappo_tecnicos pra documentos individuais (mesma conclusão do achado crítico já corrigido). Ambos ficam documentados como risco residual aceito, não bug pendente."
