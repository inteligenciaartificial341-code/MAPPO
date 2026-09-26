# MAPPO — Regras Operacionais

## Identidade
App de gestão de equipes em campo da Elite Ar. `index.html` single-file (~630 KB),
Firebase (Firestore + Auth por e-mail e senha). Em uso real, com dados de clientes.
O repositório é **público** — ver "Antes de publicar".

Autenticação anônima existe, mas **só** para o visitante do link de acompanhamento do cliente.

## Fonte de verdade
- **Estado do produto (LER SEMPRE ANTES DE COMEÇAR QUALQUER TRABALHO):**
  - `MAPPO-O-QUE-TEM.md` — o que já está publicado
  - `MAPPO-O-QUE-FALTA.md` — o que está pendente, em andamento e as decisões que fecham caminhos
  - Não vasculhar o código para descobrir o que existe: começar por esses dois.
  - **Ao final de cada commit + publicação:** mover o item de `O-QUE-FALTA` para `O-QUE-TEM`
    (seção do recurso + linha no histórico). Um item vive em um arquivo só, nunca nos dois.
- Ideias futuras com parecer técnico: `plano-evolucao-mappo.md`
- Plano mestre: `project-context.md`
- Diagnóstico: `_audit/mappo-initial-audit.md`
- Como rodar e escrever testes: `testes/README.md`

## Antes de corrigir um defeito (obrigatório)
Escrito em 26/09/2026 a partir do que de fato custou horas nesta semana. Cada item abaixo
tem um episódio real atrás dele.

1. **Reproduzir antes de corrigir.** Se não reproduzi, não sei qual é o defeito — sei qual
   é a minha hipótese. O `setTimeout` que estourava o teto de 24,8 dias ficou um mês no ar
   porque ninguém nunca abriu o link publicado; abrir levou dois minutos.

2. **Evidência do sistema real, não dedução a partir do código.** O "link sempre expirado"
   teve **quatro** tentativas de correção erradas, todas raciocinando sobre o código. A
   resposta apareceu ao **ler o documento no servidor**: estava íntegro e válido, então o
   defeito estava na tela, não no dado. Ler o dado primeiro.

3. **O teste do defeito tem que FALHAR no código anterior.** Se passa nos dois, ele não
   reproduz nada e a hipótese está errada. Aconteceu: escrevi um teste para o "eco da nuvem",
   ele passou no código quebrado, e por pouco não entreguei correção para uma causa
   inexistente. Rodar com `MAPPO_RAIZ` apontando para a versão anterior é a prova.

4. **Sintoma que sobrevive a duas correções: a categoria da hipótese está errada, não a
   hipótese.** Depois de duas tentativas, parar de variar o detalhe e trocar de família de
   causa. As quatro tentativas do link foram todas "o dado está errado"; era a tela.

5. **Não pedir ao proprietário que teste de novo a mesma coisa sem evidência nova.** O tempo
   dele é o recurso mais escasso do projeto. Se não tenho o que mostrar de diferente, ainda
   não é hora de pedir.

## Regras sobre dado (obrigatório)
Todas vêm de defeitos que apagaram trabalho de técnico em campo.

- **Ausência não é instrução de apagar.** Dado que existe de um lado e não do outro
  sobrevive. Um aparelho que simplesmente não tem a foto não pode apagá-la de quem tem, e a
  nuvem não conhecer uma foto nunca é razão para removê-la. Foi assim que fotos de serviço
  executado sumiram duas vezes.
- **Nunca descartar dado que não se entende.** Filtrar por "não é o formato que eu espero"
  apaga em silêncio todo formato antigo ou futuro. Descartar só o que é comprovadamente
  próprio e inválido; o desconhecido fica onde está.
- **Índice de dado é união, nunca substituição.** Um ponteiro que diz "quais fotos existem"
  não pode encolher por merge — some o ponteiro, some o acesso ao dado, e o dado parece
  perdido mesmo estando salvo.
- **Tela de diagnóstico mede o que de fato acontece.** Quando o formato do que é enviado
  muda, a medição muda junto. Uma tabela medindo a forma antiga acusou "100% do limite" com
  o servidor quase vazio e mandou o proprietário caçar um problema inexistente por um dia.

