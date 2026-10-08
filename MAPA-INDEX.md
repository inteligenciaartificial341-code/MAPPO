<!-- GERADO POR ferramentas/gerar-mapa.js — NÃO EDITAR À MÃO. Regenere com: npm run mapa -->

# Mapa do `index.html`

`index.html` tem **11.869 linhas** e **739 KB** — ler o arquivo inteiro custa ~216 mil tokens. Este mapa custa uma fração disso e diz **onde** cada coisa está.

**Como usar:** ache o nome aqui, pegue a linha, e abra só o trecho (`sed -n '1200,1260p' index.html`). Nunca leia o arquivo inteiro para localizar algo.

**O que este mapa NÃO faz:** ele não diz o que o código faz. Decidir pelo mapa sem abrir a função é pior que deduzir a partir do código — é deduzir sem nem ter lido.

| | |
|---|---|
| Funções | 542 |
| Estado de topo (`const`/`let`) | 170 |
| Elementos com `id` | 163 |
| Classes CSS | 337 |
| Seções do arquivo | 23 |

## Seções, na ordem do arquivo

`LOGIN / SPLASH` 67 · `SPLASH DE ENTRADA + LOGO OFICIAL` 69 · `APP SHELL` 96 · `COMPONENTES` 155
`ÍCONES SVG (Feather-style, contorno)` 302 · `BARRA DE NAVEGAÇÃO — DESKTOP (rail vertical à esquerda)` 307
`DESKTOP LIMPO: esconde a rail lateral, sidebar única` 327 · `BARRA DE NAVEGAÇÃO — MOBILE (inferior fixa)` 360
`MODO MOBILE FORÇADO (toggle no desktop)` 383 · `BOAS-VINDAS + DASHBOARD CENTRAL` 426
`VRF — painel do gestor` 531 · `VRF — checklist do prestador` 598
`TUTORIAL GUIADO (coach-marks/spotlight) — Story 17` 936 · `VRF — estrutura de dados de obra` 4903
`HOME DO TÉCNICO — boas-vindas ou resumo do que tem em andamento` 5448 · `DASHBOARD` 6064 · `ORDENS` 6205
`CLIENTES` 6260 · `MANUTENÇÕES` 6292 · `MAPA` 6323 · `SPLITS` 6374 · `VRF (placeholder pra integração)` 6402
`CONFIG` 7654

## Funções, agrupadas pela seção onde vivem

**TUTORIAL GUIADO (coach-marks/spotlight) — Story 17**

