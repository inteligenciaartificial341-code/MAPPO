PROJETO: EVOLUÇÃO PROFISSIONAL DO APP
ORQUESTRADOR: BMAD + CLAUDE NO VS CODE
OBJETIVO: Transformar o aplicativo em um produto profissional, seguro, escalável, monetizável e pronto para operação real.

======================================================================
1. REGRA PRINCIPAL DE EXECUÇÃO
======================================================================

O Claude deverá seguir rigorosamente este documento, respeitando a ordem das fases, as dependências e os critérios de aprovação.

Nenhuma alteração estrutural importante deverá ser feita sem:

1. Inspeção do estado atual do projeto;
2. Identificação dos arquivos, módulos e serviços afetados;
3. Criação ou confirmação de plano de implementação;
4. Avaliação dos riscos;
5. Validação da etapa anterior;
6. Aprovação do responsável pelo projeto quando a alteração for crítica.

O Claude não deverá presumir que uma funcionalidade existe apenas porque foi planejada. Ele deverá confirmar sua existência no código, no banco de dados, nas configurações e no ambiente de execução.

O Claude deverá separar claramente:

- O que já existe e está funcionando;
- O que existe, mas precisa ser corrigido;
- O que existe parcialmente;
- O que não existe e deverá ser criado;
- O que é recomendado, mas não obrigatório;
- O que é obrigatório para produção;
- O que depende de decisão do proprietário do projeto.

======================================================================
2. REGRA DE IDENTIFICAÇÃO DAS SKILLS DO BMAD
======================================================================

Antes de iniciar qualquer execução, o Claude deverá:

1. Inspecionar a instalação atual do BMAD;
2. Identificar quais agentes, módulos, workflows e skills estão disponíveis;
3. Verificar a documentação local do BMAD;
4. Identificar a sintaxe correta dos comandos disponíveis;
5. Não inventar comandos, nomes de skills ou workflows;
6. Utilizar somente skills realmente disponíveis no ambiente;
7. Caso uma skill necessária não exista, registrar a ausência e propor uma alternativa;
8. Caso seja necessário criar uma skill nova, apresentar primeiro o objetivo, as entradas, as saídas e os critérios de validação.

O Claude deverá informar no início:

- Versão ou estrutura detectada do BMAD;
- Skills disponíveis;
- Skills que serão utilizadas na fase atual;
- Skills que não estão disponíveis;
- Eventuais limitações do ambiente.

Se existirem comandos oficiais de ajuda, listagem ou execução do BMAD, o Claude deverá utilizá-los conforme a documentação instalada.

Caso a instalação possua comandos equivalentes a ajuda, listagem de skills, status ou execução de workflow, eles deverão ser utilizados de acordo com a implementação real encontrada no projeto.

======================================================================
3. ORQUESTRAÇÃO OBRIGATÓRIA DAS SKILLS
======================================================================

Cada tarefa deverá utilizar no máximo 4 ou 5 skills.

A composição padrão de cada tarefa deverá ser:

1. Skill principal de análise ou implementação;
2. Skill técnica especializada;
3. Skill de segurança, qualidade ou arquitetura, quando necessário;
4. Skill de testes ou validação;
5. Skill SUPERVISORA obrigatória.

A skill supervisora deverá ser sempre a última a executar em cada tarefa ou etapa.

Não executar uma quantidade excessiva de skills simultaneamente.

Não misturar tarefas sem relação direta.

Não executar frontend, backend, banco de dados, segurança e monetização de forma desorganizada no mesmo ciclo.

Cada grupo de skills deverá possuir:

- Objetivo único;
- Escopo definido;
- Arquivos permitidos para alteração;
- Resultado esperado;
- Critérios de aprovação;
- Critérios de rollback;
- Relatório final.

======================================================================
4. SKILL SUPERVISORA OBRIGATÓRIA
======================================================================

Ao final de cada tarefa, etapa ou fase, a skill supervisora deverá analisar o trabalho realizado.

