# MAPPO — O que falta

> **Leia este arquivo antes de começar qualquer trabalho no MAPPO.**
> Ele e o [MAPPO-O-QUE-TEM.md](MAPPO-O-QUE-TEM.md) são a fonte de verdade sobre o estado do
> produto. Não vasculhe o código para descobrir o que falta — comece por aqui.
>
> **Regra de atualização:** ao publicar um item, **apague-o daqui** e registre no
> `MAPPO-O-QUE-TEM.md` (seção do recurso + linha no histórico). Um item só existe em um
> dos dois arquivos, nunca nos dois.

**Atualizado em:** 26/09/2026 · publicado até `fc82b6a`

**Próximo combinado:** o GPS/localização por pessoa está **construído e ainda não publicado** —
a regra vai ao Console **antes** do código (ver as seções do Bloco 2). Depois disso, os cinco
pontos de 25/09.

---

## Bloco 0 — falhas silenciosas ✅ fechado

**Bloco 0 fechado.** O item 4 (`mappo_localizacao_historico` cresce para sempre) foi
**reclassificado como baixa prioridade** em 22/09/2026, com motivo:

- Está **abaixo de 1 KB** hoje. Cada registro pesa ~90 bytes, então chegar aos 800 KB do
  alerta exige ~9.000 check-ins — mais de um ano no ritmo atual.
- **Deixou de ser falha silenciosa** quando o item 2 entrou: a faixa acende a 76% do teto,
  dando meses de aviso antes de qualquer problema.
- Pruning simples não resolveria: é lista append-only (`APPEND_LISTS`), então o que fosse
  apagado aqui voltaria no merge seguinte. A correção certa seria dividir por mês, como foi
  feito com as fotos — trabalho que não se justifica com esse horizonte.

Revisitar quando a faixa de alerta avisar, ou se o ritmo de check-ins crescer muito.

**Item 1 (fotos estourando o teto) — resolvido:** Etapa A em `9d49fba`, Etapa B em `121cbab`,
documento antigo apagado manualmente da nuvem pelo proprietário em 22/09/2026. Restam dois
desdobramentos, ambos sem pressa:

- 🧹 **Remover do código a leitura do documento antigo** (`_aplicarLegadoFotos` e a entrada
  `mappo_vrf_fotos` em `SYNC_KEYS`). **Ainda não:** enquanto algum aparelho de técnico
  estiver na versão antiga, ele ainda escreve nesse documento — e essa leitura é a rede que
  impede a foto dele de se perder. Remover só quando **todos** tiverem aberto a versão nova.
- **Etapa C — opcional:** recompactar as fotos já guardadas. A Etapa A só afeta fotos novas;
  as antigas continuam no tamanho velho. ⚠️ Perda de qualidade **irreversível**, e foto de
  serviço é prova. Só com autorização explícita, e não recomendado com obras em garantia.

---

## ~~Bloco 1 — dados errados e retrabalho~~ ✅ publicado em `da03885`

Um resíduo, de baixo valor: **editar** uma nota de adiantamento (hoje só dá para excluir e
registrar de novo). Só vale a pena se acontecer com frequência.


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
| Localização por pessoa | Um documento por pessoa (`live/{uid}`) + regra `uid == request.auth.uid` | **Construído, não publicado** — ver as seções abaixo |
| Avatar por pessoa | O mesmo padrão aplicado a `mappo_avatares` | Pendente (ver "Fora do escopo") |
| Técnico vê obras não atribuídas | Dividir `mappo_vrf_obras` por obra + regra por atribuição | Pendente |
| OS por dono | Dividir `mappo_os` por OS + campo de dono fora do blob | Pendente |

A Etapa B (fotos por andar) provou que essa divisão funciona neste app — o caminho existe e
é trabalho conhecido, não pesquisa. **A localização era a prioridade** (o único onde falsificar
tem consequência real: é a prova de onde o técnico esteve) e foi feita primeiro; o avatar, que
era a outra metade da mesma linha, virou item separado porque a consequência dele é muito menor.
**Os dois itens de obra/OS seguem sendo próximo combinado com o proprietário.**

### Remover a leitura do blob antigo de posição — é o que encerra o item 🟠

