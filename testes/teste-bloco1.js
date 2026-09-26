const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1280,height:900}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(300);
  await pg.evaluate(()=>{
    session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
    _gravarTourVisto(); entrarApp();
    const s=document.getElementById('splashScreen'); if(s)s.remove();
  });
  await pg.waitForTimeout(200);

  console.log('\n=== ITEM 3: valor monetario brasileiro ===');
  const money=await pg.evaluate(()=>{
    const casos=['1.234,56','1234,56','1234.56','1.50','1.234','12.500','1.234.567','R$ 1.234,56','0,99','10','abc','-5','',' 2.000 '];
    const out={}; casos.forEach(c=>{const v=_parseMoeda(c); out[c===''?'(vazio)':c]=(v===null?'null':(isNaN(v)?'NaN':v));});
    return out;
  });
  console.table(money);
  assert(money['1.234,56']===1234.56,'"1.234,56" agora vale 1234.56 (antes virava 1.23)');
  assert(money['R$ 1.234,56']===1234.56,'aceita o "R$ " colado junto');
  assert(money['1234,56']===1234.56,'"1234,56" continua certo');
  assert(money['1234.56']===1234.56,'"1234.56" (estilo americano) continua certo');
  assert(money['1.50']===1.5,'"1.50" continua sendo um e cinquenta');
  assert(money['1.234']===1234,'"1.234" lido como mil duzentos e trinta e quatro');
  assert(money['12.500']===12500,'"12.500" lido como doze mil e quinhentos');
  assert(money['1.234.567']===1234567,'milhar duplo funciona');
  assert(money['0,99']===0.99,'centavos sozinhos funcionam');
  assert(money['abc']==='NaN','texto invalido vira NaN (nao e salvo)');
  assert(money['-5']==='NaN','negativo vira NaN');
  assert(money['(vazio)']==='null','vazio continua sendo limpeza intencional');

  console.log('\n=== ITEM 1: arquivo grande e recusado antes de ler ===');
  const grande=await pg.evaluate(async()=>{
    const fake={size:40*1024*1024,type:'image/jpeg',name:'g.jpg'};
    let chamouCb=false;
    vrfComprimirImagem(fake,()=>{chamouCb=true;});
    await new Promise(r=>setTimeout(r,120));
    return {chamouCb, toast:document.getElementById('toast').textContent, travou:_fotoEmProcessamento};
  });
  console.log('  ', grande.toast);
  assert(grande.chamouCb===false,'arquivo de 40 MB nao e processado');
  assert(/muito grande/i.test(grande.toast),'avisa o usuario com o tamanho');
  assert(grande.travou===false,'e nao deixa a trava presa');

  console.log('\n=== ITEM 2: duas compressoes ao mesmo tempo ===');
  const duplo=await pg.evaluate(async()=>{
    const c=document.createElement('canvas');c.width=900;c.height=900;
    const x=c.getContext('2d');x.fillStyle='#789';x.fillRect(0,0,900,900);
    const blob=await new Promise(res=>c.toBlob(res,'image/jpeg',0.9));
    const f=new File([blob],'a.jpg',{type:'image/jpeg'});
    let n=0;
    vrfComprimirImagem(f,()=>{n++;});
    vrfComprimirImagem(f,()=>{n++;});          // segundo toque, imediato
    const toastNoMomento=document.getElementById('toast').textContent;
    await new Promise(r=>setTimeout(r,500));
    // depois que terminou, uma nova foto deve funcionar normalmente
    let depois=false;
    vrfComprimirImagem(f,()=>{depois=true;});
    await new Promise(r=>setTimeout(r,500));
    return {n, toastNoMomento, depois, travaLivre:_fotoEmProcessamento===false};
  });
  console.log('  callbacks no toque duplo:', duplo.n, '| aviso:', duplo.toastNoMomento);
  assert(duplo.n===1,'so UMA compressao rodou no toque duplo');
  assert(/aguarde/i.test(duplo.toastNoMomento),'o segundo toque avisa para aguardar');
  assert(duplo.depois===true,'depois de terminar, a proxima foto funciona normalmente');
  assert(duplo.travaLivre===true,'a trava foi liberada no final');

  console.log('\n=== ITEM 4: renomear tecnico arrasta as TAREFAS ===');
  const ren=await pg.evaluate(()=>{
    tarefas=[{id:'t1',nome:'Limpeza',tecnico:'Joao Antigo'},{id:'t2',nome:'Outra',tecnico:'Maria'}];
    osList=[{id:'o1',tecnico:'Joao Antigo',data:'2026-09-01',valor:10}];
    manutencoes=[{id:'m1',tecnico:'Joao Antigo'}];
    avataresTecnicos={'Joao Antigo':'capacete'};
    _renomearTecnicoEmDados('Joao Antigo','Joao Novo');
    return {tarefa:tarefas[0].tecnico, outra:tarefas[1].tecnico, os:osList[0].tecnico,
            manut:manutencoes[0].tecnico, avatarNovo:avataresTecnicos['Joao Novo'],
            avatarAntigo:avataresTecnicos['Joao Antigo']};
  });
  console.log('  ->', JSON.stringify(ren));
  assert(ren.tarefa==='Joao Novo','a TAREFA acompanhou o novo nome (era o bug)');
  assert(ren.outra==='Maria','tarefa de outra pessoa nao foi tocada');
  assert(ren.os==='Joao Novo'&&ren.manut==='Joao Novo','OS e manutencao continuam sendo migradas');
  assert(ren.avatarNovo==='capacete'&&ren.avatarAntigo===undefined,'avatar migrou junto');

  console.log('\n=== ITEM 5: excluir nota de adiantamento ===');
  const nota=await pg.evaluate(()=>{
    financeiroNotas=[
      {prestador:'Joao',valor:100,data:'2026-09-10',hora:'10:00',obs:'erro de digitacao'},
      {prestador:'Maria',valor:50,data:'2026-09-11',hora:'11:00',obs:'ok'}
    ];
    window.confirm=()=>true;
    financeiroPeriodo='todos';
    removerNotaFinanceira('2026-09-10','10:00','Joao',100);
    const visiveis=financeiroNotas.filter(n=>!n.removida);
    return {noArray:financeiroNotas.length, visiveis:visiveis.length,
            marcada:!!financeiroNotas[0].removida, quem:financeiroNotas[0].removidaPor,
            sobrou:visiveis[0]&&visiveis[0].prestador};
  });
  console.log('  ->', JSON.stringify(nota));
  assert(nota.noArray===2,'a nota NAO foi removida do array (voltaria no merge se fosse)');
  assert(nota.marcada===true,'foi marcada como removida');
  assert(nota.quem==='Paulo','registra quem excluiu');
  assert(nota.visiveis===1&&nota.sobrou==='Maria','some da tela e a outra fica');

  console.log('\n=== ITEM 6: filtro de periodo ===');
  const per=await pg.evaluate(()=>{
    const hoje=new Date();
    const iso=d=>d.toISOString().split('T')[0];
    const ontem=new Date(hoje); ontem.setDate(hoje.getDate()-1);
    const velho=new Date(hoje); velho.setDate(hoje.getDate()-200);
    osList=[
      {id:'a',tecnico:'Joao',tipo:'Instalacao',data:iso(ontem),valor:100,valorStatus:'pago'},
      {id:'b',tecnico:'Joao',tipo:'Instalacao',data:iso(velho),valor:900,valorStatus:'pago'}
    ];
    financeiroNotas=[{prestador:'Joao',valor:7,data:iso(velho),hora:'09:00'}];
    const soma=()=>{const r=financeiroResumo();let t=0;
      Object.values(r).forEach(p=>Object.values(p).forEach(g=>t+=g.total));return t;};
    financeiroPeriodo='todos'; const todos=soma();
    financeiroPeriodo='30';    const trinta=soma();
    const notas30=financeiroNotas.filter(n=>!n.removida&&_dentroDoPeriodo(n.data)).length;
    financeiroPeriodo='ano';   const ano=soma();
    financeiroPeriodo='todos';
    return {todos,trinta,ano,notas30};
  });
  console.log('  ->', JSON.stringify(per));
  assert(per.todos===1000,'sem filtro soma tudo');
  assert(per.trinta===100,'ultimos 30 dias ignora a OS antiga');
  assert(per.notas30===0,'o filtro tambem vale para as notas de adiantamento');
  assert(per.ano>=100,'filtro por ano funciona');

  console.log('\n=== ITEM 6b: tela vazia por filtro nao mente ===');
  const vazio=await pg.evaluate(()=>{
    osList=[{id:'z',tecnico:'J',tipo:'X',data:'2020-01-01',valor:5}];
    financeiroPeriodo='30';
    const h=renderFinanceiroHierarquia();
    financeiroPeriodo='todos';
    return h;
  });
  assert(/Nada em/.test(vazio)&&/per[ií]odo/i.test(vazio),'diz que nao ha nada NO PERIODO, em vez de "nunca foi lancado"');

  console.log('\n=== tela do Financeiro renderiza inteira sem erro ===');
  await pg.evaluate(()=>{osList=[];financeiroNotas=[];nav('financeiro');});
  await pg.waitForTimeout(250);
  assert(await pg.locator('#finPeriodo').count()===1,'o seletor de periodo esta na tela');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS DO BLOCO 1 PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
