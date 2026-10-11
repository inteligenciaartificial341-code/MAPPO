<!-- GERADO POR ferramentas/gerar-mapa.js — NÃO EDITAR À MÃO. Regenere com: npm run mapa -->

# Mapa do `index.html`

`index.html` tem **12.052 linhas** e **752 KB** — ler o arquivo inteiro custa ~220 mil tokens. Este mapa custa uma fração disso e diz **onde** cada coisa está.

**Como usar:** ache o nome aqui, pegue a linha, e abra só o trecho (`sed -n '1200,1260p' index.html`). Nunca leia o arquivo inteiro para localizar algo.

**O que este mapa NÃO faz:** ele não diz o que o código faz. Decidir pelo mapa sem abrir a função é pior que deduzir a partir do código — é deduzir sem nem ter lido.

| | |
|---|---|
| Funções | 548 |
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
`TUTORIAL GUIADO (coach-marks/spotlight) — Story 17` 936 · `VRF — estrutura de dados de obra` 4973
`HOME DO TÉCNICO — boas-vindas ou resumo do que tem em andamento` 5518 · `DASHBOARD` 6238 · `ORDENS` 6379
`CLIENTES` 6434 · `MANUTENÇÕES` 6468 · `MAPA` 6499 · `SPLITS` 6550 · `VRF (placeholder pra integração)` 6578
`CONFIG` 7830

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
`avatarDoTecnico` 4914 · `setMeuAvatar` 4915 · `svgIco` 4962

**VRF — estrutura de dados de obra**

`saveVrfFasesConfig` 4997 · `_garantirVrfFasesConfig` 4998 · `vrfFasesAtuais` 5004
`vrfTotalEtapasAtuais` 5007 · `vrfObraAtual` 5026 · `vrfResolverObraAtual` 5032 · `_vrfPertenceObra` 5049
`_vrfPertenceObraAtual` 5050 · `_novoIdAndar` 5053 · `_novoIdObra` 5054 · `vrfObrasDoTecnico` 5075
`vrfObrasPermitidas` 5081 · `vrfTemAtividadeObras` 5088 · `vrfProgGeralObras` 5091
`_vrfResumoDashObras` 5096 · `registrarHistoricoLocalizacao` 5115 · `saveTarefas` 5130 · `saveLive` 5132
`saveVrfFotosMeta` 5134 · `vrfFotoPrestador` 5135 · `vrfMissaoAndar` 5151 · `vrfMissaoTotal` 5152
`vrfMissaoInclui` 5153 · `saveVrfObra` 5155 · `saveVrfProgresso` 5156 · `saveVrfFotos` 5157
`saveVrfNotas` 5158 · `vrfProgAndar` 5161 · `vrfProgObra` 5170 · `vrfProgGeral` 5180 · `vrfProgFase` 5181
`vrfCorProg` 5187 · `saveChecklistConfig` 5248 · `_fallbackChecklistRamo` 5258 · `ehManutencao` 5264
`checklistDoTipo` 5265 · `corrigirChecklistSeVazio` 5273 · `savePrecoConfig` 5322 · `_fallbackPrecoRamo` 5329
`_garantirPrecoConfig` 5336 · `_precoCfgExibicao` 5340 · `_normTipo` 5343 · `valorDoTipo` 5348
`_moduloDefaultParaRamo` 5366 · `saveModuloConfig` 5371 · `_fallbackModuloRamo` 5374
`_garantirModuloConfig` 5380 · `moduloSplitAtual` 5387 · `_aplicarModuloVocabulario` 5394 · `saveOS` 5424
`saveClientes` 5425 · `saveManut` 5426 · `saveSettings` 5427 · `saveSession` 5428 · `saveFinanceiroNotas` 5429
`fazerLogin` 5435 · `entrarApp` 5450

**HOME DO TÉCNICO — boas-vindas ou resumo do que tem em andamento**