A supervisão deverá verificar:

1. Se a tarefa executada corresponde ao objetivo definido;
2. Se as skills corretas foram utilizadas;
3. Se o limite máximo de 4 ou 5 skills foi respeitado;
4. Se alguma skill executou uma função fora do escopo;
5. Se houve alterações não autorizadas;
6. Se houve arquivos importantes sobrescritos ou removidos;
7. Se o código está coerente com a arquitetura existente;
8. Se o frontend, backend e banco continuam compatíveis;
9. Se as regras de segurança foram respeitadas;
10. Se os testes foram executados;
11. Se os testes realmente validam o comportamento alterado;
12. Se existem erros, alertas, regressões ou pendências;
13. Se a documentação foi atualizada;
14. Se a etapa pode ser aprovada;
15. Se a etapa precisa retornar para correção.

A skill supervisora deverá produzir um relatório com este formato:

- Status: APROVADO, APROVADO COM PENDÊNCIAS ou REPROVADO;
- Objetivo da etapa;
- Skills utilizadas;
- Arquivos alterados;
- Funcionalidades alteradas;
- Testes executados;
- Problemas encontrados;
- Riscos identificados;
- Pendências;
- Recomendações;
- Próximo passo;
- Necessidade de aprovação humana.

Se a etapa for REPROVADA, o Claude não deverá avançar para a próxima etapa sem corrigir os problemas ou obter uma decisão explícita do responsável pelo projeto.

======================================================================
5. POLÍTICA DE SEGURANÇA E PRESERVAÇÃO DO PROJETO
======================================================================

Antes de modificar o projeto, o Claude deverá:

1. Verificar o estado do Git;
2. Confirmar se existem alterações locais não commitadas;
3. Recomendar a criação de uma branch específica;
4. Criar backup ou snapshot quando houver risco de perda de dados;
5. Nunca excluir arquivos ou coleções sem autorização;
6. Nunca alterar dados reais diretamente para realizar testes;
7. Usar ambiente local, staging ou Firebase Emulator quando possível;
8. Nunca expor chaves privadas, tokens, senhas ou credenciais;
9. Nunca registrar dados sensíveis nos logs;
10. Nunca publicar regras de segurança sem testes prévios;
11. Nunca executar migrações destrutivas sem backup e plano de reversão;
12. Nunca substituir uma implementação existente sem explicar o motivo.

Credenciais, arquivos .env, tokens, chaves privadas e dados pessoais deverão permanecer protegidos.

O Claude deverá verificar se arquivos sensíveis estão incluídos no .gitignore.

======================================================================
6. FASE 0 - INVENTÁRIO E DIAGNÓSTICO COMPLETO
======================================================================

OBJETIVO:

Entender completamente o estado atual do aplicativo antes de modificar qualquer coisa.

O Claude deverá analisar:

- Estrutura de pastas;
- Framework frontend;
- Linguagem utilizada;
- Backend existente;
- Firebase ou outros serviços utilizados;
- Banco de dados;
- Autenticação;
- Regras de segurança;
- Funções serverless;
- APIs;
- Variáveis de ambiente;
- Sistema de rotas;
- Componentes de interface;
- Estado global;
- Responsividade;
- Testes existentes;
- Scripts de build;
- Deploy;
- Logs;
- Monitoramento;
- Dependências;
- Vulnerabilidades conhecidas;
- Documentação existente.

ENTREGÁVEIS:

1. Relatório técnico do estado atual;
2. Mapa da arquitetura;
3. Mapa de telas;
4. Mapa das rotas;
5. Mapa das coleções e subcoleções;
6. Mapa das funções e APIs;
7. Lista de problemas;
8. Lista de riscos;
9. Lista de oportunidades;
10. Lista de funcionalidades existentes;
11. Lista de funcionalidades ausentes;
12. Backlog priorizado.

REGRAS:

- Não implementar funcionalidades nesta fase;
- Não alterar regras de produção;
- Não excluir ou renomear estruturas;
- Não presumir o funcionamento de algo sem comprovação.

