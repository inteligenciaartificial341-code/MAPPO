/* A tabela de espaco tem que mostrar o que vai PRO SERVIDOR, nao o que fica no aparelho.
   Desde ced6f69 as fotos da OS sobem em documentos proprios: medir o tamanho local fazia a
   tabela gritar "Ordens de servico 100%" com o documento do servidor em poucos KB. */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage();
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);

  const r=await pg.evaluate(()=>{
    // reproduz o caso do proprietario: 1 OS com fotos passando de 1 MiB no aparelho
    const foto=kb=>'data:image/jpeg;base64,'+'A'.repeat(kb*1024);
    const os=[{id:'os1',cliente:'Jessika',tipo:'Instalação',status:'concluida',
      equipamentos:[{fotoEvap:foto(180),fotoCond:foto(180)}],
      checklist:[{id:'a',label:'A',status:'ok',foto:foto(180)},
                 {id:'b',label:'B',status:'ok',foto:foto(180)},
                 {id:'c',label:'C',status:'ok',foto:foto(180)},
                 {id:'d',label:'D',status:'ok',foto:foto(180)}],
      assinatura:foto(30)}];
    _quietWrite=true;localStorage.setItem('mappo_os',JSON.stringify(os));_quietWrite=false;
    const localKB=Math.round(localStorage.getItem('mappo_os').length/1024);
    const servidorKB=Math.round(JSON.stringify(_separarFotosOS(os).slim).length/1024);
    // monta a tabela como a tela faz
    const div=document.createElement('div');div.id='diagTamanhos';document.body.appendChild(div);
    renderDiagTamanhos();
    const linha=[...div.querySelectorAll('.diag-tam')]
      .map(e=>e.textContent.replace(/\s+/g,' ').trim())
      .find(x=>/Ordens de serviço/i.test(x))||'(sem linha)';
    const pct=parseInt((linha.match(/·\s*(\d+)%/)||[])[1]||'-1',10);
    return {localKB,servidorKB,linha,pct};
  });
  console.log('  ', JSON.stringify(r));
  assert(r.localKB>1000,'no aparelho a OS passa de 1 MB (o caso real)');
  assert(r.servidorKB<20,'mas pro servidor ela e minuscula ('+r.servidorKB+' KB)');
  // tao pequena que some da tabela (filtro de >1 KB) ou aparece com porcentagem baixa --
  // o que NAO pode e aparecer como 100%, que era o alarme falso
  assert(r.pct<10,'a tabela NAO mostra mais 100% (era o alarme falso): '+r.linha);

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
