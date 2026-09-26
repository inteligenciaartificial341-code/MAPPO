const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage();
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(300);
  const r=await pg.evaluate(()=>{
    // simula exatamente o que fbPullAll faz com um documento pub_ vindo da nuvem
    const antes=Object.keys(localStorage).filter(k=>k.startsWith('pub_'));
    fbApply('pub_abc123', JSON.stringify({os:{cliente:'X'},fotos:['data:image/jpeg;base64,'+'z'.repeat(50000)]}), Date.now());
    const depois=Object.keys(localStorage).filter(k=>k.startsWith('pub_'));
    const gravado=localStorage.getItem('pub_abc123');
    return {antes:antes.length, depois:depois.length, bytesGravados:gravado?gravado.length:0};
  });
  console.log('chaves pub_ no localStorage antes :', r.antes);
  console.log('chaves pub_ no localStorage depois:', r.depois);
  console.log('bytes gravados no aparelho        :', r.bytesGravados);
  console.log(r.bytesGravados>0
    ? '>>> CONFIRMADO: documento de link publico e gravado no aparelho de todo mundo'
    : '>>> nao reproduz');
  await b.close(); srv.close();
})();
