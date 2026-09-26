const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1300,height:900}});
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(300);
  await pg.evaluate(async()=>{
    // ETIQUETA realista: foto de celular de uma placa de dados, levemente inclinada,
    // com brilho e ruido -- o caso que de fato precisa sobreviver a compressao
    const W=3024,H=4032;
    const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
    x.fillStyle='#6d7478';x.fillRect(0,0,W,H);
    x.save();x.translate(W/2,H/2);x.rotate(-0.04);x.translate(-W/2,-H/2);
    x.fillStyle='#e9e6de';x.fillRect(W*0.12,H*0.30,W*0.76,H*0.36);
    x.fillStyle='#111';x.font='bold 96px Arial';x.fillText('LG ELECTRONICS',W*0.16,H*0.36);
    x.font='60px Arial';
    const linhas=['MODEL: S4-W12JA3AA','SERIAL: 411TAKR9D274','CAPACITY: 12.000 BTU/h','REFRIGERANT: R-410A  0,86kg','VOLTAGE: 220V~ 60Hz','POWER INPUT: 1.130 W'];
    linhas.forEach((t,i)=>x.fillText(t,W*0.16,H*0.41+i*82));
    x.strokeStyle='#111';x.lineWidth=4;x.strokeRect(W*0.12,H*0.30,W*0.76,H*0.36);
    // codigo de barras
    for(let i=0,px=W*0.16;i<70;i++){const w=2+Math.random()*10;x.fillStyle=i%2?'#fff':'#111';x.fillRect(px,H*0.58,w,90);px+=w;}
    x.restore();
    const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'rgba(255,255,255,.22)');g.addColorStop(.5,'rgba(255,255,255,0)');
    x.fillStyle=g;x.fillRect(0,0,W,H);
    const im=x.getImageData(0,0,W,H),d=im.data;
    for(let k=0;k<d.length;k+=4){const n=((Math.random()-0.5)*26)|0;d[k]+=n;d[k+1]+=n;d[k+2]+=n;}x.putImageData(im,0,0);
    const blob=await new Promise(res=>c.toBlob(res,'image/jpeg',0.93));
    window.__bmp=await createImageBitmap(blob);
  });
  const combos=[['atual-1024-060',1024,0.6],['900-050',900,0.5],['800-050',800,0.5],['800-045',800,0.45]];
  for(const [nome,mw,q] of combos){
    await pg.evaluate(async([mw,q])=>{
      const bmp=window.__bmp;const s=Math.min(1,mw/bmp.width);
      const cv=document.createElement('canvas');cv.width=bmp.width*s;cv.height=bmp.height*s;
      const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);
      cx.drawImage(bmp,0,0,cv.width,cv.height);
      const uri=cv.toDataURL('image/jpeg',q);
      window.__kb=(uri.length/1024).toFixed(1);
      // recorta a area do texto em tamanho REAL (sem ampliar) pra julgar legibilidade
      const im=new Image();await new Promise(r=>{im.onload=r;im.src=uri;});
      const rec=document.createElement('canvas');rec.width=520;rec.height=300;
      rec.getContext('2d').drawImage(im, im.width*0.14, im.height*0.33, 520, 300, 0,0,520,300);
      document.body.innerHTML='';document.body.style.background='#fff';
      const wrap=document.createElement('div');wrap.style.cssText='padding:10px;font:13px system-ui';
      wrap.appendChild(rec);document.body.appendChild(wrap);
    },[mw,q]);
    const kb=await pg.evaluate(()=>window.__kb);
    await pg.locator('canvas').screenshot({path:'etiq-'+nome+'.png'});
    console.log(nome.padEnd(16)+kb+' KB');
  }
  await b.close(); srv.close();
})();
