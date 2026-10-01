const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1100,height:760}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(300);
  await pg.evaluate(()=>{session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
    _gravarTourVisto(); entrarApp(); fbReady=true; WORKSPACE='ws';const s=document.getElementById('splashScreen');if(s)s.remove();});
  await pg.waitForTimeout(200);

  console.log('\n=== CHECK 1: sem nada, a faixa continua escondida ===');
  assert(await pg.evaluate(()=>{_versaoNovaDisponivel=false;_falhasEnvio={};_chavesQuaseCheias={};
    _atualizarAlertaSync();return document.getElementById('syncAlerta').hidden;})===true,'faixa escondida');

  console.log('\n=== CHECK 2: versao nova acende a faixa com acao de recarregar ===');
  const r2=await pg.evaluate(()=>{_versaoNovaDisponivel=true;_atualizarAlertaSync();
    const el=document.getElementById('syncAlerta');
    return {hidden:el.hidden,classe:el.className,txt:el.textContent.replace(/\s+/g,' ').trim(),temClique:typeof el.onclick==='function'};});
  console.log('  ', r2.txt);
  assert(r2.hidden===false,'faixa aparece');
  assert(/Nova versao|Nova versão/i.test(r2.txt),'avisa que ha versao nova');
  assert(/Recarregar agora/.test(r2.txt),'oferece a acao que resolve');
  assert(r2.temClique===true,'a faixa e clicavel');

  console.log('\n=== CHECK 3: versao nova VENCE os outros avisos ===');
  const r3=await pg.evaluate(()=>{_falhasEnvio={'mappo_os':{erro:'x',hora:'10:00'}};
    _chavesQuaseCheias={'mappo_os':900000};_atualizarAlertaSync();
    return document.getElementById('syncAlerta').textContent.replace(/\s+/g,' ').trim();});
  assert(/Nova vers/i.test(r3),'com tudo acontecendo ao mesmo tempo, o aviso de versao vence');

  console.log('\n=== CHECK 4: sem versao nova, os avisos de sync voltam ao normal ===');
  const r4=await pg.evaluate(()=>{_versaoNovaDisponivel=false;_atualizarAlertaSync();
    const el=document.getElementById('syncAlerta');
    return {txt:el.textContent.replace(/\s+/g,' ').trim(),classe:el.className};});
  console.log('  ', r4.txt.slice(0,90));
  assert(/nao esta sendo salvo|não está sendo salvo/i.test(r4.txt),'volta a mostrar a falha de sincronizacao');
  assert(/erro/.test(r4.classe),'no estado vermelho correto');

  console.log('\n=== CHECK 5: limpando tudo, a faixa some e o clique volta ao diagnostico ===');
  const r5=await pg.evaluate(()=>{_falhasEnvio={};_chavesQuaseCheias={};_atualizarAlertaSync();
    const el=document.getElementById('syncAlerta');return {hidden:el.hidden,temClique:typeof el.onclick==='function'};});
  assert(r5.hidden===true,'faixa some');
  assert(r5.temClique===true,'o clique foi reatribuido (nao ficou preso no recarregar)');

  /* Era um toast de 3 segundos (index.html:8186), posto ali porque o aviso geral estava mudo
     -- e foi o UNICO aviso de versao velha que o proprietario chegou a ver. Em 01/10/2026 o
     aviso geral passou a funcionar (testes/teste-atualizacao.js) e o remendo deu lugar a
     faixa, que fica na tela em vez de sumir em 3 segundos. O check continua cobrindo a mesma
     coisa: permission-denied ao gerar convite tem que DIZER que o app esta desatualizado. */
  /* "Acender a faixa" nao basta: ela mora no TOPO do layout e nao e position:fixed, enquanto o
     botao de convite fica no meio da lista de Configuracoes. Com a pagina rolada, acender uma
     faixa fora da tela e o mesmo que nao avisar -- o toast que saiu era fixed;bottom:26px. Por
     isso este check mede o RETANGULO da faixa, e tem controle: primeiro confirma que, rolada, a
     faixa fica FORA da tela (senao a medicao nao distinguiria nada). */
  console.log('\n=== CHECK 6: regra nega o convite -> acende a FAIXA, na tela ===');
  const r6=await pg.evaluate(async()=>{
    fbReady=true;WORKSPACE='ws';
    _falhasEnvio={};_chavesQuaseCheias={};
    document.getElementById('toast').textContent='';
    /* pagina alta o suficiente para rolar de verdade */
    let esticador=document.getElementById('__esticador');
    if(!esticador){esticador=document.createElement('div');esticador.id='__esticador';esticador.style.height='2400px';document.body.appendChild(esticador);}

    /* CONTROLE: faixa acesa sem rolar para ela -- tem que ficar FORA da tela */
    _versaoNovaDisponivel=true;_atualizarAlertaSync();
    window.scrollTo(0,1800);
    await new Promise(r=>setTimeout(r,120));
    const el=document.getElementById('syncAlerta');
    const rc=el.getBoundingClientRect();
    const controle={rolou:window.scrollY>200,dentro:rc.top>=0&&rc.bottom<=window.innerHeight,top:Math.round(rc.top)};

    /* agora o caminho de verdade: o convite falha por permission-denied */
    _versaoNovaDisponivel=false;_atualizarAlertaSync();
    window.scrollTo(0,1800);
    await new Promise(r=>setTimeout(r,120));
    tecnicos=[{id:'t1',nome:'Novo Prestador',uid:null,modulos:{split:true,vrfObras:[]},ativo:true}];
    fbDB={collection:()=>({doc:()=>({set:async()=>{const e=new Error('Missing or insufficient permissions.');e.code='permission-denied';throw e;}})})};
    window.firebase={firestore:{FieldValue:{serverTimestamp:()=>Date.now()}}};
    await gerarConviteTecnico('t1');
    await new Promise(r=>setTimeout(r,120));
    const r2=el.getBoundingClientRect();
    const tst=document.getElementById('toast');
    esticador.remove();
    return {controle,bandeira:_versaoNovaDisponivel,detectada:_versaoNovaDetectada,oculta:el.hidden,
      faixa:el.textContent.replace(/\s+/g,' ').trim(),
      naTela:r2.top>=0&&r2.bottom<=window.innerHeight,topDepois:Math.round(r2.top),
      toast:(tst.textContent||''),toastVisivel:tst.className.indexOf('show')>=0||getComputedStyle(tst).opacity!=='0'};
  });
  console.log('  ', r6.faixa.slice(0,110));
  console.log('   controle (acesa sem rolar):', JSON.stringify(r6.controle), ' depois:', r6.topDepois);
  assert(r6.controle.rolou===true,'controle positivo: a pagina rolou de verdade');
  assert(r6.controle.dentro===false,'controle positivo: acender a faixa sem rolar para ela a deixa FORA da tela');
  assert(r6.bandeira===true,'o app marca que esta rodando versao velha');
  assert(r6.oculta===false&&/Nova vers/i.test(r6.faixa),'a faixa de versao nova fica na tela, no lugar do toast de 3 segundos');
  assert(/Recarregar agora/.test(r6.faixa),'com a acao que resolve');
  assert(r6.naTela===true,'e a faixa esta VISIVEL: o app rolou ela a vista, mesmo com a pagina rolada');
  assert(r6.detectada===false,'dedução nao marca como detectada (a deteccao real continua armavel)');
  assert(/desatualizado/i.test(r6.toast),'um toast curto da retorno imediato ao toque, apontando a faixa');
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
