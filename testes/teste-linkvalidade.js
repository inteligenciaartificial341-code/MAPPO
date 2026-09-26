/* O link do cliente precisa ABRIR durante toda a validade.
   Reproduz o defeito de fef662a: setTimeout estoura acima de ~24,8 dias e dispara na hora,
   entao TODO link de 30 dias nascia mostrando "Link expirado" com o dado intacto no servidor. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }

const DIA=86400000;
/* Firestore de mentira: devolve um doc pub_ com o expiraEm que o teste mandar. */
function montarFake(){
  window.__doc=null;
  window.__erro=null;
  fbDB={collection:()=>({doc:()=>({collection:()=>({doc:()=>({
    onSnapshot:(cb,errCb)=>{
      if(window.__erro){setTimeout(()=>errCb(window.__erro),0);return()=>{};}
      setTimeout(()=>cb({exists:window.__doc!==null,data:()=>window.__doc}),0);
      return()=>{};
    }
  })})})})};
  fbReady=true;
  window.telaDoCliente=()=>{
    const b=document.getElementById('pubScreen');
    return b?b.innerText.replace(/\s+/g,' ').trim():'(sem tela)';
  };
  window.prepararTela=()=>{
    const v=document.getElementById('pubScreen');if(v)v.remove();
    const box=document.createElement('div');box.id='pubScreen';
    box.innerHTML='<div class="pub-wrap"><div class="pub-load">Carregando...</div></div>';
    document.body.appendChild(box);
  };
  window.payloadFalso=()=>JSON.stringify({
    cliente:'Jessika Nunes Caetano',servico:'Instalacao',endereco:'rua C-28',
    data:'2026-09-23',tecnico:'Paulo',status:'andamento',checkin:'08:00',
    progresso:50,fases:[],cortadas:[],equipamentos:[],checklist:[],atualizadoEm:Date.now()
  });
}

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage();
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);
  await pg.evaluate(montarFake);

  const abrir=async(diasRestantes)=>pg.evaluate(async(d)=>{
    prepararTela();
    window.__doc={json:payloadFalso(),expiraEm:Date.now()+d*86400000};
    _pubOuvirToken('ws','tok');
    await new Promise(r=>setTimeout(r,600));   // tempo de sobra pro timer estourado disparar
    return telaDoCliente();
  },diasRestantes);

  console.log('\n=== CHECK 1: O CASO REAL -- link de 30 dias recem-gerado ===');
  const t30=await abrir(30);
  console.log('   tela:', t30.slice(0,90));
  assert(!/Link expirado/.test(t30),'link de 30 dias NAO mostra "Link expirado"');
  assert(/rua C-28/.test(t30),'o cliente ve o servico de verdade');

  console.log('\n=== CHECK 2: o teto exato do setTimeout (~24,8 dias) ===');
  for(const d of [24,25,29,30,60,365]){
    const t=await abrir(d);
    assert(!/Link expirado/.test(t),d+' dias restantes: abre normalmente');
  }

  console.log('\n=== CHECK 3: link REALMENTE vencido continua sendo barrado ===');
  const tVenc=await abrir(-1);
  console.log('   tela:', tVenc.slice(0,90));
  assert(/Link expirado/.test(tVenc),'vencido ontem mostra "Link expirado"');

  console.log('\n=== CHECK 4: expira de verdade quando o prazo chega (prazo curto) ===');
  const t4=await pg.evaluate(async()=>{
    prepararTela();
    window.__doc={json:payloadFalso(),expiraEm:Date.now()+300};  // vence em 0,3s
    _pubOuvirToken('ws','tok');
    await new Promise(r=>setTimeout(r,120));
    const antes=telaDoCliente();
    await new Promise(r=>setTimeout(r,700));
    return {antes,depois:telaDoCliente()};
  });
  assert(/rua C-28/.test(t4.antes),'antes do prazo, mostra o servico');
  assert(/Link expirado/.test(t4.depois),'passado o prazo, expira sozinho — a trava ainda funciona');

  console.log('\n=== CHECK 5: documento inexistente continua dizendo "nao encontrado" ===');
  const t5=await pg.evaluate(async()=>{
    prepararTela();window.__doc=null;_pubOuvirToken('ws','tok');
    await new Promise(r=>setTimeout(r,400));return telaDoCliente();
  });
  assert(/não encontrado|nao encontrado/i.test(t5),'endereco que nunca existiu: "Link não encontrado"');

  console.log('\n=== CHECK 6: sem prazo (link antigo) nunca expira ===');
  const t6=await pg.evaluate(async()=>{
    prepararTela();window.__doc={json:payloadFalso()};_pubOuvirToken('ws','tok');
    await new Promise(r=>setTimeout(r,600));return telaDoCliente();
  });
  assert(!/Link expirado/.test(t6),'link antigo sem expiraEm segue abrindo');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
