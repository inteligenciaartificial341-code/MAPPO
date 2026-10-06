<!-- GERADO POR ferramentas/gerar-mapa.js — NÃO EDITAR À MÃO. Regenere com: npm run mapa -->

# Mapa do `index.html`

`index.html` tem **11.688 linhas** e **727 KB** — ler o arquivo inteiro custa ~213 mil tokens. Este mapa custa uma fração disso e diz **onde** cada coisa está.

**Como usar:** ache o nome aqui, pegue a linha, e abra só o trecho (`sed -n '1200,1260p' index.html`). Nunca leia o arquivo inteiro para localizar algo.

**O que este mapa NÃO faz:** ele não diz o que o código faz. Decidir pelo mapa sem abrir a função é pior que deduzir a partir do código — é deduzir sem nem ter lido.

| | |
|---|---|
| Funções | 537 |
| Estado de topo (`const`/`let`) | 167 |
| Elementos com `id` | 163 |
| Classes CSS | 337 |
| Seções do arquivo | 23 |

## Seções, na ordem do arquivo

`LOGIN / SPLASH` 67 · `SPLASH DE ENTRADA + LOGO OFICIAL` 69 · `APP SHELL` 96 · `COMPONENTES` 155
`ÍCONES SVG (Feather-style, contorno)` 302 · `BARRA DE NAVEGAÇÃO — DESKTOP (rail vertical à esquerda)` 307
`DESKTOP LIMPO: esconde a rail lateral, sidebar única` 327 · `BARRA DE NAVEGAÇÃO — MOBILE (inferior fixa)` 360
`MODO MOBILE FORÇADO (toggle no desktop)` 383 · `BOAS-VINDAS + DASHBOARD CENTRAL` 426
`VRF — painel do gestor` 531 · `VRF — checklist do prestador` 598
`TUTORIAL GUIADO (coach-marks/spotlight) — Story 17` 936 · `VRF — estrutura de dados de obra` 4895
`HOME DO TÉCNICO — boas-vindas ou resumo do que tem em andamento` 5440 · `DASHBOARD` 6043 · `ORDENS` 6184
`CLIENTES` 6239 · `MANUTENÇÕES` 6271 · `MAPA` 6302 · `SPLITS` 6353 · `VRF (placeholder pra integração)` 6381
`CONFIG` 7633

## Funções, agrupadas pela seção onde vivem

**TUTORIAL GUIADO (coach-marks/spotlight) — Story 17**

`ramoTemVRF` 1259 · `_idbAbrir` 1297 · `_idbTx` 1312 · `idbGravarFoto` 1326 · `idbLerFoto` 1329
`idbApagarFoto` 1332 · `idbTodasAsChaves` 1335 · `espacoDoAparelho` 1340 · `_ehReferenciaDeFoto` 1372
`_cachePor` 1382 · `_opsEmVooTotal` 1408 · `_opEmVooNome` 1409 · `_abrirOp` 1410 · `_fecharOp` 1411
`_emVoo` 1418 · `guardarFotoNoAparelho` 1437 · `fotoBytes` 1449 · `imgFoto` 1479 · `_pintarUma` 1490
`pintarFotos` 1525 · `ligarPintorDeFotos` 1530 · `_bytesDe` 1549 · `_nomeAmigavel` 1585 · `_nomeDoAndar` 1590
`_semNuvem` 1603 · `_vigiarConexao` 1613 · `_atualizarAlertaSync` 1620 · `_docDoAndar` 1706
`_ehDocDeFotos` 1707 · `_fotoOSDoc` 1721 · `_ehDocFotoOS` 1724 · `_camposFotoOS` 1730 · `_separarFotosOS` 1743
`_resolverFotosOS` 1770 · `_valorFotoDe` 1820 · `_preservarFotosNoMerge` 1839 · `_reancorarConversoesOS` 1893
`migrarFotosParaOArmazem` 1912 · `migrarFotosObraETarefaParaOArmazem` 1962 · `_fotosJaEnviadas` 2016
`_esquecerEnvio` 2022 · `_marcarFotoEnviada` 2031 · `_idFotoPorConteudo` 2056 · `_idFotoObra` 2065
`_ehDocFotoObra` 2066 · `_ehFotoDeVerdade` 2069 · `_separarFotosAndar` 2072 · `_resolverFotosAndar` 2097
`_apagarAndarNaNuvem` 2166 · `_migracaoFotosPendente` 2194 · `_marcarMigracaoFotos` 2197
`_idFotoTarefa` 2220 · `_ehDocFotoTarefa` 2221 · `_chaveFotoTarefa` 2225 · `_readicionarFotoTarefa` 2244
`_separarFotosTarefa` 2261 · `_resolverFotosTarefa` 2291 · `_preservarFotosTarefaNoMerge` 2358
`_mesclarAndar` 2420 · `_saveTouch` 2446 · `_pendDe` 2456 · `_temPend` 2457 · `_arr` 2459 · `_obj` 2460
`_porId` 2461 · `_setLocalQuiet` 2464 · `_anotarPendentes` 2483 · `_detectarMudancasNaoVistas` 2516
`_marcarAlteracaoLocal` 2527 · `_ehErroDeCota` 2539 · `_fecharAvisoMemoria` 2552 · `_avisarMemoriaCheia` 2553
`_testInterceptor` 2624 · `_startPolling` 2640 · `fbInit` 2665 · `_resolverWorkspace` 2716
`_cacheWorkspace` 2757 · `_lerCacheWorkspace` 2760 · `_aplicarSessaoResolvida` 2768 · `_mostrarBoxLogin` 2808
`mostrarLogin` 2813 · `mostrarCadastroEmpresa` 2814 · `mostrarPrestadorBox` 2815
`mostrarRecuperarSenha` 2818 · `enviarRecuperacaoSenha` 2838 · `_mostrarSemAcesso` 2878
`_mostrarUidManual` 2889 · `_mostrarPendente` 2894 · `_tentarNovamenteAcesso` 2901 · `_sairSemAcesso` 2910
`_slugify` 2915 · `_gerarSufixoWs` 2925 · `_ramoCustomInvalido` 2946 · `_mensagemErroAuth` 2956
`cadastrarEmpresa` 2967 · `prestadorEntrar` 3061 · `_consumirConviteTecnico` 3108 · `fbPush` 3168
`_gravarMesclado` 3180 · `_nomeDoUid` 3234 · `_guardarPosicaoDeUid` 3261 · `_semVazios` 3267
`_meuCorpoPosicao` 3274 · `_supremaciaPorUid` 3299 · `_remontarPosicoes` 3317
`_agendarEnvioDaMinhaPosicao` 3364 · `_aplicarPosicaoDeUid` 3377 · `_limparEstadoDePosicao` 3386
`_registrarFalhaPosicao` 3401 · `_pushMinhaPosicao` 3428 · `_pullPosicoes` 3507
`_retentarLeituraPosicoes` 3528 · `_pushFotosPorAndar` 3538 · `_confirmarEnvioAndar` 3652
`_pushOSSemFotos` 3666 · `_pushTarefasSemFotos` 3739 · `_doPush` 3834 · `_doPushAgora` 3841
`_mergeLista` 3920 · `_mergeItens` 3935 · `_mergeLeafs` 3959 · `_confirmarEnvio` 3978 · `_mergeMapa` 4010
`_reancorarExecOS` 4028 · `_execucaoAberta` 4037 · `_aplicarNaMemoria` 4040 · `_ehChaveDeSync` 4079
`_aplicarShardFotos` 4085 · `_aplicarLegadoFotos` 4117 · `_limparPubVazados` 4142 · `_naFilaSync` 4166
`_aplicarOSComFotos` 4178 · `_aplicarListaOS` 4188 · `_aplicarTarefasComFotos` 4210 · `fbApply` 4232
`fbOnRemoteChange` 4322 · `fbStartListeners` 4392 · `_vigiarMembership` 4451 · `_remoteMs` 4466
`fbStopListeners` 4472 · `fbPullAll` 4475 · `fbSeedFromLocal` 4494 · `initSync` 4530 · `_semAutenticacao` 4556
`_voltarAoLogin` 4589 · `fbBoot` 4599 · `fbLog` 4612 · `renderDiagTamanhos` 4623 · `renderDiagAparelho` 4704
`renderDebugLogs` 4748 · `syncManual` 4761 · `saveTecnicos` 4822 · `nomesTecnicos` 4823 · `getTecnico` 4824
`avatarDoTecnico` 4836 · `setMeuAvatar` 4837 · `svgIco` 4884