`renderTecnicoHome` 5519 · `injetarIcones` 5616 · `getNavItems` 5628 · `montarNavbar` 5669
`montarFloatMenu` 5684 · `floatMenuNav` 5695 · `toggleFloatMenu` 5701 · `_encerrarPorAcessoRemovido` 5715
`logout` 5735 · `compartilharApp` 5758 · `abrirAvaliarApp` 5812 · `_renderAvalNotas` 5832
`_setAvalNota` 5837 · `enviarFeedbackApp` 5842 · `nav` 5886 · `ajustarNavbarContexto` 5907
`openSidebar` 5916 · `closeSidebar` 5917 · `setView` 5920 · `toast` 5940 · `fmtDate` 5950 · `fmtMoeda` 5951
`_parseMoeda` 5957 · `escapeHtml` 5982 · `escJsAttr` 5992 · `_ehHostDeMapa` 6002 · `_podarFimDaUrl` 6024
`urlDeMapaNoTexto` 6037 · `abrirMapaDaOS` 6058 · `_btnMapaOS` 6085 · `hoje` 6089 · `openLightbox` 6093
`toggleChkFoto` 6105 · `closeLightbox` 6111 · `updateDate` 6112 · `statusReal` 6113 · `etapaAtual` 6114
`aplicarMenuTecnico` 6128 · `_renderViewConteudo` 6141 · `renderView` 6219 · `atualizarBadges` 6224

**DASHBOARD**

`vrfTemAtividade` 6241 · `_vrfResumoDash` 6247 · `renderBemVindoGestor` 6250 · `cardVRFdash` 6280
`renderDashboard` 6301 · `renderEquipeMini` 6354 · `renderManutMini` 6366

**ORDENS**

`renderOrdens` 6380 · `setFilter` 6392 · `renderOSGrid` 6394 · `osCardHTML` 6407

**CLIENTES**

`renderClientes` 6435

**MANUTENÇÕES**

`renderManutencoes` 6469 · `manutCardHTML` 6481

**MAPA**

`renderMapa` 6500 · `renderHistoricoLocalizacao` 6536

**SPLITS**

`renderSplits` 6551

**VRF (placeholder pra integração)**

`renderVRF` 6579 · `vrfCheckinHoje` 6586 · `vrfCardCheckin` 6590 · `vrfFazerCheckin` 6610
`vrfSalvarCheckin` 6629 · `renderVRFtecnico` 6646 · `vrfMissaoProgresso` 6706 · `vrfSetTab` 6715
`vrfRenderMissaoPainel` 6724 · `vrfRenderAndarPainel` 6769 · `vrfToggleTec` 6822 · `vrfAtualizarTabs` 6834
`vrfAbrirCamera` 6848 · `_assinaturaComprimida` 6859 · `vrfComprimirImagem` 6887 · `vrfSetupCamera` 6948
`vrfAbrirNota` 6990 · `vrfSalvarNota` 7002 · `vrfVerFoto` 7013 · `vrfExcluirFoto` 7026
`vrfEnviarRelatorio` 7036 · `renderVRFgestor` 7045 · `renderVRFobras` 7131 · `renderVRFsemAcesso` 7159
`vrfNovaObraModal` 7163 · `vrfCriarObra` 7175 · `vrfSelecionarObra` 7197 · `renderVRFandares` 7208
`renderVRFrelatorios` 7242 · `renderVRFmapa` 7259 · `initVRFmapa` 7282 · `vrfCentralizarMapa` 7310
`renderVRFfotos` 7315 · `vrfVerFotoDetalhe` 7352 · `vrfMissaoResumo` 7374 · `vrfConfigObra` 7393
`vrfAddAndar` 7415 · `vrfRemoverAndar` 7419 · `vrfRenomearAndar` 7431 · `vrfSalvarObra` 7432
`vrfConfigMissao` 7446 · `vrfMissaoTab` 7466 · `vrfRenderMissaoSteps` 7471 · `vrfToggleMissao` 7490
`vrfSalvarMissao` 7504 · `vrfAbrirAndar` 7511 · `vrfToggleEtapa` 7556 · `carregarJsPDF` 7567
`exportarPDFos` 7585 · `gerarPDFos` 7595 · `vrfExportarPDF` 7706 · `gerarPDFandar` 7719