`ramoTemVRF` 1259 · `_idbAbrir` 1297 · `_idbTx` 1312 · `idbGravarFoto` 1326 · `idbLerFoto` 1329
`idbApagarFoto` 1332 · `idbTodasAsChaves` 1335 · `espacoDoAparelho` 1340 · `_ehReferenciaDeFoto` 1372
`_cachePor` 1382 · `_opsEmVooTotal` 1408 · `_opEmVooNome` 1409 · `_abrirOp` 1410 · `_fecharOp` 1411
`_emVoo` 1418 · `guardarFotoNoAparelho` 1437 · `fotoBytes` 1449 · `imgFoto` 1479 · `_pintarUma` 1490
`pintarFotos` 1525 · `ligarPintorDeFotos` 1530 · `_bytesDe` 1549 · `_nomeAmigavel` 1585 · `_nomeDoAndar` 1590
`_semNuvem` 1603 · `_vigiarConexao` 1613 · `_atualizarAlertaSync` 1620 · `_docDoAndar` 1714
`_ehDocDeFotos` 1715 · `_fotoOSDoc` 1729 · `_ehDocFotoOS` 1732 · `_camposFotoOS` 1738 · `_separarFotosOS` 1751
`_resolverFotosOS` 1778 · `_valorFotoDe` 1828 · `_preservarFotosNoMerge` 1847 · `_reancorarConversoesOS` 1901
`migrarFotosParaOArmazem` 1920 · `migrarFotosObraETarefaParaOArmazem` 1970 · `_fotosJaEnviadas` 2024
`_esquecerEnvio` 2030 · `_marcarFotoEnviada` 2039 · `_idFotoPorConteudo` 2064 · `_idFotoObra` 2073
`_ehDocFotoObra` 2074 · `_ehFotoDeVerdade` 2077 · `_separarFotosAndar` 2080 · `_resolverFotosAndar` 2105
`_apagarAndarNaNuvem` 2174 · `_migracaoFotosPendente` 2202 · `_marcarMigracaoFotos` 2205
`_idFotoTarefa` 2228 · `_ehDocFotoTarefa` 2229 · `_chaveFotoTarefa` 2233 · `_readicionarFotoTarefa` 2252
`_separarFotosTarefa` 2269 · `_resolverFotosTarefa` 2299 · `_preservarFotosTarefaNoMerge` 2366
`_mesclarAndar` 2428 · `_saveTouch` 2454 · `_pendDe` 2464 · `_temPend` 2465 · `_arr` 2467 · `_obj` 2468
`_porId` 2469 · `_setLocalQuiet` 2472 · `_anotarPendentes` 2491 · `_detectarMudancasNaoVistas` 2524
`_marcarAlteracaoLocal` 2535 · `_ehErroDeCota` 2547 · `_fecharAvisoMemoria` 2560 · `_avisarMemoriaCheia` 2561
`_testInterceptor` 2632 · `_startPolling` 2648 · `fbInit` 2673 · `_resolverWorkspace` 2724
`_cacheWorkspace` 2765 · `_lerCacheWorkspace` 2768 · `_aplicarSessaoResolvida` 2776 · `_mostrarBoxLogin` 2816
`mostrarLogin` 2821 · `mostrarCadastroEmpresa` 2822 · `mostrarPrestadorBox` 2823
`mostrarRecuperarSenha` 2826 · `enviarRecuperacaoSenha` 2846 · `_mostrarSemAcesso` 2886
`_mostrarUidManual` 2897 · `_mostrarPendente` 2902 · `_tentarNovamenteAcesso` 2909 · `_sairSemAcesso` 2918
`_slugify` 2923 · `_gerarSufixoWs` 2933 · `_ramoCustomInvalido` 2954 · `_mensagemErroAuth` 2964
`cadastrarEmpresa` 2975 · `prestadorEntrar` 3069 · `_consumirConviteTecnico` 3116 · `fbPush` 3176
`_gravarMesclado` 3188 · `_nomeDoUid` 3242 · `_guardarPosicaoDeUid` 3269 · `_semVazios` 3275
`_meuCorpoPosicao` 3282 · `_supremaciaPorUid` 3307 · `_remontarPosicoes` 3325
`_agendarEnvioDaMinhaPosicao` 3372 · `_aplicarPosicaoDeUid` 3385 · `_limparEstadoDePosicao` 3394
`_registrarFalhaPosicao` 3409 · `_pushMinhaPosicao` 3436 · `_pullPosicoes` 3515
`_retentarLeituraPosicoes` 3536 · `_pushFotosPorAndar` 3546 · `_confirmarEnvioAndar` 3660
`_pushOSSemFotos` 3674 · `_pushTarefasSemFotos` 3747 · `_doPush` 3842 · `_doPushAgora` 3849
`_mergeLista` 3928 · `_mergeItens` 3943 · `_mergeLeafs` 3967 · `_confirmarEnvio` 3986 · `_mergeMapa` 4018
`_reancorarExecOS` 4036 · `_execucaoAberta` 4045 · `_aplicarNaMemoria` 4048 · `_ehChaveDeSync` 4087
`_aplicarShardFotos` 4093 · `_aplicarLegadoFotos` 4125 · `_limparPubVazados` 4150 · `_naFilaSync` 4174
`_aplicarOSComFotos` 4186 · `_aplicarListaOS` 4196 · `_aplicarTarefasComFotos` 4218 · `fbApply` 4240
`fbOnRemoteChange` 4330 · `fbStartListeners` 4400 · `_vigiarMembership` 4459 · `_remoteMs` 4474
`fbStopListeners` 4480 · `fbPullAll` 4483 · `fbSeedFromLocal` 4502 · `initSync` 4538 · `_semAutenticacao` 4564
`_voltarAoLogin` 4597 · `fbBoot` 4607 · `fbLog` 4620 · `renderDiagTamanhos` 4631 · `renderDiagAparelho` 4712
`renderDebugLogs` 4756 · `syncManual` 4769 · `saveTecnicos` 4830 · `nomesTecnicos` 4831 · `getTecnico` 4832
`avatarDoTecnico` 4844 · `setMeuAvatar` 4845 · `svgIco` 4892

