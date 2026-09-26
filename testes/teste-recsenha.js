const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:900,height:900}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);

  // Firebase Auth de mentira: registra o que foi pedido, sem mandar e-mail nenhum
  const fake=()=>{
    window.__enviados=[]; window.__erroProx=null;
    window.firebase={auth:()=>({
      sendPasswordResetEmail:async(em)=>{
        if(window.__erroProx){const e=window.__erroProx;window.__erroProx=null;throw e;}
        window.__enviados.push(em);
      }
    })};
  };

  console.log('\n=== CHECK 1: o link existe na tela de login ===');
  await pg.evaluate(()=>{const s=document.getElementById('splashScreen');if(s)s.remove();mostrarLogin();});
  const temLink=await pg.locator('#loginBox a', {hasText:'Esqueci minha senha'}).count();
  assert(temLink===1,'link "Esqueci minha senha" esta na tela de login');

  console.log('\n=== CHECK 2: abre a tela e reaproveita o e-mail ja digitado ===');
  await pg.evaluate(fake);
  await pg.fill('#loginEmail','paulo@elitear.com');
  await pg.evaluate(()=>mostrarRecuperarSenha());
  await pg.waitForTimeout(120);
  const est=await pg.evaluate(()=>({
    visivel:document.getElementById('recuperarBox').style.display!=='none',
    loginEscondido:document.getElementById('loginBox').style.display==='none',
    email:document.getElementById('recEmail').value
  }));
  assert(est.visivel&&est.loginEscondido,'a tela de recuperacao aparece e a de login some');
  assert(est.email==='paulo@elitear.com','o e-mail digitado no login veio preenchido');

  console.log('\n=== CHECK 3: e-mail invalido nao chama o Firebase ===');
  const inval=await pg.evaluate(async()=>{
    document.getElementById('recEmail').value='naoehemail';
    await enviarRecuperacaoSenha();
    return {enviados:window.__enviados.length, toast:document.getElementById('toast').textContent};
  });
  assert(inval.enviados===0,'nao chamou o envio com e-mail invalido');
  assert(/v[aá]lido/i.test(inval.toast),'avisou que o e-mail e invalido');

  console.log('\n=== CHECK 4: envio real chama o Firebase e confirma INLINE ===');
  const env=await pg.evaluate(async()=>{
    document.getElementById('recEmail').value='paulo@elitear.com';
    await enviarRecuperacaoSenha();
    return {enviados:window.__enviados.slice(),
            formEscondido:document.getElementById('recFormulario').style.display==='none',
            confirmVisivel:document.getElementById('recEnviado').style.display!=='none',
            eco:document.getElementById('recEmailEco').textContent,
            temModal:!!document.getElementById('curOverlay')};
  });
  assert(env.enviados.length===1&&env.enviados[0]==='paulo@elitear.com','o Firebase foi chamado com o e-mail certo');
  assert(env.formEscondido&&env.confirmVisivel,'a confirmacao aparece no lugar do formulario');
  assert(env.eco==='paulo@elitear.com','a confirmacao ecoa o e-mail informado');
  assert(env.temModal===false,'NAO usa modal (ficaria atras da tela de login, z-index 200 vs 1000)');

  console.log('\n=== CHECK 5: conta inexistente da a MESMA resposta (nao revela cadastro) ===');
  const inexistente=await pg.evaluate(async()=>{
    mostrarRecuperarSenha();
    window.__erroProx={code:'auth/user-not-found',message:'nao existe'};
    document.getElementById('recEmail').value='naotem@exemplo.com';
    await enviarRecuperacaoSenha();
    return {confirmVisivel:document.getElementById('recEnviado').style.display!=='none',
            eco:document.getElementById('recEmailEco').textContent,
            toast:document.getElementById('toast').textContent};
  });
  assert(inexistente.confirmVisivel===true,'mostra a MESMA confirmacao de sucesso');
  assert(inexistente.eco==='naotem@exemplo.com','ecoando o e-mail pedido');
  assert(!/n[aã]o (existe|encontrad)/i.test(inexistente.toast),'em nenhum momento diz que a conta nao existe');

  console.log('\n=== CHECK 6: erros que NAO vazam nada aparecem pro usuario ===');
  const muitas=await pg.evaluate(async()=>{
    mostrarRecuperarSenha();
    window.__erroProx={code:'auth/too-many-requests',message:'limite'};
    document.getElementById('recEmail').value='paulo@elitear.com';
    await enviarRecuperacaoSenha();
    return {toast:document.getElementById('toast').textContent,
            aindaNoForm:document.getElementById('recFormulario').style.display!=='none',
            btn:document.getElementById('btnRecuperar').disabled};
  });
  assert(/muitas tentativas/i.test(muitas.toast),'avisa sobre excesso de tentativas');
  assert(muitas.aindaNoForm===true,'mantem o formulario para tentar de novo');
  assert(muitas.btn===false,'o botao volta a funcionar');

  console.log('\n=== CHECK 7: reabrir a tela volta ao formulario ===');
  const reabre=await pg.evaluate(async()=>{
    document.getElementById('recEmail').value='paulo@elitear.com';
    await enviarRecuperacaoSenha();
    const depoisEnvio=document.getElementById('recEnviado').style.display!=='none';
    mostrarLogin(); mostrarRecuperarSenha();
    return {depoisEnvio, formDeVolta:document.getElementById('recFormulario').style.display!=='none',
            confirmSumiu:document.getElementById('recEnviado').style.display==='none'};
  });
  assert(reabre.depoisEnvio===true,'confirmou o envio');
  assert(reabre.formDeVolta&&reabre.confirmSumiu,'ao reabrir, volta ao formulario em vez da confirmacao antiga');

  console.log('\n=== CHECK 8: voltar ao login funciona e esconde a recuperacao ===');
  const volta=await pg.evaluate(()=>{mostrarLogin();return{
    login:document.getElementById('loginBox').style.display!=='none',
    rec:document.getElementById('recuperarBox').style.display==='none'};});
  assert(volta.login&&volta.rec,'volta pro login e a tela de recuperacao some');

  console.log('\n=== CHECK 9: o e-mail nao vai parar no log de diagnostico ===');
  const log=await pg.evaluate(()=>_fbLogs.map(l=>l.msg).join(' | '));
  assert(!/paulo@elitear\.com/.test(log),'o e-mail nao e gravado no log');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
