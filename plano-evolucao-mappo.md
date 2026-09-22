====================================================================
MAPPO — PLANO DE EVOLUÇÃO DO PRODUTO
Documento para análise técnica do desenvolvedor
Data: setembro/2026
====================================================================

OBJETIVO DO DOCUMENTO
--------------------------------------------------------------------
Este arquivo lista melhorias que levariam o MAPPO ao nível das
maiores plataformas mundiais de field service (ServiceTitan,
FieldEdge, Jobber, Housecall Pro e Workiz). Cada item mostra:

  - O QUE É a melhoria
  - ONDE ENTRA no app atual (referência às seções já existentes)
  - O QUE JÁ TEM de base (o que pode ser reaproveitado)
  - COMO IMPLEMENTAR (lógica, regras, campos, fluxos)
  - O QUE ACRESCENTA (valor para o usuário final)
  - ESFORÇO ESTIMADO (Baixo / Médio / Alto)
  - PRIORIDADE (1 = primeira fase, 2 = segunda, 3 = terceira)

As melhorias estão agrupadas por FASE de implementação.


====================================================================
FASE 1 — "FECHAR O CICLO DO CLIENTE"
====================================================================
Estas 4 melhorias aproveitam ao máximo o que já existe no MAPPO e
entregam o maior valor com o menor esforço. Devem ser atacadas
primeiro.


--------------------------------------------------------------------
1.1 RASTREAMENTO AO VIVO DO TÉCNICO NO LINK DO CLIENTE
--------------------------------------------------------------------

ORIGEM: Housecall Pro (experiência "Uber" pro cliente final)

O QUE É:
Hoje o GPS ao vivo (seção 5.3) só é visível para o GESTOR. O cliente
que recebe o link de acompanhamento (seção 4.9) não vê o técnico se
aproximando. Esta melhoria cruza as duas coisas: o cliente, no link
público, passa a ver o técnico chegando em tempo real.

ONDE ENTRA:
- Seção 4.9 (Link de acompanhamento pro cliente) — tela do cliente
- Seção 5.3 (GPS ao vivo do técnico) — fonte dos dados

O QUE JÁ TEM (base para reaproveitar):
- O link público da OS já existe e atualiza em tempo real
- O GPS ao vivo do técnico já envia posição em tempo real pro gestor
- O avatar do técnico já existe (seção 5.5)
- O check-in já registra horário e localização (seção 5.2)

COMO IMPLEMENTAR:
a) Na tela do link público (4.9), adicionar um mapa com o ícone do
   técnico (usar o avatar da seção 5.5) quando:
   - O técnico estiver com GPS ao vivo ativo (5.3)
   - A OS estiver em status "Em andamento"
b) Mostrar também:
   - Nome do técnico
   - "Status: a caminho" / "Status: no local"
   - ETA estimado (calcular distância entre posição atual do técnico
     e endereço da OS via Google Maps Distance Matrix API)
c) O mapa só aparece quando o técnico ligou o GPS ao vivo. Se não
   ligou, mostrar apenas status textual.
d) Não precisa de login do cliente — já é link público.
e) Respeitar a expiração de 30 dias do link (já existe).

O QUE ACRESCENTA:
- Experiência "Uber" que aumenta muito a confiança do cliente final
- Reduz chamados de "o técnico já chegou?"
- Diferencial visual forte contra concorrentes

ESFORÇO: BAIXO (as duas fontes de dados já existem; é só cruzá-las)
PRIORIDADE: 1


--------------------------------------------------------------------
1.2 NOTIFICAÇÕES AUTOMÁTICAS POR ETAPA (WhatsApp / SMS / E-mail)
--------------------------------------------------------------------

ORIGEM: Housecall Pro

O QUE É:
Disparar automaticamente uma notificação pro cliente em cada etapa
do serviço: "técnico a caminho", "check-in feito", "serviço
concluído". Hoje a tela 4.11 já tem as opções de e-mail e SMS
criadas, mas não enviam nada. Falta ligar o motor.

