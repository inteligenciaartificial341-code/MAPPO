/* O celular recarrega a pagina quando a camera abre (pressao de memoria). Antes, o tecnico
   voltava na TELA PRINCIPAL, fora da OS, e parecia que a foto tinha dado erro. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }

const SEMENTE=()=>{
  const os=[{id:'os1',cliente:'Jessika',endereco:'rua C-28',tipo:'Instalação',tecnico:'Paulo',
    data:'2026-09-25',hora:'08:00',status:'andamento',qtdSplits:1,checkinTime:'07:57',
    equipamentos:[{idx:0,marca:'',modelo:'',fotoEvap:null,fotoCond:null}],checklist:[]}];
  localStorage.setItem('mappo_os',JSON.stringify(os));
  localStorage.setItem('mappo_tecnicos',JSON.stringify([{id:'t1',nome:'Paulo',ativo:true,modulos:{split:true,vrfObras:[]}}]));
  localStorage.setItem('mappo_session',JSON.stringify({perfil:'tecnico',nome:'Paulo',uid:'u',role:'Técnico de Campo'}));
};

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const base='http://localhost:'+srv.address().port+'/';
  const b=await chromium.launch();
  const pg=await b.newPage({viewport:{width:390,height:844}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));

  await pg.goto(base,{waitUntil:'load'});
  await pg.evaluate(SEMENTE);
  await pg.reload({waitUntil:'load'});
  await pg.waitForTimeout(700);

  console.log('\n=== CHECK 1: tecnico entra na OS ===');
  const r1=await pg.evaluate(async()=>{
    const s=document.getElementById('splashScreen'); if(s)s.remove();
    _gravarTourVisto();
    nav('ordens'); abrirExecucao('os1');
    return {aberta:!!document.getElementById('equipPanelArea'),
            lembrou:!!sessionStorage.getItem('mappo_exec_aberta')};
  });
  console.log('  ', JSON.stringify(r1));
  assert(r1.aberta===true,'a tela de execucao esta aberta');
  // (a anotacao em si e verificada pelo resultado do CHECK 2, que e o sintoma de verdade)

  console.log('\n=== CHECK 2: O CASO REAL -- o celular recarrega com a camera aberta ===');
  await pg.reload({waitUntil:'load'});
  await pg.waitForTimeout(900);
  const r2=await pg.evaluate(()=>{
    const s=document.getElementById('splashScreen'); if(s)s.remove();
    return {execAberta:!!document.getElementById('equipPanelArea'),
            view:typeof currentView!=='undefined'?currentView:null,
            osDaTela:typeof execOS!=='undefined'&&execOS?execOS.id:null,
            textoDaTela:document.getElementById('contentArea').innerText.slice(0,60).replace(/\s+/g,' ')};
  });
  console.log('  ', JSON.stringify(r2));
  assert(r2.execAberta===true,'DEPOIS DA RECARGA o tecnico volta PRA MESMA OS, nao pra tela principal');
  assert(r1.lembrou===true,'e o app tinha anotado qual OS estava aberta');
  assert(r2.osDaTela==='os1','e e a OS certa');

  console.log('\n=== CHECK 3: sair da OS de proposito NAO deve retomar ===');
  await pg.evaluate(()=>voltarExec());
  await pg.reload({waitUntil:'load'});
  await pg.waitForTimeout(900);
  const r3=await pg.evaluate(()=>({
    execAberta:!!document.getElementById('equipPanelArea'),
    lembrou:!!sessionStorage.getItem('mappo_exec_aberta')}));
  console.log('  ', JSON.stringify(r3));
  assert(r3.lembrou===false,'ao sair da OS o app esquece');
  assert(r3.execAberta===false,'e a recarga seguinte NAO reabre a OS');

  console.log('\n=== CHECK 4: OS de OUTRO tecnico nunca e reaberta ===');
  const r4=await pg.evaluate(async()=>{
    sessionStorage.setItem('mappo_exec_aberta',JSON.stringify({id:'os1',ts:Date.now()}));
    const o=JSON.parse(localStorage.getItem('mappo_os')); o[0].tecnico='Outra Pessoa';
    localStorage.setItem('mappo_os',JSON.stringify(o));
    return true;
  });
  await pg.reload({waitUntil:'load'});
  await pg.waitForTimeout(900);
  const r4b=await pg.evaluate(()=>({execAberta:!!document.getElementById('equipPanelArea')}));
  assert(r4b.execAberta===false,'OS que nao e do tecnico nao e reaberta');

  console.log('\n=== CHECK 5: anotacao velha (mais de 30 min) e ignorada ===');
  await pg.evaluate(()=>{
    const o=JSON.parse(localStorage.getItem('mappo_os')); o[0].tecnico='Paulo';
    localStorage.setItem('mappo_os',JSON.stringify(o));
    sessionStorage.setItem('mappo_exec_aberta',JSON.stringify({id:'os1',ts:Date.now()-31*60*1000}));
  });
  await pg.reload({waitUntil:'load'});
  await pg.waitForTimeout(900);
  const r5=await pg.evaluate(()=>({execAberta:!!document.getElementById('equipPanelArea'),
    lembrou:!!sessionStorage.getItem('mappo_exec_aberta')}));
  console.log('  ', JSON.stringify(r5));
  assert(r5.execAberta===false,'anotacao antiga nao reabre a OS');
  assert(r5.lembrou===false,'e e descartada');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
