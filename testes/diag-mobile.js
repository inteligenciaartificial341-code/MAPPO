/* Mede estouro de largura nos modais e telas, num viewport de celular real. */
const { chromium, devices } = require('playwright');
const path=require('path'), http=require('http'), fs=require('fs');
const RAIZ=process.env.MAPPO_RAIZ||path.resolve(__dirname,'..');

(async()=>{
  const srv=http.createServer((rq,rs)=>{const p=rq.url==='/'?'/index.html':rq.url.split('?')[0];const f=path.join(RAIZ,p);
    if(!fs.existsSync(f)){rs.writeHead(404);rs.end();return;}rs.writeHead(200);rs.end(fs.readFileSync(f));});
  await new Promise(r=>srv.listen(0,r));
  const b=await chromium.launch();
  const ctx=await b.newContext({...devices['iPhone 12']});
  const pg=await ctx.newPage();
  pg.on('pageerror',e=>console.log('PAGEERROR:',e.message));
  await pg.goto('http://localhost:'+srv.address().port+'/',{waitUntil:'load'});
  await pg.waitForTimeout(400);

  await pg.evaluate(()=>{
    session={perfil:'gestor',nome:'Paulo',uid:'u',role:'Gestor',workspaceId:'ws'};
    _gravarTourVisto(); entrarApp(); fbReady=true; WORKSPACE='ws'; _avisouSessaoExpirada=true;
    const s=document.getElementById('splashScreen'); if(s)s.remove();
    tecnicos=[{id:'t1',nome:'Joao da Silva',ativo:true,modulos:{split:true,vrfObras:[]}},
              {id:'t2',nome:'Maria Oliveira',ativo:true,modulos:{split:true,vrfObras:[]}}];
    osList=[{id:'os1',cliente:'Prefeitura Municipal de Pires do Rio',endereco:'Av. Comendador Jose Fernandes, 500 - Centro',
             tipo:'Instalacao',tecnico:'Joao da Silva',data:'2026-09-30',hora:'08:00',status:'pendente',
             qtdSplits:2,equipamentos:[],checklist:[],pubToken:'abc123xyz',pubExpira:Date.now()+86400000}];
    manutencoes=[{id:'m1',cliente:'Prefeitura Municipal',endereco:'Av. Comendador, 500',dataAgendada:'2026-10-15',
                  tecnico:'Joao da Silva',tipo:'Preventiva',recorrencia:'Trimestral',obs:'Trocar filtros',concluida:false}];
  });

  const largura=await pg.evaluate(()=>window.innerWidth);
  console.log('viewport do aparelho:', largura + 'px\n');

  async function medir(nome, abrir, arquivo){
    await pg.evaluate(()=>{const r=document.getElementById('modalRoot');if(r)r.innerHTML='';});
    await pg.evaluate(abrir);
    await pg.waitForTimeout(300);
    const m=await pg.evaluate(()=>{
      const doc=document.documentElement;
      const modal=document.querySelector('#curOverlay .modal');
      const foot=document.querySelector('#curOverlay .modal-foot');
      const vw=window.innerWidth;
      const estoura=[];
      // qualquer elemento que passe da largura da tela
      document.querySelectorAll('#curOverlay *, #contentArea *').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.width>0&&(r.right>vw+1||r.left<-1)){
          estoura.push((el.tagName.toLowerCase())+(el.className&&typeof el.className==='string'?'.'+el.className.split(' ')[0]:'')
            +' ['+Math.round(r.left)+'→'+Math.round(r.right)+']');
        }
      });
      let botoesCortados=[];
      if(foot){
        foot.querySelectorAll('button').forEach(bt=>{
          const r=bt.getBoundingClientRect();
          if(r.right>vw+1||r.left<-1)botoesCortados.push(bt.textContent.trim().slice(0,22));
        });
      }
      return {
        paginaEstoura: doc.scrollWidth>vw,
        paginaScrollW: doc.scrollWidth, vw,
        modalW: modal?Math.round(modal.getBoundingClientRect().width):null,
        footScrollW: foot?foot.scrollWidth:null,
        footClientW: foot?foot.clientWidth:null,
        botoesCortados,
        estoura: [...new Set(estoura)].slice(0,8)
      };
    });
    const ruim = m.paginaEstoura || m.botoesCortados.length || (m.footScrollW>m.footClientW+1) || m.estoura.length;
    console.log((ruim?'PROBLEMA':'ok      ')+' - '+nome);
    console.log('           modal '+m.modalW+'px / tela '+m.vw+'px'
      + (m.footScrollW!=null?' | rodape '+m.footScrollW+'px em '+m.footClientW+'px':''));
    if(m.botoesCortados.length) console.log('           BOTOES CORTADOS: '+m.botoesCortados.join(' | '));
    if(m.estoura.length)        console.log('           estourando: '+m.estoura.join('  '));
    if(m.paginaEstoura)         console.log('           A PAGINA rola na horizontal: '+m.paginaScrollW+'px');
    if(arquivo) await pg.screenshot({path:arquivo});
  }

  await medir('Detalhe da OS (gestor)', ()=>openDetalhe('os1'), 'mob-1-os.png');
  await medir('Link de acompanhamento', ()=>abrirModalLink('abc123xyz','Prefeitura Municipal',true,'os','os1'), 'mob-2-link.png');
  await medir('Editar manutencao', ()=>openModalManutEdit('m1'), 'mob-3-manut.png');
  await medir('Nova OS', ()=>openModalOS(), 'mob-4-novaos.png');

  console.log('\n--- TELAS (sem modal) ---');
  await pg.evaluate(()=>{const r=document.getElementById('modalRoot');if(r)r.innerHTML='';});
  for(const [nome,view,arq] of [['Configuracoes','config','mob-5-config.png'],['Ordens','ordens',null],['Financeiro','financeiro',null]]){
    await pg.evaluate(v=>nav(v),view);
    await pg.waitForTimeout(350);
    const m=await pg.evaluate(()=>{
      const vw=window.innerWidth, doc=document.documentElement, fora=[];
      document.querySelectorAll('#contentArea *').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.width>0&&(r.right>vw+1||r.left<-1))fora.push(el.tagName.toLowerCase()+(typeof el.className==='string'&&el.className?'.'+el.className.split(' ')[0]:''));
      });
      return {estoura:doc.scrollWidth>vw, scrollW:doc.scrollWidth, vw, fora:[...new Set(fora)].slice(0,6)};
    });
    console.log((m.estoura||m.fora.length?'PROBLEMA':'ok      ')+' - '+nome+'  ('+m.scrollW+'px em '+m.vw+'px)'
      +(m.fora.length?'  fora: '+m.fora.join(', '):''));
    if(arq) await pg.screenshot({path:arq,fullPage:false});
  }

  await b.close(); srv.close();
})();