**VRF — estrutura de dados de obra**

`saveVrfFasesConfig` 4919 · `_garantirVrfFasesConfig` 4920 · `vrfFasesAtuais` 4926
`vrfTotalEtapasAtuais` 4929 · `vrfObraAtual` 4948 · `vrfResolverObraAtual` 4954 · `_vrfPertenceObra` 4971
`_vrfPertenceObraAtual` 4972 · `_novoIdAndar` 4975 · `_novoIdObra` 4976 · `vrfObrasDoTecnico` 4997
`vrfObrasPermitidas` 5003 · `vrfTemAtividadeObras` 5010 · `vrfProgGeralObras` 5013
`_vrfResumoDashObras` 5018 · `registrarHistoricoLocalizacao` 5037 · `saveTarefas` 5052 · `saveLive` 5054
`saveVrfFotosMeta` 5056 · `vrfFotoPrestador` 5057 · `vrfMissaoAndar` 5073 · `vrfMissaoTotal` 5074
`vrfMissaoInclui` 5075 · `saveVrfObra` 5077 · `saveVrfProgresso` 5078 · `saveVrfFotos` 5079
`saveVrfNotas` 5080 · `vrfProgAndar` 5083 · `vrfProgObra` 5092 · `vrfProgGeral` 5102 · `vrfProgFase` 5103
`vrfCorProg` 5109 · `saveChecklistConfig` 5170 · `_fallbackChecklistRamo` 5180 · `ehManutencao` 5186
`checklistDoTipo` 5187 · `corrigirChecklistSeVazio` 5195 · `savePrecoConfig` 5244 · `_fallbackPrecoRamo` 5251
`_garantirPrecoConfig` 5258 · `_precoCfgExibicao` 5262 · `_normTipo` 5265 · `valorDoTipo` 5270
`_moduloDefaultParaRamo` 5288 · `saveModuloConfig` 5293 · `_fallbackModuloRamo` 5296
`_garantirModuloConfig` 5302 · `moduloSplitAtual` 5309 · `_aplicarModuloVocabulario` 5316 · `saveOS` 5346
`saveClientes` 5347 · `saveManut` 5348 · `saveSettings` 5349 · `saveSession` 5350 · `saveFinanceiroNotas` 5351
`fazerLogin` 5357 · `entrarApp` 5372

**HOME DO TÉCNICO — boas-vindas ou resumo do que tem em andamento**

`renderTecnicoHome` 5441 · `injetarIcones` 5538 · `getNavItems` 5550 · `montarNavbar` 5591
`montarFloatMenu` 5606 · `floatMenuNav` 5617 · `toggleFloatMenu` 5623 · `_encerrarPorAcessoRemovido` 5637
`logout` 5657 · `compartilharApp` 5680 · `abrirAvaliarApp` 5734 · `_renderAvalNotas` 5754
`_setAvalNota` 5759 · `enviarFeedbackApp` 5764 · `nav` 5808 · `ajustarNavbarContexto` 5829
`openSidebar` 5838 · `closeSidebar` 5839 · `setView` 5842 · `toast` 5854 · `fmtDate` 5859 · `fmtMoeda` 5860
`_parseMoeda` 5866 · `escapeHtml` 5891 · `hoje` 5894 · `openLightbox` 5898 · `toggleChkFoto` 5910
`closeLightbox` 5916 · `updateDate` 5917 · `statusReal` 5918 · `etapaAtual` 5919 · `aplicarMenuTecnico` 5933
`_renderViewConteudo` 5946 · `renderView` 6024 · `atualizarBadges` 6029

