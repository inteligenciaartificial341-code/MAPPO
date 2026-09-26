const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1280,height:800}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);

  await pg.evaluate(()=>{
    session={perfil:'gestor',nome:'Teste Gestor',uid:'uid-a',role:'Gestor',workspaceId:'ws'};
    _gravarTourVisto(); entrarApp(); fbReady=true; WORKSPACE='ws';
  });
  await pg.waitForTimeout(200);

  console.log('\n=== CHECK 1: com tudo normal, a faixa fica ESCONDIDA ===');
  assert(await pg.evaluate(()=>document.getElementById('syncAlerta').hidden)===true,'faixa escondida quando não há problema');

  console.log('\n=== CHECK 2: falha de envio ACENDE a faixa vermelha ===');
  const r2=await pg.evaluate(()=>{
    _falhasEnvio={}; _chavesQuaseCheias={};
    _falhasEnvio['mappo_vrf_fotos']={erro:'deu ruim',hora:'14:32'};
    _atualizarAlertaSync();
    const el=document.getElementById('syncAlerta');
    return {hidden:el.hidden, classe:el.className, txt:el.textContent.replace(/\s+/g,' ').trim()};
  });
  console.log('  ', r2.txt);
  assert(r2.hidden===false,'faixa aparece');
  assert(/erro/.test(r2.classe),'faixa em estado de erro (vermelha)');
  assert(/Fotos das obras/.test(r2.txt),'usa o nome que o dono entende, não a chave interna');
  assert(/14:32/.test(r2.txt),'mostra desde quando o problema existe');

  console.log('\n=== CHECK 3: aviso PREVENTIVO (amarelo) antes de estourar ===');
  const r3=await pg.evaluate(()=>{
    _falhasEnvio={}; _chavesQuaseCheias={'mappo_os':900000};
    _atualizarAlertaSync();
    const el=document.getElementById('syncAlerta');
    return {classe:el.className, txt:el.textContent.replace(/\s+/g,' ').trim()};
  });
  console.log('  ', r3.txt);
  assert(/aviso/.test(r3.classe),'faixa em estado de aviso (amarela)');
  assert(/86%/.test(r3.txt),'mostra a porcentagem real do limite');

  console.log('\n=== CHECK 4: falha real vence o aviso preventivo ===');
  const r4=await pg.evaluate(()=>{
    _falhasEnvio={'mappo_os':{erro:'x',hora:'09:00'}}; _chavesQuaseCheias={'mappo_vrf_fotos':900000};
    _atualizarAlertaSync();
    return document.getElementById('syncAlerta').className;
  });
  assert(/erro/.test(r4),'com falha E aviso ao mesmo tempo, mostra a falha (mais grave)');

  console.log('\n=== CHECK 5: normalizou -> faixa some sozinha ===');
  assert(await pg.evaluate(()=>{_falhasEnvio={};_chavesQuaseCheias={};_atualizarAlertaSync();
    return document.getElementById('syncAlerta').hidden;})===true,'faixa some quando tudo volta ao normal');

  console.log('\n=== CHECK 6: _doPush mede ANTES de enviar e acende o preventivo ===');
  const r6=await pg.evaluate(async()=>{
    _falhasEnvio={}; _chavesQuaseCheias={};
    fbReady=true; WORKSPACE='ws';
    // servidor falso: aceita a transação e devolve o que mandaram
    fbDB={collection:()=>({doc:()=>({collection:()=>({doc:()=>({__ref:true})})})})};
    const origGravar=_gravarMesclado;
    _gravarMesclado=async(ref,mesclar)=>mesclar(null);
    _quietWrite=true; localStorage.setItem('mappo_os','["'+'a'.repeat(850000)+'"]'); _quietWrite=false;
    await _doPush('mappo_os');
    const el=document.getElementById('syncAlerta');
    const out={quaseCheia:_chavesQuaseCheias['mappo_os']!==undefined, classe:el.className, txt:el.textContent.replace(/\s+/g,' ').trim()};
    _gravarMesclado=origGravar;
    return out;
  });
  console.log('  ', r6.txt);
  assert(r6.quaseCheia===true,'_doPush detectou que mappo_os passou do limiar');
  assert(/aviso/.test(r6.classe),'e acendeu a faixa amarela sozinho');

  console.log('\n=== CHECK 7: falha de verdade no envio acende sozinho, e sucesso limpa ===');
  const r7=await pg.evaluate(async()=>{
    _falhasEnvio={}; _chavesQuaseCheias={};
    _quietWrite=true; localStorage.setItem('mappo_clientes','[{"nome":"c"}]'); _quietWrite=false;
    const orig=_gravarMesclado;
    _gravarMesclado=async()=>{const e=new Error('documento grande demais');throw e;};
    await _doPush('mappo_clientes');
    const acendeu=!document.getElementById('syncAlerta').hidden && /erro/.test(document.getElementById('syncAlerta').className);
    _gravarMesclado=async(ref,mesclar)=>mesclar(null);      // agora volta a funcionar
    await _doPush('mappo_clientes');
    const limpou=document.getElementById('syncAlerta').hidden;
    _gravarMesclado=orig;
    return {acendeu,limpou};
  });
  assert(r7.acendeu===true,'falha real no envio acende a faixa sozinha');
  assert(r7.limpou===true,'quando volta a enviar, a faixa some sozinha');

  console.log('\n=== CHECK 8: tabela de tamanhos em Configurações → Sincronização ===');
  const r8=await pg.evaluate(()=>{
    _quietWrite=true;
    // formato REAL da chave de fotos: {andar:{etapa:[fotos]}} -- a tabela agora abre uma
    // linha por andar, porque e por andar que vai pra nuvem (Etapa B)
    localStorage.setItem('mappo_vrf_fotos',JSON.stringify({a1:{et1:['b'.repeat(925*1024)]}}));
    localStorage.setItem('mappo_manut','[{"id":1}]');
    _quietWrite=false;
    nav('config');
    const alvo=document.getElementById('diagTamanhos');
    return {existe:!!alvo, txt:alvo?alvo.textContent.replace(/\s+/g,' ').trim():'', barras:alvo?alvo.querySelectorAll('.diag-barra.aviso,.diag-barra.cheio').length:0};
  });
  console.log('  ', r8.txt.slice(0,150));
  assert(r8.existe===true,'a tabela existe na tela de Configurações');
  assert(/Fotos —/.test(r8.txt),'lista as fotos por andar, que é como vão pra nuvem');
  assert(/9\d%|8\d%/.test(r8.txt),'mostra a porcentagem do limite');
  assert(r8.barras>=1,'a barra fica destacada (amarela/vermelha) no que está perto do teto');
  assert(!/Manutenções/.test(r8.txt),'não polui a lista com dado irrelevante (<1 KB)');

  console.log('\n=== erros de página ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de página no roteiro todo');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