ONDE ENTRA:
- Seção 4.11 (Configurações — Notificações) — já tem a tela
- Seção 5.2 (Check-in e conclusão da OS) — gatilhos
- Seção 4.9 (Link do cliente) — canal de entrega

O QUE JÁ TEM:
- A tela de configuração já existe (4.11)
- Os gatilhos de evento já existem (check-in, conclusão)
- O link público já existe (4.9) — pode ser incluído na mensagem

COMO IMPLEMENTAR:
a) Integrar um serviço de envio:
   - WhatsApp: Twilio, Z-API, Evolution API ou similar
   - SMS: Twilio, Zenvia, ou gateway nacional (TotalVoice)
   - E-mail: SendGrid, Mailgun, Resend
b) Criar uma tabela "config_notificacoes" com:
   - empresa_id
   - tipo (whatsapp / sms / email)
   - ativo (boolean)
   - credenciais (API key criptografada)
   - template de mensagem (editável)
c) Gatilhos automáticos (disparar sem intervenção do gestor):
   - "Técnico a caminho" → quando OS muda pra "Em andamento"
   - "Check-in realizado" → no momento do check-in (5.2)
   - "Serviço concluído" → ao concluir a OS (5.2)
   - "OS devolvida para revisão" → ao devolver (4.2)
d) Cada mensagem deve conter o link público (4.9) para o cliente
   acompanhar.
e) Templates editáveis pelo gestor (ex.: "Olá {cliente}, o técnico
   {tecnico} está a caminho. Acompanhe: {link}").
f) Respeitar horário comercial (não disparar entre 22h e 7h).

O QUE ACRESCENTA:
- Cliente se sente informado sem o gestor precisar mandar mensagem
- Reduz drasticamente chamados de "e o técnico?"
- Profissionaliza a comunicação da empresa

ESFORÇO: MÉDIO (integração com API externa + templates)
PRIORIDADE: 1


--------------------------------------------------------------------
1.3 ORÇAMENTO → APROVAÇÃO ELETRÔNICA → VIRA OS
--------------------------------------------------------------------

ORIGEM: Jobber

O QUE É:
Hoje o MAPPO vai direto da criação da OS para execução. Falta uma
etapa intermediária: gerar um ORÇAMENTO, enviar pro cliente aprovar
com 1 clique, e só então a OS nascer. Isso é essencial quando há
prestadores terceirizados (o dono aprova antes de autorizar) e em
serviços com valor variável.

ONDE ENTRA:
- Nova entidade "Orçamento" (antes da OS)
- Seção 4.2 (Ordens de Serviço) — fluxo de criação
- Seção 4.9 (Link do cliente) — tela de aprovação

O QUE JÁ TEM:
- Tabela de preços padrão (4.10) — pode pré-preencher o orçamento
- Link público do cliente (4.9) — pode ser reutilizado
- Assinatura digital do técnico (5.4) — padrão para reutilizar

COMO IMPLEMENTAR:
a) Criar nova entidade "orcamento" com:
   - id, empresa_id, cliente_id
   - descricao, itens_servico (com valores)
   - valor_total
   - status: rascunho | enviado | aprovado | recusado | expirado
   - tecnico_sugerido (opcional)
   - data_validade (padrão 7 dias)
   - token_unico (para link público)
   - observacoes, fotos_anexas
b) Fluxo:
   1. Gestor cria orçamento (tela nova ou dentro de 4.2)
   2. Clica em "Enviar ao cliente" → gera link público
   3. Cliente abre o link, vê o orçamento, clica "Aprovar" ou
      "Recusar"
   4. Se aprovado → o sistema gera automaticamente a OS
      (pré-preenchida com os dados do orçamento)
   5. Se recusado → orçamento fica com status "recusado" e o
      gestor é notificado
c) Na tela de aprovação do cliente, mostrar:
   - Descrição do serviço
   - Valor
   - Validade
   - Botões grandes: "Aprovar" / "Recusar"
   - (Opcional fase 2): campo para assinatura digital do cliente