**DASHBOARD**

`vrfTemAtividade` 6046 · `_vrfResumoDash` 6052 · `renderBemVindoGestor` 6055 · `cardVRFdash` 6085
`renderDashboard` 6106 · `renderEquipeMini` 6159 · `renderManutMini` 6171

**ORDENS**

`renderOrdens` 6185 · `setFilter` 6197 · `renderOSGrid` 6199 · `osCardHTML` 6212

**CLIENTES**

`renderClientes` 6240

**MANUTENÇÕES**

`renderManutencoes` 6272 · `manutCardHTML` 6284

**MAPA**

`renderMapa` 6303 · `renderHistoricoLocalizacao` 6339

**SPLITS**

`renderSplits` 6354

**VRF (placeholder pra integração)**

`renderVRF` 6382 · `vrfCheckinHoje` 6389 · `vrfCardCheckin` 6393 · `vrfFazerCheckin` 6413
`vrfSalvarCheckin` 6432 · `renderVRFtecnico` 6449 · `vrfMissaoProgresso` 6509 · `vrfSetTab` 6518
`vrfRenderMissaoPainel` 6527 · `vrfRenderAndarPainel` 6572 · `vrfToggleTec` 6625 · `vrfAtualizarTabs` 6637
`vrfAbrirCamera` 6651 · `_assinaturaComprimida` 6662 · `vrfComprimirImagem` 6690 · `vrfSetupCamera` 6751
`vrfAbrirNota` 6793 · `vrfSalvarNota` 6805 · `vrfVerFoto` 6816 · `vrfExcluirFoto` 6829
`vrfEnviarRelatorio` 6839 · `renderVRFgestor` 6848 · `renderVRFobras` 6934 · `renderVRFsemAcesso` 6962
`vrfNovaObraModal` 6966 · `vrfCriarObra` 6978 · `vrfSelecionarObra` 7000 · `renderVRFandares` 7011
`renderVRFrelatorios` 7045 · `renderVRFmapa` 7062 · `initVRFmapa` 7085 · `vrfCentralizarMapa` 7113
`renderVRFfotos` 7118 · `vrfVerFotoDetalhe` 7155 · `vrfMissaoResumo` 7177 · `vrfConfigObra` 7196
`vrfAddAndar` 7218 · `vrfRemoverAndar` 7222 · `vrfRenomearAndar` 7234 · `vrfSalvarObra` 7235
`vrfConfigMissao` 7249 · `vrfMissaoTab` 7269 · `vrfRenderMissaoSteps` 7274 · `vrfToggleMissao` 7293
`vrfSalvarMissao` 7307 · `vrfAbrirAndar` 7314 · `vrfToggleEtapa` 7359 · `carregarJsPDF` 7370
`exportarPDFos` 7388 · `gerarPDFos` 7398 · `vrfExportarPDF` 7509 · `gerarPDFandar` 7522

**CONFIG**

