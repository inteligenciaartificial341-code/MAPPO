/* Relatado em 25/09/2026: ao enviar a foto de um item, a foto do item ANTERIOR some.
   Mesmo com a etiqueta da evaporadora x condensadora. Reproduz o fluxo exato. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
const linha=()=>console.log('');

function montarFake(){
  window.__nuvem={};
  const doc=(id)=>({__id:id,
    get:async()=>({exists:window.__nuvem[id]!==undefined,data:()=>({json:window.__nuvem[id]})}),
    set:async(d)=>{window.__nuvem[id]=d.json;},
    delete:async()=>{delete window.__nuvem[id];}});
  const col=()=>({doc, where:function(){return this;}, onSnapshot:()=>()=>{}});
  fbDB={collection:()=>({doc:()=>({collection:col})}),
    runTransaction:async(fn)=>fn({
      get:async(r)=>({exists:window.__nuvem[r.__id]!==undefined,data:()=>({json:window.__nuvem[r.__id]})}),
      set:(r,d)=>{window.__nuvem[r.__id]=d.json;}})};
  firebase={firestore:{FieldValue:{serverTimestamp:()=>Date.now()},FieldPath:{documentId:()=>'__name__'}}};
  fbReady=true; WORKSPACE='ws'; _avisouSessaoExpirada=true;
  session={perfil:'tecnico',nome:'Paulo',uid:'u',role:'Técnico de Campo',workspaceId:'ws'};
  tecnicos=[{id:'t1',nome:'Paulo',ativo:true,modulos:{split:true,vrfObras:[]}}];
  _gravarTourVisto(); entrarApp();
  const s=document.getElementById('splashScreen'); if(s)s.remove();
  osList=[{id:'os1',cliente:'Jessika',endereco:'rua C-28, 72',data:'2026-09-25',hora:'08:00',
    qtdSplits:1,tipo:'Instalação',tecnico:'Paulo',status:'andamento',checkinTime:'07:57',
    equipamentos:[{idx:0,marca:'LG',modelo:'X',fotoEvap:null,fotoCond:null}],
    checklist:checklistDoTipo('Instalação')}];
  _quietWrite=true;localStorage.setItem('mappo_os',JSON.stringify(osList));_quietWrite=false;
  _snapshot['mappo_os']=localStorage.getItem('mappo_os');

  window.jpegDeVerdade=()=>{
    const c=document.createElement('canvas');c.width=300;c.height=220;
    const x=c.getContext('2d');const d=x.createImageData(300,220);
    for(let i=0;i<d.data.length;i+=4){d.data[i]=Math.random()*255;d.data[i+1]=Math.random()*255;
      d.data[i+2]=Math.random()*255;d.data[i+3]=255;}
    x.putImageData(d,0,0);return c;
  };
  /* dispara o input de arquivo como o tecnico faz */
  window.enviarFoto=(idInput)=>new Promise(res=>{
    jpegDeVerdade().toBlob(blob=>{
      const dt=new DataTransfer(); dt.items.add(new File([blob],'f.jpg',{type:'image/jpeg'}));
      const inp=document.getElementById(idInput);
      inp.files=dt.files; inp.dispatchEvent(new Event('change'));
      setTimeout(res,1200);
    },'image/jpeg',0.8);
  });
  /* o eco real da nuvem, como acontece depois de cada envio */
  window.ecoDaNuvem=async()=>{
    await _pushOSSemFotos();
    const slim=window.__nuvem['mappo_os'];
    if(slim)await _aplicarOSComFotos(slim,Date.now());
    await new Promise(r=>setTimeout(r,200));
  };
  window.estadoChecklist=()=>{
    const o=JSON.parse(localStorage.getItem('mappo_os'))[0];
    return (o.checklist||[]).map(c=>c.foto?'TEM':'-').join(',');
  };
  window.estadoEquip=()=>{
    const o=JSON.parse(localStorage.getItem('mappo_os'))[0];
    const e=o.equipamentos[0];
    return (e.fotoEvap?'EVAP':'-')+'/'+(e.fotoCond?'COND':'-');
  };
}

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:390,height:844}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);
  await pg.evaluate(montarFake);

  linha();console.log('=== CHECK 1: ETIQUETAS -- evaporadora e depois condensadora ===');
  const r1=await pg.evaluate(async()=>{
    nav('ordens'); abrirExecucao('os1');
    await new Promise(r=>setTimeout(r,300));
    await enviarFoto('fEvap0');
    const depoisEvap=estadoEquip();
    await ecoDaNuvem();
    const aposEco1=estadoEquip();
    await enviarFoto('fCond0');
    const depoisCond=estadoEquip();
    await ecoDaNuvem();
    const aposEco2=estadoEquip();
    return {depoisEvap,aposEco1,depoisCond,aposEco2};
  });
  console.log('  ', JSON.stringify(r1));
  assert(r1.depoisEvap==='EVAP/-','a foto da evaporadora foi salva');
  assert(r1.aposEco1==='EVAP/-','e sobreviveu ao eco da nuvem');
  assert(r1.depoisCond==='EVAP/COND','AO SALVAR A CONDENSADORA, A EVAPORADORA CONTINUA LA');
  assert(r1.aposEco2==='EVAP/COND','e as duas sobrevivem ao eco');

  linha();console.log('=== CHECK 2: CHECKLIST -- dois itens seguidos ===');
  const r2=await pg.evaluate(async()=>{
    // marca os dois primeiros itens para liberar o botao de foto
    toggleCheck(0); await new Promise(r=>setTimeout(r,120));
    toggleCheck(1); await new Promise(r=>setTimeout(r,120));
    await enviarFoto('cf0');
    const depois1=estadoChecklist();
    await ecoDaNuvem();
    const eco1=estadoChecklist();
    await enviarFoto('cf1');
    const depois2=estadoChecklist();
    await ecoDaNuvem();
    const eco2=estadoChecklist();
    return {depois1,eco1,depois2,eco2};
  });
  console.log('  ', JSON.stringify(r2));
  assert(r2.depois1.split(',')[0]==='TEM','a foto do item 1 foi salva');
  assert(r2.eco1.split(',')[0]==='TEM','e sobreviveu ao eco');
  assert(r2.depois2.split(',')[0]==='TEM','AO SALVAR O ITEM 2, O ITEM 1 CONTINUA COM FOTO');
  assert(r2.depois2.split(',')[1]==='TEM','e o item 2 tambem tem');
  assert(r2.eco2.split(',')[0]==='TEM'&&r2.eco2.split(',')[1]==='TEM','as duas sobrevivem ao eco');

  linha();console.log('=== CHECK 3: os BYTES das duas continuam recuperaveis ===');
  const r3=await pg.evaluate(async()=>{
    const o=JSON.parse(localStorage.getItem('mappo_os'))[0];
    const a=await fotoBytes(o.checklist[0].foto);
    const c=await fotoBytes(o.checklist[1].foto);
    const ev=await fotoBytes(o.equipamentos[0].fotoEvap);
    const co=await fotoBytes(o.equipamentos[0].fotoCond);
    return {ck0:!!a&&a.slice(0,11)==='data:image/', ck1:!!c&&c.slice(0,11)==='data:image/',
            evap:!!ev&&ev.slice(0,11)==='data:image/', cond:!!co&&co.slice(0,11)==='data:image/',
            idsDiferentes:o.checklist[0].foto!==o.checklist[1].foto};
  });
  console.log('  ', JSON.stringify(r3));
  assert(r3.ck0&&r3.ck1,'as duas fotos do checklist voltam inteiras');
  assert(r3.evap&&r3.cond,'as duas etiquetas tambem');
  assert(r3.idsDiferentes===true,'e cada foto tem a sua propria referencia (sem colisao)');

  linha();console.log('=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  linha();console.log('TODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error(e.message);process.exit(1);});