d) Expiração automática após data_validade.
e) Histórico de orçamentos por cliente (aproveitar seção 4.3).

O QUE ACRESCENTA:
- Profissionaliza o processo comercial
- Elimina "vácuo" entre orçamento e execução
- Fundamental para prestadores terceirizados (autorização clara)
- Reduz retrabalho de OS criada sem autorização

ESFORÇO: MÉDIO (nova entidade + novo fluxo + link público)
PRIORIDADE: 1


--------------------------------------------------------------------
1.4 GESTÃO DE ATIVOS / EQUIPAMENTOS POR CLIENTE
--------------------------------------------------------------------

ORIGEM: FieldEdge

O QUE É:
Hoje o histórico é por CLIENTE (seção 4.3). Na refrigeração, o que
importa é o EQUIPAMENTO: cada split, cada condensadora, cada câmara
fria tem sua própria vida útil, peças trocadas, garantias. Esta
melhoria cria um cadastro de "ativos" por cliente, com histórico
individual.

ONDE ENTRA:
- Nova entidade "equipamento" vinculada a cliente
- Seção 4.3 (Clientes) — acesso aos equipamentos
- Seção 4.2 (OS) — ao criar, selecionar equipamento específico
- Seção 5.2 (Execução) — técnico vê histórico do equipamento

O QUE JÁ TEM:
- Cadastro de cliente (4.3)
- Histórico de OS por cliente (4.3)
- Registro de marca/modelo/etiquetas das evaporadoras e
  condensadoras (5.2) — já são dados de equipamento, só falta
  persistir como entidade própria
- Checklist (4.11) — pode ser vinculado ao tipo de equipamento

COMO IMPLEMENTAR:
a) Criar tabela "equipamentos":
   - id, empresa_id, cliente_id
   - tipo (split, condensadora, evaporadora, VRF, chiller, câmara
     fria, etc. — editável)
   - marca, modelo, numero_serie
   - capacidade (BTU, kW)
   - data_instalacao, idade_aproximada
   - localizacao (ex.: "sala 3º andar")
   - ultima_manutencao (data — atualizada automaticamente)
   - proxima_manutencao (data)
   - observacoes
b) Fluxo:
   - Na seção 4.3 (Clientes), adicionar aba "Equipamentos"
   - Ao criar OS (4.2), adicionar campo opcional "Equipamento"
     (preenche automaticamente se o cliente já tem equipamentos
     cadastrados)
   - Ao concluir OS (5.2), se o técnico registrou marca/modelo/
     etiquetas, oferecer "Salvar como equipamento do cliente"
   - Histórico do equipamento: todas as OS feitas nele, peças
     trocadas, garantias
c) Tela do técnico (5.2): ao selecionar equipamento, mostrar:
   - Histórico de intervenções
   - Última manutenção
   - Peças já trocadas
   - Garantia ativa (se houver)
d) Integração com manutenções recorrentes (4.4): a manutenção pode
   ser vinculada a um equipamento específico.

O QUE ACRESCENTA:
- Transforma o MAPPO em "prontuário do equipamento" — o que a
  refrigeração realmente precisa
- Permite prever trocas, manutenções, upgrades
- Reduz retrabalho (técnico sabe o que já foi feito naquela máquina)
- Base para contratos de manutenção (fase 2)

ESFORÇO: MÉDIO (nova entidade + integração com OS e cliente)
PRIORIDADE: 1


====================================================================
FASE 2 — "MONETIZAR E AUTOMATIZAR"
====================================================================
Estas melhorias exigem mais esforço mas trazem retorno financeiro
direto e reduzem custo operacional.


--------------------------------------------------------------------
2.1 PAGAMENTO ONLINE (Pix / Cartão) NO LINK DO CLIENTE
--------------------------------------------------------------------

ORIGEM: Jobber + Housecall Pro

O QUE É:
Adicionar checkout (Pix e cartão) no link de acompanhamento (4.9)
para o cliente pagar ao concluir o serviço. O valor cai direto no
financeiro do MAPPO (4.10).

