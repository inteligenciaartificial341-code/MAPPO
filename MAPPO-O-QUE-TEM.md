# MAPPO — O que o app já tem

> **Leia este arquivo antes de começar qualquer trabalho no MAPPO.**
> Ele e o [MAPPO-O-QUE-FALTA.md](MAPPO-O-QUE-FALTA.md) são a fonte de verdade sobre o
> estado do produto. Não vasculhe o código para descobrir o que existe — comece por aqui.
>
> **Regra de atualização:** este arquivo descreve **o que está publicado**. Nada entra aqui
> antes do commit + publicação. Ao final de cada publicação: mover o item de
> `MAPPO-O-QUE-FALTA.md` para cá e registrar no histórico no fim do arquivo.

**Estado:** publicado até o commit `c8b3043` · atualizado em 25/09/2026
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
- **Convite do técnico** — o gestor cadastra e gera um código de uso único, **válido por 7
  dias**; o técnico cria a conta e se vincula sozinho. Revogável a qualquer momento.
- **Login** — e-mail e senha, com mensagens de erro em português.
- **Esqueci minha senha** — link na tela de login envia um e-mail de redefinição (pelo próprio
  Firebase, sem servidor). A resposta é sempre a mesma exista a conta ou não, para não revelar
  quais e-mails estão cadastrados.

## 4. Funções do gestor

### Painel
Contadores (total, pendentes, em andamento, concluídas), alerta de OS atrasadas, ordens
recentes, status da equipe e próximas manutenções. Card do VRF quando o ramo usa.

### Ordens de serviço
- Criar: cliente, endereço, tipo, técnico, data/hora, quantidade de itens, observações
- Filtros: Todas, Pendentes, Em andamento, Em revisão, Concluídas, Atrasadas
  (pendente com data vencida vira "atrasada" sozinha)
- No detalhe: **trocar o técnico responsável**, ver fotos em tela cheia, escrever nota pro
  técnico, lançar valor e marcar pago/a pagar, **devolver para revisão com motivo**, gerar
  link pro cliente, agendar a próxima manutenção, excluir
- Concluída, a OS pode virar **PDF para enviar ao cliente**: fotos dos equipamentos, checklist
  executado, registro fotográfico e o aceite assinado — o mesmo padrão do relatório VRF

### Clientes
Cadastro (nome, endereço, contato), histórico de visitas por cliente, sugestão automática
ao criar OS.

### Manutenções
Agendamento com tipo (Preventiva/Corretiva/Limpeza) e recorrência (única, 3, 6 ou 12 meses).
Ao concluir uma recorrente, **a próxima é criada sozinha**. Gera OS a partir da manutenção.
**Editável depois de criada** — inclusive trocar o técnico, essencial quando alguém sai da
empresa e a manutenção se repete mês a mês. Se já tinha sido enviada ao Google Agenda, o app
avisa e reabre a Agenda com os dados novos (o evento antigo precisa ser apagado à mão).
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
separados em pago / a pagar / sem status; notas de adiantamento (anotação, não entra no cálculo),
que podem ser **excluídas** com registro de quem excluiu. **Filtro de período** (este mês, 30
dias, 90 dias, este ano, desde sempre) valendo para o resumo e para as notas.

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
itens críticos marcados com foto, e assinatura — e, quando algo falta, **o app lista o que
falta** em vez de só deixar o botão apagado. Fotos são comprimidas antes de enviar.
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
- Links públicos expiram em 30 dias e são revogáveis; convites de acesso expiram em 7 dias
- **Técnico removido perde o acesso na hora**, sem precisar recarregar a página
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
- **Fotos da OS em um documento por foto** — mesma ideia, levada ao limite onde ela mais doía:
  uma única OS com fotos chegava a 1082 KB e o servidor recusava o registro inteiro. Cada foto
  agora tem seu próprio documento, o registro das ordens ficou em poucos KB, e uma foto grande
  demais é deixada de lado com aviso **sem travar as outras**