`renderConfig` 7634 · `toggleSet` 7710 · `setField` 7711 · `_templateRamoFallback` 7726
`_garantirChecklistConfig` 7734 · `_checklistCfgExibicao` 7738 · `renderChecklistConfig` 7741
`editarItemChecklist` 7760 · `removerItemChecklist` 7771 · `adicionarItemChecklist` 7780
`renderModuloConfig` 7801 · `salvarModuloConfig` 7809 · `renderVrfFasesConfig` 7834 · `editarEtapaVrf` 7856
`removerEtapaVrf` 7872 · `adicionarEtapaVrf` 7906 · `renderPrecoConfig` 7927 · `editarPrecoCategoria` 7944
`removerPrecoCategoria` 7955 · `adicionarPrecoCategoria` 7962 · `setFinanceiroPeriodo` 7987
`_dentroDoPeriodo` 7988 · `_rotuloPeriodo` 7999 · `financeiroResumo` 8003 · `renderFinanceiroHierarquia` 8020
`renderFinanceiroNotas` 8054 · `removerNotaFinanceira` 8075 · `adicionarNotaFinanceira` 8086
`renderFinanceiro` 8105 · `_reconciliarEquipe` 8140 · `renderEquipeConfig` 8185 · `openModalTecnico` 8220
`_vincularAcessoTecnico` 8279 · `_gerarCodigoConvite` 8300 · `_conviteExpirado` 8322
`gerarConviteTecnico` 8326 · `revogarConviteTecnico` 8372 · `_revogarConviteSeExistir` 8400
`_mostrarModalConvite` 8417 · `_copiarConviteCodigo` 8439 · `_atualizarNomeMembro` 8458
`_renomearTecnicoEmDados` 8479 · `salvarTecnico` 8497 · `removerTecnico` 8560 · `toggleModuloTec` 8603
`toggleObraTec` 8630 · `emptyState` 8647 · `diasAte` 8648 · `getTecnicoLoc` 8649 · `showModal` 8654
`closeModal` 8660 · `_temTourVisto` 8788 · `_gravarTourVisto` 8797 · `_temTourViewVisto` 8808
`_gravarTourViewVisto` 8814 · `_tourAlvoCandidatos` 8837 · `_tourElExiste` 8841
`_tourAdiarReposicaoAposAbrirSidebar` 8857 · `_tourAdiarReposicaoAposAbrirFloatMenu` 8874
`_tourElVisivel` 8894 · `_tourExisteProximoVisivel` 8925 · `_tourExisteAnteriorVisivel` 8929
`_tourIniciar` 8934 · `_tourIniciarView` 8945 · `_tourEntrarView` 8962 · `_tourAvancar` 8980
`_tourMostrarPasso` 8989 · `_tourReposicionar` 9036 · `_tourFechar` 9062 · `openModalOS` 9086 · `criarOS` 9112
`_selectTecnicoReatribuir` 9156 · `reatribuirOS` 9171 · `openDetalhe` 9182 · `salvarNota` 9266
`salvarValorOS` 9270 · `excluirOS` 9281 · `revisarOS` 9282 · `openModalManut` 9285 · `criarManut` 9310
`salvarManutEdicao` 9333 · `_reofereceAgenda` 9364 · `openModalManutEdit` 9383 · `excluirManut` 9420
`concluirManut` 9421 · `criarOSdeManut` 9432 · `agendarProximaManut` 9437 · `openModalCliente` 9440
`criarCliente` 9450 · `openHistoricoCliente` 9456 · `abrirGoogleAgenda` 9468 · `_painelMapaConteudoHtml` 9492
`_renderPainelMapa` 9517 · `abrirPainelMapa` 9534 · `fecharPainelMapa` 9540 · `toggleColapsoPainelMapa` 9541
`_carregarAvatarSvg` 9547 · `_avatarMarkerHtml` 9564 · `initMapa` 9574 · `atualizarMarcadores` 9584
`loadLeaflet` 9666 · `renderTecnicoApp` 9687 · `meuAvatarBtnLabel` 9714 · `abrirEscolhaAvatar` 9717
`escolherMeuAvatar` 9734 · `secTec` 9741 · `afterTecnicoRender` 9754 · `_temConsentimentoGPS` 9774
`_gravarConsentimentoGPS` 9783 · `_distM` 9791 · `ultimoCheckinHojeTs` 9799 · `meuLive` 9823
`liveAtivo` 9824 · `liveRestanteMs` 9825 · `fmtDuracaoMs` 9826 · `toggleGPS` 9832 · `toggleLive` 9833
`_mostrarConsentimentoGPS` 9840 · `_confirmarConsentimentoGPS` 9853 · `iniciarLive` 9860 · `pararLive` 9895
`_ligarWatchLive` 9907 · `liveRegistrarPonto` 9916 · `_pedirWakeLock` 9940 · `_soltarWakeLock` 9948
`_ligarGuardaLive` 9954 · `retomarLiveSePreciso` 9965 · `salvarPosicao` 9982 · `msgErroGPS` 9988
`updateGPSLabel` 9996 · `liveBlocoHTML` 10004 · `getExecTarefa` 10025 · `renderTarefas` 10028
`renderTarefasGestor` 10033 · `openModalTarefa` 10063 · `salvarTarefa` 10082 · `excluirTarefa` 10099
`verTarefaDetalhe` 10106 · `renderTarefasTecnico` 10129 · `abrirTarefa` 10155 · `voltarTarefa` 10156
`rerenderTarefaExec` 10157 · `renderExecTarefa` 10159 · `setupTarefaCam` 10201 · `tarefaRemoverFoto` 10241
`tarefaSalvarNota` 10254 · `tarefaCheckin` 10262 · `tarefaFinalizarCheckin` 10284 · `abrirMapaCoord` 10303
`tarefaCheckinHoje` 10326 · `concluirTarefa` 10331 · `_lembrarExecucao` 10352 · `_esquecerExecucao` 10356
`_retomarExecucaoSePreciso` 10360 · `abrirExecucao` 10372 · `renderExecucao` 10382 · `switchEquipTab` 10436
`updEquip` 10457 · `onEquipFoto` 10458 · `renderChecklistExec` 10484 · `toggleCheck` 10512
`onCheckFoto` 10521 · `execCheckin` 10536 · `finalizarCheckin` 10558 · `initSigCanvas` 10568
`limparSig` 10580 · `_pendenciasParaConcluir` 10586 · `verificarConcluir` 10610 · `execConcluir` 10625
`saveExecOS` 10643 · `voltarExec` 10644 · `renderManutTecnico` 10647 · `startNotifChecker` 10669
`checkManutencoes` 10695 · `notificarNavegador` 10713 · `enviarEmailManut` 10720 · `enviarSMSManut` 10721
`agendarLonge` 10741 · `cancelarLonge` 10750 · `_pubToken` 10754 · `pubURL` 10759 · `_thumbKey` 10760
`_thumb` 10765 · `pubPayloadOS` 10789 · `pubPayloadObra` 10819 · `publicarAcompanhamento` 10876
`_precisaNovoToken` 10901 · `gerarLinkOS` 10907 · `conferirLinkNoServidor` 10927 · `gerarLinkObra` 10945
`abrirModalLink` 10955 · `revogarLink` 11023 · `emitirEnderecoNovo` 11046 · `marcarLinkEnviado` 11069
`copiarLinkPub` 11078 · `agendarRepublicacao` 11098 · `republicarAtivos` 11103 · `_pubRotaToken` 11126
`_mostrarLinkAntigo` 11134 · `iniciarModoPublico` 11149 · `_pubOuvirToken` 11167 · `renderPublicoErro` 11209
`_pubStatusLbl` 11213 · `renderPublico` 11216 · `pubZoom` 11276 · `_lerMarcaRecarga` 11358
`_marcarRecarga` 11373 · `_campoComTextoNaoSalvo` 11390 · `_porQueNaoRecarregarAgora` 11406
`_recarregarQuandoSeguro` 11437 · `_acenderFaixaVersao` 11472 · `_desenharIconeVersao` 11493
`_medirAvisoVersao` 11508 · `_mostrarMotivoVersao` 11528 · `_devolverBotaoAtualizar` 11537
`_esperarResolve` 11552 · `_apressarAtualizacao` 11565 · `_avisarVersaoNova` 11601
`_avisarVersaoVelhaPorErro` 11614

