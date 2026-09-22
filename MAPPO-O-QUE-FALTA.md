# MAPPO — O que falta

> **Leia este arquivo antes de começar qualquer trabalho no MAPPO.**
> Ele e o [MAPPO-O-QUE-TEM.md](MAPPO-O-QUE-TEM.md) são a fonte de verdade sobre o estado do
> produto. Não vasculhe o código para descobrir o que falta — comece por aqui.
>
> **Regra de atualização:** ao publicar um item, **apague-o daqui** e registre no
> `MAPPO-O-QUE-TEM.md` (seção do recurso + linha no histórico). Um item só existe em um
> dos dois arquivos, nunca nos dois.

**Atualizado em:** 22/09/2026 · publicado até `274c7e2`

---

## ⚠️ Em andamento agora

### Bloco 0 — falhas silenciosas (o que pode quebrar a operação sem ninguém ver)

| # | Item | Situação |
|---|---|---|
| 4 | **`mappo_localizacao_historico` cresce para sempre** no mesmo documento — mesmo problema que o item 1 tinha, chegando mais devagar | 🔴 **próximo do bloco** |

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

## Bloco 1 — dados errados e retrabalho

| Item | Detalhe |
|---|---|
| Foto grande trava aparelho fraco | Sem checagem de tamanho antes de ler o arquivo inteiro na memória |
| Toque duplo na foto | Botão não desabilita durante a compressão — duplica ou perde |
| Valor monetário com milhar | `1.234,56` é interpretado errado |
| Financeiro agrupa por **nome** do técnico | Renomear alguém fragmenta o histórico dele |
| Nota de adiantamento | Não pode ser editada nem excluída — erro de digitação fica para sempre |
| Financeiro sem filtro de período | Mostra tudo desde sempre |

## Bloco 2 — segurança residual

Menos grave num time interno e conhecido, mas real:

- Técnico pode escrever o avatar e a localização de outro técnico
- Técnico removido continua lendo dados até recarregar a aba
- O último gestor pode se rebaixar e deixar a empresa sem administrador
- Convite é credencial ao portador — quem tiver o código consome
- Autorização "técnico só vê as obras atribuídas" é só de tela, não de servidor
- Ordens de serviço podem ser alteradas por qualquer membro no servidor, não só pelo gestor

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
