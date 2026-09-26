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

  console.log('\n=== CHECK 6: mensagem propria quando a regra nega o convite ===');
  const r6=await pg.evaluate(async()=>{
    fbReady=true;WORKSPACE='ws';
    tecnicos=[{id:'t1',nome:'Novo Prestador',uid:null,modulos:{split:true,vrfObras:[]},ativo:true}];
    fbDB={collection:()=>({doc:()=>({set:async()=>{const e=new Error('Missing or insufficient permissions.');e.code='permission-denied';throw e;}})})};
    window.firebase={firestore:{FieldValue:{serverTimestamp:()=>Date.now()}}};
    await gerarConviteTecnico('t1');
    return document.getElementById('toast').textContent;
  });
  console.log('  ', r6);
  assert(/desatualizado/i.test(r6)&&/recarregue/i.test(r6),'diz que o app esta desatualizado e manda recarregar');
  assert(!/tente de novo/i.test(r6),'nao manda mais "tente de novo", que nunca resolveria');

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
