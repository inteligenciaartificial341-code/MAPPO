const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const BASE='http://localhost:'+srv.address().port+'/';
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1100,height:760}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  const entrar=async(p)=>{await p.goto(BASE,{waitUntil:'load'});await p.waitForTimeout(300);
    await p.evaluate(()=>{session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
      _gravarTourVisto(); entrarApp(); fbReady=true; WORKSPACE='ws';const s=document.getElementById('splashScreen');if(s)s.remove();});
    await p.waitForTimeout(200);};
  await entrar(pg);

  /* O aviso de versao nova saiu do #syncAlerta em 02/10/2026 e virou #avisoVersao: pilula
     position:fixed no rodape, na paleta da logo. Dois defeitos de uma vez:
       - a faixa do topo sai de vista com a pagina rolada (o controle do CHECK 6 mede isso);
       - `.sync-alerta.aviso` e ambar de ALERTA (#fffbeb/#92400e), e versao nova nao e defeito.
     O markup do #avisoVersao e ESTATICO no HTML (o JS so tira o `hidden`), entao ler texto
     sem conferir `hidden` nao distingue nada -- todo check de texto aqui confere os dois. */
  const LER=()=>pg.evaluate(()=>{
    const el=document.getElementById('avisoVersao');
    const btn=document.getElementById('avisoVersaoBtn');
    const cs=getComputedStyle(el), csb=btn?getComputedStyle(btn):null;
    const rc=el.getBoundingClientRect();
    const svg=el.querySelector('svg');
    return {hidden:el.hidden,txt:el.textContent.replace(/\s+/g,' ').trim(),
      position:cs.position,zIndex:cs.zIndex,
      cores:[cs.backgroundColor,cs.color,cs.borderTopColor,cs.borderLeftColor,
             csb?csb.backgroundColor:'',csb?csb.color:''].join(' | '),
      btnTxt:btn?btn.textContent.replace(/\s+/g,' ').trim():null,
      btnFundo:csb?csb.backgroundColor:null,btnDesab:btn?btn.disabled:null,
      papel:el.getAttribute('role'),vivo:el.getAttribute('aria-live'),
      btnAria:btn?btn.getAttribute('aria-busy'):null,
      temSpin:!!el.querySelector('.versao-nova-spin'),
      temSvgContorno:!!(svg&&getComputedStyle(svg).fill==='none'),
      svgClasse:svg?(svg.getAttribute('class')||''):'',
      svgInterno:svg?svg.innerHTML:'',
      /* compara com o que svgIco('refresh') produz DEPOIS de passar pelo parser: comparar com a
         string crua de ICONS.refresh falharia so pela serializacao (<path/> vira <path></path>) */
      iconeDoSistema:(()=>{
        if(!svg||typeof svgIco!=='function')return false;
        const d=document.createElement('div');d.innerHTML=svgIco('refresh','versao-nova-ico');
        return !!(d.firstChild&&d.firstChild.innerHTML===svg.innerHTML);
      })(),
      rc:{top:Math.round(rc.top),bottom:Math.round(rc.bottom),left:Math.round(rc.left),altura:Math.round(rc.height)},
      janela:{w:window.innerWidth,h:window.innerHeight},rolagem:window.scrollY};
  });
  /* Cor de ALERTA = o ambar/laranja/vermelho que o proprietario leu como "cara de erro".
     Mede o que o navegador REALMENTE calculou, nao o que esta escrito no CSS. */
  function semCorDeAlerta(cores){
    const proibidas=[[255,251,235],[146,64,14],[253,230,138],  // ambar do .sync-alerta.aviso
                     [254,242,242],[153,27,27],[254,202,202],  // vermelho do .sync-alerta.erro
                     [217,119,6],[220,38,38],[239,68,68]];     // laranja/vermelho soltos do app
    const achadas=(cores.match(/rgba?\([^)]*\)/g)||[]).map(s=>s.match(/[\d.]+/g).slice(0,3).map(Number));
    for(const [r,g,b] of achadas){
      for(const p of proibidas) if(r===p[0]&&g===p[1]&&b===p[2]) return 'cor de alerta exata: rgb('+r+','+g+','+b+')';
      /* heuristica, alem da lista: vermelho/laranja dominante e saturado */
      if(r>150&&r-b>60&&r-g>30) return 'tom avermelhado/alaranjado: rgb('+r+','+g+','+b+')';
    }
    return '';
  }

  /* CHECK 0 existe para o CONTROLE ser legivel: rodando com MAPPO_RAIZ apontando para 3e2682d
     (onde o aviso de versao ainda era o #syncAlerta ambar), a suite reprova AQUI, dizendo o que
     falta, em vez de estourar um TypeError de "null.hidden" dez linhas adiante. */
  console.log('\n=== CHECK 0: o aviso de versao tem elemento proprio, com botao ===');
  const r0=await pg.evaluate(()=>({aviso:!!document.getElementById('avisoVersao'),
    btn:!!document.getElementById('avisoVersaoBtn'),
    motivo:!!document.getElementById('avisoVersaoMotivo'),
    apressar:typeof _apressarAtualizacao==='function',
    medir:typeof _medirAvisoVersao==='function'}));
  console.log('  ', JSON.stringify(r0));
  assert(r0.aviso===true,'#avisoVersao existe (o aviso saiu do #syncAlerta, que sai de vista com a pagina rolada)');
  assert(r0.btn===true,'#avisoVersaoBtn existe (o botao "Atualizar")');
  assert(r0.motivo===true,'#avisoVersaoMotivo existe (o motivo de nao dar para atualizar, na propria pilula)');
  assert(r0.apressar===true,'_apressarAtualizacao existe (o botao passa pela guarda de hora segura)');
  assert(r0.medir===true,'_medirAvisoVersao existe (e o que faz o FAB e o conteudo subirem pela pilula)');

  /* Mede o boot LIMPO: ninguem acendeu nada ainda, e nada foi forcado aqui. A versao anterior
     deste check fazia `hidden=true` antes de medir -- provava que o navegador obedece a
     atribuicao, nao que a pilula nasce apagada. Daria verde com a pilula acesa no boot. */
  console.log('\n=== CHECK 1: num boot limpo o aviso JA nasce apagado (nada foi forcado aqui) ===');
  const r1=await pg.evaluate(()=>{
    const av=document.getElementById('avisoVersao');
    return {sync:document.getElementById('syncAlerta').hidden,aviso:av.hidden,
      bandeira:_versaoNovaDisponivel,corpoClasse:document.body.className,
      alturaVar:getComputedStyle(document.documentElement).getPropertyValue('--aviso-h').trim(),
      display:getComputedStyle(av).display,altura:Math.round(av.getBoundingClientRect().height)};});
  console.log('  ', JSON.stringify(r1));
  assert(r1.sync===true,'faixa de sincronizacao escondida');
  assert(r1.aviso===true,'aviso de versao escondido desde o boot, sem ninguem mandar');
  assert(r1.bandeira===false,'e a bandeira _versaoNovaDisponivel tambem comeca falsa');
  assert(r1.corpoClasse.indexOf('com-aviso-versao')<0,'o body NAO esta com a classe que empurra o FAB e o conteudo');
  /* O atributo `hidden` e regra de UA: `display:flex` numa classe o VENCE. Sem
     `.versao-nova[hidden]{display:none}` a pilula ficaria na tela vazia para sempre --
     e o #syncAlerta tem exatamente esse problema hoje. Por isso isto e medido, nao suposto. */
  assert(r1.display==='none'&&r1.altura===0,'escondido de verdade: display none e altura 0 (o `hidden` nao foi vencido pelo CSS)');

  console.log('\n=== CHECK 2: acender mostra o aviso, fixo, com texto e botao novos ===');
  await pg.evaluate(()=>{_acenderFaixaVersao();});
  const r2=await LER();
  console.log('  ', r2.txt);
  console.log('   position=',r2.position,' z-index=',r2.zIndex,' botao=',JSON.stringify(r2.btnTxt));
  assert(r2.hidden===false,'o aviso aparece');
  /* VERBATIM do proprietario, inclusive o "disponível" -- a primeira entrega comeu essa palavra */
  assert(/Nova versão do MAPPO disponível/.test(r2.txt),'titulo exato: "Nova versão do MAPPO disponível"');
  assert(/Atualize para ter as últimas melhorias\./.test(r2.txt),'texto novo, exato');
  assert(!/algumas a[çc][õo]es podem falhar/i.test(r2.txt),'sem a frase antiga "algumas acoes podem falhar"');
  assert(!/Recarregue|Recarregar/i.test(r2.txt),'sem o vocabulario antigo de "recarregar"');
  assert(r2.btnTxt==='Atualizar','o botao se chama "Atualizar"');
  assert(r2.position==='fixed','o aviso e position:fixed -- nao depende do fluxo nem da rolagem');
  assert(r2.temSvgContorno===true,'o icone e SVG de contorno (fill:none), nao emoji');
  /* O app TEM sistema de icone (.ico Feather + ICONS + svgIco) e a barra de navegacao inteira
     usa ele. Desenhar um SVG a mao aqui seria inventar um padrao paralelo -- por isso o check
     compara com o ICONS.refresh do proprio app, nao com um desenho copiado para dentro do teste. */
  console.log('   classe do svg:', r2.svgClasse);
  assert(/\bico\b/.test(r2.svgClasse),'o icone usa a classe `.ico` do sistema de icones do app');
  assert(r2.iconeDoSistema===true,'e o desenho e literalmente o ICONS.refresh do app (nao um SVG a mao)');
  assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(r2.txt),'nenhum emoji no texto do aviso');
  /* Leitor de tela: a pilula aparece sem a pessoa pedir, entao tem de ser anunciada. */
  assert(r2.papel==='status','a pilula tem role="status" (leitor de tela anuncia quando ela acende)');
  assert(r2.vivo==='polite','com aria-live="polite" (anuncia sem atropelar o que esta sendo lido)');
  assert(r2.btnAria===null,'e o botao comeca sem aria-busy');

  console.log('\n=== CHECK 3: nenhuma cor de alerta, e o botao e o petroleo do .btn-primary ===');
  console.log('   cores medidas:', r2.cores);
  const petrol=await pg.evaluate(()=>{const b=document.createElement('button');b.className='btn btn-primary';
    document.body.appendChild(b);const c=getComputedStyle(b).backgroundColor;b.remove();return c;});
  console.log('   fundo do .btn-primary ("Nova OS"):', petrol, '  fundo do botao do aviso:', r2.btnFundo);
  /* Controle positivo: a mesma funcao TEM que reprovar a cor que estava no ar antes
     (`.sync-alerta.aviso`), senao ela nao distingue nada e o check acima e decorativo. */
  const controleCor=semCorDeAlerta('rgb(255, 251, 235) | rgb(146, 64, 14)');
  console.log('   controle positivo (cor antiga):', controleCor||'(NAO PEGOU -- a medicao seria inutil)');
  assert(controleCor!=='','controle positivo: a medicao reprova o ambar antigo (#fffbeb/#92400e)');
  const problema=semCorDeAlerta(r2.cores);
  assert(problema==='','nenhuma cor de alerta no aviso novo'+(problema?' -- '+problema:''));
  assert(r2.btnFundo===petrol,'o botao usa o MESMO petroleo do .btn-primary ("Nova OS")');

  console.log('\n=== CHECK 4: a faixa de sync NAO e mais sequestrada pelo aviso de versao ===');
  const r4=await pg.evaluate(()=>{_falhasEnvio={'mappo_os':{erro:'x',hora:'10:00'}};
    _chavesQuaseCheias={'mappo_os':900000};_atualizarAlertaSync();
    const el=document.getElementById('syncAlerta');
    return {txt:el.textContent.replace(/\s+/g,' ').trim(),classe:el.className,
      avisoVisivel:!document.getElementById('avisoVersao').hidden};});
  console.log('  ', r4.txt.slice(0,90));
  assert(/nao esta sendo salvo|não está sendo salvo/i.test(r4.txt),'com versao nova acesa, a falha de sincronizacao continua sendo mostrada');
  assert(/erro/.test(r4.classe),'no estado vermelho correto');
  assert(r4.avisoVisivel===true,'e os dois convivem: o aviso de versao segue na tela');

  console.log('\n=== CHECK 5: limpando os avisos de sync, a faixa some e o aviso de versao fica ===');
  const r5=await pg.evaluate(()=>{_falhasEnvio={};_chavesQuaseCheias={};_atualizarAlertaSync();
    const el=document.getElementById('syncAlerta');
    return {hidden:el.hidden,temClique:typeof el.onclick==='function',
      avisoVisivel:!document.getElementById('avisoVersao').hidden};});
  assert(r5.hidden===true,'faixa de sincronizacao some');
  assert(r5.temClique===true,'o clique da faixa voltou ao diagnostico (nao ficou preso no recarregar)');
  assert(r5.avisoVisivel===true,'o aviso de versao nao depende de _atualizarAlertaSync');

  console.log('\n=== CHECK 5b: visivel com a pagina rolada ate o fim, no desktop ===');
  const r5b=await pg.evaluate(async()=>{
    let e=document.getElementById('__esticador');
    if(!e){e=document.createElement('div');e.id='__esticador';e.style.height='2400px';document.body.appendChild(e);}
    window.scrollTo(0,99999);
    await new Promise(r=>setTimeout(r,120));
    const el=document.getElementById('avisoVersao'), rc=el.getBoundingClientRect();
    const btn=document.getElementById('avisoVersaoBtn'), rb=btn.getBoundingClientRect();
    /* a sidebar e petroleo escuro e ocupa a esquerda inteira: a pilula nascendo em cima dela
       le como erro de layout, que e justamente o que esta entrega veio tirar */
    const sb=document.querySelector('.sidebar'), rs=sb?sb.getBoundingClientRect():null;
    return {rolou:window.scrollY>200,
      naTela:rc.top>=0&&rc.bottom<=window.innerHeight&&rc.left>=0&&rc.right<=window.innerWidth,
      botaoNaTela:rb.top>=0&&rb.bottom<=window.innerHeight&&rb.width>0,
      sidebar:rs?{left:Math.round(rs.left),right:Math.round(rs.right),visivel:rs.width>0&&rs.right>0}:null,
      sobrepoeSidebar:!!(rs&&rs.width>0&&rs.right>0&&rc.left<rs.right&&rc.bottom>rs.top&&rc.top<rs.bottom),
      left:Math.round(rc.left),top:Math.round(rc.top),h:window.innerHeight};});
  console.log('  ', JSON.stringify(r5b));
  assert(r5b.rolou===true,'controle positivo: a pagina rolou de verdade');
  assert(r5b.naTela===true,'o aviso esta inteiro dentro da tela mesmo com a pagina no fim');
  assert(r5b.botaoNaTela===true,'e o botao "Atualizar" esta alcancavel');
  assert(r5b.sidebar&&r5b.sidebar.visivel===true,'controle positivo: a sidebar ESTA na tela nesta largura (senao "nao sobrepoe" nao diria nada)');
  assert(r5b.sobrepoeSidebar===false,'o aviso nao nasce em cima da sidebar -- o `left` dele espelha o recuo do .main');

  /* O toast nasce no canto inferior DIREITO (right:26px, max-width 360) e a pilula no inferior
     esquerdo: em telas largas eles nao se encontram, mas entre ~1025 e ~1090px de largura o
     toast caia EM CIMA do botao "Atualizar" e, sem pointer-events:none, bloqueava o clique por
     3,2s. O viewport padrao desta suite e 1100 -- passava por sorte de largura. Por isso a
     medicao e feita em 1026, que e onde o defeito aparecia. */
  console.log('\n=== CHECK 5b2: em 1026px de largura o toast nao tapa nem bloqueia o botao ===');
  await pg.setViewportSize({width:1026,height:760});
  await pg.waitForTimeout(250);
  const r5b2=await pg.evaluate(async()=>{
    toast('Seu app está desatualizado — toque em Atualizar no aviso','error');
    await new Promise(r=>setTimeout(r,400));
    const btn=document.getElementById('avisoVersaoBtn'), rb=btn.getBoundingClientRect();
    const t=document.getElementById('toast'), rt=t.getBoundingClientRect();
    const alvo=document.elementFromPoint(rb.left+rb.width/2,rb.top+rb.height/2);
    return{toastVisivel:t.className.indexOf('show')>=0&&rt.height>0,
      sobrepoe:!(rt.bottom<=rb.top||rt.top>=rb.bottom||rt.right<=rb.left||rt.left>=rb.right),
      toqueChegaNoBotao:!!(alvo&&(alvo===btn||btn.contains(alvo))),
      toast:{top:Math.round(rt.top),left:Math.round(rt.left)},botao:{top:Math.round(rb.top),left:Math.round(rb.left)}};});
  console.log('  ', JSON.stringify(r5b2));
  assert(r5b2.toastVisivel===true,'controle positivo: o toast ESTA na tela nesta largura');
  assert(r5b2.sobrepoe===false,'o toast nao sobrepoe o botao "Atualizar"');
  assert(r5b2.toqueChegaNoBotao===true,'e o clique no botao chega no botao, nao no toast');
  await pg.evaluate(()=>{const t=document.getElementById('toast');t.className='toast';t.textContent='';});

  console.log('\n=== CHECK 5c: viewport de celular -- visivel, legivel e acima da barra inferior ===');
  await pg.setViewportSize({width:390,height:720});
  await pg.waitForTimeout(250);
  const r5c=await pg.evaluate(async()=>{
    window.scrollTo(0,99999);
    await new Promise(r=>setTimeout(r,200));
    const el=document.getElementById('avisoVersao'), rc=el.getBoundingClientRect();
    const btn=document.getElementById('avisoVersaoBtn'), rb=btn.getBoundingClientRect();
    const nav=document.querySelector('.navbar'), rn=nav?nav.getBoundingClientRect():null;
    const cs=getComputedStyle(el);
    return {naTela:rc.top>=0&&rc.bottom<=window.innerHeight&&rc.left>=0&&rc.right<=window.innerWidth,
      fonte:parseFloat(cs.fontSize),
      botao:{w:Math.round(rb.width),h:Math.round(rb.height),naTela:rb.top>=0&&rb.bottom<=window.innerHeight},
      acimaDaBarra:rn?rc.bottom<=rn.top+1:null,navVisivel:!!(rn&&rn.height>0),
      cores:[cs.backgroundColor,cs.color].join(' | '),janela:{w:window.innerWidth,h:window.innerHeight}};});
  console.log('  ', JSON.stringify(r5c));
  assert(r5c.naTela===true,'no celular o aviso cabe inteiro na tela');
  assert(r5c.fonte>=13,'texto legivel (>=13px)');
  assert(r5c.botao.naTela===true&&r5c.botao.h>=40&&r5c.botao.w>=100,'o botao e alcancavel (area de toque >=40px de altura)');
  assert(r5c.navVisivel===true,'controle positivo: a barra de navegacao inferior existe nesta largura');
  assert(r5c.acimaDaBarra===true,'o aviso fica ACIMA da barra inferior, nao debaixo dela');
  assert(semCorDeAlerta(r5c.cores)==='','no celular tambem nao ha cor de alerta');

  /* A PILULA NAO PODE COBRIR NADA QUE SE TOQUE. Ela nao tem "×" nem "Agora nao" (decisao do
     proprietario), entao o que ela cobre fica BLOQUEADO ate a recarga -- que pode estar adiada
     sem prazo por modal, foto em voo ou texto nao salvo. Medido em 02/10/2026, antes da
     correcao: em 390x720 a pilula ocupava y[515,646] e CONTINHA o FAB "Nova OS" (y[590,642])
     inteiro, com z-index 150 contra 71, e elementFromPoint no centro do FAB devolvia o botao
     "Atualizar" -- um toque mirando "Nova OS" acionava "Atualizar".
     Geometria E hit-testing: sobrepor sem capturar o toque ainda seria tapar o alvo, e capturar
     o toque sem sobrepor seria outro defeito. Os dois sao medidos. */
  console.log('\n=== CHECK 5c2: a pilula NAO cobre nem rouba o toque do FAB "Nova OS" ===');
  const r5c2=await pg.evaluate(async()=>{
    /* o FAB so existe em telas que tem acao principal: garante uma, pela navegacao normal */
    try{nav('ordens');}catch(e){console.log('nav(ordens) falhou no teste: '+(e&&e.message||e));}
    await new Promise(r=>setTimeout(r,250));
    const lg=document.getElementById('loginScreen');if(lg)lg.remove();   // ja escondido; sai do hit-test
    /* o tour de boas-vindas e outra sobreposicao, nao tem nada a ver com a pilula: tirar daqui
       e o que deixa a medicao ser sobre PILULA x FAB, e nao sobre o tour */
    document.querySelectorAll('.tour-backdrop,.tour-spot,.tour-card').forEach(n=>n.remove());
    const el=document.getElementById('avisoVersao'), rp=el.getBoundingClientRect();
    const fab=document.querySelector('.fab');
    if(!fab)return{semFab:true};
    const rf=fab.getBoundingClientRect(), csf=getComputedStyle(fab);
    const cx=rf.left+rf.width/2, cy=rf.top+rf.height/2;
    const alvo=document.elementFromPoint(cx,cy);
    const nomeDe=(n)=>{if(!n)return null;const c=n.getAttribute&&n.getAttribute('class');return (c||n.tagName||'')+'';};
    return{semFab:false,
      fabVisivel:csf.display!=='none'&&rf.width>0&&rf.height>0&&rf.top>=0&&rf.bottom<=window.innerHeight,
      pilula:{top:Math.round(rp.top),bottom:Math.round(rp.bottom)},
      fab:{top:Math.round(rf.top),bottom:Math.round(rf.bottom)},
      sobrepoe:!(rp.bottom<=rf.top||rp.top>=rf.bottom||rp.right<=rf.left||rp.left>=rf.right),
      alvoNoCentroDoFab:nomeDe(alvo),
      alvoEhFab:!!(alvo&&(alvo===fab||fab.contains(alvo))),
      alvoEhPilula:!!(alvo&&el.contains(alvo)),
      zPilula:getComputedStyle(el).zIndex,zFab:csf.zIndex,
      avisoH:getComputedStyle(document.documentElement).getPropertyValue('--aviso-h').trim(),
      corpoTemClasse:document.body.className.indexOf('com-aviso-versao')>=0};});
  console.log('  ', JSON.stringify(r5c2));
  assert(r5c2.semFab===false,'controle positivo: o FAB "Nova OS" EXISTE nesta tela e nesta largura');
  assert(r5c2.fabVisivel===true,'controle positivo: o FAB esta visivel e dentro da tela');
  assert(r5c2.corpoTemClasse===true,'com a pilula acesa, o body ganhou a classe que empurra o FAB');
  assert(/px$/.test(r5c2.avisoH)&&parseFloat(r5c2.avisoH)>0,'e --aviso-h recebeu a altura MEDIDA da pilula ('+r5c2.avisoH+')');
  assert(r5c2.sobrepoe===false,'a pilula NAO sobrepoe o FAB (era o defeito: pilula y['+r5c2.pilula.top+','+r5c2.pilula.bottom+'] contra FAB y['+r5c2.fab.top+','+r5c2.fab.bottom+'])');
  assert(r5c2.alvoEhPilula===false,'e o toque no centro do FAB NAO cai na pilula (elementFromPoint devolveu "'+r5c2.alvoNoCentroDoFab+'")');
  assert(r5c2.alvoEhFab===true,'o toque no centro do FAB chega no proprio FAB');

  console.log('\n=== CHECK 5c3: no celular a pilula tambem nao come o fim do conteudo nem e tapada pelo toast ===');
  const r5c3=await pg.evaluate(async()=>{
    toast('mensagem de teste para medir sobreposicao','error');
    await new Promise(r=>setTimeout(r,400));
    const el=document.getElementById('avisoVersao'), rp=el.getBoundingClientRect();
    const btn=document.getElementById('avisoVersaoBtn'), rb=btn.getBoundingClientRect();
    const tst=document.getElementById('toast'), rt=tst.getBoundingClientRect();
    const main=document.querySelector('.main');
    const pad=parseFloat(getComputedStyle(main).paddingBottom);
    const cx=rb.left+rb.width/2, cy=rb.top+rb.height/2;
    const alvo=document.elementFromPoint(cx,cy);
    return{toastVisivel:tst.className.indexOf('show')>=0&&rt.height>0,
      toastSobrepoeBotao:!(rt.bottom<=rb.top||rt.top>=rb.bottom||rt.right<=rb.left||rt.left>=rb.right),
      toqueNoBotaoChegaNoBotao:!!(alvo&&(alvo===btn||btn.contains(alvo))),
      padMain:Math.round(pad),alturaPilula:Math.round(rp.height),
      padCobreAPilula:pad>=rp.height};});
  console.log('  ', JSON.stringify(r5c3));
  assert(r5c3.toastVisivel===true,'controle positivo: o toast ESTA na tela nesta medicao');
  assert(r5c3.toastSobrepoeBotao===false,'o toast nao cobre o botao "Atualizar" (ele sobe pela altura da pilula)');
  assert(r5c3.toqueNoBotaoChegaNoBotao===true,'e o toque no botao chega no botao, nao no toast');
  assert(r5c3.padCobreAPilula===true,'o .main ganhou recuo >= a altura da pilula: o fim das listas nao fica debaixo dela');

  /* Com a gaveta lateral ABERTA no celular, a pilula ficava por cima dos ultimos itens do menu
     (z-index 150 contra 90). Com z-index 75 ela fica ABAIXO do backdrop da gaveta (80), que e o
     certo: enquanto o menu esta aberto, ele e que tem a tela. */
  console.log('\n=== CHECK 5c4: com a gaveta lateral aberta, a pilula fica POR BAIXO ===');
  const r5c4=await pg.evaluate(async()=>{
    openSidebar();
    await new Promise(r=>setTimeout(r,450));
    const sb=document.querySelector('.sidebar'), rs=sb.getBoundingClientRect();
    const bd=document.getElementById('backdrop');
    const el=document.getElementById('avisoVersao'), rp=el.getBoundingClientRect();
    const alvo=document.elementFromPoint(rp.left+10,rp.top+10);
    const nome=(n)=>n?(((n.getAttribute&&n.getAttribute('class'))||n.id||n.tagName)+''):null;
    /* lido ANTES de fechar: a classe sai no closeSidebar, e o objeto de retorno e montado
       depois dele -- foi assim que a primeira versao deste check reprovou o proprio controle */
    const aberta=rs.left>=0&&rs.width>0&&sb.className.indexOf('open')>=0;
    closeSidebar();
    return{gavetaAberta:aberta,
      zPilula:parseInt(getComputedStyle(el).zIndex,10),
      zBackdrop:parseInt(getComputedStyle(bd).zIndex,10),
      zSidebar:parseInt(getComputedStyle(sb).zIndex,10),
      sobreA:nome(alvo),pilulaPorBaixo:!(alvo&&el.contains(alvo))};});
  console.log('  ', JSON.stringify(r5c4));
  assert(r5c4.gavetaAberta===true,'controle positivo: a gaveta lateral ABRIU de verdade');
  assert(r5c4.zPilula<r5c4.zBackdrop&&r5c4.zPilula<r5c4.zSidebar,'a pilula tem z-index menor que o backdrop e a gaveta');
  assert(r5c4.pilulaPorBaixo===true,'e o ponto onde a pilula esta devolve o menu, nao a pilula (elementFromPoint: "'+r5c4.sobreA+'")');

  await pg.setViewportSize({width:1100,height:760});
  await pg.waitForTimeout(200);
  await pg.evaluate(()=>{const e=document.getElementById('__esticador');if(e)e.remove();window.scrollTo(0,0);
    const t=document.getElementById('toast');t.className='toast';t.textContent='';});

  /* O botao "Atualizar" APRESSA, nao atropela: ele passa pela mesma guarda da recarga
     automatica (_porQueNaoRecarregarAgora), nunca por location.reload() direto. O aviso antigo
     tinha onclick=()=>location.reload() no elemento inteiro, e "operacao em voo" e justamente a
     foto que o tecnico acabou de tirar, cujo input ja foi limpo: recarregar ali APAGA a foto.
     A recarga e medida por NAVEGACAO de verdade (framenavigated), nao por espiao em
     location.reload -- o Chromium nao deixa redefinir essa propriedade, e um espiao que nao
     instala devolveria "nao recarregou" pelo motivo errado.
     Aba propria, de proposito: aqui a pagina recarrega mesmo, e isso apagaria o estado que os
     checks seguintes usam. */
  console.log('\n=== CHECK 5d: "Atualizar" com operacao em voo -> "Atualizando..." e NAO recarrega ===');
  const pg2=await b.newPage({viewport:{width:1100,height:760}});
  const nav2={n:0}; pg2.on('framenavigated',f=>{if(f===pg2.mainFrame())nav2.n++;});
  /* array PROPRIO: esta aba recarrega de verdade, e um erro de boot da pagina recarregada
     cairia no balde geral para ser cobrado centenas de linhas adiante, longe da causa */
  const erros2=[]; pg2.on('pageerror',e=>erros2.push('aba do botao: '+e.message));
  await entrar(pg2);
  const navBase=nav2.n;
  const ocupado=await pg2.evaluate(async()=>{
    _abrirOp('gravando foto de teste');
    _acenderFaixaVersao();
    const antes=_porQueNaoRecarregarAgora();
    document.getElementById('avisoVersaoBtn').click();
    await new Promise(r=>setTimeout(r,300));
    const btn=document.getElementById('avisoVersaoBtn');
    return {motivo:antes,txt:btn.textContent.replace(/\s+/g,' ').trim(),
      desab:btn.disabled,spin:!!btn.querySelector('.versao-nova-spin'),
      aria:btn.getAttribute('aria-busy'),
      pedida:_recargaPedida,timer:_timerRecarga!==null};});
  console.log('   ocupado:', JSON.stringify(ocupado), ' navegacoes:', nav2.n-navBase);
  assert(/opera[çc][ãa]o em voo/.test(ocupado.motivo),'controle positivo: a guarda ESTAVA dizendo "operacao em voo"');
  assert(nav2.n-navBase===0,'NAO recarregou com foto em gravacao -- a linha vermelha do projeto');
  assert(ocupado.pedida===false,'a recarga nem foi pedida: o botao passou pela guarda, nao por cima dela');
  assert(/Atualizando/.test(ocupado.txt),'o botao mostra "Atualizando..."');
  assert(ocupado.spin===true,'com indicador girando');
  assert(ocupado.desab===true,'e desabilitado, para dois toques nao virarem dois pedidos');
  assert(ocupado.aria==='true','com aria-busy="true": o leitor de tela tambem sabe que esta esperando');
  assert(ocupado.timer===true,'ficou uma tentativa agendada: o pedido nao foi descartado');

  console.log('\n=== CHECK 5e: terminada a gravacao, a recarga vem sozinha, sem novo toque ===');
  const motivoDepois=await pg2.evaluate(()=>{_fecharOp('gravando foto de teste');return _porQueNaoRecarregarAgora();});
  assert(motivoDepois==='','controle positivo: depois de _fecharOp a hora passou a ser segura');
  for(let i=0;i<30&&nav2.n-navBase===0;i++) await pg2.waitForTimeout(300);   // RECARGA_ESPERA_MS=4000
  console.log('   navegacoes depois de liberar:', nav2.n-navBase);
  assert(nav2.n-navBase>=1,'e ai sim recarregou, sozinho, sem novo toque');
  await pg2.waitForTimeout(600);                      // deixa a pagina recarregada terminar o boot
  console.log('   erros desta aba:', erros2.length?erros2:'(nenhum)');
  assert(erros2.length===0,'a aba que recarregou de verdade nao deixou erro de pagina');
  await pg2.close();

  /* A matriz do spec tem a linha "Toca Atualizar livre | nada em voo | Atualizando... e
     recarrega", e ela nao estava medida: so o caminho OCUPADO estava. */
  console.log('\n=== CHECK 5f: "Atualizar" em hora segura recarrega na hora ===');
  const pg3=await b.newPage({viewport:{width:1100,height:760}});
  const nav3={n:0}; pg3.on('framenavigated',f=>{if(f===pg3.mainFrame())nav3.n++;});
  const erros3=[]; pg3.on('pageerror',e=>erros3.push('aba hora segura: '+e.message));
  await entrar(pg3);
  const base3=nav3.n;
  const livre=await pg3.evaluate(()=>{_acenderFaixaVersao();
    const motivo=_porQueNaoRecarregarAgora(true);
    document.getElementById('avisoVersaoBtn').click();
    return {motivo};});
  assert(livre.motivo==='','controle positivo: a hora ERA segura (nenhum motivo pendente)');
  for(let i=0;i<20&&nav3.n-base3===0;i++) await pg3.waitForTimeout(200);
  console.log('   navegacoes:', nav3.n-base3);
  assert(nav3.n-base3>=1,'o toque em hora segura recarregou');
  await pg3.waitForTimeout(500);
  assert(erros3.length===0,'sem erro de pagina nesta aba');
  await pg3.close();

  /* O teto RECARGA_TETO=3 nasceu como trava anti-LACO do Service Worker. Ele nao pode racionar
     a acao humana: com ele valendo para o toque, o terceiro pedido deliberado passava a ser
     respondido com "feche e abra o app". O check prova os dois lados na MESMA pagina: com a
     marca em n=3 a recarga AUTOMATICA desiste, e o toque passa assim mesmo. */
  console.log('\n=== CHECK 5g: teto estourado barra a recarga automatica, mas NAO o toque ===');
  const pg4=await b.newPage({viewport:{width:1100,height:760}});
  const nav4={n:0}; pg4.on('framenavigated',f=>{if(f===pg4.mainFrame())nav4.n++;});
  const erros4=[]; pg4.on('pageerror',e=>erros4.push('aba do teto: '+e.message));
  await entrar(pg4);
  const base4=nav4.n;
  const teto=await pg4.evaluate(()=>{
    /* marca com o teto estourado e SEM carencia (ts antigo), para o unico motivo ser o teto */
    sessionStorage.setItem('mappo_recarga_versao',JSON.stringify({n:3,ts:Date.now()-5*60*1000}));
    _acenderFaixaVersao();
    return {automatico:_porQueNaoRecarregarAgora(),manual:_porQueNaoRecarregarAgora(true),
      teto:RECARGA_TETO,marca:sessionStorage.getItem('mappo_recarga_versao')};});
  console.log('  ', JSON.stringify(teto));
  assert(teto.automatico==='teto de recargas automáticas desta sessão','controle positivo: para a recarga AUTOMATICA o teto esta de fato estourado');
  assert(teto.manual==='','e para o toque da pessoa o mesmo estado nao devolve motivo nenhum');
  /* e agora o comportamento, nao so a funcao: a recarga automatica desiste e o toque recarrega */
  const semToque=await pg4.evaluate(async()=>{_recarregarQuandoSeguro();
    await new Promise(r=>setTimeout(r,600));
    return {pedida:_recargaPedida,timer:_timerRecarga!==null,
      desligada:(_fbLogs||[]).filter(l=>/recarga autom[áa]tica desligada/i.test(l.msg)).length};});
  console.log('   sem toque:', JSON.stringify(semToque), ' navegacoes:', nav4.n-base4);
  assert(nav4.n-base4===0,'sozinha, com o teto estourado, a recarga automatica NAO acontece');
  assert(semToque.desligada>=1,'e o log registra que ela foi desligada, com o motivo');
  await pg4.evaluate(()=>{document.getElementById('avisoVersaoBtn').click();});
  for(let i=0;i<20&&nav4.n-base4===0;i++) await pg4.waitForTimeout(200);
  console.log('   navegacoes depois do toque:', nav4.n-base4);
  assert(nav4.n-base4>=1,'mas o toque da pessoa recarrega: o teto anti-laco nao raciona acao humana');
  const marcaDepois=await pg4.evaluate(()=>{try{return sessionStorage.getItem('mappo_recarga_versao');}catch(e){return 'ERRO '+e.message;}});
  console.log('   marca depois do toque:', marcaDepois);
  assert(JSON.parse(marcaDepois).n===3,'e o toque NAO consumiu o teto: n continua 3, nao virou 4');
  await pg4.waitForTimeout(400);
  assert(erros4.length===0,'sem erro de pagina nesta aba');
  await pg4.close();

  /* "Atualizando..." so pode aparecer quando esperar RESOLVE. Com texto digitado e nao salvo
     nada muda sozinho -- so a pessoa salvando ou limpando o campo -- entao o indicador ficaria
     girando ate o teto de 25s do botao, sem nunca dizer por que. O motivo vai PARA A PILULA. */
  console.log('\n=== CHECK 5h: espera que nao resolve -> diz o motivo na hora, sem fingir "Atualizando..." ===');
  const pg5=await b.newPage({viewport:{width:1100,height:760}});
  const nav5={n:0}; pg5.on('framenavigated',f=>{if(f===pg5.mainFrame())nav5.n++;});
  const erros5=[]; pg5.on('pageerror',e=>erros5.push('aba do motivo: '+e.message));
  await entrar(pg5);
  const base5=nav5.n;
  const naoResolve=await pg5.evaluate(async()=>{
    /* um textarea visivel, sem oninput/onchange/onkeyup, com valor diferente do defaultValue:
       e exatamente o caso #notaGestor que _campoComTextoNaoSalvo foi escrito para pegar.
       SEM position:fixed de proposito -- `offsetParent` de elemento fixed e null, e a guarda usa
       justamente `offsetParent===null` para dizer "nao esta na tela": o campo seria ignorado e o
       teste mediria outra coisa (foi o que aconteceu na primeira versao deste check). */
    const ta=document.createElement('textarea');
    ta.id='__naoSalvo';ta.style.cssText='width:120px;height:40px;';
    document.body.appendChild(ta);
    ta.value='texto que a pessoa digitou e ainda nao salvou';
    ta.blur();
    _acenderFaixaVersao();
    const antes=_porQueNaoRecarregarAgora(true);
    document.getElementById('avisoVersaoBtn').click();
    await new Promise(r=>setTimeout(r,250));
    const btn=document.getElementById('avisoVersaoBtn');
    const mot=document.getElementById('avisoVersaoMotivo');
    return {antes,btnTxt:btn.textContent.replace(/\s+/g,' ').trim(),btnDesab:btn.disabled,
      spin:!!btn.querySelector('.versao-nova-spin'),
      motivoVisivel:!mot.hidden,motivoTxt:mot.textContent.replace(/\s+/g,' ').trim(),
      cor:getComputedStyle(mot).color};});
  console.log('  ', JSON.stringify(naoResolve));
  assert(/texto digitado e não salvo/.test(naoResolve.antes),'controle positivo: a guarda ESTAVA dizendo "texto digitado e nao salvo"');
  assert(nav5.n-base5===0,'nao recarregou por cima do texto nao salvo');
  assert(naoResolve.spin===false&&naoResolve.btnTxt==='Atualizar','o botao NAO finge "Atualizando...": esperar nao resolveria isto');
  assert(naoResolve.btnDesab===false,'e continua disponivel para a pessoa tentar depois de salvar');
  assert(naoResolve.motivoVisivel===true,'a pilula mostra o motivo, nao so o log (que ninguem abre)');
  assert(/texto digitado e não salvo/.test(naoResolve.motivoTxt),'e o motivo e o MESMO texto que a guarda devolve: "'+naoResolve.motivoTxt+'"');
  assert(semCorDeAlerta(naoResolve.cor)==='','o motivo tambem nao usa cor de alerta');

  /* O teto de 25s do botao: com um motivo que SE resolve esperando (operacao em voo) mas que
     nao se resolve nunca -- contador preso, caso ja documentado em _opsEmVoo --, o botao tem
     de VOLTAR e dizer por que, em vez de girar para sempre.
     A espera e REAL (uns 25s). page.clock foi tentado e nao serve aqui: o setTimeout do botao
     e criado ANTES do install, continua sendo um timer de verdade, e fastForward nao o alcanca
     -- seria um teste que passa sem medir o que diz medir. */
  console.log('\n=== CHECK 5i: o teto de 25s devolve o botao e mostra o motivo (espera real) ===');
  const antesDoTeto=await pg5.evaluate(async()=>{
    document.getElementById('__naoSalvo').remove();        // tira o motivo anterior
    _abrirOp('operacao que nunca termina');
    document.getElementById('avisoVersaoBtn').click();
    await new Promise(r=>setTimeout(r,200));
    const btn=document.getElementById('avisoVersaoBtn');
    return {btnTxt:btn.textContent.replace(/\s+/g,' ').trim(),desab:btn.disabled,
      spin:!!btn.querySelector('.versao-nova-spin'),teto:BOTAO_ATUALIZAR_TETO_MS,
      motivoVisivel:!document.getElementById('avisoVersaoMotivo').hidden};});
  console.log('   logo depois do toque:', JSON.stringify(antesDoTeto));
  assert(/Atualizando/.test(antesDoTeto.btnTxt)&&antesDoTeto.spin===true,'controle positivo: com motivo que se resolve esperando, o botao MOSTRA "Atualizando..."');
  assert(antesDoTeto.motivoVisivel===false,'e nao mostra motivo nenhum enquanto esta esperando de boa-fe');
  const limite=Date.now()+antesDoTeto.teto+15000;
  while(Date.now()<limite){
    await pg5.waitForTimeout(500);
    const voltou=await pg5.evaluate(()=>document.getElementById('avisoVersaoBtn').disabled===false);
    if(voltou)break;
  }
  const depoisDoTeto=await pg5.evaluate(()=>{
    const btn=document.getElementById('avisoVersaoBtn'), mot=document.getElementById('avisoVersaoMotivo');
    return {btnTxt:btn.textContent.replace(/\s+/g,' ').trim(),desab:btn.disabled,
      spin:!!btn.querySelector('.versao-nova-spin'),aria:btn.getAttribute('aria-busy'),
      motivoVisivel:!mot.hidden,motivoTxt:mot.textContent.replace(/\s+/g,' ').trim()};});
  console.log('   depois do teto:', JSON.stringify(depoisDoTeto));
  assert(depoisDoTeto.spin===false&&depoisDoTeto.btnTxt==='Atualizar','passado o teto, o botao VOLTA (nao gira para sempre afirmando que algo acontece)');
  assert(depoisDoTeto.desab===false&&depoisDoTeto.aria===null,'e volta habilitado, sem aria-busy preso');
  assert(depoisDoTeto.motivoVisivel===true&&/opera[çc][ãa]o em voo/.test(depoisDoTeto.motivoTxt),'e a pilula passa a DIZER por que nao deu: "'+depoisDoTeto.motivoTxt+'"');
  assert(nav5.n-base5===0,'e nada recarregou enquanto a operacao seguia em voo');
  assert(erros5.length===0,'sem erro de pagina nesta aba');
  await pg5.close();

  /* O LINK DO CLIENTE. Esta pilula e tela interna do app: o visitante anonimo do link de
     acompanhamento nao pode ve-la, nem o botao de recarga. Ate esta entrega a protecao existia
     POR ACIDENTE -- o aviso vivia dentro do #app, que iniciarModoPublico remove. Ao virar irmao
     do #toast para poder ser fixo, ele passou a sobreviver: medido em 02/10/2026, hidden:false,
     visivel, recuado 274px numa tela sem sidebar. Regressao desta entrega, agora com rede. */
  console.log('\n=== CHECK 5j: no modo publico (link do cliente) a pilula NAO aparece ===');
  const pg6=await b.newPage({viewport:{width:1100,height:760}});
  const erros6=[]; pg6.on('pageerror',e=>erros6.push('aba publica: '+e.message));
  await pg6.goto(BASE,{waitUntil:'load'});
  await pg6.waitForTimeout(300);
  const pub=await pg6.evaluate(async()=>{
    const antes=!!document.getElementById('avisoVersao');       // controle: existia antes
    try{iniciarModoPublico('ws','tok');}catch(e){console.log('iniciarModoPublico: '+(e&&e.message||e));}
    /* segura a RECARGA, nao o aviso: no modo publico nada bloqueia a hora segura, entao
       _avisarVersaoNova recarregaria a pagina no meio da medicao. Essa recarga e comportamento
       PRE-EXISTENTE da deteccao (que este trabalho nao pode mexer); o que se mede aqui e a
       PILULA, que e tela interna do app e nao pode aparecer para o cliente. */
    _abrirOp('segurando a recarga durante a medicao');
    /* as DUAS portas de entrada do aviso, as mesmas do app normal */
    _avisarVersaoNova('teste: versao nova no modo publico');
    _avisarVersaoVelhaPorErro('teste: deducao no modo publico');
    await new Promise(r=>setTimeout(r,200));
    const el=document.getElementById('avisoVersao');
    return {existiaAntes:antes,modoPublico:document.body.classList.contains('modo-publico'),
      appRemovido:!document.getElementById('app'),
      existeDepois:!!el,visivel:!!(el&&!el.hidden),
      /* innerText, nao textContent: textContent arrasta o codigo dos <script> inline do
         single-file e a medicao viraria sobre o fonte, nao sobre o que o cliente VE */
      txtDaPagina:(document.body.innerText||'').replace(/\s+/g,' ').trim().slice(0,200),
      bandeira:_versaoNovaDisponivel,
      corpoTemClasse:document.body.className.indexOf('com-aviso-versao')>=0,
      logou:(_fbLogs||[]).filter(l=>/modo p[uú]blico/i.test(l.msg)).length};});
  console.log('  ', JSON.stringify(pub));
  assert(pub.existiaAntes===true,'controle positivo: antes do modo publico o elemento EXISTIA nesta pagina');
  assert(pub.modoPublico===true&&pub.appRemovido===true,'controle positivo: o modo publico de fato comecou (classe no body, #app removido)');
  assert(pub.existeDepois===false,'o #avisoVersao foi removido junto com o #app');
  assert(pub.visivel===false,'e nao ha pilula na tela do cliente');
  assert(!/Nova vers[ãa]o do MAPPO/i.test(pub.txtDaPagina),'o texto do app nao vaza para a pagina do cliente');
  assert(!/Atualizar/.test(pub.txtDaPagina),'nem o botao "Atualizar"');
  assert(pub.bandeira===false,'a bandeira do aviso nem chega a ser ligada no modo publico');
  assert(pub.corpoTemClasse===false,'e o body nao ganha a classe que empurra layout do app');
  assert(pub.logou>=1,'a recusa fica registrada no log, com o motivo (nao e silencio)');
  assert(erros6.length===0,'sem erro de pagina na aba publica');
  await pg6.close();

  /* Era um toast de 3 segundos, posto ali porque o aviso geral estava mudo -- e foi o UNICO
     aviso de versao velha que o proprietario chegou a ver. Em 01/10/2026 o aviso geral passou a
     funcionar (testes/teste-atualizacao.js) e o remendo deu lugar ao aviso, que fica na tela em
     vez de sumir em 3 segundos. O check continua cobrindo a mesma coisa: permission-denied ao
     gerar convite tem que DIZER que o app esta desatualizado.
     O que mudou em 02/10/2026: o aviso virou #avisoVersao, position:fixed. O botao de convite
     fica no meio da lista de Configuracoes, entao a pagina esta rolada quando o erro acontece --
     e e isto que o check mede, com o controle de que o aviso estava ESCONDIDO antes (senao
     "esta na tela" nao distinguiria o aviso de um elemento que nunca saiu de lugar). */
  console.log('\n=== CHECK 6: regra nega o convite -> acende o AVISO, na tela, com a pagina rolada ===');
  const r6=await pg.evaluate(async()=>{
    fbReady=true;WORKSPACE='ws';
    _falhasEnvio={};_chavesQuaseCheias={};
    document.getElementById('toast').textContent='';
    /* pagina alta o suficiente para rolar de verdade */
    let esticador=document.getElementById('__esticador');
    if(!esticador){esticador=document.createElement('div');esticador.id='__esticador';esticador.style.height='2400px';document.body.appendChild(esticador);}

    const el=document.getElementById('avisoVersao');
    /* CONTROLE: parte do zero -- aviso apagado e pagina rolada */
    _versaoNovaDisponivel=false;el.hidden=true;_atualizarAlertaSync();
    window.scrollTo(0,1800);
    await new Promise(r=>setTimeout(r,120));
    const rc=el.getBoundingClientRect();
    const controle={rolou:window.scrollY>200,oculta:el.hidden,
      dentro:rc.height>0&&rc.top>=0&&rc.bottom<=window.innerHeight,top:Math.round(rc.top),altura:Math.round(rc.height)};

    /* agora o caminho de verdade: o convite falha por permission-denied */
    tecnicos=[{id:'t1',nome:'Novo Prestador',uid:null,modulos:{split:true,vrfObras:[]},ativo:true}];
    fbDB={collection:()=>({doc:()=>({set:async()=>{const e=new Error('Missing or insufficient permissions.');e.code='permission-denied';throw e;}})})};
    window.firebase={firestore:{FieldValue:{serverTimestamp:()=>Date.now()}}};
    await gerarConviteTecnico('t1');
    await new Promise(r=>setTimeout(r,120));
    const r2=el.getBoundingClientRect();
    const tst=document.getElementById('toast');
    /* a rolagem e lida ANTES de remover o esticador: tirar a altura da pagina faz o navegador
       grampear scrollY em 0, e a medicao perderia justamente o que ela quer provar */
    const rolagem=window.scrollY;
    esticador.remove();
    return {controle,bandeira:_versaoNovaDisponivel,detectada:_versaoNovaDetectada,oculta:el.hidden,
      faixa:el.textContent.replace(/\s+/g,' ').trim(),rolagem,
      naTela:r2.top>=0&&r2.bottom<=window.innerHeight&&r2.height>0,topDepois:Math.round(r2.top),
      toast:(tst.textContent||''),toastVisivel:tst.className.indexOf('show')>=0||getComputedStyle(tst).opacity!=='0'};
  });
  console.log('  ', r6.faixa.slice(0,110));
  console.log('   controle (antes do erro):', JSON.stringify(r6.controle), ' top depois:', r6.topDepois, ' rolagem:', r6.rolagem);
  assert(r6.controle.rolou===true,'controle positivo: a pagina rolou de verdade');
  assert(r6.controle.oculta===true&&r6.controle.dentro===false,'controle positivo: antes do erro o aviso estava apagado (nao e um elemento que ja estava na tela)');
  assert(r6.bandeira===true,'o app marca que esta rodando versao velha');
  assert(r6.oculta===false&&/Nova vers[ãa]o do MAPPO/i.test(r6.faixa),'o aviso de versao nova fica na tela, no lugar do toast de 3 segundos');
  assert(/Atualizar/.test(r6.faixa),'com a acao que resolve');
  assert(r6.rolagem>200,'e a pagina continua rolada (o app nao mexeu na tela da pessoa)');
  assert(r6.naTela===true,'e o aviso esta VISIVEL mesmo assim: position:fixed, sem depender de rolagem');
  assert(r6.detectada===false,'dedução nao marca como detectada (a deteccao real continua armavel)');
  assert(/desatualizado/i.test(r6.toast),'um toast curto da retorno imediato ao toque, apontando o aviso');
  assert(/Atualizar/.test(r6.toast),'e manda tocar em "Atualizar", que e o botao que existe agora');
  assert(!/faixa no topo/i.test(r6.toast),'nao manda olhar "a faixa no topo", que nao existe mais');
  assert(!/tente de novo/i.test(r6.toast),'nao manda "tente de novo", que nunca resolveria');

  console.log('\n=== CHECK 7: outros erros mantem a mensagem generica ===');
  const r7=await pg.evaluate(async()=>{
    fbDB={collection:()=>({doc:()=>({set:async()=>{const e=new Error('offline');e.code='unavailable';throw e;}})})};
    tecnicos=[{id:'t2',nome:'Outro',uid:null,modulos:{split:true,vrfObras:[]},ativo:true}];
    await gerarConviteTecnico('t2');
    return document.getElementById('toast').textContent;
  });
  assert(/tente de novo/i.test(r7),'erro de rede continua com a mensagem generica');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
