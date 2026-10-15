<!-- GERADO POR ferramentas/gerar-mapa.js — NÃO EDITAR À MÃO. Regenere com: npm run mapa -->

# Mapa do `index.html`

`index.html` tem **12.561 linhas** e **788 KB** — ler o arquivo inteiro custa ~230 mil tokens. Este mapa custa uma fração disso e diz **onde** cada coisa está.

**Como usar:** ache o nome aqui, pegue a linha, e abra só o trecho (`sed -n '1200,1260p' index.html`). Nunca leia o arquivo inteiro para localizar algo.

**O que este mapa NÃO faz:** ele não diz o que o código faz. Decidir pelo mapa sem abrir a função é pior que deduzir a partir do código — é deduzir sem nem ter lido.

| | |
|---|---|
| Funções | 562 |
| Estado de topo (`const`/`let`) | 174 |
| Elementos com `id` | 163 |
| Classes CSS | 337 |
| Seções do arquivo | 23 |

## Seções, na ordem do arquivo

`LOGIN / SPLASH` 67 · `SPLASH DE ENTRADA + LOGO OFICIAL` 69 · `APP SHELL` 96 · `COMPONENTES` 155
`ÍCONES SVG (Feather-style, contorno)` 302 · `BARRA DE NAVEGAÇÃO — DESKTOP (rail vertical à esquerda)` 307
`DESKTOP LIMPO: esconde a rail lateral, sidebar única` 327 · `BARRA DE NAVEGAÇÃO — MOBILE (inferior fixa)` 360
`MODO MOBILE FORÇADO (toggle no desktop)` 383 · `BOAS-VINDAS + DASHBOARD CENTRAL` 426
`VRF — painel do gestor` 531 · `VRF — checklist do prestador` 598
`TUTORIAL GUIADO (coach-marks/spotlight) — Story 17` 936 · `VRF — estrutura de dados de obra` 4984
`HOME DO TÉCNICO — boas-vindas ou resumo do que tem em andamento` 5529 · `DASHBOARD` 6249 · `ORDENS` 6390
`CLIENTES` 6445 · `MANUTENÇÕES` 6534 · `MAPA` 6565 · `SPLITS` 6616 · `VRF (placeholder pra integração)` 6644
`CONFIG` 7896

## Funções, agrupadas pela seção onde vivem

**TUTORIAL GUIADO (coach-marks/spotlight) — Story 17**

