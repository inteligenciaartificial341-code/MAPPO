const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const BASE='http://localhost:'+srv.address().port+'/';
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1100,height:800}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto(BASE,{waitUntil:'load'}); await pg.waitForTimeout(300);
  /* Aba nova JA no estado do defeito: dentro do app, sem nuvem resolvida, faixa desenhada.
     Aba PROPRIA de proposito nos CHECKs 8 e 9: lá a pagina recarrega de verdade, e isso
     apagaria o estado que os outros checks usam. */
  const entrarSemNuvem=async(p)=>{
    await p.goto(BASE,{waitUntil:'load'}); await p.waitForTimeout(300);
    await p.evaluate(()=>{
      session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
      _gravarTourVisto(); entrarApp(); const s=document.getElementById('splashScreen'); if(s)s.remove();
      fbReady=false; WORKSPACE=null;
      _falhasEnvio={}; _falhasLeitura={}; _chavesQuaseCheias={};
      _atualizarAlertaSync();});
    await p.waitForTimeout(150);
  };

  console.log('\n=== CHECK 1: na tela de login, nao acusa nada ===');
  assert(await pg.evaluate(()=>{session=null;return _semNuvem();})===false,'sem sessao, nao acusa');

  console.log('\n=== CHECK 2: EXATAMENTE o estado do Paulo (fbReady=false, WORKSPACE=null) ===');
  const r2=await pg.evaluate(()=>{
    session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
    _gravarTourVisto(); entrarApp(); const s=document.getElementById('splashScreen'); if(s)s.remove();
    fbReady=false; WORKSPACE=null;
    _versaoNovaDisponivel=false; _falhasEnvio={}; _chavesQuaseCheias={};
    _atualizarAlertaSync();
    const el=document.getElementById('syncAlerta');
    return {semNuvem:_semNuvem(), visivel:!el.hidden, classe:el.className,
            txt:el.textContent.replace(/\s+/g,' ').trim()};
  });
  console.log('  ', r2.txt);
  assert(r2.semNuvem===true,'detecta o estado desconectado');
  assert(r2.visivel===true&&/erro/.test(r2.classe),'a faixa acende em vermelho');
  assert(/Sem conex[aã]o com a nuvem/i.test(r2.txt),'diz que esta sem nuvem');
  assert(/s[oó] neste aparelho/i.test(r2.txt),'explica a consequencia');
  assert(/links de cliente n[aã]o s[aã]o publicados/i.test(r2.txt),'cita o caso que aconteceu de verdade');

  console.log('\n=== CHECK 3: WORKSPACE nulo sozinho ja e problema ===');
  assert(await pg.evaluate(()=>{fbReady=true;WORKSPACE=null;return _semNuvem();})===true,'fbReady sem WORKSPACE tambem acusa');

  console.log('\n=== CHECK 4: conectado -> faixa some ===');
  const r4=await pg.evaluate(()=>{fbReady=true;WORKSPACE='ws';_atualizarAlertaSync();
    return {hidden:document.getElementById('syncAlerta').hidden,semNuvem:_semNuvem()};});
  assert(r4.semNuvem===false&&r4.hidden===true,'com nuvem resolvida, a faixa some');

  console.log('\n=== CHECK 5: sem nuvem VENCE falha de envio e aviso de espaco ===');
  const r5=await pg.evaluate(()=>{
    fbReady=false; WORKSPACE=null;
    _falhasEnvio={'mappo_os':{erro:'x',hora:'10:00'}}; _chavesQuaseCheias={'mappo_os':900000};
    _atualizarAlertaSync();
    return document.getElementById('syncAlerta').textContent.replace(/\s+/g,' ').trim();
  });
  assert(/Sem conex/i.test(r5),'o aviso de conexao vence os demais');

  /* Ate 02/10/2026 o aviso de versao nova morava NESTA faixa e disputava prioridade com o
     "sem conexao": quem acendia depois sequestrava a faixa do outro. Agora o de versao tem
     elemento proprio (#avisoVersao, pilula fixa no rodape, paleta da logo), e nao ha mais
     disputa -- os dois ficam na tela ao mesmo tempo. O que este check guarda e justamente isso:
     o aviso de versao NAO esconde mais a mensagem de maior consequencia. */
  console.log('\n=== CHECK 6: versao nova NAO sequestra mais a faixa de sem-conexao ===');
  /* Guarda de legibilidade do CONTROLE: com MAPPO_RAIZ apontando para uma versao anterior (onde
     o aviso de versao ainda morava no #syncAlerta) esta suite estourava um TypeError de
     "null.hidden" aqui. Agora ela diz o que falta. Prova que sai ilegivel nao e prova. */
  const temAviso=await pg.evaluate(()=>({el:!!document.getElementById('avisoVersao'),
    fn:typeof _acenderFaixaVersao==='function'}));
  assert(temAviso.el===true,'o #avisoVersao existe nesta versao do app (o aviso de versao saiu do #syncAlerta em 02/10/2026)');
  assert(temAviso.fn===true,'_acenderFaixaVersao existe');
  const r6=await pg.evaluate(()=>{_acenderFaixaVersao();_atualizarAlertaSync();
    return {faixa:document.getElementById('syncAlerta').textContent.replace(/\s+/g,' ').trim(),
            bandeira:_versaoNovaDisponivel,
            avisoVisivel:!document.getElementById('avisoVersao').hidden};});
  console.log('  ', JSON.stringify({bandeira:r6.bandeira,aviso:r6.avisoVisivel}));
  assert(r6.bandeira===true,'controle positivo: o aviso de versao nova esta aceso');
  assert(/Sem conex/i.test(r6.faixa),'a faixa continua dizendo "sem conexao" -- a mensagem de maior consequencia');
  assert(r6.avisoVisivel===true,'e o aviso de versao aparece junto, em elemento proprio');
  const r6b=await pg.evaluate(()=>{fbReady=true;WORKSPACE='ws';
    _falhasEnvio={};_chavesQuaseCheias={};_atualizarAlertaSync();
    return {faixaOculta:document.getElementById('syncAlerta').hidden,
            avisoVisivel:!document.getElementById('avisoVersao').hidden};});
  assert(r6b.faixaOculta===true,'resolvida a conexao, a faixa de sincronizacao some');
  assert(r6b.avisoVisivel===true,'e o aviso de versao nova continua na tela, independente dela');

  console.log('\n=== CHECK 7: a ronda de vigilancia fica ativa ===');
  assert(await pg.evaluate(()=>{_vigiarConexao();return _rondaNuvem!==null;})===true,'ronda de 5s instalada');

  /* A FAIXA DE SEM CONEXAO NAO RECARREGA MAIS POR CIMA DO TRABALHO DE NINGUEM (07/10/2026).
     Ate aqui o ramo _semNuvem() fazia `el.onclick=()=>location.reload()` na faixa INTEIRA:
     um toque em qualquer ponto dela recarregava por cima de foto sendo gravada no armazem do
     aparelho -- e a foto se perde, porque o input dela ja foi limpo. Dói mais justamente
     offline, que e quando o que o tecnico lancou ainda nao subiu para lugar nenhum.
     Agora o toque PEDE e a guarda (_porQueNaoRecarregarAgora) decide a hora, igual ao botao
     "Atualizar" do aviso de versao.
     A recarga e medida por NAVEGACAO de verdade (framenavigated), nao por espiao em
     location.reload: o Chromium nao deixa redefinir essa propriedade, e um espiao que nao
     instala devolveria "nao recarregou" pelo motivo errado.
     A FORMA do onclick e conferida ANTES do toque, de proposito, e e o que faz o CONTROLE ser
     legivel: rodando com MAPPO_RAIZ no commit anterior, a faixa recarrega de verdade no toque
     e o Playwright estoura "Execution context was destroyed" -- vermelho que nao diz nada.
     Conferindo a forma primeiro, o controle reprova nomeando o defeito e nem chega a tocar. */
  console.log('\n=== CHECK 8: toque na faixa com foto em gravacao NAO recarrega ===');
  const pg2=await b.newPage({viewport:{width:1100,height:800}});
  const nav2={n:0}; pg2.on('framenavigated',f=>{if(f===pg2.mainFrame())nav2.n++;});
  const erros2=[]; pg2.on('pageerror',e=>erros2.push('aba do toque: '+e.message));
  await entrarSemNuvem(pg2);
  const base2=nav2.n;
  const antes=await pg2.evaluate(()=>{
    _abrirOp('gravando foto de teste');
    const el=document.getElementById('syncAlerta');
    return {motivo:_porQueNaoRecarregarAgora(true),fonte:String(el.onclick),
      visivel:!el.hidden,classe:el.className,
      acao:((el.querySelector('.sync-alerta-acao')||{}).textContent||''),
      txt:el.textContent.replace(/\s+/g,' ').trim()};});
  console.log('  ', JSON.stringify({motivo:antes.motivo,acao:antes.acao,onclick:antes.fonte}));
  assert(antes.visivel===true&&/erro/.test(antes.classe),'controle positivo: a faixa de sem conexao estava na tela, clicavel');
  assert(/opera[çc][ãa]o em voo/.test(antes.motivo),'controle positivo: a guarda ESTAVA dizendo "operacao em voo"');
  assert(!/location\.reload/.test(antes.fonte),'o onclick da faixa NAO e um location.reload() direto -- e isto que apagava foto: '+antes.fonte);
  assert(!/^\s*Recarregar\s*$/.test(antes.acao)&&/reconectar/i.test(antes.acao),'o texto da acao nao promete o que a guarda pode adiar: "'+antes.acao+'"');
  /* e agora o COMPORTAMENTO, nao so a forma: o toque de verdade, num filho da faixa, que
     borbulha ate o onclick dela */
  const ocupado=await pg2.evaluate(async()=>{
    const el=document.getElementById('syncAlerta');
    (el.querySelector('.sync-alerta-acao')||el).click();
    await new Promise(r=>setTimeout(r,300));
    return {pedida:_recargaPedida,timerFaixa:_timerFaixa!==null,timerVersao:_timerRecarga!==null,
      manual:_recargaManualPedida,
      toast:document.getElementById('toast').textContent,
      logs:(_fbLogs||[]).filter(l=>/faixa/i.test(l.msg)).map(l=>l.tipo+': '+l.msg)};});
  console.log('  ', JSON.stringify(ocupado), ' navegacoes:', nav2.n-base2);
  assert(nav2.n-base2===0,'o toque NAO recarregou com foto em gravacao -- a linha vermelha do projeto');
  assert(ocupado.pedida===false,'a recarga nem foi pedida: o toque passou pela guarda, nao por cima dela');
  assert(ocupado.timerFaixa===true,'ficou uma tentativa agendada no timer DA FAIXA: o pedido nao foi descartado');
  assert(ocupado.timerVersao===false,'e o timer da versao nova nao foi usado: sao dois pedidos separados');
  /* O motivo chega a pessoa em portugues de gente ("algo ainda esta sendo salvo"), e o LOG
     guarda o motivo tecnico ("operacao em voo: ..."), que e por onde se investiga. */
  assert(/algo ainda est[áa] sendo salvo/i.test(ocupado.toast),'a pessoa foi avisada em palavras dela: "'+ocupado.toast+'"');
  assert(!/opera[çc][ãa]o em voo/.test(ocupado.toast),'e o jargao da guarda nao vaza para a tela do tecnico');
  assert(ocupado.logs.filter(l=>/opera[çc][ãa]o em voo/.test(l)).length===1,'o log guarda o motivo TECNICO, uma vez: '+JSON.stringify(ocupado.logs));
  assert(/^info/.test(ocupado.logs.filter(l=>/opera[çc][ãa]o em voo/.test(l))[0]||''),'e em nivel info, porque o app vai resolver sozinho (erro aqui encheria o anel de 60 linhas)');

  /* A BANDEIRA GLOBAL NAO E LIGADA PELO TOQUE (achado da revisao de 07/10/2026). Uma versao
     deste trabalho ligava _recargaManualPedida=true aqui e nunca zerava: um toque na faixa --
     inclusive este, que nao recarregou nada -- desligava o RECARGA_TETO das recargas
     AUTOMATICAS pelo resto da vida da pagina, e o `n` da marca parava de subir. O teto e a rede
     contra o app que pisca sem parar e nao abre. Quem pede viaja no objeto do pedido. */
  assert(ocupado.manual===false,'o toque NAO ligou a bandeira global _recargaManualPedida: a intencao viaja com o pedido, nao por cima da guarda');

  console.log('\n=== CHECK 8b: terminada a gravacao, e AINDA sem nuvem, a recarga vem sozinha ===');
  const motivoDepois=await pg2.evaluate(()=>{_fecharOp('gravando foto de teste');
    return {motivo:_porQueNaoRecarregarAgora(true),semNuvem:_semNuvem()};});
  assert(motivoDepois.motivo==='','controle positivo: depois de _fecharOp a hora passou a ser segura');
  /* o que distingue este check do 8c: aqui a nuvem CONTINUA fora, entao o pedido continua
     fazendo sentido e a recarga tem de vir. No 8c a nuvem volta e o pedido morre. */
  assert(motivoDepois.semNuvem===true,'controle positivo: a nuvem continua fora -- o motivo do pedido ainda existe');
  for(let i=0;i<30&&nav2.n-base2===0;i++) await pg2.waitForTimeout(300);   // RECARGA_ESPERA_MS=4000
  console.log('   navegacoes depois de liberar:', nav2.n-base2);
  assert(nav2.n-base2>=1,'e ai sim recarregou, sozinho, sem novo toque');
  await pg2.waitForTimeout(600);                      // deixa a pagina recarregada terminar o boot
  console.log('   erros desta aba:', erros2.length?erros2:'(nenhum)');
  assert(erros2.length===0,'a aba que recarregou de verdade nao deixou erro de pagina');
  await pg2.close();

  console.log('\n=== CHECK 9: toque na faixa sem nada em voo recarrega na hora ===');
  const pg3=await b.newPage({viewport:{width:1100,height:800}});
  const nav3={n:0}; pg3.on('framenavigated',f=>{if(f===pg3.mainFrame())nav3.n++;});
  const erros3=[]; pg3.on('pageerror',e=>erros3.push('aba livre: '+e.message));
  await entrarSemNuvem(pg3);
  const base3=nav3.n;
  const livre=await pg3.evaluate(()=>{
    const motivo=_porQueNaoRecarregarAgora(true);
    const el=document.getElementById('syncAlerta');
    (el.querySelector('.sync-alerta-acao')||el).click();
    return {motivo,visivel:!el.hidden};});
  assert(livre.visivel===true,'controle positivo: a faixa estava na tela nesta aba tambem');
  assert(livre.motivo==='','controle positivo: a hora ERA segura (nenhum motivo pendente)');
  for(let i=0;i<20&&nav3.n-base3===0;i++) await pg3.waitForTimeout(200);
  console.log('   navegacoes:', nav3.n-base3);
  assert(nav3.n-base3>=1,'o toque em hora segura recarregou -- a faixa continua cumprindo o que oferece');
  await pg3.waitForTimeout(500);
  console.log('   erros desta aba:', erros3.length?erros3:'(nenhum)');
  assert(erros3.length===0,'sem erro de pagina nesta aba');
  await pg3.close();

  /* O PEDIDO MORRE QUANDO O MOTIVO DELE MORRE (achado da revisao de 07/10/2026).
     Toque com foto gravando -> espera agendada. A nuvem volta sozinha, a faixa sai da tela, a
     gravacao termina -- e a pagina recarregava assim mesmo, do nada, com o app saudavel. O
     pedido nasceu de "estou sem nuvem": sem nuvem, nao ha o que reconectar. */
  console.log('\n=== CHECK 10: a nuvem volta sozinha -> o pedido da faixa MORRE ===');
  const pg4=await b.newPage({viewport:{width:1100,height:800}});
  const nav4={n:0}; pg4.on('framenavigated',f=>{if(f===pg4.mainFrame())nav4.n++;});
  const erros4=[]; pg4.on('pageerror',e=>erros4.push('aba do pedido morto: '+e.message));
  await entrarSemNuvem(pg4);
  const base4=nav4.n;
  const agendou=await pg4.evaluate(()=>{
    _abrirOp('gravando foto de teste');
    const el=document.getElementById('syncAlerta');
    (el.querySelector('.sync-alerta-acao')||el).click();
    return {timer:_timerFaixa!==null};});
  assert(agendou.timer===true,'controle positivo: o toque agendou a espera');
  const voltou=await pg4.evaluate(()=>{
    fbReady=true; WORKSPACE='ws'; _atualizarAlertaSync();   // a nuvem voltou sozinha
    _fecharOp('gravando foto de teste');                    // e a gravacao terminou
    return {semNuvem:_semNuvem(),faixaEscondida:document.getElementById('syncAlerta').hidden,
      motivo:_porQueNaoRecarregarAgora(true)};});
  console.log('  ', JSON.stringify(voltou));
  assert(voltou.semNuvem===false&&voltou.faixaEscondida===true,'controle positivo: a nuvem voltou e a faixa saiu da tela');
  assert(voltou.motivo==='','controle positivo: a hora E segura -- se o pedido ainda valesse, ele recarregaria agora (e isto que torna o check abaixo uma prova)');
  for(let i=0;i<22&&nav4.n-base4===0;i++) await pg4.waitForTimeout(300);   // passa de RECARGA_ESPERA_MS=4000
  console.log('   navegacoes depois de a nuvem voltar:', nav4.n-base4);
  assert(nav4.n-base4===0,'a pagina NAO recarregou: o pedido morreu junto com o motivo que o criou');
  /* A morte do pedido tem DUAS camadas, e cada uma e medida aqui: provado por mutacao em
     07/10/2026 -- tirando so uma delas a outra ainda matava o pedido e o check ficava verde,
     entao um assert solto nao prendia nenhuma. */
  const morreu=await pg4.evaluate(()=>{
    const p=_pedidoDaFaixa();
    return {timer:_timerFaixa!==null,
      logs:(_fbLogs||[]).filter(l=>/abandonado/i.test(l.msg)).map(l=>l.msg),
      temValeAinda:typeof p.valeAinda==='function',
      valeAinda:typeof p.valeAinda==='function'?p.valeAinda():null};});
  assert(morreu.timer===false,'e a espera nao ficou batendo para sempre numa tela saudavel');
  assert(morreu.temValeAinda===true,'camada 1: o pedido carrega o proprio criterio de validade (valeAinda), que _recarregarQuandoSeguro confere antes de recarregar');
  assert(morreu.valeAinda===false,'e com a nuvem de volta ele diz que nao vale mais');
  assert(morreu.logs.filter(m=>/a nuvem voltou e a faixa saiu da tela/i.test(m)).length>=1,'camada 2: a espera da faixa tambem reconfere, e foi ela quem registrou o abandono aqui: '+JSON.stringify(morreu.logs));
  console.log('   erros desta aba:', erros4.length?erros4:'(nenhum)');
  assert(erros4.length===0,'sem erro de pagina nesta aba');
  await pg4.close();

  /* DIZER "ESPERAR NAO RESOLVE" E ESPERAR ASSIM MESMO (achado da revisao de 07/10/2026).
     Com texto digitado e nao salvo, o toast dizia "nao da para reconectar agora", o log dizia
     "esperar nao resolve isto" -- e a espera ficava armada de 4 em 4 segundos. Quando a pessoa
     salvasse a nota, muito depois, a pagina recarregava SOZINHA, sem novo toque: exatamente a
     recarga surpresa que esta entrega veio tirar do caminho.
     A segunda metade deste check e a mais importante da entrega: o toque da faixa NAO pode
     desligar o teto anti-laco da recarga AUTOMATICA. */
  console.log('\n=== CHECK 11: motivo que nao se resolve esperando -> nao agenda nada ===');
  const pg5=await b.newPage({viewport:{width:1100,height:800}});
  const nav5={n:0}; pg5.on('framenavigated',f=>{if(f===pg5.mainFrame())nav5.n++;});
  const erros5=[]; pg5.on('pageerror',e=>erros5.push('aba do beco sem saida: '+e.message));
  await entrarSemNuvem(pg5);
  const base5=nav5.n;
  const naoResolve=await pg5.evaluate(async()=>{
    /* marca com o teto estourado e SEM carencia (ts antigo): assim o unico motivo do caminho
       AUTOMATICO, mais abaixo, e o teto */
    sessionStorage.setItem('mappo_recarga_versao',JSON.stringify({n:3,ts:Date.now()-5*60*1000}));
    /* texto digitado e nao salvo: motivo que SO a pessoa resolve (ver _esperarResolve) */
    const area=document.createElement('div');
    area.id='__areaNota';
    area.innerHTML='<textarea id="notaGestor">nota salva</textarea>';
    document.body.appendChild(area);
    const nota=document.getElementById('notaGestor');
    nota.value='nota salva com coisa nova'; nota.blur();
    document.getElementById('toast').textContent='';
    const motivo=_porQueNaoRecarregarAgora(true);
    const el=document.getElementById('syncAlerta');
    (el.querySelector('.sync-alerta-acao')||el).click();
    await new Promise(r=>setTimeout(r,300));
    return {motivo,timerFaixa:_timerFaixa!==null,timerVersao:_timerRecarga!==null,
      manual:_recargaManualPedida,toast:document.getElementById('toast').textContent,
      logs:(_fbLogs||[]).filter(l=>/faixa/i.test(l.msg)).map(l=>l.tipo+': '+l.msg)};});
  console.log('  ', JSON.stringify(naoResolve), ' navegacoes:', nav5.n-base5);
  assert(/^texto digitado e n[aã]o salvo/.test(naoResolve.motivo),'controle positivo: o motivo e um que so a PESSOA resolve');
  assert(nav5.n-base5===0,'nao recarregou agora');
  assert(naoResolve.timerFaixa===false&&naoResolve.timerVersao===false,'e NAO agendou tentativa nenhuma: senao a pagina recarregaria sozinha quando a pessoa salvasse a nota, sem novo toque');
  assert(/N[aã]o d[áa] para reconectar agora/i.test(naoResolve.toast),'o toast nao promete espera: "'+naoResolve.toast+'"');
  assert(/ainda n[aã]o salvo/i.test(naoResolve.toast)&&!/notaGestor/.test(naoResolve.toast),'e diz o motivo em palavras de gente, sem o id do campo');
  assert(naoResolve.logs.filter(l=>/^erro.*esperar n[aã]o resolve/.test(l)).length===1,'e o log registra o beco sem saida em nivel erro, que e o que alguem investigando procura: '+JSON.stringify(naoResolve.logs));

  console.log('\n--- CHECK 11b: e o toque NAO desligou o teto da recarga automatica ---');
  const auto=await pg5.evaluate(async()=>{
    const nota=document.getElementById('notaGestor');
    nota.value=nota.defaultValue;                        // a pessoa salvou: o motivo saiu
    const antes={automatico:_porQueNaoRecarregarAgora(),humano:_porQueNaoRecarregarAgora(true)};
    _recarregarQuandoSeguro();                           // agora o Service Worker pede, sozinho
    await new Promise(r=>setTimeout(r,400));
    return {antes,pedida:_recargaPedida,marca:sessionStorage.getItem('mappo_recarga_versao'),
      logs:(_fbLogs||[]).filter(l=>/desligada/i.test(l.msg)).map(l=>l.msg)};});
  console.log('  ', JSON.stringify(auto), ' navegacoes:', nav5.n-base5);
  assert(auto.antes.automatico==='teto de recargas automáticas desta sessão','controle positivo: para o caminho AUTOMATICO o teto esta de fato estourado');
  assert(auto.antes.humano==='','controle positivo: e para um pedido humano o mesmo estado nao devolve motivo -- e por isso que a bandeira global afrouxava a guarda');
  assert(nav5.n-base5===0,'a recarga AUTOMATICA continua barrada pelo teto depois do toque na faixa: nenhum pedido afrouxa a guarda para outro');
  assert(auto.pedida===false,'e nada foi marcado como recarga pedida');
  assert(/"n":3/.test(auto.marca||''),'a marca continua em n=3: o teto nao foi zerado por carona');
  assert(auto.logs.filter(m=>/^Vers[aã]o nova: recarga autom[áa]tica desligada/.test(m)).length>=1,'e o log diz "Versao nova", nao "Sem conexao": a origem viaja com o pedido e nao fica grudada na pagina depois de um toque na faixa: '+JSON.stringify(auto.logs));
  console.log('   erros desta aba:', erros5.length?erros5:'(nenhum)');
  assert(erros5.length===0,'sem erro de pagina nesta aba');
  await pg5.close();

  /* O teto RECARGA_TETO raciona a recarga AUTOMATICA. Ele nao pode racionar a pessoa que esta
     com o aparelho na mao e sem nuvem -- e nao pode ser desligado por ela, tambem. As duas
     metades na mesma aba. */
  console.log('\n=== CHECK 12: com o teto estourado, o toque da PESSOA ainda funciona ===');
  const pg6=await b.newPage({viewport:{width:1100,height:800}});
  const nav6={n:0}; pg6.on('framenavigated',f=>{if(f===pg6.mainFrame())nav6.n++;});
  const erros6=[]; pg6.on('pageerror',e=>erros6.push('aba do teto: '+e.message));
  await entrarSemNuvem(pg6);
  const base6=nav6.n;
  const teto=await pg6.evaluate(()=>{
    sessionStorage.setItem('mappo_recarga_versao',JSON.stringify({n:3,ts:Date.now()-5*60*1000}));
    const antes={automatico:_porQueNaoRecarregarAgora(),humano:_porQueNaoRecarregarAgora(true)};
    const el=document.getElementById('syncAlerta');
    (el.querySelector('.sync-alerta-acao')||el).click();
    return {antes,manual:_recargaManualPedida};});
  console.log('  ', JSON.stringify(teto));
  assert(teto.antes.automatico==='teto de recargas automáticas desta sessão','controle positivo: o teto esta estourado para a recarga automatica');
  assert(teto.antes.humano==='','controle positivo: e nao vale para o pedido humano');
  assert(teto.manual===false,'o toque fez o que a pessoa pediu SEM ligar a bandeira global');
  for(let i=0;i<20&&nav6.n-base6===0;i++) await pg6.waitForTimeout(200);
  console.log('   navegacoes:', nav6.n-base6);
  assert(nav6.n-base6>=1,'e recarregou: o teto raciona a tentativa automatica, nao quem esta em campo pedindo');
  await pg6.waitForTimeout(500);
  console.log('   erros desta aba:', erros6.length?erros6:'(nenhum)');
  assert(erros6.length===0,'sem erro de pagina nesta aba');
  await pg6.close();

  console.log('\n=== CHECK 13: com uma recarga ja em curso, o toque responde em vez de ficar mudo ===');
  const pg7=await b.newPage({viewport:{width:1100,height:800}});
  const nav7={n:0}; pg7.on('framenavigated',f=>{if(f===pg7.mainFrame())nav7.n++;});
  const erros7=[]; pg7.on('pageerror',e=>erros7.push('aba da recarga em curso: '+e.message));
  await entrarSemNuvem(pg7);
  const base7=nav7.n;
  const emCurso=await pg7.evaluate(async()=>{
    _recargaPedida=true;                        // uma recarga ja foi decidida nesta pagina
    document.getElementById('toast').textContent='';
    const antes=(_fbLogs||[]).filter(l=>/faixa/i.test(l.msg)).length;
    const el=document.getElementById('syncAlerta');
    (el.querySelector('.sync-alerta-acao')||el).click();
    await new Promise(r=>setTimeout(r,200));
    return {toast:document.getElementById('toast').textContent,timer:_timerFaixa!==null,
      linhasAntes:antes,linhasDepois:(_fbLogs||[]).filter(l=>/faixa/i.test(l.msg)).length};});
  console.log('  ', JSON.stringify(emCurso), ' navegacoes:', nav7.n-base7);
  assert(/Recarregando/i.test(emCurso.toast),'o toque responde "Recarregando..." -- toque sem resposta parece app travado: "'+emCurso.toast+'"');
  assert(emCurso.timer===false,'e nao agenda uma segunda espera em cima da recarga que ja vem');
  assert(emCurso.linhasDepois===emCurso.linhasAntes,'nem gasta linha do anel de log de 60 linhas');
  assert(erros7.length===0,'sem erro de pagina nesta aba');
  await pg7.close();

  /* APARELHO SEM REDE. Recarregar nao reconecta nada, e se esta pagina nao estiver sendo
     servida pelo Service Worker a recarga NAO VOLTA: tela de erro do navegador, app fora do ar,
     com o trabalho do dia so neste aparelho. E a faixa aparece justamente nesse estado. */
  console.log('\n=== CHECK 14: aparelho sem internet -> o toque explica em vez de recarregar ===');
  const pg8=await b.newPage({viewport:{width:1100,height:800}});
  const nav8={n:0}; pg8.on('framenavigated',f=>{if(f===pg8.mainFrame())nav8.n++;});
  const erros8=[]; pg8.on('pageerror',e=>erros8.push('aba sem rede: '+e.message));
  await entrarSemNuvem(pg8);
  const base8=nav8.n;
  await pg8.context().setOffline(true);
  /* O toque fica FORA do evaluate que mede, de proposito: sem a guarda de rede a pagina
     recarrega aqui -- e, offline, a recarga nao volta. Medindo de fora, o teste reprova dizendo
     "recarregou" em vez de estourar "Execution context was destroyed", que nao diz nada.
     Provado por mutacao em 07/10/2026: com a guarda removida, 1 navegacao e a pagina de erro
     do navegador no lugar do app. */
  const online=await pg8.evaluate(()=>{document.getElementById('toast').textContent='';return navigator.onLine;});
  assert(online===false,'controle positivo: para o navegador o aparelho esta sem rede');
  await pg8.evaluate(()=>{const el=document.getElementById('syncAlerta');
    (el.querySelector('.sync-alerta-acao')||el).click();});
  await pg8.waitForTimeout(700);
  console.log('   navegacoes com o aparelho offline:', nav8.n-base8);
  assert(nav8.n-base8===0,'o toque NAO recarregou: sem rede a recarga nao reconecta nada e, se o Service Worker nao estiver servindo a pagina, nao volta -- o app sairia do ar com o trabalho do dia so neste aparelho');
  const semRede=await pg8.evaluate(()=>({toast:document.getElementById('toast').textContent,
    timer:_timerFaixa!==null,
    logs:(_fbLogs||[]).filter(l=>/internet/i.test(l.msg)).map(l=>l.tipo+': '+l.msg)}));
  console.log('  ', JSON.stringify(semRede));
  assert(/sem internet/i.test(semRede.toast)&&/continua salvo/i.test(semRede.toast),'e a pessoa ouve o porque, com a garantia de que o que ela fez nao se perdeu: "'+semRede.toast+'"');
  assert(semRede.timer===false,'e nada ficou prometido para depois: nao se promete o que nao se ofereceu');
  assert(semRede.logs.length>=1,'registrado no log: '+JSON.stringify(semRede.logs));
  await pg8.context().setOffline(false);
  const comRede=await pg8.evaluate(()=>{
    const el=document.getElementById('syncAlerta');
    (el.querySelector('.sync-alerta-acao')||el).click();
    return navigator.onLine;});
  assert(comRede===true,'controle positivo: a rede voltou para o navegador');
  for(let i=0;i<20&&nav8.n-base8===0;i++) await pg8.waitForTimeout(200);
  console.log('   navegacoes com a rede de volta:', nav8.n-base8);
  assert(nav8.n-base8>=1,'e com rede o MESMO toque recarrega: a recusa acima era da falta de rede, nao da faixa ter parado de funcionar');
  await pg8.waitForTimeout(500);
  console.log('   erros desta aba:', erros8.length?erros8:'(nenhum)');
  assert(erros8.length===0,'sem erro de pagina nesta aba');
  await pg8.close();

  /* Toque repetido lavava o anel de log: 10 toques, 10 linhas, e o anel tem 60 -- a evidencia
     de como o app chegou ali ia embora justamente quando alguem fosse investigar. */
  console.log('\n=== CHECK 15: dez toques deixam UMA linha no log, e o toast responde a todos ===');
  const pg9=await b.newPage({viewport:{width:1100,height:800}});
  const erros9=[]; pg9.on('pageerror',e=>erros9.push('aba dos dez toques: '+e.message));
  const nav9={n:0}; pg9.on('framenavigated',f=>{if(f===pg9.mainFrame())nav9.n++;});
  await entrarSemNuvem(pg9);
  const base9=nav9.n;
  const repetido=await pg9.evaluate(async()=>{
    _abrirOp('gravando foto de teste');
    const el=document.getElementById('syncAlerta');
    const alvo=el.querySelector('.sync-alerta-acao')||el;
    for(let i=0;i<9;i++){alvo.click();await new Promise(r=>setTimeout(r,20));}
    /* limpa o toast e toca a DECIMA vez: prova que a dedup e so do log -- a pessoa continua
       recebendo resposta em todo toque */
    document.getElementById('toast').textContent='';
    alvo.click();
    await new Promise(r=>setTimeout(r,100));
    return {linhas:(_fbLogs||[]).filter(l=>/faixa/i.test(l.msg)).length,
      toastDoDecimo:document.getElementById('toast').textContent,
      traducoes:{recente:_motivoParaPessoa('recarga recente'),
        marca:_motivoParaPessoa('não deu para ler a marca de recarga'),
        modal:_motivoParaPessoa('modal aberto'),
        desconhecido:_motivoParaPessoa('motivo que ninguem traduziu ainda')}};});
  console.log('  ', JSON.stringify(repetido), ' navegacoes:', nav9.n-base9);
  assert(repetido.linhas===1,'dez toques, UMA linha de log (eram dez): '+repetido.linhas);
  assert(repetido.toastDoDecimo!=='','e o decimo toque ainda respondeu na tela: "'+repetido.toastDoDecimo+'"');
  assert(nav9.n-base9===0,'e nada recarregou com a foto em gravacao, por mais que se toque');
  /* Item 7 da revisao: o motivo chega ao tecnico em portugues de gente. "recarga recente" e o
     MAIS frequente desta faixa, porque recarregar nao conserta estar sem nuvem. */
  assert(/j[áa] recarregou/i.test(repetido.traducoes.recente),'"recarga recente" virou frase de gente: "'+repetido.traducoes.recente+'"');
  assert(!/marca de recarga/i.test(repetido.traducoes.marca),'"marca de recarga" nao vai para a tela do tecnico: "'+repetido.traducoes.marca+'"');
  assert(/janela aberta/i.test(repetido.traducoes.modal),'"modal aberto" virou "janela aberta": "'+repetido.traducoes.modal+'"');
  assert(repetido.traducoes.desconhecido==='motivo que ninguem traduziu ainda','motivo sem traducao sai NO ORIGINAL, nunca sumido: texto estranho se corrige depois, mensagem vazia esconde o problema agora');
  assert(erros9.length===0,'sem erro de pagina nesta aba');
  await pg9.close();

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