SKILLS SUGERIDAS:

- Análise de projeto;
- Arquitetura de software;
- Auditoria de frontend;
- Auditoria de backend e banco;
- Skill supervisora.

======================================================================
7. FASE 1 - DEFINIÇÃO DO PRODUTO E ESCOPO
======================================================================

OBJETIVO:

Definir claramente o que o aplicativo é, para quem serve e qual problema resolve.

O Claude deverá ajudar a documentar:

- Proposta de valor;
- Público-alvo;
- Personas;
- Principais problemas dos usuários;
- Funcionalidades essenciais;
- Funcionalidades futuras;
- Diferenciais competitivos;
- Modelo de negócio;
- Estratégia de monetização;
- Jornada do usuário;
- Indicadores de sucesso;
- Plano de lançamento.

O projeto deverá ser dividido em:

1. MVP funcional;
2. Versão profissional inicial;
3. Recursos premium;
4. Escalabilidade futura.

Nenhuma funcionalidade complexa deverá ser implementada antes de estar relacionada a uma necessidade de negócio ou de usuário.

ENTREGÁVEIS:

- Documento de visão do produto;
- Documento de requisitos;
- Backlog priorizado;
- Critérios de aceite;
- Roadmap;
- Definição do MVP;
- Definição dos planos de monetização;
- Lista de métricas principais.

======================================================================
8. FASE 2 - ARQUITETURA TÉCNICA
======================================================================

OBJETIVO:

Organizar o sistema para que ele seja seguro, fácil de manter, escalável e preparado para monetização.

O Claude deverá revisar e definir:

- Arquitetura frontend;
- Arquitetura backend;
- Modelo de autenticação;
- Modelo de autorização;
- Estrutura do banco;
- Organização de serviços;
- Organização de componentes;
- Camada de validação;
- Camada de tratamento de erros;
- Integrações externas;
- Estratégia de cache;
- Estratégia de logs;
- Estratégia de testes;
- Estratégia de deploy;
- Ambientes de desenvolvimento, homologação e produção.

A arquitetura deverá separar claramente:

- Interface;
- Regras de negócio;
- Acesso a dados;
- Autenticação;
- Autorização;
- Integrações;
- Auditoria;
- Configurações.

O código não deverá concentrar regras críticas somente no frontend.

======================================================================
9. FASE 3 - AUTENTICAÇÃO, USUÁRIOS E PERMISSÕES
======================================================================

OBJETIVO:

Garantir que somente usuários autorizados acessem os recursos corretos.

O Claude deverá verificar e melhorar:

- Cadastro;
- Login;
- Logout;
- Recuperação de senha;
- Verificação de e-mail;
- Login social, se aplicável;
- Usuários anônimos;
- Sessão;
- Expiração de sessão;
- Exclusão de conta;
- Atualização de perfil;
- Controle de acesso;
- Perfis e funções;
- Convites;
- Bloqueio e desativação de usuários;
- Multiempresa ou multiworkspace;
- Isolamento entre organizações.

Deverão existir perfis claramente definidos, por exemplo:

- Administrador;
- Gestor;
- Técnico;
- Operador;
- Usuário comum;
- Usuário somente leitura.

As permissões deverão ser verificadas no backend e nas regras do banco, não somente na interface.

======================================================================
10. FASE 4 - FIREBASE, BANCO DE DADOS E REGRAS DE SEGURANÇA
======================================================================

OBJETIVO:

Garantir que o banco seja organizado, seguro e compatível com o uso real do aplicativo.

O Claude deverá mapear todas as coleções e subcoleções existentes, incluindo:

- Nome do caminho;
- Finalidade;
- Documento padrão;
- Campos;
- Tipos de dados;
- Relacionamentos;
- Quem pode ler;
- Quem pode criar;
- Quem pode atualizar;
- Quem pode excluir;
- Índices necessários;
- Dados sensíveis;
- Retenção;
- Auditoria.

