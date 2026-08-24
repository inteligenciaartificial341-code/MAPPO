---
title: 'Pontos de entrada novos -- WhatsApp e Compartilhar app'
type: 'feature'
created: '2026-08-24'
status: 'done'
route: 'one-shot'
---

# Pontos de entrada novos -- WhatsApp e Compartilhar app

## Intent

**Problem:** Não existia nenhum caminho direto pra um gestor novo pedir acesso sem já ter um convite, nem um jeito fácil de um gestor já usando o MAPPO indicar o app pra outra pessoa.

**Approach:** Dois pontos de entrada isolados, sem mudança de dados/regras: um link com ícone de WhatsApp na tela de login ("Sou gestor novo, gostaria de acesso"), abrindo conversa com o número do Paulo e mensagem pré-preenchida; e um item "Compartilhar app" no menu lateral do gestor, usando a Web Share API nativa com fallback em cascata (clipboard → `execCommand` → `prompt`) quando o navegador não suporta.

## Suggested Review Order

**Entrada do gestor novo (tela de login)**

- Link do WhatsApp com número/mensagem fixos, comentário documentando de quem é o número (único lugar do app que precisa mudar se trocar).
  [`index.html:811`](../../../../index.html#L811)

**Compartilhar app (menu do gestor)**

- `compartilharApp()` -- cascata Web Share API → clipboard → `execCommand` → `prompt`; trava contra clique duplo (2ª chamada de `navigator.share()` rejeita com `InvalidStateError`, não é falha real); fecha a sidebar como todo outro item do menu.
  [`index.html:2603`](../../../../index.html#L2603)

- Botão no menu lateral, escondido pro perfil técnico pela mesma lista de seletores que já esconde os outros itens exclusivos do gestor.
  [`index.html:914`](../../../../index.html#L914) · gate em [`index.html:2767`](../../../../index.html#L2767)

**Ícone novo**

- `share` adicionado ao registro central de ícones, injetado via o mecanismo genérico `.nav-ico-slot` (já existente, antes só usado no hambúrguer) -- sem duplicar a lógica de `injetarIcones()`.
  [`index.html:2039`](../../../../index.html#L2039)
