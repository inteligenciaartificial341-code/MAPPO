const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1100,height:800}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'}); await pg.waitForTimeout(300);

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

  console.log('\n=== CHECK 6: sem-nuvem tem prioridade sobre versao nova ===');
  const r6=await pg.evaluate(()=>{_versaoNovaDisponivel=true;_atualizarAlertaSync();
    return document.getElementById('syncAlerta').textContent.replace(/\s+/g,' ').trim();});
  assert(/Sem conex/i.test(r6),'sem-nuvem vence (mensagem mais consequente; a acao e a mesma)');
  const r6b=await pg.evaluate(()=>{fbReady=true;WORKSPACE='ws';_atualizarAlertaSync();
    return document.getElementById('syncAlerta').textContent.replace(/\s+/g,' ').trim();});
  assert(/Nova vers/i.test(r6b),'com a nuvem ok, o aviso de versao nova aparece');

  console.log('\n=== CHECK 7: a ronda de vigilancia fica ativa ===');
  assert(await pg.evaluate(()=>{_vigiarConexao();return _rondaNuvem!==null;})===true,'ronda de 5s instalada');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
