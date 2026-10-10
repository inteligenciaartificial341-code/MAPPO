<!-- GERADO POR ferramentas/gerar-mapa.js — NÃO EDITAR À MÃO. Regenere com: npm run mapa -->

# Mapa do `index.html`

`index.html` tem **11.939 linhas** e **744 KB** — ler o arquivo inteiro custa ~218 mil tokens. Este mapa custa uma fração disso e diz **onde** cada coisa está.

**Como usar:** ache o nome aqui, pegue a linha, e abra só o trecho (`sed -n '1200,1260p' index.html`). Nunca leia o arquivo inteiro para localizar algo.

**O que este mapa NÃO faz:** ele não diz o que o código faz. Decidir pelo mapa sem abrir a função é pior que deduzir a partir do código — é deduzir sem nem ter lido.

| | |
|---|---|
| Funções | 542 |
| Estado de topo (`const`/`let`) | 172 |
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
`HOME DO TÉCNICO — boas-vindas ou resumo do que tem em andamento` 5518 · `DASHBOARD` 6134 · `ORDENS` 6275
`CLIENTES` 6330 · `MANUTENÇÕES` 6362 · `MAPA` 6393 · `SPLITS` 6444 · `VRF (placeholder pra integração)` 6472
`CONFIG` 7724

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
`_parseMoeda` 5957 · `escapeHtml` 5982 · `hoje` 5985 · `openLightbox` 5989 · `toggleChkFoto` 6001
`closeLightbox` 6007 · `updateDate` 6008 · `statusReal` 6009 · `etapaAtual` 6010 · `aplicarMenuTecnico` 6024
`_renderViewConteudo` 6037 · `renderView` 6115 · `atualizarBadges` 6120

**DASHBOARD**

`vrfTemAtividade` 6137 · `_vrfResumoDash` 6143 · `renderBemVindoGestor` 6146 · `cardVRFdash` 6176
`renderDashboard` 6197 · `renderEquipeMini` 6250 · `renderManutMini` 6262

**ORDENS**

`renderOrdens` 6276 · `setFilter` 6288 · `renderOSGrid` 6290 · `osCardHTML` 6303

**CLIENTES**

`renderClientes` 6331

**MANUTENÇÕES**

`renderManutencoes` 6363 · `manutCardHTML` 6375

**MAPA**

`renderMapa` 6394 · `renderHistoricoLocalizacao` 6430

**SPLITS**

`renderSplits` 6445

**VRF (placeholder pra integração)**

`renderVRF` 6473 · `vrfCheckinHoje` 6480 · `vrfCardCheckin` 6484 · `vrfFazerCheckin` 6504
`vrfSalvarCheckin` 6523 · `renderVRFtecnico` 6540 · `vrfMissaoProgresso` 6600 · `vrfSetTab` 6609
`vrfRenderMissaoPainel` 6618 · `vrfRenderAndarPainel` 6663 · `vrfToggleTec` 6716 · `vrfAtualizarTabs` 6728
`vrfAbrirCamera` 6742 · `_assinaturaComprimida` 6753 · `vrfComprimirImagem` 6781 · `vrfSetupCamera` 6842
`vrfAbrirNota` 6884 · `vrfSalvarNota` 6896 · `vrfVerFoto` 6907 · `vrfExcluirFoto` 6920
`vrfEnviarRelatorio` 6930 · `renderVRFgestor` 6939 · `renderVRFobras` 7025 · `renderVRFsemAcesso` 7053
`vrfNovaObraModal` 7057 · `vrfCriarObra` 7069 · `vrfSelecionarObra` 7091 · `renderVRFandares` 7102
`renderVRFrelatorios` 7136 · `renderVRFmapa` 7153 · `initVRFmapa` 7176 · `vrfCentralizarMapa` 7204
`renderVRFfotos` 7209 · `vrfVerFotoDetalhe` 7246 · `vrfMissaoResumo` 7268 · `vrfConfigObra` 7287
`vrfAddAndar` 7309 · `vrfRemoverAndar` 7313 · `vrfRenomearAndar` 7325 · `vrfSalvarObra` 7326
`vrfConfigMissao` 7340 · `vrfMissaoTab` 7360 · `vrfRenderMissaoSteps` 7365 · `vrfToggleMissao` 7384
`vrfSalvarMissao` 7398 · `vrfAbrirAndar` 7405 · `vrfToggleEtapa` 7450 · `carregarJsPDF` 7461
`exportarPDFos` 7479 · `gerarPDFos` 7489 · `vrfExportarPDF` 7600 · `gerarPDFandar` 7613

**CONFIG**

