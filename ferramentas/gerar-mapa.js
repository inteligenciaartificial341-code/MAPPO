#!/usr/bin/env node
/* Gera MAPA-INDEX.md -- o indice do index.html.
 *
 * POR QUE EXISTE: o index.html tem ~744 KB (~212 mil tokens). Um agente que precise achar
 * vinte linhas dentro dele paga esse preco inteiro so para localizar. Medido em 06/10/2026:
 * tres entregas desta semana gastaram ~5,4 milhoes de tokens, e a maior fatia foi agente
 * vasculhando este arquivo.
 *
 * O mapa custa ~12 mil tokens e diz ONDE cada coisa esta. O agente le o mapa, abre as 200
 * linhas que importam, e pronto -- 17x mais barato.
 *
 * NAO SUBSTITUI LER O CODIGO. Ele diz onde procurar, nunca o que o codigo faz. Decidir pelo
 * mapa sem abrir a funcao e a mesma classe de erro que o CLAUDE.md chama de "deducao a partir
 * do codigo" -- so que pior, porque aqui nem o codigo foi lido.
 *
 * COMO RODAR: npm run mapa
 * O guardiao de testes/teste-atualizacao.js reprova se o index.html mudar e o mapa nao.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const ALVO = path.join(RAIZ, 'index.html');
const SAIDA = path.join(RAIZ, 'MAPA-INDEX.md');

function lerLinhas() {
  return fs.readFileSync(ALVO, 'utf8').replace(/\r\n/g, '\n').split('\n');
}

/* Secoes do proprio arquivo (/* ═══ NOME ═══ *​/) -- dao estrutura ao mapa em vez de
   uma lista alfabetica solta, que nao diz nada sobre vizinhanca. */
