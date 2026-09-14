#!/usr/bin/env node
// Extrai a logo da Elite Ar + Confortline de um PNG branco-sobre-preto e
// salva com fundo TRANSPARENTE, pronta para ser composta sobre qualquer cor.
//
// Por que existe: a arte original veio como imagem branca sobre fundo preto
// sólido. Colar isso num ícone deixaria um retângulo preto em volta da
// marca. Como o desenho é branco puro, o brilho de cada pixel serve de
// máscara: onde é branco, a logo é opaca; onde é preto, some.
//
// Uso:  node scripts/extrair-logo.js <entrada.png> [saida.png]
//
// Roda uma vez, na autoria. O resultado é commitado — o app não processa
// imagem em produção.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── Leitura de PNG ─────────────────────────────────────────────────────────
// Feito à mão porque a única dependência de imagem do projeto é o resvg, que
// rasteriza SVG e não lê PNG. Trazer uma biblioteca inteira para uma
// operação que roda uma vez seria peso permanente por ganho momentâneo.

function lerPNG(caminho) {
  const buf = fs.readFileSync(caminho);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('não é PNG: ' + caminho);

  let pos = 8, idat = [], largura = 0, altura = 0, bits = 8, tipoCor = 0;
  while (pos < buf.length) {
    const tam = buf.readUInt32BE(pos);
    const tipo = buf.toString('latin1', pos + 4, pos + 8);
    if (tipo === 'IHDR') {
      largura = buf.readUInt32BE(pos + 8);
      altura  = buf.readUInt32BE(pos + 12);
      bits    = buf[pos + 16];
      tipoCor = buf[pos + 17];
    }
    if (tipo === 'IDAT') idat.push(buf.subarray(pos + 8, pos + 8 + tam));
    pos += 12 + tam;
    if (tipo === 'IEND') break;
  }

  if (bits !== 8) throw new Error('só trato PNG de 8 bits por canal');
  const canais = { 0: 1, 2: 3, 4: 2, 6: 4 }[tipoCor];
  if (!canais) throw new Error('tipo de cor não suportado: ' + tipoCor);

  const cru = zlib.inflateSync(Buffer.concat(idat));
  const passo = largura * canais;
  const px = Buffer.alloc(altura * passo);

  // Desfiltragem: cada linha do PNG declara como foi codificada em relação
  // à anterior e ao pixel à esquerda.
  let o = 0;
  for (let y = 0; y < altura; y++) {
    const filtro = cru[o++];
    const linha = cru.subarray(o, o + passo); o += passo;
    const dest = px.subarray(y * passo, (y + 1) * passo);
    const cima = y > 0 ? px.subarray((y - 1) * passo, y * passo) : Buffer.alloc(passo);
    for (let x = 0; x < passo; x++) {
      const a = x >= canais ? dest[x - canais] : 0;
      const b = cima[x];
      const c = x >= canais ? cima[x - canais] : 0;
      let v = linha[x];
      if (filtro === 1) v += a;
      else if (filtro === 2) v += b;
      else if (filtro === 3) v += (a + b) >> 1;
      else if (filtro === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      dest[x] = v & 255;
    }
  }
  return { largura, altura, canais, px, passo };
}

// ── Escrita de PNG (RGBA, sem filtro) ──────────────────────────────────────

function crc32(buf) {
  let c, tabela = crc32.tabela;
  if (!tabela) {
    tabela = crc32.tabela = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      tabela[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = tabela[(crc ^ buf[i]) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(tipo, dados) {
  const tam = Buffer.alloc(4); tam.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'latin1'), dados]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tam, corpo, crc]);
}

function escreverPNG(caminho, largura, altura, rgba) {
  const passo = largura * 4;
  const comFiltro = Buffer.alloc(altura * (passo + 1));
  for (let y = 0; y < altura; y++) {
    comFiltro[y * (passo + 1)] = 0;                        // filtro "nenhum"
    rgba.copy(comFiltro, y * (passo + 1) + 1, y * passo, (y + 1) * passo);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; ihdr[9] = 6;                                // 8 bits, RGBA

  fs.writeFileSync(caminho, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(comFiltro, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]));
}

// ── Recorte e máscara ──────────────────────────────────────────────────────

function extrair(entrada, saida) {
  const img = lerPNG(entrada);
  const { largura, altura, canais, px, passo } = img;

  // Onde a arte começa e termina, ignorando o fundo escuro.
  const LIMIAR = 40;
  let x0 = largura, y0 = altura, x1 = 0, y1 = 0;
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const i = y * passo + x * canais;
      const brilho = canais >= 3 ? Math.max(px[i], px[i + 1], px[i + 2]) : px[i];
      if (brilho > LIMIAR) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < x0 || y1 < y0) throw new Error('não achei arte clara na imagem');

  const lg = x1 - x0 + 1, al = y1 - y0 + 1;
  const rgba = Buffer.alloc(lg * al * 4);

  for (let y = 0; y < al; y++) {
    for (let x = 0; x < lg; x++) {
      const i = (y + y0) * passo + (x + x0) * canais;
      const r = px[i], g = canais >= 3 ? px[i + 1] : r, b = canais >= 3 ? px[i + 2] : r;

      // Luminância vira opacidade: a arte é branca, o fundo é preto.
      // Assim o traço fino mantém o antisserrilhado original em vez de
      // virar escada — o que apareceria feio num ícone pequeno.
      const alfa = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

      const o = (y * lg + x) * 4;
      rgba[o] = 255; rgba[o + 1] = 255; rgba[o + 2] = 255;   // branco puro
      rgba[o + 3] = alfa;
    }
  }

  escreverPNG(saida, lg, al, rgba);
  return { largura: lg, altura: al, proporcao: (lg / al).toFixed(2) };
}

// ── Execução ───────────────────────────────────────────────────────────────

const entrada = process.argv[2];
const saida = process.argv[3] || path.join(__dirname, '..', 'icones', 'logo-marca.png');

if (!entrada) {
  console.error('\nUso: node scripts/extrair-logo.js <entrada.png> [saida.png]\n');
  process.exit(1);
}

try {
  const r = extrair(entrada, saida);
  console.log(`\n  logo extraída: ${r.largura}x${r.altura} (proporção ${r.proporcao}:1)`);
  console.log(`  salva em: ${saida}\n`);
} catch (e) {
  console.error('\n  Não deu certo: ' + e.message + '\n');
  process.exit(1);
}
