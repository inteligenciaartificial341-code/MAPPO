/* Reproduz o fluxo do tecnico ate o botao Concluir: check-in -> fotos -> checklist ->
   assinatura, verificando POR ETAPA o que ainda bloqueia. */
const { chromium, devices } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch();
  const ctx=await b.newContext({...devices['iPhone 12'], permissions:['geolocation'], geolocation:{latitude:-17.30,longitude:-48.28}});
  const pg=await ctx.newPage();
  pg.on('pageerror',e=>console.log('PAGEERROR:',e.message));
  pg.on('console',m=>{if(m.type()==='error')console.log('CONSOLE-ERR:',m.text().slice(0,120));});
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);

  await pg.evaluate(()=>{
    session={perfil:'tecnico',nome:'Joao da Silva',uid:'uid-tec',role:'Técnico de Campo',workspaceId:'ws'};
    _gravarTourVisto(); entrarApp(); fbReady=true; WORKSPACE='ws'; _avisouSessaoExpirada=true;
    const s=document.getElementById('splashScreen'); if(s)s.remove();
    tecnicos=[{id:'t1',nome:'Joao da Silva',uid:'uid-tec',ativo:true,modulos:{split:true,vrfObras:[]}}];
    osList=[{id:'os1',cliente:'Cliente Teste',endereco:'Rua A, 100',tipo:'Instalacao',tecnico:'Joao da Silva',
             data:'2026-09-24',hora:'08:00',status:'pendente',qtdSplits:1,obs:'',notaGestor:'',
             equipamentos:[{marca:'',modelo:'',fotoEvap:null,fotoCond:null}],
             checklist:checklistDoTipo('Instalacao')}];
    abrirExecucao('os1');
  });
  await pg.waitForTimeout(400);

  const estado=async(rotulo)=>{
    const e=await pg.evaluate(()=>{
      const btn=document.getElementById('btnConcluir');
      const os=execOS;
      if(!os)return {semExecOS:true};
      const criticos=os.checklist.filter(c=>c.critico);
      return {
        botaoExiste:!!btn, desabilitado:btn?btn.disabled:null,
        checkin:!!os.checkinTime,
        equipOk:(os.equipamentos||[]).every(x=>x.fotoEvap&&x.fotoCond),
        criticosOk:criticos.every(c=>(c.status==='ok'||c.status==='nok')&&c.foto),
        criticosFaltando:criticos.filter(c=>!((c.status==='ok'||c.status==='nok')&&c.foto)).map(c=>c.id),
        todasFotosOk:os.checklist.every(c=>c.status==='pending'||c.foto),
        assinatura:typeof sigHas!=='undefined'?sigHas:'?',
        totalChecklist:os.checklist.length, criticos:criticos.length
      };
    });
    console.log(rotulo.padEnd(26), JSON.stringify(e));
    return e;
  };

  console.log('\n--- estado inicial ---');
  await estado('recem aberto');

  // 1. check-in
  await pg.evaluate(()=>execCheckin());
  await pg.waitForTimeout(1200);
  await estado('apos check-in');

  // 2. fotos dos equipamentos (injeta direto, como o onEquipFoto faria)
  await pg.evaluate(async()=>{
    const c=document.createElement('canvas');c.width=600;c.height=600;
    const x=c.getContext('2d');x.fillStyle='#789';x.fillRect(0,0,600,600);
    const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.8));
    const f=new File([blob],'a.jpg',{type:'image/jpeg'});
    const comp=()=>new Promise(r=>vrfComprimirImagem(f,r));
    execOS.equipamentos[0].fotoEvap=await comp();
    execOS.equipamentos[0].fotoCond=await comp();
    saveExecOS(); verificarConcluir();
  });
  await pg.waitForTimeout(600);
  await estado('apos fotos equipamento');

  // 3. checklist: marca todos e poe foto
  await pg.evaluate(async()=>{
    const c=document.createElement('canvas');c.width=400;c.height=400;
    const x=c.getContext('2d');x.fillStyle='#456';x.fillRect(0,0,400,400);
    const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.8));
    const f=new File([blob],'b.jpg',{type:'image/jpeg'});
    for(let i=0;i<execOS.checklist.length;i++){
      execOS.checklist[i].status='ok';
      execOS.checklist[i].foto=await new Promise(r=>vrfComprimirImagem(f,r));
    }
    saveExecOS(); renderChecklistExec(); verificarConcluir();
  });
  await pg.waitForTimeout(900);
  await estado('apos checklist');

  // 4. assinatura: desenha de verdade no canvas
  const cv=await pg.$('#sigCanvas');
  if(cv){
    await cv.scrollIntoViewIfNeeded();
    await pg.waitForTimeout(250);
    const box=await cv.boundingBox();
    await pg.mouse.move(box.x+20,box.y+box.height/2);
    await pg.mouse.down();
    for(let i=1;i<=10;i++) await pg.mouse.move(box.x+20+i*(box.width-40)/10, box.y+box.height/2+(i%2?-12:12));
    await pg.mouse.up();
    await pg.waitForTimeout(250);
  } else console.log('!! canvas de assinatura NAO encontrado');
  const fim=await estado('apos assinatura');

  if(fim.botaoExiste && fim.desabilitado===false){
    await pg.evaluate(()=>execConcluir());
    await pg.waitForTimeout(600);
    const dep=await pg.evaluate(()=>({status:osList[0].status,assinatura:!!osList[0].assinatura,
      checkout:osList[0].checkoutTime||null}));
    console.log('\nCONCLUSAO ->', JSON.stringify(dep));
    console.log(dep.status==='concluida' ? 'OK: a OS foi concluida.' : 'FALHOU: a OS nao ficou concluida.');
  } else {
    console.log('\nFALHOU: o botao Concluir continua desabilitado.');
  }

  await pg.screenshot({path:'diag-concluir.png'});
  await b.close(); srv.close();
})();
