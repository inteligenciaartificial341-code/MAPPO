/* Teste DIFERENCIAL no servidor real, so leitura.
   Mesmo erro (permission-denied) tem duas causas possiveis:
     (a) o documento existe e expiraEm ja passou  -> link de verdade expirado
     (b) a regra erra ao avaliar                  -> o link nunca teve chance
   Um token que com CERTEZA nunca existiu separa as duas: pela regra escrita,
   resource==null deveria PERMITIR a leitura e devolver vazio. */
const { chromium } = require('playwright');
const BASE='https://inteligenciaartificial341-code.github.io/MAPPO/';
const WS='elite-ar-solucoes-em-refrigeracao-termic';
const TOKEN='acadcxiy4m';

(async()=>{
  const b=await chromium.launch();
  const pg=await (await b.newContext()).newPage();
  await pg.goto(BASE,{waitUntil:'load',timeout:60000});
  await pg.waitForTimeout(3500);

  const r=await pg.evaluate(async({ws,token})=>{
    const out={};
    // garante uma identidade anonima, igual ao cliente
    if(!firebase.auth().currentUser){
      try{await firebase.auth().signInAnonymously();}catch(e){out.authErro=e.code;}
    }
    await new Promise(r=>setTimeout(r,1200));
    const u=firebase.auth().currentUser;
    out.uid=u?u.uid:null; out.anonimo=u?u.isAnonymous:null;
    const db=firebase.firestore();

    const ler=async(rotulo,caminho)=>{
      try{
        const s=await caminho.get();
        out[rotulo]={ok:true,existe:s.exists,campos:s.exists?Object.keys(s.data()):[]};
        if(s.exists&&s.data().expiraEm!==undefined){
          out[rotulo].expiraEm=s.data().expiraEm;
          out[rotulo].expiraEmData=new Date(s.data().expiraEm).toISOString();
          out[rotulo].jaPassou=s.data().expiraEm<=Date.now();
        }
      }catch(e){ out[rotulo]={ok:false,code:e.code,msg:e.message}; }
    };

    const data=db.collection('workspaces').doc(ws).collection('data');
    await ler('tokenDoLink',        data.doc('pub_'+token));
    await ler('tokenInventado',     data.doc('pub_zzzzzzzzzznaoexiste'));
    await ler('docComumDoWorkspace',data.doc('mappo_os'));
    await ler('docDoWorkspace',     db.collection('workspaces').doc(ws));
    out.agora=Date.now(); out.agoraData=new Date().toISOString();
    return out;
  },{ws:WS,token:TOKEN});

  console.log(JSON.stringify(r,null,1));
  await b.close();
})().catch(e=>{console.error('FALHOU: '+e.message);process.exit(1);});