**VRF — estrutura de dados de obra**

`saveVrfFasesConfig` 4927 · `_garantirVrfFasesConfig` 4928 · `vrfFasesAtuais` 4934
`vrfTotalEtapasAtuais` 4937 · `vrfObraAtual` 4956 · `vrfResolverObraAtual` 4962 · `_vrfPertenceObra` 4979
`_vrfPertenceObraAtual` 4980 · `_novoIdAndar` 4983 · `_novoIdObra` 4984 · `vrfObrasDoTecnico` 5005
`vrfObrasPermitidas` 5011 · `vrfTemAtividadeObras` 5018 · `vrfProgGeralObras` 5021
`_vrfResumoDashObras` 5026 · `registrarHistoricoLocalizacao` 5045 · `saveTarefas` 5060 · `saveLive` 5062
`saveVrfFotosMeta` 5064 · `vrfFotoPrestador` 5065 · `vrfMissaoAndar` 5081 · `vrfMissaoTotal` 5082
`vrfMissaoInclui` 5083 · `saveVrfObra` 5085 · `saveVrfProgresso` 5086 · `saveVrfFotos` 5087
`saveVrfNotas` 5088 · `vrfProgAndar` 5091 · `vrfProgObra` 5100 · `vrfProgGeral` 5110 · `vrfProgFase` 5111
`vrfCorProg` 5117 · `saveChecklistConfig` 5178 · `_fallbackChecklistRamo` 5188 · `ehManutencao` 5194
`checklistDoTipo` 5195 · `corrigirChecklistSeVazio` 5203 · `savePrecoConfig` 5252 · `_fallbackPrecoRamo` 5259
`_garantirPrecoConfig` 5266 · `_precoCfgExibicao` 5270 · `_normTipo` 5273 · `valorDoTipo` 5278
`_moduloDefaultParaRamo` 5296 · `saveModuloConfig` 5301 · `_fallbackModuloRamo` 5304
`_garantirModuloConfig` 5310 · `moduloSplitAtual` 5317 · `_aplicarModuloVocabulario` 5324 · `saveOS` 5354
`saveClientes` 5355 · `saveManut` 5356 · `saveSettings` 5357 · `saveSession` 5358 · `saveFinanceiroNotas` 5359
`fazerLogin` 5365 · `entrarApp` 5380

**HOME DO TÉCNICO — boas-vindas ou resumo do que tem em andamento**

`renderTecnicoHome` 5449 · `injetarIcones` 5546 · `getNavItems` 5558 · `montarNavbar` 5599
`montarFloatMenu` 5614 · `floatMenuNav` 5625 · `toggleFloatMenu` 5631 · `_encerrarPorAcessoRemovido` 5645
`logout` 5665 · `compartilharApp` 5688 · `abrirAvaliarApp` 5742 · `_renderAvalNotas` 5762
`_setAvalNota` 5767 · `enviarFeedbackApp` 5772 · `nav` 5816 · `ajustarNavbarContexto` 5837
`openSidebar` 5846 · `closeSidebar` 5847 · `setView` 5850 · `toast` 5870 · `fmtDate` 5880 · `fmtMoeda` 5881
`_parseMoeda` 5887 · `escapeHtml` 5912 · `hoje` 5915 · `openLightbox` 5919 · `toggleChkFoto` 5931
`closeLightbox` 5937 · `updateDate` 5938 · `statusReal` 5939 · `etapaAtual` 5940 · `aplicarMenuTecnico` 5954
`_renderViewConteudo` 5967 · `renderView` 6045 · `atualizarBadges` 6050

**DASHBOARD**

`vrfTemAtividade` 6067 · `_vrfResumoDash` 6073 · `renderBemVindoGestor` 6076 · `cardVRFdash` 6106
`renderDashboard` 6127 · `renderEquipeMini` 6180 · `renderManutMini` 6192

**ORDENS**

`renderOrdens` 6206 · `setFilter` 6218 · `renderOSGrid` 6220 · `osCardHTML` 6233