ONDE ENTRA:
- Seção 4.9 (Link do cliente) — tela de checkout
- Seção 4.10 (Financeiro) — recebe o pagamento
- Seção 5.2 (Conclusão da OS) — gatilho

O QUE JÁ TEM:
- Link público do cliente (4.9)
- Valores por OS (4.10)
- Status pago/a pagar (4.2)
- Valores por prestador (4.10)

COMO IMPLEMENTAR:
a) Integrar gateway de pagamento: Mercado Pago, PagSeguro, Stripe
   ou Asaas (Asaas é bom para Split de pagamento com prestadores).
b) Na tela do link (4.9), após a OS ser concluída, mostrar:
   - Valor do serviço
   - Botões: "Pagar com Pix" / "Pagar com Cartão"
   - QR Code Pix gerado automaticamente
   - Formulário de cartão (usar checkout transparente do gateway)
c) Ao confirmar pagamento:
   - Atualizar status da OS (4.2) para "pago"
   - Lançar no financeiro (4.10)
   - Enviar recibo pro cliente (e-mail/WhatsApp)
d) (Opcional avançado) Split automático: parte pro prestador, parte
   pra empresa — usar Asaas ou similar.
e) Permitir que o gestor desative essa função por OS (caso o
   cliente já tenha pago antes).

O QUE ACRESCENTA:
- Reduz inadimplência
- Acelera recebimento
- Profissionaliza a empresa
- Possibilita split automático com prestadores

ESFORÇO: ALTO (integração com gateway + compliance PCI)
PRIORIDADE: 2


--------------------------------------------------------------------
2.2 CONTRATOS / PLANOS DE MANUTENÇÃO COM VALOR
--------------------------------------------------------------------

ORIGEM: FieldEdge

O QUE É:
Transformar as "manutenções agendadas" (4.4) em "contratos/planos
vendidos" com valor mensal/trimestral. O cliente paga recorrência e
as preventivas são geradas automaticamente. Controle de inadimplência
e renovação.

ONDE ENTRA:
- Seção 4.4 (Manutenções) — evoluir para "Contratos"
- Seção 4.10 (Financeiro) — receber recorrência
- Seção 4.3 (Clientes) — ver contratos ativos

O QUE JÁ TEM:
- Manutenções recorrentes (4.4) — já criam a próxima sozinhas
- Lembrete 7 dias antes (4.4)
- Integração Google Agenda (4.4)

COMO IMPLEMENTAR:
a) Criar entidade "contrato":
   - id, empresa_id, cliente_id
   - nome (ex.: "Plano Anual Split Sala")
   - valor_mensal ou valor_total
   - periodicidade_cobranca (mensal/trimestral/semestral/anual)
   - data_inicio, data_fim, status (ativo/suspenso/cancelado)
   - equipamentos_vinculados (relação 1:N com 1.4)
   - visitas_inclusas (ex.: 4 por ano)
   - visitas_realizadas (contador)
b) Ao criar contrato, gerar automaticamente as manutenções (4.4)
   nas datas previstas.
c) Tela de "Contratos" nova no painel do gestor, com:
   - Lista de contratos ativos
   - MRR (receita mensal recorrente) total
   - Alertas de renovação próxima
   - Status de pagamento
d) Integração com cobrança recorrente (assinatura) via gateway da
   fase 2.1.

O QUE ACRESCENTA:
- Receita previsível para a empresa
- Fidelização do cliente
- Base para crescimento escalável
- Maior valor percebido do app

ESFORÇO: ALTO (nova entidade + integração de cobrança recorrente)
PRIORIDADE: 2


--------------------------------------------------------------------
2.3 DESPACHO INTELIGENTE AUTOMÁTICO
--------------------------------------------------------------------

ORIGEM: Workiz

