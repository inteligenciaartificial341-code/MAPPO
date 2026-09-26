/* Etapa 2: a foto sai do localStorage e passa a viver no armazem do aparelho.
   E o ponto onde da pra perder prova de servico executado -- entao cada caminho que precisa
   dos BYTES e verificado: tela, envio pra nuvem, PDF e link do cliente. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
const linha=()=>console.log('');

function montarFake(){
  window.__nuvem={};
  const doc=(id)=>({__id:id,
    get:async()=>({exists:window.__nuvem[id]!==undefined,data:()=>({json:window.__nuvem[id]})}),
    set:async(d)=>{window.__nuvem[id]=d.json;},
    delete:async()=>{delete window.__nuvem[id];}});
  const col=()=>({doc, where:function(){return this;}, onSnapshot:()=>()=>{}});
  fbDB={collection:()=>({doc:()=>({collection:col})}),
    runTransaction:async(fn)=>fn({
      get:async(r)=>({exists:window.__nuvem[r.__id]!==undefined,data:()=>({json:window.__nuvem[r.__id]})}),
      set:(r,d)=>{window.__nuvem[r.__id]=d.json;}})};
  firebase={firestore:{FieldValue:{serverTimestamp:()=>Date.now()},FieldPath:{documentId:()=>'__name__'}}};
  fbReady=true; WORKSPACE='ws'; _avisouSessaoExpirada=true;
  session={perfil:'tecnico',nome:'Paulo',uid:'u',role:'Técnico de Campo',workspaceId:'ws'};
  tecnicos=[{id:'t1',nome:'Paulo',ativo:true,modulos:{split:true,vrfObras:[]}}];
  /* JPEG de VERDADE: _thumb (link do cliente) precisa decodificar a imagem, entao uma
     string qualquer nao serve. Ruido aleatorio para o JPEG nao comprimir a quase nada. */
  window.fotoReal=(lado)=>{
    const c=document.createElement('canvas');c.width=lado;c.height=Math.round(lado*0.75);
    const x=c.getContext('2d');const d=x.createImageData(c.width,c.height);
    for(let i=0;i<d.data.length;i+=4){
      d.data[i]=Math.random()*255;d.data[i+1]=Math.random()*255;
      d.data[i+2]=Math.random()*255;d.data[i+3]=255;}
    x.putImageData(d,0,0);
    return c.toDataURL('image/jpeg',0.9);
  };
  window.kbLocal=()=>Math.round((localStorage.getItem('mappo_os')||'').length/1024);
  window.zerarMigracao=()=>{try{localStorage.removeItem('mappo_fotos_idb');}catch(e){}};

  /* ── obra e tarefa: o resto do que ocupava o aparelho ── */
  window.kbDe=(k)=>Math.round((localStorage.getItem(k)||'').length/1024);
  window.zerarMigracaoOT=()=>{try{localStorage.removeItem('mappo_fotos_idb_ot');}catch(e){}};
  window.setFotosObra=(v)=>{_quietWrite=true;localStorage.setItem('mappo_vrf_fotos',JSON.stringify(v));_quietWrite=false;
    vrfFotos=v;_snapshot['mappo_vrf_fotos']=JSON.stringify(v);};
  window.marcouMigracaoOT=()=>{try{return localStorage.getItem('mappo_fotos_idb_ot')==='1';}catch(e){return false;}};
  // conta foto ACESSIVEL (bytes OU referencia) e conta quanta ainda esta em bytes
  window.contarObra=(o)=>{let n=0,bytes=0;Object.keys(o||{}).forEach(g=>Object.keys(o[g]||{}).forEach(k=>{
    (o[g][k]||[]).forEach(v=>{if(_ehFotoDeVerdade(v)){n++;bytes++;}else if(_ehReferenciaDeFoto(v))n++;});}));
    return {n,bytes};};
  window.contarTarefa=(l)=>{let n=0,bytes=0;(l||[]).forEach(t=>((t&&t.fotos)||[]).forEach(v=>{
    if(_ehFotoDeVerdade(v)){n++;bytes++;}else if(_ehReferenciaDeFoto(v))n++;}));return {n,bytes};};
  /* Monta uma obra com um andar e duas fotos numa etapa, e uma tarefa com duas fotos --
     as duas colecoes no formato ANTIGO (bytes no localStorage), que e o que a migracao acha
     num aparelho de tecnico que ja usa o app. */
  /* disparar o handler REAL da camera de obra (ver o mesmo em teste-fototarefa) */
  window.arquivoDeFoto=async(lado)=>{
    const c=document.createElement('canvas');c.width=lado;c.height=Math.round(lado*0.75);
    const x=c.getContext('2d');const d=x.createImageData(c.width,c.height);
    for(let i=0;i<d.data.length;i+=4){
      d.data[i]=Math.random()*255;d.data[i+1]=Math.random()*255;
      d.data[i+2]=Math.random()*255;d.data[i+3]=255;}
    x.putImageData(d,0,0);
    const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.92));
    return new File([blob],'foto.jpg',{type:'image/jpeg'});
  };
  window.dispararCamera=async(inputId,lado)=>{
    const arq=await arquivoDeFoto(lado);
    const dt=new DataTransfer();dt.items.add(arq);
    const inp=document.getElementById(inputId);
    if(!inp)throw new Error('input '+inputId+' nao existe na tela');
    inp.files=dt.files;
    inp.dispatchEvent(new Event('change',{bubbles:true}));
  };
  window.esperarPor=async(fn,ms)=>{
    const ate=Date.now()+(ms||8000);
    while(Date.now()<ate){if(fn())return true;await new Promise(r=>setTimeout(r,60));}
    return false;
  };
  window.montarObraETarefa=()=>{
    vrfObras=[{id:'obraT',nome:'Edificio Teste',andares:[{id:'a1',nome:'Térreo'}],metaData:'',missao:{porAndar:{},andarIdx:0}}];
    vrfObraAtualId='obraT';
    _quietWrite=true;localStorage.setItem('mappo_vrf_obras',JSON.stringify(vrfObras));_quietWrite=false;
    vrfProgresso={a1:{'f1_0':true}};
    _quietWrite=true;localStorage.setItem('mappo_vrf_progresso',JSON.stringify(vrfProgresso));_quietWrite=false;
    vrfFotos={a1:{'f1_0':[fotoReal(900),fotoReal(900)]}};
    _quietWrite=true;localStorage.setItem('mappo_vrf_fotos',JSON.stringify(vrfFotos));_quietWrite=false;
    _snapshot['mappo_vrf_fotos']=localStorage.getItem('mappo_vrf_fotos');
    vrfNotas={a1:{'f1_0':'tudo certo'}};
    _quietWrite=true;localStorage.setItem('mappo_vrf_notas',JSON.stringify(vrfNotas));_quietWrite=false;
    vrfFotosMeta={a1:{'f1_0':[{prestador:'Paulo',data:'2026-09-26'},{prestador:'Paulo',data:'2026-09-26'}]}};
    _quietWrite=true;localStorage.setItem('mappo_vrf_fotos_meta',JSON.stringify(vrfFotosMeta));_quietWrite=false;
    tarefas=[{id:'tf1',nome:'Limpeza de dutos',tecnico:'Paulo',maxFotos:20,temNotas:true,status:'andamento',
      criada:'2026-09-26T08:00:00.000Z',fotos:[fotoReal(900),fotoReal(900)],nota:'',checkins:[{data:'2026-09-26',hora:'08:00'}]}];
    _quietWrite=true;localStorage.setItem('mappo_tarefas',JSON.stringify(tarefas));_quietWrite=false;
    _snapshot['mappo_tarefas']=localStorage.getItem('mappo_tarefas');
  };
}

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch();
  const ctx=await b.newContext({acceptDownloads:true,viewport:{width:390,height:844}});
  const pg=await ctx.newPage();
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);
  await pg.evaluate(montarFake);

  linha();console.log('=== CHECK 1: MIGRACAO -- a foto sai do localStorage sem se perder ===');
  const r1=await pg.evaluate(async()=>{
    zerarMigracao();
    osList=[{id:'os1',cliente:'Jessika',endereco:'rua C-28, 72',data:'2026-09-25',hora:'08:00',qtdSplits:1,tipo:'Instalação',tecnico:'Paulo',status:'andamento',
      equipamentos:[{idx:0,marca:'LG',modelo:'X',fotoEvap:fotoReal(900),fotoCond:fotoReal(900)}],
      checklist:[{id:'a',label:'A',status:'ok',foto:fotoReal(900)}],
      assinatura:fotoReal(400)}];
    _quietWrite=true;localStorage.setItem('mappo_os',JSON.stringify(osList));_quietWrite=false;
    const antesKB=kbLocal();
    const r=await migrarFotosParaOArmazem();
    const depoisKB=kbLocal();
    const os=osList[0];
    // os bytes tem que voltar INTEIROS pelo armazem
    const evap=await fotoBytes(os.equipamentos[0].fotoEvap);
    const sig=await fotoBytes(os.assinatura);
    return {antesKB,depoisKB,movidas:r.movidas,erros:r.erros,
      campoVirouReferencia:_ehReferenciaDeFoto(os.equipamentos[0].fotoEvap),
      evapOk:evap&&evap.length>50*1024, sigOk:sig&&sig.length>10*1024,
      localTemFoto:/data:image/.test(localStorage.getItem('mappo_os'))};
  });
  console.log('  ', JSON.stringify(r1));
  assert(r1.antesKB>400,'antes a ordem ocupava '+r1.antesKB+' KB no aparelho');
  assert(r1.movidas===4&&r1.erros===0,'as 4 fotos foram movidas, nenhuma falhou');
  assert(r1.depoisKB<5,'agora ocupa '+r1.depoisKB+' KB -- a foto saiu do localStorage');
  assert(r1.localTemFoto===false,'nenhuma foto sobrou no localStorage');
  assert(r1.campoVirouReferencia===true,'o campo guarda a referencia');
  assert(r1.evapOk&&r1.sigOk,'E OS BYTES VOLTAM INTEIROS pelo armazem');

  linha();console.log('=== CHECK 2: a TELA mostra a foto (o pintor) ===');
  const r2=await pg.evaluate(async()=>{
    _gravarTourVisto(); entrarApp();
    const s=document.getElementById('splashScreen'); if(s)s.remove();
    nav('ordens'); abrirExecucao('os1');
    await new Promise(r=>setTimeout(r,800));
    const imgs=[...document.querySelectorAll('.foto-mini')];
    return {quantas:imgs.length,
            comFoto:imgs.filter(i=>(i.src||'').slice(0,11)==='data:image/').length,
            sobrouMarcador:!!document.querySelector('img[data-foto]')};
  });
  console.log('  ', JSON.stringify(r2));
  assert(r2.quantas>=2,'a tela de execucao desenhou as miniaturas');
  assert(r2.comFoto===r2.quantas,'TODAS foram preenchidas com a imagem de verdade');
  assert(r2.sobrouMarcador===false,'nenhum marcador ficou por pintar');

  linha();console.log('=== CHECK 3: o ENVIO acha os bytes (falha silenciosa que eu temia) ===');
  const r3=await pg.evaluate(async()=>{
    window.__nuvem={};
    try{localStorage.removeItem('mappo_fotos_enviadas');}catch(e){}
    await _pushOSSemFotos();
    const docs=Object.keys(window.__nuvem);
    const fotos=docs.filter(d=>d.indexOf('mappo_foto__')===0);
    const um=window.__nuvem[fotos[0]]||'';
    return {docsFoto:fotos.length, registroKB:Math.round((window.__nuvem['mappo_os']||'').length/1024),
            bytesDeVerdade:um.slice(0,11)==='data:image/'};
  });
  console.log('  ', JSON.stringify(r3));
  assert(r3.docsFoto===4,'as 4 fotos SUBIRAM (buscadas no armazem)');
  assert(r3.bytesDeVerdade===true,'e subiram como imagem de verdade, nao como referencia');
  assert(r3.registroKB<5,'o registro das ordens continua minusculo');

  linha();console.log('=== CHECK 4: OUTRO APARELHO recebe e guarda como referencia ===');
  const r4=await pg.evaluate(async()=>{
    const daNuvem=window.__nuvem['mappo_os'];
    osList=[];_quietWrite=true;localStorage.setItem('mappo_os','[]');_quietWrite=false;
    _pend={};_snapshot['mappo_os']='[]';
    await _aplicarOSComFotos(daNuvem,Date.now());
    const os=(osList||[])[0];
    const evap=os?await fotoBytes(os.equipamentos[0].fotoEvap):null;
    return {chegou:!!os,
            ehReferencia:os?_ehReferenciaDeFoto(os.equipamentos[0].fotoEvap):false,
            bytesOk:!!evap&&evap.length>50*1024,
            localKB:kbLocal()};
  });
  console.log('  ', JSON.stringify(r4));
  assert(r4.chegou===true,'a ordem chegou no segundo aparelho');
  assert(r4.ehReferencia===true,'a foto foi guardada como referencia (nao incha o localStorage)');
  assert(r4.bytesOk===true,'e os bytes sao recuperaveis');
  assert(r4.localKB<5,'o segundo aparelho tambem ficou com '+r4.localKB+' KB');

  linha();console.log('=== CHECK 5: o PDF sai COM as fotos ===');
  const dl=pg.waitForEvent('download',{timeout:60000});
  await pg.evaluate(()=>{WORKSPACE_NOME='Elite Ar';osList[0].status='concluida';exportarPDFos('os1');});
  const download=await dl;
  const destino=path.join(__dirname,'os-idb.pdf');
  await download.saveAs(destino);
  const tam=fs.statSync(destino).size;
  const bruto=fs.readFileSync(destino,'latin1');
  console.log('   PDF:', Math.round(tam/1024)+' KB');
  assert(tam>20000,'o PDF tem conteudo de verdade ('+Math.round(tam/1024)+' KB)');
  assert(bruto.includes('/Image')||bruto.includes('DCTDecode'),'AS FOTOS FORAM EMBUTIDAS no PDF');
  assert(bruto.includes('ACEITE DO CLIENTE'),'e a assinatura tambem');

  linha();console.log('=== CHECK 6: o LINK DO CLIENTE sai com as fotos ===');
  const r6=await pg.evaluate(async()=>{
    const p=await pubPayloadOS(osList[0]);
    const comFoto=(p.etapas||[]).filter(e=>e.foto&&e.foto.slice(0,11)==='data:image/').length;
    return {etapas:(p.etapas||[]).length, comFoto};
  });
  console.log('  ', JSON.stringify(r6));
  assert(r6.comFoto>=1,'o payload do link levou a foto do checklist de verdade');

  linha();console.log('=== CHECK 7: referencia perdida NAO some calada ===');
  const r7=await pg.evaluate(async()=>{
    const inexistente='mappo_foto__osZ__eq0_evap';
    const b=await fotoBytes(inexistente);
    const d=document.createElement('div');
    d.innerHTML='<img data-foto="'+inexistente+'">';
    document.body.appendChild(d);
    await new Promise(r=>setTimeout(r,500));
    const img=d.querySelector('img');
    return {bytes:b, avisou:img.classList.contains('foto-ausente'), alt:img.alt};
  });
  console.log('  ', JSON.stringify(r7));
  assert(r7.bytes===null,'foto que nao existe devolve nada, sem quebrar');
  assert(r7.avisou===true,'e a tela MOSTRA que faltou, em vez de fingir que esta tudo bem');

  linha();console.log('=== CHECK 8: MIGRACAO de OBRA e TAREFA -- saem do localStorage ===');
  const r8=await pg.evaluate(async()=>{
    zerarMigracaoOT();
    montarObraETarefa();
    const antes={obra:kbDe('mappo_vrf_fotos'), tarefa:kbDe('mappo_tarefas')};
    const r=await migrarFotosObraETarefaParaOArmazem();
    const depois={obra:kbDe('mappo_vrf_fotos'), tarefa:kbDe('mappo_tarefas')};
    const co=contarObra(vrfFotos), ct=contarTarefa(tarefas);
    // os bytes tem que voltar INTEIROS pelo armazem, nas duas colecoes
    const b1=await fotoBytes(vrfFotos.a1['f1_0'][0]);
    const b2=await fotoBytes(tarefas[0].fotos[0]);
    return {antes,depois,movidas:r.movidas,erros:r.erros,
      obraFotos:co.n,obraBytes:co.bytes, tarefaFotos:ct.n,tarefaBytes:ct.bytes,
      obraOk:!!b1&&b1.length>50*1024, tarefaOk:!!b2&&b2.length>50*1024,
      marcou:marcouMigracaoOT(),
      sobrouBytesNoLocal:/data:image/.test(localStorage.getItem('mappo_vrf_fotos')||'')
                       ||/data:image/.test(localStorage.getItem('mappo_tarefas')||'')};
  });
  console.log('  ', JSON.stringify({...r8}));
  assert(r8.antes.obra>100&&r8.antes.tarefa>100,'antes: obra '+r8.antes.obra+' KB e tarefa '+r8.antes.tarefa+' KB no aparelho');
  assert(r8.movidas===4&&r8.erros===0,'as 4 fotos (2 de obra + 2 de tarefa) foram movidas, nenhuma falhou');
  assert(r8.depois.obra<5&&r8.depois.tarefa<5,'agora: obra '+r8.depois.obra+' KB e tarefa '+r8.depois.tarefa+' KB');
  assert(r8.sobrouBytesNoLocal===false,'nenhuma foto de obra ou tarefa sobrou no localStorage');
  assert(r8.obraFotos===2&&r8.obraBytes===0,'as 2 de obra viraram referencia, sem perder nenhuma');
  assert(r8.tarefaFotos===2&&r8.tarefaBytes===0,'as 2 de tarefa tambem');
  assert(r8.obraOk&&r8.tarefaOk,'E OS BYTES VOLTAM INTEIROS pelo armazem, nas duas');
  assert(r8.marcou===true,'a marca de migrado foi gravada (todas passaram)');

  linha();console.log('=== CHECK 9: as TELAS de obra e de tarefa mostram as fotos ===');
  const r9=await pg.evaluate(async()=>{
    /* Container PROPRIO, anexado ao body -- nunca substituir o body nem a view do app: isso
       levaria embora o elemento do toast e a tela inteira, e o CHECK do PDF (que chama toast)
       morreria por um motivo que nada tem a ver com foto. O pintor observa o body todo, entao
       um container novo e pintado igual. */
    const alvo=document.createElement('div');
    document.body.appendChild(alvo);
    // galeria de fotos da obra (vrf-fotos) -- o gestor ve todas as fotos do campo aqui
    alvo.innerHTML=renderVRFfotos();
    await new Promise(r=>setTimeout(r,800));
    const obraImgs=[...alvo.querySelectorAll('.vrf-foto-card img')];
    const obra={quantas:obraImgs.length,
      comFoto:obraImgs.filter(i=>(i.src||'').slice(0,11)==='data:image/').length};
    // tela de execucao da tarefa (o tecnico) -- e onde ele confere o que enviou
    execTarefaId='tf1';
    alvo.innerHTML=renderExecTarefa(tarefas[0]);
    await new Promise(r=>setTimeout(r,800));
    const tfImgs=[...alvo.querySelectorAll('.tf-foto img')];
    const tarefa={quantas:tfImgs.length,
      comFoto:tfImgs.filter(i=>(i.src||'').slice(0,11)==='data:image/').length};
    const sobrouMarcador=!!alvo.querySelector('img[data-foto]');
    alvo.remove();
    return {obra,tarefa,sobrouMarcador};
  });
  console.log('  ', JSON.stringify(r9));
  assert(r9.obra.quantas===2,'a galeria da obra desenhou as 2 fotos');
  assert(r9.obra.comFoto===2,'e AS DUAS foram preenchidas com a imagem de verdade');
  assert(r9.tarefa.quantas===2,'a tela da tarefa desenhou as 2 fotos');
  assert(r9.tarefa.comFoto===2,'e AS DUAS foram preenchidas com a imagem de verdade');
  assert(r9.sobrouMarcador===false,'nenhum marcador ficou por pintar');

  linha();console.log('=== CHECK 10: o ENVIO de obra e de tarefa acha os bytes no armazem ===');
  const r10=await pg.evaluate(async()=>{
    window.__nuvem={};
    try{localStorage.removeItem('mappo_fotos_enviadas');}catch(e){}
    _pend={};_pend['mappo_vrf_fotos']={};_pend['mappo_vrf_fotos']['a1'+SEP+'f1_0']=1;
    await _pushFotosPorAndar();
    await _doPush('mappo_tarefas');
    const docs=Object.keys(window.__nuvem);
    const dObra=docs.filter(d=>d.indexOf('mappo_fotoobra__')===0);
    const dTarefa=docs.filter(d=>d.indexOf('mappo_fototarefa__')===0);
    const umObra=window.__nuvem[dObra[0]]||'', umTarefa=window.__nuvem[dTarefa[0]]||'';
    return {dObra:dObra.length, dTarefa:dTarefa.length,
      obraBytesDeVerdade:umObra.slice(0,11)==='data:image/',
      tarefaBytesDeVerdade:umTarefa.slice(0,11)==='data:image/',
      andarKB:Math.round((window.__nuvem[_docDoAndar('a1')]||'').length/1024),
      tarefasKB:Math.round((window.__nuvem['mappo_tarefas']||'').length/1024)};
  });
  console.log('  ', JSON.stringify(r10));
  assert(r10.dObra===2,'as 2 fotos de obra SUBIRAM, buscadas no armazem');
  assert(r10.dTarefa===2,'as 2 fotos de tarefa tambem');
  assert(r10.obraBytesDeVerdade&&r10.tarefaBytesDeVerdade,'e subiram como imagem de verdade, nao como referencia (nem como "null")');
  assert(r10.andarKB<5&&r10.tarefasKB<5,'os documentos de estrutura continuam minusculos');

  linha();console.log('=== CHECK 11: o PDF do relatorio de OBRA sai COM as fotos ===');
  const dl2=pg.waitForEvent('download',{timeout:60000});
  await pg.evaluate(()=>{WORKSPACE_NOME='Elite Ar';vrfExportarPDF('a1');});
  const download2=await dl2;
  const destino2=path.join(__dirname,'obra-idb.pdf');
  await download2.saveAs(destino2);
  const tam2=fs.statSync(destino2).size;
  const bruto2=fs.readFileSync(destino2,'latin1');
  console.log('   PDF do andar:', Math.round(tam2/1024)+' KB');
  assert(tam2>20000,'o PDF do andar tem conteudo de verdade ('+Math.round(tam2/1024)+' KB)');
  assert(bruto2.includes('/Image')||bruto2.includes('DCTDecode'),'AS FOTOS DE OBRA FORAM EMBUTIDAS no PDF, resolvidas por referencia');
  assert(bruto2.includes('Registro Fotografico'),'com a secao de registro fotografico');

  linha();console.log('=== CHECK 12: o LINK DO CLIENTE da obra sai com a foto ===');
  const r12=await pg.evaluate(async()=>{
    const p=await pubPayloadObra('a1');
    let comFoto=0;
    (p&&p.fases||[]).forEach(f=>(f.etapas||[]).forEach(e=>{
      if(e.foto&&e.foto.slice(0,11)==='data:image/')comFoto++;}));
    return {temPayload:!!p, comFoto};
  });
  console.log('  ', JSON.stringify(r12));
  assert(r12.temPayload===true,'o payload do andar foi montado');
  assert(r12.comFoto>=1,'e levou a foto de obra de verdade, resolvida por referencia');

  linha();console.log('=== CHECK 13: ARMAZEM INDISPONIVEL -- segue no formato antigo ===');
  /* IndexedDB bloqueado nao pode derrubar nada nem perder foto: a migracao volta 0 movidas,
     a foto fica exatamente como estava (bytes), o app segue funcionando, e a marca de
     migrado NAO e gravada -- a proxima abertura tenta de novo. */
  const r13=await pg.evaluate(async()=>{
    zerarMigracaoOT();
    montarObraETarefa();
    const antes=contarObra(vrfFotos).bytes+contarTarefa(tarefas).bytes;
    const original=window.idbGravarFoto;
    window.idbGravarFoto=()=>Promise.reject(new Error('IndexedDB bloqueado'));
    let r,erro=null;
    try{r=await migrarFotosObraETarefaParaOArmazem();}catch(e){erro=e.message;}
    window.idbGravarFoto=original;
    const co=contarObra(vrfFotos), ct=contarTarefa(tarefas);
    return {antes,erro,movidas:r&&r.movidas,erros:r&&r.erros,marcou:marcouMigracaoOT(),
      aindaBytes:co.bytes+ct.bytes, aindaAcessiveis:co.n+ct.n};
  });
  console.log('  ', JSON.stringify(r13));
  assert(r13.erro===null,'armazem indisponivel NAO derruba a migracao');
  assert(r13.movidas===0&&r13.erros===4,'nenhuma foi movida, e as 4 falhas foram contadas (nao engolidas)');
  assert(r13.aindaAcessiveis===4,'as 4 fotos continuam TODAS acessiveis');
  assert(r13.aindaBytes===4,'e no formato antigo, exatamente como estavam -- nada foi perdido');
  assert(r13.marcou===false,'e a marca de migrado NAO foi gravada: a proxima abertura tenta de novo');

  linha();console.log('=== CHECK 14: O HANDLER REAL DA CAMERA DE OBRA ===');
  /* Como na tarefa: dispara o <input> de verdade e deixa vrfSetupCamera rodar de ponta a ponta.
     Sem isto, reverter `push(valor)` para `push(b64)` no handler de obra passa em branco. */
  const r14=await pg.evaluate(async()=>{
    zerarMigracaoOT();montarObraETarefa();
    vrfFotos={};_quietWrite=true;localStorage.setItem('mappo_vrf_fotos','{}');_quietWrite=false;
    vrfFotosMeta={};_quietWrite=true;localStorage.setItem('mappo_vrf_fotos_meta','{}');_quietWrite=false;
    // a tela de execucao do andar tem o input da camera
    const alvo=document.createElement('div');alvo.id='telaObra';document.body.appendChild(alvo);
    alvo.innerHTML='<div id="vrfPainel"></div><input type="file" id="vrfCameraInput" accept="image/*" style="display:none">';
    _vrfFotoTarget={andarId:'a1',key:'f1_0'};
    vrfFloorTab=0;                      // sem painel para redesenhar, so o dado
    vrfSetupCamera();
    await dispararCamera('vrfCameraInput',900);
    const chegou=await esperarPor(()=>((vrfFotos.a1||{})['f1_0']||[]).length===1);
    const v=((vrfFotos.a1||{})['f1_0']||[])[0];
    const bytes=v?await fotoBytes(v):null;
    const meta=((vrfFotosMeta.a1||{})['f1_0']||[]);
    alvo.remove();
    return {chegou, ehReferencia:_ehReferenciaDeFoto(v), temBytesInline:_ehFotoDeVerdade(v),
            bytesOk:!!bytes&&bytes.slice(0,11)==='data:image/'&&bytes.length>5000,
            gravadoNoDisco:!/data:image/.test(localStorage.getItem('mappo_vrf_fotos')||''),
            autoria:meta.length, autor:(meta[0]||{}).prestador||''};
  });
  console.log('  ', JSON.stringify(r14));
  assert(r14.chegou===true,'o handler real da camera de obra rodou e a foto entrou no andar');
  assert(r14.ehReferencia===true,'O QUE ELE GUARDOU E A REFERENCIA, nao os bytes');
  assert(r14.temBytesInline===false,'nenhum byte inline ficou em vrfFotos');
  assert(r14.bytesOk===true,'e os bytes estao no armazem, legiveis');
  assert(r14.gravadoNoDisco===true,'nenhum byte foi gravado no localStorage');
  assert(r14.autoria===1&&r14.autor==='Paulo','e a autoria foi registrada junto, alinhada com a foto');

  linha();console.log('=== CHECK 15: as DUAS migracoes rodam pelo entrarApp (nao so por chamada direta) ===');
  /* Apagar a segunda chamada no entrarApp, ou tirar o await pondo as duas em paralelo, nao
     quebrava nada -- e o app nunca migraria as fotos de quem ja usa o sistema. */
  const r15=await pg.evaluate(async()=>{
    zerarMigracao();zerarMigracaoOT();
    montarObraETarefa();
    osList=[{id:'os1',cliente:'Jessika',endereco:'rua C-28, 72',data:'2026-09-25',hora:'08:00',qtdSplits:1,tipo:'Instalação',tecnico:'Paulo',status:'andamento',
      equipamentos:[{idx:0,marca:'LG',modelo:'X',fotoEvap:fotoReal(900)}],checklist:[],assinatura:null}];
    _quietWrite=true;localStorage.setItem('mappo_os',JSON.stringify(osList));_quietWrite=false;
    const antes={os:kbDe('mappo_os'),obra:kbDe('mappo_vrf_fotos'),tarefa:kbDe('mappo_tarefas')};
    /* As marcas TEM que estar limpas antes de comecar: com qualquer uma delas de pe a migracao
       correspondente sai na primeira linha e o teste passaria medindo nada. Conferir aqui e o
       que separa "rodou e funcionou" de "nao rodou" -- os dois deixam a marca em '1'. */
    const marcasLimpas=!localStorage.getItem('mappo_fotos_idb')&&!localStorage.getItem('mappo_fotos_idb_ot');
    _gravarTourVisto();
    entrarApp();                                  // o caminho de verdade
    const s=document.getElementById('splashScreen'); if(s)s.remove();
    /* Espera o RESULTADO, nao a marca: a marca sozinha nao distingue "migrou" de "pulou".
       A condicao e as tres chaves sem byte nenhum E as duas marcas gravadas. */
    const ok=await esperarPor(()=>{
      try{
        return localStorage.getItem('mappo_fotos_idb')==='1'
            && localStorage.getItem('mappo_fotos_idb_ot')==='1'
            && !/data:image/.test(localStorage.getItem('mappo_os')||'')
            && !/data:image/.test(localStorage.getItem('mappo_vrf_fotos')||'')
            && !/data:image/.test(localStorage.getItem('mappo_tarefas')||'');
      }catch(e){return false;}
    },20000);
    if(!marcasLimpas)return {ok:false,marcasLimpas,antes,depois:antes,marcaOS:'?',marcaOT:'?'};
    return {ok, antes, depois:{os:kbDe('mappo_os'),obra:kbDe('mappo_vrf_fotos'),tarefa:kbDe('mappo_tarefas')},
            marcaOS:localStorage.getItem('mappo_fotos_idb'), marcaOT:localStorage.getItem('mappo_fotos_idb_ot'),
            detalhe:{campoNaMemoria:String((((osList||[])[0]||{}).equipamentos||[{}])[0].fotoEvap).slice(0,40),
                  discoTemBytes:/data:image/.test(localStorage.getItem('mappo_os')||''),
                  qtdOs:(osList||[]).length}};
  });
  console.log('  ', JSON.stringify(r15));
  assert(r15.marcasLimpas!==false,'as marcas de migracao comecaram limpas (senao o teste mediria nada)');
  assert(r15.antes.os>100&&r15.antes.obra>100&&r15.antes.tarefa>100,'antes: as tres chaves com fotos dentro');
  assert(r15.ok===true,'entrarApp migrou AS TRES colecoes -- as duas chamadas estao ligadas de verdade');
  assert(r15.marcaOS==='1'&&r15.marcaOT==='1','e as duas marcas foram gravadas');
  assert(r15.depois.os<5&&r15.depois.obra<5&&r15.depois.tarefa<5,
    'e as tres esvaziaram: os '+r15.depois.os+' KB, obra '+r15.depois.obra+' KB, tarefa '+r15.depois.tarefa+' KB');

  linha();console.log('=== CHECK 16: ARMAZEM FALHANDO AO RECEBER -- fica com os BYTES, nao com a referencia ===');
  /* Se o armazem rejeita durante um pull, trocar por f.id faria a foto virar irrecuperavel
     naquele aparelho (referencia sem bytes e sem garantia de rede). O certo e ficar com a foto
     em si: funciona, so nao economiza espaco. Nenhum teste cobria esse ramo. */
  const r16=await pg.evaluate(async()=>{
    // obra: o andar chega da nuvem com marcador, e o armazem rejeita
    setFotosObra({});
    const foto=fotoReal(900);
    const id=_idFotoObra(foto);
    window.__nuvem[id]=foto;
    const original=window.idbGravarFoto;
    window.idbGravarFoto=()=>Promise.reject(new Error('IndexedDB bloqueado'));
    let obra=null,tarefa=null;
    try{
      const andar={a1:{'f1_0':[id]}};
      await _resolverFotosAndar(andar.a1,{});
      obra=andar.a1['f1_0'][0];
      // tarefa: mesma coisa
      const remoto=[{id:'tf9',nome:'T',maxFotos:20,fotos:[_idFotoTarefa(foto)],status:'andamento'}];
      window.__nuvem[_idFotoTarefa(foto)]=foto;
      await _resolverFotosTarefa(remoto,[]);
      tarefa=remoto[0].fotos[0];
    }finally{window.idbGravarFoto=original;}
    return {obraTemBytes:_ehFotoDeVerdade(obra), obraFicouReferencia:_ehReferenciaDeFoto(obra),
            tarefaTemBytes:_ehFotoDeVerdade(tarefa), tarefaFicouReferencia:_ehReferenciaDeFoto(tarefa)};
  });
  console.log('  ', JSON.stringify(r16));
  assert(r16.obraTemBytes===true&&r16.obraFicouReferencia===false,
    'obra: armazem indisponivel deixa OS BYTES, nunca uma referencia irrecuperavel');
  assert(r16.tarefaTemBytes===true&&r16.tarefaFicouReferencia===false,
    'tarefa: idem -- a foto continua acessivel neste aparelho');

  linha();console.log('=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  linha();console.log('TODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error(e.message);process.exit(1);});
