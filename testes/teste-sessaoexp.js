const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1100,height:820}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'}); await pg.waitForTimeout(400);

  console.log('\n=== CHECK 1: sem sessao local, onNoUser nao incomoda ===');
  const r1=await pg.evaluate(()=>{session=null;_avisouSessaoExpirada=false;_semAutenticacao();
    return !!document.getElementById('curOverlay');});
  assert(r1===false,'na tela de login nao aparece modal nenhum');

  console.log('\n=== CHECK 2: EXATAMENTE o caso do Paulo -- sessao local sem auth do Firebase ===');
  const r2=await pg.evaluate(()=>{
    session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
    localStorage.setItem('mappo_session',JSON.stringify(session));
    localStorage.setItem('mappo_os','[{"id":"os1"}]');   // trabalho ja feito no aparelho
    entrarApp(); const s=document.getElementById('splashScreen'); if(s)s.remove();
    fbReady=false; WORKSPACE=null; _avisouSessaoExpirada=false;
    _semAutenticacao();
    const ov=document.getElementById('curOverlay');
    return {modal:!!ov, txt:ov?ov.textContent.replace(/\s+/g,' ').trim():'',
            log:_fbLogs[_fbLogs.length-1].msg};
  });
  console.log('  ', r2.txt.slice(0,190));
  assert(r2.modal===true,'aparece o aviso de sessao expirada');
  assert(/nada est[aá] sendo enviado/i.test(r2.txt),'explica que nada esta sincronizando');
  assert(/Nada do que j[aá] est[aá] neste aparelho se perde/i.test(r2.txt),'tranquiliza que o trabalho local nao se perde');
  assert(/Entrar de novo/i.test(r2.txt),'oferece a acao que resolve');
  assert(/Sess[aã]o do Firebase ausente/i.test(r2.log),'registra o motivo no diagnostico');

  console.log('\n=== CHECK 3: nao repete o aviso ===');
  // closeModal() so limpa o #modalRoot 200ms depois (animacao): espera antes de conferir
  await pg.evaluate(()=>closeModal());
  await pg.waitForTimeout(350);
  const r3=await pg.evaluate(()=>{_semAutenticacao();
    return !!document.getElementById('curOverlay');});
  assert(r3===false,'nao reabre o modal a cada chamada');

  console.log('\n=== CHECK 4: "Entrar de novo" volta ao login SEM apagar o trabalho ===');
  await pg.evaluate(()=>{_avisouSessaoExpirada=false;_semAutenticacao();});
  await pg.waitForTimeout(150);
  await pg.evaluate(()=>_voltarAoLogin());
  await pg.waitForTimeout(350);
  const r4=await pg.evaluate(()=>({
    sessao:session, sessaoSalva:localStorage.getItem('mappo_session'),
    dadosIntactos:localStorage.getItem('mappo_os'),
    loginVisivel:!document.getElementById('loginScreen').classList.contains('hidden'),
    appAtivo:document.getElementById('app').classList.contains('active')
  }));
  assert(r4.sessao===null&&r4.sessaoSalva===null,'a sessao de tela foi encerrada');
  assert(r4.dadosIntactos==='[{"id":"os1"}]','O TRABALHO NO APARELHO CONTINUA INTACTO');
  assert(r4.loginVisivel===true&&r4.appAtivo===false,'voltou para a tela de login');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
