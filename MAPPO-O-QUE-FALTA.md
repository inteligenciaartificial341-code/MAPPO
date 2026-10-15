# MAPPO — O que falta

> **Leia este arquivo antes de começar qualquer trabalho no MAPPO.**
> Ele e o [MAPPO-O-QUE-TEM.md](MAPPO-O-QUE-TEM.md) são a fonte de verdade sobre o estado do
> produto. Não vasculhe o código para descobrir o que falta — comece por aqui.
>
> **Regra de atualização:** ao publicar um item, **apague-o daqui** e registre no
> `MAPPO-O-QUE-TEM.md` (seção do recurso + linha no histórico). Um item só existe em um
> dos dois arquivos, nunca nos dois.

**Atualizado em:** 15/10/2026 · publicado até `5a38dc7`

**Próximo combinado:** os três pontos de 25/09/2026, na ordem acordada em 10/10/2026 —
**link do mapa na OS**, **editar cliente** e, por último, **o histórico do mapa por**
**prestador**. O Bloco 2 fechou em `d23f1d7`.

---

## Bloco 2 — segurança residual

**Resolvidos:** técnico removido continua lendo (`797f404`) · convite ao portador, agora com
prazo de 7 dias (`c56d38b`, regras publicadas em produção).

**Descartado:** "o último gestor pode se rebaixar" — verificado em 22/09/2026, `role:'gestor'`
só é gravado na criação da empresa e **não existe tela para trocar papel**. Só aconteceria
manipulando o SDK direto, e as regras já impedem um gestor de apagar o próprio membership.

**Os três que sobram são arquitetura, não patch.** Todos esbarram na mesma coisa: os dados do
workspace são um blob JSON (`{json:"..."}`) e a regra do Firestore **não lê dentro de uma
string JSON** — ela só sabe dizer "é membro?", nunca "esse técnico pode mexer nisso?".

| Item | O que seria preciso | Estado |
|---|---|---|
| Avatar por pessoa | O mesmo padrão aplicado a `mappo_avatares` | Pendente (ver "Fora do escopo") |
| Técnico vê obras não atribuídas | Dividir `mappo_vrf_obras` por obra + regra por atribuição | Pendente |
| OS por dono | Dividir `mappo_os` por OS + campo de dono fora do blob | Pendente |

A Etapa B (fotos por andar) provou que essa divisão funciona neste app — o caminho existe e
é trabalho conhecido, não pesquisa. **A localização era a prioridade** (o único onde falsificar
tem consequência real: é a prova de onde o técnico esteve) e **está encerrada** — entregue em
`bd4bfd6`, confirmada em campo em 01/10/2026, e fechada em `d23f1d7`, quando o caminho antigo
saiu de circulação e passou a ser negado na regra. Ver `MAPPO-O-QUE-TEM.md`. O que ficou nas
seções abaixo é resíduo dela, não o item; o avatar, que era a outra metade da mesma linha,
virou item separado porque a consequência dele é muito menor.
**Os dois itens de obra/OS seguem sendo próximo combinado com o proprietário.**

### Mostrar a versão do app em Configurações → Sincronização 🟡

**Combinado com o proprietário em 01/10/2026** ("uma boa"), levantado pela revisão da entrega
do aviso de versão nova.

Hoje não há como saber, **olhando o app**, qual código um aparelho está rodando. Isso torna um
chute duas coisas que deveriam ser conclusivas: a caixa de verificação manual que manda
cronometrar quanto tempo o aviso leva para aparecer no iPhone, e qualquer conversa de suporte
do tipo "aqui não aparece".

Mostrar o `CACHE_VERSION` nessa tela resolve as duas, e torna o `diag-swcache` comparável com
o que a pessoa lê no aparelho.