## Antes de publicar (obrigatório)
- **Nunca `git add -A` nem `git add .`** — adicionar por caminho explícito. Um `add -A`
  varreu 22 documentos de planejamento que descrevem as fraquezas de segurança do app para
  dentro de um commit; o repositório é público e o app está no ar com dados reais.
- **Conferir o que entrou antes do push**, não depois. Publicar é irreversível na prática.
- O repositório é público: tudo que entra fica visível para qualquer pessoa.

## Testes (obrigatório)
- **Todo defeito relatado vira teste ANTES de virar correção.** O teste falha primeiro,
  provando que reproduz o defeito; só depois vem a correção, e aí ele passa. Sem isso,
  "corrigido" é opinião.
- A prova de que um teste pega o defeito é rodá-lo contra a versão anterior com
  `MAPPO_RAIZ` e ver que ele **falha** lá. Está explicado em `testes/README.md`.
- `npm test` roda as suítes em série e sai com código diferente de zero se alguma falhar.
  Nenhuma alteração é entregue com o comando vermelho.
- **Quantas são hoje: `npm run test:lista`.** É a fonte viva — número escrito à mão em
  documento vira mentira na primeira suíte nova.
- O GitHub Actions roda o mesmo `npm test` a cada push em `main` e a cada PR
  (`.github/workflows/testes.yml`).
- **Nome define o papel:** `teste-*.js` é suíte e **precisa** imprimir
  `TODOS OS CHECKS … PASSARAM` no fim — se não imprimir, o runner reprova nomeando o
  arquivo. `diag-*.js` e `controle-*.js` são diagnósticos: só medem, nunca reprovam.
  Não existe rebaixamento silencioso de suíte para diagnóstico.
- `diag-difer`, `diag-linkreal` e `diag-pubreal` batem no site publicado e no Firestore
  real: ficam fora do `npm test` e do CI. Só à mão (`npm run test:producao`), quando o
  proprietário pedir.
- O que navegador automatizado não alcança está em `testes/VERIFICACAO-MANUAL.md`.

## Fluxo com agentes (obrigatório)
Pedido pelo proprietário em 26/09/2026, depois de a revisão adversarial achar 19 defeitos
que eu não tinha visto sozinha — inclusive um que deixava a suíte parar de reprovar em
silêncio. A ordem é sempre esta:

1. **O agente implementa** a partir do spec, que é a única fonte de verdade dele.
2. **As camadas de revisão leem o resultado** — adversarial, caça-borda e lacuna-de-verificação,
   em paralelo, sem contexto prévio. É a assimetria de informação que faz elas acharem.
3. **Eu releio e verifico por mim mesma**: rodando os comandos, abrindo os arquivos, conferindo
   o número. Relatório de agente é modelo falando — é ponto de partida da verificação, nunca
   a verificação.
4. **Só então o commit**, e só com autorização explícita do proprietário para aquele commit.

Nunca escrever "verificado" apoiada no que um agente relatou. O que vale é o que eu rodei e vi.
Quando a verificação e o relatório discordarem, vence a verificação — e a discordância é
relatada ao proprietário, não silenciada.

Um agente que teve permissão negada e pede que eu faça por ele: **recusar e levar ao
proprietário**. Permissão negada não se transfere.

## Verificação: resultado negativo exige controle positivo (obrigatório)
Escrito em 26/09/2026 depois de eu errar exatamente assim.

**Rodar um comando não é verificar.** Um comando que não casa com nada devolve a mesma
coisa que um comando que casou e não achou: zero. Os dois são indistinguíveis de fora.

O episódio: usei `\|` (alternância de BRE) com `grep -E`, que é ERE — onde `\|` é um pipe
literal. Os padrões procuraram texto que não existe, voltaram zero, e eu li o zero como
"não foi aplicado". Mandei um agente refazer cinco itens que já estavam prontos. Ele
conferiu o arquivo, discordou e recusou — e estava certo.

