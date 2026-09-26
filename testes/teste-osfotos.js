/* Fotos da OS em documentos proprios: reproduz o caso real (uma OS de 1082 KB que o servidor
   recusava) e verifica que nada se perde no caminho. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }

function montarFake(){
  window.__nuvem={};
  window.__recusas=[];
  const LIMITE=1048487;
  const doc=(id)=>({__id:id,
    get:async()=>({exists:window.__nuvem[id]!==undefined,data:()=>({json:window.__nuvem[id]})}),
    set:async(d)=>{
      // servidor de mentira que RECUSA acima do teto, igual ao Firestore real
      if(typeof d.json==='string'&&d.json.length>LIMITE){
        window.__recusas.push(id);
        throw new Error('The value of property "json" is longer than '+LIMITE+' bytes.');
      }
      window.__nuvem[id]=d.json;
    }});
  const col=()=>({doc,
    get:async()=>{const ids=Object.keys(window.__nuvem);
      return {size:ids.length,forEach:f=>ids.forEach(i=>f({id:i,data:()=>({json:window.__nuvem[i]})}))};},
    where:function(){return this;}, onSnapshot:()=>()=>{}});
  fbDB={collection:()=>({doc:()=>({collection:col})}),
    runTransaction:async(fn)=>fn({
      get:async(r)=>({exists:window.__nuvem[r.__id]!==undefined,data:()=>({json:window.__nuvem[r.__id]})}),
      set:(r,d)=>{
        if(typeof d.json==='string'&&d.json.length>1048487){window.__recusas.push(r.__id);
          throw new Error('The value of property "json" is longer than 1048487 bytes.');}
        window.__nuvem[r.__id]=d.json;}
    })};
  firebase={firestore:{FieldValue:{serverTimestamp:()=>Date.now()},FieldPath:{documentId:()=>'__name__'}}};
  fbReady=true; WORKSPACE='ws'; session={perfil:'tecnico',nome:'T',uid:'u',workspaceId:'ws'};
  window.setOS=(l)=>{const s=JSON.stringify(l);_quietWrite=true;localStorage.setItem('mappo_os',s);_quietWrite=false;osList=l;_snapshot['mappo_os']=s;};
  window.getOS=()=>JSON.parse(localStorage.getItem('mappo_os')||'[]');
  window.fotoFalsa=(kb)=>'data:image/jpeg;base64,'+'A'.repeat(kb*1024);
  window.contarFotos=(l)=>{let n=0;(l||[]).forEach(os=>{
    (os.equipamentos||[]).forEach(e=>{if(e.fotoEvap)n++;if(e.fotoCond)n++;});
    (os.checklist||[]).forEach(c=>{if(c.foto)n++;});
    if(os.assinatura)n++;});return n;};
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

  console.log('\n=== CHECK 1: o CASO REAL -- uma OS de ~1 MB que o servidor recusava ===');
  const r1=await pg.evaluate(async()=>{
    window.__nuvem={}; window.__recusas=[]; _pend={};
    try{localStorage.removeItem('mappo_fotos_enviadas');}catch(e){}
    setOS([{id:'os1',cliente:'Jessika',tipo:'Instalacao',status:'concluida',
      equipamentos:[{marca:'Samsung',modelo:'X',fotoEvap:fotoFalsa(180),fotoCond:fotoFalsa(180)}],
      checklist:[{id:'a',label:'A',critico:true,status:'ok',foto:fotoFalsa(180)},
                 {id:'b',label:'B',critico:true,status:'ok',foto:fotoFalsa(180)},
                 {id:'c',label:'C',critico:true,status:'ok',foto:fotoFalsa(180)},
                 {id:'d',label:'D',critico:true,status:'ok',foto:fotoFalsa(180)}],
      assinatura:fotoFalsa(30)}]);
    const tamanhoAntigo=localStorage.getItem('mappo_os').length;
    await _pushOSSemFotos();
    const docs=Object.keys(window.__nuvem);
    return {tamanhoAntigoKB:Math.round(tamanhoAntigo/1024),
      recusas:window.__recusas.length,
      registroKB:Math.round((window.__nuvem['mappo_os']||'').length/1024),
      docsFoto:docs.filter(d=>d.startsWith('mappo_foto__')).length,
      registroTemFoto:/data:image/.test(window.__nuvem['mappo_os']||'')};
  });
  console.log('  ', JSON.stringify(r1));
  assert(r1.tamanhoAntigoKB>1000,'a OS de teste tem mesmo mais de 1 MB, como a real');
  assert(r1.recusas===0,'NADA foi recusado pelo servidor (antes, tudo era)');
  assert(r1.registroKB<10,'o registro das ordens ficou minusculo ('+r1.registroKB+' KB)');
  assert(r1.docsFoto===7,'as 7 fotos viraram 7 documentos proprios');
  assert(r1.registroTemFoto===false,'nenhuma foto sobrou dentro do registro');

  console.log('\n=== CHECK 2: o aparelho continua enxergando as fotos no lugar de sempre ===');
  const r2=await pg.evaluate(()=>{const l=getOS();
    return {fotos:contarFotos(l), evap:(l[0].equipamentos[0].fotoEvap||'').slice(0,11),
            assinatura:!!l[0].assinatura};});
  assert(r2.fotos===7,'as 7 fotos continuam acessiveis localmente');
  assert(r2.evap==='data:image/','e continuam sendo imagem de verdade, nao um marcador');

  console.log('\n=== CHECK 3: OUTRO APARELHO baixa as fotos a partir do registro ===');
  const r3=await pg.evaluate(async()=>{
    const daNuvem=window.__nuvem['mappo_os'];
    setOS([]);                                  // aparelho zerado
    await _aplicarOSComFotos(daNuvem,Date.now());
    const l=getOS();
    // a foto agora chega como REFERENCIA: o que importa e os bytes voltarem
    const ev=l[0]?await fotoBytes(l[0].equipamentos[0].fotoEvap):null;
    const sg=l[0]?await fotoBytes(l[0].assinatura):null;
    return {ordens:l.length, fotos:contarFotos(l),
            evapOk:(ev||'').slice(0,11)==='data:image/',
            assinaturaOk:(sg||'').slice(0,11)==='data:image/'};
  });
  console.log('  ', JSON.stringify(r3));
  assert(r3.ordens===1,'a ordem chegou');
  assert(r3.fotos===7,'TODAS as 7 fotos foram remontadas a partir dos documentos');
  assert(r3.evapOk&&r3.assinaturaOk,'inclusive a etiqueta e a assinatura');

  console.log('\n=== CHECK 4: receber a ordem NAO apaga foto local (o risco do merge) ===');
  const r4=await pg.evaluate(async()=>{
    _pend={};
    const comFoto=getOS();
    // a nuvem manda o registro (sem fotos). Se o merge nao respeitasse, apagaria as locais.
    await _aplicarOSComFotos(window.__nuvem['mappo_os'],Date.now());
    return {fotos:contarFotos(getOS())};
  });
  assert(r4.fotos===7,'as fotos locais sobreviveram ao merge');

  console.log('\n=== CHECK 5: foto nova nao reenvia as antigas ===');
  const r5=await pg.evaluate(async()=>{
    const antes=Object.keys(window.__nuvem).length;
    const l=getOS(); l[0].checklist.push({id:'e',label:'E',critico:false,status:'ok',foto:fotoFalsa(100)});
    setOS(l); _pend={'mappo_os':{'os1':{checklist:1}}};
    const gravadosAntes=Object.keys(window.__nuvem).length;
    await _pushOSSemFotos();
    return {novos:Object.keys(window.__nuvem).length-gravadosAntes, recusas:window.__recusas.length};
  });
  console.log('  ', JSON.stringify(r5));
  assert(r5.novos===1,'so o documento da foto nova foi criado');
  assert(r5.recusas===0,'sem recusa do servidor');

  console.log('\n=== CHECK 6: MUITAS ordens com fotos -- o que era impossivel antes ===');
  const r6=await pg.evaluate(async()=>{
    window.__nuvem={}; window.__recusas=[]; _pend={};
    try{localStorage.removeItem('mappo_fotos_enviadas');}catch(e){}
    const muitas=[];
    for(let i=0;i<12;i++)muitas.push({id:'os'+i,cliente:'Cliente '+i,tipo:'Instalacao',status:'concluida',
      equipamentos:[{fotoEvap:fotoFalsa(60),fotoCond:fotoFalsa(60)}],
      checklist:[{id:'a',label:'A',status:'ok',foto:fotoFalsa(60)}],
      assinatura:fotoFalsa(15)});
    setOS(muitas);
    await _pushOSSemFotos();
    return {recusas:window.__recusas.length,
      registroKB:Math.round((window.__nuvem['mappo_os']||'').length/1024),
      docsFoto:Object.keys(window.__nuvem).filter(d=>d.startsWith('mappo_foto__')).length};
  });
  console.log('  ', JSON.stringify(r6));
  assert(r6.recusas===0,'12 ordens com fotos sobem SEM recusa nenhuma');
  assert(r6.docsFoto===48,'as 48 fotos viraram 48 documentos');
  assert(r6.registroKB<30,'o registro das 12 ordens ficou em '+r6.registroKB+' KB');

  console.log('\n=== CHECK 7: foto sozinha maior que o teto nao trava as outras ===');
  const r7=await pg.evaluate(async()=>{
    window.__nuvem={}; window.__recusas=[]; _pend={};
    try{localStorage.removeItem('mappo_fotos_enviadas');}catch(e){}
    setOS([{id:'osX',cliente:'C',tipo:'T',status:'concluida',
      equipamentos:[{fotoEvap:fotoFalsa(1100),fotoCond:fotoFalsa(80)}],checklist:[],assinatura:null}]);
    await _pushOSSemFotos();
    return {registroSubiu:!!window.__nuvem['mappo_os'],
      docsFoto:Object.keys(window.__nuvem).filter(d=>d.startsWith('mappo_foto__')).length};
  });
  assert(r7.registroSubiu===true,'a ordem sobe mesmo com uma foto impossivel');
  assert(r7.docsFoto===1,'a foto boa sobe, a grande demais e deixada de lado com aviso');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
