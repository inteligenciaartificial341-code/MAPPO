#!/usr/bin/env node
// Gera os ícones e telas de abertura do PWA do MAPPO a partir da logo oficial.
//
// Adaptado da receita do SONNAR IA ("logo app/LEIA-ME.md"), que traz o método.
// As CORES são as do MAPPO e não mudam: fundo #185266, o mesmo da arte que o
// dono enviou, do theme-color e do --petrol do CSS. O que foi trazido da
// receita é só o método de dimensão e espessura — e cada número dela foi
// REMEDIDO nesta arte, como o próprio LEIA-ME manda fazer.
//
// O QUE MUDOU EM RELAÇÃO À RECEITA DE ORIGEM, E POR QUÊ
//
// 1. Fundo chapado, não degradê. A arte do MAPPO já vem com o petróleo
//    chapado #185266, e é essa a cor do app. Inventar degradê seria mudar a
//    marca, que é justamente o que não se quer.
//
// 2. Ocupação 72% (não 88%). A arte do SONNAR é larga (2,07:1) e sobra altura
//    no quadrado. A do MAPPO é quase quadrada (1,18:1 com tagline; 1,34:1 sem)
//    — a 88% ela encostaria nas bordas. O próprio LEIA-ME prevê isso e manda
//    começar em 72% para arte quadrada.
//
// 3. Teto do raio de engrossamento 8, não 2. A fórmula da receita
//    (redução × 0,4) se confirmou boa nesta arte; o teto é que era calibrado
//    para a redução de ~5× do SONNAR. Aqui o favicon reduz 24×, e o teto de 2
//    deixava o traço cinza pálido. Medido gerando 0,1,2,3,4,6,8,10,12 e
//    olhando ampliado, sem suavização:
//      192px  -> raio 2 pálido | 4 é o ponto certo | 6 fecha os contraformas
//      32px   -> raio 2 pálido | 8 é o ponto certo | 12 fecha o furo do pin
//
// 4. Ícone de app SEM a tagline. Medido: o traço da tagline tem 8px em 1420
//    de largura. No ícone de 192 ela vira 0,8px de traço e 8px de altura —
//    borrão ilegível, e ainda encolhe o resto da marca pra caber. A tagline
//    fica só nas telas de abertura, onde há tamanho para ela.
//
// 5. Favicon recortado por ÁREA, não por fatia de largura. No SONNAR o
//    elemento que identifica sozinho são os primeiros 38% da largura (arte
//    horizontal). No MAPPO a composição é vertical: o que identifica é o
//    glifo do mapa+pin, medido em x 395..1024, y 0..639.
//
// Uso:  node logo/gerar-icones-mappo.js [pasta-destino]
//
// Sem argumento, grava na RAIZ do projeto, que é onde o index.html e o
// manifest.json procuram os arquivos. Roda só na autoria: os PNGs são
// commitados e o app nunca processa imagem em produção.

const fs = require('fs');
const path = require('path');
const png = require('./lib-png.js');

const FUNDO = [0x18, 0x52, 0x66];              // #185266 — petróleo do MAPPO
const RAIO_MAXIMO = 8;                          // remedido nesta arte (ver acima)

const DESTINO = process.argv[2] || path.join(__dirname, '..');
const LOGO = path.join(__dirname, 'logo-marca.png');

if (!fs.existsSync(LOGO)) {
  console.error('\n  Falta logo/logo-marca.png.');
  console.error('  Gere com: node logo/extrair-logo.js <arte-branca-sobre-preto.png> logo/logo-marca.png\n');
  process.exit(1);
}

const completa = png.lerPNG(LOGO);              // 1420x1208 — glifo + MAPPO + tagline

// Recortes medidos por projeção horizontal de alfa (bandas de desenho):
//   glifo  y 0..639    (0%..53% da altura)
//   MAPPO  y 758..1055 (62,7%..87,4%)
//   tagline y 1127..1207 (93,3%..100%)
const principal = png.recortar(completa, 0, 0, completa.largura, 1056);   // sem tagline
const glifo     = png.recortar(completa, 395, 0, 630, 640);               // só mapa+pin

function raioDeEngrossar(origem, larguraFinal) {
  const reducao = origem.largura / Math.max(1, larguraFinal);
  if (reducao <= 1.5) return 0;                 // quase sem reduzir: não mexe
  return Math.min(RAIO_MAXIMO, Math.round(reducao * 0.4));
}

