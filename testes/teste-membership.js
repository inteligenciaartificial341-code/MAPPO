const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage();
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  pg.on('dialog',d=>d.accept());
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(300);

  const base=()=>pg.evaluate(()=>{
    window.__cb=null;
    fbReady=true; WORKSPACE='ws';
    session={perfil:'tecnico',nome:'Tec',uid:'uid-tec',workspaceId:'ws'};
    fbUnsubs=[];
    fbDB={collection:()=>({doc:()=>({collection:()=>({doc:()=>({
      onSnapshot:(ok,err)=>{window.__cb=ok;window.__err=err;return ()=>{};}
    })})})})};
    window.firebase={auth:()=>({signOut:()=>Promise.resolve()})};
    _encerrandoPorRemocao=false;
    _vigiarMembership();
    return typeof window.__cb==='function';
  });

  console.log('\n=== CHECK 1: a vigilancia e instalada ===');
  assert(await base()===true,'listener do proprio membership foi aberto');

  console.log('\n=== CHECK 2: membership existindo, nada acontece ===');
  const ok1=await pg.evaluate(()=>{__cb({exists:true,metadata:{fromCache:false}});return !!session;});
  assert(ok1===true,'sessao continua ativa enquanto o membership existe');

  console.log('\n=== CHECK 3: estado vindo do CACHE nao desloga ===');
  const ok2=await pg.evaluate(()=>{__cb({exists:false,metadata:{fromCache:true}});return !!session;});
  assert(ok2===true,'tecnico offline NAO e expulso por dado de cache');

  console.log('\n=== CHECK 4: erro de rede nao desloga ===');
  const ok3=await pg.evaluate(()=>{__err(new Error('unavailable'));return !!session;});
  assert(ok3===true,'falha de rede NAO derruba a sessao');

  console.log('\n=== CHECK 5: removido de verdade -> sessao cai ===');
  const fim=await pg.evaluate(()=>{
    __cb({exists:false,metadata:{fromCache:false}});
    return {sessao:session, temSessaoSalva:!!localStorage.getItem('mappo_session'),
            appAtivo:document.getElementById('app').classList.contains('active'),
            log:_fbLogs[_fbLogs.length-1].msg};
  });
  console.log('  ', fim.log);
  assert(fim.sessao===null,'a sessao foi encerrada');
  assert(fim.temSessaoSalva===false,'a sessao salva no aparelho foi apagada');
  assert(fim.appAtivo===false,'a tela do app foi fechada');
  assert(/removido pelo gestor/i.test(fim.log),'o motivo fica registrado no diagnostico');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
