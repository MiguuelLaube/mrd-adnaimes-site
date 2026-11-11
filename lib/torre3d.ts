/**
 * Montagem da torre em 3D, sem depender de React.
 * O site (com Motion) e a prévia (JS puro) desenham a mesma lista de grupos.
 *
 * Como a torre real é montada:
 * - cada nível (1 m) usa um par de painéis iguais, um de cada lado;
 * - os painéis revezam de posição a cada nível: num nível ficam nas laterais, no seguinte na frente e atrás;
 * - numa torre mista, os painéis de 1,5 m formam a frente e os de 1 m as laterais, intercalando os níveis;
 * - a travessa é uma barra horizontal por nível, onde o painel começa, ligando um canto ao canto oposto.
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
  /** Comprimento de cada prancha (pequena = menor largura de painel, grande = maior). */
  plataformas: number[];
  escadas: number;
  base: Base;
};
export type Montagem = {
  /** Altura da torre mais alta (m). */
  altura: number;
  /** Altura de cada torre (todas, não só as desenhadas). */
  alturas: number[];
  /** Soma dos níveis de todas as torres: base das sugestões "por metro". */
  niveisTotal: number;
  torres: TorreMontagem[];
  total: number;
  /** Painéis que não encaixam na alternância da torre mista. */
  sobra: { largura: number; paineis: number }[];
  /** Pranchas pedidas que não têm nível com vão do tamanho delas (ou não cabem mais). */
  semLugar: number;
};

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

const LARG_PRANCHA = 0.3;
/** Quantas pranchas de ~30 cm cabem lado a lado ao longo de um painel desta largura. */
export const pranchasPorNivel = (largura: number) => Math.max(1, Math.floor((largura + 0.04) / (LARG_PRANCHA + 0.04)));

/** Divide n peças entre as torres (a primeira torre recebe as sobras). */
const dividir = (n: number, torres: number, t: number) => Math.floor(n / torres) + (t < n % torres ? 1 : 0);

type TorrePlano = { niveis: number[]; frente: number; fundo: number };

/**
 * Distribui os pares de painéis pelas torres. A altura sai da quantidade de painéis:
 * todas as torres ficam com a mesma altura H (a maior possível) e os pares que sobram
 * sobem um nível a mais nas primeiras torres que conseguem recebê-los.
 * Torre mista alterna as larguras nível a nível; por isso nem todo par sempre encaixa (vira "sobra").
 */
// O planejamento é a parte cara e se repete muito (cada botão testa a mudança); guarda os últimos resultados.
const memoria = new Map<string, ReturnType<typeof planejarSemMemoria>>();
function planejar(pares: Map<number, number>, T: number, padrao: number) {
  const chave = `${T}|${padrao}|${[...pares].sort((a, b) => a[0] - b[0]).join(";")}`;
  let r = memoria.get(chave);
  if (!r) {
    r = planejarSemMemoria(pares, T, padrao);
    if (memoria.size > 300) memoria.delete(memoria.keys().next().value!);
    memoria.set(chave, r);
  }
  // cópia: quem usa o plano não pode alterar o que está guardado
  return { torres: r.torres.map((t) => ({ ...t, niveis: [...t.niveis] })), sobra: new Map(r.sobra) };
}