`ramoTemVRF` 1259 · `_idbAbrir` 1335 · `_idbTx` 1350 · `idbGravarFoto` 1364 · `idbLerFoto` 1367
`idbApagarFoto` 1370 · `idbTodasAsChaves` 1373 · `espacoDoAparelho` 1378 · `_ehReferenciaDeFoto` 1410
`_cachePor` 1420 · `_opsEmVooTotal` 1446 · `_opEmVooNome` 1447 · `_abrirOp` 1448 · `_fecharOp` 1449
`_emVoo` 1456 · `guardarFotoNoAparelho` 1475 · `fotoBytes` 1487 · `imgFoto` 1517 · `_pintarUma` 1528
`pintarFotos` 1563 · `ligarPintorDeFotos` 1568 · `_bytesDe` 1587 · `_nomeAmigavel` 1627 · `_nomeDoAndar` 1632
`_semNuvem` 1645 · `_vigiarConexao` 1655 · `_atualizarAlertaSync` 1662 · `_docDoAndar` 1756
`_ehDocDeFotos` 1757 · `_fotoOSDoc` 1771 · `_ehDocFotoOS` 1774 · `_camposFotoOS` 1780 · `_separarFotosOS` 1793
`_resolverFotosOS` 1820 · `_valorFotoDe` 1870 · `_preservarFotosNoMerge` 1889 · `_reancorarConversoesOS` 1943
`migrarFotosParaOArmazem` 1962 · `migrarFotosObraETarefaParaOArmazem` 2012 · `_fotosJaEnviadas` 2066
`_esquecerEnvio` 2072 · `_marcarFotoEnviada` 2081 · `_idFotoPorConteudo` 2106 · `_idFotoObra` 2115
`_ehDocFotoObra` 2116 · `_ehFotoDeVerdade` 2119 · `_separarFotosAndar` 2122 · `_resolverFotosAndar` 2147
`_apagarAndarNaNuvem` 2216 · `_migracaoFotosPendente` 2244 · `_marcarMigracaoFotos` 2247
`_idFotoTarefa` 2270 · `_ehDocFotoTarefa` 2271 · `_chaveFotoTarefa` 2275 · `_readicionarFotoTarefa` 2294
`_separarFotosTarefa` 2311 · `_resolverFotosTarefa` 2341 · `_preservarFotosTarefaNoMerge` 2408
`_mesclarAndar` 2470 · `_saveTouch` 2496 · `_pendDe` 2506 · `_temPend` 2507 · `_arr` 2509 · `_obj` 2510
`_porId` 2511 · `_setLocalQuiet` 2514 · `_anotarPendentes` 2533 · `_detectarMudancasNaoVistas` 2566
`_marcarAlteracaoLocal` 2577 · `_ehErroDeCota` 2589 · `_fecharAvisoMemoria` 2602 · `_avisarMemoriaCheia` 2603
`_testInterceptor` 2674 · `_startPolling` 2690 · `fbInit` 2717 · `_resolverWorkspace` 2768
`_cacheWorkspace` 2809 · `_lerCacheWorkspace` 2812 · `_aplicarSessaoResolvida` 2820 · `_mostrarBoxLogin` 2865
`mostrarLogin` 2870 · `mostrarCadastroEmpresa` 2871 · `mostrarPrestadorBox` 2872
`mostrarRecuperarSenha` 2875 · `enviarRecuperacaoSenha` 2895 · `_mostrarSemAcesso` 2935
`_mostrarUidManual` 2946 · `_mostrarPendente` 2951 · `_tentarNovamenteAcesso` 2958 · `_sairSemAcesso` 2967
`_slugify` 2972 · `_gerarSufixoWs` 2982 · `_ramoCustomInvalido` 3003 · `_mensagemErroAuth` 3013
`cadastrarEmpresa` 3024 · `prestadorEntrar` 3118 · `_consumirConviteTecnico` 3165 · `fbPush` 3230
`_gravarMesclado` 3242 · `_nomeDoUid` 3302 · `_guardarPosicaoDeUid` 3329 · `_semVazios` 3335
`_meuCorpoPosicao` 3342 · `_supremaciaPorUid` 3367 · `_remontarPosicoes` 3385
`_agendarEnvioDaMinhaPosicao` 3434 · `_aplicarPosicaoDeUid` 3447 · `_limparEstadoDePosicao` 3456
`_registrarFalhaPosicao` 3471 · `_pushMinhaPosicao` 3498 · `_pullPosicoes` 3577
`_retentarLeituraPosicoes` 3598 · `_pushFotosPorAndar` 3608 · `_confirmarEnvioAndar` 3722
`_pushOSSemFotos` 3736 · `_pushTarefasSemFotos` 3809 · `_doPush` 3904 · `_doPushAgora` 3911
`_mergeLista` 3990 · `_mergeItens` 4005 · `_mergeLeafs` 4029 · `_confirmarEnvio` 4048 · `_mergeMapa` 4080
`_reancorarExecOS` 4098 · `_execucaoAberta` 4107 · `_aplicarNaMemoria` 4110 · `_ehChaveDeSync` 4154
`_aplicarShardFotos` 4160 · `_aplicarLegadoFotos` 4192 · `_limparPubVazados` 4217 · `_naFilaSync` 4241
`_aplicarOSComFotos` 4253 · `_aplicarListaOS` 4263 · `_aplicarTarefasComFotos` 4285 · `fbApply` 4307
`fbOnRemoteChange` 4393 · `fbStartListeners` 4463 · `_vigiarMembership` 4522 · `_remoteMs` 4537
`fbStopListeners` 4543 · `fbPullAll` 4546 · `fbSeedFromLocal` 4565 · `initSync` 4600 · `_semAutenticacao` 4629
`_voltarAoLogin` 4662 · `fbBoot` 4672 · `fbLog` 4685 · `renderDiagTamanhos` 4696 · `renderDiagAparelho` 4779
`renderDebugLogs` 4823 · `syncManual` 4836 · `saveTecnicos` 4900 · `nomesTecnicos` 4901 · `getTecnico` 4902
`avatarDoTecnico` 4914 · `setMeuAvatar` 4915 · `svgIco` 4973

**VRF — estrutura de dados de obra**