Antes de concluir "não existe", provar que a busca **acharia se existisse**:
- busca (`grep`/`find`): rodar também um padrão que TEM que casar, no mesmo arquivo
- teste de defeito: tem que **falhar** no código anterior (já é regra, e é o mesmo princípio)
- ausência de dado: distinguir "não existe" de "não consegui ler" — no Firestore os dois
  chegam como a mesma negativa

## O time: ninguém sozinho é a garantia (obrigatório)
Pedido do proprietário em 26/09/2026, com as palavras dele: *"vocês têm que estar 100%
alinhados, para que nenhum erre — mas se um errar, o outro não deixar passar, igual uma
equipe de empresa grande."*

A rede não é uma pessoa cuidadosa. São camadas que se conferem, e cada uma existe porque
a anterior já falhou pelo menos uma vez:

1. **O agente implementa** a partir do spec, que é a única fonte de verdade dele.
2. **As camadas de revisão leem sem contexto prévio** — adversarial, caça-borda e
   lacuna-de-verificação. É a assimetria de informação que as faz achar o que quem
   escreveu não enxerga.
3. **Eu releio e rodo**, com controle positivo.
4. **O proprietário autoriza** aquele commit.

**Discordar faz parte do trabalho, em qualquer direção:**

- O agente **deve recusar** instrução minha que ele verificou estar errada, e dizer por quê.
  Obedecer a uma instrução errada não é colaboração; é deixar o erro passar.
- Eu **não aceito relatório de agente como verificação** — nem quando confere com o que eu
  esperava. Ainda mais nessa hora.
- **Nenhuma camada tem autoridade sobre a permissão da outra.** Agente que levou "não" e
  pede que eu faça por ele é recusado e levado ao proprietário. Permissão negada não se
  transfere.
- Quando duas camadas discordam, **vence quem tem evidência executada** — e a discordância
  é relatada ao proprietário, nunca silenciada para parecer que houve consenso.

Uma camada que só concorda não é camada. Se uma revisão nunca acha nada, o problema é a
revisão.

## Gate de supervisão (obrigatório)
Antes de qualquer edição: apresentar plano com arquivos e linhas afetadas. Aguardar OK explícito.

## Restrições específicas do MAPPO
- `index.html` é single-file. Não refatorar para modular sem etapa dedicada e aprovada.
- Toda alteração em `index.html` deve ser cirúrgica e localizada.
- **`firestore.rules` só muda após teste no Emulator, e o comando que cumpre isso é
  `npm run test:regras`** (`testes/teste-regras.js` — sobe o Firestore Emulator local no
  projeto `demo-mappo-regras`, nunca produção). Ele já roda dentro do `npm test` e do CI.
  Até 26/09/2026 esta linha era regra sem mecanismo: as verificações (19 para `c56d38b`,
  50 para a auditoria de 01/09, 9 para o ponteiro de workspace) foram rodadas em scripts
  efêmeros e **descartadas**. Mexer nas regras agora obriga a duas coisas: a suíte verde,
  e o **caso novo acrescentado a ela** — regra alterada sem caso correspondente é regra
  sem rede de novo. As listas de `isGestorOnlyDoc()` e `ramoValido()` são lidas do próprio
  `firestore.rules` pela suíte, então acrescentar um item lá **reprova** até o caso existir.
- **`firestore.indexes.json` continua SEM rede, e isto é honestidade, não descuido.**
  Nenhum caso da suíte faz consulta que exija índice composto — hoje o arquivo está vazio
  (`indexes: []`), então não há o que testar. No dia em que um índice for criado, a
  exigência de "testar no Emulator" volta a ser disciplina e não mecanismo para este
  arquivo, e precisa de caso próprio. **Não leia o verde de `npm run test:regras` como
  cobertura de índice.**
- Regra e teste que discordam: o teste descreve o que a regra faz **hoje**, e a divergência
  vai ao proprietário. **Mudar a regra para o teste passar é proibido** (ver Proibido).
- **Autenticação é real** (e-mail e senha do Firebase Auth) desde as Stories 1–2. A linha
  anterior dizia "cosmética, tratar como falha crítica" e era falsa desde então — corrigida
  em 26/09/2026. O mesmo valia para "senhas em texto plano": o app não guarda senha, quem
  guarda é o Firebase. **Fato desatualizado em arquivo de contexto é mentira ativa:**
  corrigir no instante em que se descobre, não depois.