O QUE É:
Ao criar uma OS, o sistema SUGERE (ou atribui automaticamente) o
melhor prestador baseado em: proximidade, habilidade/ramo, carga de
trabalho e avaliação. Hoje o gestor escolhe manualmente.

ONDE ENTRA:
- Seção 4.2 (Criar OS) — sugestão automática
- Seção 4.7 (Mapa ao vivo) — fonte de dados de localização
- Seção 4.3 (Equipe) — dados de habilidades

O QUE JÁ TEM:
- Mapa com localização dos técnicos (4.7)
- Status de cada técnico (4.1 — "Equipe agora")
- Cadastro de equipe (4.11)
- Atribuição de obras VRF por técnico (4.8)

COMO IMPLEMENTAR:
a) Ao criar OS (4.2), após selecionar cliente/endereço:
   - Calcular distância de cada técnico disponível (usar Google
     Maps Distance Matrix API)
   - Filtrar técnicos com habilidade compatível (se houver
     categorização)
   - Contar OS em aberto de cada técnico
   - Calcular score = f(proximidade, carga, avaliação)
   - Mostrar "Top 3 sugeridos" com justificativa
b) Opções de configuração (seção 4.11):
   - Modo: "sugerir" (gestor escolhe) ou "atribuir automático"
   - Peso de cada critério (proximidade vs carga vs avaliação)
c) Campos adicionais em equipe (4.11):
   - especialidades (tags: "split", "VRF", "chiller", etc.)
   - avaliacao_media (calculada a partir de OS concluídas)
d) No modo automático, o sistema atribui e notifica o técnico
   escolhido.

O QUE ACRESCENTA:
- Reduz drasticamente tempo do gestor em despacho
- Otimiza deslocamento (economia de combustível)
- Balanceia carga de trabalho da equipe
- Escala sem aumentar equipe administrativa

ESFORÇO: ALTO (algoritmo + integrações + UI)
PRIORIDADE: 2


--------------------------------------------------------------------
2.4 CONTROLE DE PEÇAS / ESTOQUE
--------------------------------------------------------------------

ORIGEM: FieldEdge

O QUE É:
O técnico registra a peça usada na OS e o estoque baixa
automaticamente. Alertas de estoque mínimo.

ONDE ENTRA:
- Nova entidade "estoque" / "pecas"
- Seção 5.2 (Execução da OS) — técnico registra peça usada
- Seção 4.2 (OS) — lista de peças usadas
- Nova tela de "Estoque" no painel do gestor

O QUE JÁ TEM:
- Registro de marca/modelo/etiquetas (5.2) — base para identificar
  peças
- Checklist editável (4.11) — pode incluir itens de peças

COMO IMPLEMENTAR:
a) Tabela "pecas":
   - id, empresa_id
   - nome, codigo, categoria
   - quantidade_em_estoque
   - quantidade_minima (para alerta)
   - custo_unitario, preco_venda
b) Tabela "pecas_os" (relação N:N):
   - os_id, peca_id, quantidade, valor_total
c) Fluxo:
   - Gestor cadastra peças no estoque (nova tela)
   - Técnico, ao executar OS, seleciona peças usadas (lista do
     estoque)
   - Ao concluir OS, estoque baixa automaticamente
   - Alerta quando quantidade < quantidade_minima
d) Relatório de peças mais usadas, custo por OS, margem.

O QUE ACRESCENTA:
- Controle de custo real por serviço
- Evita falta de peça em campo
- Base para precificação mais precisa

ESFORÇO: MÉDIO
PRIORIDADE: 2


====================================================================
FASE 3 — "INTELIGÊNCIA DE DADOS"
====================================================================
Estas melhorias transformam o MAPPO em plataforma de inteligência,
não só de operação. É o selo de líder mundial.


--------------------------------------------------------------------
3.1 SCORE DE PRODUTIVIDADE POR PRESTADOR
--------------------------------------------------------------------

ORIGEM: ServiceTitan

O QUE É:
Dashboard automático com ranking de produtividade por técnico/
prestador, calculado a partir dos dados já coletados.