`saveVrfFasesConfig` 5008 · `_garantirVrfFasesConfig` 5009 · `vrfFasesAtuais` 5015
`vrfTotalEtapasAtuais` 5018 · `vrfObraAtual` 5037 · `vrfResolverObraAtual` 5043 · `_vrfPertenceObra` 5060
`_vrfPertenceObraAtual` 5061 · `_novoIdAndar` 5064 · `_novoIdObra` 5065 · `vrfObrasDoTecnico` 5086
`vrfObrasPermitidas` 5092 · `vrfTemAtividadeObras` 5099 · `vrfProgGeralObras` 5102
`_vrfResumoDashObras` 5107 · `registrarHistoricoLocalizacao` 5126 · `saveTarefas` 5141 · `saveLive` 5143
`saveVrfFotosMeta` 5145 · `vrfFotoPrestador` 5146 · `vrfMissaoAndar` 5162 · `vrfMissaoTotal` 5163
`vrfMissaoInclui` 5164 · `saveVrfObra` 5166 · `saveVrfProgresso` 5167 · `saveVrfFotos` 5168
`saveVrfNotas` 5169 · `vrfProgAndar` 5172 · `vrfProgObra` 5181 · `vrfProgGeral` 5191 · `vrfProgFase` 5192
`vrfCorProg` 5198 · `saveChecklistConfig` 5259 · `_fallbackChecklistRamo` 5269 · `ehManutencao` 5275
`checklistDoTipo` 5276 · `corrigirChecklistSeVazio` 5284 · `savePrecoConfig` 5333 · `_fallbackPrecoRamo` 5340
`_garantirPrecoConfig` 5347 · `_precoCfgExibicao` 5351 · `_normTipo` 5354 · `valorDoTipo` 5359
`_moduloDefaultParaRamo` 5377 · `saveModuloConfig` 5382 · `_fallbackModuloRamo` 5385
`_garantirModuloConfig` 5391 · `moduloSplitAtual` 5398 · `_aplicarModuloVocabulario` 5405 · `saveOS` 5435
`saveClientes` 5436 · `saveManut` 5437 · `saveSettings` 5438 · `saveSession` 5439 · `saveFinanceiroNotas` 5440
`fazerLogin` 5446 · `entrarApp` 5461

**HOME DO TÉCNICO — boas-vindas ou resumo do que tem em andamento**

`renderTecnicoHome` 5530 · `injetarIcones` 5627 · `getNavItems` 5639 · `montarNavbar` 5680
`montarFloatMenu` 5695 · `floatMenuNav` 5706 · `toggleFloatMenu` 5712 · `_encerrarPorAcessoRemovido` 5726
`logout` 5746 · `compartilharApp` 5769 · `abrirAvaliarApp` 5823 · `_renderAvalNotas` 5843
`_setAvalNota` 5848 · `enviarFeedbackApp` 5853 · `nav` 5897 · `ajustarNavbarContexto` 5918
`openSidebar` 5927 · `closeSidebar` 5928 · `setView` 5931 · `toast` 5951 · `fmtDate` 5961 · `fmtMoeda` 5962
`_parseMoeda` 5968 · `escapeHtml` 5993 · `escJsAttr` 6003 · `_ehHostDeMapa` 6013 · `_podarFimDaUrl` 6035
`urlDeMapaNoTexto` 6048 · `abrirMapaDaOS` 6069 · `_btnMapaOS` 6096 · `hoje` 6100 · `openLightbox` 6104
`toggleChkFoto` 6116 · `closeLightbox` 6122 · `updateDate` 6123 · `statusReal` 6124 · `etapaAtual` 6125
`aplicarMenuTecnico` 6139 · `_renderViewConteudo` 6152 · `renderView` 6230 · `atualizarBadges` 6235

**DASHBOARD**

`vrfTemAtividade` 6252 · `_vrfResumoDash` 6258 · `renderBemVindoGestor` 6261 · `cardVRFdash` 6291
`renderDashboard` 6312 · `renderEquipeMini` 6365 · `renderManutMini` 6377

**ORDENS**

`renderOrdens` 6391 · `setFilter` 6403 · `renderOSGrid` 6405 · `osCardHTML` 6418

**CLIENTES**

`renderClientes` 6446

**MANUTENÇÕES**

`renderManutencoes` 6535 · `manutCardHTML` 6547

