/* O tecnico nao pode ser expulso da OS ao enviar uma foto.
   Reproduz o relato: tirar/enviar foto -> a tela volta sozinha pra aba principal e a foto
   parece nao ter ido. Causa: a propria foto sobe, o snapshot volta e fbOnRemoteChange
   re-renderiza a view de baixo, apagando a tela de execucao. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }

function montar(){
  fbReady=true; WORKSPACE='ws'; _avisouSessaoExpirada=true;
  session={perfil:'tecnico',nome:'Paulo',uid:'u',role:'Técnico de Campo',workspaceId:'ws'};
  tecnicos=[{id:'t1',nome:'Paulo',ativo:true,modulos:{split:true,vrfObras:[]}}];
  _gravarTourVisto(); entrarApp();
  const s=document.getElementById('splashScreen'); if(s)s.remove();
  osList=[{id:'os1',cliente:'Jessika',endereco:'rua C-28',tipo:'Instalação',tecnico:'Paulo',
    data:'2026-09-25',hora:'08:00',status:'andamento',qtdSplits:1,checkinTime:'07:57',
    equipamentos:[{idx:0,marca:'',modelo:'',fotoEvap:null,fotoCond:null}],
    checklist:checklistDoTipo('Instalação')}];
  localStorage.setItem('mappo_os',JSON.stringify(osList));
  window.telaExecucaoAberta=()=>!!document.getElementById('equipPanelArea');
  // a foto agora e uma REFERENCIA no localStorage; o que se verifica e os bytes voltarem
  window.fotoDaOS=async()=>{const o=JSON.parse(localStorage.getItem('mappo_os'))[0];
    const b=await fotoBytes(o.equipamentos[0].fotoEvap);
    return b?b.slice(0,11):null;};
  window.__toasts=[];
  const orig=window.toast;
  window.toast=(msg,tipo)=>{window.__toasts.push(msg);return orig(msg,tipo);};
}

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch();
  const pg=await b.newPage({viewport:{width:390,height:844}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);
  await pg.evaluate(montar);

  console.log('\n=== CHECK 1: O CASO RELATADO -- foto da etiqueta com o eco da nuvem ===');
  const r1=await pg.evaluate(async()=>{
    nav('ordens'); abrirExecucao('os1');
    const abertaAntes=telaExecucaoAberta();
    window.__toasts=[];
    const c=document.createElement('canvas');c.width=300;c.height=240;
    const x=c.getContext('2d');x.fillStyle='#2a7089';x.fillRect(0,0,300,240);
    await new Promise(res=>{
      c.toBlob(async(blob)=>{
        const dt=new DataTransfer(); dt.items.add(new File([blob],'etiqueta.jpg',{type:'image/jpeg'}));
        const inp=document.getElementById('fEvap0');
        inp.files=dt.files; inp.dispatchEvent(new Event('change'));
        setTimeout(res,900);
      },'image/jpeg',0.8);
    });
    const salvouLocal=await fotoDaOS();
    /* O ECO REAL da nuvem: o que sobe e volta e a versao "magra", sem as fotos e com a
       lista __f dizendo quais campos tem foto. Por isso o que volta NUNCA e igual ao que
       esta no aparelho -- e cada foto nova muda o __f, garantindo diferenca a cada envio. */
    const slim=JSON.stringify(_separarFotosOS(JSON.parse(localStorage.getItem('mappo_os'))).slim);
    window.__ecoDiferente=(slim!==localStorage.getItem('mappo_os'));
    await fbApply('mappo_os',slim,Date.now());
    await new Promise(r=>setTimeout(r,600));
    return {abertaAntes,salvouLocal,abertaDepois:telaExecucaoAberta(),
            fotoDepois:await fotoDaOS(),toasts:window.__toasts.slice(),
            ecoDiferente:window.__ecoDiferente};
  });
  console.log('  ', JSON.stringify(r1));
  assert(r1.abertaAntes===true,'a tela de execucao abriu');
  assert(r1.ecoDiferente===true,'o eco da nuvem chega MESMO diferente do local (gatilho do bug)');
  assert(r1.salvouLocal==='data:image/','a foto foi gravada no aparelho');
  assert(r1.toasts.includes('Foto salva'),'o tecnico VE a confirmacao "Foto salva"');
  assert(r1.abertaDepois===true,'O TECNICO CONTINUA NA OS depois do eco da nuvem');
  assert(r1.fotoDepois==='data:image/','e a foto continua la');

  console.log('\n=== CHECK 2: a releitura de 5s nao orfana a OS em execucao ===');
  const r2=await pg.evaluate(async()=>{
    osList=JSON.parse(localStorage.getItem('mappo_os')||'[]');   // o que o setInterval faz
    _reancorarExecOS();
    const mesmoObjeto=(execOS===osList[0]);
    execOS.equipamentos[0].fotoCond='data:image/jpeg;base64,AAAA';
    saveExecOS();
    const o=JSON.parse(localStorage.getItem('mappo_os'))[0];
    return {mesmoObjeto,condSalvou:!!o.equipamentos[0].fotoCond,evapIntacta:!!o.equipamentos[0].fotoEvap};
  });
  console.log('  ', JSON.stringify(r2));
  assert(r2.mesmoObjeto===true,'execOS volta a apontar para a OS que esta na lista');
  assert(r2.condSalvou&&r2.evapIntacta,'as duas fotos sobrevivem');

  console.log('\n=== CHECK 3: foto do checklist tambem nao expulsa ===');
  const r3=await pg.evaluate(async()=>{
    execOS.checklist[0].status='ok';
    execOS.checklist[0].foto='data:image/jpeg;base64,BBBB';
    saveExecOS(); renderChecklistExec();
    fbApply('mappo_os',localStorage.getItem('mappo_os'),Date.now());
    await new Promise(r=>setTimeout(r,400));
    return {aberta:telaExecucaoAberta()};
  });
  assert(r3.aberta===true,'segue na OS depois de lancar item do checklist');

  console.log('\n=== CHECK 4: a guarda vale SO enquanto a execucao esta aberta ===');
  const r4=await pg.evaluate(async()=>{
    const orig=renderView; let chamadas=[];
    renderView=(v)=>{chamadas.push(v);};
    // (a) execucao ABERTA -> nao repinta a tela de baixo
    chamadas=[]; fbOnRemoteChange('mappo_os');
    const comExecucao=chamadas.slice();
    // (b) SEM execucao aberta -> repinta normalmente, como sempre fez
    execOS=null;
    chamadas=[]; fbOnRemoteChange('mappo_os');
    const semExecucao=chamadas.slice();
    // (c) chave que nao afeta a view atual segue sem repintar
    chamadas=[]; fbOnRemoteChange('mappo_preco_config');
    const chaveAlheia=chamadas.slice();
    renderView=orig;
    return {comExecucao,semExecucao,chaveAlheia,view:currentView};
  });
  console.log('  ', JSON.stringify(r4));
  assert(r4.comExecucao.length===0,'com a OS aberta, a tela de baixo NAO e repintada');
  assert(r4.semExecucao.length===1,'sem OS aberta, o re-render automatico CONTINUA funcionando');
  assert(r4.chaveAlheia.length===0,'chave que nao afeta a view atual segue sem repintar');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