**Por que não saiu junto:** o caminho limpo (`postMessage` ao Service Worker) exige mexer no
`sw.js` além da linha da versão, e a verificação da entrega exigia que o `git diff sw.js`
mostrasse só isso. O caminho alternativo — a tela buscar `./sw.js` e extrair a linha — são umas
8 linhas, mas pede teste próprio e novo selo de versão. É entrega pequena e separada.

### Fora do escopo do GPS por pessoa, de propósito

Três pendências que o trabalho de posição por pessoa encostou e **não** resolveu:

- **`mappo_avatares` continua um blob por nome.** Mesma origem, consequência muito menor: é um
  dos 6 SVGs da raiz, não é prova
  de nada. O caminho já está aberto — `live/{uid}` mostrou que funciona.
- **`mappo_localizacao_historico` continua uma lista só-aditiva compartilhada.** É `APPEND_LISTS`
  e o merge junta tudo: dividir por pessoa é a mesma mudança de estratégia de sincronização
  descrita no item A de "Combinado em 25/09/2026". Fica junto com aquele trabalho, não com este.
- **Documento órfão de técnico removido.** Removido o membership, a pessoa não consegue mais
  gravar (`isMember` falha), mas o `live/{uid}` dela ficaria na nuvem. Não vira marcador (o uid
  não casa com nenhum `t.uid`, e o app ignora sem apagar), então é lixo silencioso, não
  vazamento. Apagar exigiria dar a alguém permissão de escrita no documento de outra pessoa — e a
  regra proíbe até o próprio dono apagar (`allow delete: if false`). Se um dia valer a pena, a
  limpeza é pelo Console/Admin SDK, não pelo app.

### Teto de TAMANHO do documento de posição — decisão do proprietário

A regra de `live/{uid}` valida a **forma** do documento (`hasOnly(['json','updatedAt','by'])` +
`json is string`), mas **não o tamanho**: um membro pode estacionar centenas de KB no próprio uid,
e todo colega baixa isso a cada boot (`_pullPosicoes` lê a coleção inteira). Um teto de bytes na
regra resolveria, e **não foi acrescentado** — apertar demais faria o GPS legítimo falhar em
campo, e essa escolha é do proprietário, não minha. Está fixado como `[GAP ACEITO]` no grupo 11
de `testes/teste-regras.js` para não mudar sozinho.

## Bloco 3 — coisas que enganam o usuário

- **E-mail e SMS de manutenção aparecem ligáveis nas Configurações e não enviam nada.**
  Precisa sair da tela ou virar "em breve" — hoje é promessa falsa.
- `orientation: portrait` no manifesto trava a rotação do app instalado
- Tutorial sem suporte a teclado (Esc/setas) nem semântica de acessibilidade

---

## Decisões tomadas que fecham caminhos

| Decisão | Data | Consequência |
|---|---|---|
| MAPPO é **ferramenta interna**, não produto para vender | 16/09/2026 | Sem cadastro self-service, sem cobrança, sem backend de assinatura |
| **Sem plano pago (Blaze)** | 22/09/2026 | Firebase Storage está fora. Toda solução tem que caber no plano gratuito |
| Manter Leaflet + OpenStreetMap no mapa | 08/09/2026 | Google Maps exige chave, cartão e tem custo por carregamento; não traz ganho para o uso atual |

**O que o "sem Blaze" impede hoje:** notificação automática por WhatsApp/SMS/e-mail, pagamento
online, qualquer coisa que exija servidor. Chave de API em app sem backend fica exposta no HTML.

---

## Limitações aceitas conscientemente

- Sem domínio próprio (endereço do GitHub Pages)
- Aprovação de empresa nova é manual, no console do Firebase
- As 10 fases do VRF são fixas (só as etapas dentro delas são editáveis)

---

## Ideias guardadas para o futuro

12 melhorias inspiradas em ServiceTitan, Jobber, Housecall Pro e FieldEdge (orçamento com
aprovação do cliente, gestão de ativos/equipamentos, pagamento online, contratos recorrentes,
despacho inteligente, estoque, roteirização, score de produtividade e outras) estão em
[plano-evolucao-mappo.md](plano-evolucao-mappo.md), **com o parecer técnico item a item** —
incluindo quais são impossíveis sem backend e quais têm custo recorrente.