A estrutura deverá ser confirmada no código e no Firebase.

Deverão ser avaliados caminhos como:

- workspaces/{workspaceId};
- workspaces/{workspaceId}/members;
- workspaces/{workspaceId}/data;
- workspaces/{workspaceId}/projects;
- workspaces/{workspaceId}/tasks;
- workspaces/{workspaceId}/reports;
- users/{userId};
- notifications;
- auditLogs;
- billing;
- subscriptions.

Os nomes acima são exemplos. O Claude deverá usar os caminhos reais encontrados no projeto.

As regras deverão impedir:

- Leitura pública indevida;
- Escrita por usuários não autenticados;
- Acesso de um workspace por outro;
- Alteração de membros por usuários sem permissão;
- Alteração de perfil por usuário não autorizado;
- Exclusão de dados críticos;
- Manipulação de planos e pagamentos pelo frontend;
- Alteração de logs de auditoria;
- Acesso a informações confidenciais;
- Escrita de campos não permitidos;
- Escalação de privilégios.

TESTES OBRIGATÓRIOS NO EMULADOR:

- Usuário não autenticado;
- Usuário anônimo;
- Usuário autenticado;
- Usuário gestor;
- Usuário técnico;
- Usuário somente leitura;
- Usuário de outro workspace;
- Usuário sem permissão;
- Tentativa de leitura;
- Tentativa de criação;
- Tentativa de edição;
- Tentativa de exclusão;
- Tentativa de modificar campos protegidos.

As regras só poderão ser publicadas após os testes no emulador e a aprovação da supervisão.

======================================================================
11. FASE 5 - BACKEND E REGRAS DE NEGÓCIO
======================================================================

OBJETIVO:

Garantir que as regras importantes sejam executadas de forma confiável no servidor.

O Claude deverá analisar ou criar:

- Serviços backend;
- APIs;
- Funções serverless;
- Validação de entrada;
- Tratamento de erros;
- Controle de permissões;
- Transações;
- Idempotência;
- Processamento assíncrono;
- Filas, quando necessário;
- Webhooks;
- Integrações externas;
- Auditoria;
- Limites de uso;
- Rate limiting;
- Sanitização de dados.

As regras abaixo não deverão depender apenas do frontend:

- Limites dos planos;
- Cobranças;
- Alteração de permissões;
- Criação de administradores;
- Processamento de pagamentos;
- Cancelamentos;
- Acesso a dados de outros usuários;
- Operações administrativas;
- Geração de relatórios sensíveis.

======================================================================
12. FASE 6 - FRONTEND E EXPERIÊNCIA DO USUÁRIO
======================================================================

OBJETIVO:

Criar uma interface profissional, clara, rápida, responsiva e consistente.

O Claude deverá revisar:

- Identidade visual;
- Tipografia;
- Cores;
- Espaçamentos;
- Componentes reutilizáveis;
- Navegação;
- Menu;
- Dashboard;
- Formulários;
- Tabelas;
- Filtros;
- Busca;
- Paginação;
- Estados vazios;
- Carregamento;
- Mensagens de erro;
- Confirmação de ações;
- Notificações;
- Responsividade;
- Acessibilidade;
- Compatibilidade com dispositivos móveis;
- Fluxos de onboarding.

A interface deverá conter:

- Feedback visual para carregamento;
- Mensagens claras para erros;
- Confirmação antes de operações destrutivas;
- Validação de formulários;
- Tratamento de permissões;
- Estados de acesso negado;
- Estados sem dados;
- Tratamento de falha de conexão;
- Layout consistente;
- Componentes reutilizáveis.

O frontend não deverá exibir informações ou ações que o usuário não pode acessar.

======================================================================
13. FASE 7 - FUNCIONALIDADES PROFISSIONAIS
======================================================================

O Claude deverá analisar a necessidade de implementar:

