/**
 * Regras de quantidade da calculadora, compartilhadas entre o site e a prévia.
 * A altura não é escolhida: ela sai da quantidade de painéis (cada par = 1 m por torre).
 */
import type { Item, Site } from "./site";
import { larguraDe, montar } from "./torre3d";

export type Regras = Site["pedido"];
const SEM_REGRAS: Regras = { minimoPaineis: 0, minimoPorTamanho: 0 };

export type Qtd = Record<string, number>;

const ehPainel = (it: Item) => it.grupo === "largura";
const metros = (w: number) => String(w).replace(".", ",");

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

/** Mínimo de um grupo: painéis precisam de pelo menos 1 nível por torre; os outros grupos seguem a maior sugestão. */
export function minimoGrupo(itens: Item[], grupo: string, niveis: number, torres: number, regras: Regras = SEM_REGRAS) {
  if (grupo === "largura") return Math.max(regras.minimoPaineis, 2 * torres);
  return Math.max(0, ...itens.filter((i) => i.grupo === grupo).map((i) => sugerida(i, niveis, torres)));
}

/** Ponto de partida: painéis de 1 m para a altura inicial, sapatas, e o resto pela sugestão. */
export function quantidadesIniciais(itens: Item[], alturaInicial: number, torres: number, regras: Regras = SEM_REGRAS): Qtd {
  const q: Qtd = {};
  const niveis = alturaInicial * torres;
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

/** Situação de um grupo, com o texto do selo. */
export function statusGrupo(itens: Item[], grupo: string, qtd: Qtd, torres: number, regras: Regras = SEM_REGRAS) {
  const its = itens.filter((i) => i.grupo === grupo);
  const m = montar(itens, qtd, torres);
  const min = minimoGrupo(itens, grupo, m.niveisTotal, torres, regras);
  const total = its.reduce((s, i) => s + (qtd[i.id] ?? 0), 0);
  if (total < min) return { ok: false, texto: `Faltam ${min - total}` };
  if (grupo === "largura") {
    const pouco = its.find((i) => (qtd[i.id] ?? 0) > 0 && (qtd[i.id] ?? 0) < regras.minimoPorTamanho);
    if (pouco) return { ok: false, texto: `Mín. ${regras.minimoPorTamanho} de cada` };
    if (m.sobra.length) return { ok: false, texto: `Sobram ${m.sobra.map((s) => `${s.paineis} de ${metros(s.largura)} m`).join(" e ")}` };
    const alturas = [...new Set(m.alturas)].sort((a, b) => b - a);
    return { ok: true, texto: `${alturas.join(" e ")} m ✓` };
  }
  return { ok: true, texto: `${total} de ${min} ✓` };
}

/** Painéis andam em pares (cada nível usa 2 iguais); os outros itens, de 1 em 1, sem passar do mínimo. */
export function passo(it: Item, atual: number, d: number, minimo: number, regras: Regras = SEM_REGRAS) {
  if (!ehPainel(it)) return Math.max(minimo, atual + d);
  const m = Math.max(2, regras.minimoPorTamanho);
  if (d > 0) return atual === 0 ? m : atual + 2;
  return atual <= m ? 0 : atual - 2;
}

/** Toque no + ou no − de um item. Mexer nos painéis muda a altura, e as travessas acompanham. */
export function mudar(itens: Item[], qtd: Qtd, it: Item, d: number, minimo: number, torres: number, regras: Regras = SEM_REGRAS): Qtd {
  const novo = { ...qtd, [it.id]: passo(it, qtd[it.id] ?? 0, d, minimo, regras) };
  if (!ehPainel(it)) return novo;
  return acompanhar(itens, qtd, novo, { niveis: niveisDe(itens, qtd, torres), torres }, { niveis: niveisDe(itens, novo, torres), torres });
}

/**
 * Mudar o número de torres sem perder o que a pessoa escolheu:
 * - painéis: a torre nova copia a composição da primeira (mesma altura e mistura); ao tirar uma, sai essa mesma composição;
 * - base: a torre nova recebe o tipo mais usado; ao tirar, sai do menos usado;
 * - itens soltos acompanham os níveis, mantendo os extras.
 */
export function mudarTorres(itens: Item[], qtd: Qtd, de: number, para: number, regras: Regras = SEM_REGRAS): Qtd {
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

  for (const [g, its] of Object.entries(gruposDe(itens))) {
    if (g === "largura") continue;
    let diff = minimoGrupo(itens, g, 0, para, regras) - minimoGrupo(itens, g, 0, de, regras);
    if (diff > 0) {
      const maior = its.reduce((a, b) => ((qtd[b.id] ?? 0) > (qtd[a.id] ?? 0) ? b : a));
      q[maior.id] = (q[maior.id] ?? 0) + diff;
    } else if (diff < 0) {
      const ordem = [...its].reverse().sort((a, b) => (q[a.id] ?? 0) - (q[b.id] ?? 0));
      for (const it of ordem) {
        if (diff === 0) break;
        const tira = Math.min(q[it.id] ?? 0, -diff);
        q[it.id] = (q[it.id] ?? 0) - tira;
        diff += tira;
      }
    }
  }
  return acompanhar(itens, qtd, q, { niveis: m.niveisTotal, torres: de }, { niveis: niveisDe(itens, q, para), torres: para });
}
