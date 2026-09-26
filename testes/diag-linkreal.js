/* Abre o link publico REAL de producao e captura o motivo verdadeiro do "expirado". */
const { chromium } = require('playwright');
const URL='https://inteligenciaartificial341-code.github.io/MAPPO/#/ac/elite-ar-solucoes-em-refrigeracao-termic/5336jqh5ba';
(async()=>{
  const b=await chromium.launch();
  const pg=await b.newPage({viewport:{width:420,height:820}});
  const logs=[];
  pg.on('console',m=>logs.push('['+m.type()+'] '+m.text().slice(0,240)));
  pg.on('pageerror',e=>logs.push('[pageerror] '+e.message.slice(0,240)));
  pg.on('requestfailed',r=>{
    const u=r.url();
    if(/firestore|identitytoolkit|googleapis/.test(u))
      logs.push('[req-falhou] '+u.slice(0,110)+' :: '+(r.failure()&&r.failure().errorText));
  });
  pg.on('response',async r=>{
    const u=r.url();
    if(/identitytoolkit|signupNewUser|accounts:signUp/.test(u)){
      let corpo=''; try{corpo=(await r.text()).slice(0,300);}catch(e){}
      logs.push('[AUTH '+r.status()+'] '+u.split('?')[0].slice(-60)+'  '+corpo.replace(/\s+/g,' '));
    }
  });

  await pg.goto(URL,{waitUntil:'load'});
  await pg.waitForTimeout(9000);

  const tela=await pg.evaluate(()=>{
    const pub=document.getElementById('pubScreen');
    return {
      textoNaTela:(pub?pub.innerText:document.body.innerText).replace(/\s+/g,' ').trim().slice(0,220),
      autenticado:(window.firebase&&firebase.auth&&firebase.auth().currentUser)
        ? {uid:firebase.auth().currentUser.uid, anonimo:firebase.auth().currentUser.isAnonymous} : null,
      logsApp:(typeof _fbLogs!=='undefined'?_fbLogs.map(l=>l.tipo+': '+l.msg).slice(-10):[])
    };
  });

  console.log('\n=== O QUE O CLIENTE VE ===');
  console.log(' ', tela.textoNaTela);
  console.log('\n=== AUTENTICACAO ANONIMA ===');
  console.log(' ', tela.autenticado ? JSON.stringify(tela.autenticado) : 'NAO AUTENTICADO');
  console.log('\n=== LOG INTERNO DO APP ===');
  tela.logsApp.forEach(l=>console.log('  '+l.slice(0,180)));
  console.log('\n=== REDE / CONSOLE ===');
  logs.slice(-14).forEach(l=>console.log('  '+l));

  await pg.screenshot({path:'linkreal.png'});
  await b.close();
})();