**CONFIG**

`renderConfig` 7831 · `toggleSet` 7907 · `setField` 7908 · `_templateRamoFallback` 7923
`_garantirChecklistConfig` 7931 · `_checklistCfgExibicao` 7935 · `renderChecklistConfig` 7938
`editarItemChecklist` 7957 · `removerItemChecklist` 7968 · `adicionarItemChecklist` 7977
`renderModuloConfig` 7998 · `salvarModuloConfig` 8006 · `renderVrfFasesConfig` 8031 · `editarEtapaVrf` 8053
`removerEtapaVrf` 8069 · `adicionarEtapaVrf` 8103 · `renderPrecoConfig` 8124 · `editarPrecoCategoria` 8141
`removerPrecoCategoria` 8152 · `adicionarPrecoCategoria` 8159 · `setFinanceiroPeriodo` 8184
`_dentroDoPeriodo` 8185 · `_rotuloPeriodo` 8196 · `financeiroResumo` 8200 · `renderFinanceiroHierarquia` 8217
`renderFinanceiroNotas` 8251 · `removerNotaFinanceira` 8272 · `adicionarNotaFinanceira` 8283
`renderFinanceiro` 8302 · `_reconciliarEquipe` 8337 · `renderEquipeConfig` 8382 · `openModalTecnico` 8417
`_vincularAcessoTecnico` 8476 · `_gerarCodigoConvite` 8497 · `_conviteExpirado` 8519
`gerarConviteTecnico` 8523 · `revogarConviteTecnico` 8569 · `_revogarConviteSeExistir` 8597
`_mostrarModalConvite` 8614 · `_copiarConviteCodigo` 8636 · `_atualizarNomeMembro` 8655
`_renomearTecnicoEmDados` 8676 · `salvarTecnico` 8694 · `removerTecnico` 8757 · `toggleModuloTec` 8800
`toggleObraTec` 8827 · `emptyState` 8844 · `diasAte` 8845 · `getTecnicoLoc` 8846 · `showModal` 8851
`closeModal` 8857 · `_temTourVisto` 8985 · `_gravarTourVisto` 8994 · `_temTourViewVisto` 9005
`_gravarTourViewVisto` 9011 · `_tourAlvoCandidatos` 9034 · `_tourElExiste` 9038
`_tourAdiarReposicaoAposAbrirSidebar` 9054 · `_tourAdiarReposicaoAposAbrirFloatMenu` 9071
`_tourElVisivel` 9091 · `_tourExisteProximoVisivel` 9122 · `_tourExisteAnteriorVisivel` 9126
`_tourIniciar` 9131 · `_tourIniciarView` 9142 · `_tourEntrarView` 9159 · `_tourAvancar` 9177
`_tourMostrarPasso` 9186 · `_tourReposicionar` 9233 · `_tourFechar` 9259 · `openModalOS` 9283 · `criarOS` 9309
`_selectTecnicoReatribuir` 9353 · `reatribuirOS` 9368 · `openDetalhe` 9379 · `salvarNota` 9470
`salvarValorOS` 9474 · `excluirOS` 9485 · `revisarOS` 9486 · `openModalManut` 9489 · `criarManut` 9514
`salvarManutEdicao` 9537 · `_reofereceAgenda` 9568 · `openModalManutEdit` 9587 · `excluirManut` 9624
`concluirManut` 9625 · `criarOSdeManut` 9636 · `agendarProximaManut` 9641 · `openModalCliente` 9644
`criarCliente` 9654 · `openHistoricoCliente` 9660 · `abrirGoogleAgenda` 9672 · `_painelMapaConteudoHtml` 9696
`_renderPainelMapa` 9721 · `abrirPainelMapa` 9738 · `fecharPainelMapa` 9744 · `toggleColapsoPainelMapa` 9745
`_carregarAvatarSvg` 9751 · `_avatarMarkerHtml` 9768 · `initMapa` 9778 · `atualizarMarcadores` 9788
`loadLeaflet` 9870 · `renderTecnicoApp` 9891 · `meuAvatarBtnLabel` 9918 · `abrirEscolhaAvatar` 9921
`escolherMeuAvatar` 9938 · `secTec` 9945 · `afterTecnicoRender` 9958 · `_temConsentimentoGPS` 9978
`_gravarConsentimentoGPS` 9987 · `_distM` 9995 · `ultimoCheckinHojeTs` 10003 · `meuLive` 10027
`liveAtivo` 10028 · `liveRestanteMs` 10029 · `fmtDuracaoMs` 10030 · `toggleGPS` 10036 · `toggleLive` 10037
`_mostrarConsentimentoGPS` 10044 · `_confirmarConsentimentoGPS` 10057 · `iniciarLive` 10064
`pararLive` 10099 · `_ligarWatchLive` 10111 · `liveRegistrarPonto` 10120 · `_pedirWakeLock` 10144
`_soltarWakeLock` 10152 · `_ligarGuardaLive` 10158 · `retomarLiveSePreciso` 10169 · `salvarPosicao` 10186
`msgErroGPS` 10192 · `updateGPSLabel` 10200 · `liveBlocoHTML` 10208 · `getExecTarefa` 10229
`renderTarefas` 10232 · `renderTarefasGestor` 10237 · `openModalTarefa` 10267 · `salvarTarefa` 10286
`excluirTarefa` 10303 · `verTarefaDetalhe` 10310 · `renderTarefasTecnico` 10333 · `abrirTarefa` 10359
`voltarTarefa` 10360 · `rerenderTarefaExec` 10361 · `renderExecTarefa` 10363 · `setupTarefaCam` 10405
`tarefaRemoverFoto` 10445 · `tarefaSalvarNota` 10458 · `tarefaCheckin` 10466 · `tarefaFinalizarCheckin` 10488
`abrirMapaCoord` 10507 · `tarefaCheckinHoje` 10530 · `concluirTarefa` 10535 · `_lembrarExecucao` 10556
`_esquecerExecucao` 10560 · `_retomarExecucaoSePreciso` 10564 · `abrirExecucao` 10576 · `renderExecucao` 10586
`switchEquipTab` 10640 · `updEquip` 10661 · `onEquipFoto` 10662 · `renderChecklistExec` 10688
`toggleCheck` 10716 · `onCheckFoto` 10725 · `execCheckin` 10740 · `finalizarCheckin` 10762
`initSigCanvas` 10772 · `limparSig` 10784 · `_pendenciasParaConcluir` 10790 · `verificarConcluir` 10814
`execConcluir` 10829 · `saveExecOS` 10847 · `voltarExec` 10848 · `renderManutTecnico` 10851
`startNotifChecker` 10873 · `checkManutencoes` 10899 · `notificarNavegador` 10917 · `enviarEmailManut` 10924
`enviarSMSManut` 10925 · `agendarLonge` 10945 · `cancelarLonge` 10954 · `_pubToken` 10958 · `pubURL` 10963
`_thumbKey` 10964 · `_thumb` 10969 · `pubPayloadOS` 10993 · `pubPayloadObra` 11023
`publicarAcompanhamento` 11080 · `_precisaNovoToken` 11105 · `gerarLinkOS` 11111
`conferirLinkNoServidor` 11131 · `gerarLinkObra` 11149 · `abrirModalLink` 11159 · `revogarLink` 11227
`emitirEnderecoNovo` 11250 · `marcarLinkEnviado` 11273 · `copiarLinkPub` 11282 · `agendarRepublicacao` 11302
`republicarAtivos` 11307 · `_pubRotaToken` 11330 · `_mostrarLinkAntigo` 11338 · `iniciarModoPublico` 11357
`_pubOuvirToken` 11379 · `renderPublicoErro` 11421 · `_pubStatusLbl` 11425 · `renderPublico` 11428
`pubZoom` 11488 · `_lerMarcaRecarga` 11584 · `_marcarRecarga` 11599 · `_campoComTextoNaoSalvo` 11616
`_porQueNaoRecarregarAgora` 11632 · `_recarregarQuandoSeguro` 11682 · `_motivoParaPessoa` 11732
`_pedidoDaFaixa` 11750 · `_logFaixa` 11758 · `_recarregarPorFaltaDeNuvem` 11772
`_tentarDeNovoPelaFaixa` 11804 · `_acenderFaixaVersao` 11834 · `_desenharIconeVersao` 11855
`_medirAvisoVersao` 11870 · `_mostrarMotivoVersao` 11890 · `_devolverBotaoAtualizar` 11899
`_esperarResolve` 11915 · `_apressarAtualizacao` 11929 · `_avisarVersaoNova` 11965
`_avisarVersaoVelhaPorErro` 11978

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
`NAV_ITEMS` 4965 · `VRF_FASES` 4974 · `VRF_TOTAL_ETAPAS` 4986 · `vrfFasesConfig` 4996 · `vrfObras` 5017
`vrfObraAtualId` 5025 · `_mudouNaMigracaoTecVrfObras` 5064 · `vrfProgresso` 5104 · `vrfFotos` 5105
`vrfNotas` 5106 · `vrfRelatorios` 5107 · `vrfCheckins` 5108 · `localizacaoHistorico` 5114 · `tarefas` 5129
`liveTracks` 5131 · `vrfFotosMeta` 5133 · `vrfFloorTab` 5139 · `CHECKLIST_BASE` 5191 · `CHECKLIST_MANUT` 5203
`CHECKLIST_PREDIAL_BASE` 5213 · `CHECKLIST_PREDIAL_MANUT` 5225 · `RAMO_TEMPLATES` 5237
`checklistConfig` 5247 · `PRECO_TEMPLATES` 5294 · `precoConfig` 5321 · `moduloConfig` 5370 · `ETAPAS` 5406
`ETAPA_LBL` 5407 · `session` 5410 · `osList` 5411 · `clientes` 5412 · `manutencoes` 5413 · `settings` 5414
`financeiroNotas` 5415 · `currentView` 5416 · `currentFilter` 5417 · `currentDetailId` 5418
`mapaInstance` 5419 · `mapaMarkers` 5420 · `mapaTrails` 5421 · `_encerrandoPorRemocao` 5714
`_compartilhando` 5757 · `_avalNota` 5811 · `VIEW_META` 5867 · `navbarContexto` 5906 · `_TLD_GOOGLE` 6001
`_ultimoMapaId` 6057 · `_vrfFotoTarget` 6847 · `_fotoEmProcessamento` 6880 · `_travaFotoTimer` 6881
`FOTO_MAX_BYTES` 6885 · `vrfMapaInstance` 7258 · `_vrfMissaoAndarIdx` 7445 · `financeiroPeriodo` 8183
`_reconciliandoEquipe` 8336 · `CONVITE_VALIDADE_MS` 8518 · `_timerFecharModal` 8856 · `TOUR_VERSAO` 8882
`TOUR_GESTOR` 8884 · `TOUR_TECNICO` 8898 · `TOUR_VIEWS_GESTOR` 8915 · `TOUR_VIEWS_TECNICO` 8964
`_tourPassos` 8976 · `_tourIndice` 8977 · `_tourResizeHandler` 8978 · `_tourContextoAtual` 8982
`mapaPainelAberto` 9693 · `mapaPainelColapsado` 9694 · `_avatarSvgCache` 9750 · `gpsWatchId` 9966
`LIVE_DURACAO_MS` 9967 · `LIVE_INTERVALO_MS` 9968 · `LIVE_DIST_MIN_M` 9969 · `LIVE_MAX_PONTOS` 9970
`_liveUltimoReg` 9971 · `_liveWakeLock` 9972 · `_liveGuardTimer` 9973 · `GPS_CONSENT_VERSAO` 9977
`execTarefaId` 10228 · `TF_LABEL` 10230 · `execOS` 10548 · `EXEC_ABERTA` 10555 · `sigCtx` 10771
`PUB_LIMITE_BYTES` 10934 · `PUB_VALIDADE_MS` 10937 · `MAX_TIMEOUT_MS` 10944 · `_thumbCache` 10955
`_pubUltimo` 10956 · `_pubTimer` 11301 · `_pubRota` 11494 · `_TINHA_CONTROLADOR` 11542
`RECARGA_ESPERA_MS` 11543 · `RECARGA_CARENCIA_MS` 11544 · `RECARGA_TETO` 11545 · `RECARGA_MARCA` 11546
`PROCURA_MINIMA_MS` 11547 · `BOTAO_ATUALIZAR_TETO_MS` 11548 · `MOTIVO_PUBLICO` 11552 · `_timerRecarga` 11553
`_timerBotaoAtualizar` 11554 · `_recargaManualPedida` 11555 · `_recargaPedida` 11556
`_ultimoMotivoAdiado` 11557 · `_timerFaixa` 11566 · `_ultimoMotivoFaixa` 11567 · `_ultimaProcura` 11568
`_versaoNovaDetectada` 11577

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
`lightboxImg` 1220 · `modalRoot` 1223 · `tourRoot` 1226 · `avalNotas` 5820 · `avalTexto` 5824
`osGridContainer` 6389 · `mapaBox` 6521 · `mapaPainelInfo` 6522 · `mapaCardEquipe` 6524
`mapaCardHistorico` 6528 · `vrfTabs` 6690 · `vrfPainel` 6693 · `vrfRespNome` 6697 · `vrfObs` 6698
`vrfCameraInput` 6702 · `vrfNotaTxt` 6995 · `vrfNovaObraNome` 7167 · `vrfNovaObraEndereco` 7168
`vrfMapaBox` 7267 · `vrfNome` 7402 · `vrfEndereco` 7403 · `vrfMeta` 7404 · `vrfAndaresList` 7406
`vrfMissaoTabs` 7456 · `vrfMissaoAndarAtual` 7457 · `vrfMissaoSteps` 7458 · `diagStatus` 7896
`diagTamanhos` 7899 · `diagAparelho` 7901 · `diagLogBody` 7903 · `moduloNome` 8002 · `moduloDesc` 8003
`novaCategoriaPreco` 8137 · `notaPrestador` 8257 · `notaValor` 8258 · `notaObs` 8260 · `finPeriodo` 8308
`finHierarquiaCard` 8320 · `tNome` 8424 · `tUid` 8428 · `modCardSplit` 8433 · `tSplit` 8434
`modCardVrf` 8439 · `tVrf` 8440 · `conviteCodigoInput` 8624 · `curOverlay` 8851 · `tourBackdrop` 9196
`tourSpot` 9197 · `tourCard` 9198 · `oCliente` 9287 · `clientesList` 9288 · `oEndereco` 9289 · `oTipo` 9291
`oTecnico` 9294 · `oData` 9297 · `oHora` 9298 · `oSplits` 9300 · `oObs` 9301 · `notaGestor` 9426
`osValor` 9432 · `osValorStatus` 9433 · `mCliente` 9494 · `mEndereco` 9496 · `mData` 9498 · `mTecnico` 9499
`mTipo` 9502 · `mRecorrencia` 9503 · `mObs` 9505 · `meData` 9594 · `meTipo` 9601 · `meRecorrencia` 9604
`meEndereco` 9609 · `meObs` 9610 · `cNome` 9648 · `cEndereco` 9649 · `cContato` 9650 · `gpsLabel` 9910
`tfNome` 10273 · `tfDesc` 10274 · `tfTec` 10275 · `tfMax` 10276 · `tfNotas` 10278 · `tarefaNota` 10370
`btnTarefaCheckin` 10381 · `tarefaCamInput` 10394 · `coordMapaBox` 10511 · `equipPanelArea` 10608
`checklistArea` 10615 · `sigCanvas` 10622 · `pendConcluir` 10626 · `btnConcluir` 10627 · `pubLinkInput` 11201
`pubZoom` 11486 · `pubZoomImg` 11486

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