## Estado de topo de arquivo

`firebaseConfig` 1232 · `fbApp` 1242 · `WORKSPACE` 1243 · `WORKSPACE_RAMO` 1244 · `WORKSPACE_NOME` 1245
`_signupInProgress` 1246 · `SYNC_KEYS` 1262 · `_quietWrite` 1274 · `_bootDone` 1275 · `_lastPushKey` 1276
`_snapshot` 1277 · `IDB_NOME` 1295 · `_idbConn` 1296 · `FOTO_CACHE_MAX` 1380 · `_fotoCache` 1381
`_opsEmVoo` 1407 · `_pintorLigado` 1489 · `DOC_LIMITE_BYTES` 1547 · `DOC_ALERTA_BYTES` 1548
`_falhasEnvio` 1553 · `_falhasLeitura` 1558 · `_chavesQuaseCheias` 1559 · `_versaoNovaDisponivel` 1563
`NOMES_DOC` 1566 · `_rondaNuvem` 1612 · `ITEM_LISTS` 1690 · `LEAF_MAPS` 1692 · `CHAVE_FOTOS` 1702
`FOTOS_PREFIXO` 1705 · `FOTO_OS_PREFIXO` 1720 · `MIGR_IDB_CHAVE` 1878 · `MIGR_IDB_OT_CHAVE` 1961
`FOTO_OBRA_PREFIXO` 2050 · `MIGR_FOTOS_CHAVE` 2193 · `FOTO_TAREFA_PREFIXO` 2219 · `SEP` 2435 · `_pend` 2440
`_localTouch` 2441 · `PUB_KEYS` 2534 · `_avisoMemoriaAberto` 2551 · `_interceptorOk` 2623 · `_pollTimer` 2639
`_enviandoRecuperacao` 2837 · `_tentandoNovamente` 2900 · `RAMO_RESERVADOS` 2944
`RAMO_CHAVES_PERIGOSAS` 2945 · `_prestadorEntrando` 3060 · `_consumindoConvite` 3102 · `_pushTimers` 3159
`APPEND_LISTS` 3161 · `MERGE_MAPS` 3164 · `IMMEDIATE_KEYS` 3166 · `_posicoesPorUid` 3229
`_nomesAmbiguosAvisados` 3233 · `_avisouPosicaoSemUid` 3422 · `_avisouSemPosicaoLocal` 3423
`_proximaTentativaLeitura` 3527 · `_filaSync` 4165 · `fbUnsubs` 4391 · `_avisouSessaoExpirada` 4585
`_fbLogs` 4611 · `tecnicos` 4821 · `AVATAR_IDS` 4834 · `avataresTecnicos` 4835 · `ICONS` 4849
`NAV_ITEMS` 4887 · `VRF_FASES` 4896 · `VRF_TOTAL_ETAPAS` 4908 · `vrfFasesConfig` 4918 · `vrfObras` 4939
`vrfObraAtualId` 4947 · `_mudouNaMigracaoTecVrfObras` 4986 · `vrfProgresso` 5026 · `vrfFotos` 5027
`vrfNotas` 5028 · `vrfRelatorios` 5029 · `vrfCheckins` 5030 · `localizacaoHistorico` 5036 · `tarefas` 5051
`liveTracks` 5053 · `vrfFotosMeta` 5055 · `vrfFloorTab` 5061 · `CHECKLIST_BASE` 5113 · `CHECKLIST_MANUT` 5125
`CHECKLIST_PREDIAL_BASE` 5135 · `CHECKLIST_PREDIAL_MANUT` 5147 · `RAMO_TEMPLATES` 5159
`checklistConfig` 5169 · `PRECO_TEMPLATES` 5216 · `precoConfig` 5243 · `moduloConfig` 5292 · `ETAPAS` 5328
`ETAPA_LBL` 5329 · `session` 5332 · `osList` 5333 · `clientes` 5334 · `manutencoes` 5335 · `settings` 5336
`financeiroNotas` 5337 · `currentView` 5338 · `currentFilter` 5339 · `currentDetailId` 5340
`mapaInstance` 5341 · `mapaMarkers` 5342 · `mapaTrails` 5343 · `_encerrandoPorRemocao` 5636
`_compartilhando` 5679 · `_avalNota` 5733 · `VIEW_META` 5789 · `navbarContexto` 5828 · `_vrfFotoTarget` 6650
`_fotoEmProcessamento` 6683 · `_travaFotoTimer` 6684 · `FOTO_MAX_BYTES` 6688 · `vrfMapaInstance` 7061
`_vrfMissaoAndarIdx` 7248 · `financeiroPeriodo` 7986 · `_reconciliandoEquipe` 8139
`CONVITE_VALIDADE_MS` 8321 · `_timerFecharModal` 8659 · `TOUR_VERSAO` 8685 · `TOUR_GESTOR` 8687
`TOUR_TECNICO` 8701 · `TOUR_VIEWS_GESTOR` 8718 · `TOUR_VIEWS_TECNICO` 8767 · `_tourPassos` 8779
`_tourIndice` 8780 · `_tourResizeHandler` 8781 · `_tourContextoAtual` 8785 · `mapaPainelAberto` 9489
`mapaPainelColapsado` 9490 · `_avatarSvgCache` 9546 · `gpsWatchId` 9762 · `LIVE_DURACAO_MS` 9763
`LIVE_INTERVALO_MS` 9764 · `LIVE_DIST_MIN_M` 9765 · `LIVE_MAX_PONTOS` 9766 · `_liveUltimoReg` 9767
`_liveWakeLock` 9768 · `_liveGuardTimer` 9769 · `GPS_CONSENT_VERSAO` 9773 · `execTarefaId` 10024
`TF_LABEL` 10026 · `execOS` 10344 · `EXEC_ABERTA` 10351 · `sigCtx` 10567 · `PUB_LIMITE_BYTES` 10730
`PUB_VALIDADE_MS` 10733 · `MAX_TIMEOUT_MS` 10740 · `_thumbCache` 10751 · `_pubUltimo` 10752
`_pubTimer` 11097 · `_pubRota` 11282 · `_TINHA_CONTROLADOR` 11330 · `RECARGA_ESPERA_MS` 11331
`RECARGA_CARENCIA_MS` 11332 · `RECARGA_TETO` 11333 · `RECARGA_MARCA` 11334 · `PROCURA_MINIMA_MS` 11335
`BOTAO_ATUALIZAR_TETO_MS` 11336 · `_timerRecarga` 11337 · `_timerBotaoAtualizar` 11338
`_recargaManualPedida` 11339 · `_recargaPedida` 11340 · `_ultimoMotivoAdiado` 11341 · `_ultimaProcura` 11342
`_versaoNovaDetectada` 11351