ONDE ENTRA:
- Nova tela "Ranking" ou "Produtividade" no painel do gestor
- Aproveita dados de 4.1, 4.2, 4.7, 5.2

O QUE JÁ TEM:
- Contadores de OS (4.1)
- Histórico de OS por técnico (4.2)
- Taxa de devolução para revisão (4.2)
- Tempo de check-in e conclusão (5.2)
- Localização e check-ins (4.7)

COMO IMPLEMENTAR:
a) Criar tela "Produtividade" com cards por técnico:
   - Total de OS concluídas no período
   - Tempo médio por OS
   - Taxa de devolução (retrabalho)
   - Pontualidade (check-in no horário previsto)
   - Score geral (média ponderada)
b) Ranking com top/bottom performers.
c) Filtros por período (semana/mês/ano).
d) Exportar para PDF/Excel.

O QUE ACRESCENTA:
- Base para bonificação por desempenho
- Identifica quem precisa de treinamento
- Transparência na gestão de prestadores

ESFORÇO: MÉDIO (cálculos + nova tela)
PRIORIDADE: 3


--------------------------------------------------------------------
3.2 ROTEIRIZAÇÃO OTIMIZADA MULTI-PARADAS
--------------------------------------------------------------------

ORIGEM: Workiz

O QUE É:
Quando o técnico tem 3+ OS no dia, o sistema calcula a melhor ordem
de visitas para minimizar deslocamento.

ONDE ENTRA:
- Seção 5.1 (Início do técnico) — ordem sugerida
- Seção 5.2 (Minhas Ordens) — ordenação automática

O QUE JÁ TEM:
- Lista de OS do técnico (5.2)
- Endereço de cada OS (4.2)
- GPS do técnico (5.3)

COMO IMPLEMENTAR:
a) Usar Google Maps Directions API com otimização de waypoints
   (max 25 paradas por requisição).
b) Ao abrir "Minhas Ordens" (5.2), oferecer botão "Ordenar por
   melhor rota".
c) Mostrar no mapa a rota sugerida.
d) Permitir que o técnico aceite ou reordene manualmente.

O QUE ACRESCENTA:
- Reduz até 20% do tempo de deslocamento
- Economia de combustível
- Mais OS por dia

ESFORÇO: MÉDIO (integração com Google Maps)
PRIORIDADE: 3


--------------------------------------------------------------------
3.3 PREVISÃO DE FATURAMENTO + BENCHMARKING DE PREÇO
--------------------------------------------------------------------

ORIGEM: ServiceTitan

O QUE É:
Com base no histórico, projetar faturamento do mês e comparar
preços praticados com médias do mercado (quando houver dados
agregados suficientes).

ONDE ENTRA:
- Seção 4.10 (Financeiro) — dashboards
- Seção 4.1 (Painel) — card de previsão

O QUE JÁ TEM:
- Valores por OS (4.2)
- Tabela de preços (4.10)
- Histórico financeiro

COMO IMPLEMENTAR:
a) Previsão de faturamento:
   - Média móvel dos últimos 3/6/12 meses
   - Projeção do mês atual baseada em OS em andamento +
     manutenções agendadas
b) Benchmarking de preço (requer massa de dados agregada):
   - Calcular média de preço por tipo de serviço na base
   - Mostrar: "seu preço X | média do mercado Y"
   - Só ativar quando houver N mínimo de empresas/dados
c) Gráficos de tendência.

O QUE ACRESCENTA:
- Ajuda o gestor a precificar melhor
- Visão estratégica do negócio
- Diferencial competitivo forte

ESFORÇO: MÉDIO
PRIORIDADE: 3


--------------------------------------------------------------------
3.4 AVALIAÇÃO AUTOMÁTICA PÓS-SERVIÇO (Google)
--------------------------------------------------------------------

ORIGEM: Jobber

O QUE É:
Ao concluir a OS, disparar automaticamente um pedido de avaliação
no Google pro cliente.

