const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }

// Firestore de mentira, fiel ao que _gravarMesclado espera (transacao inclusa)
function montarFake(){
  window.__nuvem={};
  const doc=(id)=>({__id:id,
    get:async()=>({exists:window.__nuvem[id]!==undefined,data:()=>({json:window.__nuvem[id]})}),
    set:async(d)=>{window.__nuvem[id]=d.json;}
  });
  const col=()=>({doc,
    get:async()=>{const ids=Object.keys(window.__nuvem);
      return {size:ids.length,forEach:f=>ids.forEach(i=>f({id:i,data:()=>({json:window.__nuvem[i]})}))};},
    where:function(){return this;},
    onSnapshot:()=>()=>{}
  });
  fbDB={
    collection:()=>({doc:()=>({collection:col})}),
    runTransaction:async(fn)=>fn({
      get:async(r)=>({exists:window.__nuvem[r.__id]!==undefined,data:()=>({json:window.__nuvem[r.__id]})}),
      set:(r,d)=>{window.__nuvem[r.__id]=d.json;}
    })
  };
  firebase={firestore:{FieldValue:{serverTimestamp:()=>Date.now()},FieldPath:{documentId:()=>'__name__'}}};
  fbReady=true; WORKSPACE='ws'; session={perfil:'tecnico',nome:'T',uid:'u',workspaceId:'ws'};
  // imita o que o interceptador faz numa gravacao real: alem de gravar, atualiza o _snapshot.
  // sem isso o _detectarMudancasNaoVistas acha que TUDO mudou e remarca como pendente.
  window.setFotos=(o)=>{const s=JSON.stringify(o);_quietWrite=true;localStorage.setItem('mappo_vrf_fotos',s);_quietWrite=false;vrfFotos=o;_snapshot['mappo_vrf_fotos']=s;};
  window.getFotos=()=>JSON.parse(localStorage.getItem('mappo_vrf_fotos')||'{}');
  window.contarFotos=(o)=>{let n=0;Object.values(o||{}).forEach(e=>Object.values(e||{}).forEach(a=>n+=(a||[]).length));return n;};
}

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage();
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(300);
  await pg.evaluate(montarFake);

  console.log('\n=== CHECK 1: MIGRACAO — documento antigo vira um documento por andar ===');
  const r1=await pg.evaluate(async()=>{
    window.__nuvem={};
    setFotos({a1:{et1:['f1','f2'],et2:['f3']}, a2:{et1:['f4']}, a3:{et9:['f5','f6','f7']}});
    _pend={};
    await _pushFotosPorAndar();
    const docs=Object.keys(window.__nuvem);
    let total=0; docs.forEach(d=>total+=contarFotos(JSON.parse(window.__nuvem[d])));
    return {docs, total, legadoEscrito:window.__nuvem['mappo_vrf_fotos']!==undefined};
  });
  console.log('  documentos criados:', r1.docs);
  assert(r1.docs.length===3,'criou um documento por andar (3)');
  assert(r1.docs.every(d=>d.startsWith('mappo_fotos_andar__')),'todos com o prefixo de shard');
  assert(r1.total===7,'as 7 fotos foram preservadas na divisao');
  assert(r1.legadoEscrito===false,'o documento ANTIGO nao foi escrito');

  console.log('\n=== CHECK 2: shard que chega NAO apaga os outros andares ===');
  const r2=await pg.evaluate(async()=>{
    setFotos({a1:{et1:['f1']}, a2:{et1:['f4']}});
    _pend={};
    await _aplicarShardFotos(JSON.stringify({a2:{et1:['f4','f5novo']}}));
    const f=getFotos();
    return {a1:!!(f.a1&&f.a1.et1), a2n:(f.a2.et1||[]).length, total:contarFotos(f)};
  });
  assert(r2.a1===true,'o andar a1 continua intacto');
  assert(r2.a2n===2,'o andar a2 recebeu a foto nova');
  assert(r2.total===3,'nenhuma foto sumiu');

  console.log('\n=== CHECK 3: DOIS APARELHOS ao mesmo tempo, andares diferentes ===');
  const r3=await pg.evaluate(async()=>{
    window.__nuvem={}; _pend={};
    setFotos({a1:{et1:['A1']}, a2:{et1:['orig']}});
    _pend={'mappo_vrf_fotos':{['a1'+SEP+'et1']:1}};
    await _pushFotosPorAndar();
    const docB='mappo_fotos_andar__a2';
    window.__nuvem[docB]=JSON.stringify({a2:{et1:['orig','B1']}});
    await _aplicarShardFotos(window.__nuvem[docB]);
    const f=getFotos();
    return {a1:(f.a1.et1||[]).length, a2:(f.a2.et1||[]).length, total:contarFotos(f)};
  });
  console.log('  ->', JSON.stringify(r3));
  assert(r3.a1===1,'a foto do aparelho A continua la');
  assert(r3.a2===2,'a foto do aparelho B chegou');
  assert(r3.total===3,'ninguem sobrescreveu ninguem');

  console.log('\n=== CHECK 4: o que foi lancado AQUI e ainda nao subiu sobrevive ao shard remoto ===');
  const r4=await pg.evaluate(async()=>{
    setFotos({a1:{et1:['remota'],et2:['MINHA-NAO-ENVIADA']}});
    _pend={'mappo_vrf_fotos':{['a1'+SEP+'et2']:1}};
    await _aplicarShardFotos(JSON.stringify({a1:{et1:['remota','outra']}}));
    const f=getFotos();
    return {temMinha:!!(f.a1.et2&&f.a1.et2[0]==='MINHA-NAO-ENVIADA'), et1:(f.a1.et1||[]).length};
  });
  assert(r4.temMinha===true,'a foto local ainda nao enviada NAO foi apagada pela nuvem');
  assert(r4.et1===2,'e a atualizacao da nuvem foi aplicada junto');

  console.log('\n=== CHECK 5: documento ANTIGO e so-aditivo ===');
  const r5=await pg.evaluate(()=>{
    setFotos({a9:{et1:['veio-por-shard']}});
    _pend={};
    _aplicarLegadoFotos(JSON.stringify({a1:{et1:['antiga']}}));
    const f=getFotos();
    return {a9:!!(f.a9&&f.a9.et1), a1:!!(f.a1&&f.a1.et1), total:contarFotos(f)};
  });
  assert(r5.a9===true,'o andar que veio por shard NAO foi apagado pelo documento antigo');
  assert(r5.a1===true,'e a foto do documento antigo foi trazida');
  assert(r5.total===2,'as duas convivem');

  console.log('\n=== CHECK 6: envia SO os andares que mudaram ===');
  const r6=await pg.evaluate(async()=>{
    window.__nuvem={};
    setFotos({a1:{et1:['x']}, a2:{et1:['y']}, a3:{et1:['z']}});
    _pend={'mappo_vrf_fotos':{['a2'+SEP+'et1']:1}};
    await _pushFotosPorAndar();
    return Object.keys(window.__nuvem);
  });
  console.log('  documentos escritos:', r6);
  assert(r6.length===1&&r6[0]==='mappo_fotos_andar__a2','escreveu apenas o documento do andar que mudou');

  console.log('\n=== CHECK 7: apagar foto propaga ===');
  const r7=await pg.evaluate(async()=>{
    window.__nuvem={'mappo_fotos_andar__a1':JSON.stringify({a1:{et1:['vaisumir'],et2:['fica']}})};
    setFotos({a1:{et2:['fica']}});
    _pend={'mappo_vrf_fotos':{['a1'+SEP+'et1']:1}};
    await _pushFotosPorAndar();
    const naNuvem=JSON.parse(window.__nuvem['mappo_fotos_andar__a1']);
    return {temEt1:!!(naNuvem.a1&&naNuvem.a1.et1), temEt2:!!(naNuvem.a1&&naNuvem.a1.et2)};
  });
  assert(r7.temEt1===false,'a foto apagada aqui sumiu da nuvem');
  assert(r7.temEt2===true,'a outra foto do mesmo andar continua');

  console.log('\n=== CHECK 8: pendencia de OUTRO andar nao e limpa ao confirmar um shard ===');
  const r8=await pg.evaluate(async()=>{
    window.__nuvem={};
    setFotos({a1:{et1:['x']}, a2:{et1:['y']}});
    _pend={'mappo_vrf_fotos':{['a1'+SEP+'et1']:1, ['a2'+SEP+'et1']:1}};
    const ref=fbDB.collection().doc().collection().doc('mappo_fotos_andar__a1');
    const local=JSON.parse(localStorage.getItem('mappo_vrf_fotos'));
    const merged=await _gravarMesclado(ref,rj=>JSON.stringify(_mesclarAndar('a1',_obj(rj),_obj(rj)['a1'],local)));
    _confirmarEnvioAndar('a1',merged);
    return {restou:Object.keys((_pend['mappo_vrf_fotos']||{}))};
  });
  console.log('  pendencias restantes:', r8.restou);
  assert(r8.restou.length===1&&r8.restou[0].startsWith('a2'),'a pendencia do a2 continua pendente');

  console.log('');console.log('=== CHECK 9: o andar NAO enche mais -- uma foto, um documento ===');
  const r9=await pg.evaluate(async()=>{
    window.__nuvem={}; _chavesQuaseCheias={}; _falhasEnvio={};
    // um andar com ~850 KB de foto: antes isso levava o documento do andar a ~81% do teto
    const foto='data:image/jpeg;base64,'+'z'.repeat(850000);
    setFotos({aGrande:{et1:[foto]}, aPequeno:{et1:['data:image/jpeg;base64,ok']}});
    _pend={};
    try{localStorage.removeItem('mappo_fotos_enviadas');localStorage.removeItem('mappo_fotos_migr');}catch(e){}
    await _pushFotosPorAndar();
    const el=document.getElementById('syncAlerta');
    const docGrande=window.__nuvem[_docDoAndar('aGrande')]||'';
    return {avisos:Object.keys(_chavesQuaseCheias).length,
            classe:el.className,
            andarGrandeKB:Math.round(docGrande.length/1024),
            docsDeFoto:Object.keys(window.__nuvem).filter(d=>d.indexOf(FOTO_OBRA_PREFIXO)===0).length};
  });
  console.log('  ', JSON.stringify(r9));
  assert(r9.andarGrandeKB<5,'o documento do andar fica em '+r9.andarGrandeKB+' KB mesmo com 850 KB de foto');
  assert(r9.docsDeFoto===2,'as fotos foram pra documentos proprios');
  assert(r9.avisos===0,'nenhum aviso de andar quase cheio -- o teto por andar deixou de existir');
  assert(!/aviso/.test(r9.classe),'e a faixa amarela nao acende a toa');

  console.log('\n=== CHECK 10: nada disso mexeu nas outras chaves ===');
  const r10=await pg.evaluate(async()=>{
    window.__nuvem={}; _pend={}; _chavesQuaseCheias={}; _atualizarAlertaSync();
    _quietWrite=true;localStorage.setItem('mappo_clientes',JSON.stringify([{nome:'C'}]));_quietWrite=false;
    await _doPush('mappo_clientes');
    return {doc:window.__nuvem['mappo_clientes'], shards:Object.keys(window.__nuvem).filter(k=>k.startsWith('mappo_fotos_andar__')).length};
  });
  assert(!!r10.doc,'chave normal continua indo pro seu proprio documento');
  assert(r10.shards===0,'e nao criou shard nenhum a toa');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS DA ETAPA B PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
