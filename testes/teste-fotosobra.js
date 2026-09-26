/* Fotos de obra: uma foto, um documento. Reproduz o caso relatado em 25/09/2026 --
   "Fotos - a1 925 KB - 90%", foto tirada num celular nao aparecia no outro, e excluir o
   andar nao liberava espaco. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
const linha=()=>console.log('');

function montarFake(){
  window.__nuvem={}; window.__recusas=[]; window.__apagados=[];
  const LIMITE=1048487;
  const doc=(id)=>({__id:id,
    get:async()=>({exists:window.__nuvem[id]!==undefined,data:()=>({json:window.__nuvem[id]})}),
    set:async(d)=>{
      if(typeof d.json==='string'&&d.json.length>LIMITE){
        window.__recusas.push(id);
        throw new Error('The value of property "json" is longer than '+LIMITE+' bytes.');
      }
      window.__nuvem[id]=d.json;
    },
    delete:async()=>{window.__apagados.push(id);delete window.__nuvem[id];}});
  const col=()=>({doc, where:function(){return this;}, onSnapshot:()=>()=>{}});
  fbDB={collection:()=>({doc:()=>({collection:col})}),
    runTransaction:async(fn)=>fn({
      get:async(r)=>({exists:window.__nuvem[r.__id]!==undefined,data:()=>({json:window.__nuvem[r.__id]})}),
      set:(r,d)=>{
        if(typeof d.json==='string'&&d.json.length>1048487){window.__recusas.push(r.__id);
          throw new Error('longer than 1048487 bytes');}
        window.__nuvem[r.__id]=d.json;}
    })};
  firebase={firestore:{FieldValue:{serverTimestamp:()=>Date.now()},FieldPath:{documentId:()=>'__name__'}}};
  fbReady=true; WORKSPACE='ws'; _avisouSessaoExpirada=true;
  session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
  window.fotoFalsa=(kb)=>'data:image/jpeg;base64,'+'A'.repeat(kb*1024);
  window.setFotos=(v)=>{_quietWrite=true;localStorage.setItem(CHAVE_FOTOS,JSON.stringify(v));_quietWrite=false;
    vrfFotos=v;_snapshot[CHAVE_FOTOS]=JSON.stringify(v);};
  window.getFotos=()=>JSON.parse(localStorage.getItem(CHAVE_FOTOS)||'{}');
  window.contarFotos=(o)=>{let n=0;Object.keys(o||{}).forEach(g=>Object.keys(o[g]||{}).forEach(k=>{
    (o[g][k]||[]).forEach(v=>{if(typeof v==='string'&&v.slice(0,5)==='data:')n++;});}));return n;};
  window.docsDeFoto=()=>Object.keys(window.__nuvem).filter(d=>d.indexOf(FOTO_OBRA_PREFIXO)===0).length;
  window.kbDoAndar=(g)=>Math.round((window.__nuvem[_docDoAndar(g)]||'').length/1024);
  window.zerar=()=>{window.__nuvem={};window.__recusas=[];window.__apagados=[];_pend={};
    try{localStorage.removeItem('mappo_fotos_enviadas');localStorage.removeItem(MIGR_FOTOS_CHAVE);}catch(e){}};
}

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage();
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);
  await pg.evaluate(montarFake);

  linha();console.log('=== CHECK 1: O CASO REAL -- um andar com ~1 MB de fotos ===');
  const r1=await pg.evaluate(async()=>{
    zerar();
    const etapas={};
    for(let e=0;e<4;e++){etapas['etapa'+e]=[];
      for(let i=0;i<4;i++)etapas['etapa'+e].push(fotoFalsa(60)+'#'+e+'_'+i);}
    setFotos({a1:etapas});
    const localKB=Math.round(localStorage.getItem(CHAVE_FOTOS).length/1024);
    await _pushFotosPorAndar();
    return {localKB, recusas:window.__recusas.length, andarKB:kbDoAndar('a1'),
            docsFoto:docsDeFoto(), estruturaTemFoto:/data:image/.test(window.__nuvem[_docDoAndar('a1')]||'')};
  });
  console.log('  ', JSON.stringify(r1));
  assert(r1.localKB>900,'o andar tem mesmo ~1 MB de fotos, como o relatado');
  assert(r1.recusas===0,'NADA foi recusado pelo servidor');
  assert(r1.docsFoto===16,'as 16 fotos viraram 16 documentos proprios');
  assert(r1.andarKB<5,'o documento do andar caiu pra '+r1.andarKB+' KB (era ~925)');
  assert(r1.estruturaTemFoto===false,'nenhuma foto sobrou dentro do documento do andar');

  linha();console.log('=== CHECK 2: o aparelho continua enxergando as fotos no lugar de sempre ===');
  const r2=await pg.evaluate(()=>({fotos:contarFotos(getFotos()),emMemoria:contarFotos(vrfFotos)}));
  console.log('  ', JSON.stringify(r2));
  assert(r2.fotos===16&&r2.emMemoria===16,'as 16 fotos seguem acessiveis localmente');

  linha();console.log('=== CHECK 3: O OUTRO CELULAR recebe as fotos (era isso que falhava) ===');
  const r3=await pg.evaluate(async()=>{
    setFotos({}); _pend={};
    await _aplicarShardFotos(window.__nuvem[_docDoAndar('a1')]);
    const l=getFotos();
    return {fotos:contarFotos(l), etapas:Object.keys(l.a1||{}).length};
  });
  console.log('  ', JSON.stringify(r3));
  assert(r3.fotos===16,'TODAS as 16 fotos chegaram ao segundo aparelho');
  assert(r3.etapas===4,'com as etapas certas');

  linha();console.log('=== CHECK 4: receber NAO apaga foto local (o risco do merge) ===');
  const r4=await pg.evaluate(async()=>{
    _pend={};
    await _aplicarShardFotos(window.__nuvem[_docDoAndar('a1')]);
    return {fotos:contarFotos(getFotos())};
  });
  console.log('  ', JSON.stringify(r4));
  assert(r4.fotos===16,'as fotos locais sobreviveram a um segundo recebimento');

  linha();console.log('=== CHECK 5: MUITAS fotos num andar -- o que era impossivel antes ===');
  const r5=await pg.evaluate(async()=>{
    zerar();
    const etapas={};
    for(let e=0;e<5;e++){etapas['etapa'+e]=[];
      for(let i=0;i<12;i++)etapas['etapa'+e].push(fotoFalsa(60)+'#'+e+'_'+i);}
    setFotos({a1:etapas});
    await _pushFotosPorAndar();
    return {recusas:window.__recusas.length, docsFoto:docsDeFoto(), andarKB:kbDoAndar('a1')};
  });
  console.log('  ', JSON.stringify(r5));
  assert(r5.recusas===0,'60 fotos (~3,6 MB) sobem SEM recusa nenhuma');
  assert(r5.docsFoto===60,'as 60 viraram 60 documentos');
  assert(r5.andarKB<10,'e o documento do andar ficou em '+r5.andarKB+' KB');

  linha();console.log('=== CHECK 6: EXCLUIR O ANDAR libera de verdade na nuvem ===');
  const r6=await pg.evaluate(async()=>{
    window.__apagados=[];
    await _apagarAndarNaNuvem('a1',getFotos().a1);
    return {apagados:window.__apagados.length,
            andarSumiu:window.__nuvem[_docDoAndar('a1')]===undefined,
            fotosRestantes:docsDeFoto()};
  });
  console.log('  ', JSON.stringify(r6));
  assert(r6.andarSumiu===true,'o documento do andar sumiu do servidor');
  assert(r6.fotosRestantes===0,'e as 60 fotos dele tambem');

  linha();console.log('=== CHECK 7: o OUTRO celular nao ressuscita o andar excluido ===');
  const r7=await pg.evaluate(async()=>{
    window.__nuvem={}; _pend={};
    setFotos({a1:{etapa0:[fotoFalsa(10)+'#x']}});
    _marcarMigracaoFotos();
    await _pushFotosPorAndar();
    return {gravouAlgo:Object.keys(window.__nuvem).length};
  });
  console.log('  ', JSON.stringify(r7));
  assert(r7.gravouAlgo===0,'aparelho sem alteracao pendente NAO reenvia o andar');

  linha();console.log('=== CHECK 8: mas uma foto NOVA sobe normalmente ===');
  const r8=await pg.evaluate(async()=>{
    const l=getFotos(); l.a1.etapa0.push(fotoFalsa(10)+'#novo');
    setFotos(l); _pend={};_pend[CHAVE_FOTOS]={};_pend[CHAVE_FOTOS]['a1'+SEP+'etapa0']=1;
    await _pushFotosPorAndar();
    return {docsFoto:docsDeFoto(), temAndar:!!window.__nuvem[_docDoAndar('a1')]};
  });
  console.log('  ', JSON.stringify(r8));
  assert(r8.temAndar===true&&r8.docsFoto===2,'com alteracao pendente, sobe as 2 fotos e a estrutura');

  linha();console.log('=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  linha();console.log('TODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error(e.message);process.exit(1);});