function acharSecoes(linhas) {
  const out = [];
  linhas.forEach((l, i) => {
    const m = l.match(/[/*]\*?\s*[═]{2,}\s*(.+?)\s*[═]{2,}\s*\*[/]/);
    if (m) out.push({ linha: i + 1, nome: m[1].trim() });
  });
  return out;
}

function secaoDe(secoes, linha) {
  let atual = null;
  for (const s of secoes) { if (s.linha <= linha) atual = s; else break; }
  return atual ? atual.nome : '(topo do arquivo)';
}

function coletar(linhas) {
  const funcoes = [], estado = [], ids = [], classes = [];
  const vistosId = new Set(), vistosClasse = new Set();

  linhas.forEach((l, i) => {
    const n = i + 1;

    const f = l.match(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (f) funcoes.push({ nome: f[1], linha: n });

    /* so o estado de topo de arquivo: const/let na coluna 0 */
    const e = l.match(/^(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/);
    if (e) estado.push({ nome: e[1], linha: n });

    let m;
    const reId = /id="([A-Za-z][\w-]*)"/g;
    while ((m = reId.exec(l))) {
      if (!vistosId.has(m[1])) { vistosId.add(m[1]); ids.push({ nome: m[1], linha: n }); }
    }

    /* classe CSS declarada: duas colunas de recuo, dentro do <style> */
    const c = l.match(/^\s{2}(\.[a-z][\w-]*)[\s,{:]/);
    if (c && !vistosClasse.has(c[1])) { vistosClasse.add(c[1]); classes.push({ nome: c[1], linha: n }); }
  });

  return { funcoes, estado, ids, classes };
}

/* Uma linha por entrada seria longa demais; densidade importa porque o mapa inteiro e lido.
   Formato: `nome` L1234, separados por · e quebrando a cada ~110 colunas. */
function denso(itens) {
  const partes = itens.map((x) => '`' + x.nome + '` ' + x.linha);
  const linhas = [];
  let atual = '';
  for (const p of partes) {
    if (atual && (atual.length + p.length + 3) > 110) { linhas.push(atual); atual = ''; }
    atual = atual ? atual + ' · ' + p : p;
  }
  if (atual) linhas.push(atual);
  return linhas.join('\n');
}

function porSecao(itens, secoes) {
  const mapa = new Map();
  for (const it of itens) {
    const s = secaoDe(secoes, it.linha);
    if (!mapa.has(s)) mapa.set(s, []);
    mapa.get(s).push(it);
  }
  return mapa;
}

function gerar() {
  const linhas = lerLinhas();
  const secoes = acharSecoes(linhas);
  const { funcoes, estado, ids, classes } = coletar(linhas);
  const bytes = fs.statSync(ALVO).size;

  const partes = [];
  partes.push('<!-- GERADO POR ferramentas/gerar-mapa.js — NÃO EDITAR À MÃO. Regenere com: npm run mapa -->');
  partes.push('');
  partes.push('# Mapa do `index.html`');
  partes.push('');
  partes.push('`index.html` tem **' + linhas.length.toLocaleString('pt-BR') + ' linhas** e **' +
    Math.round(bytes / 1024) + ' KB** — ler o arquivo inteiro custa ~' +
    Math.round(bytes / 3500) + ' mil tokens. Este mapa custa uma fração disso e diz **onde** cada coisa está.');
  partes.push('');
  partes.push('**Como usar:** ache o nome aqui, pegue a linha, e abra só o trecho ' +
    '(`sed -n \'1200,1260p\' index.html`). Nunca leia o arquivo inteiro para localizar algo.');
  partes.push('');
  partes.push('**O que este mapa NÃO faz:** ele não diz o que o código faz. Decidir pelo mapa ' +
    'sem abrir a função é pior que deduzir a partir do código — é deduzir sem nem ter lido.');
  partes.push('');
  partes.push('| | |');
  partes.push('|---|---|');
  partes.push('| Funções | ' + funcoes.length + ' |');
  partes.push('| Estado de topo (`const`/`let`) | ' + estado.length + ' |');
  partes.push('| Elementos com `id` | ' + ids.length + ' |');
  partes.push('| Classes CSS | ' + classes.length + ' |');
  partes.push('| Seções do arquivo | ' + secoes.length + ' |');
  partes.push('');

  partes.push('## Seções, na ordem do arquivo');
  partes.push('');
  partes.push(denso(secoes.map((s) => ({ nome: s.nome, linha: s.linha }))));
  partes.push('');

  partes.push('## Funções, agrupadas pela seção onde vivem');
  partes.push('');
  for (const [sec, itens] of porSecao(funcoes, secoes)) {
    partes.push('**' + sec + '**');
    partes.push('');
    partes.push(denso(itens));
    partes.push('');
  }

  partes.push('## Estado de topo de arquivo');
  partes.push('');
  partes.push(denso(estado));
  partes.push('');

  partes.push('## Elementos com `id` (primeira ocorrência)');
  partes.push('');
  partes.push(denso(ids));
  partes.push('');

  partes.push('## Classes CSS (onde são declaradas)');
  partes.push('');
  partes.push(denso(classes));
  partes.push('');

  return partes.join('\n');
}

/* --conferir: nao escreve, so diz se o mapa em disco esta igual ao que seria gerado agora.
   E o que o guardiao usa -- e e por isso que o mapa nao envelhece em silencio. */
const conferir = process.argv.includes('--conferir');
const novo = gerar();

if (conferir) {
  let atual = null;
  try { atual = fs.readFileSync(SAIDA, 'utf8').replace(/\r\n/g, '\n'); } catch (e) { atual = null; }
  if (atual === null) {
    console.error('MAPA AUSENTE: ' + path.basename(SAIDA) + ' não existe. Rode: npm run mapa');
    process.exit(1);
  }
  if (atual.replace(/\r\n/g, '\n') !== novo) {
    console.error('MAPA DESATUALIZADO: o index.html mudou e o MAPA-INDEX.md não.');
    console.error('Rode: npm run mapa');
    process.exit(1);
  }
  console.log('mapa em dia');
  process.exit(0);
}

fs.writeFileSync(SAIDA, novo);
console.log('MAPA-INDEX.md gerado: ' + Math.round(Buffer.byteLength(novo) / 1024) + ' KB (~' +
  Math.round(Buffer.byteLength(novo) / 3500) + ' mil tokens), contra ~' +
  Math.round(fs.statSync(ALVO).size / 3500) + ' mil do index.html.');
