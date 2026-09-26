/* O link publico NAO pode derrubar a sessao do gestor.
   Reproduz o ciclo relatado: entrar -> gerar link -> abrir link -> "entre de novo". */
const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }

/* Firebase de mentira que se comporta como o real no ponto que importa:
   signInAnonymously() TROCA o usuario atual. */
function stubFirebase(){
  window.__chamouAnonimo=0;
  window.__usuario=null;      // quem esta autenticado neste "navegador"
  window.__cb=null;
  window.firebase={
    initializeApp:()=>({}),
    firestore:Object.assign(()=>({collection:()=>({doc:()=>({collection:()=>({doc:()=>({})})})})}),
      {FieldValue:{serverTimestamp:()=>Date.now()},FieldPath:{documentId:()=>'__name__'}}),
    auth:()=>({
      get currentUser(){return window.__usuario;},
      onAuthStateChanged:(cb)=>{window.__cb=cb;setTimeout(()=>cb(window.__usuario),0);},
      signInAnonymously:async()=>{
        window.__chamouAnonimo++;
        window.__usuario={uid:'anon-'+window.__chamouAnonimo,isAnonymous:true};
        if(window.__cb)window.__cb(window.__usuario);
        return {user:window.__usuario};
      },
      signOut:async()=>{window.__usuario=null;}
    })
  };
  fbApp=null; fbReady=false; WORKSPACE=null;   // permite reinicializar
}

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage();
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);
  await pg.evaluate('window.stubFirebase = '+stubFirebase.toString());

  console.log('\n=== CHECK 1: O CICLO RELATADO -- gestor logado abre o link do cliente ===');
  const r1=await pg.evaluate(async()=>{
    stubFirebase();
    window.__usuario={uid:'uid-paulo',isAnonymous:false};   // gestor logado de verdade
    let pronto=false;
    fbInit({anon:true,onReady:()=>{pronto=true;},onNoUser:()=>{}});
    await new Promise(r=>setTimeout(r,120));
    return {chamouAnonimo:window.__chamouAnonimo, usuarioAgora:window.__usuario,
            fbReady, pronto};
  });
  console.log('  ', JSON.stringify(r1));
  assert(r1.chamouAnonimo===0,'o link publico NAO cria identidade anonima quando ja ha sessao');
  assert(r1.usuarioAgora.uid==='uid-paulo'&&r1.usuarioAgora.isAnonymous===false,'A SESSAO DO GESTOR CONTINUA INTACTA');
  assert(r1.fbReady===true&&r1.pronto===true,'e o link publico abre normalmente com ela');

  console.log('\n=== CHECK 2: visitante de verdade (sem sessao) ganha identidade anonima ===');
  const r2=await pg.evaluate(async()=>{
    stubFirebase();
    window.__usuario=null;                                   // cliente, outro aparelho
    let pronto=false;
    fbInit({anon:true,onReady:()=>{pronto=true;},onNoUser:()=>{}});
    await new Promise(r=>setTimeout(r,150));
    return {chamouAnonimo:window.__chamouAnonimo, anonimo:!!(window.__usuario&&window.__usuario.isAnonymous), fbReady, pronto};
  });
  console.log('  ', JSON.stringify(r2));
  assert(r2.chamouAnonimo===1,'cria a identidade anonima exatamente uma vez');
  assert(r2.anonimo===true&&r2.pronto===true,'o cliente consegue abrir o link');

  console.log('\n=== CHECK 3: sessao anonima ja existente e reaproveitada ===');
  const r3=await pg.evaluate(async()=>{
    stubFirebase();
    window.__usuario={uid:'anon-antigo',isAnonymous:true};
    fbInit({anon:true,onReady:()=>{},onNoUser:()=>{}});
    await new Promise(r=>setTimeout(r,120));
    return {chamouAnonimo:window.__chamouAnonimo, uid:window.__usuario.uid};
  });
  assert(r3.chamouAnonimo===0&&r3.uid==='anon-antigo','nao cria outra identidade a toa');

  console.log('\n=== CHECK 4: no APP, sessao anonima continua nao dando acesso ===');
  const r4=await pg.evaluate(async()=>{
    stubFirebase();
    window.__usuario={uid:'anon-x',isAnonymous:true};
    let semUsuario=false;
    fbInit({onReady:()=>{},onNoUser:()=>{semUsuario=true;},onNoAccess:()=>{}});
    await new Promise(r=>setTimeout(r,120));
    return {semUsuario, fbReady};
  });
  assert(r4.semUsuario===true&&r4.fbReady===false,'identidade anonima nao entra no app autenticado');

  console.log('\n=== CHECK 5: no APP sem ninguem autenticado, NAO cria anonimo ===');
  const r5=await pg.evaluate(async()=>{
    stubFirebase();
    window.__usuario=null;
    let semUsuario=false;
    fbInit({onReady:()=>{},onNoUser:()=>{semUsuario=true;},onNoAccess:()=>{}});
    await new Promise(r=>setTimeout(r,120));
    return {chamouAnonimo:window.__chamouAnonimo, semUsuario};
  });
  assert(r5.chamouAnonimo===0,'o app nunca cria identidade anonima sozinho');
  assert(r5.semUsuario===true,'e manda para o login, como deve');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
