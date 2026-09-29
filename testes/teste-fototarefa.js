/* Fotos de tarefa: uma foto, um documento -- e nenhuma foto some no merge.
   Impede de voltar o ULTIMO estouro de 1 MiB que ainda estava de pe: `mappo_tarefas` guardava
   TODAS as tarefas num documento so, com as fotos dentro, e `maxFotos` vai a 20 por tarefa.
   A ~55 KB por foto, UMA tarefa cheia passa de 1 MB, o servidor recusa o documento inteiro e
   NENHUMA tarefa sincroniza mais -- o mesmo teto que ja parou as OS (ced6f69) e as obras
   (8a21647). Ninguem tinha percebido porque poucas tarefas tem foto.
   Impede tambem o defeito de 3eb9663 aplicado a tarefas: marcar a tarefa num aparelho
   apagando a foto que so existe no outro. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
const linha=()=>console.log('');

function montarFake(){
  window.__nuvem={}; window.__recusas=[];
  const LIMITE=1048487;                       // o teto real que o Firestore aplica
  const doc=(id)=>({__id:id,
    get:async()=>({exists:window.__nuvem[id]!==undefined,data:()=>({json:window.__nuvem[id]})}),
    set:async(d)=>{
      if(typeof d.json==='string'&&d.json.length>LIMITE){
        window.__recusas.push(id);
        throw new Error('The value of property "json" is longer than '+LIMITE+' bytes.');
      }
      window.__nuvem[id]=d.json;
    },
    delete:async()=>{delete window.__nuvem[id];}});
  const col=()=>({doc, where:function(){return this;}, onSnapshot:()=>()=>{}});
  fbDB={collection:()=>({doc:()=>({collection:col})}),
    runTransaction:async(fn)=>fn({
      get:async(r)=>({exists:window.__nuvem[r.__id]!==undefined,data:()=>({json:window.__nuvem[r.__id]})}),
      set:(r,d)=>{
        if(typeof d.json==='string'&&d.json.length>LIMITE){window.__recusas.push(r.__id);
          throw new Error('longer than '+LIMITE+' bytes');}
        window.__nuvem[r.__id]=d.json;}
    })};
  firebase={firestore:{FieldValue:{serverTimestamp:()=>Date.now()},FieldPath:{documentId:()=>'__name__'}}};
  fbReady=true; WORKSPACE='ws'; _avisouSessaoExpirada=true;
  session={perfil:'tecnico',nome:'Paulo',uid:'u',role:'Técnico de Campo',workspaceId:'ws'};
  tecnicos=[{id:'t1',nome:'Paulo',ativo:true,modulos:{split:true,vrfObras:[]}}];

  // uma foto de ~kb KB, unica (o id vem do CONTEUDO, entao duas iguais sao um documento so)
  window.fotoFalsa=(kb,marca)=>'data:image/jpeg;base64,'+'A'.repeat(kb*1024)+'#'+marca;
  window.setTarefas=(v)=>{_quietWrite=true;localStorage.setItem('mappo_tarefas',JSON.stringify(v));_quietWrite=false;
    tarefas=v;_snapshot['mappo_tarefas']=JSON.stringify(v);};
  window.getTarefas=()=>JSON.parse(localStorage.getItem('mappo_tarefas')||'[]');
  window.kbTarefasLocal=()=>Math.round((localStorage.getItem('mappo_tarefas')||'').length/1024);
  window.kbTarefasNuvem=()=>Math.round((window.__nuvem['mappo_tarefas']||'').length/1024);
  window.docsDeFoto=()=>Object.keys(window.__nuvem).filter(d=>d.indexOf('mappo_fototarefa__')===0).length;
  // conta foto ACESSIVEL: os bytes (formato antigo) ou a referencia do armazem
  window.contarFotos=(t)=>((t&&t.fotos)||[]).filter(v=>_ehFotoDeVerdade(v)||_ehReferenciaDeFoto(v)).length;
  window.contarBytes=(t)=>((t&&t.fotos)||[]).filter(v=>_ehFotoDeVerdade(v)).length;
  window.zerar=()=>{window.__nuvem={};window.__recusas=[];_pend={};
    /* CANCELA os envios AGENDADOS de checks anteriores. Sem isto, um fbPush com debounce de
       50 ms disparado por um check antigo caia DENTRO do check seguinte, empurrando para a
       nuvem falsa o estado velho -- e o CHECK 11 (que exige nuvem sem foto nenhuma) via 2
       documentos de foto aparecidos do nada. Medido: 1/15 de reprovacao, identico em d58536b,
       ou seja isolamento de teste, nao defeito do app. */
    Object.keys(_pushTimers).forEach(k=>{clearTimeout(_pushTimers[k]);delete _pushTimers[k];});
    try{localStorage.removeItem('mappo_fotos_enviadas');}catch(e){}};

  /* ── disparar o HANDLER REAL da camera ──
     Um JPEG de verdade (vrfComprimirImagem decodifica a imagem, entao string nao serve) posto
     no <input type=file> por DataTransfer, com o evento 'change' que o navegador dispararia.
     E isto, e so isto, que exercita o caminho que o tecnico usa: sem ele, trocar
     `t.fotos.push(valor)` de volta para `push(b64)` nao quebra teste nenhum. */
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
  // container proprio: nunca substituir o body (levaria embora a faixa e o toast)
  window.telaDeTeste=()=>{
    let d=document.getElementById('telaTeste');
    if(!d){d=document.createElement('div');d.id='telaTeste';document.body.appendChild(d);}
    return d;
  };
  // a faixa de sincronizacao de verdade, que le _falhasEnvio
  window.montarFaixa=()=>{
    let el=document.getElementById('syncAlerta');
    if(!el){el=document.createElement('div');el.id='syncAlerta';document.body.appendChild(el);}
    el.hidden=true;el.className='sync-alerta';el.innerHTML='';
    return el;
  };
  window.faixa=()=>{
    const el=document.getElementById('syncAlerta');
    return {escondida:!el||el.hidden===true, classe:el?el.className:'', texto:el?(el.textContent||'').replace(/\s+/g,' ').trim():''};
  };
}

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  const pg=await ctx.newPage();
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);
  await pg.evaluate(montarFake);

  linha();console.log('=== CHECK 1: O CASO VIVO -- uma tarefa CHEIA (20 fotos, o maxFotos) ===');
  const r1=await pg.evaluate(async()=>{
    zerar();
    const fotos=[];for(let i=0;i<20;i++)fotos.push(fotoFalsa(55,'a'+i));
    setTarefas([{id:'tf1',nome:'Limpeza de dutos',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'andamento',criada:'2026-09-26T08:00:00.000Z',fotos,nota:'',checkins:[{data:'2026-09-26',hora:'08:00'}]}]);
    const localKB=kbTarefasLocal();
    await _doPush('mappo_tarefas');
    return {localKB, recusas:window.__recusas.length, nuvemKB:kbTarefasNuvem(),
            docsFoto:docsDeFoto(), estruturaTemFoto:/data:image/.test(window.__nuvem['mappo_tarefas']||'')};
  });
  console.log('  ', JSON.stringify(r1));
  assert(r1.localKB>1000,'a tarefa cheia tem mesmo mais de 1 MB de fotos ('+r1.localKB+' KB) -- passa do teto');
  assert(r1.recusas===0,'NADA foi recusado pelo servidor');
  assert(r1.docsFoto===20,'as 20 fotos viraram 20 documentos proprios');
  assert(r1.nuvemKB<5,'o documento das tarefas ficou em '+r1.nuvemKB+' KB');
  assert(r1.estruturaTemFoto===false,'nenhuma foto sobrou dentro do documento das tarefas');

  linha();console.log('=== CHECK 2: SEGUNDO APARELHO recebe as 20, como referencia ===');
  const r2=await pg.evaluate(async()=>{
    const daNuvem=window.__nuvem['mappo_tarefas'];
    setTarefas([]); _pend={};
    await fbApply('mappo_tarefas',daNuvem,Date.now());
    const t=getTarefas()[0];
    let bytesOk=0;
    for(const v of (t&&t.fotos)||[]){const x=await fotoBytes(v);if(x&&x.length>50*1024)bytesOk++;}
    return {chegou:!!t, fotos:contarFotos(t), bytes:contarBytes(t), bytesOk, localKB:kbTarefasLocal(),
            emMemoria:contarFotos((tarefas||[])[0])};
  });
  console.log('  ', JSON.stringify(r2));
  assert(r2.chegou===true,'a tarefa chegou no segundo aparelho');
  assert(r2.fotos===20,'com TODAS as 20 fotos');
  assert(r2.bytesOk===20,'e os bytes das 20 voltam INTEIROS pelo armazem');
  assert(r2.bytes===0,'nenhuma ocupa o localStorage -- viraram referencia');
  assert(r2.localKB<5,'o segundo aparelho ficou com '+r2.localKB+' KB (era '+r1.localKB+')');
  assert(r2.emMemoria===20,'e a memoria do app enxerga as 20 no lugar de sempre (tarefa.fotos)');

  linha();console.log('=== CHECK 3: MARCAR A TAREFA NAO APAGA A FOTO DO OUTRO APARELHO ===');
  /* O aparelho B tem a foto e nada pendente. A nuvem foi escrita pelo aparelho A, que marcou
     a tarefa como concluida e NAO tem a foto. Sem preservacao, o merge normal deixa o remoto
     mandar no campo `fotos` e a prova de servico executado desaparece. */
  const r3=await pg.evaluate(async()=>{
    zerar();
    const minha=fotoFalsa(55,'soB');
    setTarefas([{id:'tf1',nome:'Limpeza de dutos',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'andamento',criada:'2026-09-26T08:00:00.000Z',fotos:[minha],nota:'',checkins:[]}]);
    _pend={};                                   // B nao tem nada pendente
    const doA=JSON.stringify([{id:'tf1',nome:'Limpeza de dutos',tecnico:'Paulo',maxFotos:20,
      temNotas:true,status:'concluida',criada:'2026-09-26T08:00:00.000Z',fotos:[],nota:'',checkins:[]}]);
    await fbApply('mappo_tarefas',doA,Date.now());
    const t=getTarefas()[0];
    const bytes=await fotoBytes((t.fotos||[])[0]);
    return {fotos:contarFotos(t), status:t.status, bytesOk:!!bytes&&bytes.length>50*1024};
  });
  console.log('  ', JSON.stringify(r3));
  assert(r3.status==='concluida','o status do outro aparelho chegou (o merge funcionou)');
  assert(r3.fotos===1,'E A FOTO NAO SUMIU -- ausencia na nuvem nao apaga foto local');
  assert(r3.bytesOk===true,'e ela continua legivel');

  linha();console.log('=== CHECK 4: e a foto do outro aparelho tambem nao some daqui ===');
  /* O inverso: AQUI a tarefa foi mexida (status pendente) e a nuvem traz uma foto que este
     aparelho nunca viu. O indice de foto e UNIAO: as duas sobrevivem. */
  const r4=await pg.evaluate(async()=>{
    zerar();
    const minha=fotoFalsa(55,'daqui'), doOutro=fotoFalsa(55,'doOutro');
    const idOutro=_idFotoTarefa(doOutro);
    window.__nuvem[idOutro]=doOutro;            // a foto do outro aparelho esta na nuvem
    setTarefas([{id:'tf1',nome:'Limpeza',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'concluida',criada:'2026-09-26T08:00:00.000Z',fotos:[minha],nota:'',checkins:[]}]);
    _pend={'mappo_tarefas':{tf1:{status:1}}};   // aqui eu mexi no status
    const daNuvem=JSON.stringify([{id:'tf1',nome:'Limpeza',tecnico:'Paulo',maxFotos:20,
      temNotas:true,status:'andamento',criada:'2026-09-26T08:00:00.000Z',fotos:[idOutro],nota:'',checkins:[]}]);
    await fbApply('mappo_tarefas',daNuvem,Date.now());
    const t=getTarefas()[0];
    let ok=0;for(const v of (t.fotos||[])){const x=await fotoBytes(v);if(x&&x.length>50*1024)ok++;}
    return {fotos:contarFotos(t), legiveis:ok, status:t.status};
  });
  console.log('  ', JSON.stringify(r4));
  assert(r4.fotos===2,'as DUAS fotos sobrevivem -- o indice e uniao, nunca substituicao');
  assert(r4.legiveis===2,'e as duas sao legiveis');
  assert(r4.status==='concluida','o que foi mexido AQUI e ainda nao subiu continua vencendo');

  linha();console.log('=== CHECK 5: TROCAR a foto -- a nova sobe e substitui na nuvem ===');
  const r5=await pg.evaluate(async()=>{
    zerar();
    const velha=fotoFalsa(55,'velha');
    setTarefas([{id:'tf1',nome:'Limpeza',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'andamento',criada:'2026-09-26T08:00:00.000Z',fotos:[velha],nota:'',checkins:[]}]);
    await _doPush('mappo_tarefas');
    const antes=docsDeFoto();
    // mesma posicao recebe foto nova (a etiqueta saiu tremida, tirou de novo)
    const nova=fotoFalsa(55,'nova');
    const t=getTarefas();t[0].fotos=[nova];
    setTarefas(t);_pend={'mappo_tarefas':{tf1:{fotos:1}}};
    await _doPush('mappo_tarefas');
    const idNova=_idFotoTarefa(nova);
    return {antes, depois:docsDeFoto(), recusas:window.__recusas.length,
            novaNaNuvem:window.__nuvem[idNova]===nova,
            apontaPraNova:(_arr(window.__nuvem['mappo_tarefas'])[0].fotos||[])[0]===idNova};
  });
  console.log('  ', JSON.stringify(r5));
  assert(r5.recusas===0,'nada recusado');
  assert(r5.novaNaNuvem===true,'a foto NOVA subiu para o documento dela');
  assert(r5.apontaPraNova===true,'e a tarefa na nuvem aponta para ela');

  linha();console.log('=== CHECK 6: remover pelo X vale nos DOIS aparelhos (e nao volta) ===');
  /* A uniao e o que impede uma foto de sumir por ausencia. Mas remocao explicita e PEDIDO do
     usuario, nao ausencia -- sem a marca `__fx` o outro celular devolveria a foto no merge
     seguinte e o X pararia de funcionar. */
  const r6=await pg.evaluate(async()=>{
    zerar();
    const f1=fotoFalsa(55,'fica'), f2=fotoFalsa(55,'sai');
    setTarefas([{id:'tf1',nome:'Limpeza',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'andamento',criada:'2026-09-26T08:00:00.000Z',fotos:[f1,f2],nota:'',checkins:[]}]);
    await _doPush('mappo_tarefas');
    // o tecnico remove a segunda pelo X
    execTarefaId='tf1';
    const confirmAntes=window.confirm; window.confirm=()=>true;
    try{tarefaRemoverFoto(1);}finally{window.confirm=confirmAntes;}
    const depoisDeRemover=contarFotos(getTarefas()[0]);
    await _doPush('mappo_tarefas');
    // e agora o outro aparelho, que AINDA tem as duas, manda a versao dele
    const daNuvem=window.__nuvem['mappo_tarefas'];
    _pend={};
    await fbApply('mappo_tarefas',daNuvem,Date.now());
    const t=getTarefas()[0];
    return {depoisDeRemover, agora:contarFotos(t), naNuvem:(_arr(daNuvem)[0].fotos||[]).length,
            marcou:(t.__fx||[]).length};
  });
  console.log('  ', JSON.stringify(r6));
  assert(r6.depoisDeRemover===1,'o X removeu a foto aqui');
  assert(r6.naNuvem===1,'e a remocao subiu para a nuvem');
  assert(r6.marcou===1,'a remocao ficou registrada (e uniao, nunca encolhe)');
  assert(r6.agora===1,'A FOTO REMOVIDA NAO VOLTOU no merge seguinte');

  linha();console.log('=== CHECK 7: O HANDLER REAL DA CAMERA (nao uma copia do corpo dele) ===');
  /* Dispara o <input type=file> da tela de execucao com um JPEG de verdade e deixa
     setupTarefaCam -> vrfComprimirImagem -> guardarFotoNoAparelho rodarem de ponta a ponta.
     Sem este check, reverter `t.fotos.push(valor)` para `push(b64)` deixava tudo verde. */
  const r7=await pg.evaluate(async()=>{
    zerar();
    setTarefas([{id:'tf1',nome:'Limpeza',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'pendente',criada:'2026-09-26T08:00:00.000Z',fotos:[],nota:'',checkins:[]}]);
    execTarefaId='tf1';
    const alvo=telaDeTeste();
    alvo.innerHTML=renderExecTarefa(getExecTarefa());
    setupTarefaCam();
    await dispararCamera('tarefaCamInput',900);
    const chegou=await esperarPor(()=>(getExecTarefa().fotos||[]).length===1);
    const t=getExecTarefa();
    const v=(t.fotos||[])[0];
    const bytes=v?await fotoBytes(v):null;
    return {chegou, ehReferencia:_ehReferenciaDeFoto(v), temBytesInline:_ehFotoDeVerdade(v),
            bytesOk:!!bytes&&bytes.slice(0,11)==='data:image/'&&bytes.length>5000,
            localKB:kbTarefasLocal(), status:t.status,
            gravadoNoDisco:(JSON.parse(localStorage.getItem('mappo_tarefas'))[0].fotos||[])[0]===v};
  });
  console.log('  ', JSON.stringify(r7));
  assert(r7.chegou===true,'o handler real da camera rodou e a foto entrou na tarefa');
  assert(r7.ehReferencia===true,'O QUE ELE GUARDOU E A REFERENCIA, nao os bytes');
  assert(r7.temBytesInline===false,'nenhum byte inline ficou na tarefa');
  assert(r7.bytesOk===true,'e os bytes estao no armazem, legiveis e sendo uma imagem de verdade');
  assert(r7.gravadoNoDisco===true,'a referencia foi gravada no localStorage, nao so na memoria');
  assert(r7.localKB<5,'o aparelho ficou com '+r7.localKB+' KB');
  assert(r7.status==='andamento','e a tarefa passou a "em andamento" como antes');

  linha();console.log('=== CHECK 7b: dois toques rapidos nao passam do maximo ===');
  const r7b=await pg.evaluate(async()=>{
    const t=getExecTarefa();
    t.maxFotos=2;t.fotos=[t.fotos[0]];saveTarefas();
    const alvo=telaDeTeste();
    alvo.innerHTML=renderExecTarefa(getExecTarefa());
    setupTarefaCam();
    await dispararCamera('tarefaCamInput',700);
    await esperarPor(()=>(getExecTarefa().fotos||[]).length===2);
    // terceira: passa do maximo e tem que ser recusada
    alvo.innerHTML=renderExecTarefa(getExecTarefa());
    setupTarefaCam();
    await dispararCamera('tarefaCamInput',700);
    await new Promise(r=>setTimeout(r,1200));
    return {quantas:(getExecTarefa().fotos||[]).length, max:getExecTarefa().maxFotos};
  });
  console.log('  ', JSON.stringify(r7b));
  assert(r7b.quantas===2,'parou no maximo de 2, nao gravou a terceira');

  linha();console.log('=== CHECK 8: referencia de tarefa perdida NAO some calada ===');
  const r8=await pg.evaluate(async()=>{
    ligarPintorDeFotos();            // e o que o app faz ao entrar (entrarApp)
    const inexistente='mappo_fototarefa__zzz_zzz';
    const bytes=await fotoBytes(inexistente);
    const d=document.createElement('div');
    d.innerHTML=imgFoto(inexistente,'');
    document.body.appendChild(d);
    await new Promise(r=>setTimeout(r,500));
    const img=d.querySelector('img');
    return {bytes, avisou:img.classList.contains('foto-ausente'), alt:img.alt};
  });
  console.log('  ', JSON.stringify(r8));
  assert(r8.bytes===null,'foto que nao existe devolve nada, sem quebrar');
  assert(r8.avisou===true,'e a tela MOSTRA que faltou, em vez de fingir que esta tudo bem');

  linha();console.log('=== CHECK 9: REMOVER E TIRAR A MESMA FOTO DE NOVO -- ela FICA ===');
  /* O id vem do CONTEUDO, entao a mesma foto tem o mesmo id da que foi removida. A lapide
     `__fx` e uniao e nunca encolhia: a foto nova era descartada no merge seguinte, sem toast e
     sem log. Era o mecanismo contra apagamento silencioso CAUSANDO um. */
  const r9=await pg.evaluate(async()=>{
    zerar();
    const foto=fotoFalsa(55,'arrependimento');
    const id=_idFotoTarefa(foto);
    setTarefas([{id:'tf1',nome:'Limpeza',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'andamento',criada:'2026-09-26T08:00:00.000Z',fotos:[foto],nota:'',checkins:[]}]);
    await _doPush('mappo_tarefas');
    // remove por engano
    execTarefaId='tf1';
    const confirmAntes=window.confirm; window.confirm=()=>true;
    try{tarefaRemoverFoto(0);}finally{window.confirm=confirmAntes;}
    await _doPush('mappo_tarefas');
    const removida=(getTarefas()[0].fotos||[]).length;
    const lapideNaNuvem=(_arr(window.__nuvem['mappo_tarefas'])[0].__fx||[]).indexOf(id)>=0;
    // tira A MESMA foto de novo, pelo caminho real
    const alvo=telaDeTeste();
    alvo.innerHTML=renderExecTarefa(getExecTarefa());
    setupTarefaCam();
    const t=getExecTarefa();
    let valor=foto;
    try{valor=await guardarFotoNoAparelho(id,foto);}catch(e){}
    _readicionarFotoTarefa(t,id);
    t.fotos.push(valor);saveTarefas();
    const antesDoMerge=(getTarefas()[0].fotos||[]).length;
    // e agora a nuvem devolve a lapide
    await _doPush('mappo_tarefas');
    await fbApply('mappo_tarefas',window.__nuvem['mappo_tarefas'],Date.now());
    const t2=getTarefas()[0];
    const bytes=(t2.fotos||[])[0]?await fotoBytes(t2.fotos[0]):null;
    return {removida, lapideNaNuvem, antesDoMerge, depoisDoMerge:contarFotos(t2),
            legivel:!!bytes&&bytes.length>50*1024, lapideAinda:(t2.__fx||[]).indexOf(id)>=0};
  });
  console.log('  ', JSON.stringify(r9));
  assert(r9.removida===0,'a remocao funcionou');
  assert(r9.lapideNaNuvem===true,'e virou lapide na nuvem (e o que faz o X valer nos dois aparelhos)');
  assert(r9.antesDoMerge===1,'a mesma foto foi tirada de novo e entrou');
  assert(r9.depoisDoMerge===1,'E CONTINUA LA depois do merge -- a lapide nao a apaga mais');
  assert(r9.legivel===true,'e ela e legivel');
  assert(r9.lapideAinda===false,'a lapide dela foi desfeita, como pede o ato de readicionar');

  linha();console.log('=== CHECK 9b: LAPIDE VELHA DESTE APARELHO nao mata a foto readicionada ===');
  /* O aparelho B removeu a foto (lapide no `__fx` local dele). O aparelho A a readicionou e
     limpou a lapide na nuvem. Se B UNISSE a lapide velha dele com a da nuvem, a foto de A
     morreria aqui -- em silencio -- e B empurraria a lapide de volta. Sem pendencia local, a
     nuvem manda: e a mesma regra que o _mergeItens usa para todo outro campo. */
  const r9b=await pg.evaluate(async()=>{
    zerar();
    const foto=fotoFalsa(55,'readicionada-por-A');
    const id=_idFotoTarefa(foto);
    await guardarFotoNoAparelho(id,foto);
    // B: lapide velha, JA confirmada (nada pendente)
    setTarefas([{id:'tf1',nome:'Limpeza',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'andamento',criada:'2026-09-26T08:00:00.000Z',fotos:[],nota:'',checkins:[],__fx:[id]}]);
    _pend={};
    // a nuvem, escrita por A: a foto de volta e a lapide desfeita
    const deA=JSON.stringify([{id:'tf1',nome:'Limpeza',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'andamento',criada:'2026-09-26T08:00:00.000Z',fotos:[id],nota:'',checkins:[]}]);
    await fbApply('mappo_tarefas',deA,Date.now());
    const t=getTarefas()[0];
    const bytes=(t.fotos||[])[0]?await fotoBytes(t.fotos[0]):null;
    return {fotos:contarFotos(t), lapideAinda:(t.__fx||[]).indexOf(id)>=0,
            legivel:!!bytes&&bytes.length>50*1024};
  });
  console.log('  ', JSON.stringify(r9b));
  assert(r9b.fotos===1,'A FOTO READICIONADA SOBREVIVEU a lapide velha deste aparelho');
  assert(r9b.lapideAinda===false,'e a lapide velha foi soltada, nao empurrada de volta');
  assert(r9b.legivel===true,'e a foto e legivel');

  linha();console.log('=== CHECK 10: gravacao falhando NAO marca a migracao como feita ===');
  /* `saveTarefas` e localStorage.setItem cru, e QuotaExceededError ali e o caso MAIS provavel:
     aparelho cheio e a motivacao inteira desta entrega. Sem contar isso como erro, a marca era
     gravada e o aparelho nunca mais tentava migrar -- espaco nunca liberado, em silencio. */
  const r10=await pg.evaluate(async()=>{
    zerar();
    try{localStorage.removeItem('mappo_fotos_idb_ot');}catch(e){}
    setTarefas([{id:'tf1',nome:'Limpeza',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'andamento',criada:'2026-09-26T08:00:00.000Z',
      fotos:[fotoFalsa(55,'m1'),fotoFalsa(55,'m2')],nota:'',checkins:[]}]);
    vrfFotos={};
    _quietWrite=true;localStorage.setItem('mappo_vrf_fotos','{}');_quietWrite=false;
    const original=window.saveTarefas;
    window.saveTarefas=()=>{const e=new Error('cota do aparelho estourada');e.name='QuotaExceededError';throw e;};
    let r,erro=null;
    try{r=await migrarFotosObraETarefaParaOArmazem();}catch(e){erro=e.message;}
    window.saveTarefas=original;
    let marcou=false;try{marcou=localStorage.getItem('mappo_fotos_idb_ot')==='1';}catch(e){}
    return {erro,movidas:r&&r.movidas,erros:r&&r.erros,marcou};
  });
  console.log('  ', JSON.stringify(r10));
  assert(r10.erro===null,'a gravacao falhando nao derruba a migracao');
  assert(r10.movidas===2,'as fotos foram para o armazem (isso funcionou)');
  assert(r10.erros>=1,'MAS a falha de gravacao foi CONTADA como erro');
  assert(r10.marcou===false,'e a marca de migrado NAO foi gravada: a proxima abertura tenta de novo');

  linha();console.log('=== CHECK 11: foto que nao sobe ACENDE A FAIXA (nao so uma linha de log) ===');
  /* A estrutura sobe apontando para foto que nao esta na nuvem -- inevitavel, uma foto nao pode
     travar as outras. O que nao pode e a sincronizacao se dizer em dia: o outro aparelho mostra
     "Foto nao encontrada" para sempre e ninguem fica sabendo. */
  const r11=await pg.evaluate(async()=>{
    zerar();montarFaixa();
    delete _falhasEnvio['mappo_tarefas'];_chavesQuaseCheias={};
    // referencia cujos bytes NAO existem em lugar nenhum
    const fantasma='mappo_fototarefa__naoexiste_naoexiste';
    setTarefas([{id:'tf1',nome:'Limpeza',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'andamento',criada:'2026-09-26T08:00:00.000Z',fotos:[fantasma],nota:'',checkins:[]}]);
    await _doPush('mappo_tarefas');
    const f=faixa();
    return {subiuEstrutura:!!window.__nuvem['mappo_tarefas'], docsFoto:docsDeFoto(),
            falhaRegistrada:!!_falhasEnvio['mappo_tarefas'],
            mensagem:(_falhasEnvio['mappo_tarefas']||{}).erro||'',
            faixaEscondida:f.escondida, faixaTexto:f.texto};
  });
  console.log('  ', JSON.stringify(r11));
  assert(r11.docsFoto===0,'a foto fantasma nao subiu (nao havia bytes)');
  assert(r11.subiuEstrutura===true,'a estrutura subiu -- uma foto nao trava as outras');
  assert(r11.falhaRegistrada===true,'MAS a falha ficou registrada, em vez de passar por "enviado"');
  assert(/foto/i.test(r11.mensagem),'e a mensagem diz o que aconteceu: '+r11.mensagem);
  assert(r11.faixaEscondida===false,'E A FAIXA DE SINCRONIZACAO ACENDEU na tela');

  linha();console.log('=== CHECK 12: foto acima de 1 MiB tambem acende a faixa ===');
  const r12=await pg.evaluate(async()=>{
    zerar();montarFaixa();
    delete _falhasEnvio['mappo_tarefas'];_chavesQuaseCheias={};
    const gigante=fotoFalsa(1100,'gigante');    // acima do teto do documento
    setTarefas([{id:'tf1',nome:'Limpeza',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'andamento',criada:'2026-09-26T08:00:00.000Z',
      fotos:[gigante,fotoFalsa(55,'normal')],nota:'',checkins:[]}]);
    await _doPush('mappo_tarefas');
    const f=faixa();
    return {docsFoto:docsDeFoto(), recusas:window.__recusas.length,
            falhaRegistrada:!!_falhasEnvio['mappo_tarefas'],
            mensagem:(_falhasEnvio['mappo_tarefas']||{}).erro||'', faixaEscondida:f.escondida};
  });
  console.log('  ', JSON.stringify(r12));
  assert(r12.recusas===0,'a foto gigante foi barrada ANTES do servidor, sem recusa');
  assert(r12.docsFoto===1,'a foto normal subiu mesmo assim -- uma nao trava a outra');
  assert(r12.falhaRegistrada===true,'e a que nao cabe ficou registrada como falha');
  assert(/KB/.test(r12.mensagem),'com o tamanho na mensagem: '+r12.mensagem);
  assert(r12.faixaEscondida===false,'a faixa acendeu');

  linha();console.log('=== CHECK 13: confirmacao MAGRO-contra-MAGRO (sem reenvio em laco) ===');
  /* Confirmar contra o local (que tem as referencias resolvidas) deixaria a chave pendente
     PARA SEMPRE, reenviando sem parar. Os outros checks nao pegariam: o conteudo final fica
     certo de qualquer jeito. Aqui a prova e a PENDENCIA ter sido solta. */
  const r13=await pg.evaluate(async()=>{
    zerar();
    setTarefas([{id:'tf1',nome:'Limpeza',tecnico:'Paulo',maxFotos:20,temNotas:true,
      status:'andamento',criada:'2026-09-26T08:00:00.000Z',
      fotos:[fotoFalsa(55,'c1'),fotoFalsa(55,'c2')],nota:'',checkins:[]}]);
    _pend={'mappo_tarefas':{tf1:{'*':1}}};
    await _doPush('mappo_tarefas');
    const pendDepois=Object.keys((_pend['mappo_tarefas']||{})).length;
    // segundo envio, sem nenhuma mudanca: nao pode escrever o documento de novo
    const antes=JSON.stringify(window.__nuvem);
    await _doPush('mappo_tarefas');
    return {pendDepois, mudouNaNuvem:JSON.stringify(window.__nuvem)!==antes,
            temPend:_temPend('mappo_tarefas')};
  });
  console.log('  ', JSON.stringify(r13));
  assert(r13.pendDepois===0,'a pendencia foi SOLTA depois do envio (magro comparado com magro)');
  assert(r13.temPend===false,'a chave nao ficou pendente para sempre');

  linha();console.log('=== CHECK 14: tarefa SEM id tem as fotos extraidas ===');
  const r14=await pg.evaluate(()=>{
    const semId={nome:'Anomala',maxFotos:20,fotos:[fotoFalsa(55,'semid')],status:'andamento'};
    const {slim,fotos}=_separarFotosTarefa([semId]);
    return {fotosExtraidas:fotos.length,
            sobrouBytes:/data:image/.test(JSON.stringify(slim))};
  });
  console.log('  ', JSON.stringify(r14));
  assert(r14.fotosExtraidas===1,'a foto foi extraida mesmo sem id na tarefa');
  assert(r14.sobrouBytes===false,'e nao sobrou byte nenhum no documento (nao volta a contar pro 1 MiB)');

  linha();console.log('=== CHECK 15: bytes INLINE vindos da nuvem viram referencia ===');
  /* Aparelho com aba antiga ainda manda a foto DENTRO da tarefa. Deixar os bytes como vieram
     os gravaria no localStorage e reabriria o teto de ~5 MB que esta entrega fecha. */
  const r15=await pg.evaluate(async()=>{
    zerar();
    setTarefas([]);
    const inline=fotoFalsa(55,'aba-antiga');
    const daNuvem=JSON.stringify([{id:'tf9',nome:'Antiga',tecnico:'Paulo',maxFotos:20,
      temNotas:true,status:'andamento',criada:'2026-09-26T08:00:00.000Z',fotos:[inline],nota:'',checkins:[]}]);
    await fbApply('mappo_tarefas',daNuvem,Date.now());
    const t=getTarefas()[0];
    const v=(t&&t.fotos||[])[0];
    const bytes=v?await fotoBytes(v):null;
    return {chegou:!!t, ehReferencia:_ehReferenciaDeFoto(v), bytesOk:!!bytes&&bytes.length>50*1024,
            localKB:kbTarefasLocal(), bytesNoDisco:/data:image/.test(localStorage.getItem('mappo_tarefas')||'')};
  });
  console.log('  ', JSON.stringify(r15));
  assert(r15.chegou===true,'a tarefa com foto embutida chegou');
  assert(r15.ehReferencia===true,'os bytes foram para o armazem e ficou a referencia');
  assert(r15.bytesOk===true,'e continuam legiveis');
  assert(r15.bytesNoDisco===false,'nenhum byte foi gravado no localStorage');
  assert(r15.localKB<5,'o aparelho ficou com '+r15.localKB+' KB');

  linha();console.log('=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  linha();console.log('TODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
