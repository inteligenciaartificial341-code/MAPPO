# Glossário — SPEC-mappo

Termos usados verbatim em `SPEC.md` e em qualquer artefato derivado (épicos, stories, código). Introduzir um sinônimo em vez de um destes termos é uma violação de disciplina.

- **Empresa Contratante** — a empresa que se cadastra no MAPPO e paga (quando o modelo de cobrança for definido). Tem um Workspace próprio. Sinônimo proibido: "cliente" sozinho (ambíguo com Cliente Final).
- **Cliente Final** — o cliente da Empresa Contratante, quem recebe o Link Público. Nunca é usuário autenticado do MAPPO.
- **Workspace** — o espaço de dados isolado de uma Empresa Contratante (`workspaces/{workspaceId}`). Um Workspace nunca lê ou escreve dados de outro.
- **Ramo** — o segmento de atuação da Empresa Contratante (ex.: Refrigeração/Climatização, Elevadores, Segurança Eletrônica). Determina qual Template de Checklist é sugerido no cadastro. Uma Empresa Contratante tem exatamente um Ramo.
- **Template de Checklist** — conjunto de itens de checklist pré-configurado para um Ramo (ex.: VRF/VRV para Refrigeração). Editável pelo dono da Empresa Contratante após o cadastro; a edição não afeta o Template de Checklist original oferecido a outras empresas do mesmo Ramo.
- **Ordem de Serviço (OS)** — unidade de trabalho executada por um Técnico, associada a um checklist, fotos e opcionalmente assinatura do Cliente Final.
- **Técnico** — usuário autenticado com conta própria (Firebase Auth, uma por pessoa), executa OS em campo.
- **Gestor** — usuário autenticado que cria/acompanha OS e configura o Workspace da Empresa Contratante.
- **GPS ao Vivo** — rastreamento contínuo e opcional de um Técnico, por até 10h, com aviso de consentimento explícito.
- **Link Público** — URL sem autenticação que expõe o progresso de uma OS ao Cliente Final; tem validade configurável e pode ser revogado.
- **PWA** — Progressive Web App; forma de instalação do MAPPO em Android/PC/iPhone sem reescrever o código-base.