`renderConfig` 7725 · `toggleSet` 7801 · `setField` 7802 · `_templateRamoFallback` 7817
`_garantirChecklistConfig` 7825 · `_checklistCfgExibicao` 7829 · `renderChecklistConfig` 7832
`editarItemChecklist` 7851 · `removerItemChecklist` 7862 · `adicionarItemChecklist` 7871
`renderModuloConfig` 7892 · `salvarModuloConfig` 7900 · `renderVrfFasesConfig` 7925 · `editarEtapaVrf` 7947
`removerEtapaVrf` 7963 · `adicionarEtapaVrf` 7997 · `renderPrecoConfig` 8018 · `editarPrecoCategoria` 8035
`removerPrecoCategoria` 8046 · `adicionarPrecoCategoria` 8053 · `setFinanceiroPeriodo` 8078
`_dentroDoPeriodo` 8079 · `_rotuloPeriodo` 8090 · `financeiroResumo` 8094 · `renderFinanceiroHierarquia` 8111
`renderFinanceiroNotas` 8145 · `removerNotaFinanceira` 8166 · `adicionarNotaFinanceira` 8177
`renderFinanceiro` 8196 · `_reconciliarEquipe` 8231 · `renderEquipeConfig` 8276 · `openModalTecnico` 8311
`_vincularAcessoTecnico` 8370 · `_gerarCodigoConvite` 8391 · `_conviteExpirado` 8413
`gerarConviteTecnico` 8417 · `revogarConviteTecnico` 8463 · `_revogarConviteSeExistir` 8491
`_mostrarModalConvite` 8508 · `_copiarConviteCodigo` 8530 · `_atualizarNomeMembro` 8549
`_renomearTecnicoEmDados` 8570 · `salvarTecnico` 8588 · `removerTecnico` 8651 · `toggleModuloTec` 8694
`toggleObraTec` 8721 · `emptyState` 8738 · `diasAte` 8739 · `getTecnicoLoc` 8740 · `showModal` 8745
`closeModal` 8751 · `_temTourVisto` 8879 · `_gravarTourVisto` 8888 · `_temTourViewVisto` 8899
`_gravarTourViewVisto` 8905 · `_tourAlvoCandidatos` 8928 · `_tourElExiste` 8932
`_tourAdiarReposicaoAposAbrirSidebar` 8948 · `_tourAdiarReposicaoAposAbrirFloatMenu` 8965
`_tourElVisivel` 8985 · `_tourExisteProximoVisivel` 9016 · `_tourExisteAnteriorVisivel` 9020
`_tourIniciar` 9025 · `_tourIniciarView` 9036 · `_tourEntrarView` 9053 · `_tourAvancar` 9071
`_tourMostrarPasso` 9080 · `_tourReposicionar` 9127 · `_tourFechar` 9153 · `openModalOS` 9177 · `criarOS` 9203
`_selectTecnicoReatribuir` 9247 · `reatribuirOS` 9262 · `openDetalhe` 9273 · `salvarNota` 9357
`salvarValorOS` 9361 · `excluirOS` 9372 · `revisarOS` 9373 · `openModalManut` 9376 · `criarManut` 9401
`salvarManutEdicao` 9424 · `_reofereceAgenda` 9455 · `openModalManutEdit` 9474 · `excluirManut` 9511
`concluirManut` 9512 · `criarOSdeManut` 9523 · `agendarProximaManut` 9528 · `openModalCliente` 9531
`criarCliente` 9541 · `openHistoricoCliente` 9547 · `abrirGoogleAgenda` 9559 · `_painelMapaConteudoHtml` 9583
`_renderPainelMapa` 9608 · `abrirPainelMapa` 9625 · `fecharPainelMapa` 9631 · `toggleColapsoPainelMapa` 9632
`_carregarAvatarSvg` 9638 · `_avatarMarkerHtml` 9655 · `initMapa` 9665 · `atualizarMarcadores` 9675
`loadLeaflet` 9757 · `renderTecnicoApp` 9778 · `meuAvatarBtnLabel` 9805 · `abrirEscolhaAvatar` 9808
`escolherMeuAvatar` 9825 · `secTec` 9832 · `afterTecnicoRender` 9845 · `_temConsentimentoGPS` 9865
`_gravarConsentimentoGPS` 9874 · `_distM` 9882 · `ultimoCheckinHojeTs` 9890 · `meuLive` 9914
`liveAtivo` 9915 · `liveRestanteMs` 9916 · `fmtDuracaoMs` 9917 · `toggleGPS` 9923 · `toggleLive` 9924
`_mostrarConsentimentoGPS` 9931 · `_confirmarConsentimentoGPS` 9944 · `iniciarLive` 9951 · `pararLive` 9986
`_ligarWatchLive` 9998 · `liveRegistrarPonto` 10007 · `_pedirWakeLock` 10031 · `_soltarWakeLock` 10039
`_ligarGuardaLive` 10045 · `retomarLiveSePreciso` 10056 · `salvarPosicao` 10073 · `msgErroGPS` 10079
`updateGPSLabel` 10087 · `liveBlocoHTML` 10095 · `getExecTarefa` 10116 · `renderTarefas` 10119
`renderTarefasGestor` 10124 · `openModalTarefa` 10154 · `salvarTarefa` 10173 · `excluirTarefa` 10190
`verTarefaDetalhe` 10197 · `renderTarefasTecnico` 10220 · `abrirTarefa` 10246 · `voltarTarefa` 10247
`rerenderTarefaExec` 10248 · `renderExecTarefa` 10250 · `setupTarefaCam` 10292 · `tarefaRemoverFoto` 10332
`tarefaSalvarNota` 10345 · `tarefaCheckin` 10353 · `tarefaFinalizarCheckin` 10375 · `abrirMapaCoord` 10394
`tarefaCheckinHoje` 10417 · `concluirTarefa` 10422 · `_lembrarExecucao` 10443 · `_esquecerExecucao` 10447
`_retomarExecucaoSePreciso` 10451 · `abrirExecucao` 10463 · `renderExecucao` 10473 · `switchEquipTab` 10527
`updEquip` 10548 · `onEquipFoto` 10549 · `renderChecklistExec` 10575 · `toggleCheck` 10603
`onCheckFoto` 10612 · `execCheckin` 10627 · `finalizarCheckin` 10649 · `initSigCanvas` 10659
`limparSig` 10671 · `_pendenciasParaConcluir` 10677 · `verificarConcluir` 10701 · `execConcluir` 10716
`saveExecOS` 10734 · `voltarExec` 10735 · `renderManutTecnico` 10738 · `startNotifChecker` 10760
`checkManutencoes` 10786 · `notificarNavegador` 10804 · `enviarEmailManut` 10811 · `enviarSMSManut` 10812
`agendarLonge` 10832 · `cancelarLonge` 10841 · `_pubToken` 10845 · `pubURL` 10850 · `_thumbKey` 10851
`_thumb` 10856 · `pubPayloadOS` 10880 · `pubPayloadObra` 10910 · `publicarAcompanhamento` 10967
`_precisaNovoToken` 10992 · `gerarLinkOS` 10998 · `conferirLinkNoServidor` 11018 · `gerarLinkObra` 11036
`abrirModalLink` 11046 · `revogarLink` 11114 · `emitirEnderecoNovo` 11137 · `marcarLinkEnviado` 11160
`copiarLinkPub` 11169 · `agendarRepublicacao` 11189 · `republicarAtivos` 11194 · `_pubRotaToken` 11217
`_mostrarLinkAntigo` 11225 · `iniciarModoPublico` 11244 · `_pubOuvirToken` 11266 · `renderPublicoErro` 11308
`_pubStatusLbl` 11312 · `renderPublico` 11315 · `pubZoom` 11375 · `_lerMarcaRecarga` 11471
`_marcarRecarga` 11486 · `_campoComTextoNaoSalvo` 11503 · `_porQueNaoRecarregarAgora` 11519
`_recarregarQuandoSeguro` 11569 · `_motivoParaPessoa` 11619 · `_pedidoDaFaixa` 11637 · `_logFaixa` 11645
`_recarregarPorFaltaDeNuvem` 11659 · `_tentarDeNovoPelaFaixa` 11691 · `_acenderFaixaVersao` 11721
`_desenharIconeVersao` 11742 · `_medirAvisoVersao` 11757 · `_mostrarMotivoVersao` 11777
`_devolverBotaoAtualizar` 11786 · `_esperarResolve` 11802 · `_apressarAtualizacao` 11816
`_avisarVersaoNova` 11852 · `_avisarVersaoVelhaPorErro` 11865

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
`_compartilhando` 5757 · `_avalNota` 5811 · `VIEW_META` 5867 · `navbarContexto` 5906 · `_vrfFotoTarget` 6741
`_fotoEmProcessamento` 6774 · `_travaFotoTimer` 6775 · `FOTO_MAX_BYTES` 6779 · `vrfMapaInstance` 7152
`_vrfMissaoAndarIdx` 7339 · `financeiroPeriodo` 8077 · `_reconciliandoEquipe` 8230
`CONVITE_VALIDADE_MS` 8412 · `_timerFecharModal` 8750 · `TOUR_VERSAO` 8776 · `TOUR_GESTOR` 8778
`TOUR_TECNICO` 8792 · `TOUR_VIEWS_GESTOR` 8809 · `TOUR_VIEWS_TECNICO` 8858 · `_tourPassos` 8870
`_tourIndice` 8871 · `_tourResizeHandler` 8872 · `_tourContextoAtual` 8876 · `mapaPainelAberto` 9580
`mapaPainelColapsado` 9581 · `_avatarSvgCache` 9637 · `gpsWatchId` 9853 · `LIVE_DURACAO_MS` 9854
`LIVE_INTERVALO_MS` 9855 · `LIVE_DIST_MIN_M` 9856 · `LIVE_MAX_PONTOS` 9857 · `_liveUltimoReg` 9858
`_liveWakeLock` 9859 · `_liveGuardTimer` 9860 · `GPS_CONSENT_VERSAO` 9864 · `execTarefaId` 10115
`TF_LABEL` 10117 · `execOS` 10435 · `EXEC_ABERTA` 10442 · `sigCtx` 10658 · `PUB_LIMITE_BYTES` 10821
`PUB_VALIDADE_MS` 10824 · `MAX_TIMEOUT_MS` 10831 · `_thumbCache` 10842 · `_pubUltimo` 10843
`_pubTimer` 11188 · `_pubRota` 11381 · `_TINHA_CONTROLADOR` 11429 · `RECARGA_ESPERA_MS` 11430
`RECARGA_CARENCIA_MS` 11431 · `RECARGA_TETO` 11432 · `RECARGA_MARCA` 11433 · `PROCURA_MINIMA_MS` 11434
`BOTAO_ATUALIZAR_TETO_MS` 11435 · `MOTIVO_PUBLICO` 11439 · `_timerRecarga` 11440
`_timerBotaoAtualizar` 11441 · `_recargaManualPedida` 11442 · `_recargaPedida` 11443
`_ultimoMotivoAdiado` 11444 · `_timerFaixa` 11453 · `_ultimoMotivoFaixa` 11454 · `_ultimaProcura` 11455
`_versaoNovaDetectada` 11464

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
`osGridContainer` 6285 · `mapaBox` 6415 · `mapaPainelInfo` 6416 · `mapaCardEquipe` 6418
`mapaCardHistorico` 6422 · `vrfTabs` 6584 · `vrfPainel` 6587 · `vrfRespNome` 6591 · `vrfObs` 6592
`vrfCameraInput` 6596 · `vrfNotaTxt` 6889 · `vrfNovaObraNome` 7061 · `vrfNovaObraEndereco` 7062
`vrfMapaBox` 7161 · `vrfNome` 7296 · `vrfEndereco` 7297 · `vrfMeta` 7298 · `vrfAndaresList` 7300
`vrfMissaoTabs` 7350 · `vrfMissaoAndarAtual` 7351 · `vrfMissaoSteps` 7352 · `diagStatus` 7790
`diagTamanhos` 7793 · `diagAparelho` 7795 · `diagLogBody` 7797 · `moduloNome` 7896 · `moduloDesc` 7897
`novaCategoriaPreco` 8031 · `notaPrestador` 8151 · `notaValor` 8152 · `notaObs` 8154 · `finPeriodo` 8202
`finHierarquiaCard` 8214 · `tNome` 8318 · `tUid` 8322 · `modCardSplit` 8327 · `tSplit` 8328
`modCardVrf` 8333 · `tVrf` 8334 · `conviteCodigoInput` 8518 · `curOverlay` 8745 · `tourBackdrop` 9090
`tourSpot` 9091 · `tourCard` 9092 · `oCliente` 9181 · `clientesList` 9182 · `oEndereco` 9183 · `oTipo` 9185
`oTecnico` 9188 · `oData` 9191 · `oHora` 9192 · `oSplits` 9194 · `oObs` 9195 · `notaGestor` 9320
`osValor` 9326 · `osValorStatus` 9327 · `mCliente` 9381 · `mEndereco` 9383 · `mData` 9385 · `mTecnico` 9386
`mTipo` 9389 · `mRecorrencia` 9390 · `mObs` 9392 · `meData` 9481 · `meTipo` 9488 · `meRecorrencia` 9491
`meEndereco` 9496 · `meObs` 9497 · `cNome` 9535 · `cEndereco` 9536 · `cContato` 9537 · `gpsLabel` 9797
`tfNome` 10160 · `tfDesc` 10161 · `tfTec` 10162 · `tfMax` 10163 · `tfNotas` 10165 · `tarefaNota` 10257
`btnTarefaCheckin` 10268 · `tarefaCamInput` 10281 · `coordMapaBox` 10398 · `equipPanelArea` 10495
`checklistArea` 10502 · `sigCanvas` 10509 · `pendConcluir` 10513 · `btnConcluir` 10514 · `pubLinkInput` 11088
`pubZoom` 11373 · `pubZoomImg` 11373

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