**Ainda pendente**, e é a parte que falta para o item de GPS/localização acima poder ser
considerado resolvido de verdade. `data/mappo_locations` e `data/mappo_live` continuam em
O caminho antigo permanece em `SYNC_KEYS` durante a transição e mantém a regra antiga, mais
frouxa que a nova. Enquanto ele for lido, a garantia da regra nova vale para quem já atualizou,
não para todos. **O detalhe técnico está no spec local** (`_bmad-output/implementation-artifacts/`,
fora do repositório de propósito: este repositório é público).

**Por que não sai agora:** um celular ainda na versão antiga só escreve lá, e essa leitura é o
que mantém essa pessoa visível no mapa. Remover só **depois que todos os aparelhos abrirem a
versão nova** — e isso é decisão do proprietário, não dedução minha.

**O que já está de pé:** o risco residual está fixado como caso `[GAP ACEITO]` no grupo 11 de
`testes/teste-regras.js`, esperando por esse dia. E o documento por-uid já **tem precedência** sobre
o caminho antigo, então quem atualizou passa a contar com a garantia nova desde já; quem ainda não
atualizou segue visível, sob a garantia antiga.

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

### Achado de brinde, já corrigido: a migração de fotos da OS podia marcar "migrado" sem migrar

Não é pendência — é uma correção que entra junto com esta entrega, e fica registrada aqui até a
publicação porque nasceu deste trabalho.

`teste-fotoidb.js` passou a falhar ~1 em 10 (medido: **4/43** na árvore com a posição por pessoa,
**0/33** em `d58536b`). Instrumentando o CHECK 15 — o teste, não o app — a linha do tempo mostrou
o que estava acontecendo:

```
os:entrou  marca:null  discoBytes:true  memBytes:true
os:saiu    {"movidas":1,"erros":0}  marca:"1"  discoBytes:TRUE   <-- moveu, marcou, e o disco ficou
```

**A causa, no app e anterior a esta entrega:** `migrarFotosParaOArmazem()` captura os *setters* de
cada campo de foto **antes** do `await guardarFotoNoAparelho(...)`. O `setInterval` de 5 s de
`startNotifChecker` faz `osList=JSON.parse(localStorage.getItem('mappo_os'))` — troca o array
**inteiro** por objetos novos (um pull da nuvem faz o mesmo, via `_aplicarNaMemoria`). Caindo
dentro daquele `await`, os setters passam a mexer num objeto **órfão**: `saveOS()` grava o
`osList` novo, que ainda tem os bytes, e a marca de migrado é escrita por cima disso. A migração
**nunca mais é tentada** e as fotos ficam no `localStorage` para sempre — de volta ao teto de
~5 MB do aparelho, que é exatamente o que essa migração existe para resolver.

O trabalho da posição por pessoa não criou o defeito: aumentou a chance de ele aparecer, porque
mudou o tempo dentro daquela janela. É o mesmo problema que `_reancorarExecOS` já resolvia para a
execução aberta, e a correção é a mesma ideia — `_reancorarConversoesOS()` reaplica as conversões
no `osList` **atual**, por `(id da OS, campo)`, e só quando o campo ainda tem exatamente aqueles
bytes (foto nova nunca é sobreposta por referência antiga).

**Rede:** `teste-fotoidb.js` ganhou o CHECK 17, que **força** a troca do `osList` no meio da
migração em vez de esperar pela corrida. Ele falha em `d58536b` (20/20) e passa aqui, e a suíte
saiu de 4/43 para **0/20**.

**Segundo flake, esse sim pré-existente e provado:** `teste-fototarefa.js` reprovava no CHECK 11
("a foto fantasma nao subiu") **1/15 na árvore atual e 1/15 em `d58536b`** — mesma taxa, mesmo
assert, então não é desta entrega. Causa: `zerar()` limpava a nuvem falsa mas **não cancelava os
envios agendados** por checks anteriores (`fbPush` com debounce de 50 ms), e um deles caía dentro
do CHECK 11 empurrando o estado velho — 2 documentos de foto aparecendo "do nada" numa nuvem que
o check exige vazia. Corrigido no próprio `zerar()` (cancela `_pushTimers`), sem enfraquecer
assert nenhum: **0/20** depois. O mesmo cancelamento entrou no `zerar()` de
`testes/teste-gpspessoa.js`, que tinha a mesma brecha.

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

## Combinado em 24/09/2026 — o que sobrou