**MAPA**

`renderMapa` 6566 · `renderHistoricoLocalizacao` 6602

**SPLITS**

`renderSplits` 6617

**VRF (placeholder pra integração)**

`renderVRF` 6645 · `vrfCheckinHoje` 6652 · `vrfCardCheckin` 6656 · `vrfFazerCheckin` 6676
`vrfSalvarCheckin` 6695 · `renderVRFtecnico` 6712 · `vrfMissaoProgresso` 6772 · `vrfSetTab` 6781
`vrfRenderMissaoPainel` 6790 · `vrfRenderAndarPainel` 6835 · `vrfToggleTec` 6888 · `vrfAtualizarTabs` 6900
`vrfAbrirCamera` 6914 · `_assinaturaComprimida` 6925 · `vrfComprimirImagem` 6953 · `vrfSetupCamera` 7014
`vrfAbrirNota` 7056 · `vrfSalvarNota` 7068 · `vrfVerFoto` 7079 · `vrfExcluirFoto` 7092
`vrfEnviarRelatorio` 7102 · `renderVRFgestor` 7111 · `renderVRFobras` 7197 · `renderVRFsemAcesso` 7225
`vrfNovaObraModal` 7229 · `vrfCriarObra` 7241 · `vrfSelecionarObra` 7263 · `renderVRFandares` 7274
`renderVRFrelatorios` 7308 · `renderVRFmapa` 7325 · `initVRFmapa` 7348 · `vrfCentralizarMapa` 7376
`renderVRFfotos` 7381 · `vrfVerFotoDetalhe` 7418 · `vrfMissaoResumo` 7440 · `vrfConfigObra` 7459
`vrfAddAndar` 7481 · `vrfRemoverAndar` 7485 · `vrfRenomearAndar` 7497 · `vrfSalvarObra` 7498
`vrfConfigMissao` 7512 · `vrfMissaoTab` 7532 · `vrfRenderMissaoSteps` 7537 · `vrfToggleMissao` 7556
`vrfSalvarMissao` 7570 · `vrfAbrirAndar` 7577 · `vrfToggleEtapa` 7622 · `carregarJsPDF` 7633
`exportarPDFos` 7651 · `gerarPDFos` 7661 · `vrfExportarPDF` 7772 · `gerarPDFandar` 7785

**CONFIG**