ONDE ENTRA:
- Seção 5.2 (Conclusão da OS) — gatilho
- Seção 4.9 (Link do cliente) — tela de avaliação

O QUE JÁ TEM:
- Link público (4.9)
- Conclusão da OS (5.2)
- Notificações (4.11 — base)

COMO IMPLEMENTAR:
a) Ao concluir OS, oferecer ao gestor: "Enviar pedido de avaliação"
b) Gerar link curto do Google Meu Negócio da empresa
c) Enviar via WhatsApp/SMS (aproveitar 1.2) com mensagem:
   "Como foi o atendimento? Avalie: {link}"
d) Configuração na seção 4.11: URL do Google Meu Negócio.

O QUE ACRESCENTA:
- Aumenta avaliações no Google (traz novos clientes)
- Quase zero esforço pro gestor

ESFORÇO: BAIXO
PRIORIDADE: 3


====================================================================
RESUMO EXECUTIVO
====================================================================

TOTAL DE MELHORIAS: 12
- FASE 1: 4 melhorias (esforço baixo/médio, maior retorno rápido)
- FASE 2: 4 melhorias (esforço médio/alto, retorno financeiro)
- FASE 3: 4 melhorias (esforço médio, selo de líder)

RECOMENDAÇÃO DE ORDEM:
1.1 Rastreamento no link do cliente        → BAIXO    → FAZER PRIMEIRO
1.2 Notificações automáticas               → MÉDIO    → FAZER LOGO
1.3 Orçamento → aprovação → OS             → MÉDIO    → FAZER LOGO
1.4 Gestão de ativos/equipamentos          → MÉDIO    → FAZER LOGO
2.1 Pagamento online                       → ALTO     → SEGUNDO BLOCO
2.2 Contratos/planos de manutenção         → ALTO     → SEGUNDO BLOCO
2.3 Despacho inteligente                   → ALTO     → SEGUNDO BLOCO
2.4 Controle de peças/estoque              → MÉDIO    → SEGUNDO BLOCO
3.1 Score de produtividade                 → MÉDIO    → TERCEIRO BLOCO
3.2 Roteirização multi-paradas             → MÉDIO    → TERCEIRO BLOCO
3.3 Previsão + benchmarking                → MÉDIO    → TERCEIRO BLOCO
3.4 Avaliação automática Google            → BAIXO    → TERCEIRO BLOCO


====================================================================
OBSERVAÇÕES FINAIS PARA O DESENVOLVEDOR
====================================================================

1. O MAPPO já tem uma base muito sólida. As melhorias da FASE 1
   aproveitam diretamente o que já existe — não é reconstruir, é
   conectar.

2. O módulo VRF (4.8) já é um diferencial único no mercado. Não
   mexer nele — manter como trunfo.

3. A arquitetura multi-empresa já está pronta para escalar como
   SaaS. As melhorias devem respeitar o isolamento entre empresas.

4. Para integrações externas (WhatsApp, pagamento, Google Maps),
   recomendo avaliar:
   - WhatsApp: Evolution API (self-hosted) ou Z-API (SaaS)
   - Pagamento: Asaas (faz split automático) ou Mercado Pago
   - Mapas: Google Maps Platform (Distance Matrix + Directions)
   - E-mail: Resend ou Mailgun
   - SMS: Zenvia ou TotalVoice (Brasil)

5. Antes de implementar, validar com o João (dono do produto) a
   ordem exata das fases e eventuais ajustes de escopo.

====================================================================
FIM DO DOCUMENTO
====================================================================


====================================================================
ANÁLISE TÉCNICA DO DESENVOLVIMENTO — 16/09/2026
====================================================================

DECISÃO DO DONO (16/09/2026): o MAPPO segue como FERRAMENTA INTERNA
da Elite Ar. As 12 melhorias acima ficam GUARDADAS para o futuro; o
foco agora é corrigir os problemas reais do app existente.

--------------------------------------------------------------------
SOBRE ESTE DOCUMENTO
--------------------------------------------------------------------
A lista de funcionalidades é legítima — são de fato os recursos que
ServiceTitan, Jobber e Housecall Pro têm. O valor dela está mantido.