> Eram dois. O primeiro — **testes anti-regressão dentro do repositório** — foi entregue em
> 25/09/2026 e está descrito no [MAPPO-O-QUE-TEM.md](MAPPO-O-QUE-TEM.md).

### Fotos no IndexedDB — ✅ concluído em 26/09/2026

**Feito:** ordens de serviço em `d79ad5c` + `d96a174`; obra e tarefa em `fc82b6a`. As fotos
vivem no IndexedDB e são carregadas só quando aparecem na tela.

**Correção de registro:** a versão anterior deste item afirmava que a nuvem das tarefas tinha
sido resolvida em `8a21647`. **Era falso** — `8a21647` cobriu só as obras. As fotos de tarefa
nunca tinham sido separadas, e isso era um defeito **vivo**: medido, uma tarefa com 20 fotos
era recusada inteira pelo servidor (`recusas:1`, `nuvemKB:0`). Corrigido em `fc82b6a`.

**O que restou, e é decisão do proprietário:**

- O ✕ e o `excluirTarefa` deixam **documentos de foto órfãos** na nuvem (até ~1,1 MB por
  tarefa cheia). Não perde nada — acumula. Implementar a exclusão é apagar prova de serviço,
  e por isso não foi feito sem decisão.
- O armazém do aparelho **só cresce**: `idbApagarFoto` existe e nunca é chamado. Há
  visibilidade (contagem e aviso de cota no diagnóstico), não há poda. Quando a cota do
  IndexedDB estourar, tudo cai no formato antigo e os bytes voltam ao `localStorage`.
- `_aplicarLegadoFotos` ainda admite bytes no `localStorage`. É a rede de compatibilidade que
  este arquivo manda não tocar até todos os aparelhos abrirem a versão nova, mas é uma volta
  real ao teto de ~5 MB.

## Achado em 26/09/2026 — a rede de regras prova o arquivo, não o que está no ar 🟠

A suíte de regras (`9d99f3c`) carrega o `firestore.rules` **do repositório** e prova que ele
nega o que deve negar. Mas **nada liga esse arquivo às regras que o Firestore está aplicando**
em produção: não existe passo de publicação em lugar nenhum — nem script, nem CI, nem
documento. Publicar sempre foi ato manual do proprietário.

Dois jeitos de o verde mentir:

- Editar as regras, a suíte fica verde, commitar — e **esquecer de publicar**. Produção segue
  com as regras antigas.
- Alguém colar uma correção direto no Console e o arquivo nunca ser atualizado. Produção
  diverge do que está testado.

Nos dois casos `npm test` passa e o CI fica verde enquanto produção aplica outra coisa.

**A saída mais barata:** um `npm run regras:publicar` que só publica **depois** da suíte passar,
mais uma linha no `VERIFICACAO-MANUAL.md` para conferir no Console de tempos em tempos. Não
elimina erro humano, mas tira o "esqueci de publicar" do caminho.

Levantado pela revisão adversarial de 26/09/2026. É o mesmo vício de "regra sem mecanismo",
um nível acima — e por isso entra aqui em vez de ficar só no `deferred-work.md`.

---

## Combinado em 25/09/2026 — fazer DEPOIS do GPS (Bloco 2)

> Cinco pontos levantados pelo proprietário. Cada um já foi **verificado no código** e tem a
> decisão técnica fechada — não são ideias soltas, é trabalho pronto para começar.
> **Ordem acordada:** só depois do Bloco 2 (GPS) estar pronto. Os testes anti-regressão, que
> também vinham antes destes cinco, já foram entregues em 25/09/2026.

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
Apagar ali é ilusão: **volta no merge seguinte**. Já está documentado no Bloco 0, item 4.

Então **excluir não é um botão, é uma mudança de estratégia de sincronização** para essa chave.
Dois caminhos, ambos já provados neste app:
1. **Dividir em documentos próprios** (por pessoa e por mês), como foi feito com as fotos de
   obra em `8a21647` — aí apagar é apagar o documento, e resolve de vez o crescimento infinito.
2. **Marca de exclusão** (registrar "apagado até tal data" e o merge respeitar) — menor, mas
   deixa a lista crescendo para sempre.

**Recomendação: o caminho 1.** Resolve os dois problemas (a lista gigante e o crescimento sem
fim) com um mecanismo que já existe e já tem teste.

### B. Link do mapa dentro da OS 🟢

