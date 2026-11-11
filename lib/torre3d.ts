/**
 * Montagem da torre em 3D (projeção isométrica), sem depender de React.
 * O site (com Motion) e a prévia (JS puro) desenham a mesma lista de grupos.
 *
 * Eixos em metros: x = largura do painel, y = altura, z = profundidade (entre os dois painéis).
 */
import type { Item } from "./site";

export type Base = "sapata" | "rodinha" | "nenhuma";
export type TorreMontagem = {
  largura: number;
  niveisMontados: number;
  travessas: number;
  plataformas: number;
  escadas: number;
  base: Base;
};
export type Montagem = { niveis: number; torres: TorreMontagem[]; total: number };

export type Parte =
  | { tipo: "linha"; cls: string; pts: [number, number][] }
  | { tipo: "poligono"; cls: string; pts: [number, number][] }
  | { tipo: "texto"; cls: string; pts: [number, number][]; texto: string };
export type Grupo = { key: string; atraso: number; partes: Parte[] };
export type Desenho = { grupos: Grupo[]; viewBox: string };

const PROF = 1; // distância entre os painéis da frente e de trás
const ALTURA_BASE = 0.32;
const VAO = 0.9; // espaço entre torres vizinhas
const VISIVEIS = 3;
const U = 48; // px por metro antes do viewBox escalar
// Projeção dimétrica: painéis quase de frente (x a 14°) e a profundidade recuando para a direita (z a 32°, encurtada).
const AX = (14 * Math.PI) / 180;
const AZ = (32 * Math.PI) / 180;
const KZ = 0.62;

/** Largura em metros a partir do nome ("Andaime 1,5 m" → 1.5). */
export function larguraDe(nome = "") {
  const m = nome.match(/(\d+(?:[.,]\d+)?)\s*m\b/i);
  return m ? Number(m[1].replace(",", ".")) : 1;
}

const soma = (itens: Item[], qtd: Record<string, number>, f: (i: Item) => boolean) =>
  itens.filter(f).reduce((s, i) => s + (qtd[i.id] ?? 0), 0);

/** Divide n peças entre as torres, uma por vez (a primeira torre recebe as sobras). */
const dividir = (n: number, torres: number, t: number) => Math.floor(n / torres) + (t < n % torres ? 1 : 0);

/** Transforma as quantidades da lista no que cada torre tem montado. */
export function montar(itens: Item[], qtd: Record<string, number>, altura: number, torres: number): Montagem {
  const paineis = itens.filter((i) => i.grupo === "largura").map((i) => ({ largura: larguraDe(i.nome), resta: qtd[i.id] ?? 0 }));
  const travessas = soma(itens, qtd, (i) => /travess/i.test(i.nome));
  const plataformas = soma(itens, qtd, (i) => /plataforma/i.test(i.nome));
  const escadas = soma(itens, qtd, (i) => /escada/i.test(i.nome));
  const rodinhas = soma(itens, qtd, (i) => i.grupo === "base" && /rod/i.test(i.nome));
  const sapatas = soma(itens, qtd, (i) => i.grupo === "base" && !/rod/i.test(i.nome));

  const lista: TorreMontagem[] = [];
  for (let t = 0; t < torres; t++) {
    // cada torre pega painéis da primeira largura que ainda tem peças
    let precisa = 2 * altura;
    let largura = paineis.find((p) => p.resta > 0)?.largura ?? paineis[0]?.largura ?? 1;
    let recebidos = 0;
    for (const p of paineis) {
      if (precisa === 0) break;
      const pega = Math.min(p.resta, precisa);
      if (pega > 0 && recebidos === 0) largura = p.largura;
      p.resta -= pega;
      precisa -= pega;
      recebidos += pega;
    }
    lista.push({
      largura,
      niveisMontados: Math.floor(recebidos / 2),
      travessas: dividir(travessas, torres, t),
      plataformas: dividir(plataformas, torres, t),
      escadas: dividir(escadas, torres, t),
      base: t < sapatas ? "sapata" : t < sapatas + rodinhas ? "rodinha" : "nenhuma",
    });
  }
  return { niveis: altura, torres: lista.slice(0, VISIVEIS), total: torres };
}

