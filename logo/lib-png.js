// Leitura, escrita e composição de PNG em JavaScript puro.
//
// Por que existe, em vez de uma biblioteca: o gerador de ícones usava o
// resvg, que é WebAssembly. Na máquina onde o projeto é desenvolvido — 3,68
// GB de RAM — o WASM simplesmente não aloca, e o gerador morria com
// segmentation fault sem mensagem nenhuma.
//
// Isto aqui usa só Buffer e zlib, ambos nativos do Node. Roda com poucos
// megabytes e não depende de binário compilado para a plataforma.
//
// Trata apenas o que o projeto precisa: 8 bits por canal, sem entrelaçamento.
// Não é biblioteca de imagem — é a fatia usada uma vez, na autoria.

const fs = require('fs');
const zlib = require('zlib');

// ── Leitura ────────────────────────────────────────────────────────────────

function lerPNG(caminho) {
  const buf = fs.readFileSync(caminho);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('não é PNG: ' + caminho);

  let pos = 8, idat = [], largura = 0, altura = 0, bits = 8, tipoCor = 0, entrelacado = 0;
  while (pos < buf.length) {
    const tam = buf.readUInt32BE(pos);
    const tipo = buf.toString('latin1', pos + 4, pos + 8);
    if (tipo === 'IHDR') {
      largura = buf.readUInt32BE(pos + 8);
      altura  = buf.readUInt32BE(pos + 12);
      bits    = buf[pos + 16];
      tipoCor = buf[pos + 17];
      entrelacado = buf[pos + 20];
    }
    if (tipo === 'IDAT') idat.push(buf.subarray(pos + 8, pos + 8 + tam));
    pos += 12 + tam;
    if (tipo === 'IEND') break;
  }

  if (bits !== 8) throw new Error('só trato 8 bits por canal');
  if (entrelacado) throw new Error('PNG entrelaçado não é suportado');

  const canais = { 0: 1, 2: 3, 4: 2, 6: 4 }[tipoCor];
  if (!canais) throw new Error('tipo de cor não suportado: ' + tipoCor);

  const cru = zlib.inflateSync(Buffer.concat(idat));
  const passo = largura * canais;
  const px = Buffer.alloc(altura * passo);

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

  // Normaliza tudo para RGBA, para o resto do código não precisar saber de
  // quantos canais a origem tinha.
  const rgba = Buffer.alloc(largura * altura * 4);
  for (let i = 0, j = 0; i < largura * altura; i++) {
    const s = i * canais;
    let r, g, b, a = 255;
    if (canais === 1) { r = g = b = px[s]; }
    else if (canais === 2) { r = g = b = px[s]; a = px[s + 1]; }
    else if (canais === 3) { r = px[s]; g = px[s + 1]; b = px[s + 2]; }
    else { r = px[s]; g = px[s + 1]; b = px[s + 2]; a = px[s + 3]; }
    rgba[j++] = r; rgba[j++] = g; rgba[j++] = b; rgba[j++] = a;
  }

  return { largura, altura, rgba };
}

// ── Escrita ────────────────────────────────────────────────────────────────

let TABELA_CRC = null;
function crc32(buf) {
  if (!TABELA_CRC) {
    TABELA_CRC = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TABELA_CRC[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = TABELA_CRC[(crc ^ buf[i]) & 255] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(tipo, dados) {
  const tam = Buffer.alloc(4); tam.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'latin1'), dados]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tam, corpo, crc]);
}

function escreverPNG(caminho, img) {
  const { largura, altura, rgba } = img;
  const passo = largura * 4;
  const comFiltro = Buffer.alloc(altura * (passo + 1));
  for (let y = 0; y < altura; y++) {
    comFiltro[y * (passo + 1)] = 0;
    rgba.copy(comFiltro, y * (passo + 1) + 1, y * passo, (y + 1) * passo);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; ihdr[9] = 6;

  fs.writeFileSync(caminho, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(comFiltro, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]));
  return fs.statSync(caminho).size;
}

// ── Operações ──────────────────────────────────────────────────────────────

function novaImagem(largura, altura) {
  return { largura, altura, rgba: Buffer.alloc(largura * altura * 4) };
}

// Redimensiona com média de área: cada pixel do destino é a média dos pixels
// da origem que ele cobre. Para reduzir muito — de 833px para 32px — isso é
// o que evita o serrilhado que a amostragem simples deixaria no traço fino.
function redimensionar(img, novaL, novaA) {
  const out = novaImagem(novaL, novaA);
  const escalaX = img.largura / novaL;
  const escalaY = img.altura / novaA;

  for (let y = 0; y < novaA; y++) {
    const y0 = Math.floor(y * escalaY), y1 = Math.min(img.altura, Math.ceil((y + 1) * escalaY));
    for (let x = 0; x < novaL; x++) {
      const x0 = Math.floor(x * escalaX), x1 = Math.min(img.largura, Math.ceil((x + 1) * escalaX));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * img.largura + sx) * 4;
          const al = img.rgba[i + 3];
          // Cor ponderada pela opacidade: sem isso, o preto transparente das
          // bordas escureceria o traço ao encolher.
          r += img.rgba[i] * al; g += img.rgba[i + 1] * al; b += img.rgba[i + 2] * al;
          a += al; n++;
        }
      }
      const o = (y * novaL + x) * 4;
      if (n && a) {
        out.rgba[o] = Math.round(r / a);
        out.rgba[o + 1] = Math.round(g / a);
        out.rgba[o + 2] = Math.round(b / a);
        out.rgba[o + 3] = Math.round(a / n);
      }
    }
  }
  return out;
}

function _mistura(c1, c2, t) {
  return Math.round(c1 + (c2 - c1) * t);
}