- Dashboard com indicadores;
- Busca global;
- Filtros avançados;
- Exportação de dados;
- Relatórios;
- Histórico de alterações;
- Notificações;
- Convites para membros;
- Comentários;
- Anexos;
- Tags;
- Status;
- Prazos;
- Responsáveis;
- Logs de atividade;
- Configurações do workspace;
- Preferências do usuário;
- Central de ajuda;
- Página de suporte;
- Onboarding;
- Tour inicial;
- Tutorial;
- Importação de dados;
- Exportação e backup;
- Modo escuro, se fizer sentido;
- Controle de sessão;
- Tela de manutenção;
- Termos de uso;
- Política de privacidade.

Cada funcionalidade deverá possuir:

- Objetivo;
- Usuário beneficiado;
- Regras de negócio;
- Campos necessários;
- Permissões;
- Estados possíveis;
- Critérios de aceite;
- Testes;
- Impacto no banco;
- Impacto na monetização.

======================================================================
14. FASE 8 - MONETIZAÇÃO E MODELO DE NEGÓCIO
======================================================================

OBJETIVO:

Preparar o aplicativo para gerar receita de forma segura e profissional.

O Claude deverá propor, documentar e implementar somente após aprovação:

- Plano gratuito;
- Plano básico;
- Plano profissional;
- Plano empresarial;
- Assinatura mensal;
- Assinatura anual;
- Período de teste;
- Limites por plano;
- Recursos premium;
- Upgrade;
- Downgrade;
- Cancelamento;
- Renovação;
- Falha de pagamento;
- Período de tolerância;
- Bloqueio por inadimplência;
- Cupons;
- Descontos;
- Reembolsos;
- Faturas;
- Histórico de pagamentos;
- Painel administrativo;
- Métricas de receita.

As informações de pagamento deverão ser processadas por um provedor apropriado. O aplicativo não deverá armazenar dados sensíveis de cartão.

A confirmação de pagamento deverá ocorrer por backend e webhook validado.

O frontend não poderá decidir sozinho se um pagamento foi aprovado.

O sistema deverá distinguir:

- Plano contratado;
- Plano ativo;
- Status de pagamento;
- Data de renovação;
- Período de teste;
- Cancelamento agendado;
- Assinatura expirada;
- Recursos permitidos;
- Limites utilizados.

Métricas importantes:

- Usuários cadastrados;
- Usuários ativos;
- Conversão do plano gratuito;
- Receita recorrente;
- Cancelamentos;
- Retenção;
- Uso por recurso;
- Custo por usuário;
- Custo de infraestrutura;
- Falhas de pagamento;
- Taxa de ativação.

======================================================================
15. FASE 9 - ADMINISTRAÇÃO E OPERAÇÃO
======================================================================

O sistema deverá possuir, quando aplicável:

- Painel administrativo;
- Gerenciamento de usuários;
- Gerenciamento de workspaces;
- Gerenciamento de planos;
- Visualização de assinaturas;
- Controle de permissões;
- Bloqueio de contas;
- Auditoria;
- Logs;
- Monitoramento;
- Controle de chamados;
- Configurações globais;
- Feature flags;
- Avisos internos;
- Gestão de conteúdo;
- Relatórios operacionais.

O painel administrativo deverá utilizar permissões elevadas com extremo cuidado.

Ações administrativas críticas deverão gerar registros de auditoria.

======================================================================
16. FASE 10 - TESTES E QUALIDADE
======================================================================

O Claude deverá criar ou melhorar:

- Testes unitários;
- Testes de integração;
- Testes de regras do Firebase;
- Testes de backend;
- Testes de componentes;
- Testes de fluxo;
- Testes de permissões;
- Testes de falhas;
- Testes de responsividade;
- Testes de acessibilidade;
- Testes de carga quando necessário;
- Testes de regressão.

Cada funcionalidade deverá possuir testes para:

- Caminho de sucesso;
- Dados inválidos;
- Usuário sem permissão;
- Falha de rede;
- Falha de backend;
- Dados inexistentes;
- Operação duplicada;
- Exclusão ou alteração indevida.

