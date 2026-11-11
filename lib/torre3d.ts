/**
 * Montagem da torre em 3D, sem depender de React.
 * O site (com Motion) e a prévia (JS puro) desenham a mesma lista de grupos.
 *
 * Como a torre real é montada:
 * - cada nível (1 m) usa um par de painéis iguais, um de cada lado;
 * - os painéis revezam de posição a cada nível: num nível ficam nas laterais, no seguinte na frente e atrás;
 * - numa torre mista, os painéis de 1,5 m formam a frente e os de 1 m as laterais, intercalando os níveis;
 * - a travessa é horizontal, no meio do nível, ligando um canto ao canto oposto.
 *
 * Coordenadas locais em metros: f = frente (da esquerda para a direita), d = profundidade, y = altura.
 */
import type { Item } from "./site";

export type Base = "sapata" | "rodinha" | "nenhuma";
export type TorreMontagem = {
  /** Largura do par de painéis de cada nível montado, de baixo para cima. */
  niveis: number[];
  frente: number;
  fundo: number;
  travessas: number;
  plataformas: number;
  escadas: number;
  base: Base;
};
export type Montagem = { altura: number; torres: TorreMontagem[]; total: number };

export type Parte =
  | { tipo: "linha"; cls: string; pts: [number, number][] }
  | { tipo: "poligono"; cls: string; pts: [number, number][] }
  | { tipo: "texto"; cls: string; pts: [number, number][]; texto: string };
export type Grupo = { key: string; atraso: number; partes: Parte[] };
export type Desenho = { grupos: Grupo[]; viewBox: string };

const ALTURA_BASE = 0.32;
const VAO = 0.9; // espaço entre torres vizinhas
const VISIVEIS = 3;
const U = 48; // px por metro antes do viewBox escalar
// Projeção oblíqua: a frente quase reta e a profundidade recuando para cima e à direita, encurtada.
const AF = (6 * Math.PI) / 180;
const AP = (38 * Math.PI) / 180;
const KP = 0.55;

/** Largura em metros a partir do nome ("Andaime 1,5 m" → 1.5). */
export function larguraDe(nome = "") {
  const m = nome.match(/(\d+(?:[.,]\d+)?)\s*m\b/i);
  return m ? Number(m[1].replace(",", ".")) : 1;
}

const soma = (itens: Item[], qtd: Record<string, number>, f: (i: Item) => boolean) =>
  itens.filter(f).reduce((s, i) => s + (qtd[i.id] ?? 0), 0);

/** Divide n peças entre as torres (a primeira torre recebe as sobras). */
const dividir = (n: number, torres: number, t: number) => Math.floor(n / torres) + (t < n % torres ? 1 : 0);

/** Transforma as quantidades da lista no que cada torre tem montado. */
export function montar(itens: Item[], qtd: Record<string, number>, altura: number, torres: number): Montagem {
  const paineis = itens.filter((i) => i.grupo === "largura").map((i) => ({ largura: larguraDe(i.nome), resta: qtd[i.id] ?? 0 }));
  const padrao = paineis.find((p) => p.resta > 0)?.largura ?? paineis[0]?.largura ?? 1;
  // a maior largura começa, e as larguras se intercalam enquanto houver pares das duas
  const ordem = paineis.map((_, j) => j).sort((a, b) => paineis[b].largura - paineis[a].largura);
  const travessas = soma(itens, qtd, (i) => /travess/i.test(i.nome));
  const plataformas = soma(itens, qtd, (i) => /plataforma/i.test(i.nome));
  const escadas = soma(itens, qtd, (i) => /escada/i.test(i.nome));
  const rodinhas = soma(itens, qtd, (i) => i.grupo === "base" && /rod/i.test(i.nome));
  const sapatas = soma(itens, qtd, (i) => i.grupo === "base" && !/rod/i.test(i.nome));

  const lista: TorreMontagem[] = [];
  for (let t = 0; t < torres; t++) {
    const niveis: number[] = [];
    let k = 0;
    while (niveis.length < altura && paineis.some((p) => p.resta >= 2)) {
      const p = paineis[ordem[k++ % ordem.length]];
      if (p.resta < 2) continue;
      p.resta -= 2;
      niveis.push(p.largura);
    }
    const usadas = [...new Set(niveis)];
    lista.push({
      niveis,
      frente: usadas.length ? Math.max(...usadas) : padrao,
      fundo: usadas.length ? Math.min(...usadas) : padrao,
      travessas: dividir(travessas, torres, t),
      plataformas: dividir(plataformas, torres, t),
      escadas: dividir(escadas, torres, t),
      base: t < sapatas ? "sapata" : t < sapatas + rodinhas ? "rodinha" : "nenhuma",
    });
  }
  return { altura, torres: lista.slice(0, VISIVEIS), total: torres };
}