`renderConfig` 7897 · `toggleSet` 7973 · `setField` 7974 · `_templateRamoFallback` 7989
`_garantirChecklistConfig` 7997 · `_checklistCfgExibicao` 8001 · `renderChecklistConfig` 8004
`editarItemChecklist` 8023 · `removerItemChecklist` 8034 · `adicionarItemChecklist` 8043
`renderModuloConfig` 8064 · `salvarModuloConfig` 8072 · `renderVrfFasesConfig` 8097 · `editarEtapaVrf` 8119
`removerEtapaVrf` 8135 · `adicionarEtapaVrf` 8169 · `renderPrecoConfig` 8190 · `editarPrecoCategoria` 8207
`removerPrecoCategoria` 8218 · `adicionarPrecoCategoria` 8225 · `setFinanceiroPeriodo` 8250
`_dentroDoPeriodo` 8251 · `_rotuloPeriodo` 8262 · `financeiroResumo` 8266 · `renderFinanceiroHierarquia` 8283
`renderFinanceiroNotas` 8317 · `removerNotaFinanceira` 8338 · `adicionarNotaFinanceira` 8349
`renderFinanceiro` 8368 · `_reconciliarEquipe` 8403 · `renderEquipeConfig` 8448 · `openModalTecnico` 8483
`_vincularAcessoTecnico` 8542 · `_gerarCodigoConvite` 8563 · `_conviteExpirado` 8585
`gerarConviteTecnico` 8589 · `revogarConviteTecnico` 8635 · `_revogarConviteSeExistir` 8663
`_mostrarModalConvite` 8680 · `_copiarConviteCodigo` 8702 · `_atualizarNomeMembro` 8721
`_renomearTecnicoEmDados` 8742 · `salvarTecnico` 8760 · `removerTecnico` 8823 · `toggleModuloTec` 8866
`toggleObraTec` 8893 · `emptyState` 8910 · `diasAte` 8911 · `getTecnicoLoc` 8912 · `showModal` 8917
`closeModal` 8923 · `_temTourVisto` 9051 · `_gravarTourVisto` 9060 · `_temTourViewVisto` 9071
`_gravarTourViewVisto` 9077 · `_tourAlvoCandidatos` 9100 · `_tourElExiste` 9104
`_tourAdiarReposicaoAposAbrirSidebar` 9120 · `_tourAdiarReposicaoAposAbrirFloatMenu` 9137
`_tourElVisivel` 9157 · `_tourExisteProximoVisivel` 9188 · `_tourExisteAnteriorVisivel` 9192
`_tourIniciar` 9197 · `_tourIniciarView` 9208 · `_tourEntrarView` 9225 · `_tourAvancar` 9243
`_tourMostrarPasso` 9252 · `_tourReposicionar` 9299 · `_tourFechar` 9325 · `openModalOS` 9349 · `criarOS` 9375
`_selectTecnicoReatribuir` 9419 · `reatribuirOS` 9434 · `openDetalhe` 9445 · `salvarNota` 9536
`salvarValorOS` 9540 · `excluirOS` 9551 · `revisarOS` 9552 · `openModalManut` 9555 · `criarManut` 9580
`salvarManutEdicao` 9603 · `_reofereceAgenda` 9634 · `openModalManutEdit` 9653 · `excluirManut` 9690
`concluirManut` 9691 · `criarOSdeManut` 9702 · `agendarProximaManut` 9707 · `_clienteUniao` 9714
`_normNome` 9731 · `_clienteNomeEmUso` 9742 · `_clienteGrafias` 9758 · `_clienteNomeEmUsoAoCriar` 9780
`openModalCliente` 9797 · `_clienteContagem` 9815 · `_confirmarFusaoCliente` 9825 · `_avisarFalhaCliente` 9841
`_aplicarCliente` 9871 · `criarCliente` 9954 · `_clienteFixado` 10006 · `menuCliente` 10010
`selecionarVariosClientes` 10058 · `excluirCliente` 10069 · `fixarCliente` 10111
`openHistoricoCliente` 10152 · `abrirGoogleAgenda` 10181 · `_painelMapaConteudoHtml` 10205
`_renderPainelMapa` 10230 · `abrirPainelMapa` 10247 · `fecharPainelMapa` 10253
`toggleColapsoPainelMapa` 10254 · `_carregarAvatarSvg` 10260 · `_avatarMarkerHtml` 10277 · `initMapa` 10287
`atualizarMarcadores` 10297 · `loadLeaflet` 10379 · `renderTecnicoApp` 10400 · `meuAvatarBtnLabel` 10427
`abrirEscolhaAvatar` 10430 · `escolherMeuAvatar` 10447 · `secTec` 10454 · `afterTecnicoRender` 10467
`_temConsentimentoGPS` 10487 · `_gravarConsentimentoGPS` 10496 · `_distM` 10504 · `ultimoCheckinHojeTs` 10512
`meuLive` 10536 · `liveAtivo` 10537 · `liveRestanteMs` 10538 · `fmtDuracaoMs` 10539 · `toggleGPS` 10545
`toggleLive` 10546 · `_mostrarConsentimentoGPS` 10553 · `_confirmarConsentimentoGPS` 10566
`iniciarLive` 10573 · `pararLive` 10608 · `_ligarWatchLive` 10620 · `liveRegistrarPonto` 10629
`_pedirWakeLock` 10653 · `_soltarWakeLock` 10661 · `_ligarGuardaLive` 10667 · `retomarLiveSePreciso` 10678
`salvarPosicao` 10695 · `msgErroGPS` 10701 · `updateGPSLabel` 10709 · `liveBlocoHTML` 10717
`getExecTarefa` 10738 · `renderTarefas` 10741 · `renderTarefasGestor` 10746 · `openModalTarefa` 10776
`salvarTarefa` 10795 · `excluirTarefa` 10812 · `verTarefaDetalhe` 10819 · `renderTarefasTecnico` 10842
`abrirTarefa` 10868 · `voltarTarefa` 10869 · `rerenderTarefaExec` 10870 · `renderExecTarefa` 10872
`setupTarefaCam` 10914 · `tarefaRemoverFoto` 10954 · `tarefaSalvarNota` 10967 · `tarefaCheckin` 10975
`tarefaFinalizarCheckin` 10997 · `abrirMapaCoord` 11016 · `tarefaCheckinHoje` 11039 · `concluirTarefa` 11044
`_lembrarExecucao` 11065 · `_esquecerExecucao` 11069 · `_retomarExecucaoSePreciso` 11073
`abrirExecucao` 11085 · `renderExecucao` 11095 · `switchEquipTab` 11149 · `updEquip` 11170
`onEquipFoto` 11171 · `renderChecklistExec` 11197 · `toggleCheck` 11225 · `onCheckFoto` 11234
`execCheckin` 11249 · `finalizarCheckin` 11271 · `initSigCanvas` 11281 · `limparSig` 11293
`_pendenciasParaConcluir` 11299 · `verificarConcluir` 11323 · `execConcluir` 11338 · `saveExecOS` 11356
`voltarExec` 11357 · `renderManutTecnico` 11360 · `startNotifChecker` 11382 · `checkManutencoes` 11408
`notificarNavegador` 11426 · `enviarEmailManut` 11433 · `enviarSMSManut` 11434 · `agendarLonge` 11454
`cancelarLonge` 11463 · `_pubToken` 11467 · `pubURL` 11472 · `_thumbKey` 11473 · `_thumb` 11478
`pubPayloadOS` 11502 · `pubPayloadObra` 11532 · `publicarAcompanhamento` 11589 · `_precisaNovoToken` 11614
`gerarLinkOS` 11620 · `conferirLinkNoServidor` 11640 · `gerarLinkObra` 11658 · `abrirModalLink` 11668
`revogarLink` 11736 · `emitirEnderecoNovo` 11759 · `marcarLinkEnviado` 11782 · `copiarLinkPub` 11791
`agendarRepublicacao` 11811 · `republicarAtivos` 11816 · `_pubRotaToken` 11839 · `_mostrarLinkAntigo` 11847
`iniciarModoPublico` 11866 · `_pubOuvirToken` 11888 · `renderPublicoErro` 11930 · `_pubStatusLbl` 11934
`renderPublico` 11937 · `pubZoom` 11997 · `_lerMarcaRecarga` 12093 · `_marcarRecarga` 12108
`_campoComTextoNaoSalvo` 12125 · `_porQueNaoRecarregarAgora` 12141 · `_recarregarQuandoSeguro` 12191
`_motivoParaPessoa` 12241 · `_pedidoDaFaixa` 12259 · `_logFaixa` 12267 · `_recarregarPorFaltaDeNuvem` 12281
`_tentarDeNovoPelaFaixa` 12313 · `_acenderFaixaVersao` 12343 · `_desenharIconeVersao` 12364
`_medirAvisoVersao` 12379 · `_mostrarMotivoVersao` 12399 · `_devolverBotaoAtualizar` 12408
`_esperarResolve` 12424 · `_apressarAtualizacao` 12438 · `_avisarVersaoNova` 12474
`_avisarVersaoVelhaPorErro` 12487

