# MAPPO — O que falta

> **Leia este arquivo antes de começar qualquer trabalho no MAPPO.**
> Ele e o [MAPPO-O-QUE-TEM.md](MAPPO-O-QUE-TEM.md) são a fonte de verdade sobre o estado do
> produto. Não vasculhe o código para descobrir o que falta — comece por aqui.
>
> **Regra de atualização:** ao publicar um item, **apague-o daqui** e registre no
> `MAPPO-O-QUE-TEM.md` (seção do recurso + linha no histórico). Um item só existe em um
> dos dois arquivos, nunca nos dois.

**Atualizado em:** 25/09/2026 · publicado até `3eb9663`

**Próximo combinado:** testes anti-regressão no repositório (item 1 no fim deste arquivo).
Depois: fotos de obra e de tarefas no IndexedDB, e GPS/localização por pessoa (Bloco 2).

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

| Item | O que seria preciso |
|---|---|
| Técnico escreve avatar/localização de outro | Um documento por pessoa (`live/{uid}`) + regra `uid == request.auth.uid` |
| Técnico vê obras não atribuídas | Dividir `mappo_vrf_obras` por obra + regra por atribuição |
| OS alterável por qualquer membro | Dividir `mappo_os` por OS + campo de dono fora do blob |

A Etapa B (fotos por andar) provou que essa divisão funciona neste app — o caminho existe e
é trabalho conhecido, não pesquisa. **Prioridade entre eles: o GPS/localização**, porque é o
único onde falsificar tem consequência real (é a prova de onde o técnico esteve).
**Próximo combinado com o proprietário.**

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
- Sem testes automatizados no projeto — cada mudança é validada com Playwright pontual

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

## Combinado em 24/09/2026 — os dois próximos, nesta ordem

### 1. Testes anti-regressão dentro do repositório 🔴

**Por que existe este item.** Em 24/09/2026 três defeitos apareceram juntos em coisas que já
funcionavam: layout cortado no celular, link do cliente sempre expirado e OS que o técnico não
conseguia concluir. Nenhum era novo em si — eram efeitos colaterais de mudanças anteriores que
ninguém teve como perceber, porque **não havia como perceber**. A causa raiz não é um bug: é a
ausência de uma rede que pegue o bug antes do usuário.

**O que fazer:**

- Pasta `testes/` no repositório, com as suítes que hoje vivem numa pasta temporária do sistema
  — que já foi apagada **três vezes**, obrigando a reinstalar o Playwright e reescrever testes
  do zero. Enquanto os testes não estiverem versionados, eles não existem.
- **Um comando só** que roda todas (`npm test` ou equivalente), com a contagem de OKs no fim.
- Regra em `CLAUDE.md`: **todo defeito relatado vira teste antes de virar correção.** O teste
  falha primeiro (provando que reproduz), depois passa. Sem isso, "corrigido" é opinião.
- O que não der para testar em navegador automatizado (Google Agenda, notificação real,
  WhatsApp) vira uma lista curta de verificação manual, entregue ao proprietário.

**Estado em 25/09/2026:** **26 suítes** escritas e passando, mais 5 diagnósticos — todas fora do
repositório, numa pasta temporária do sistema. Só hoje foram escritas 7 suítes novas, e foram
elas que provaram cada correção do dia (link expirado, foto sumindo, foto presa no aparelho).
Migrar é o trabalho, e o risco de perdê-las cresceu junto com o valor delas.

### 2. Fotos no IndexedDB — ✅ feito para as ordens de serviço, falta obra e tarefas

**Feito em 25/09/2026** (`d79ad5c` + `d96a174`): as fotos das OS saíram do `localStorage` e
vivem no IndexedDB, carregadas só quando aparecem na tela. Uma OS com 4 fotos ocupava 960 KB
no aparelho e passou a ocupar 0 KB.

**O que falta:** aplicar o mesmo às **fotos de obra (VRF)** e às **fotos de tarefas**, que
ainda ficam no `localStorage`. A nuvem delas já foi resolvida em `8a21647` (um documento por
foto), então o que resta é só o lado do aparelho — mesmo mecanismo já construído e testado,
só apontado para as outras duas coleções.
---

## Combinado em 25/09/2026 — fazer DEPOIS do GPS (Bloco 2)

> Cinco pontos levantados pelo proprietário. Cada um já foi **verificado no código** e tem a
> decisão técnica fechada — não são ideias soltas, é trabalho pronto para começar.
> **Ordem acordada:** só depois dos testes anti-regressão e do Bloco 2 (GPS) estarem prontos.

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
