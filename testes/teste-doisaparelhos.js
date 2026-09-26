/* Relatado em 25/09/2026: "o texto sincroniza entre celular e notebook, mas a foto fica
   presa em cada aparelho". Dois navegadores de verdade, uma nuvem compartilhada. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
const linha=()=>console.log('');

/* A nuvem vive AQUI, no node -- os dois navegadores leem e escrevem nela de verdade. */
const NUVEM={};

function preparar(){
  const doc=(id)=>({__id:id,
    get:async()=>{const v=await window.__lerNuvem(id);
      return {exists:v!==null&&v!==undefined,data:()=>({json:v})};},
    set:async(d)=>{await window.__gravarNuvem(id,d.json);},
    delete:async()=>{await window.__gravarNuvem(id,null);}});
  const col=()=>({doc, where:function(){return this;}, onSnapshot:()=>()=>{}});
  fbDB={collection:()=>({doc:()=>({collection:col})}),
    runTransaction:async(fn)=>fn({
      get:async(r)=>{const v=await window.__lerNuvem(r.__id);
        return {exists:v!==null&&v!==undefined,data:()=>({json:v})};},
      set:(r,d)=>{window.__gravarNuvem(r.__id,d.json);}})};
  firebase={firestore:{FieldValue:{serverTimestamp:()=>Date.now()},FieldPath:{documentId:()=>'__name__'}}};
  fbReady=true;WORKSPACE='ws';_avisouSessaoExpirada=true;
  session={perfil:'tecnico',nome:'Paulo',uid:'u',role:'Técnico de Campo',workspaceId:'ws'};
  tecnicos=[{id:'t1',nome:'Paulo',ativo:true,modulos:{split:true,vrfObras:[]}}];
  _gravarTourVisto();entrarApp();
  const s=document.getElementById('splashScreen');if(s)s.remove();

  window.semearOS=()=>{
    osList=[{id:'os1',cliente:'Jessika',endereco:'rua C-28, 72',data:'2026-09-25',hora:'08:00',
      qtdSplits:1,tipo:'Instalação',tecnico:'Paulo',status:'andamento',checkinTime:'07:57',
      equipamentos:[{idx:0,marca:'LG',modelo:'X',fotoEvap:null,fotoCond:null}],
      checklist:checklistDoTipo('Instalação')}];
    _quietWrite=true;localStorage.setItem('mappo_os',JSON.stringify(osList));_quietWrite=false;
    _snapshot['mappo_os']=localStorage.getItem('mappo_os');
  };
  window.enviarFoto=async(idInput)=>{
    const c=document.createElement('canvas');c.width=250;c.height=180;
    const x=c.getContext('2d');const d=x.createImageData(250,180);
    for(let i=0;i<d.data.length;i+=4){d.data[i]=Math.random()*255;d.data[i+1]=Math.random()*255;
      d.data[i+2]=Math.random()*255;d.data[i+3]=255;}
    x.putImageData(d,0,0);
    const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.8));
    const dt=new DataTransfer();dt.items.add(new File([blob],'f.jpg',{type:'image/jpeg'}));
    const inp=document.getElementById(idInput);inp.files=dt.files;
    inp.dispatchEvent(new Event('change'));
    await new Promise(r=>setTimeout(r,1400));
  };
  window.subir=async()=>{await _pushOSSemFotos();await new Promise(r=>setTimeout(r,200));};
  window.baixar=async()=>{
    const slim=await window.__lerNuvem('mappo_os');
    if(slim)await _aplicarOSComFotos(slim,Date.now());
    await new Promise(r=>setTimeout(r,400));
  };
  window.temFotos=()=>{
    const o=(JSON.parse(localStorage.getItem('mappo_os')||'[]'))[0]||{};
    const e=(o.equipamentos||[{}])[0]||{};
    return {evap:!!e.fotoEvap, cond:!!e.fotoCond,
            ck:(o.checklist||[]).filter(c=>c.foto).length,
            marcados:(o.checklist||[]).filter(c=>c.status&&c.status!=='pending').length};
  };
  window.bytesEvap=async()=>{
    const o=(JSON.parse(localStorage.getItem('mappo_os')||'[]'))[0]||{};
    const b=await fotoBytes(((o.equipamentos||[{}])[0]||{}).fotoEvap);
    return !!b&&b.slice(0,11)==='data:image/';
  };
}

