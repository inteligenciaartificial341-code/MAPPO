# Verificação manual — o que nenhum teste automatizado alcança

As suítes em `testes/` cobrem o que acontece **dentro** da página (`npm run test:lista` diz
quantas são hoje). Elas não conseguem verificar o que sai do app para outro aplicativo, para
o sistema operacional ou para o hardware do celular: o navegador automatizado ou não tem
permissão, ou não tem o aplicativo instalado, ou não tem câmera.

São **5 áreas**, com cerca de **25 caixas** no total. Não é uma lista leve: várias caixas
exigem um **celular físico** — e a área 4 pede especificamente um **iPhone**, porque o
descarte de página por pressão de memória no iOS foi a origem de vários defeitos reais.

**Não é para rodar inteira toda vez.** Confira só a área que a sua mudança tocou. Cada área
diz, no fim, quando vale a pena.

## Registro das últimas verificações

Preencha ao conferir. Sem isto não há como saber se uma área já foi verificada nesta versão
ou se ninguém olha para ela desde que foi escrita.

| Área | Última verificação | Commit/versão | Aparelho | Quem conferiu | Resultado |
|---|---|---|---|---|---|
| 1. Google Agenda | — | — | — | — | nunca registrada |
| 2. Notificação real | — | — | — | — | nunca registrada |
| 3. WhatsApp | — | — | — | — | nunca registrada |
| 4. Câmera de celular | — | — | — | — | nunca registrada |
| 5. Instalação/atualização (PWA) | — | — | — | — | nunca registrada |

Exemplo de linha preenchida:

| 4. Câmera de celular | 26/09/2026 | `56db2a0` | iPhone 13, iOS 18 | Paulo | ok, 6 fotos seguidas sem perda |

Se um item falhar à mão, registre aqui **e** abra a correção — e, pela regra do
`CLAUDE.md`, escreva primeiro o teste que reproduz a parte que o navegador alcança.

---

## 1. Google Agenda

**O que o app faz:** na manutenção, o botão de agenda monta um link
`calendar.google.com/calendar/render?action=TEMPLATE...` com título, data, endereço e
observação, e abre numa aba nova (`abrirGoogleAgenda`).

**Por que o teste não cobre:** o teste consegue conferir o link montado, mas não consegue
entrar na sua conta do Google, nem ver se o evento foi criado de verdade.

**Confira à mão:**
- [ ] O botão abre o Google Agenda já **preenchido** — título com cliente e tipo, data certa, endereço no campo de local.
- [ ] Salvar cria o evento na **sua** agenda, na data certa.
- [ ] Acentos e o "—" aparecem corretos no título (não como `%E2%80%94` ou `Ã§`).

**Quando conferir:** só se mexer em manutenções, no texto do evento ou na data.

---

## 2. Notificação real do aparelho

**O que o app faz:** `checkManutencoes` avisa quando falta **7 dias ou menos** para uma
manutenção, e chama `notificarNavegador`, que pede permissão e cria uma `Notification`
do sistema. Só para o **gestor**, e só com a notificação de plataforma ligada nas
Configurações.

**Por que o teste não cobre:** o Chromium automatizado roda com permissão de notificação
negada por padrão, e não existe "banner do sistema" para ele inspecionar. O teste chega
até o `toast` na tela; a notificação do sistema operacional fica fora.

**Confira à mão:**
- [ ] Na primeira vez, o navegador **pede** permissão de notificação.
- [ ] Concedida, aparece a notificação **fora** da aba (na barra do sistema / central de notificações), com cliente e prazo.
- [ ] Negada, o app continua funcionando e o aviso ainda aparece como faixa/toast na tela — nada trava.
- [ ] No celular com o app instalado, a notificação aparece com o app **fechado**.

**Quando conferir:** se mexer em manutenções, em notificações ou no service worker.

> ⚠️ **Cuidado que não é teste, é informação:** as notificações por **e-mail** e **SMS**
> (`enviarEmailManut`, `enviarSMSManut`) são **stubs** — só escrevem no console, não
> enviam nada. As chaves existem nas Configurações, mas não há integração. Não perca
> tempo testando: ainda não foi construído.

---

## 3. WhatsApp

**O que o app faz:** ao publicar o link de acompanhamento do cliente, o botão marca o link
como enviado e abre `https://wa.me/?text=<mensagem>`. Na tela de entrada há também o
contato do gestor por `wa.me`.

**Por que o teste não cobre:** `wa.me` é um site de terceiros e o WhatsApp é outro
aplicativo. O teste pode verificar a URL montada, nunca a conversa aberta.

**Confira à mão:**
- [ ] O botão abre o WhatsApp (app no celular, WhatsApp Web no computador).
- [ ] A mensagem chega **pronta**, com o link completo do cliente dentro.
- [ ] O link **colado no WhatsApp** abre a tela do cliente — sem "Link expirado", sem pedir login.
- [ ] Abrir esse link **não derruba** o seu login de gestor no mesmo navegador.

**Quando conferir:** sempre que mexer no link público, no token ou na mensagem.

---

## 4. Câmera de celular

**O que o app faz:** as fotos entram por `<input type="file" accept="image/*">` — no
celular isso abre a câmera. O app redimensiona para 800px / qualidade 0,5, guarda no
IndexedDB e sobe um documento por foto.

**Por que o teste não cobre:** o teste injeta um arquivo falso. Ele não tem câmera, não
sofre a pressão de memória de ter a câmera em primeiro plano, e não passa pelo descarte
de página que o iOS faz. **Foi exatamente aí que nasceram vários defeitos reais** — a
foto que sumia, a que ficava presa no aparelho, o técnico jogado de volta à tela
principal.

**Confira à mão, num celular de verdade (de preferência um iPhone):**
- [ ] Tirar foto pela câmera dentro da OS **salva** e mostra a miniatura.
- [ ] Depois de tirar a foto, o app **continua na OS** — não volta para a tela principal.
- [ ] A confirmação "Foto salva" aparece.
- [ ] Tirar **4 ou mais** fotos na mesma OS, uma seguida da outra, sem perder nenhuma.
- [ ] A foto tirada no celular aparece **no notebook** depois de sincronizar (e o contrário).
- [ ] Foto em pé não aparece deitada.
- [ ] Fechar e reabrir o app: as fotos continuam lá.

**Quando conferir:** sempre que mexer em foto, IndexedDB ou sincronização. É a área com
mais histórico de defeito.

---

## 5. Instalação e atualização do app (PWA)

**Por que o teste não cobre:** instalar na tela inicial e trocar o service worker
dependem do sistema operacional e do navegador real.

**Confira à mão:**
- [ ] Publicada uma versão nova, o app avisa que há atualização.
- [ ] Após atualizar, a versão nova realmente carrega (não fica servindo a antiga do cache).
- [ ] O app instalado abre com o ícone e a tela de abertura certos, sem barra de navegador.

**Quando conferir:** se mexer em `sw.js`, no `manifest.json` ou nos ícones.

---

## Como usar esta lista

1. `npm test` — se ficar vermelho, para aqui e corrige.
2. Verde, olhe **qual área** você mexeu e faça só as caixas daquela área.
3. **Preencha a linha da área** na tabela de registro no começo deste arquivo.
4. Se uma caixa falhar, **vire teste antes de corrigir** (regra em `CLAUDE.md`) — pelo
   menos a parte que o navegador automatizado alcança.

Uma área cuja linha diz "nunca registrada" não significa que está quebrada — significa
que ninguém sabe. São os primeiros lugares a olhar quando algo escapa.