## Elementos com `id` (primeira ocorrência)

`splashScreen` 967 · `loginScreen` 969 · `loginBox` 972 · `loginTitle` 973 · `loginEmail` 976
`loginPass` 980 · `loginHint` 983 · `linkCriarContaTecnico` 986 · `recuperarBox` 1003 · `recInstrucao` 1006
`recFormulario` 1007 · `recEmail` 1008 · `btnRecuperar` 1009 · `recEnviado` 1014 · `recEmailEco` 1016
`cadastroBox` 1025 · `cadEmpresa` 1028 · `cadRamo` 1030 · `cadRamoOutroWrap` 1037 · `cadRamoOutro` 1037
`cadNome` 1038 · `cadEmail` 1039 · `cadSenha` 1040 · `prestadorBox` 1048 · `prestNome` 1052
`prestEmail` 1053 · `prestSenha` 1054 · `prestCodigo` 1055 · `semAcessoBox` 1060 · `conviteNome` 1064
`conviteCodigo` 1065 · `semAcessoUidWrap` 1071 · `semAcessoUid` 1071 · `pendenteBox` 1076 · `app` 1085
`backdrop` 1086 · `navbar` 1089 · `navbarBtns` 1096 · `fabNovo` 1104 · `floatMenuBackdrop` 1109
`floatMenuOptions` 1110 · `floatMenuBtn` 1111 · `sidebar` 1116 · `navico-splits` 1124 · `navLblSplit` 1124
`navico-vrf` 1127 · `navico-tarefas` 1130 · `navLblTarefas` 1130 · `navico-financeiro` 1133
`navico-config` 1138 · `userAvatar` 1150 · `userName` 1152 · `userRole` 1153 · `mainArea` 1162
`topTitle` 1167 · `topSub` 1168 · `topDate` 1172 · `syncBtn` 1173 · `viewToggle` 1176 · `tgDesktop` 1177
`tgMobile` 1178 · `syncAlerta` 1192 · `contentArea` 1194 · `toast` 1200 · `avisoVersao` 1214
`avisoVersaoIco` 1215 · `avisoVersaoMotivo` 1216 · `avisoVersaoBtn` 1217 · `lightbox` 1220
`lightboxImg` 1220 · `modalRoot` 1223 · `tourRoot` 1226 · `avalNotas` 5742 · `avalTexto` 5746
`osGridContainer` 6194 · `mapaBox` 6324 · `mapaPainelInfo` 6325 · `mapaCardEquipe` 6327
`mapaCardHistorico` 6331 · `vrfTabs` 6493 · `vrfPainel` 6496 · `vrfRespNome` 6500 · `vrfObs` 6501
`vrfCameraInput` 6505 · `vrfNotaTxt` 6798 · `vrfNovaObraNome` 6970 · `vrfNovaObraEndereco` 6971
`vrfMapaBox` 7070 · `vrfNome` 7205 · `vrfEndereco` 7206 · `vrfMeta` 7207 · `vrfAndaresList` 7209
`vrfMissaoTabs` 7259 · `vrfMissaoAndarAtual` 7260 · `vrfMissaoSteps` 7261 · `diagStatus` 7699
`diagTamanhos` 7702 · `diagAparelho` 7704 · `diagLogBody` 7706 · `moduloNome` 7805 · `moduloDesc` 7806
`novaCategoriaPreco` 7940 · `notaPrestador` 8060 · `notaValor` 8061 · `notaObs` 8063 · `finPeriodo` 8111
`finHierarquiaCard` 8123 · `tNome` 8227 · `tUid` 8231 · `modCardSplit` 8236 · `tSplit` 8237
`modCardVrf` 8242 · `tVrf` 8243 · `conviteCodigoInput` 8427 · `curOverlay` 8654 · `tourBackdrop` 8999
`tourSpot` 9000 · `tourCard` 9001 · `oCliente` 9090 · `clientesList` 9091 · `oEndereco` 9092 · `oTipo` 9094
`oTecnico` 9097 · `oData` 9100 · `oHora` 9101 · `oSplits` 9103 · `oObs` 9104 · `notaGestor` 9229
`osValor` 9235 · `osValorStatus` 9236 · `mCliente` 9290 · `mEndereco` 9292 · `mData` 9294 · `mTecnico` 9295
`mTipo` 9298 · `mRecorrencia` 9299 · `mObs` 9301 · `meData` 9390 · `meTipo` 9397 · `meRecorrencia` 9400
`meEndereco` 9405 · `meObs` 9406 · `cNome` 9444 · `cEndereco` 9445 · `cContato` 9446 · `gpsLabel` 9706
`tfNome` 10069 · `tfDesc` 10070 · `tfTec` 10071 · `tfMax` 10072 · `tfNotas` 10074 · `tarefaNota` 10166
`btnTarefaCheckin` 10177 · `tarefaCamInput` 10190 · `coordMapaBox` 10307 · `equipPanelArea` 10404
`checklistArea` 10411 · `sigCanvas` 10418 · `pendConcluir` 10422 · `btnConcluir` 10423 · `pubLinkInput` 10997
`pubZoom` 11274 · `pubZoomImg` 11274