Nenhuma etapa deverá ser considerada concluída somente porque o código compila.

======================================================================
17. FASE 11 - SEGURANÇA, PRIVACIDADE E LGPD
======================================================================

O Claude deverá avaliar:

- Dados pessoais armazenados;
- Finalidade de cada dado;
- Necessidade de coleta;
- Consentimento;
- Exclusão de conta;
- Exportação de dados;
- Retenção;
- Logs sem dados sensíveis;
- Controle de acesso;
- Criptografia;
- Segredos;
- Vazamento de informações;
- Política de privacidade;
- Termos de uso;
- Cookies e rastreamento;
- Processos de atendimento ao titular.

O projeto deverá seguir boas práticas de proteção de dados e considerar os requisitos aplicáveis da LGPD.

A análise técnica não substitui uma avaliação jurídica profissional quando ela for necessária.

======================================================================
18. FASE 12 - PERFORMANCE E ESCALABILIDADE
======================================================================

O Claude deverá analisar:

- Tempo de carregamento;
- Quantidade de consultas;
- Consultas duplicadas;
- Índices;
- Paginação;
- Cache;
- Bundle frontend;
- Imagens;
- Renderizações desnecessárias;
- Funções lentas;
- Custos do Firebase;
- Crescimento do banco;
- Limites dos serviços;
- Processamento em lote.

Não realizar otimizações prematuras sem medir o problema.

Toda otimização deverá registrar:

- Problema medido;
- Solução aplicada;
- Ganho esperado;
- Possíveis efeitos colaterais;
- Forma de validação.

======================================================================
19. FASE 13 - OBSERVABILIDADE E SUPORTE
======================================================================

O sistema deverá possuir, quando aplicável:

- Logs estruturados;
- Rastreamento de erros;
- Alertas;
- Monitoramento de disponibilidade;
- Monitoramento de custos;
- Monitoramento de pagamentos;
- Registro de falhas;
- Identificação de versão;
- Histórico de deploy;
- Painel de métricas;
- Processo de suporte;
- Classificação de incidentes;
- Plano de resposta.

Erros exibidos ao usuário deverão ser amigáveis.

Detalhes técnicos sensíveis não deverão ser exibidos na interface.

======================================================================
20. FASE 14 - DOCUMENTAÇÃO
======================================================================

O Claude deverá manter atualizados:

- README;
- Guia de instalação;
- Guia de desenvolvimento;
- Guia de ambiente;
- Guia de deploy;
- Arquitetura;
- Banco de dados;
- Regras de segurança;
- Variáveis de ambiente;
- APIs;
- Integrações;
- Planos e permissões;
- Procedimentos de backup;
- Procedimentos de rollback;
- Procedimentos de suporte;
- Decisões técnicas;
- Changelog.

Toda alteração significativa deverá ser documentada.

======================================================================
21. FASE 15 - AMBIENTES E DEPLOY
======================================================================

O projeto deverá separar:

- Desenvolvimento;
- Homologação;
- Produção.

O Claude deverá verificar:

- Configurações por ambiente;
- Variáveis de ambiente;
- Projeto Firebase correto;
- Regras corretas;
- Banco correto;
- Domínios;
- Certificados;
- CORS;
- Logs;
- Backup;
- Rollback;
- Pipeline de deploy.

Antes de produção:

1. Executar testes;
2. Validar build;
3. Validar regras;
4. Validar variáveis;
5. Validar integrações;
6. Validar permissões;
7. Validar pagamentos em modo de teste;
8. Executar checklist de publicação;
9. Obter aprovação humana.

======================================================================
22. SISTEMA DE PRIORIDADE
======================================================================

Prioridade P0 - Obrigatório antes de produção:

- Autenticação;
- Autorização;
- Regras seguras;
- Isolamento entre usuários e workspaces;
- Proteção de dados;
- Tratamento de erros;
- Backup;
- Testes principais;
- Deploy controlado;
- Monitoramento mínimo;
- Correção de vulnerabilidades críticas.