A mais barata de todas, se um dia quiser um ganho rápido: **pedido automático de avaliação no
Google** ao concluir a OS — é um link configurável e um botão de WhatsApp, padrão que o app já tem.

---

## Combinado em 25/09/2026 — a fila de agora

> Três pontos ainda abertos dos cinco levantados pelo proprietário (D e E foram entregues).
> Cada um já foi **verificado no código** e tem a decisão técnica fechada — não são ideias
> soltas, é trabalho pronto para começar.
>
> **A espera acabou:** vinham depois do Bloco 2 (GPS), que fechou em `d23f1d7`, e depois dos
> testes anti-regressão, entregues em 25/09/2026. Os dois saíram.
>
> **Ordem acordada com o proprietário em 10/10/2026: B → C → A.** **B e C saíram** (11 e
> 12/10/2026) — ver `MAPPO-O-QUE-TEM.md`. **Resta o A.**
> O motivo da ordem não ser a das letras: **hoje só o proprietário usa o app** (confirmado por
> ele em 08/10/2026). O que justifica o A é "pode ter empresa com 200 prestadores — 40
> check-ins cobrem menos de dois dias"; com uma pessoa, 40 eventos são semanas. O A é a
> mudança mais cara e arriscada das três para resolver uma dor que ainda não existe.
> das letras, e o motivo é que **hoje só o proprietário usa o app** (confirmado por ele em
> 08/10/2026). O que justifica o A é "pode ter empresa com 200 prestadores — 40 check-ins
> cobrem menos de dois dias"; com uma pessoa, 40 eventos são semanas. O A é a mudança mais
> cara e mais arriscada das três (troca a estratégia de sincronização de uma chave, mexe em
> regra, pede caso novo na suíte de regras) para resolver uma dor que ainda não existe. O B e
> o C resolvem atrito de hoje.

### A. Mapa do gestor: histórico por prestador, não uma lista corrida 🟠

**O problema, nas palavras dele:** "pode ter empresa com 2 prestadores, pode ter com 200. Ter o
check-in de todos os 20, todos os dias, vai ser muito check-in, e com o tempo vai ficar muito
grande essa lista."

**Verificado:** `renderHistoricoLocalizacao()` monta uma lista plana ordenada por data e corta
em `.slice(0,40)`. Com 20 técnicos, os 40 mais recentes cobrem menos de dois dias — o histórico
de qualquer pessoa específica fica inalcançável.

**O que fazer:**
- Agrupar por `prestador`: uma linha por pessoa, com a contagem de eventos e a data do último.
- Clicar na pessoa abre os eventos dela (mesmo padrão de sanfona já usado em outras telas).
- Botão de excluir o histórico **de uma pessoa** e/ou **anterior a uma data**.

**A pegadinha, e é ela que define o trabalho:** `mappo_localizacao_historico` está em
`APPEND_LISTS` — uma lista só-aditiva, onde o merge **junta** nuvem e local e nunca remove.
Apagar ali é ilusão: **volta no merge seguinte**. Já está documentado em [MAPPO-O-QUE-TEM.md](MAPPO-O-QUE-TEM.md), em "Proteções contra falha silenciosa".

Então **excluir não é um botão, é uma mudança de estratégia de sincronização** para essa chave.
Dois caminhos, ambos já provados neste app:
1. **Dividir em documentos próprios** (por pessoa e por mês), como foi feito com as fotos de
   obra em `8a21647` — aí apagar é apagar o documento, e resolve de vez o crescimento infinito.
2. **Marca de exclusão** (registrar "apagado até tal data" e o merge respeitar) — menor, mas
   deixa a lista crescendo para sempre.

