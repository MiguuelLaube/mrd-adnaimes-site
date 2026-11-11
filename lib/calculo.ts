/**
 * Regras de quantidade da calculadora, compartilhadas entre o site e a prévia.
 *
 * A altura não é escolhida: ela sai da quantidade de painéis (cada par = 1 m por torre).
 * Toda mudança passa pela mesma validação, então a lista nunca fica num estado impossível:
 * - cada torre tem de 1 nível até a altura máxima;
 * - a base tem exatamente 1 jogo por torre (o + de um tipo troca com o outro);
 * - itens "por metro" (travessas) vão da sugestão até o dobro dela;
 * - escadas cobrem no máximo a altura (1 a cada 2 m por torre);
 * - plataformas só até onde cabem, em níveis cujo vão elas alcançam.
 */
import type { Item, Site } from "./site";
import { larguraDe, montar, type Montagem } from "./torre3d";

export type Regras = Site["pedido"];
const SEM_REGRAS: Regras = { minimoPaineis: 0, minimoPorTamanho: 0, alturaMaxima: 999 };

export type Qtd = Record<string, number>;

const ehPainel = (it: Item) => it.grupo === "largura";
const ehBase = (it: Item) => it.grupo === "base";
const ehEscada = (it: Item) => /escada/i.test(it.nome);
const ehPlataforma = (it: Item) => /plataforma/i.test(it.nome);
const metros = (w: number) => String(w).replace(".", ",");
const somaDe = (its: Item[], q: Qtd) => its.reduce((s, i) => s + (q[i.id] ?? 0), 0);

/** Sugestão de um item: "por metro" usa a soma dos níveis de todas as torres; "por torre", o número de torres. */
export function sugerida(it: Item, niveis: number, torres: number) {
  if (it.regra === "por_metro") return it.quantidade * niveis;
  if (it.regra === "por_torre") return it.quantidade * torres;
  return 0;
}

export function gruposDe(itens: Item[]) {
  const g: Record<string, Item[]> = {};
  for (const it of itens) if (it.grupo) (g[it.grupo] ??= []).push(it);
  return g;
}

/** Níveis montados somando todas as torres (o "metro" das sugestões). */
export const niveisDe = (itens: Item[], qtd: Qtd, torres: number) => montar(itens, qtd, torres).niveisTotal;

/** Mínimo de um grupo: painéis precisam de pelo menos 1 nível por torre; a base, 1 jogo por torre. */
export function minimoGrupo(itens: Item[], grupo: string, niveis: number, torres: number, regras: Regras = SEM_REGRAS) {
  if (grupo === "largura") return Math.max(regras.minimoPaineis, 2 * torres);
  return Math.max(0, ...itens.filter((i) => i.grupo === grupo).map((i) => sugerida(i, niveis, torres)));
}

/** Ponto de partida: painéis de 1 m para a altura inicial, sapatas, e o resto pela sugestão. */
export function quantidadesIniciais(itens: Item[], alturaInicial: number, torres: number, regras: Regras = SEM_REGRAS): Qtd {
  const q: Qtd = {};
  const altura = Math.min(alturaInicial, regras.alturaMaxima);
  const niveis = altura * torres;
  for (const [g, its] of Object.entries(gruposDe(itens))) {
    its.forEach((it, i) => (q[it.id] = i > 0 ? 0 : g === "largura" ? 2 * niveis : minimoGrupo(itens, g, niveis, torres, regras)));
  }
  for (const it of itens) if (!it.grupo) q[it.id] = sugerida(it, niveis, torres);
  return q;
}

/** Itens soltos acompanham a mudança de níveis/torres, mantendo o que foi somado além da sugestão. */
function acompanhar(itens: Item[], antes: Qtd, depois: Qtd, de: { niveis: number; torres: number }, para: { niveis: number; torres: number }) {
  for (const it of itens) {
    if (it.grupo) continue;
    const extra = Math.max(0, (antes[it.id] ?? 0) - sugerida(it, de.niveis, de.torres));
    depois[it.id] = sugerida(it, para.niveis, para.torres) + extra;
  }
  return depois;
}

/** Máximo de escadas: cada escada cobre 2 m de uma torre. */
const maxEscadas = (m: Montagem) => m.alturas.reduce((s, h) => s + Math.ceil(h / 2), 0);

/**
 * Traz a lista para dentro dos limites, mexendo só no que depende da montagem
 * (base, travessas, escadas, plataformas). Painéis não são alterados aqui.
 */
