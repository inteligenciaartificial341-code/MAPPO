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
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(300);

  console.log('\n=== CHECK 1: pub_ nao e mais gravado no aparelho ===');
  const r1=await pg.evaluate(()=>{
    fbApply('pub_abc123', JSON.stringify({fotos:['x'.repeat(50000)]}), Date.now());
    return localStorage.getItem('pub_abc123');
  });
  assert(r1===null,'documento de link público NÃO é mais gravado no localStorage');

  console.log('\n=== CHECK 2: chave de sync legitima continua funcionando (sem regressao) ===');
  const r2=await pg.evaluate(()=>{
    localStorage.removeItem('mappo_clientes');
    fbApply('mappo_clientes', JSON.stringify([{nome:'Cliente Real'}]), Date.now());
    return localStorage.getItem('mappo_clientes');
  });
  assert(r2&&r2.includes('Cliente Real'),'dado legítimo continua sendo aplicado normalmente');

  console.log('\n=== CHECK 3: limpeza devolve o espaco ja ocupado ===');
  const r3=await pg.evaluate(()=>{
    localStorage.setItem('pub_antigo1','y'.repeat(120000));
    localStorage.setItem('pub_antigo2','y'.repeat(80000));
    const antes=Object.keys(localStorage).filter(k=>k.startsWith('pub_')).length;
    _limparPubVazados();
    const depois=Object.keys(localStorage).filter(k=>k.startsWith('pub_')).length;
    const log=_fbLogs[_fbLogs.length-1].msg;
    return {antes,depois,log,clientesIntacto:!!localStorage.getItem('mappo_clientes')};
  });
  console.log('  ', r3.log);
  assert(r3.antes===2,'havia 2 chaves pub_ guardadas');
  assert(r3.depois===0,'a limpeza removeu todas');
  assert(/195 KB|19[0-9] KB/.test(r3.log),'o log informa quanto espaço foi devolvido');
  assert(r3.clientesIntacto===true,'a limpeza NÃO tocou nos dados reais do app');

  console.log('\n=== CHECK 4: fbPullAll ignora pub_ mas aplica o resto ===');
  const r4=await pg.evaluate(async()=>{
    fbReady=true; WORKSPACE='ws';
    localStorage.removeItem('mappo_manut');
    const docs=[
      {id:'mappo_manut', data:()=>({json:JSON.stringify([{id:'m1'}]),updatedAt:Date.now()})},
      {id:'pub_zzz',     data:()=>({json:JSON.stringify({fotos:['z'.repeat(9000)]}),updatedAt:Date.now()})},
      {id:'lixo_qualquer', data:()=>({json:'{"a":1}',updatedAt:Date.now()})}
    ];
    fbDB={collection:()=>({doc:()=>({collection:()=>({get:async()=>({size:docs.length,forEach:f=>docs.forEach(f)})})})})};
    await fbPullAll();
    return {manut:!!localStorage.getItem('mappo_manut'), pub:!!localStorage.getItem('pub_zzz'),
            lixo:!!localStorage.getItem('lixo_qualquer'), log:_fbLogs[_fbLogs.length-1].msg};
  });
  console.log('  ', r4.log);
  assert(r4.manut===true,'documento legítimo foi aplicado');
  assert(r4.pub===false,'pub_ foi ignorado no pull');
  assert(r4.lixo===false,'documento desconhecido foi ignorado');
  assert(/1 de 3/.test(r4.log),'o log mostra quantos de quantos foram aplicados');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de página');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