**CLIENTES**

`renderClientes` 6261

**MANUTENÇÕES**

`renderManutencoes` 6293 · `manutCardHTML` 6305

**MAPA**

`renderMapa` 6324 · `renderHistoricoLocalizacao` 6360

**SPLITS**

`renderSplits` 6375

**VRF (placeholder pra integração)**

`renderVRF` 6403 · `vrfCheckinHoje` 6410 · `vrfCardCheckin` 6414 · `vrfFazerCheckin` 6434
`vrfSalvarCheckin` 6453 · `renderVRFtecnico` 6470 · `vrfMissaoProgresso` 6530 · `vrfSetTab` 6539
`vrfRenderMissaoPainel` 6548 · `vrfRenderAndarPainel` 6593 · `vrfToggleTec` 6646 · `vrfAtualizarTabs` 6658
`vrfAbrirCamera` 6672 · `_assinaturaComprimida` 6683 · `vrfComprimirImagem` 6711 · `vrfSetupCamera` 6772
`vrfAbrirNota` 6814 · `vrfSalvarNota` 6826 · `vrfVerFoto` 6837 · `vrfExcluirFoto` 6850
`vrfEnviarRelatorio` 6860 · `renderVRFgestor` 6869 · `renderVRFobras` 6955 · `renderVRFsemAcesso` 6983
`vrfNovaObraModal` 6987 · `vrfCriarObra` 6999 · `vrfSelecionarObra` 7021 · `renderVRFandares` 7032
`renderVRFrelatorios` 7066 · `renderVRFmapa` 7083 · `initVRFmapa` 7106 · `vrfCentralizarMapa` 7134
`renderVRFfotos` 7139 · `vrfVerFotoDetalhe` 7176 · `vrfMissaoResumo` 7198 · `vrfConfigObra` 7217
`vrfAddAndar` 7239 · `vrfRemoverAndar` 7243 · `vrfRenomearAndar` 7255 · `vrfSalvarObra` 7256
`vrfConfigMissao` 7270 · `vrfMissaoTab` 7290 · `vrfRenderMissaoSteps` 7295 · `vrfToggleMissao` 7314
`vrfSalvarMissao` 7328 · `vrfAbrirAndar` 7335 · `vrfToggleEtapa` 7380 · `carregarJsPDF` 7391
`exportarPDFos` 7409 · `gerarPDFos` 7419 · `vrfExportarPDF` 7530 · `gerarPDFandar` 7543

**CONFIG**