export function limitar(itens: Item[], qtd: Qtd, torres: number): Qtd {
  const q: Qtd = { ...qtd };
  const m = montar(itens, q, torres);

  // base: exatamente 1 jogo por torre
  const bases = itens.filter(ehBase);
  if (bases.length) {
    let diff = torres - somaDe(bases, q);
    while (diff > 0) {
      const maior = bases.reduce((a, b) => ((q[b.id] ?? 0) > (q[a.id] ?? 0) ? b : a));
      q[maior.id] = (q[maior.id] ?? 0) + 1;
      diff--;
    }
    while (diff < 0) {
      const menor = [...bases].reverse().filter((b) => (q[b.id] ?? 0) > 0).sort((a, b) => (q[a.id] ?? 0) - (q[b.id] ?? 0))[0];
      q[menor.id] -= 1;
      diff++;
    }
  }

  for (const it of itens) {
    if (it.grupo) continue;
    // "por metro" (travessas): da sugestão até o dobro
    if (it.regra === "por_metro") {
      const min = sugerida(it, m.niveisTotal, torres);
      q[it.id] = Math.min(Math.max(q[it.id] ?? 0, min), 2 * min);
    }
    if (it.regra === "por_torre") q[it.id] = Math.max(q[it.id] ?? 0, sugerida(it, m.niveisTotal, torres));
  }

  // escadas: no máximo o que cobre a altura
  const escadas = itens.filter(ehEscada);
  let excesso = somaDe(escadas, q) - maxEscadas(m);
  for (const it of escadas) {
    const tira = Math.min(q[it.id] ?? 0, Math.max(0, excesso));
    q[it.id] = (q[it.id] ?? 0) - tira;
    excesso -= tira;
  }

  // plataformas: tira as que não têm lugar (primeiro as do tipo que não cabe)
  const plataformas = itens.filter(ehPlataforma);
  for (let guarda = 0; guarda < 500 && montar(itens, q, torres).semLugar > 0; guarda++) {
    const antes = montar(itens, q, torres).semLugar;
    const alvo =
      plataformas.find((p) => (q[p.id] ?? 0) > 0 && montar(itens, { ...q, [p.id]: q[p.id] - 1 }, torres).semLugar < antes) ??
      plataformas.find((p) => (q[p.id] ?? 0) > 0);
    if (!alvo) break;
    q[alvo.id] -= 1;
  }
  return q;
}

/** Painéis andam em pares (cada nível usa 2 iguais); os outros itens, de 1 em 1, sem passar do mínimo. */
export function passo(it: Item, atual: number, d: number, minimo: number, regras: Regras = SEM_REGRAS) {
  if (!ehPainel(it)) return Math.max(minimo, atual + d);
  const m = Math.max(2, regras.minimoPorTamanho);
  if (d > 0) return atual === 0 ? m : atual + 2;
  return atual <= m ? 0 : atual - 2;
}

/** A mudança pedida, antes da validação. */
function tentativa(itens: Item[], qtd: Qtd, it: Item, d: number, minimo: number, torres: number, regras: Regras): Qtd {
  // base cheia: o + de um tipo troca um jogo do outro tipo
  if (ehBase(it) && d > 0) {
    const bases = itens.filter(ehBase);
    if (somaDe(bases, qtd) >= torres) {
      const outro = bases.filter((b) => b.id !== it.id && (qtd[b.id] ?? 0) > 0).sort((a, b) => (qtd[b.id] ?? 0) - (qtd[a.id] ?? 0))[0];
      return outro ? { ...qtd, [outro.id]: qtd[outro.id] - 1, [it.id]: (qtd[it.id] ?? 0) + 1 } : qtd;
    }
  }
  let novo = { ...qtd, [it.id]: passo(it, qtd[it.id] ?? 0, d, minimo, regras) };
  if (!ehPainel(it)) return novo;
  // Começar a usar uma largura numa torre que só tinha a outra: em vez de empilhar (impossível montar),
  // converte para torre alternada com a mesma altura, trocando pares da outra largura por esta.
  if (d > 0 && (qtd[it.id] ?? 0) === 0 && !montar(itens, novo, torres).valida) {
    const outros = itens.filter((i) => ehPainel(i) && i.id !== it.id && (qtd[i.id] ?? 0) >= 2);
    const totalPares = somaDe(itens.filter(ehPainel), qtd) / 2;
    for (let x = 1; x <= totalPares && outros.length; x++) {
      const tentativa: Qtd = { ...qtd, [it.id]: 2 * x };
      let tira = x;
      for (const o of outros) {
        const t = Math.min(tira, Math.floor((tentativa[o.id] ?? 0) / 2));
        tentativa[o.id] -= 2 * t;
        tira -= t;
      }
      if (tira === 0 && montar(itens, tentativa, torres).valida) {
        novo = tentativa;
        break;
      }
    }
  }
  // painéis mudam a altura: as travessas acompanham
  return acompanhar(itens, qtd, novo, { niveis: niveisDe(itens, qtd, torres), torres }, { niveis: niveisDe(itens, novo, torres), torres });
}

/** A lista respeita a altura máxima e tem pelo menos 1 nível em cada torre? */
function paineisValidos(itens: Item[], q: Qtd, torres: number, regras: Regras) {
  const m = montar(itens, q, torres);
  const total = somaDe(itens.filter(ehPainel), q);
  return m.valida && m.altura <= regras.alturaMaxima && total >= minimoGrupo(itens, "largura", 0, torres, regras);
}