function chapado(largura, altura) {
  const img = png.novaImagem(largura, altura);
  for (let i = 0; i < largura * altura; i++) {
    img.rgba[i * 4] = FUNDO[0]; img.rgba[i * 4 + 1] = FUNDO[1];
    img.rgba[i * 4 + 2] = FUNDO[2]; img.rgba[i * 4 + 3] = 255;
  }
  return img;
}

// `ocupacao` limita os DOIS lados: com arte quase quadrada, limitar só a
// largura deixaria a altura estourando a margem.
function montar(arte, lado, ocupacao, engrossa = true) {
  const img = chapado(lado, lado);
  const prop = arte.largura / arte.altura;
  let lg = Math.round(lado * ocupacao);
  let al = Math.round(lg / prop);
  if (al > lado * ocupacao) { al = Math.round(lado * ocupacao); lg = Math.round(al * prop); }

  const raio = engrossa ? raioDeEngrossar(arte, lg) : 0;
  png.compor(img, png.redimensionar(png.engrossar(arte, raio), lg, al),
             Math.round((lado - lg) / 2), Math.round((lado - al) / 2));
  return { img, raio, lg, al };
}

// Tela de abertura: lockup COMPLETO (com tagline — aqui há tamanho pra ela),
// centralizado, sem engrossar: a splash é grande e o traço original já aparece.
function splash(largura, altura) {
  const img = chapado(largura, altura);
  const prop = completa.largura / completa.altura;
  const lg = Math.round(Math.min(largura * 0.62, altura * 0.30));
  const al = Math.round(lg / prop);
  png.compor(img, png.redimensionar(completa, lg, al),
             Math.round((largura - lg) / 2), Math.round((altura - al) / 2));
  return img;
}

fs.mkdirSync(DESTINO, { recursive: true });
console.log(`\nArte: ${completa.largura}x${completa.altura} (${(completa.largura / completa.altura).toFixed(2)}:1)`);
console.log(`  sem tagline: ${principal.largura}x${principal.altura} (${(principal.largura / principal.altura).toFixed(2)}:1)`);
console.log(`  só o glifo : ${glifo.largura}x${glifo.altura} (${(glifo.largura / glifo.altura).toFixed(2)}:1)\n`);

function gravar(nome, r) {
  const bytes = png.escreverPNG(path.join(DESTINO, nome), r.img || r);
  const extra = r.raio !== undefined ? `  marca ${r.lg}x${r.al}px, raio ${r.raio}` : '';
  console.log('  ' + nome.padEnd(30) + (bytes / 1024).toFixed(1).padStart(7) + ' KB' + extra);
}

console.log('Ícones do app (glifo + MAPPO, ocupação 72%):');
gravar('icon-192.png', montar(principal, 192, 0.72));
gravar('icon-512.png', montar(principal, 512, 0.72));
gravar('apple-touch-icon.png', montar(principal, 180, 0.72));

// Maskable a 62%, não os 66% da receita: medido nesta arte. O Android garante
// só o círculo central de 80% do lado. Varrendo a tinta real (alfa>=64) e
// medindo a distância ao centro a 512px (raio seguro 204,8px):
//   66% -> 205,4px  ESTOURA por 0,6px     64% -> 199,6px  cabe raspando
//   62% -> 192,4px  cabe com 12px de folga
// Com arte quase quadrada a diagonal come a margem que a arte larga não comia.
console.log('\nMaskable (zona segura do Android — ocupação 62%, medida):');
gravar('icon-maskable-192.png', montar(principal, 192, 0.62));
gravar('icon-maskable-512.png', montar(principal, 512, 0.62));

console.log('\nFavicon (só o glifo — "MAPPO" é ilegível a 32px):');
gravar('favicon-32.png', montar(glifo, 32, 0.80));

console.log('\nTelas de abertura (iPhone, lockup completo com tagline):');
for (const [nome, w, h] of [
  ['splash-1290x2796.png', 1290, 2796],   // 15/16 Pro Max
  ['splash-1179x2556.png', 1179, 2556],   // 15/16 Pro
  ['splash-1170x2532.png', 1170, 2532],   // 12/13/14
  ['splash-1125x2436.png', 1125, 2436],   // X / XS / 11 Pro
  ['splash-828x1792.png', 828, 1792]      // XR / 11
]) gravar(nome, splash(w, h));

console.log('\nPronto — arquivos em ' + DESTINO + '\n');