function _hex(cor) {
  const s = String(cor).replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

// Degradê linear entre pontos dados em fração do lado (0..1).
// `paradas` é [[posicao, '#rrggbb'], ...] em ordem crescente.
function preencherDegrade(img, paradas, de = [0.15, 0], para = [0.85, 1]) {
  const cores = paradas.map(([p, c]) => [p, _hex(c)]);
  const dx = para[0] - de[0], dy = para[1] - de[1];
  const comp = dx * dx + dy * dy;

  for (let y = 0; y < img.altura; y++) {
    const fy = y / (img.altura - 1 || 1);
    for (let x = 0; x < img.largura; x++) {
      const fx = x / (img.largura - 1 || 1);
      // Projeção do ponto sobre o eixo do degradê.
      let t = comp ? ((fx - de[0]) * dx + (fy - de[1]) * dy) / comp : 0;
      t = Math.max(0, Math.min(1, t));

      let c = cores[cores.length - 1][1];
      for (let i = 0; i < cores.length - 1; i++) {
        const [p0, c0] = cores[i], [p1, c1] = cores[i + 1];
        if (t >= p0 && t <= p1) {
          const f = (p1 - p0) ? (t - p0) / (p1 - p0) : 0;
          c = [_mistura(c0[0], c1[0], f), _mistura(c0[1], c1[1], f), _mistura(c0[2], c1[2], f)];
          break;
        }
      }
      const o = (y * img.largura + x) * 4;
      img.rgba[o] = c[0]; img.rgba[o + 1] = c[1]; img.rgba[o + 2] = c[2]; img.rgba[o + 3] = 255;
    }
  }
  return img;
}

// Desenha `fonte` sobre `destino` na posição dada, respeitando a opacidade.
function compor(destino, fonte, px, py) {
  for (let y = 0; y < fonte.altura; y++) {
    const dy = py + y;
    if (dy < 0 || dy >= destino.altura) continue;
    for (let x = 0; x < fonte.largura; x++) {
      const dx = px + x;
      if (dx < 0 || dx >= destino.largura) continue;

      const s = (y * fonte.largura + x) * 4;
      const a = fonte.rgba[s + 3] / 255;
      if (!a) continue;

      const d = (dy * destino.largura + dx) * 4;
      destino.rgba[d]     = Math.round(fonte.rgba[s]     * a + destino.rgba[d]     * (1 - a));
      destino.rgba[d + 1] = Math.round(fonte.rgba[s + 1] * a + destino.rgba[d + 1] * (1 - a));
      destino.rgba[d + 2] = Math.round(fonte.rgba[s + 2] * a + destino.rgba[d + 2] * (1 - a));
      destino.rgba[d + 3] = Math.max(destino.rgba[d + 3], fonte.rgba[s + 3]);
    }
  }
  return destino;
}

// Engrossa o traço, expandindo as áreas opacas em `raio` pixels.
//
// Por que é preciso: a arte tem traço fino, desenhado para ser visto grande.
// Reduzida para 192 ou 180 pixels, a linha some — fica um cinza pálido em
// vez de um desenho. Engrossar ANTES de reduzir é o ajuste óptico que
// tipógrafo faz há séculos: o mesmo desenho precisa de peso diferente em
// cada tamanho.
//
// A dilatação é feita em duas passadas (horizontal e vertical), que dá o
// mesmo resultado de varrer o quadrado inteiro e custa muito menos.
function engrossar(img, raio) {
  const r = Math.max(0, Math.round(raio));
  if (!r) return img;

  const { largura, altura, rgba } = img;
  const passo1 = Buffer.alloc(largura * altura);
  const passo2 = Buffer.alloc(largura * altura);

  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      let m = 0;
      for (let d = -r; d <= r; d++) {
        const sx = x + d;
        if (sx < 0 || sx >= largura) continue;
        const a = rgba[(y * largura + sx) * 4 + 3];
        if (a > m) m = a;
      }
      passo1[y * largura + x] = m;
    }
  }

  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      let m = 0;
      for (let d = -r; d <= r; d++) {
        const sy = y + d;
        if (sy < 0 || sy >= altura) continue;
        const a = passo1[sy * largura + x];
        if (a > m) m = a;
      }
      passo2[y * largura + x] = m;
    }
  }

  const out = novaImagem(largura, altura);
  for (let i = 0; i < largura * altura; i++) {
    const o = i * 4;
    // A cor vem do pixel original quando ele já era opaco; onde o traço
    // cresceu, herda a cor do desenho (branco), não do fundo.
    const original = rgba[o + 3];
    out.rgba[o]     = original ? rgba[o]     : 255;
    out.rgba[o + 1] = original ? rgba[o + 1] : 255;
    out.rgba[o + 2] = original ? rgba[o + 2] : 255;
    out.rgba[o + 3] = passo2[i];
  }
  return out;
}

// Recorta uma região.
function recortar(img, x0, y0, largura, altura) {
  const out = novaImagem(largura, altura);
  for (let y = 0; y < altura; y++) {
    const sy = y0 + y;
    if (sy < 0 || sy >= img.altura) continue;
    for (let x = 0; x < largura; x++) {
      const sx = x0 + x;
      if (sx < 0 || sx >= img.largura) continue;
      const s = (sy * img.largura + sx) * 4;
      const o = (y * largura + x) * 4;
      out.rgba[o] = img.rgba[s]; out.rgba[o + 1] = img.rgba[s + 1];
      out.rgba[o + 2] = img.rgba[s + 2]; out.rgba[o + 3] = img.rgba[s + 3];
    }
  }
  return out;
}

module.exports = {
  lerPNG, escreverPNG, novaImagem,
  redimensionar, preencherDegrade, compor, recortar, engrossar
};
