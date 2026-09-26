const { chromium, devices } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch();
  const ctx=await b.newContext({...devices['iPhone 12'],permissions:['geolocation'],geolocation:{latitude:-17.3,longitude:-48.28}});
  const pg=await ctx.newPage(); const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'}); await pg.waitForTimeout(400);
  await pg.evaluate(()=>{
    session={perfil:'tecnico',nome:'Joao',uid:'u',role:'Tec',workspaceId:'ws'};
    _gravarTourVisto(); entrarApp(); fbReady=true; WORKSPACE='ws'; _avisouSessaoExpirada=true; const s=document.getElementById('splashScreen'); if(s)s.remove();
    osList=[{id:'os1',cliente:'C',endereco:'R',tipo:'Instalacao',tecnico:'Joao',data:'2026-09-24',hora:'08:00',
      status:'pendente',qtdSplits:1,equipamentos:[{marca:'',modelo:'',fotoEvap:null,fotoCond:null}],
      checklist:checklistDoTipo('Instalacao')}];
    abrirExecucao('os1');
  });
  await pg.waitForTimeout(400);

  console.log('\n=== CHECK 1: no inicio, lista o que falta ===');
  const r1=await pg.evaluate(()=>{verificarConcluir();
    const box=document.getElementById('pendConcluir');
    return {visivel:!box.hidden, txt:box.textContent.replace(/\s+/g,' ').trim(), faltas:_pendenciasParaConcluir()};});
  console.log('  ', r1.txt.slice(0,160));
  assert(r1.visivel,'o aviso aparece');
  assert(/check-in/i.test(r1.txt),'diz que falta o check-in');
  assert(r1.faltas.some(f=>/assinatura/i.test(f)),'a assinatura esta na lista de pendencias (fora das 6 exibidas)');
  assert(/Falta \d+ coisas/.test(r1.txt),'diz quantas coisas faltam');

  console.log('\n=== CHECK 2: aponta a FOTO que falta, com o nome do item ===');
  const r2=await pg.evaluate(async()=>{
    execOS.checkinTime='08:10';
    const c=document.createElement('canvas');c.width=300;c.height=300;
    const x=c.getContext('2d');x.fillStyle='#789';x.fillRect(0,0,300,300);
    const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.8));
    const f=new File([blob],'a.jpg',{type:'image/jpeg'});
    execOS.equipamentos[0].fotoEvap=await new Promise(r=>vrfComprimirImagem(f,r));
    execOS.equipamentos[0].fotoCond=await new Promise(r=>vrfComprimirImagem(f,r));
    // marca TODOS menos um, e deixa um sem foto de proposito
    for(let i=0;i<execOS.checklist.length;i++){
      execOS.checklist[i].status='ok';
      execOS.checklist[i].foto=(i===3)?null:'x';
    }
    verificarConcluir();
    return {faltas:_pendenciasParaConcluir(), label:execOS.checklist[3].label,
            txt:document.getElementById('pendConcluir').textContent.replace(/\s+/g,' ').trim()};
  });
  console.log('  ', r2.txt.slice(0,160));
  assert(r2.faltas.some(f=>f.includes(r2.label)),'aponta exatamente o item sem foto: "'+r2.label+'"');
  assert(/Foto de/.test(r2.txt),'e diz que o que falta e a FOTO');

  console.log('\n=== CHECK 3: some quando tudo esta pronto ===');
  const r3=await pg.evaluate(()=>{
    execOS.checklist[3].foto='x'; sigHas=true; verificarConcluir();
    const box=document.getElementById('pendConcluir');
    return {escondido:box.hidden, botao:document.getElementById('btnConcluir').disabled, faltas:_pendenciasParaConcluir().length};
  });
  assert(r3.faltas===0&&r3.escondido===true,'o aviso some quando nao falta nada');
  assert(r3.botao===false,'e o botao Concluir libera');

  console.log('\n=== CHECK 4: lista longa e resumida ===');
  const r4=await pg.evaluate(()=>{
    execOS.checkinTime=null; sigHas=false;
    execOS.equipamentos[0].fotoEvap=null; execOS.equipamentos[0].fotoCond=null;
    execOS.checklist.forEach(c=>{c.status='ok';c.foto=null;});
    verificarConcluir();
    const box=document.getElementById('pendConcluir');
    return {n:_pendenciasParaConcluir().length, itensNaTela:box.querySelectorAll('li').length,
            txt:box.textContent.replace(/\s+/g,' ').trim()};
  });
  console.log('  total', r4.n, '| mostrados', r4.itensNaTela);
  assert(r4.n>6,'ha mais de 6 pendencias');
  assert(r4.itensNaTela===6,'mostra no maximo 6');
  assert(/e mais \d+/.test(r4.txt),'e resume o restante');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