Porém ele foi escrito a partir do resumo funcional do MAPPO, NÃO do
código. Por isso as colunas "O QUE JÁ TEM", "COMO IMPLEMENTAR" e
"ESFORÇO" não são confiáveis. Erros verificados contra o código:

- Fala em "criar tabela", "relação N:N", "empresa_id", "API key
  criptografada no banco". O MAPPO não tem banco relacional e NÃO TEM
  SERVIDOR. Verificado: firebase.json só declara Firestore — nenhuma
  Cloud Function existe.
- "Os gatilhos de evento já existem" (1.2): existem no navegador do
  usuário. App fechado = nada dispara. Notificação automática exige
  servidor.
- "Assinatura digital do técnico (5.4)": 5.4 é o avatar. A assinatura
  é do CLIENTE, no passo 4 da execução.
- Manda validar "com o João (dono do produto)". O dono é o Paulo.

--------------------------------------------------------------------
BARREIRAS REAIS PARA CADA ITEM (verificadas no código)
--------------------------------------------------------------------
1.1 Rastreio no link do cliente — VIÁVEL SEM O ETA, usando o Leaflet
    que já existe (custo zero). O ETA via Google Distance Matrix tem
    custo recorrente (o Google acabou com o crédito de US$200; hoje
    são 10 mil chamadas grátis/mês e depois cobra). ATENÇÃO JURÍDICA:
    publicar a posição em tempo real de um trabalhador numa URL sem
    login é questão de LGPD/trabalhista, não só técnica — exige
    consentimento específico e janela de tempo limitada.

1.2 Notificações automáticas — IMPOSSÍVEL HOJE. Sem servidor, a chave
    de API fica exposta no HTML e qualquer um usa a conta. Exige Cloud
    Functions (plano Blaze, custo mensal).

1.3 Orçamento aprovado pelo cliente — o link público hoje é SOMENTE
    LEITURA (firestore.rules: allow write exige isMember). Deixar o
    cliente aprovar significa abrir escrita sem autenticação —
    superfície de ataque nova, exige desenho cuidadoso de regra.

1.4 Ativos/equipamentos — VIÁVEL sem backend. Maior valor real para
    refrigeração. Mas só DEPOIS de resolver o armazenamento de fotos
    (ver P0-1 abaixo), senão multiplica o problema de tamanho.

2.1 Pagamento online — IMPOSSÍVEL HOJE (precisa de servidor para
    webhook). Correção ao documento: ele sugere "checkout
    transparente", que joga a empresa para dentro do escopo PCI. O
    certo é checkout hospedado/redirect, que evita esse escopo.

2.2 Contratos com cobrança — depende do 2.1.

2.3 Despacho inteligente / 3.2 Roteirização — dependem de APIs pagas
    do Google Maps (custo recorrente).

3.3 Benchmarking de preço — exige cruzar dados ENTRE empresas, o
    oposto do isolamento que a arquitetura garante hoje, e questão de
    LGPD. Não é "médio esforço".

3.4 Avaliação no Google — o documento marcou prioridade 3; está
    errado. É o MAIS BARATO de todos: um link configurável + botão de
    WhatsApp, padrão que o app já tem pronto. Se um dia quisermos um
    ganho rápido, é por aqui.

--------------------------------------------------------------------
A VERDADE ESTRATÉGICA (registrada para consulta futura)
--------------------------------------------------------------------
O que separa o MAPPO do ServiceTitan não são essas 12 funcionalidades.
É que o MAPPO tem UM cliente, não tem cadastro self-service (a empresa
nasce "pendente" e é aprovada à mão no console do Firebase) e não tem
NENHUMA forma de cobrar assinatura.

Se um dia a decisão mudar de "ferramenta interna" para "produto para
vender", a prioridade não é nenhum dos 12 itens — é cadastro
self-service, cobrança e backend. Sem isso não existe segundo cliente.

