/* Armazem de fotos no IndexedDB + a linha de espaco DO APARELHO, que e o teto que trava o
   tecnico em campo (~5 MB de localStorage) e que nenhuma tela mostrava. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
const linha=()=>console.log('');

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:390,height:844}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);

  linha();console.log('=== CHECK 1: guarda e devolve a foto inteira, byte a byte ===');
  const r1=await pg.evaluate(async()=>{
    const uri='data:image/jpeg;base64,'+'Q'.repeat(200*1024);
    await idbGravarFoto('f1',uri);
    const volta=await idbLerFoto('f1');
    return {igual:volta===uri, tamanho:volta?volta.length:0};
  });
  console.log('  ', JSON.stringify(r1));
  assert(r1.igual===true,'a foto volta identica (200 KB)');

  linha();console.log('=== CHECK 2: MUITO mais que o localStorage aguenta ===');
  const r2=await pg.evaluate(async()=>{
    // 40 fotos de 200 KB = 8 MB, bem acima dos ~5 MB do localStorage
    for(let i=0;i<40;i++)await idbGravarFoto('g'+i,'data:image/jpeg;base64,'+'Z'.repeat(200*1024));
    const chaves=await idbTodasAsChaves();
    const uma=await idbLerFoto('g39');
    return {quantas:chaves.length, ultimaOk:!!uma&&uma.length>200000};
  });
  console.log('  ', JSON.stringify(r2));
  assert(r2.quantas>=41,'guardou 8 MB de fotos sem reclamar (localStorage nao aguentaria)');
  assert(r2.ultimaOk===true,'e a ultima continua legivel');

  linha();console.log('=== CHECK 3: o mesmo volume ESTOURA o localStorage (o teto de hoje) ===');
  const r3=await pg.evaluate(()=>{
    try{
      for(let i=0;i<40;i++)localStorage.setItem('__t'+i,'Z'.repeat(200*1024));
      return {estourou:false};
    }catch(e){return {estourou:true, nome:e.name};}
    finally{for(let i=0;i<40;i++){try{localStorage.removeItem('__t'+i);}catch(e){}}}
  });
  console.log('  ', JSON.stringify(r3));
  assert(r3.estourou===true,'o localStorage estoura no mesmo volume — e o teto que trava o tecnico');

  linha();console.log('=== CHECK 4: apagar libera ===');
  const r4=await pg.evaluate(async()=>{
    await idbApagarFoto('f1');
    const sumiu=await idbLerFoto('f1');
    return {sumiu:sumiu===undefined};
  });
  assert(r4.sumiu===true,'foto apagada some de verdade');

  linha();console.log('=== CHECK 5: a tela mostra o espaco DO APARELHO ===');
  const r5=await pg.evaluate(async()=>{
    session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
    fbReady=true; WORKSPACE='ws'; _avisouSessaoExpirada=true;
    _gravarTourVisto(); entrarApp();
    const s=document.getElementById('splashScreen'); if(s)s.remove();
    _quietWrite=true;localStorage.setItem('mappo_os',JSON.stringify([{id:'x',foto:'A'.repeat(1500*1024)}]));_quietWrite=false;
    nav('config');
    await new Promise(r=>setTimeout(r,900));
    const el=document.getElementById('diagAparelho');
    return {existe:!!el, txt:el?el.textContent.replace(/\s+/g,' ').trim():''};
  });
  console.log('  ', r5.txt.slice(0,160));
  assert(r5.existe===true,'a tela tem o bloco de espaco do aparelho');
  assert(/MB|KB/.test(r5.txt),'e mostra um numero de verdade');
  assert(/%/.test(r5.txt),'com a porcentagem do teto do aparelho');

  linha();console.log('=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  linha();console.log('TODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error(e.message);process.exit(1);});
