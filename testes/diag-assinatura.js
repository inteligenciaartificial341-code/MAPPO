const { chromium, devices } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch();
  const ctx=await b.newContext({...devices['iPhone 12']});
  const pg=await ctx.newPage();
  pg.on('pageerror',e=>console.log('PAGEERROR:',e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);
  await pg.evaluate(()=>{
    session={perfil:'tecnico',nome:'Joao',uid:'u',role:'Tec',workspaceId:'ws'};
    _gravarTourVisto();entrarApp();const s=document.getElementById('splashScreen');if(s)s.remove();
    osList=[{id:'os1',cliente:'C',endereco:'R',tipo:'Instalacao',tecnico:'Joao',data:'2026-09-24',hora:'08:00',
      status:'andamento',qtdSplits:1,checkinTime:'08:10',
      equipamentos:[{marca:'',modelo:'',fotoEvap:'x',fotoCond:'x'}],
      checklist:checklistDoTipo('Instalacao').map(c=>({...c,status:'ok',foto:'x'}))}];
    abrirExecucao('os1');
  });
  await pg.waitForTimeout(600);

  const info=await pg.evaluate(()=>{
    const cv=document.getElementById('sigCanvas');
    if(!cv)return {semCanvas:true};
    const r=cv.getBoundingClientRect(), cs=getComputedStyle(cv);
    const noPonto=document.elementFromPoint(Math.round(r.left+r.width/2),Math.round(r.top+r.height/2));
    return {rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},
      bitmap:{w:cv.width,h:cv.height},
      handlers:{down:!!cv.onmousedown,move:!!cv.onmousemove,tstart:!!cv.ontouchstart,tmove:!!cv.ontouchmove},
      touchAction:cs.touchAction, pointerEvents:cs.pointerEvents,
      noPonto:noPonto?(noPonto.id||noPonto.tagName+'.'+(typeof noPonto.className==='string'?noPonto.className.split(' ')[0]:'')):null,
      sigHas};
  });
  console.log('canvas:', JSON.stringify(info));
  if(info.semCanvas){await b.close();srv.close();return;}

  const r=info.rect;
  console.log('\n-- arrasto com TOQUE (como o tecnico assina) --');
  const res=await pg.evaluate(({x,y,w,h})=>{
    const cv=document.getElementById('sigCanvas');
    const mk=(cx,cy)=>new Touch({identifier:1,target:cv,clientX:cx,clientY:cy,pageX:cx,pageY:cy});
    const ev=(tipo,cx,cy)=>cv.dispatchEvent(new TouchEvent(tipo,{bubbles:true,cancelable:true,
      touches:tipo==='touchend'?[]:[mk(cx,cy)],changedTouches:[mk(cx,cy)],targetTouches:tipo==='touchend'?[]:[mk(cx,cy)]}));
    ev('touchstart',x+20,y+h/2);
    for(let i=1;i<=8;i++)ev('touchmove',x+20+i*(w-40)/8,y+h/2+(i%2?-10:10));
    ev('touchend',x+w-20,y+h/2);
    return {sigHas, sigDraw, botao:document.getElementById('btnConcluir').disabled};
  },r);
  console.log('  ->', JSON.stringify(res));

  console.log('\n-- arrasto com MOUSE --');
  await pg.mouse.move(r.x+20, r.y+r.h/2);
  await pg.mouse.down();
  for(let i=1;i<=8;i++) await pg.mouse.move(r.x+20+i*(r.w-40)/8, r.y+r.h/2+(i%2?-10:10));
  await pg.mouse.up();
  await pg.waitForTimeout(200);
  console.log('  ->', JSON.stringify(await pg.evaluate(()=>({sigHas,botao:document.getElementById('btnConcluir').disabled}))));

  await b.close(); srv.close();
})();