function planejarSemMemoria(pares: Map<number, number>, T: number, padrao: number) {
  const larguras = [...pares.keys()].filter((w) => (pares.get(w) ?? 0) > 0).sort((x, y) => y - x);
  const L = larguras[0] ?? padrao;
  const S = larguras[larguras.length - 1] ?? padrao;
  const total = [...pares.values()].reduce((s, v) => s + v, 0);

  // 1) alturas iguais: total de pares dividido pelas torres (as primeiras ganham a sobra de 1 nível)
  const alturas = Array.from({ length: T }, (_, t) => Math.floor(total / T) + (t < total % T ? 1 : 0));

  // 2) cada largura se espalha pelas torres, uma por vez, até a altura de cada uma
  const conta = alturas.map(() => new Map<number, number>());
  const livre = [...alturas];
  for (const w of larguras) {
    let resta = pares.get(w) ?? 0;
    for (let t = 0; resta > 0; t = (t + 1) % T) {
      if (livre.every((x) => x === 0)) break;
      if (livre[t] === 0) continue;
      conta[t].set(w, (conta[t].get(w) ?? 0) + 1);
      livre[t]--;
      resta--;
    }
  }

  // 3) dentro da torre: a largura com menos pares se espalha por igual entre a outra,
  //    sempre intercalada (nunca na ponta quando dá para ficar no meio)
  const torres: TorrePlano[] = conta.map((c, t) => {
    const n = alturas[t];
    const nL = c.get(L) ?? 0;
    const nS = n - nL;
    const [poucos, muitos, m] = nL <= nS ? [L, S, nL] : [S, L, nS];
    const niveis: number[] = Array(n).fill(muitos);
    // posições centradas: com 1 de 3 fica no meio (1 / 1,5 / 1); com 2 de 4, alterna (1 / 1,5 / 1 / 1,5)
    for (let i = 0; i < m; i++) niveis[Math.floor(((i + 0.5) * n) / m)] = poucos;
    const misto = nL > 0 && nS > 0;
    const w = nL === n ? L : S;
    return { niveis, frente: misto ? L : w, fundo: misto ? S : w };
  });

  return { torres, sobra: new Map<number, number>() };
}