type Ponto3 = [number, number, number]; // [f, y, d]
let origem = 0; // deslocamento da torre atual na frente

/** Projeção: (frente, altura, profundidade) em metros → px. */
const P = (f: number, y: number, d: number): [number, number] => {
  const x = f + origem;
  return [+((x * Math.cos(AF) + d * KP * Math.cos(AP)) * U).toFixed(1), +((x * Math.sin(AF) - d * KP * Math.sin(AP) - y) * U).toFixed(1)];
};
const L = (cls: string, a: Ponto3, b: Ponto3): Parte => ({ tipo: "linha", cls, pts: [P(...a), P(...b)] });

/** Um painel entre dois cantos (f, d), do nível y0 ao y0 + 1. */
function painel(a: [number, number], b: [number, number], y0: number): Parte[] {
  const [fa, da] = a;
  const [fb, db] = b;
  const p: Parte[] = [
    L("tubo", [fa, y0, da], [fa, y0 + 1, da]),
    L("tubo", [fb, y0, db], [fb, y0 + 1, db]),
    L("tubo", [fa, y0 + 0.9, da], [fb, y0 + 0.9, db]),
    L("tubo", [fa, y0 + 0.12, da], [fb, y0 + 0.12, db]),
  ];
  if (Math.hypot(fb - fa, db - da) > 1.2) {
    const fm = (fa + fb) / 2;
    const dm = (da + db) / 2;
    p.push(L("tubo fino", [fm, y0 + 0.12, dm], [fm, y0 + 0.9, dm]));
  }
  return p;
}

