const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch();
  const ctx=await b.newContext({acceptDownloads:true});
  const pg=await ctx.newPage(); const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'}); await pg.waitForTimeout(400);

  // OS concluida completa: fotos de equipamento, checklist com fotos e assinatura
  await pg.evaluate(async()=>{
    session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
    _gravarTourVisto(); entrarApp(); fbReady=true; WORKSPACE='ws'; _avisouSessaoExpirada=true;
    const s=document.getElementById('splashScreen'); if(s)s.remove();
    WORKSPACE_NOME='Elite Ar Solucoes';
    const img=(cor)=>{const c=document.createElement('canvas');c.width=300;c.height=240;
      const x=c.getContext('2d');x.fillStyle=cor;x.fillRect(0,0,300,240);
      x.fillStyle='#fff';x.font='bold 28px Arial';x.fillText('FOTO',90,130);
      return c.toDataURL('image/jpeg',0.7);};
    const sig=(()=>{const c=document.createElement('canvas');c.width=600;c.height=150;
      const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,600,150);
      x.strokeStyle='#000';x.lineWidth=3;x.beginPath();
      for(let i=0;i<600;i+=8)x.lineTo(i,75+Math.sin(i/10)*30);x.stroke();
      return c.toDataURL('image/jpeg',0.7);})();
    tecnicos=[{id:'t1',nome:'Joao da Silva',ativo:true,modulos:{split:true,vrfObras:[]}}];
    osList=[{id:'os1',cliente:'Prefeitura Municipal de Pires do Rio',
      endereco:'Av. Comendador Jose Fernandes, 500 - Centro',
      tipo:'Instalacao',tecnico:'Joao da Silva',data:'2026-09-24',hora:'08:00',
      status:'concluida',qtdSplits:1,obs:'Aparelho instalado na sala de reunioes',
      checkinTime:'08:12',checkoutTime:'10:45',checkinLocal:{lat:-17.3,lng:-48.28},
      equipamentos:[{marca:'LG',modelo:'S4-W12JA3AA',fotoEvap:img('#2a7089'),fotoCond:img('#185266')}],
      checklist:checklistDoTipo('Instalacao').map((c,i)=>({...c,status:'ok',foto:i<3?img('#4a5559'):null})),
      assinatura:sig}];
  });

  console.log('\n=== CHECK 1: o botao aparece SO em OS concluida ===');
  await pg.evaluate(()=>openDetalhe('os1')); await pg.waitForTimeout(250);
  assert(await pg.locator('#curOverlay button', {hasText:'PDF para o cliente'}).count()===1,'OS concluida tem o botao de PDF');
  const semBotao=await pg.evaluate(()=>{osList[0].status='pendente';closeModal();openDetalhe('os1');
    const t=document.getElementById('curOverlay').textContent;osList[0].status='concluida';return /PDF para o cliente/.test(t);});
  assert(semBotao===false,'OS pendente NAO oferece o PDF');

  console.log('\n=== CHECK 2: gera o arquivo de verdade ===');
  await pg.evaluate(()=>{closeModal();});
  await pg.waitForTimeout(350);
  const dl=pg.waitForEvent('download',{timeout:60000});
  await pg.evaluate(()=>exportarPDFos('os1'));
  const download=await dl;
  const destino=path.join(__dirname,'os-teste.pdf');
  await download.saveAs(destino);
  const tam=fs.statSync(destino).size;
  console.log('   arquivo:', download.suggestedFilename(), '|', Math.round(tam/1024)+' KB');
  assert(/^OS_.*\.pdf$/.test(download.suggestedFilename()),'nome do arquivo identifica a OS');
  assert(tam>20000,'o PDF tem conteudo de verdade (fotos incluidas)');

  console.log('\n=== CHECK 3: o conteudo esperado esta dentro do PDF ===');
  const bruto=fs.readFileSync(destino,'latin1');
  // jsPDF grava o texto legivel no fluxo; confere os campos que importam
  const contem=(t)=>bruto.includes(t);
  assert(contem('RELATORIO DE SERVICO EXECUTADO'),'tem o titulo do relatorio');
  assert(contem('REGISTRO FOTOGRAFICO'),'tem a secao de fotos');
  assert(contem('ACEITE DO CLIENTE'),'tem a secao de assinatura');
  assert(/CHECKLIST EXECUTADO/.test(bruto),'tem o checklist executado');
  assert(bruto.includes('/Image')||bruto.includes('DCTDecode'),'as imagens foram mesmo embutidas');

  console.log('\n=== CHECK 4: OS de manutencao muda o titulo do checklist ===');
  const dl2=pg.waitForEvent('download',{timeout:60000});
  await pg.evaluate(()=>{osList[0].tipo='Manutencao preventiva';exportarPDFos('os1');});
  const d2=await dl2; const p2=path.join(__dirname,'os-manut.pdf'); await d2.saveAs(p2);
  assert(fs.readFileSync(p2,'latin1').includes('REGISTRO DA LIMPEZA'),'em manutencao vira "REGISTRO DA LIMPEZA"');

  console.log('\n=== CHECK 5: OS sem fotos e sem assinatura nao quebra ===');
  const dl3=pg.waitForEvent('download',{timeout:60000});
  await pg.evaluate(()=>{
    osList[0].tipo='Instalacao';
    osList[0].equipamentos=[{marca:'',modelo:'',fotoEvap:null,fotoCond:null}];
    osList[0].checklist=osList[0].checklist.map(c=>({...c,foto:null}));
    osList[0].assinatura=null;
    exportarPDFos('os1');
  });
  const d3=await dl3; const p3=path.join(__dirname,'os-vazia.pdf'); await d3.saveAs(p3);
  assert(fs.statSync(p3).size>1000,'gera mesmo sem foto/assinatura');
  assert(!fs.readFileSync(p3,'latin1').includes('ACEITE DO CLIENTE'),'sem assinatura, nao inventa a secao de aceite');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
