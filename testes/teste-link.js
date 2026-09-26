const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1100,height:820}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(300);
  await pg.evaluate(()=>{
    session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
    _gravarTourVisto(); entrarApp();
    const s=document.getElementById('splashScreen'); if(s)s.remove();
    fbReady=true; WORKSPACE='ws';
    window.__publicado=[];
    publicarAcompanhamento=async(tok,payload,exp)=>{window.__publicado.push({tok,exp});return true;};
    osList=[{id:'os1',cliente:'Cliente',endereco:'R',tipo:'T',tecnico:'J',data:'2026-09-24',hora:'08:00',
             status:'andamento',qtdSplits:1,equipamentos:[],checklist:[]}];
  });

  console.log('\n=== CHECK 1: primeira geracao cria token com 30 dias ===');
  const r1=await pg.evaluate(async()=>{
    await gerarLinkOS('os1');
    const os=osList[0];
    return {token:os.pubToken, dias:Math.round((os.pubExpira-Date.now())/86400000)};
  });
  assert(!!r1.token,'criou o token');
  assert(r1.dias===30,'validade de 30 dias');

  console.log('\n=== CHECK 2: gerar de novo com link VALIDO reaproveita (nao estende) ===');
  const r2=await pg.evaluate(async()=>{
    const antes={t:osList[0].pubToken,e:osList[0].pubExpira};
    await gerarLinkOS('os1');
    return {igual:osList[0].pubToken===antes.t, mesmaExp:osList[0].pubExpira===antes.e};
  });
  assert(r2.igual&&r2.mesmaExp,'link valido continua o mesmo, com o mesmo prazo');

  console.log('\n=== CHECK 3: REVOGADO -> gerar de novo emite link NOVO e funcional ===');
  const r3=await pg.evaluate(async()=>{
    const antigo=osList[0].pubToken;
    osList[0].pubExpira=Date.now();          // e o que revogarLink faz
    await gerarLinkOS('os1');
    const os=osList[0];
    return {tokenNovo:os.pubToken!==antigo, antigo, atual:os.pubToken,
            dias:Math.round((os.pubExpira-Date.now())/86400000), valido:os.pubExpira>Date.now()};
  });
  console.log('  ', JSON.stringify(r3));
  assert(r3.tokenNovo===true,'emitiu um token NOVO (o revogado nao ressuscita)');
  assert(r3.valido===true&&r3.dias===30,'o link novo nasce valido por 30 dias');

  console.log('\n=== CHECK 4: VENCIDO pelo tempo -> tambem renova ===');
  const r4=await pg.evaluate(async()=>{
    const antigo=osList[0].pubToken;
    osList[0].pubExpira=Date.now()-86400000;  // venceu ontem
    await gerarLinkOS('os1');
    return {novo:osList[0].pubToken!==antigo, valido:osList[0].pubExpira>Date.now()};
  });
  assert(r4.novo&&r4.valido,'link vencido pelo tempo tambem passa a valer de novo');

  console.log('\n=== CHECK 5: link antigo SEM prazo continua valendo (nao quebra o que existe) ===');
  const r5=await pg.evaluate(async()=>{
    osList[0].pubToken='tok-antigo'; delete osList[0].pubExpira;
    await gerarLinkOS('os1');
    return {token:osList[0].pubToken, exp:osList[0].pubExpira};
  });
  assert(r5.token==='tok-antigo','link pre-expiracao nao e trocado a toa');
  assert(r5.exp===undefined,'e continua sem prazo, como era');

  console.log('\n=== CHECK 6: o modal mostra a validade ===');
  const r6=await pg.evaluate(async()=>{
    osList[0].pubToken=null; delete osList[0].pubExpira;
    await gerarLinkOS('os1');
    return document.getElementById('curOverlay').textContent.replace(/\s+/g,' ').trim();
  });
  console.log('  ', r6.slice(0,150));
  assert(/V[aá]lido at[eé]/i.test(r6),'o modal informa ate quando o link vale');
  assert(/30 dias restantes|29 dias restantes/.test(r6),'e quantos dias faltam');

  console.log('\n=== CHECK 7: modal de link ja vencido avisa e ensina o que fazer ===');
  const r7=await pg.evaluate(()=>{
    osList[0].pubExpira=Date.now()-1000;
    abrirModalLink(osList[0].pubToken,'Cliente',true,'os','os1');
    return document.getElementById('curOverlay').textContent.replace(/\s+/g,' ').trim();
  });
  assert(/vencido ou revogado/i.test(r7),'avisa que o link esta vencido/revogado');
  assert(/emitir endere.o novo/i.test(r7),'diz o que fazer para resolver (aponta o botao que existe)');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