**O problema:** o técnico lê o endereço escrito e precisa abrir o mapa e digitar à mão. O gestor
já recebe do cliente, pelo WhatsApp, um link pronto do Google Maps.

**Verificado:** o endereço é texto escapado em 5 lugares (`os-addr`, detalhe da OS, tela de
execução, PDF, payload do link público). Não há link em nenhum.

**Decisão — um campo só, sem cadastro novo.** Nada de campo separado "link do mapa": seria mais
um campo para preencher e mais um para esquecer. O app passa a **reconhecer sozinho**:
- Se o texto do endereço **contém uma URL** de mapa (`maps.google`, `goo.gl/maps`,
  `maps.app.goo.gl`, `waze.com`) → botão **"Abrir no mapa"** usando essa URL.
- Se **não contém** → o mesmo botão abre a busca pelo endereço escrito
  (`https://www.google.com/maps/search/?api=1&query=<endereço>`).

Assim funciona nos dois casos e nada muda no jeito de cadastrar.

**Cuidados:** a URL vem de texto digitado — aceitar só `http`/`https` (nunca `javascript:`),
escapar no atributo e abrir com `rel="noopener"`. Mostrar o botão na tela do técnico (onde ele
precisa) e no detalhe do gestor.

### C. Editar cliente 🔴

**O problema, nas palavras dele:** "posso ter salvo um nome errado e não consigo mais editar.
Se for um cliente que eu já fiz mais de cinco visitas, é perda ter que apagar e refazer."

**Verificado:** existe `openModalCliente()` e `criarCliente()`. **Não existe nenhuma função de
edição** — o cadastro é só de ida.

**A pegadinha técnica, e ela é séria:** o **nome do cliente é a chave de ligação**. O histórico
é montado com `osList.filter(o => o.cliente === nome)`; manutenções e o link do cliente também
guardam o nome. Renomear sem arrastar o nome junto **desliga o cliente do próprio histórico** —
exatamente o defeito que já corrigimos uma vez com técnicos em `da03885` (renomear técnico
fazia ele perder as tarefas dele).

**O que fazer:**
- Tela de edição (nome, endereço, contato), reaproveitando o modal que já existe.
- Ao renomear, **arrastar o nome** em `mappo_os` e `mappo_manut`, no mesmo padrão de `da03885`.
- Impedir renomear para um nome que já existe (mesmo guard de `salvarTecnico`/`vrfSalvarObra`).
- **Teste obrigatório:** cliente com 5 OS é renomeado → as 5 continuam ligadas a ele.

### D. Instalar a atualização de dentro do app 🟡

**Pendente de material do proprietário.** Ele desenvolveu um fluxo em outro app e vai mandar o
prompt e as fotos. A ideia: em vez de sair, apagar o atalho e reinstalar, aparece um aviso no
rodapé — "nova versão disponível" — e um toque atualiza.

**Já existe metade disso:** o app detecta e avisa que há versão nova (`ed1ec31`), mas o aviso
manda **recarregar à mão**. Falta o botão que aplica a atualização (trocar o service worker e
recarregar sozinho).

> **LEMBRAR DE PEDIR:** quando esta parte começar, pedir ao proprietário o prompt e as fotos do
> fluxo que ele montou no outro app. Ele pediu explicitamente para ser lembrado.

### E. Avaliações do app — ✅ respondido, sem trabalho pendente

**Pergunta:** "a avaliação do aplicativo lá embaixo vai para onde? Como vejo as avaliações?"

**Resposta, verificada no código e nas regras:** a avaliação é gravada na coleção `feedback`,
na raiz do banco, com `workspaceId`, `workspaceNome`, nome de quem enviou, nota, texto e data.

A regra é **write-only de propósito**: `allow read/update/delete: if false`. Ninguém dentro do
app lê — nem o gestor, nem o autor. Isso foi decidido assim (Story 14) para que a avaliação seja
franca e não vire mais uma tela de gestão.

**Como o dono do projeto lê:** Firebase Console → projeto `mappo-13a30` → Firestore Database →
coleção `feedback`. Cada documento é uma avaliação, ordenável por `criadoEm`.

**Não há trabalho pendente aqui** — só faltava a informação. Se um dia quiser as avaliações
dentro do app, aí sim vira trabalho (exigiria um conceito de "dono do produto" que o app não
tem, já que o gestor de uma empresa não pode ver a avaliação de outra).