Prioridade P1 - Necessário para um produto profissional:

- Dashboard;
- Responsividade;
- Componentes consistentes;
- Logs de auditoria;
- Onboarding;
- Busca e filtros;
- Relatórios;
- Painel administrativo;
- Documentação;
- Testes automatizados;
- Suporte;
- Métricas de uso.

Prioridade P2 - Necessário para monetização:

- Planos;
- Limites;
- Assinaturas;
- Webhooks;
- Controle de acesso premium;
- Faturas;
- Cancelamento;
- Upgrade e downgrade;
- Métricas de receita;
- Painel financeiro.

Prioridade P3 - Melhorias futuras:

- Aplicativo mobile;
- Integrações adicionais;
- Automação avançada;
- Inteligência artificial;
- Marketplace;
- White label;
- Multi-idioma;
- Recursos avançados de colaboração.

======================================================================
23. FLUXO OBRIGATÓRIO PARA CADA TAREFA
======================================================================

Para cada tarefa, o Claude deverá seguir esta ordem:

ETAPA A - ENTENDER

- Ler o objetivo;
- Identificar o contexto;
- Localizar arquivos;
- Identificar dependências;
- Confirmar o que já existe.

ETAPA B - PLANEJAR

- Descrever a solução;
- Listar arquivos que serão alterados;
- Listar arquivos que não deverão ser alterados;
- Descrever impacto no frontend;
- Descrever impacto no backend;
- Descrever impacto no banco;
- Descrever riscos;
- Definir testes.

ETAPA C - EXECUTAR

- Utilizar no máximo 4 ou 5 skills;
- Trabalhar em escopo pequeno;
- Não misturar tarefas diferentes;
- Preservar compatibilidade;
- Registrar decisões.

ETAPA D - TESTAR

- Executar testes adequados;
- Testar sucesso e falha;
- Testar permissões;
- Testar responsividade quando aplicável;
- Testar integração entre as camadas.

ETAPA E - SUPERVISIONAR

- Executar obrigatoriamente a skill supervisora;
- Gerar relatório de supervisão;
- Classificar a etapa;
- Registrar pendências.

ETAPA F - FINALIZAR

- Atualizar documentação;
- Atualizar changelog;
- Informar arquivos alterados;
- Informar comandos executados;
- Informar testes;
- Informar pendências;
- Solicitar aprovação quando necessário.

======================================================================
24. CRITÉRIOS DE CONCLUSÃO DE UMA TAREFA
======================================================================

Uma tarefa somente poderá ser considerada concluída quando:

- O objetivo estiver implementado;
- O código estiver organizado;
- A solução estiver compatível com o projeto;
- Os testes forem executados;
- Os erros críticos estiverem resolvidos;
- As permissões estiverem validadas;
- A documentação estiver atualizada;
- A skill supervisora aprovar a etapa;
- Não existirem alterações desconhecidas;
- O próximo passo estiver definido.

======================================================================
25. FORMATO OBRIGATÓRIO DO RELATÓRIO FINAL DE CADA ETAPA
======================================================================

RELATÓRIO DA ETAPA

1. Nome da etapa:
2. Objetivo:
3. Status:
4. Skills utilizadas:
5. Skill supervisora utilizada:
6. Arquivos analisados:
7. Arquivos alterados:
8. Arquivos criados:
9. Arquivos removidos:
10. Alterações realizadas:
11. Impacto no frontend:
12. Impacto no backend:
13. Impacto no banco:
14. Impacto na segurança:
15. Testes executados:
16. Resultado dos testes:
17. Problemas encontrados:
18. Riscos:
19. Pendências:
20. Documentação atualizada:
21. Necessita aprovação humana:
22. Próximo passo recomendado:

======================================================================
26. REGRAS DE DECISÃO
======================================================================

Quando houver dúvida sobre o funcionamento atual:

- Investigar antes de alterar.

Quando houver conflito entre código e documentação:

- Considerar o código como evidência do comportamento atual;
- Registrar a divergência;
- Propor correção documentada.

Quando houver risco de perda de dados:

- Parar;
- Explicar o risco;
- Solicitar backup e aprovação.

Quando houver risco de segurança:

- Priorizar a correção;
- Não publicar uma solução incompleta;
- Testar no ambiente controlado.

Quando uma funcionalidade exigir decisão de negócio:

- Não decidir sozinho;
- Apresentar opções;
- Explicar vantagens, custos e riscos;
- Solicitar escolha do responsável.

Quando uma skill não estiver disponível:

- Não fingir que foi executada;
- Registrar a ausência;
- Utilizar uma alternativa adequada;
- Informar a limitação no relatório.

======================================================================
27. RESULTADO ESPERADO DO PROJETO
======================================================================

Ao final do processo, o aplicativo deverá possuir:

- Aparência profissional;
- Experiência de uso consistente;
- Código organizado;
- Arquitetura sustentável;
- Frontend responsivo;
- Backend seguro;
- Banco de dados estruturado;
- Regras de acesso rigorosas;
- Isolamento entre usuários e organizações;
- Autenticação confiável;
- Perfis e permissões;
- Testes automatizados;
- Logs e monitoramento;
- Documentação;
- Ambientes separados;
- Processo de deploy;
- Backup e rollback;
- Preparação para LGPD;
- Modelo de monetização;
- Planos e limites;
- Pagamentos processados com segurança;
- Painel administrativo;
- Métricas de produto;
- Capacidade de crescimento;
- Processo profissional de manutenção.

======================================================================
28. INSTRUÇÃO FINAL AO CLAUDE
======================================================================

Você deverá agir como uma equipe técnica profissional coordenada pelo BMAD.

Não execute mudanças de forma impulsiva.

Não pule etapas.

Não misture tarefas sem relação.

Não utilize mais de 4 ou 5 skills por tarefa.

Sempre execute uma skill supervisora ao final de cada etapa.

Sempre valide o trabalho antes de avançar.

Sempre diferencie análise, planejamento, execução, testes e aprovação.

Sempre proteja os dados, as credenciais e o ambiente de produção.

Sempre informe claramente o que foi feito, o que não foi feito e o que ainda precisa ser decidido.

O objetivo não é apenas fazer o aplicativo funcionar.

O objetivo é transformar o aplicativo em um produto profissional, seguro, escalável, documentado, sustentável e capaz de gerar receita.

## Restrições específicas do MAPPO

- `index.html` é single-file (~328KB). Não refatorar para modular sem etapa dedicada e aprovada.
- Toda alteração em `index.html` deve ser cirúrgica e localizada.
- `firestore.rules` e `firestore.indexes.json` só mudam após teste no Emulator.
- Autenticação atual é cosmética: tratar como falha crítica, não como feature existente.
- Senhas em texto plano: migração exige plano de rollback e backup do Firestore.
- Fonte de verdade do diagnóstico: `_audit/mappo-initial-audit.md`.
- Nenhuma etapa pode ser aprovada sem definir como será validada.
- **Existe suíte anti-regressão desde 25/09/2026** (corrigido: este documento dizia
  "zero testes hoje"). São 25 suítes Playwright e 9 diagnósticos versionados em `testes/`,
  rodados com `npm test` em série e executados pelo GitHub Actions a cada push
  (`.github/workflows/testes.yml`). Três diagnósticos batem em produção e ficam fora do
  CI: `diag-difer`, `diag-linkreal`, `diag-pubreal`.
- Regra vigente: **todo defeito relatado vira teste antes de virar correção** — o teste
  falha primeiro, provando que reproduz. Detalhes em `testes/README.md`; o que navegador
  automatizado não alcança está em `testes/VERIFICACAO-MANUAL.md`.


======================================================================
FIM DO DOCUMENTO
======================================================================