`renderConfig` 7655 · `toggleSet` 7731 · `setField` 7732 · `_templateRamoFallback` 7747
`_garantirChecklistConfig` 7755 · `_checklistCfgExibicao` 7759 · `renderChecklistConfig` 7762
`editarItemChecklist` 7781 · `removerItemChecklist` 7792 · `adicionarItemChecklist` 7801
`renderModuloConfig` 7822 · `salvarModuloConfig` 7830 · `renderVrfFasesConfig` 7855 · `editarEtapaVrf` 7877
`removerEtapaVrf` 7893 · `adicionarEtapaVrf` 7927 · `renderPrecoConfig` 7948 · `editarPrecoCategoria` 7965
`removerPrecoCategoria` 7976 · `adicionarPrecoCategoria` 7983 · `setFinanceiroPeriodo` 8008
`_dentroDoPeriodo` 8009 · `_rotuloPeriodo` 8020 · `financeiroResumo` 8024 · `renderFinanceiroHierarquia` 8041
`renderFinanceiroNotas` 8075 · `removerNotaFinanceira` 8096 · `adicionarNotaFinanceira` 8107
`renderFinanceiro` 8126 · `_reconciliarEquipe` 8161 · `renderEquipeConfig` 8206 · `openModalTecnico` 8241
`_vincularAcessoTecnico` 8300 · `_gerarCodigoConvite` 8321 · `_conviteExpirado` 8343
`gerarConviteTecnico` 8347 · `revogarConviteTecnico` 8393 · `_revogarConviteSeExistir` 8421
`_mostrarModalConvite` 8438 · `_copiarConviteCodigo` 8460 · `_atualizarNomeMembro` 8479
`_renomearTecnicoEmDados` 8500 · `salvarTecnico` 8518 · `removerTecnico` 8581 · `toggleModuloTec` 8624
`toggleObraTec` 8651 · `emptyState` 8668 · `diasAte` 8669 · `getTecnicoLoc` 8670 · `showModal` 8675
`closeModal` 8681 · `_temTourVisto` 8809 · `_gravarTourVisto` 8818 · `_temTourViewVisto` 8829
`_gravarTourViewVisto` 8835 · `_tourAlvoCandidatos` 8858 · `_tourElExiste` 8862
`_tourAdiarReposicaoAposAbrirSidebar` 8878 · `_tourAdiarReposicaoAposAbrirFloatMenu` 8895
`_tourElVisivel` 8915 · `_tourExisteProximoVisivel` 8946 · `_tourExisteAnteriorVisivel` 8950
`_tourIniciar` 8955 · `_tourIniciarView` 8966 · `_tourEntrarView` 8983 · `_tourAvancar` 9001
`_tourMostrarPasso` 9010 · `_tourReposicionar` 9057 · `_tourFechar` 9083 · `openModalOS` 9107 · `criarOS` 9133
`_selectTecnicoReatribuir` 9177 · `reatribuirOS` 9192 · `openDetalhe` 9203 · `salvarNota` 9287
`salvarValorOS` 9291 · `excluirOS` 9302 · `revisarOS` 9303 · `openModalManut` 9306 · `criarManut` 9331
`salvarManutEdicao` 9354 · `_reofereceAgenda` 9385 · `openModalManutEdit` 9404 · `excluirManut` 9441
`concluirManut` 9442 · `criarOSdeManut` 9453 · `agendarProximaManut` 9458 · `openModalCliente` 9461
`criarCliente` 9471 · `openHistoricoCliente` 9477 · `abrirGoogleAgenda` 9489 · `_painelMapaConteudoHtml` 9513
`_renderPainelMapa` 9538 · `abrirPainelMapa` 9555 · `fecharPainelMapa` 9561 · `toggleColapsoPainelMapa` 9562
`_carregarAvatarSvg` 9568 · `_avatarMarkerHtml` 9585 · `initMapa` 9595 · `atualizarMarcadores` 9605
`loadLeaflet` 9687 · `renderTecnicoApp` 9708 · `meuAvatarBtnLabel` 9735 · `abrirEscolhaAvatar` 9738
`escolherMeuAvatar` 9755 · `secTec` 9762 · `afterTecnicoRender` 9775 · `_temConsentimentoGPS` 9795
`_gravarConsentimentoGPS` 9804 · `_distM` 9812 · `ultimoCheckinHojeTs` 9820 · `meuLive` 9844
`liveAtivo` 9845 · `liveRestanteMs` 9846 · `fmtDuracaoMs` 9847 · `toggleGPS` 9853 · `toggleLive` 9854
`_mostrarConsentimentoGPS` 9861 · `_confirmarConsentimentoGPS` 9874 · `iniciarLive` 9881 · `pararLive` 9916
`_ligarWatchLive` 9928 · `liveRegistrarPonto` 9937 · `_pedirWakeLock` 9961 · `_soltarWakeLock` 9969
`_ligarGuardaLive` 9975 · `retomarLiveSePreciso` 9986 · `salvarPosicao` 10003 · `msgErroGPS` 10009
`updateGPSLabel` 10017 · `liveBlocoHTML` 10025 · `getExecTarefa` 10046 · `renderTarefas` 10049
`renderTarefasGestor` 10054 · `openModalTarefa` 10084 · `salvarTarefa` 10103 · `excluirTarefa` 10120
`verTarefaDetalhe` 10127 · `renderTarefasTecnico` 10150 · `abrirTarefa` 10176 · `voltarTarefa` 10177
`rerenderTarefaExec` 10178 · `renderExecTarefa` 10180 · `setupTarefaCam` 10222 · `tarefaRemoverFoto` 10262
`tarefaSalvarNota` 10275 · `tarefaCheckin` 10283 · `tarefaFinalizarCheckin` 10305 · `abrirMapaCoord` 10324
`tarefaCheckinHoje` 10347 · `concluirTarefa` 10352 · `_lembrarExecucao` 10373 · `_esquecerExecucao` 10377
`_retomarExecucaoSePreciso` 10381 · `abrirExecucao` 10393 · `renderExecucao` 10403 · `switchEquipTab` 10457
`updEquip` 10478 · `onEquipFoto` 10479 · `renderChecklistExec` 10505 · `toggleCheck` 10533
`onCheckFoto` 10542 · `execCheckin` 10557 · `finalizarCheckin` 10579 · `initSigCanvas` 10589
`limparSig` 10601 · `_pendenciasParaConcluir` 10607 · `verificarConcluir` 10631 · `execConcluir` 10646
`saveExecOS` 10664 · `voltarExec` 10665 · `renderManutTecnico` 10668 · `startNotifChecker` 10690
`checkManutencoes` 10716 · `notificarNavegador` 10734 · `enviarEmailManut` 10741 · `enviarSMSManut` 10742
`agendarLonge` 10762 · `cancelarLonge` 10771 · `_pubToken` 10775 · `pubURL` 10780 · `_thumbKey` 10781
`_thumb` 10786 · `pubPayloadOS` 10810 · `pubPayloadObra` 10840 · `publicarAcompanhamento` 10897
`_precisaNovoToken` 10922 · `gerarLinkOS` 10928 · `conferirLinkNoServidor` 10948 · `gerarLinkObra` 10966
`abrirModalLink` 10976 · `revogarLink` 11044 · `emitirEnderecoNovo` 11067 · `marcarLinkEnviado` 11090
`copiarLinkPub` 11099 · `agendarRepublicacao` 11119 · `republicarAtivos` 11124 · `_pubRotaToken` 11147
`_mostrarLinkAntigo` 11155 · `iniciarModoPublico` 11174 · `_pubOuvirToken` 11196 · `renderPublicoErro` 11238
`_pubStatusLbl` 11242 · `renderPublico` 11245 · `pubZoom` 11305 · `_lerMarcaRecarga` 11401
`_marcarRecarga` 11416 · `_campoComTextoNaoSalvo` 11433 · `_porQueNaoRecarregarAgora` 11449
`_recarregarQuandoSeguro` 11499 · `_motivoParaPessoa` 11549 · `_pedidoDaFaixa` 11567 · `_logFaixa` 11575
`_recarregarPorFaltaDeNuvem` 11589 · `_tentarDeNovoPelaFaixa` 11621 · `_acenderFaixaVersao` 11651
`_desenharIconeVersao` 11672 · `_medirAvisoVersao` 11687 · `_mostrarMotivoVersao` 11707
`_devolverBotaoAtualizar` 11716 · `_esperarResolve` 11732 · `_apressarAtualizacao` 11746
`_avisarVersaoNova` 11782 · `_avisarVersaoVelhaPorErro` 11795