## Classes CSS (onde são declaradas)

`.logo-img` 70 · `.splash-img` 73 · `.login-logo-wrap` 78 · `.login-logo-img` 79 · `.login-box` 81
`.login-field` 83 · `.btn-entrar` 89 · `.login-hint` 92 · `.sidebar` 101 · `.sidebar-header` 102
`.sidebar-logo-img` 103 · `.sidebar-nav` 105 · `.nav-section-label` 106 · `.nav-item` 107 · `.nav-ico` 111
`.nav-badge` 112 · `.sidebar-footer` 114 · `.sidebar-user` 115 · `.user-avatar` 116 · `.user-meta` 117
`.btn-sair` 120 · `.main` 128 · `.topbar` 130 · `.topbar-left` 131 · `.btn-hamburger` 132
`.topbar-title` 133 · `.topbar-sub` 134 · `.topbar-right` 135 · `.topbar-date` 136 · `.view-toggle` 138
`.content` 142 · `.view` 151 · `.page-head` 156 · `.page-title` 157 · `.page-desc` 158 · `.btn` 160
`.btn-primary` 161 · `.btn-gold` 163 · `.btn-ghost` 165 · `.btn-danger` 167 · `.btn-sm` 169
`.stats-grid` 173 · `.stat` 174 · `.stat-label` 180 · `.stat-num` 181 · `.two-col` 184 · `.card` 186
`.card-pad` 187 · `.card-head` 190 · `.filters` 194 · `.fbtn` 195 · `.os-grid` 199 · `.os-card` 200
`.os-card-top` 207 · `.os-client` 208 · `.os-addr` 209 · `.badge` 211 · `.b-pendente` 213 · `.b-andamento` 214
`.b-concluida` 215 · `.b-atrasada` 216 · `.b-revisao` 217 · `.os-meta` 219 · `.os-meta-i` 220 · `.etapas` 223
`.etapa` 224 · `.etapa-bar` 225 · `.etapa-lbl` 228 · `.empty` 232 · `.tech-row` 237 · `.tech-av` 239
`.tech-info` 240 · `.tech-nm` 241 · `.tech-st` 242 · `.tech-live` 243 · `.tech-off` 244 · `.fg` 247
`.frow` 252 · `.overlay` 255 · `.modal` 257 · `.modal-head` 259 · `.modal-body` 261 · `.modal-foot` 266
`.toast` 269 · `.lightbox` 276 · `.leaflet-container` 282 · `.vrf-placeholder` 285 · `.set-row` 291
`.set-info` 293 · `.switch` 295 · `.slider` 297 · `.ico` 303 · `.ico-sm` 304 · `.ico-lg` 305 · `.navbar` 308
`.navbar-logo` 309 · `.navbtn` 311 · `.navbtn-lbl` 316 · `.navbtn-badge` 317 · `.navbar-spacer` 318
`.navbtn-menu` 319 · `.float-menu-btn` 338 · `.float-menu-options` 344 · `.float-menu-opt` 346
`.fmo-lbl` 352 · `.float-menu-backdrop` 355 · `.fab` 358 · `.mod-grid` 403 · `.mod-card` 404 · `.chk-item` 417
`.chk-row` 419 · `.chk-cam` 420 · `.chk-arrow` 421 · `.chk-foto` 423 · `.bemvindo` 427 · `.bv-hero` 428
`.bv-title` 429 · `.bv-sub` 430 · `.bv-cards` 431 · `.bv-card` 432 · `.bv-card-ico` 434 · `.bv-card-name` 436
`.bv-card-desc` 437 · `.bv-card-go` 438 · `.bv-links` 441 · `.bv-link` 442 · `.vrf-dash-card` 446
`.vrf-dash-left` 448 · `.vrf-dash-tag` 449 · `.vrf-dash-nome` 451 · `.vrf-dash-meta` 452 · `.vrf-dash-pct` 453
`.vrf-dash-go` 454 · `.vrf-rel-resumo` 462 · `.vrf-rel-resumo-info` 464 · `.vrf-rel-resumo-go` 467
`.vrf-checkin-card` 471 · `.vrf-ci-ico` 473 · `.vrf-ci-info` 475 · `.vrf-checkin-item` 479
`.vrf-ci-badge` 481 · `.vrf-ci-item-info` 483 · `.vrf-missao-tabs` 488 · `.fbtn-badge` 491
`.vrf-missao-andar-atual` 492 · `.vrf-mis-grupo` 497 · `.vrf-mis-grupo-head` 498 · `.vrf-fotos-grid` 502
`.vrf-foto-card` 503 · `.vrf-foto-cap` 506 · `.vrf-foto-prest` 507 · `.vrf-foto-etapa` 509
`.vrf-foto-fase` 510 · `.vrf-foto-nota` 511 · `.vrf-andar-lista` 519 · `.vrf-andar-lista-card` 520
`.vrf-al-top` 522 · `.vrf-al-nome` 523 · `.vrf-al-pct` 524 · `.vrf-al-meta` 525 · `.vrf-al-abrir` 528
`.vrf-section-label` 532 · `.vrf-hero` 533 · `.vrf-hero-label` 535 · `.vrf-hero-pct` 536
`.vrf-hero-ring` 538 · `.vrf-hero-ring-in` 539 · `.vrf-hero-meta` 541 · `.vrf-floors` 544
`.vrf-floor-card` 545 · `.vrf-fc-head` 547 · `.vrf-fc-name` 548 · `.vrf-fc-pct` 549 · `.vrf-fc-meta` 550
`.vrf-bar` 554 · `.vrf-bar-fill` 555 · `.vrf-rel-item` 557 · `.vrf-rel-data` 559 · `.vrf-rel-info` 560
`.vrf-rel-pct` 562 · `.modal-wide` 565 · `.vrf-andar-prog` 566 · `.vrf-fase` 567 · `.vrf-fase-head` 568
`.vrf-fase-pct` 569 · `.vrf-fase-etapas` 570 · `.vrf-etapa` 571 · `.vrf-etapa-row` 573 · `.vrf-etapa-chk` 574
`.vrf-etapa-lbl` 576 · `.vrf-etapa-fotos` 577 · `.vrf-etapa-nota` 579 · `.vrf-etapa-gallery` 580
`.vrf-andar-row` 584 · `.vrf-andar-del` 586 · `.vrf-mfase` 590 · `.vrf-mfase-head` 591 · `.vrf-mstep` 592
`.vrf-mstep-chk` 595 · `.vrf-tec-bar` 599 · `.vrf-tec-bar-top` 600 · `.vrf-tec-pct` 601 · `.vrf-tabs` 603
`.vrf-tab` 605 · `.vrf-phase` 612 · `.vrf-ph` 613 · `.vrf-ph-num` 614 · `.vrf-ph-name` 615
`.vrf-ph-count` 616 · `.vrf-steps` 617 · `.vrf-step` 618 · `.vrf-step-box` 621 · `.vrf-step-ck` 622
`.vrf-step-body` 624 · `.vrf-step-txt` 625 · `.vrf-mdot` 626 · `.vrf-step-note` 627 · `.vrf-step-photos` 629
`.vrf-step-acts` 631 · `.vrf-act` 632 · `.vrf-act-badge` 635 · `.vrf-step-expand` 638 · `.vrf-step-prompt` 640
`.vrf-step-ebtns` 642 · `.vrf-ebtn` 643 · `.vrf-mis-card` 649 · `.vrf-mis-hdr` 650 · `.vrf-mis-title` 651
`.vrf-mis-badge` 653 · `.vrf-mis-desc` 654 · `.vrf-mis-stats` 655 · `.vrf-mis-steps` 656 · `.vrf-mis-step` 657
`.vrf-mis-chk` 659 · `.vrf-mis-txt` 661 · `.vrf-mis-fase` 662 · `.vrf-envio` 665 · `.btn-block` 666
`.statusbar-fill` 673 · `.backdrop` 674 · `.sync-btn` 694 · `.diag-status` 702 · `.diag-log` 703
`.diag-row` 704 · `.diag-dot` 706 · `.diag-hora` 712 · `.diag-msg` 713 · `.diag-empty` 714 · `.pend-box` 716
`.pend-titulo` 717 · `.pend-lista` 718 · `.pend-resto` 719 · `.diag-tam` 721 · `.diag-tam-nome` 723
`.diag-tam-kb` 724 · `.diag-barra` 725 · `.sync-alerta` 731 · `.sync-alerta-ico` 735 · `.sync-alerta-txt` 736
`.sync-alerta-acao` 737 · `.versao-nova` 763 · `.versao-nova-ico` 774 · `.versao-nova-txt` 775
`.versao-nova-motivo` 780 · `.versao-nova-btn` 785 · `.versao-nova-spin` 789 · `.tf-item` 823 · `.tf-top` 824
`.tf-nome` 825 · `.tf-status` 826 · `.tf-desc` 830 · `.tf-meta` 831 · `.tf-acts` 834 · `.tf-fotos-grid` 835
`.tf-foto` 836 · `.tf-foto-x` 838 · `.tf-checkin-hist` 839 · `.tf-checkin-dia` 840 · `.live-dot` 844
`.live-status` 845 · `.live-status-txt` 846 · `.live-hint` 849 · `.mk-live` 850 · `.avatar-marker` 855
`.avatar-marker-svg` 856 · `.avatar-marker-tag` 857 · `.avatar-andando` 860 · `.mapa-painel` 864
`.mapa-painel-head` 865 · `.mapa-painel-acoes` 866 · `.mapa-painel-btn` 867 · `.mapa-painel-body` 869
`.pub-link-box` 872 · `.foto-ausente` 880 · `.foto-mini` 881 · `.foto-mini-wrap` 882 · `.foto-mini-dica` 883
`.pub-token-fim` 885 · `.pub-top` 890 · `.pub-top-in` 891 · `.pub-marca` 892 · `.pub-marca-n` 893
`.pub-marca-s` 894 · `.pub-live` 895 · `.pub-wrap` 897 · `.pub-load` 898 · `.pub-erro` 899 · `.pub-card` 902
`.pub-sub` 904 · `.pub-pill` 905 · `.pub-info` 908 · `.pub-prog-l` 909 · `.pub-prog-bar` 911 · `.pub-fase` 913
`.pub-fase-h` 914 · `.pub-fase-bar` 917 · `.pub-et` 919 · `.pub-et-top` 922 · `.pub-et-mk` 923
`.pub-et-lbl` 926 · `.pub-et-nota` 927 · `.pub-et-img` 928 · `.pub-et-mais` 929 · `.pub-nota-corte` 930
`.pub-foot` 931 · `.pub-zoom` 932 · `.tour-backdrop` 937 · `.tour-spot` 938 · `.tour-card` 939
`.tour-dots` 942 · `.tour-dot` 943 · `.tour-foot` 945 · `.tour-foot-right` 946 · `.tour-skip` 947
`.tour-back` 949 · `.tour-next` 951 · `.btn-tour` 953
