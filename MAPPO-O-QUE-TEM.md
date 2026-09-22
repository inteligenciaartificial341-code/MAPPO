# MAPPO — O que o app já tem

> **Leia este arquivo antes de começar qualquer trabalho no MAPPO.**
> Ele e o [MAPPO-O-QUE-FALTA.md](MAPPO-O-QUE-FALTA.md) são a fonte de verdade sobre o
> estado do produto. Não vasculhe o código para descobrir o que existe — comece por aqui.
>
> **Regra de atualização:** este arquivo descreve **o que está publicado**. Nada entra aqui
> antes do commit + publicação. Ao final de cada publicação: mover o item de
> `MAPPO-O-QUE-FALTA.md` para cá e registrar no histórico no fim do arquivo.

**Estado:** publicado até o commit `121cbab` · atualizado em 22/09/2026
**Endereço:** https://inteligenciaartificial341-code.github.io/MAPPO/

---

## 1. O que é

Aplicativo de gestão de equipes em campo. O gestor cria e distribui os serviços; o técnico
executa pelo celular registrando check-in por GPS, fotos, checklist e assinatura do cliente;
o gestor acompanha em tempo real, inclusive a posição da equipe no mapa.

Roda no navegador, instalável como app (Android, iPhone e computador). Dados na nuvem,
sincronizando sozinhos entre todos os aparelhos da empresa.

**Decisão de produto (16/09/2026):** ferramenta **interna** da Elite Ar. Não é SaaS para
vender — não há cadastro self-service nem cobrança, e isso é intencional por ora.

## 2. Perfis

| Perfil | O que enxerga |
|---|---|
| **Gestor** | Tudo: cria OS, cadastra clientes e equipe, define checklists e preços, aprova/devolve serviços, vê mapa e financeiro |
| **Técnico / prestador** | Só o que foi atribuído a ele: executa serviços, faz check-in, tira fotos, colhe assinatura, liga o GPS ao vivo |

O perfil vem do cadastro na empresa, não é escolhido no login. Cada empresa é isolada.

## 3. Entrada no app

- **Cadastro da empresa** — e-mail/senha, nome e ramo (Refrigeração/Climatização, Manutenção
  Predial ou ramo próprio digitado). O ramo já traz checklist e tabela de serviços prontos.
- **Aprovação manual** — a empresa nasce "pendente" e é liberada à mão no console do Firebase.
- **Convite do técnico** — o gestor cadastra e gera um código de uso único; o técnico cria a
  conta e se vincula sozinho. Revogável.
- **Login** — e-mail e senha, com mensagens de erro em português.

## 4. Funções do gestor

### Painel
Contadores (total, pendentes, em andamento, concluídas), alerta de OS atrasadas, ordens
recentes, status da equipe e próximas manutenções. Card do VRF quando o ramo usa.

### Ordens de serviço
- Criar: cliente, endereço, tipo, técnico, data/hora, quantidade de itens, observações
- Filtros: Todas, Pendentes, Em andamento, Em revisão, Concluídas, Atrasadas
  (pendente com data vencida vira "atrasada" sozinha)
- No detalhe: ver fotos em tela cheia, escrever nota pro técnico, lançar valor e marcar
  pago/a pagar, **devolver para revisão com motivo**, gerar link pro cliente, agendar a
  próxima manutenção, excluir

### Clientes
Cadastro (nome, endereço, contato), histórico de visitas por cliente, sugestão automática
ao criar OS.

### Manutenções
Agendamento com tipo (Preventiva/Corretiva/Limpeza) e recorrência (única, 3, 6 ou 12 meses).
Ao concluir uma recorrente, **a próxima é criada sozinha**. Gera OS a partir da manutenção.
Aviso automático 7 dias antes (na plataforma e por notificação do navegador). Botão para
Google Agenda.

### Tarefas adicionais
Trabalhos avulsos fora do fluxo de OS: nome, descrição, técnico, limite de fotos e bloco de
notas opcional. O técnico faz check-in de presença.

### Módulo principal
Tela do serviço principal ("Sistema Split" em refrigeração; renomeável nos outros ramos).

### Mapa ao vivo
Posição de cada técnico (check-in e GPS ao vivo), painel por técnico, lista da equipe
(online / última posição / sem dado) e histórico completo de localização com horário.

### Sistema VRF (obras)
Só no ramo com VRF. Várias obras simultâneas; configuração de andares e data-meta;
**10 fases fixas** com etapas editáveis (Perfuração e Suporte das Evaps, Linha Frigorígena,
Drenagem, Comunicação e Elétrica, Instalação da Condensadora, Conexões das Evaporadoras,
Pré-Vácuo, Startup Final, Acabamento e Entrega, Entrega); progresso em % por fase/andar/obra;
**missão da semana** (prioridades por andar); atribuição de técnicos por obra; abas Painel,
Andares, Mapa, Fotos e Relatórios; exportação de PDF por andar; link de acompanhamento por andar.

### Link de acompanhamento do cliente
Link por OS ou por andar de obra. Cliente abre no navegador, **sem instalar e sem login**, e
vê fotos e etapas atualizando conforme o técnico lança. Mostra só aquele serviço. Vale
**30 dias**, revogável. Botão de envio por WhatsApp.

### Financeiro
Tabela de preço por categoria (preenche a OS automaticamente); valores por prestador, OS a OS,
separados em pago / a pagar / sem status; notas de adiantamento (anotação, não entra no cálculo).