## Estado de topo de arquivo

`firebaseConfig` 1232 · `fbApp` 1242 · `WORKSPACE` 1243 · `WORKSPACE_RAMO` 1244 · `WORKSPACE_NOME` 1245
`_signupInProgress` 1246 · `SYNC_KEYS` 1262 · `POSICAO_KEYS` 1308 · `KEYS_VIGIADAS` 1309 · `_quietWrite` 1312
`_bootDone` 1313 · `_lastPushKey` 1314 · `_snapshot` 1315 · `IDB_NOME` 1333 · `_idbConn` 1334
`FOTO_CACHE_MAX` 1418 · `_fotoCache` 1419 · `_opsEmVoo` 1445 · `_pintorLigado` 1527 · `DOC_LIMITE_BYTES` 1585
`DOC_ALERTA_BYTES` 1586 · `_falhasEnvio` 1591 · `_falhasLeitura` 1596 · `_chavesQuaseCheias` 1597
`_versaoNovaDisponivel` 1601 · `NOMES_DOC` 1604 · `_rondaNuvem` 1654 · `ITEM_LISTS` 1740 · `LEAF_MAPS` 1742
`CHAVE_FOTOS` 1752 · `FOTOS_PREFIXO` 1755 · `FOTO_OS_PREFIXO` 1770 · `MIGR_IDB_CHAVE` 1928
`MIGR_IDB_OT_CHAVE` 2011 · `FOTO_OBRA_PREFIXO` 2100 · `MIGR_FOTOS_CHAVE` 2243 · `FOTO_TAREFA_PREFIXO` 2269
`SEP` 2485 · `_pend` 2490 · `_localTouch` 2491 · `PUB_KEYS` 2584 · `_avisoMemoriaAberto` 2601
`_interceptorOk` 2673 · `_pollTimer` 2689 · `_enviandoRecuperacao` 2894 · `_tentandoNovamente` 2957
`RAMO_RESERVADOS` 3001 · `RAMO_CHAVES_PERIGOSAS` 3002 · `_prestadorEntrando` 3117 · `_consumindoConvite` 3159
`_pushTimers` 3216 · `APPEND_LISTS` 3218 · `MERGE_MAPS` 3226 · `IMMEDIATE_KEYS` 3228 · `_posicoesPorUid` 3297
`_nomesAmbiguosAvisados` 3301 · `_avisouPosicaoSemUid` 3492 · `_avisouSemPosicaoLocal` 3493
`_proximaTentativaLeitura` 3597 · `_filaSync` 4240 · `fbUnsubs` 4462 · `_avisouSessaoExpirada` 4658
`_fbLogs` 4684 · `tecnicos` 4899 · `AVATAR_IDS` 4912 · `avataresTecnicos` 4913 · `ICONS` 4927
`NAV_ITEMS` 4976 · `VRF_FASES` 4985 · `VRF_TOTAL_ETAPAS` 4997 · `vrfFasesConfig` 5007 · `vrfObras` 5028
`vrfObraAtualId` 5036 · `_mudouNaMigracaoTecVrfObras` 5075 · `vrfProgresso` 5115 · `vrfFotos` 5116
`vrfNotas` 5117 · `vrfRelatorios` 5118 · `vrfCheckins` 5119 · `localizacaoHistorico` 5125 · `tarefas` 5140
`liveTracks` 5142 · `vrfFotosMeta` 5144 · `vrfFloorTab` 5150 · `CHECKLIST_BASE` 5202 · `CHECKLIST_MANUT` 5214
`CHECKLIST_PREDIAL_BASE` 5224 · `CHECKLIST_PREDIAL_MANUT` 5236 · `RAMO_TEMPLATES` 5248
`checklistConfig` 5258 · `PRECO_TEMPLATES` 5305 · `precoConfig` 5332 · `moduloConfig` 5381 · `ETAPAS` 5417
`ETAPA_LBL` 5418 · `session` 5421 · `osList` 5422 · `clientes` 5423 · `manutencoes` 5424 · `settings` 5425
`financeiroNotas` 5426 · `currentView` 5427 · `currentFilter` 5428 · `currentDetailId` 5429
`mapaInstance` 5430 · `mapaMarkers` 5431 · `mapaTrails` 5432 · `_encerrandoPorRemocao` 5725
`_compartilhando` 5768 · `_avalNota` 5822 · `VIEW_META` 5878 · `navbarContexto` 5917 · `_TLD_GOOGLE` 6012
`_ultimoMapaId` 6068 · `_vrfFotoTarget` 6913 · `_fotoEmProcessamento` 6946 · `_travaFotoTimer` 6947
`FOTO_MAX_BYTES` 6951 · `vrfMapaInstance` 7324 · `_vrfMissaoAndarIdx` 7511 · `financeiroPeriodo` 8249
`_reconciliandoEquipe` 8402 · `CONVITE_VALIDADE_MS` 8584 · `_timerFecharModal` 8922 · `TOUR_VERSAO` 8948
`TOUR_GESTOR` 8950 · `TOUR_TECNICO` 8964 · `TOUR_VIEWS_GESTOR` 8981 · `TOUR_VIEWS_TECNICO` 9030
`_tourPassos` 9042 · `_tourIndice` 9043 · `_tourResizeHandler` 9044 · `_tourContextoAtual` 9048
`mapaPainelAberto` 10202 · `mapaPainelColapsado` 10203 · `_avatarSvgCache` 10259 · `gpsWatchId` 10475
`LIVE_DURACAO_MS` 10476 · `LIVE_INTERVALO_MS` 10477 · `LIVE_DIST_MIN_M` 10478 · `LIVE_MAX_PONTOS` 10479
`_liveUltimoReg` 10480 · `_liveWakeLock` 10481 · `_liveGuardTimer` 10482 · `GPS_CONSENT_VERSAO` 10486
`execTarefaId` 10737 · `TF_LABEL` 10739 · `execOS` 11057 · `EXEC_ABERTA` 11064 · `sigCtx` 11280
`PUB_LIMITE_BYTES` 11443 · `PUB_VALIDADE_MS` 11446 · `MAX_TIMEOUT_MS` 11453 · `_thumbCache` 11464
`_pubUltimo` 11465 · `_pubTimer` 11810 · `_pubRota` 12003 · `_TINHA_CONTROLADOR` 12051
`RECARGA_ESPERA_MS` 12052 · `RECARGA_CARENCIA_MS` 12053 · `RECARGA_TETO` 12054 · `RECARGA_MARCA` 12055
`PROCURA_MINIMA_MS` 12056 · `BOTAO_ATUALIZAR_TETO_MS` 12057 · `MOTIVO_PUBLICO` 12061 · `_timerRecarga` 12062
`_timerBotaoAtualizar` 12063 · `_recargaManualPedida` 12064 · `_recargaPedida` 12065
`_ultimoMotivoAdiado` 12066 · `_timerFaixa` 12075 · `_ultimoMotivoFaixa` 12076 · `_ultimaProcura` 12077
`_versaoNovaDetectada` 12086

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
`lightboxImg` 1220 · `modalRoot` 1223 · `tourRoot` 1226 · `avalNotas` 5831 · `avalTexto` 5835
`osGridContainer` 6400 · `mapaBox` 6587 · `mapaPainelInfo` 6588 · `mapaCardEquipe` 6590
`mapaCardHistorico` 6594 · `vrfTabs` 6756 · `vrfPainel` 6759 · `vrfRespNome` 6763 · `vrfObs` 6764
`vrfCameraInput` 6768 · `vrfNotaTxt` 7061 · `vrfNovaObraNome` 7233 · `vrfNovaObraEndereco` 7234
`vrfMapaBox` 7333 · `vrfNome` 7468 · `vrfEndereco` 7469 · `vrfMeta` 7470 · `vrfAndaresList` 7472
`vrfMissaoTabs` 7522 · `vrfMissaoAndarAtual` 7523 · `vrfMissaoSteps` 7524 · `diagStatus` 7962
`diagTamanhos` 7965 · `diagAparelho` 7967 · `diagLogBody` 7969 · `moduloNome` 8068 · `moduloDesc` 8069
`novaCategoriaPreco` 8203 · `notaPrestador` 8323 · `notaValor` 8324 · `notaObs` 8326 · `finPeriodo` 8374
`finHierarquiaCard` 8386 · `tNome` 8490 · `tUid` 8494 · `modCardSplit` 8499 · `tSplit` 8500
`modCardVrf` 8505 · `tVrf` 8506 · `conviteCodigoInput` 8690 · `curOverlay` 8917 · `tourBackdrop` 9262
`tourSpot` 9263 · `tourCard` 9264 · `oCliente` 9353 · `clientesList` 9354 · `oEndereco` 9355 · `oTipo` 9357
`oTecnico` 9360 · `oData` 9363 · `oHora` 9364 · `oSplits` 9366 · `oObs` 9367 · `notaGestor` 9492
`osValor` 9498 · `osValorStatus` 9499 · `mCliente` 9560 · `mEndereco` 9562 · `mData` 9564 · `mTecnico` 9565
`mTipo` 9568 · `mRecorrencia` 9569 · `mObs` 9571 · `meData` 9660 · `meTipo` 9667 · `meRecorrencia` 9670
`meEndereco` 9675 · `meObs` 9676 · `cNome` 9803 · `cEndereco` 9804 · `cContato` 9805 · `gpsLabel` 10419
`tfNome` 10782 · `tfDesc` 10783 · `tfTec` 10784 · `tfMax` 10785 · `tfNotas` 10787 · `tarefaNota` 10879
`btnTarefaCheckin` 10890 · `tarefaCamInput` 10903 · `coordMapaBox` 11020 · `equipPanelArea` 11117
`checklistArea` 11124 · `sigCanvas` 11131 · `pendConcluir` 11135 · `btnConcluir` 11136 · `pubLinkInput` 11710
`pubZoom` 11995 · `pubZoomImg` 11995

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