export function desenhar(m: Montagem): Desenho {
  const grupos: Grupo[] = [];
  const hb = ALTURA_BASE;
  const pontos: [number, number][] = [];
  let desloc = 0;

  m.torres.forEach((t, ti) => {
    origem = desloc;
    const A = t.frente; // largura da frente
    const B = t.fundo; // profundidade
    const id = `t${ti}`;
    const topo = hb + m.altura;
    const feitos = Math.min(t.niveis.length, m.altura);
    const misto = A !== B;
    const cantos: [number, number][] = [[0, 0], [A, 0], [0, B], [A, B]];
    /** Painéis do nível na frente/atrás (largura A) ou nas laterais (largura B); revezam a cada nível. */
    const naFrente = (n: number) => (misto ? t.niveis[n] === A : n % 2 === 1);

    grupos.push({ key: `${id}-chao-${A}-${B}`, atraso: 0, partes: [{ tipo: "poligono", cls: "chao", pts: [P(-0.25, 0, -0.25), P(A + 0.25, 0, -0.25), P(A + 0.25, 0, B + 0.25), P(-0.25, 0, B + 0.25)] }] });

    if (feitos < m.altura) {
      const y1 = hb + feitos;
      grupos.push({
        key: `${id}-fantasma-${feitos}-${m.altura}-${A}-${B}`,
        atraso: 0,
        partes: [
          ...cantos.map(([f, d]) => L("fantasma", [f, y1, d], [f, topo, d])),
          { tipo: "poligono", cls: "fantasma", pts: [P(0, topo, 0), P(A, topo, 0), P(A, topo, B), P(0, topo, B)] },
        ],
      });
    }

    // base: sapatas (rosca + placa) ou rodinhas (garfo + roda)
    if (t.base !== "nenhuma") {
      const partes: Parte[] = [];
      for (const [f, d] of cantos) {
        if (t.base === "sapata") {
          partes.push(L("rosca", [f, 0.02, d], [f, hb, d]));
          partes.push(L("manivela", [f - 0.09, 0.2, d], [f + 0.09, 0.2, d]));
          const r = 0.13;
          partes.push({ tipo: "poligono", cls: "placa", pts: [P(f - r, 0.01, d - r), P(f + r, 0.01, d - r), P(f + r, 0.01, d + r), P(f - r, 0.01, d + r)] });
        } else {
          partes.push(L("garfo", [f, hb, d], [f, 0.17, d]));
          const pts: [number, number][] = [];
          for (let a = 0; a < 16; a++) {
            const ang = (a / 16) * Math.PI * 2;
            pts.push(P(f + Math.cos(ang) * 0.12, 0.12 + Math.sin(ang) * 0.12, d));
          }
          partes.push({ tipo: "poligono", cls: "roda", pts });
        }
      }
      grupos.push({ key: `${id}-base-${t.base}-${A}-${B}`, atraso: 0, partes });
    } else {
      grupos.push({ key: `${id}-sembase-${A}-${B}`, atraso: 0, partes: cantos.map(([f, d]) => L("fantasma", [f, 0, d], [f, hb, d])) });
    }

    // painéis: os do fundo/esquerda antes, os da frente/direita depois (para sobrepor certo)
    const paineisFundo: Grupo[] = [];
    const paineisFrente: Grupo[] = [];
    for (let n = 0; n < feitos; n++) {
      const y0 = hb + n;
      const chave = `${id}-n${n}-${t.niveis[n]}-${A}-${B}`;
      const atraso = Math.min(n, 10) * 0.05;
      if (naFrente(n)) {
        paineisFundo.push({ key: `${chave}-tras`, atraso, partes: painel([0, B], [A, B], y0) });
        paineisFrente.push({ key: `${chave}-frente`, atraso: atraso + 0.04, partes: painel([0, 0], [A, 0], y0) });
      } else {
        paineisFundo.push({ key: `${chave}-esq`, atraso, partes: painel([0, 0], [0, B], y0) });
        paineisFrente.push({ key: `${chave}-dir`, atraso: atraso + 0.04, partes: painel([A, 0], [A, B], y0) });
      }
    }
    grupos.push(...paineisFundo);

    if (feitos > 0) {
      // travessas: horizontais no meio do nível, de um canto ao canto oposto; a 2ª no mesmo nível fecha o X
      for (let i = 0; i < Math.min(t.travessas, feitos * 2); i++) {
        const n = i % feitos;
        const y = hb + n + 0.5;
        const sentido = (n + Math.floor(i / feitos)) % 2 === 0;
        const parte = sentido ? L("travessa", [0, y, 0], [A, y, B]) : L("travessa", [A, y, 0], [0, y, B]);
        grupos.push({ key: `${id}-trav-${i}-${A}-${B}`, atraso: 0.1, partes: [parte] });
      }

      // plataformas: pranchas de ~30 cm apoiadas entre os dois painéis do nível, do topo para baixo
      const LARG = 0.3;
      const e = 0.05;
      let j = 0;
      for (let n = feitos - 1; n >= 0 && j < t.plataformas; n--) {
        const frente = naFrente(n);
        const fila = frente ? A : B; // as pranchas se enfileiram ao longo do painel
        const vao = frente ? B : A; // e atravessam de um painel ao outro
        const porNivel = Math.max(1, Math.floor((fila + 0.04) / (LARG + 0.04)));
        const folga = (fila - porNivel * LARG) / (porNivel + 1);
        const y = hb + n + 0.9;
        // u: posição ao longo do painel; v: atravessando o vão
        const q = (u: number, v: number, yy: number) => (frente ? P(u, yy, v) : P(v, yy, u));
        for (let k = 0; k < porNivel && j < t.plataformas; k++, j++) {
          const u0 = folga + k * (LARG + folga);
          const u1 = u0 + LARG;
          const v0 = -0.04;
          const v1 = vao + 0.04;
          const lado = frente ? [q(u0, v0, y), q(u1, v0, y), q(u1, v0, y - e), q(u0, v0, y - e)] : [q(u0, v0, y), q(u0, v1, y), q(u0, v1, y - e), q(u0, v0, y - e)];
          grupos.push({
            key: `${id}-plat-${n}-${k}-${A}-${B}`,
            atraso: 0.08,
            partes: [
              { tipo: "poligono", cls: "plataforma-lado", pts: lado },
              { tipo: "poligono", cls: "plataforma", pts: [q(u0, v0, y), q(u1, v0, y), q(u1, v1, y), q(u0, v1, y)] },
            ],
          });
        }
      }
    }

    grupos.push(...paineisFrente);

    // escada pendurada na lateral direita: cada escada cobre 2 m
    for (let k = 0; k < t.escadas; k++) {
      const y0 = hb + k * 2;
      if (y0 >= hb + feitos) break;
      const y1 = Math.min(y0 + 2, hb + feitos);
      const f = A + 0.08;
      const da = B * 0.2;
      const db = da + 0.38;
      const partes: Parte[] = [L("escada", [f, y0, da], [f, y1 + 0.15, da]), L("escada", [f, y0, db], [f, y1 + 0.15, db])];
      for (let y = y0 + 0.2; y < y1; y += 0.28) partes.push(L("degrau", [f, y, da], [f, y, db]));
      grupos.push({ key: `${id}-escada-${k}-${y1}-${A}-${B}`, atraso: 0.1, partes });
    }

    for (const [f, d] of cantos) for (const y of [0, topo]) pontos.push(P(f, y, d));
    desloc += A + VAO;
  });

  // cota de altura à esquerda da primeira torre
  origem = 0;
  const a = P(-0.4, hb, 0);
  const b = P(-0.4, hb + m.altura, 0);
  grupos.push({
    key: "cota",
    atraso: 0,
    partes: [
      { tipo: "linha", cls: "cota", pts: [a, b] },
      { tipo: "linha", cls: "cota", pts: [[a[0] - 6, a[1]], [a[0] + 6, a[1]]] },
      { tipo: "linha", cls: "cota", pts: [[b[0] - 6, b[1]], [b[0] + 6, b[1]]] },
      { tipo: "texto", cls: "cota-txt", pts: [[a[0] - 12, (a[1] + b[1]) / 2]], texto: `${m.altura} m` },
    ],
  });
  pontos.push([a[0] - 30, a[1]], b);
  if (m.total > VISIVEIS) {
    const p = P(desloc - VAO + 0.15, hb + 0.5, 0);
    grupos.push({ key: "mais", atraso: 0, partes: [{ tipo: "texto", cls: "mais", pts: [p], texto: `+${m.total - VISIVEIS}` }] });
    pontos.push([p[0] + 30, p[1]]);
  }

  const xs = pontos.map((p) => p[0]);
  const ys = pontos.map((p) => p[1]);
  const pad = 18;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const vw = Math.max(...xs) - minX + pad;
  const vh = Math.max(...ys) - minY + pad + 10;
  return { grupos, viewBox: `${minX.toFixed(0)} ${minY.toFixed(0)} ${vw.toFixed(0)} ${vh.toFixed(0)}` };
}

/** Converte uma parte em atributos de SVG (usado pelos dois renderizadores). */
export function svgParte(p: Parte): { tag: "line" | "polygon" | "text"; attrs: Record<string, string | number> } {
  if (p.tipo === "linha") return { tag: "line", attrs: { class: p.cls, x1: p.pts[0][0], y1: p.pts[0][1], x2: p.pts[1][0], y2: p.pts[1][1] } };
  if (p.tipo === "poligono") return { tag: "polygon", attrs: { class: p.cls, points: p.pts.map((q) => q.join(",")).join(" ") } };
  return { tag: "text", attrs: { class: p.cls, x: p.pts[0][0], y: p.pts[0][1] } };
}