/** Projeção: metros → px. z positivo vem para perto de quem olha (para baixo e à esquerda). */
const P = (x: number, y: number, z: number): [number, number] => [
  +((x * Math.cos(AX) - z * KZ * Math.cos(AZ)) * U).toFixed(1),
  +((x * Math.sin(AX) + z * KZ * Math.sin(AZ) - y) * U).toFixed(1),
];
const L = (cls: string, a: [number, number, number], b: [number, number, number]): Parte => ({ tipo: "linha", cls, pts: [P(...a), P(...b)] });

function painel(ox: number, y0: number, z: number, w: number): Parte[] {
  const p: Parte[] = [
    L("tubo", [ox, y0, z], [ox, y0 + 1, z]),
    L("tubo", [ox + w, y0, z], [ox + w, y0 + 1, z]),
    L("tubo", [ox, y0 + 0.9, z], [ox + w, y0 + 0.9, z]),
    L("tubo", [ox, y0 + 0.12, z], [ox + w, y0 + 0.12, z]),
  ];
  if (w > 1.2) p.push(L("tubo fino", [ox + w / 2, y0 + 0.12, z], [ox + w / 2, y0 + 0.9, z]));
  return p;
}

export function desenhar(m: Montagem): Desenho {
  const grupos: Grupo[] = [];
  const hb = ALTURA_BASE;
  let ox = 0;
  const pontos: [number, number][] = [];

  m.torres.forEach((t, ti) => {
    const w = Math.max(0.6, Math.min(2, t.largura));
    const id = `t${ti}`;
    const topo = hb + m.niveis;
    const feitos = Math.min(t.niveisMontados, m.niveis);
    const cantos: [number, number][] = [
      [ox, 0], [ox + w, 0], [ox, PROF], [ox + w, PROF],
    ];

    // sombra no chão
    grupos.push({ key: `${id}-chao`, atraso: 0, partes: [{ tipo: "poligono", cls: "chao", pts: [P(ox - 0.25, 0, -0.25), P(ox + w + 0.25, 0, -0.25), P(ox + w + 0.25, 0, PROF + 0.25), P(ox - 0.25, 0, PROF + 0.25)] }] });

    // o que ainda falta montar, tracejado
    if (feitos < m.niveis) {
      const y1 = hb + feitos;
      grupos.push({
        key: `${id}-fantasma-${feitos}-${m.niveis}-${w}`,
        atraso: 0,
        partes: [
          ...cantos.map(([x, z]) => L("fantasma", [x, y1, z], [x, topo, z])),
          { tipo: "poligono", cls: "fantasma", pts: [P(ox, topo, 0), P(ox + w, topo, 0), P(ox + w, topo, PROF), P(ox, topo, PROF)] },
        ],
      });
    }

    // base: sapatas (rosca + placa) ou rodinhas (garfo + roda)
    if (t.base !== "nenhuma") {
      const partes: Parte[] = [];
      for (const [x, z] of cantos) {
        if (t.base === "sapata") {
          partes.push(L("rosca", [x, 0.02, z], [x, hb, z]));
          partes.push(L("manivela", [x - 0.09, 0.2, z], [x + 0.09, 0.2, z]));
          const r = 0.13;
          partes.push({ tipo: "poligono", cls: "placa", pts: [P(x - r, 0.01, z - r), P(x + r, 0.01, z - r), P(x + r, 0.01, z + r), P(x - r, 0.01, z + r)] });
        } else {
          partes.push(L("garfo", [x, hb, z], [x, 0.17, z]));
          const pts: [number, number][] = [];
          for (let a = 0; a < 16; a++) {
            const ang = (a / 16) * Math.PI * 2;
            pts.push(P(x + Math.cos(ang) * 0.12, 0.12 + Math.sin(ang) * 0.12, z));
          }
          partes.push({ tipo: "poligono", cls: "roda", pts });
        }
      }
      grupos.push({ key: `${id}-base-${t.base}`, atraso: 0, partes });
    } else {
      grupos.push({ key: `${id}-sembase`, atraso: 0, partes: cantos.map(([x, z]) => L("fantasma", [x, 0, z], [x, hb, z])) });
    }

    // painéis de trás (z=0), travessas da lateral do fundo, plataformas, painéis da frente, travessas da lateral da frente
    for (let n = 0; n < feitos; n++) {
      grupos.push({ key: `${id}-tras-${n}-${w}`, atraso: Math.min(n, 10) * 0.04, partes: painel(ox, hb + n, 0, w) });
    }
    const trav = (i: number, x: number) => {
      const n = i % feitos;
      const y0 = hb + n;
      return { key: `${id}-trav-${i}`, atraso: 0.1, partes: [L("travessa", [x, y0 + 0.15, 0], [x, y0 + 0.88, PROF]), L("travessa", [x, y0 + 0.88, 0], [x, y0 + 0.15, PROF])] };
    };
    if (feitos > 0) {
      for (let i = 0; i < Math.min(t.travessas, feitos); i++) grupos.push(trav(i, ox));
      // plataformas: pranchas de ~30 cm apoiadas de um painel ao outro, enchendo o piso do topo para baixo
      const LARG = 0.3;
      const porNivel = Math.max(1, Math.floor((w + 0.04) / (LARG + 0.04)));
      const folga = (w - porNivel * LARG) / (porNivel + 1);
      for (let j = 0; j < Math.min(t.plataformas, feitos * porNivel); j++) {
        const nivel = feitos - 1 - Math.floor(j / porNivel);
        const y = hb + nivel + 0.9; // em cima do travessão do painel
        const xa = ox + folga + (j % porNivel) * (LARG + folga);
        const xb = xa + LARG;
        const e = 0.05; // espessura
        const z0 = -0.04;
        const z1 = PROF + 0.04;
        grupos.push({
          key: `${id}-plat-${j}-${w}`,
          atraso: 0.08,
          partes: [
            { tipo: "poligono", cls: "plataforma-lado", pts: [P(xa, y, z1), P(xb, y, z1), P(xb, y - e, z1), P(xa, y - e, z1)] },
            { tipo: "poligono", cls: "plataforma-lado", pts: [P(xb, y, z0), P(xb, y, z1), P(xb, y - e, z1), P(xb, y - e, z0)] },
            { tipo: "poligono", cls: "plataforma", pts: [P(xa, y, z0), P(xb, y, z0), P(xb, y, z1), P(xa, y, z1)] },
            L("gancho", [xa + 0.05, y, z1], [xa + 0.05, y - 0.08, z1]),
            L("gancho", [xb - 0.05, y, z1], [xb - 0.05, y - 0.08, z1]),
          ],
        });
      }
    }
    for (let n = 0; n < feitos; n++) {
      grupos.push({ key: `${id}-frente-${n}-${w}`, atraso: Math.min(n, 10) * 0.04 + 0.05, partes: painel(ox, hb + n, PROF, w) });
    }
    if (feitos > 0) {
      for (let i = feitos; i < Math.min(t.travessas, feitos * 2); i++) grupos.push(trav(i, ox + w));
      // escada presa na frente da torre: cada escada cobre 2 m
      for (let k = 0; k < t.escadas; k++) {
        const y0 = hb + k * 2;
        if (y0 >= hb + feitos) break;
        const y1 = Math.min(y0 + 2, hb + feitos);
        const z = PROF + 0.08;
        const xa = ox + w * 0.18;
        const xb = xa + 0.38;
        const partes: Parte[] = [L("escada", [xa, y0, z], [xa, y1 + 0.15, z]), L("escada", [xb, y0, z], [xb, y1 + 0.15, z])];
        for (let y = y0 + 0.2; y < y1; y += 0.28) partes.push(L("degrau", [xa, y, z], [xb, y, z]));
        grupos.push({ key: `${id}-escada-${k}-${y1}-${w}`, atraso: 0.1, partes });
      }
    }

    for (const [x, z] of cantos) for (const y of [0, topo]) pontos.push(P(x, y, z));
    ox += w + VAO;
  });

  // cota de altura à esquerda da primeira torre
  const xC = -0.35;
  const a = P(xC, hb, PROF);
  const b = P(xC, hb + m.niveis, PROF);
  grupos.push({
    key: "cota",
    atraso: 0,
    partes: [
      { tipo: "linha", cls: "cota", pts: [a, b] },
      { tipo: "linha", cls: "cota", pts: [[a[0] - 6, a[1]], [a[0] + 6, a[1]]] },
      { tipo: "linha", cls: "cota", pts: [[b[0] - 6, b[1]], [b[0] + 6, b[1]]] },
      { tipo: "texto", cls: "cota-txt", pts: [[a[0] - 12, (a[1] + b[1]) / 2]], texto: `${m.niveis} m` },
    ],
  });
  pontos.push([a[0] - 30, a[1]], b);
  if (m.total > VISIVEIS) {
    const p = P(ox - VAO + 0.3, hb + 0.5, PROF);
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