/** Transforma as quantidades da lista no que cada torre tem montado. */
export function montar(itens: Item[], qtd: Record<string, number>, torres: number): Montagem {
  const paineis = itens.filter((i) => i.grupo === "largura");
  const pares = new Map<number, number>();
  for (const i of paineis) pares.set(larguraDe(i.nome), (pares.get(larguraDe(i.nome)) ?? 0) + Math.floor((qtd[i.id] ?? 0) / 2));
  const padrao = paineis.length ? larguraDe(paineis[0].nome) : 1;
  const plano = planejar(pares, torres, padrao);
  const larguras = [...pares.keys()];
  const menor = larguras.length ? Math.min(...larguras) : 1;
  const maior = larguras.length ? Math.max(...larguras) : 1;
  const plataformas: number[] = [];
  for (const i of itens.filter((x) => /plataforma/i.test(x.nome))) {
    const comp = /grande/i.test(i.nome) ? maior : /pequen/i.test(i.nome) ? menor : larguraDe(i.nome);
    for (let k = 0; k < (qtd[i.id] ?? 0); k++) plataformas.push(comp);
  }
  const travessas = soma(itens, qtd, (i) => /travess/i.test(i.nome));
  const escadas = soma(itens, qtd, (i) => /escada/i.test(i.nome));
  const rodinhas = soma(itens, qtd, (i) => i.grupo === "base" && /rod/i.test(i.nome));
  const sapatas = soma(itens, qtd, (i) => i.grupo === "base" && !/rod/i.test(i.nome));

  // cada prancha vai para uma torre que ainda tenha lugar num nível com vão do tamanho dela (revezando entre as torres)
  const capacidade = plano.torres.map((p) => {
    const cap = new Map<number, number>();
    for (const w of p.niveis) {
      const vao = p.frente === p.fundo ? w : w === p.frente ? p.fundo : p.frente;
      cap.set(vao, (cap.get(vao) ?? 0) + pranchasPorNivel(w));
    }
    return cap;
  });
  const pranchas: number[][] = plano.torres.map(() => []);
  let semLugar = 0;
  let vez = 0;
  for (const c of plataformas) {
    let ok = false;
    for (let k = 0; k < plano.torres.length && !ok; k++) {
      const t = (vez + k) % plano.torres.length;
      const vao = [...capacidade[t].keys()].find((v) => Math.abs(v - c) < 0.01);
      if (vao !== undefined && capacidade[t].get(vao)! > 0) {
        capacidade[t].set(vao, capacidade[t].get(vao)! - 1);
        pranchas[t].push(c);
        vez = t + 1;
        ok = true;
      }
    }
    if (!ok) semLugar++;
  }

  const lista: TorreMontagem[] = plano.torres.map((p, t) => ({
    ...p,
    // travessas: uma por nível de cada torre, as extras ficam na primeira
    travessas: Math.min(p.niveis.length, Math.max(0, travessas - plano.torres.slice(0, t).reduce((s, x) => s + x.niveis.length, 0))),
    plataformas: pranchas[t] ?? [],
    escadas: dividir(escadas, torres, t),
    base: t < sapatas ? "sapata" : t < sapatas + rodinhas ? "rodinha" : "nenhuma",
  }));
  const alturas = plano.torres.map((t) => t.niveis.length);
  const sobra = [...plano.sobra.entries()].filter(([, p]) => p > 0).sort((a, b) => a[0] - b[0]).map(([largura, p]) => ({ largura, paineis: p * 2 }));
  return { altura: Math.max(0, ...alturas), alturas, niveisTotal: alturas.reduce((s, h) => s + h, 0), torres: lista.slice(0, VISIVEIS), total: torres, sobra, semLugar };
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
    const feitos = t.niveis.length;
    const topo = hb + Math.max(1, feitos);
    const misto = A !== B;
    const cantos: [number, number][] = [[0, 0], [A, 0], [0, B], [A, B]];
    /** Painéis do nível na frente/atrás (largura A) ou nas laterais (largura B); revezam a cada nível. */
    const naFrente = (n: number) => (misto ? t.niveis[n] === A : n % 2 === 1);

    grupos.push({ key: `${id}-chao-${A}-${B}`, atraso: 0, partes: [{ tipo: "poligono", cls: "chao", pts: [P(-0.25, 0, -0.25), P(A + 0.25, 0, -0.25), P(A + 0.25, 0, B + 0.25), P(-0.25, 0, B + 0.25)] }] });

    if (feitos === 0) {
      const y1 = hb;
      grupos.push({
        key: `${id}-fantasma-${A}-${B}`,
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
      // travessas: uma barra horizontal por nível, logo onde o painel começa (no travessão de baixo),
      // de um canto ao canto oposto, alternando o sentido. Travessas extras entram no pedido, mas o desenho
      // mostra uma por nível.
      for (let i = 0; i < Math.min(t.travessas, feitos); i++) {
        const n = i;
        const y = hb + n + 0.12;
        const sentido = n % 2 === 0;
        const parte = sentido ? L("travessa", [0, y, 0], [A, y, B]) : L("travessa", [A, y, 0], [0, y, B]);
        grupos.push({ key: `${id}-trav-${i}-${A}-${B}`, atraso: 0.1, partes: [parte] });
      }

      // plataformas: pranchas de ~30 cm apoiadas entre os dois painéis do nível, do topo para baixo.
      // Cada prancha tem o próprio comprimento e só vai para um nível cujo vão é do tamanho dela.
      const LARG = LARG_PRANCHA;
      const e = 0.05;
      const resta = [...t.plataformas];
      for (let n = feitos - 1; n >= 0 && resta.length; n--) {
        if (!resta.some((c) => Math.abs(c - (naFrente(n) ? B : A)) < 0.01)) continue;
        const frente = naFrente(n);
        const fila = frente ? A : B; // as pranchas se enfileiram ao longo do painel
        const vao = frente ? B : A; // e atravessam de um painel ao outro
        const porNivel = pranchasPorNivel(fila);
        const folga = (fila - porNivel * LARG) / (porNivel + 1);
        const y = hb + n + 0.9;
        // u: posição ao longo do painel; v: atravessando o vão
        const q = (u: number, v: number, yy: number) => (frente ? P(u, yy, v) : P(v, yy, u));
        // só entra prancha que alcança os dois painéis deste nível
        const serve = (c: number) => Math.abs(c - vao) < 0.01;
        for (let k = 0; k < porNivel; k++) {
          const idx = resta.findIndex(serve);
          if (idx < 0) break;
          const comp = resta.splice(idx, 1)[0];
          const u0 = folga + k * (LARG + folga);
          const u1 = u0 + LARG;
          const v0 = vao / 2 - comp / 2 - 0.04;
          const v1 = vao / 2 + comp / 2 + 0.04;
          const lado = frente ? [q(u0, v0, y), q(u1, v0, y), q(u1, v0, y - e), q(u0, v0, y - e)] : [q(u0, v0, y), q(u0, v1, y), q(u0, v1, y - e), q(u0, v0, y - e)];
          grupos.push({
            key: `${id}-plat-${n}-${k}-${comp}-${A}-${B}`,
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