- **Sessão do Firebase ausente não deixa mais o app numa casca vazia** — se a sessão da nuvem
  se perde com a sessão local presente, o app pede login de novo em vez de abrir sem nuvem e
  sem avisar. Nenhum dado do aparelho é apagado nesse caminho
- **Abrir o link do cliente não derruba o login de quem abriu** — o link público reaproveita a
  sessão que já existe no navegador, em vez de criar uma identidade anônima que substituía a
  do gestor (o Firebase só admite um usuário por navegador)

---

## 9. Rede anti-regressão (testes)

Não é funcionalidade para o usuário — é o que impede funcionalidade que já funcionava de
parar de funcionar. Existe porque em 24/09/2026 três defeitos apareceram juntos em coisas
que já funcionavam e **não havia como perceber** antes do usuário.

- **Suítes Playwright versionadas** em `testes/`, mais os diagnósticos. Antes viviam numa
  pasta temporária do sistema, que já tinha sido apagada **três vezes** — enquanto não
  estavam versionadas, não existiam. Quantas são hoje: `npm run test:lista` (o número não
  fica escrito em documento nenhum, para não envelhecer)
- **Um comando só:** `npm test` roda tudo em série, imprime o resultado de cada arquivo e
  termina com a contagem. Sai com código diferente de zero se qualquer suíte falhar
- **Suíte nova entra sozinha:** basta chamar-se `teste-algo.js` — não há lista para
  cadastrar. E um `teste-*.js` que **não** imprime o veredito `TODOS OS CHECKS … PASSARAM`
  é tratado como **falha**, nomeada na saída: não existe suíte que pare de reprovar em
  silêncio
- **O runner tem a sua própria suíte** (`teste-runner.js`): ele é o único ponto que
  converte "uma suíte falhou" em "CI vermelho", então está testado com arquivos de mentira
  numa pasta temporária
- **Suítes x diagnósticos:** suíte reprova de verdade; diagnóstico só mede e nunca reprova
  a execução, então investigação não vira alarme falso
- **GitHub Actions a cada push em `main` e a cada PR** (`.github/workflows/testes.yml`):
  roda o mesmo `npm test` e **marca** o commit. Custo zero — só runner público gratuito.
  O CI não publica, não faz deploy e não toca em produção. **Marcar não é impedir:** o job
  roda depois do commit já estar em `main`, e o GitHub Pages publica de `main` sem consultar
  o resultado. Para o vermelho de fato barrar a publicação falta ligar proteção de ramo
  exigindo o status check — o passo a passo está no `CLAUDE.md` e só o proprietário pode
  fazer
- **Artefatos da falha guardados:** quando o CI fica vermelho, as capturas de tela e os PDFs
  gerados pelas suítes ficam anexados à execução por 7 dias, em vez de morrerem com o runner
- **Os três que batem em produção ficam fora** do `npm test` e do CI (`diag-difer`,
  `diag-linkreal`, `diag-pubreal`): dependem de rede, do site publicado e do estado da
  conta do proprietário. Rodam só à mão, com `npm run test:producao`
- **Timeout de 5 minutos por suíte:** suíte travada é abortada, contada como falha e
  nomeada — nunca deixa o CI pendurado
- **Regra escrita em `CLAUDE.md`:** todo defeito relatado **vira teste antes de virar
  correção**. O teste falha primeiro, provando que reproduz o defeito, e só depois passa
- **O que navegador automatizado não alcança** (Google Agenda, notificação real do
  aparelho, WhatsApp, câmera de celular, instalação do PWA) está em
  `testes/VERIFICACAO-MANUAL.md`, como lista curta de conferência à mão
- Como rodar, como rodar uma só, como provar que um teste pega o defeito (com `MAPPO_RAIZ`,
  contra a versão anterior) e como escrever uma suíte nova: `testes/README.md`

---

## Histórico de publicações