**Recomendação: o caminho 1.** Resolve os dois problemas (a lista gigante e o crescimento sem
fim) com um mecanismo que já existe e já tem teste.

## O que o proprietário pediu em 12/10/2026 e ainda não saiu 🟠

Ele olhou a tela de Clientes no celular e pediu três coisas. **Saiu uma** — o menu ⋮ com fixar
e excluir (ver `MAPPO-O-QUE-TEM.md`). Faltam duas, mais o que o menu deixou prometido:

### Campos novos do cliente, e o contato clicável
CPF, nome completo, rua e contato — e o **contato virando link que abre o WhatsApp**, como o
botão de salvar contato do celular. Isso **muda a forma do dado** (`clientes` ganha campos),
então tem implicação de sincronização e merece entrega própria, não um apêndice.

### Varredura dos emojis: faltam 139
A regra está no `CLAUDE.md` desde 12/10/2026 e **tem mecanismo** desde 15/10 — mas ela vale para
o que for escrito de novo. Os **139 emojis** que já estavam no `index.html` continuam lá; o
cartão de cliente trocou 4. Medido em 12/10: 45 distintos, e naquele momento 58 ocorrências
tinham substituto direto no sistema de ícones.

### "Selecionar várias" está prometida na tela
A opção aparece no menu ⋮ e diz que vem na próxima atualização. **Exclusão e fixação em lote**
é a coisa de maior risco de dado deste conjunto — merece rodada de revisão só dela, e é por
isso que ficou de fora. Mas agora está prometida ao usuário, então tem prazo moral.

## A porta pequena: nome de cliente nasce sem guarda nenhuma 🟠

**Achado em 12/10/2026 pela revisão de "editar cliente", e é a causa do que ela consertou.**

Editar cliente agora recusa nome repetido, normaliza espaço invisível e NBSP, e **pergunta**
antes de juntar duas grafias. Mas o nome do cliente **não nasce ali** — nasce em `#oCliente`
(Nova OS) e `#mCliente` (Nova manutenção), que são **texto livre, sem guarda nenhuma**, com um
`datalist` montado só a partir de `osList`.

Então o app está secando o chão com a torneira aberta: a cada OS nova o gestor pode digitar
`Acme`, `ACME` ou `Acme ` e criar mais uma variante que a tela de Clientes mostrará como
cartão separado — e aí a edição tem de perguntar sobre uma divisão que não precisava existir.

**O que fazer:** a mesma normalização e o mesmo aviso de grafia parecida nos dois campos de
entrada, e o `datalist` montado da **união** (`clientes` + `osList` + `manutencoes`), para o
nome já cadastrado aparecer como sugestão em vez de ser redigitado à mão.

**Vale para mais campos que cliente:** técnico, obra, tipo de serviço e item de checklist
provavelmente têm o mesmo furo — é entrega própria, e é a primeira área da varredura
sistemática pedida pelo proprietário em 12/10/2026.

## Não verificado, e isto não é o mesmo que seguro 🟡

Registrado em 12/10/2026 para não virar silêncio que parece cobertura:

- **A máquina do proprietário estrangula o `npm test` de forma intermitente, e isso derruba o
  portão de publicação.** Medido três vezes em dias diferentes, sempre em suítes distintas que
  a entrega em curso não tocava: `teste-fototarefa` **8277 s** (16 s sozinha), `teste-duasfotos`
  **5774 s** (18 s), `teste-semnuvem` **1942 s** (36 s) — até 320× mais lento. Nas três vezes a
  rodada completa passou de 8–12 minutos para 140–150. **Cinco hipóteses foram refutadas por
  medição** (partida fria, I/O do servidor de teste, rolagem não assentada, saturação de
  porta, tamanho do arquivo). A causa é desconhecida, e enquanto for, "não publicar com
  `npm test` vermelho" depende de distinguir vermelho de produto de vermelho de máquina —
  o que hoje se faz à mão, rodando a suíte isolada.
