# MAPPO — O que falta

> **Leia este arquivo antes de começar qualquer trabalho no MAPPO.**
> Ele e o [MAPPO-O-QUE-TEM.md](MAPPO-O-QUE-TEM.md) são a fonte de verdade sobre o estado do
> produto. Não vasculhe o código para descobrir o que falta — comece por aqui.
>
> **Regra de atualização:** ao publicar um item, **apague-o daqui** e registre no
> `MAPPO-O-QUE-TEM.md` (seção do recurso + linha no histórico). Um item só existe em um
> dos dois arquivos, nunca nos dois.

**Atualizado em:** 25/09/2026 · publicado até `8a21647`

**Próximo combinado:** testes anti-regressão no repositório, depois fotos no IndexedDB (ver o fim
deste arquivo). Depois disso: GPS/localização por pessoa (Bloco 2, os três estruturais).

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
- Modal do link de acompanhamento não mostra a validade nem se já foi revogado

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

**Estado hoje:** 19 suítes escritas e passando, mais 5 diagnósticos — todas fora do
repositório. Migrar é o trabalho.

### 2. Fotos no IndexedDB, não no localStorage 🟠

**O próximo teto, já medido.** A nuvem deixou de ser o limite em `ced6f69` (cada foto tem seu
documento). O aparelho passou a ser: o `localStorage` tem **~5 MB** e guarda todas as fotos de
todas as OS abertas, o que dá **~10 a 12 OS com fotos por aparelho**. Passando disso o app
avisa que não salvou — o aviso funciona, mas o técnico para de trabalhar.

**A saída é gratuita.** O IndexedDB guarda centenas de MB no mesmo navegador, sem plano pago e
sem Firebase Storage (que exige Blaze desde 03/02/2026). O trabalho é migrar a **leitura e
escrita das fotos** para ele, mantendo o padrão que já funcionou duas vezes: a aplicação
continua vendo a foto no mesmo lugar de sempre, e só a camada de armazenamento muda.

**Ficou mais urgente em 25/09/2026.** A pressão de memória dessas fotos é o que faz o celular
descartar a página quando a câmera abre — foi a causa do técnico ser jogado pra tela principal
ao enviar foto (`9a7c928`). Aquela correção faz o app voltar pro lugar certo depois da recarga,
mas não impede a recarga: quem impede é tirar as fotos do `localStorage`.