> Uma linha por commit publicado, do mais recente para o mais antigo.

| Data | Commit | O que entrou |
|---|---|---|
| 26/09/2026 | `c8b3043` | **Correções da revisão adversarial da rede.** Três camadas de revisão acharam 19 defeitos no que tinha acabado de entrar — o mais grave: apagar uma linha `console.log` reclassificava a suíte como diagnóstico e ela **parava de reprovar em silêncio**. Agora `teste-*.js` é suíte sempre, e sem o veredito é erro nomeado. Junto: o runner ganhou a própria suíte (ninguém testava o testador), e o `CLAUDE.md` passou a dizer com honestidade que o CI **avisa e não impede** publicação, com o passo a passo da proteção de ramo que o transformaria em impedimento |
| 25/09/2026 | `56db2a0` | **Rede anti-regressão: suítes versionadas, um comando e CI.** As 25 suítes Playwright e 9 diagnósticos que provaram cada correção da semana viviam numa pasta temporária do sistema, **já apagada três vezes** — enquanto não estavam versionados, não existiam. Agora vivem em `testes/`, com `npm test` rodando tudo em série e terminando na contagem (`25/25 suites passaram`), e o GitHub Actions rodando o mesmo comando a cada push, de graça. O runner classifica pelo veredito `TODOS OS CHECKS … PASSARAM` e não por lista de nomes, então suíte nova entra sozinha e suíte que parou de imprimir o veredito aparece como falha. Os três que batem no site publicado e no Firestore real ficam fora do CI. Junto, a regra escrita em `CLAUDE.md`: **todo defeito relatado vira teste antes de virar correção** |
| 25/09/2026 | `3eb9663` | **A foto ficava presa no aparelho que a tirou.** O texto sincronizava entre celular e notebook, a foto não. As fotos estavam no servidor o tempo todo — faltava o **ponteiro**: o índice de fotos da ordem (`__f`) era decidido pelo merge campo a campo, e o índice velho da nuvem vencia o novo. Junto: marcar um item do checklist num aparelho fazia o array local inteiro vencer, levando junto a ausência das fotos do outro. Agora índice de foto é união e cada foto é decidida sozinha — uma foto só some quando ninguém mais a tem |
| 25/09/2026 | `82c6317` | **A nuvem apagava a foto recém-tirada ao devolver a ordem.** Salvar a etiqueta da condensadora fazia a da evaporadora sumir, e a OS voltava de concluída para em andamento (sem a foto ela deixa de cumprir os requisitos). O app só preservava as fotos locais que a **nuvem já conhecia** — uma foto tirada agora ainda não está lá, então o valor vazio do remoto a sobrescrevia. Regra agora explícita: a nuvem não conhecer uma foto nunca é razão para apagá-la |
| 25/09/2026 | `d96a174` | **A foto saiu do `localStorage`.** A ordem guarda só a referência; a imagem mora no IndexedDB e é carregada quando aparece na tela. Medido: uma OS com 4 fotos ocupava 960 KB no aparelho e passou a ocupar 0 KB, com os bytes voltando inteiros. O teto de ~5 MB era o que travava o técnico em campo (~10 a 12 ordens com foto) e o que fazia o iPhone descartar a página na câmera. Uma referência que chegue a um lugar não convertido vira imagem quebrada **na tela**, nunca um apagamento silencioso |
| 25/09/2026 | `d79ad5c` | **Armazém de fotos no aparelho (IndexedDB) e o espaço do aparelho na tela.** Medido lado a lado: as mesmas 40 fotos de 200 KB entram no IndexedDB e estouram o `localStorage` com `QuotaExceededError`. O teto do aparelho nunca aparecia em tela nenhuma — o gestor via o servidor todo verde e não entendia por que não conseguia salvar |
| 25/09/2026 | `8a21647` | **Fotos de obra em um documento por foto, e excluir andar libera de verdade.** As fotos de um andar iam todas num documento só: um andar bem fotografado chegava aos 94% do teto de 1 MiB e, ao encher, parava de sincronizar — foto tirada num celular não aparecia no outro. Medido: 16 fotos de 60 KB levavam o documento do andar a 961 KB; agora ele fica em 1 KB. Junto, duas causas de "excluí o andar e não diminuiu": nada no app apagava o documento na nuvem, e o outro celular ressuscitava o andar excluído ao reenviar |
| 25/09/2026 | `16a208e` | **Foto vira miniatura na OS e abre no tamanho da tela ao tocar.** Na tela do técnico ela ocupava 100% da largura e nem abria ao clicar. Junto: em 6 lugares a mesma foto era escrita duas vezes no HTML (no `src` e no `onclick`), dobrando a memória usada por foto |
| 25/09/2026 | `2cd2607` | **Tabela de espaço acusava 100% nas ordens com o servidor quase vazio.** Ela media a cópia do aparelho (com as fotos dentro) em vez do que de fato sobe (sem fotos, desde `ced6f69`) — e mandou o gestor atrás de um problema que não existia |
| 25/09/2026 | `9a7c928` | **A foto do técnico jogava ele de volta pra tela principal.** Ao enviar foto dentro da OS, o celular descartava a página por pressão de memória (a câmera em primeiro plano + fotos em base64) e recarregava — e o boot do técnico sempre termina na tela principal, então ele reaparecia fora da OS, sem a foto. Agora o app anota qual OS estava aberta e volta pra ela depois da recarga. Junto: três pontos que engoliam a confirmação "Foto salva" ao quebrar em elementos que já não estavam na tela |
| 25/09/2026 | `106e3ea` | **Todo link do cliente nascia mostrando "Link expirado".** Uma linha: `setTimeout` tem teto de ~24,8 dias e, acima disso, dispara **na hora** — o link vale 30 dias, então a tela do cliente era desenhada e apagada milissegundos depois, com o dado íntegro no servidor. Valia para **todos** os links desde 24/08/2026, e gerar outro nunca resolveria (o novo também nasce com 30 dias). Junto: o modal passa a conferir no servidor se o link funciona, mostra o endereço inteiro com o token destacado, avisa enquanto um endereço novo não foi enviado, e oferece "Emitir outro endereço" a qualquer momento |
| 24/09/2026 | `df4f313` | **Abrir o link do cliente derrubava o login do gestor.** Era a causa única do loop "entre de novo" a cada recarregamento — e, antes disso, a causa muda do "link sempre expirado": o link público criava uma identidade anônima que **substituía a sessão real** (o Firebase só admite um usuário por navegador), então publicar o link falhava em silêncio. Agora o link reaproveita a sessão que já existe |
| 24/09/2026 | `ced6f69` | **Fotos da OS em documentos próprios — destrava a sincronização.** Uma única OS com fotos chegava a 1082 KB e o servidor **recusava o registro inteiro** (teto de 1 MiB por documento): trabalhar com 2, 20 ou 100 OS ao mesmo tempo era impossível. Agora cada foto tem seu próprio documento e o registro das ordens ficou em poucos KB. Verificado com 12 OS (48 fotos) subindo sem uma recusa |
| 24/09/2026 | `2f17d2e` | **PDF da OS concluída para enviar ao cliente.** Relatório com fotos de equipamento, checklist executado, registro fotográfico e aceite assinado — o mesmo padrão que já existia no VRF |
| 24/09/2026 | `fb93a47` | **Sessão do Firebase ausente deixava o app numa casca vazia.** Com sessão local presente e sessão do Firebase perdida, o app abria sem nuvem e sem avisar — nada subia e nada era dito. Agora pede login de novo, preservando todos os dados do aparelho |
| 24/09/2026 | `39f490d` | **App avisa na tela quando está sem nuvem.** Era a causa visível do "link sempre expirado": sem conexão, publicar o link não acontecia e o cliente recebia um link que nunca existiu |
| 24/09/2026 | `526e7a3` | **App diz o que falta para concluir a OS**, em vez de só deixar o botão apagado, e **link morto vira link novo** ao ser reaberto |
| 24/09/2026 | `c0f295f` | **Layout cortado no celular** (o "revogar" e a aba de configuração eram engolidos), **link do cliente que nascia morto** e trava de foto |
| 23/09/2026 | `ed1ec31` | **Troca de técnico em OS e manutenção.** Antes, atribuído era definitivo: o técnico da OS era texto fixo e na manutenção nada era editável — um problema sério quando alguém sai da empresa e a manutenção recorrente segue no nome dele. Junto: aviso de nova versão do app disponível, e mensagem clara quando a aba está desatualizada |
| 22/09/2026 | `470751e` | **Recuperação de senha por e-mail.** Antes não existia caminho nenhum: quem esquecia a senha não entrava mais, e só o dono resolvia à mão no Console do Firebase |
| 22/09/2026 | `c56d38b` | **Bloco 2.** Técnico removido perde o acesso na hora (antes seguia lendo até fechar a aba) e o **convite de acesso passa a valer 7 dias** — antes o código valia para sempre até ser usado ou revogado. Regras do Firestore publicadas com 19/19 casos verificados no Emulator |
| 22/09/2026 | `da03885` | **Bloco 1 inteiro.** Valor monetário brasileiro lido certo ("1.234,56" virava R$ 1,23); foto acima de 25 MB recusada antes de travar o aparelho; toque duplo na foto não duplica mais; renomear técnico passa a arrastar as **tarefas** dele (ele deixava de vê-las); nota de adiantamento pode ser excluída, com registro de quem excluiu; **filtro de período** no Financeiro |
| 22/09/2026 | `121cbab` | **Bloco 0, item 1 — Etapa B.** Fotos de obra passam a ter **um documento por andar** na nuvem, removendo o teto de 1 MiB que estava a 90%; cada foto nova trafega só o andar que mudou, em vez do acervo inteiro. Corrigido junto um vazamento pré-existente: os documentos de link público do cliente eram baixados e **gravados no aparelho de todos os usuários** em todo boot, para sempre |
| 22/09/2026 | `9d49fba` | **Bloco 0, itens 3 e 2 + item 1 Etapa A.** Memória cheia deixa de perder o trabalho do técnico (avisa e não engole o erro); falha de sincronização vira faixa visível na tela, com aviso preventivo a 76% do teto e tabela de espaço em Configurações; fotos passam de 1024px/0,6 para 800px/0,5 (−51%) e assinatura de PNG para JPEG (−82%); imagem com transparência deixa de virar preta. Criados `MAPPO-O-QUE-TEM.md` e `MAPPO-O-QUE-FALTA.md` como fonte de verdade do estado do produto |
| 14/09/2026 | `c67125f` | Ícones do PWA refeitos com medição de dimensão e espessura: ocupação 72%, engrossamento com teto 8, maskable 62%, ícone de app sem tagline, favicon só com o glifo, 5 telas de abertura de iPhone |
| 02/09/2026 | `91af720` | Minitutorial contextual por tela (mini-tour na 1ª visita a cada tela) + correção do menu flutuante no modo Desktop |
| 01/09/2026 | `85d9204` | Conteúdo do minitutorial aprofundado (explica função e uso, não só o nome) |
| 01/09/2026 | `8fd8406` | jsPDF 2.5.1 → 4.2.1 (fecha CVEs de DoS e injeção) |
| 01/09/2026 | `920bdd5` | SRI nos CDNs, validação de ramo na regra do servidor, SEO básico |
| 01/09/2026 | `03de230` | Técnico removido volta a poder ser convidado (ponteiro travado) |
| 01/09/2026 | `8b9d7c1` | wsId ganha sufixo aleatório (fecha sequestro de slug) |