async function novoAparelho(b,porta,rotulo){
  const ctx=await b.newContext();
  const pg=await ctx.newPage();
  pg.on('pageerror',e=>console.log('ERRO['+rotulo+'] '+e.message));
  await pg.exposeFunction('__lerNuvem', id=>(NUVEM[id]===undefined?null:NUVEM[id]));
  await pg.exposeFunction('__gravarNuvem',(id,v)=>{if(v===null)delete NUVEM[id];else NUVEM[id]=v;return true;});
  await pg.goto('http://localhost:'+porta+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);
  await pg.evaluate(preparar);
  return pg;
}

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const porta=srv.address().port;
  const b=await chromium.launch();
  const cel=await novoAparelho(b,porta,'celular');
  const note=await novoAparelho(b,porta,'notebook');

  linha();console.log('=== CHECK 1: celular manda 2 fotos; notebook so marca o checklist ===');
  await cel.evaluate(async()=>{semearOS();nav('ordens');abrirExecucao('os1');});
  await cel.waitForTimeout(300);
  await cel.evaluate(async()=>{await enviarFoto('fEvap0');await enviarFoto('fCond0');await subir();});
  const celDepois=await cel.evaluate(()=>temFotos());
  console.log('   celular:', JSON.stringify(celDepois));
  assert(celDepois.evap&&celDepois.cond,'o celular tem as duas fotos');

  // o notebook recebe a ordem e MARCA um item do checklist (so texto)
  await note.evaluate(async()=>{semearOS();await baixar();});
  await note.evaluate(async()=>{nav('ordens');abrirExecucao('os1');await new Promise(r=>setTimeout(r,250));toggleCheck(0);await new Promise(r=>setTimeout(r,200));await subir();});
  await note.waitForTimeout(300);
  const noteDepois=await note.evaluate(()=>temFotos());
  console.log('   notebook:', JSON.stringify(noteDepois));
  assert(noteDepois.marcados>=1,'o notebook marcou o item (o texto sincroniza, como voce disse)');
  assert(noteDepois.evap&&noteDepois.cond,'E AS FOTOS DO CELULAR CHEGARAM AO NOTEBOOK');

  linha();console.log('=== CHECK 2: os BYTES abrem no notebook (busca na nuvem) ===');
  const bytesNote=await note.evaluate(()=>bytesEvap());
  assert(bytesNote===true,'o notebook consegue exibir a foto tirada no celular');

  linha();console.log('=== CHECK 3: a marcacao do notebook NAO apagou a foto na nuvem ===');
  const r3=await cel.evaluate(async()=>{await baixar();return temFotos();});
  console.log('   celular apos receber do notebook:', JSON.stringify(r3));
  assert(r3.evap&&r3.cond,'o celular continua com as duas fotos depois do eco');
  assert(r3.marcados>=1,'e recebeu a marcacao feita no notebook');

  linha();console.log('=== CHECK 4: notebook manda foto do checklist; celular recebe ===');
  await note.evaluate(async()=>{toggleCheck(1);await new Promise(r=>setTimeout(r,150));
    await enviarFoto('cf1');await subir();});
  const r4n=await note.evaluate(()=>temFotos());
  console.log('   notebook:', JSON.stringify(r4n));
  assert(r4n.ck>=1,'o notebook gravou a foto do item');
  assert(r4n.evap&&r4n.cond,'sem perder as etiquetas que vieram do celular');
  const r4c=await cel.evaluate(async()=>{await baixar();return temFotos();});
  console.log('   celular:', JSON.stringify(r4c));
  assert(r4c.ck>=1,'E O CELULAR RECEBEU A FOTO MANDADA DO NOTEBOOK');
  assert(r4c.evap&&r4c.cond,'e continua com as suas');

  linha();console.log('=== CHECK 5: trocar a foto de um lugar sobe a NOVA ===');
  const r5=await cel.evaluate(async()=>{
    const antes=await window.__lerNuvem(_fotoOSDoc('os1','eq0_evap'));
    abrirExecucao('os1');
    await new Promise(r=>setTimeout(r,200));
    await enviarFoto('fEvap0');            // troca a etiqueta da evaporadora
    await subir();
    const depois=await window.__lerNuvem(_fotoOSDoc('os1','eq0_evap'));
    return {mudouNaNuvem:antes!==depois, temAlgo:!!depois};
  });
  console.log('  ', JSON.stringify(r5));
  assert(r5.temAlgo===true,'a nuvem tem a foto');
  assert(r5.mudouNaNuvem===true,'e a foto NOVA substituiu a antiga la (antes ficava a velha)');

  await b.close(); srv.close();
  linha();console.log('TODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error(e.message);process.exit(1);});
