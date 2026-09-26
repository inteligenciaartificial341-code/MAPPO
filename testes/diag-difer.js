const { chromium } = require('playwright');
const BASE='https://inteligenciaartificial341-code.github.io/MAPPO/#/ac/elite-ar-solucoes-em-refrigeracao-termic/';
const casos=[['token REAL do Paulo','5336jqh5ba'],['token INEXISTENTE','zzzzzzzzzz']];
(async()=>{
  const b=await chromium.launch();
  for(const [rotulo,tok] of casos){
    const pg=await b.newPage({viewport:{width:420,height:820}});
    const erros=[];
    pg.on('console',m=>{const t=m.text();if(/MAPPO/.test(t))erros.push(t.slice(0,150));});
    await pg.goto(BASE+tok,{waitUntil:'load'});
    await pg.waitForTimeout(9000);
    const r=await pg.evaluate(()=>{
      const pub=document.getElementById('pubScreen');
      return (pub?pub.innerText:'').replace(/\s+/g,' ').trim().slice(0,90);
    });
    console.log('\n'+rotulo+' ('+tok+')');
    console.log('  tela: '+r);
    erros.filter(e=>/negado|Falha|p[uú]blico/i.test(e)).forEach(e=>console.log('  log : '+e));
    await pg.close();
  }
  await b.close();
})();