## Estado de topo de arquivo

`firebaseConfig` 1232 · `fbApp` 1242 · `WORKSPACE` 1243 · `WORKSPACE_RAMO` 1244 · `WORKSPACE_NOME` 1245
`_signupInProgress` 1246 · `SYNC_KEYS` 1262 · `_quietWrite` 1274 · `_bootDone` 1275 · `_lastPushKey` 1276
`_snapshot` 1277 · `IDB_NOME` 1295 · `_idbConn` 1296 · `FOTO_CACHE_MAX` 1380 · `_fotoCache` 1381
`_opsEmVoo` 1407 · `_pintorLigado` 1489 · `DOC_LIMITE_BYTES` 1547 · `DOC_ALERTA_BYTES` 1548
`_falhasEnvio` 1553 · `_falhasLeitura` 1558 · `_chavesQuaseCheias` 1559 · `_versaoNovaDisponivel` 1563
`NOMES_DOC` 1566 · `_rondaNuvem` 1612 · `ITEM_LISTS` 1698 · `LEAF_MAPS` 1700 · `CHAVE_FOTOS` 1710
`FOTOS_PREFIXO` 1713 · `FOTO_OS_PREFIXO` 1728 · `MIGR_IDB_CHAVE` 1886 · `MIGR_IDB_OT_CHAVE` 1969
`FOTO_OBRA_PREFIXO` 2058 · `MIGR_FOTOS_CHAVE` 2201 · `FOTO_TAREFA_PREFIXO` 2227 · `SEP` 2443 · `_pend` 2448
`_localTouch` 2449 · `PUB_KEYS` 2542 · `_avisoMemoriaAberto` 2559 · `_interceptorOk` 2631 · `_pollTimer` 2647
`_enviandoRecuperacao` 2845 · `_tentandoNovamente` 2908 · `RAMO_RESERVADOS` 2952
`RAMO_CHAVES_PERIGOSAS` 2953 · `_prestadorEntrando` 3068 · `_consumindoConvite` 3110 · `_pushTimers` 3167
`APPEND_LISTS` 3169 · `MERGE_MAPS` 3172 · `IMMEDIATE_KEYS` 3174 · `_posicoesPorUid` 3237
`_nomesAmbiguosAvisados` 3241 · `_avisouPosicaoSemUid` 3430 · `_avisouSemPosicaoLocal` 3431
`_proximaTentativaLeitura` 3535 · `_filaSync` 4173 · `fbUnsubs` 4399 · `_avisouSessaoExpirada` 4593
`_fbLogs` 4619 · `tecnicos` 4829 · `AVATAR_IDS` 4842 · `avataresTecnicos` 4843 · `ICONS` 4857
`NAV_ITEMS` 4895 · `VRF_FASES` 4904 · `VRF_TOTAL_ETAPAS` 4916 · `vrfFasesConfig` 4926 · `vrfObras` 4947
`vrfObraAtualId` 4955 · `_mudouNaMigracaoTecVrfObras` 4994 · `vrfProgresso` 5034 · `vrfFotos` 5035
`vrfNotas` 5036 · `vrfRelatorios` 5037 · `vrfCheckins` 5038 · `localizacaoHistorico` 5044 · `tarefas` 5059
`liveTracks` 5061 · `vrfFotosMeta` 5063 · `vrfFloorTab` 5069 · `CHECKLIST_BASE` 5121 · `CHECKLIST_MANUT` 5133
`CHECKLIST_PREDIAL_BASE` 5143 · `CHECKLIST_PREDIAL_MANUT` 5155 · `RAMO_TEMPLATES` 5167
`checklistConfig` 5177 · `PRECO_TEMPLATES` 5224 · `precoConfig` 5251 · `moduloConfig` 5300 · `ETAPAS` 5336
`ETAPA_LBL` 5337 · `session` 5340 · `osList` 5341 · `clientes` 5342 · `manutencoes` 5343 · `settings` 5344
`financeiroNotas` 5345 · `currentView` 5346 · `currentFilter` 5347 · `currentDetailId` 5348
`mapaInstance` 5349 · `mapaMarkers` 5350 · `mapaTrails` 5351 · `_encerrandoPorRemocao` 5644
`_compartilhando` 5687 · `_avalNota` 5741 · `VIEW_META` 5797 · `navbarContexto` 5836 · `_vrfFotoTarget` 6671
`_fotoEmProcessamento` 6704 · `_travaFotoTimer` 6705 · `FOTO_MAX_BYTES` 6709 · `vrfMapaInstance` 7082
`_vrfMissaoAndarIdx` 7269 · `financeiroPeriodo` 8007 · `_reconciliandoEquipe` 8160
`CONVITE_VALIDADE_MS` 8342 · `_timerFecharModal` 8680 · `TOUR_VERSAO` 8706 · `TOUR_GESTOR` 8708
`TOUR_TECNICO` 8722 · `TOUR_VIEWS_GESTOR` 8739 · `TOUR_VIEWS_TECNICO` 8788 · `_tourPassos` 8800
`_tourIndice` 8801 · `_tourResizeHandler` 8802 · `_tourContextoAtual` 8806 · `mapaPainelAberto` 9510
`mapaPainelColapsado` 9511 · `_avatarSvgCache` 9567 · `gpsWatchId` 9783 · `LIVE_DURACAO_MS` 9784
`LIVE_INTERVALO_MS` 9785 · `LIVE_DIST_MIN_M` 9786 · `LIVE_MAX_PONTOS` 9787 · `_liveUltimoReg` 9788
`_liveWakeLock` 9789 · `_liveGuardTimer` 9790 · `GPS_CONSENT_VERSAO` 9794 · `execTarefaId` 10045
`TF_LABEL` 10047 · `execOS` 10365 · `EXEC_ABERTA` 10372 · `sigCtx` 10588 · `PUB_LIMITE_BYTES` 10751
`PUB_VALIDADE_MS` 10754 · `MAX_TIMEOUT_MS` 10761 · `_thumbCache` 10772 · `_pubUltimo` 10773
`_pubTimer` 11118 · `_pubRota` 11311 · `_TINHA_CONTROLADOR` 11359 · `RECARGA_ESPERA_MS` 11360
`RECARGA_CARENCIA_MS` 11361 · `RECARGA_TETO` 11362 · `RECARGA_MARCA` 11363 · `PROCURA_MINIMA_MS` 11364
`BOTAO_ATUALIZAR_TETO_MS` 11365 · `MOTIVO_PUBLICO` 11369 · `_timerRecarga` 11370
`_timerBotaoAtualizar` 11371 · `_recargaManualPedida` 11372 · `_recargaPedida` 11373
`_ultimoMotivoAdiado` 11374 · `_timerFaixa` 11383 · `_ultimoMotivoFaixa` 11384 · `_ultimaProcura` 11385
`_versaoNovaDetectada` 11394

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
`lightboxImg` 1220 · `modalRoot` 1223 · `tourRoot` 1226 · `avalNotas` 5750 · `avalTexto` 5754
`osGridContainer` 6215 · `mapaBox` 6345 · `mapaPainelInfo` 6346 · `mapaCardEquipe` 6348
`mapaCardHistorico` 6352 · `vrfTabs` 6514 · `vrfPainel` 6517 · `vrfRespNome` 6521 · `vrfObs` 6522
`vrfCameraInput` 6526 · `vrfNotaTxt` 6819 · `vrfNovaObraNome` 6991 · `vrfNovaObraEndereco` 6992
`vrfMapaBox` 7091 · `vrfNome` 7226 · `vrfEndereco` 7227 · `vrfMeta` 7228 · `vrfAndaresList` 7230
`vrfMissaoTabs` 7280 · `vrfMissaoAndarAtual` 7281 · `vrfMissaoSteps` 7282 · `diagStatus` 7720
`diagTamanhos` 7723 · `diagAparelho` 7725 · `diagLogBody` 7727 · `moduloNome` 7826 · `moduloDesc` 7827
`novaCategoriaPreco` 7961 · `notaPrestador` 8081 · `notaValor` 8082 · `notaObs` 8084 · `finPeriodo` 8132
`finHierarquiaCard` 8144 · `tNome` 8248 · `tUid` 8252 · `modCardSplit` 8257 · `tSplit` 8258
`modCardVrf` 8263 · `tVrf` 8264 · `conviteCodigoInput` 8448 · `curOverlay` 8675 · `tourBackdrop` 9020
`tourSpot` 9021 · `tourCard` 9022 · `oCliente` 9111 · `clientesList` 9112 · `oEndereco` 9113 · `oTipo` 9115
`oTecnico` 9118 · `oData` 9121 · `oHora` 9122 · `oSplits` 9124 · `oObs` 9125 · `notaGestor` 9250
`osValor` 9256 · `osValorStatus` 9257 · `mCliente` 9311 · `mEndereco` 9313 · `mData` 9315 · `mTecnico` 9316
`mTipo` 9319 · `mRecorrencia` 9320 · `mObs` 9322 · `meData` 9411 · `meTipo` 9418 · `meRecorrencia` 9421
`meEndereco` 9426 · `meObs` 9427 · `cNome` 9465 · `cEndereco` 9466 · `cContato` 9467 · `gpsLabel` 9727
`tfNome` 10090 · `tfDesc` 10091 · `tfTec` 10092 · `tfMax` 10093 · `tfNotas` 10095 · `tarefaNota` 10187
`btnTarefaCheckin` 10198 · `tarefaCamInput` 10211 · `coordMapaBox` 10328 · `equipPanelArea` 10425
`checklistArea` 10432 · `sigCanvas` 10439 · `pendConcluir` 10443 · `btnConcluir` 10444 · `pubLinkInput` 11018
`pubZoom` 11303 · `pubZoomImg` 11303

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
