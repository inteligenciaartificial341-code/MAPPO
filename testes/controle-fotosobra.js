/* Controle: mede o SINTOMA nas duas versoes -- quanto o documento de UM andar ocupa
   no servidor, e se o servidor recusa. Roda igual no codigo antigo e no novo. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage();
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);
  const r=await pg.evaluate(async()=>{
    window.__nuvem={}; window.__recusas=[];
    const LIMITE=1048487;
    const doc=(id)=>({__id:id,
      get:async()=>({exists:window.__nuvem[id]!==undefined,data:()=>({json:window.__nuvem[id]})}),
      set:async(d)=>{
        if(typeof d.json==='string'&&d.json.length>LIMITE){window.__recusas.push(id);
          throw new Error('longer than '+LIMITE+' bytes');}
        window.__nuvem[id]=d.json;},
      delete:async()=>{delete window.__nuvem[id];}});
    const col=()=>({doc, where:function(){return this;}, onSnapshot:()=>()=>{}});
    fbDB={collection:()=>({doc:()=>({collection:col})}),
      runTransaction:async(fn)=>fn({
        get:async(x)=>({exists:window.__nuvem[x.__id]!==undefined,data:()=>({json:window.__nuvem[x.__id]})}),
        set:(x,d)=>{if(typeof d.json==='string'&&d.json.length>LIMITE){window.__recusas.push(x.__id);
          throw new Error('longer');}window.__nuvem[x.__id]=d.json;}})};
    firebase={firestore:{FieldValue:{serverTimestamp:()=>Date.now()},FieldPath:{documentId:()=>'__name__'}}};
    fbReady=true; WORKSPACE='ws';
    session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
    _pend={};
    try{localStorage.removeItem('mappo_fotos_enviadas');localStorage.removeItem('mappo_fotos_migr');}catch(e){}
    const foto=kb=>'data:image/jpeg;base64,'+'A'.repeat(kb*1024);
    const etapas={};
    for(let e=0;e<4;e++){etapas['etapa'+e]=[];
      for(let i=0;i<4;i++)etapas['etapa'+e].push(foto(60)+'#'+e+'_'+i);}
    _quietWrite=true;localStorage.setItem(CHAVE_FOTOS,JSON.stringify({a1:etapas}));_quietWrite=false;
    vrfFotos={a1:etapas}; _snapshot[CHAVE_FOTOS]=localStorage.getItem(CHAVE_FOTOS);
    const localKB=Math.round(localStorage.getItem(CHAVE_FOTOS).length/1024);
    await _pushFotosPorAndar();
    const docAndar=window.__nuvem[_docDoAndar('a1')]||'';
    return {localKB,
            andarNoServidorKB:Math.round(docAndar.length/1024),
            pctDoTeto:Math.round(docAndar.length/LIMITE*100),
            recusas:window.__recusas.length,
            totalDocs:Object.keys(window.__nuvem).length};
  });
  console.log(JSON.stringify(r,null,1));
  await b.close(); srv.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