/**
 * O + ou − deste item pode ser usado agora?
 * Só se a mudança acontece de fato, continua válida e não é desfeita pelos limites.
 */
export function podeMudar(itens: Item[], qtd: Qtd, it: Item, d: number, minimo: number, torres: number, regras: Regras = SEM_REGRAS) {
  const t = tentativa(itens, qtd, it, d, minimo, torres, regras);
  if ((t[it.id] ?? 0) === (qtd[it.id] ?? 0)) return false;
  if (ehPainel(it)) return paineisValidos(itens, t, torres, regras);
  return (limitar(itens, t, torres)[it.id] ?? 0) === (t[it.id] ?? 0);
}

/** Toque no + ou no − de um item. Se a mudança não for válida, nada muda. */
export function mudar(itens: Item[], qtd: Qtd, it: Item, d: number, minimo: number, torres: number, regras: Regras = SEM_REGRAS): Qtd {
  if (!podeMudar(itens, qtd, it, d, minimo, torres, regras)) return qtd;
  return limitar(itens, tentativa(itens, qtd, it, d, minimo, torres, regras), torres);
}

/** Situação de um grupo, com o texto do selo. */
export function statusGrupo(itens: Item[], grupo: string, qtd: Qtd, torres: number, regras: Regras = SEM_REGRAS) {
  const its = itens.filter((i) => i.grupo === grupo);
  const m = montar(itens, qtd, torres);
  const min = minimoGrupo(itens, grupo, m.niveisTotal, torres, regras);
  const total = somaDe(its, qtd);
  if (total < min) return { ok: false, texto: `Faltam ${min - total}` };
  if (grupo === "largura") {
    if (!m.valida) return { ok: false, texto: "Não intercala" };
    const pouco = its.find((i) => (qtd[i.id] ?? 0) > 0 && (qtd[i.id] ?? 0) < regras.minimoPorTamanho);
    if (pouco) return { ok: false, texto: `Mín. ${regras.minimoPorTamanho} de cada` };
    if (m.sobra.length) return { ok: false, texto: `Sobram ${m.sobra.map((s) => `${s.paineis} de ${metros(s.largura)} m`).join(" e ")}` };
    const alturas = [...new Set(m.alturas)].sort((a, b) => b - a);
    return { ok: true, texto: `${alturas.join(" e ")} m ✓` };
  }
  return { ok: true, texto: `${total} de ${min} ✓` };
}

/** Dá para ter esta quantidade de torres? (1 a 20, e todas as torres continuam montáveis) */
export function podeMudarTorres(itens: Item[], qtd: Qtd, torres: number, d: number, regras: Regras = SEM_REGRAS) {
  const n = torres + d;
  if (n < 1 || n > 20) return false;
  const q = mudarTorres(itens, qtd, torres, n, regras);
  return montar(itens, q, n).valida && montar(itens, q, n).altura <= regras.alturaMaxima;
}

/** Por que o + dos painéis está travado. */
export function motivoPainel(itens: Item[], qtd: Qtd, it: Item, torres: number, regras: Regras = SEM_REGRAS) {
  const t = tentativa(itens, qtd, it, 1, 0, torres, regras);
  if (montar(itens, t, torres).altura > regras.alturaMaxima) return `Altura máxima: ${regras.alturaMaxima} m`;
  return "Para intercalar, adicione o outro tamanho";
}

/**
 * Mudar o número de torres sem perder o que a pessoa escolheu:
 * - painéis: a torre nova copia a composição da primeira (mesma altura e mistura); ao tirar uma, sai essa mesma composição;
 * - base e itens soltos se ajustam pelos limites, mantendo os extras.
 */
export function mudarTorres(itens: Item[], qtd: Qtd, de: number, para: number, regras: Regras = SEM_REGRAS): Qtd {
  if (para < 1 || para > 20 || para === de) return qtd;
  const q: Qtd = { ...qtd };
  const m = montar(itens, qtd, de);
  const paineis = itens.filter(ehPainel);
  const modelo = m.torres[0]?.niveis.length ? m.torres[0].niveis : [larguraDe(paineis[0]?.nome)];
  const itemDe = (w: number) => paineis.find((i) => larguraDe(i.nome) === w) ?? paineis[0];

  for (let t = de; t < para; t++) for (const w of modelo) q[itemDe(w).id] = (q[itemDe(w).id] ?? 0) + 2;
  for (let t = de; t > para; t--) {
    for (const w of modelo) {
      const it = (q[itemDe(w).id] ?? 0) >= 2 ? itemDe(w) : paineis.find((i) => (q[i.id] ?? 0) >= 2);
      if (it) q[it.id] -= 2;
    }
  }
  // garante pelo menos 1 nível por torre
  while (somaDe(paineis, q) < minimoGrupo(itens, "largura", 0, para, regras)) q[paineis[0].id] = (q[paineis[0].id] ?? 0) + 2;

  return limitar(itens, acompanhar(itens, qtd, q, { niveis: m.niveisTotal, torres: de }, { niveis: niveisDe(itens, q, para), torres: para }), para);
}