- **`page.goto` estourava em ~14% das rodadas da suíte de cliente** (medido: 2 em 14). Depois da
  correção do controle de hit-test deu **0 em 16**. Não se sabe se foi resolvido de lado ou se
  está dormindo.

- **`ITEM_LISTS['mappo_clientes']='nome'`** (`index.html`, perto da linha 1740): o merge da
  nuvem identifica o cliente **pelo nome**, então renomear muda a identidade do registro. A
  revisão leu `_anotarPendentes` e concluiu que o merge respeita o rename (marca `{'*':1}` nos
  dois lados), mas **não mediu** — e `teste-doisaparelhos.js` não toca essa chave. Cobrir exige
  caso com documento remoto simulado.
- **Gravação parcial é um padrão, não um caso.** O defeito de memória cheia achado em editar
  cliente (registro renomeado, histórico no nome antigo) foi corrigido ali. **Onde mais o app
  grava duas ou três chaves em sequência sem saber desfazer?** Não varrido.
- **Cartão estoura com texto sem espaços** (`scrollWidth` 1803 contra 320–390 de tela): medido
  **idêntico na versão publicada**, é anterior. A correção vive em `.os-addr`, classe global
  usada pelo app inteiro, então é entrega própria com medição em outras telas.

## Decisão aberta: cliente que só tem manutenção 🟡

**Pergunta feita ao proprietário em 13/10/2026, ainda sem resposta.**

`renderClientes` monta a lista de `mappo_os` + `mappo_clientes`, e **nunca** de
`mappo_manut`. Então um cliente que tem só manutenção agendada, sem nenhuma OS, **só aparece**
na tela de Clientes se tiver cadastro próprio — e some de lá se o cadastro for excluído,
mesmo com a manutenção continuando agendada.

A entrega do menu ⋮ corrigiu a **mensagem** (ela agora diz a verdade: "o cartão sai da
lista"), e deliberadamente **não** mexeu na lista — incluir manutenções faz aparecer cliente
que hoje não aparece, e isso é decisão de produto, não correção de defeito.

**A pergunta:** cliente com manutenção agendada e nenhuma OS deve aparecer na tela de Clientes?

## Decisões abertas pelo botão "Abrir no mapa" (11/10/2026) 🟡

A entrega do botão está publicada e funcionando. Estas quatro ficaram de fora **de propósito**,
porque são decisão do proprietário, não dedução minha:

- **Link do Apple Maps é ignorado.** `maps.apple.com` e `g.co/kgs/...` caem na busca pelo
  endereço em vez de abrir. Cliente de iPhone manda link do Apple Maps.
- **A lista de TLDs do Google é fechada:** `com`, `com.br`, `co.uk`, `pt`, `es`, `fr`, `de`,
  `it`, `com.ar`, `com.mx`. É o preço de não aceitar `google.lol` (TLD de 3 letras é
  registrável por terceiro). Link de `google.co.in` ou `google.com.co` cai na busca.
  Acrescentar TLD é uma linha.
- **Manutenção tem endereço e não ganhou o botão**, embora `criarOSdeManut` copie esse mesmo
  endereço para uma OS que ganha. Assimetria real.
- **O endereço virou o lugar oficial de colar link, e três telas mostram ele cru:** a página
  pública do cliente (ele vê a URL solta), o cartão do técnico (corta em 30 caracteres, então
  vira `Rua X, 10 — https://maps.a`) e o `location=` do evento do Google Agenda. É
  consequência da decisão "um campo só".

## Receita do mecanismo de atualização (SONNAR IA)

Saiu daqui em 08/10/2026 para **`RECEITA-ATUALIZACAO.md`** — são 345 linhas de material de
consulta, não de pendência, e ocupavam 44% deste arquivo. O mecanismo que ela descreve já está
construído e publicado (`0016f50`, `42d2f8f`, `5a34514`).
