---
title: 'Rede de testes para o firestore.rules (Emulator)'
type: 'chore'
created: '2026-09-26'
status: 'done'
review_loop_iteration: 0
baseline_commit: "d19bd18a2efd45630aba50a6af6c46ee23eca909"
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `firestore.rules` é a única parte do MAPPO sem nenhuma rede automatizada — e é a
de maior consequência: isolamento entre empresas, token de link público, o que cada papel pode
escrever. Um defeito ali não tem sintoma: ninguém reclama, nada quebra na tela, e a empresa A
lê os dados da empresa B em silêncio. Pior, o `CLAUDE.md` exige teste no Emulator antes de
qualquer mudança nas regras, mas não existe suíte versionada: as 19 verificações feitas para
`c56d38b` foram rodadas à mão e **descartadas**. É mais uma regra escrita sem mecanismo.

**Approach:** Uma suíte de regras versionada, rodando contra o Firestore Emulator, integrada ao
`npm test` e ao CI. Ela fixa tanto o que **deve** ser permitido quanto o que **deve** ser negado
— incluindo os gaps que o proprietário já aceitou conscientemente, para que não se alarguem sem
ele saber.

## Boundaries & Constraints

**Always:**
- Cada regra testada nos **dois sentidos**: quem pode, e quem NÃO pode. Teste que só confirma o
  caminho feliz não protege de nada.
- Gap já aceito pelo proprietário (ex.: qualquer membro escreve quase todo dado do workspace)
  ganha teste que o **documenta como aceito**, com o porquê no comentário. O objetivo não é
  reprovar a decisão dele: é impedir que ela mude sozinha.
- Custo zero: o Emulator é gratuito, local e no CI. Nada de projeto pago, nada de rede.
- Falha da suíte precisa dizer QUAL regra e QUAL cenário, não só "permission denied".
- Integrada ao `npm test` já existente e ao mesmo fluxo do GitHub Actions.

**Ask First:**
- Qualquer alteração em `firestore.rules`. Esta entrega **testa**, não corrige.
- Qualquer dependência além de `firebase-tools` e `@firebase/rules-unit-testing`, ambas já
  aprovadas pelo proprietário em 26/09/2026.

**Never:**
- Tocar no Firestore de produção, ou usar credencial real. Só o Emulator.
- Mudar as regras para fazer um teste passar. Se teste e regra discordarem, o teste descreve o
  que a regra faz hoje, e a divergência vai ao proprietário.
- Versionar segredo. `.firebaserc` só tem o id do projeto, que já está público no `index.html`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Isolamento | Membro do workspace A lê `workspaces/B/data/*` | **Negado** | Teste nomeia a regra |
| Link público | Anônimo lê `pub_{token}` não expirado, workspace ativo | **Permitido** | N/A |
| Link vencido | Anônimo lê `pub_{token}` com `expiraEm` no passado | **Negado** | N/A |
| Link sem sessão | `request.auth == null` lê `pub_*` | **Negado** | N/A |
| Workspace pendente | Membro de workspace `status != 'ativo'` lê qualquer dado | **Negado** | N/A |
| Doc só-gestor | Técnico escreve `mappo_tecnicos` | **Negado** | N/A |
| Gap aceito | Técnico escreve `mappo_os` | **Permitido** — documentado como aceito | N/A |
| Convite no prazo | Prestador consome convite com `expiraEm` futuro | **Permitido** | N/A |
| Convite vencido | Mesmo, com `expiraEm` no passado | **Negado** | N/A |
| Avaliação | Qualquer um lê `feedback/*` | **Negado** (write-only por desenho) | N/A |
| Emulator ausente | Java ou emulador não instalado | Mensagem dizendo o que instalar | Sai com código 1 |

</frozen-after-approval>

## Code Map

- `firestore.rules` (203 linhas, **versionado**) -- 6 blocos `match`: `userWorkspaces/{uid}`
  (l.77), `workspaces/{wsId}` (l.90), `.../members/{uid}` (l.101), `convites/{codigo}` (l.134),
  `.../data/{docId}` (l.175), `feedback/{id}` (l.194). Auxiliares: `isRealAuth`, `isMember`,
  `myRole`, `isGestor`, `isAtivo`, `isGestorOnlyDoc`, `conviteNoPrazo`, `ramoValido`.
- `firebase.json` -- **não versionado** e **sem bloco `emulators`**. Precisa de ambos.
- `.firebaserc` e `firestore.indexes.json` -- não versionados. O `.firebaserc` só tem
  `mappo-13a30`, id que já aparece 3× no `index.html` público.
- `testes/executar.js` -- runner existente. Classifica suíte pelo veredito
  `TODOS OS CHECKS … PASSARAM` e por `teste-*.js`. A suíte de regras precisa seguir esse
  contrato para entrar sozinha.
- `.github/workflows/testes.yml` -- CI existente; precisa do Java e do emulador.
- Ambiente: Node v24.18.0, Java 21 (o emulador exige Java).
- `_audit/mappo-initial-audit.md` e `_bmad-output/implementation-artifacts/deferred-work.md` --
  onde os gaps aceitos estão descritos; fonte dos casos "documenta como aceito".

## Tasks & Acceptance

**Execution:**
- [x] `firebase.json` -- adicionar bloco `emulators` (firestore em porta fixa, `ui.enabled false`) e versionar -- sem isso o emulador não sobe igual em todo lugar
- [x] `.firebaserc`, `firestore.indexes.json` -- versionar -- o emulador e o CI precisam deles
- [x] `package.json` -- `firebase-tools` e `@firebase/rules-unit-testing` como devDependencies -- aprovadas pelo proprietário
- [x] `testes/teste-regras.js` -- a suíte: sobe o emulador, carrega `firestore.rules`, cobre cada linha da matriz nos dois sentidos, imprime o veredito no fim -- é a entrega
- [x] `testes/README.md` -- como rodar só as regras, o que fazer quando o emulador não sobe, e como adicionar um caso novo -- sem isso ninguém mantém
- [x] `.github/workflows/testes.yml` -- Java e o emulador no CI, sem tocar em produção
- [x] `CLAUDE.md` -- a exigência de "teste no Emulator" passa a apontar o comando que a cumpre -- hoje é regra sem mecanismo
- [x] `MAPPO-O-QUE-TEM.md` / `deferred-work.md` -- registrar; o achado deixa de ser pendência

**Acceptance Criteria:**
- Dado o repositório recém-clonado, quando rodar `npm test`, então a suíte de regras roda junto e a contagem a inclui.
- Dado um membro do workspace A, quando tentar ler dado do workspace B, então a suíte prova que é negado.
- Dado que uma regra seja afrouxada de propósito (ex.: `isAtivo` removido), quando rodar a suíte, então ela **falha nomeando o cenário** — restaurar depois.
- Dado o CI, quando rodar, então executa a suíte de regras sem tocar no Firestore de produção.

## Verification

**Commands:**
- `npm test` -- esperado: a suíte de regras entre as demais, contagem incluindo ela, código 0
- `node testes/teste-regras.js` -- esperado: roda sozinha e imprime o veredito
- Afrouxar uma regra de propósito e rodar -- esperado: falha nomeando o cenário
