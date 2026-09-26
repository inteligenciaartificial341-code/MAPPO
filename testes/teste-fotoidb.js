/* Etapa 2: a foto sai do localStorage e passa a viver no armazem do aparelho.
   E o ponto onde da pra perder prova de servico executado -- entao cada caminho que precisa
   dos BYTES e verificado: tela, envio pra nuvem, PDF e link do cliente. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
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

  linha();console.log('=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  linha();console.log('TODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error(e.message);process.exit(1);});