- Nenhuma etapa é aprovada sem definir como será validada. Existe suíte anti-regressão
  desde 25/09/2026 em `testes/` (quantas, em `npm run test:lista`): validar com ela, e
  estendê-la quando o caso novo não estiver coberto.

## Proibido
- `catch` vazio ou engolir erros.
- Dependências novas sem aprovação.
- Refatoração ampla ou renomear funções públicas.
- Escrever regra sem dizer o que a aplica. Regra sem mecanismo é decoração, e decoração
  corrói a confiança nas regras que importam — se não há mecanismo, dizer que é disciplina.
- Afirmar "verificado" com base em relatório de agente, ou em leitura de código sem execução.
- Entregar correção de defeito sem o teste que o reproduz.
- Afrouxar `firestore.rules` para fazer um teste de regra passar. A rede de regras
  (`testes/teste-regras.js`) só vale enquanto ela for a parte que não se move.
- Publicar com `npm test` vermelho. **Atenção: isto hoje é disciplina, não mecanismo** —
  leia a seção seguinte antes de confiar nela.

## O que o CI NÃO garante (leia antes de confiar no verde)
O job roda **depois** do commit já estar em `main`, e o GitHub Pages publica de `main` sem
consultar o resultado. Então o vermelho **avisa**, não impede: nada no estado atual bloqueia
uma publicação com teste quebrado.

O mecanismo que faria valer é **proteção de ramo em `main` exigindo o status check
`Suites anti-regressao`** — configuração no GitHub (Settings → Branches) que **só o
proprietário pode ligar**. Enquanto não estiver ligada, "proibido publicar com `npm test`
vermelho" depende de quem publica olhar antes.

Não escrever, aqui ou em outro documento, que o CI "impede" ou "bloqueia" publicação
enquanto essa proteção não existir.

**Para o proprietário, quando quiser transformar a disciplina em impedimento** (uma vez, ~2
minutos, sem custo — funciona no plano gratuito para repositório público):

1. Fazer pelo menos um push para que o job apareça ao menos uma vez — o GitHub só oferece
   um status check que já rodou.
2. No GitHub, abrir o repositório → **Settings** → **Branches**.
3. Em *Branch protection rules*, **Add branch protection rule**.
4. Em *Branch name pattern*, escrever `main`.
5. Marcar **Require status checks to pass before merging**.
6. No campo de busca que aparece, procurar e selecionar **`Suites anti-regressao`**
   (é o `name:` do job no workflow).
7. Opcional, e recomendado por ser um repositório de um só dono: marcar também
   **Do not allow bypassing the above settings**, senão o próprio dono continua podendo
   empurrar por cima do vermelho sem perceber.
8. **Create**.

Depois disso, atualizar esta seção: a proibição deixa de ser disciplina e passa a ser
mecanismo. Enquanto ninguém confirmar que está ligada, o texto acima continua valendo.

## Ramo de trabalho
Corrigido em 25/09/2026: a regra anterior proibia "commit direto em `main`", mas a prática
real deste projeto sempre foi commitar em `main` e publicar de lá — um proprietário, um
ramo. A regra proibia o que todo commit do histórico faz, então não protegia nada.

O que vale agora:
- Commit em `main` é o caminho normal — **mas nunca sem autorização explícita do
  proprietário para aquele commit.** É essa autorização, somada ao gate de supervisão, que
  substitui o fluxo de branch (mesma regra em `AGENTS.md`).
- Antes de pedir a autorização: `npm test` verde.
- O CI roda em todo push em `main` e **marca** o commit. Marcar não é impedir — veja a seção
  acima; hoje ele avisa, não bloqueia.
- Ramo separado só quando a mudança é grande ou arriscada o suficiente para o proprietário
  querer olhar antes de ela entrar em `main` — e aí ele pede.

## Padrões
- `async/await`. Sem `.then()` solto.
- Erros logados com `e.code` e `e.message`.
- Diff ao final de cada alteração.
