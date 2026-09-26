const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage();
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(300);

  console.log('\n=== CHECK 1: foto passa pela funcao REAL do app e encolhe ===');
  const r1=await pg.evaluate(async()=>{
    const c=document.createElement('canvas');c.width=3024;c.height=4032;const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,3024,4032);g.addColorStop(0,'#cdd6da');g.addColorStop(1,'#7d8b91');
    x.fillStyle=g;x.fillRect(0,0,3024,4032);
    for(let i=0;i<40;i++){x.strokeStyle='rgba(60,70,75,.5)';x.lineWidth=3;x.beginPath();x.moveTo(600,1000+i*8);x.lineTo(2400,1000+i*8);x.stroke();}
    const im=x.getImageData(0,0,3024,4032),d=im.data;
    for(let k=0;k<d.length;k+=4){const n=((Math.random()-0.5)*34)|0;d[k]+=n;d[k+1]+=n;d[k+2]+=n;}x.putImageData(im,0,0);
    const blob=await new Promise(res=>c.toBlob(res,'image/jpeg',0.92));
    const file=new File([blob],'f.jpg',{type:'image/jpeg'});
    const uri=await new Promise(res=>vrfComprimirImagem(file,res));
    const img=new Image(); await new Promise(res=>{img.onload=res;img.src=uri;});
    return {kb:+(uri.length/1024).toFixed(1), w:img.width, h:img.height, tipo:uri.slice(0,22)};
  });
  console.log('  ->', JSON.stringify(r1));
  assert(r1.w===800,'largura final é 800px (era 1024)');
  assert(/^data:image\/jpeg/.test(r1.tipo),'saída continua JPEG');
  assert(r1.kb<90,'peso bem abaixo do que era antes (ficou '+r1.kb+' KB)');

  console.log('\n=== CHECK 2: imagem TRANSPARENTE nao vira preta (bug corrigido junto) ===');
  const r2=await pg.evaluate(async()=>{
    const c=document.createElement('canvas');c.width=900;c.height=900;const x=c.getContext('2d');
    x.clearRect(0,0,900,900);                       // 100% transparente
    x.fillStyle='#000';x.font='bold 120px Arial';x.fillText('TESTE',120,480);  // texto preto
    const blob=await new Promise(res=>c.toBlob(res,'image/png'));
    const file=new File([blob],'t.png',{type:'image/png'});
    const uri=await new Promise(res=>vrfComprimirImagem(file,res));
    const img=new Image();await new Promise(res=>{img.onload=res;img.src=uri;});
    const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;
    const cx=cv.getContext('2d');cx.drawImage(img,0,0);
    const p=cx.getImageData(5,5,1,1).data;          // canto, onde era transparente
    return {r:p[0],g:p[1],b:p[2]};
  });
  console.log('  cor do canto (era transparente):', JSON.stringify(r2));
  assert(r2.r>235&&r2.g>235&&r2.b>235,'fundo transparente virou BRANCO (antes virava preto)');

  console.log('\n=== CHECK 3: assinatura comprimida ===');
  const r3=await pg.evaluate(()=>{
    const cv=document.createElement('canvas');cv.width=1500;cv.height=375;   // canvas 3x de celular
    const x=cv.getContext('2d');x.strokeStyle='#000';x.lineWidth=5;x.beginPath();
    for(let i=0;i<1500;i+=7)x.lineTo(i,187+Math.sin(i/11)*80);x.stroke();    // transparente, como o real
    const png=cv.toDataURL();
    const novo=_assinaturaComprimida(cv);
    return {pngKB:+(png.length/1024).toFixed(1), novoKB:+(novo.length/1024).toFixed(1), tipo:novo.slice(0,22)};
  });
  console.log('  ->', JSON.stringify(r3));
  assert(/^data:image\/jpeg/.test(r3.tipo),'assinatura agora é JPEG');
  assert(r3.novoKB < r3.pngKB*0.5,'assinatura caiu mais da metade ('+r3.pngKB+' KB -> '+r3.novoKB+' KB)');

  console.log('\n=== CHECK 4: assinatura nao fica preta e continua visivel ===');
  const r4=await pg.evaluate(async()=>{
    const cv=document.createElement('canvas');cv.width=1200;cv.height=300;
    const x=cv.getContext('2d');x.strokeStyle='#000';x.lineWidth=6;x.beginPath();
    x.moveTo(50,150);x.lineTo(1150,150);x.stroke();
    const uri=_assinaturaComprimida(cv);
    const img=new Image();await new Promise(r=>{img.onload=r;img.src=uri;});
    const c2=document.createElement('canvas');c2.width=img.width;c2.height=img.height;
    const cx=c2.getContext('2d');cx.drawImage(img,0,0);
    const fundo=cx.getImageData(5,5,1,1).data;                       // canto
    const traco=cx.getImageData(Math.round(img.width/2),Math.round(img.height/2),1,1).data;  // no traço
    return {fundo:[fundo[0],fundo[1],fundo[2]], traco:[traco[0],traco[1],traco[2]]};
  });
  console.log('  fundo:',r4.fundo,' traço:',r4.traco);
  assert(r4.fundo[0]>235,'fundo da assinatura é branco');
  assert(r4.traco[0]<120,'o traço da assinatura continua escuro e visível');

  console.log('\n=== CHECK 5: se algo falhar, a assinatura NAO se perde ===');
  const r5=await pg.evaluate(()=>{
    const falso={width:100,height:50,toDataURL:()=>'data:image/png;base64,SALVO'};
    return _assinaturaComprimida(falso);   // getContext ausente -> cai no catch
  });
  assert(/SALVO/.test(r5),'no erro, devolve o PNG original em vez de perder a assinatura');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de página');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