### Configurações
Equipe (cadastro, convite, módulos, obras VRF, remoção) · Checklist de Instalação e Manutenção ·
Checklist VRF · Nome do módulo · Notificações · Google Agenda · Sincronização (forçar sync,
diagnóstico).

## 5. Funções do técnico

### Execução de uma OS — 4 passos
1. **Chegada** — check-in com horário e localização
2. **Registro fotográfico** — refrigeração: marca, modelo e foto das etiquetas da evaporadora
   e condensadora de cada split; outros ramos: foto de antes e depois de cada item
3. **Checklist** (ou "Registro da limpeza", em manutenção) — marcar cada item com foto obrigatória
4. **Assinatura do cliente** na tela

O botão **Concluir só libera** com tudo obrigatório feito: check-in, fotos de todos os itens,
itens críticos marcados com foto, e assinatura. Fotos são comprimidas antes de enviar.
Devolvida para revisão, o técnico vê o motivo e refaz.

### Outros
- **GPS ao vivo** — até 10h contadas do check-in do dia, desliga sozinho, com consentimento
  explícito e tentativa de manter a tela ativa
- **Avatar** — como aparece no mapa do gestor
- **Tarefas** — check-in, fotos e notas
- **Manutenções** — aparecem sozinhas na data
- **VRF** — escolha da obra, check-in diário com GPS, aba Missão e abas por andar (marcar etapa,
  foto, nota), mapa e fotos da obra, envio de relatório do dia

## 6. Recursos gerais

- Sincronização em nuvem em tempo real entre todos os aparelhos
- Instalável como app com ícone próprio e tela de abertura (Android, iPhone, computador)
- Layout Desktop (menu flutuante) e Mobile (barra inferior)
- **Tutorial guiado** no primeiro acesso (spotlight + cartão) e **mini-tutorial em cada tela**
  na primeira visita; botão "?" reabre
- Compartilhar o app e avaliar/enviar sugestões de dentro dele
- Vocabulário adaptado ao ramo

## 7. Segurança

- Login real por e-mail e senha; isolamento total entre empresas
- Dados sensíveis (equipe, preços, financeiro, checklists, obras) só o gestor altera
- Localização só com consentimento; GPS ao vivo expira sozinho
- Links públicos expiram em 30 dias e são revogáveis
- Escape de conteúdo digitado (XSS) e verificação de integridade das bibliotecas externas (SRI)

## 8. Proteções contra falha silenciosa

- **Memória do aparelho cheia** — se o `localStorage` estoura, o app avisa com modal
  bloqueante dizendo que **não foi salvo** e o que fazer, em vez de perder o trabalho do
  técnico em silêncio
- **Falha de sincronização visível** — faixa de alerta na tela quando algum dado não está
  chegando ao servidor, com a hora em que o problema começou; some sozinha ao normalizar
- **Aviso preventivo de espaço** — alerta a 76% do teto de 1 MiB por documento, antes de
  estourar
- **Tabela de espaço por documento** em Configurações → Sincronização, com barra e
  porcentagem do limite (fotos de obra aparecem **uma linha por andar**, que é como vão
  para a nuvem)
- **Fotos de obra divididas por andar na nuvem** — cada andar tem seu próprio documento, com
  seu próprio limite. Além de remover o teto, faz cada foto nova trafegar só o andar que
  mudou, em vez do acervo inteiro

---

## Histórico de publicações

> Uma linha por commit publicado, do mais recente para o mais antigo.

| Data | Commit | O que entrou |
|---|---|---|
| 22/09/2026 | `121cbab` | **Bloco 0, item 1 — Etapa B.** Fotos de obra passam a ter **um documento por andar** na nuvem, removendo o teto de 1 MiB que estava a 90%; cada foto nova trafega só o andar que mudou, em vez do acervo inteiro. Corrigido junto um vazamento pré-existente: os documentos de link público do cliente eram baixados e **gravados no aparelho de todos os usuários** em todo boot, para sempre |
| 22/09/2026 | `9d49fba` | **Bloco 0, itens 3 e 2 + item 1 Etapa A.** Memória cheia deixa de perder o trabalho do técnico (avisa e não engole o erro); falha de sincronização vira faixa visível na tela, com aviso preventivo a 76% do teto e tabela de espaço em Configurações; fotos passam de 1024px/0,6 para 800px/0,5 (−51%) e assinatura de PNG para JPEG (−82%); imagem com transparência deixa de virar preta. Criados `MAPPO-O-QUE-TEM.md` e `MAPPO-O-QUE-FALTA.md` como fonte de verdade do estado do produto |
| 14/09/2026 | `c67125f` | Ícones do PWA refeitos com medição de dimensão e espessura: ocupação 72%, engrossamento com teto 8, maskable 62%, ícone de app sem tagline, favicon só com o glifo, 5 telas de abertura de iPhone |
| 02/09/2026 | `91af720` | Minitutorial contextual por tela (mini-tour na 1ª visita a cada tela) + correção do menu flutuante no modo Desktop |
| 01/09/2026 | `85d9204` | Conteúdo do minitutorial aprofundado (explica função e uso, não só o nome) |
| 01/09/2026 | `8fd8406` | jsPDF 2.5.1 → 4.2.1 (fecha CVEs de DoS e injeção) |
| 01/09/2026 | `920bdd5` | SRI nos CDNs, validação de ramo na regra do servidor, SEO básico |
| 01/09/2026 | `03de230` | Técnico removido volta a poder ser convidado (ponteiro travado) |
| 01/09/2026 | `8b9d7c1` | wsId ganha sufixo aleatório (fecha sequestro de slug) |
