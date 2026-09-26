const { chromium } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||'C:/Users/Samsung/Documents/claude/projects/mappo';
function assert(c,m){ if(!c) throw new Error('FALHOU: '+m); console.log('  ok - '+m); }
(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1280,height:900}});
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  const abertos=[]; pg.on('popup',p=>abertos.push(p.url()));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(300);
  await pg.evaluate(()=>{
    session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
    _gravarTourVisto(); entrarApp(); fbReady=true; WORKSPACE='ws'; _avisouSessaoExpirada=true;
    const s=document.getElementById('splashScreen'); if(s)s.remove();
    window.confirm=()=>true; window.open=(u)=>{window.__ultimoOpen=u;return null;};
    tecnicos=[{id:'t1',nome:'Joao',ativo:true,modulos:{split:true,vrfObras:[]}},
              {id:'t2',nome:'Maria',ativo:true,modulos:{split:true,vrfObras:[]}}];
  });

  console.log('\n=== CHECK 1: OS mostra SELETOR de tecnico (antes era texto fixo) ===');
  await pg.evaluate(()=>{
    osList=[{id:'os1',cliente:'Cliente A',endereco:'Rua X',tipo:'Instalacao',tecnico:'Joao',
             data:'2026-09-30',hora:'08:00',status:'pendente',qtdSplits:1,equipamentos:[],checklist:[]}];
    openDetalhe('os1');
  });
  await pg.waitForTimeout(200);
  assert(await pg.locator('#osTecnicoNovo').count()===1,'o detalhe da OS tem um seletor de tecnico');
  assert(await pg.locator('#osTecnicoNovo').inputValue()==='Joao','vem com o tecnico atual selecionado');

  console.log('\n=== CHECK 2: trocar o tecnico da OS funciona ===');
  const r2=await pg.evaluate(()=>{
    document.getElementById('osTecnicoNovo').value='Maria';
    reatribuirOS('os1');
    return {tecnico:osList[0].tecnico, toast:document.getElementById('toast').textContent};
  });
  console.log('  ', r2.toast);
  assert(r2.tecnico==='Maria','a OS passou para a Maria');
  assert(/Joao/.test(r2.toast)&&/Maria/.test(r2.toast),'o aviso mostra de quem para quem');

  console.log('\n=== CHECK 3: OS de tecnico que SAIU da equipe ===');
  const r3=await pg.evaluate(()=>{
    osList=[{id:'os2',cliente:'C',endereco:'R',tipo:'T',tecnico:'Fantasma',data:'2026-09-30',
             hora:'08:00',status:'pendente',qtdSplits:1,equipamentos:[],checklist:[]}];
    openDetalhe('os2');
    const sel=document.getElementById('osTecnicoNovo');
    return {valor:sel.value, opcoes:[...sel.options].map(o=>o.text),
            avisa:/n[aã]o est[aá] mais na equipe/i.test(document.getElementById('curOverlay').textContent)};
  });
  console.log('  opcoes:', r3.opcoes);
  assert(r3.valor==='Fantasma','mantem o nome antigo selecionado (nao reatribui sozinho)');
  assert(r3.opcoes.includes('Joao')&&r3.opcoes.includes('Maria'),'oferece os tecnicos atuais');
  assert(r3.avisa===true,'avisa que esse tecnico saiu da equipe');

  console.log('\n=== CHECK 4: MANUTENCAO agora e editavel (antes era tudo texto fixo) ===');
  await pg.evaluate(()=>{
    manutencoes=[{id:'m1',cliente:'Cliente B',endereco:'Rua Y',dataAgendada:'2026-10-15',
                  tecnico:'Joao',tipo:'Preventiva',recorrencia:'Trimestral',obs:'',concluida:false,avisado:true}];
    openModalManutEdit('m1');
  });
  await pg.waitForTimeout(200);
  for(const campo of ['meData','meTecnico','meTipo','meRecorrencia','meEndereco','meObs'])
    assert(await pg.locator('#'+campo).count()===1,'campo editavel: '+campo);

  console.log('\n=== CHECK 5: salvar a troca de tecnico na manutencao ===');
  const r5=await pg.evaluate(()=>{
    document.getElementById('meTecnico').value='Maria';
    salvarManutEdicao('m1');
    return {tecnico:manutencoes[0].tecnico, toast:document.getElementById('toast').textContent};
  });
  // closeModal() tira a classe na hora e so limpa o #modalRoot 200ms depois (animacao)
  await pg.waitForTimeout(350);
  const semModal=await pg.evaluate(()=>!document.getElementById('curOverlay'));
  console.log('  ', r5.toast);
  assert(r5.tecnico==='Maria','a manutencao passou para a Maria');
  assert(/reatribu/i.test(r5.toast),'avisa que foi reatribuida');
  assert(semModal===true,'sem modal de Agenda (esta manutencao nunca foi enviada)');

  console.log('\n=== CHECK 6: mudar a data reabre o aviso de vencimento ===');
  const r6=await pg.evaluate(()=>{
    manutencoes=[{id:'m2',cliente:'C',dataAgendada:'2026-10-15',tecnico:'Joao',tipo:'Preventiva',
                  recorrencia:'Única',obs:'',concluida:false,avisado:true}];
    openModalManutEdit('m2');
    document.getElementById('meData').value='2026-12-01';
    salvarManutEdicao('m2');
    return {data:manutencoes[0].dataAgendada, avisado:manutencoes[0].avisado};
  });
  assert(r6.data==='2026-12-01','a data mudou');
  assert(r6.avisado===false,'o aviso de "faltam 7 dias" volta a poder disparar');

  console.log('\n=== CHECK 7: Google Agenda marca que foi enviada, e a edicao reoferece ===');
  const r7=await pg.evaluate(()=>{
    manutencoes=[{id:'m3',cliente:'C',endereco:'R',dataAgendada:'2026-10-20',tecnico:'Joao',
                  tipo:'Preventiva',recorrencia:'Única',obs:'',concluida:false}];
    abrirGoogleAgenda(manutencoes[0]);
    return {marcou:!!manutencoes[0].agendaEnviadaEm, url:window.__ultimoOpen};
  });
  assert(r7.marcou===true,'clicar em Google Agenda registra que foi enviada');
  assert(/calendar\.google\.com/.test(r7.url),'abriu mesmo a agenda');

  const avisoNoForm=await pg.evaluate(()=>{
    openModalManutEdit('m3');
    return /j[aá] foi enviada ao Google Agenda/i.test(document.getElementById('curOverlay').textContent);
  });
  await pg.evaluate(()=>{document.getElementById('meTecnico').value='Maria';salvarManutEdicao('m3');});
  await pg.waitForTimeout(350);   // deixa o modal de edicao sumir antes de olhar o novo
  const r7b=await pg.evaluate(()=>({avisoNoForm:true,
    modal:document.getElementById('curOverlay')?document.getElementById('curOverlay').textContent.replace(/\s+/g,' ').trim():''}));
  r7b.avisoNoForm=avisoNoForm;
  console.log('  ', r7b.modal.slice(0,120));
  assert(r7b.avisoNoForm===true,'o formulario avisa que ja foi pra Agenda');
  assert(/Atualizar no Google Agenda/i.test(r7b.modal),'ao salvar, oferece atualizar a Agenda');
  assert(/apague o evento anterior/i.test(r7b.modal),'explica que precisa apagar o evento antigo');

  const r7c=await pg.evaluate(()=>{
    window.__ultimoOpen=null;
    [...document.querySelectorAll('#curOverlay button')].find(b=>/Abrir Agenda/i.test(b.textContent)).click();
    return window.__ultimoOpen;
  });
  assert(/Maria/.test(decodeURIComponent(r7c||'')),'a agenda reabre ja com o tecnico NOVO');

  console.log('\n=== CHECK 8: manutencao sem tecnico nao e atribuida sozinha ===');
  const r8=await pg.evaluate(()=>{
    manutencoes=[{id:'m4',cliente:'C',dataAgendada:'2026-11-01',tecnico:'',tipo:'Preventiva',
                  recorrencia:'Única',obs:'',concluida:false}];
    openModalManutEdit('m4');
    const sel=document.getElementById('meTecnico');
    const valorInicial=sel.value;
    salvarManutEdicao('m4');
    return {valorInicial, depois:manutencoes[0].tecnico};
  });
  assert(r8.valorInicial==='','o seletor abre em "A definir", nao no primeiro tecnico');
  assert(r8.depois==='','salvar sem escolher NAO atribui ninguem');

  console.log('\n=== CHECK 9: remover tecnico conta tudo que fica no nome dele ===');
  const r9=await pg.evaluate(()=>{
    let msg='';window.confirm=(m)=>{msg=m;return false;};
    osList=[{id:'o1',tecnico:'Joao',status:'pendente'},{id:'o2',tecnico:'Joao',status:'pendente'}];
    manutencoes=[{id:'m9',tecnico:'Joao',concluida:false}];
    tarefas=[{id:'tf1',tecnico:'Joao',status:'pendente'}];
    removerTecnico('t1');
    return msg;
  });
  console.log('  ', r9.replace(/\n/g,' '));
  assert(/2 OS/.test(r9),'conta as OS abertas');
  assert(/1 manuten/.test(r9),'conta as manutencoes (o caso recorrente que mais doi)');
  assert(/1 tarefa/.test(r9),'conta as tarefas');
  assert(/trocando o t[eé]cnico/i.test(r9),'explica COMO reatribuir, agora que existe');

  console.log('\n=== erros de pagina ==='); console.log(erros.length?erros:'(nenhum)');
  assert(erros.length===0,'nenhum erro de pagina');
  await b.close(); srv.close();
  console.log('\nTODOS OS CHECKS PASSARAM.');
})().catch(e=>{console.error('\n'+e.message);process.exit(1);});
