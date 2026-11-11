/** Regras de quantidade da calculadora, compartilhadas entre o site e a prévia. */
import type { Item, Site } from "./site";

export type Regras = Site["pedido"];
const SEM_REGRAS: Regras = { minimoPaineis: 0, minimoPorTamanho: 0 };

export type Qtd = Record<string, number>;

export function sugerida(it: Item, altura: number, torres: number) {
  if (it.regra === "por_metro") return it.quantidade * altura * torres;
  if (it.regra === "por_torre") return it.quantidade * torres;
  return 0;
}

/** Itens do mesmo grupo somam para um mínimo comum: a maior sugestão entre eles (painéis: nunca menos que o mínimo do pedido). */
export function minimoGrupo(itens: Item[], grupo: string, altura: number, torres: number, regras: Regras = SEM_REGRAS) {
  const base = Math.max(0, ...itens.filter((i) => i.grupo === grupo).map((i) => sugerida(i, altura, torres)));
  return grupo === "largura" ? Math.max(base, regras.minimoPaineis) : base;
}

/** Situação de um grupo: quanto falta e se algum tamanho de painel ficou abaixo do mínimo. */
export function statusGrupo(itens: Item[], grupo: string, qtd: Qtd, altura: number, torres: number, regras: Regras = SEM_REGRAS) {
  const its = itens.filter((i) => i.grupo === grupo);
  const min = minimoGrupo(itens, grupo, altura, torres, regras);
  const total = its.reduce((s, i) => s + (qtd[i.id] ?? 0), 0);
  if (total < min) return { ok: false, texto: `Faltam ${min - total}`, total, min };
  if (grupo === "largura") {
    const pouco = its.find((i) => (qtd[i.id] ?? 0) > 0 && (qtd[i.id] ?? 0) < regras.minimoPorTamanho);
    if (pouco) return { ok: false, texto: `Mín. ${regras.minimoPorTamanho} de cada`, total, min };
  }
  return { ok: true, texto: `${total} de ${min} ✓`, total, min };
}

/** + e − de um item. Painéis andam de 0 direto para o mínimo por tamanho, e do mínimo de volta para 0. */
export function passo(it: Item, atual: number, d: number, minimo: number, regras: Regras = SEM_REGRAS) {
  const m = it.grupo === "largura" ? regras.minimoPorTamanho : 0;
  if (m > 1 && d > 0 && atual === 0) return m;
  if (m > 1 && d < 0 && atual <= m) return 0;
  return Math.max(minimo, atual + d);
}

export function gruposDe(itens: Item[]) {
  const g: Record<string, Item[]> = {};
  for (const it of itens) if (it.grupo) (g[it.grupo] ??= []).push(it);
  return g;
}

/** Ponto de partida: cada grupo começa todo no primeiro item (painel de 1 m, sapatas). */
export function quantidadesIniciais(itens: Item[], altura: number, torres: number, regras: Regras = SEM_REGRAS): Qtd {
  const q: Qtd = {};
  for (const [g, its] of Object.entries(gruposDe(itens))) {
    its.forEach((it, i) => (q[it.id] = i === 0 ? minimoGrupo(itens, g, altura, torres, regras) : 0));
  }
  for (const it of itens) if (!it.grupo) q[it.id] = sugerida(it, altura, torres);
  return q;
}

/**
 * Recalcula a lista quando a altura ou o número de torres muda, sem perder o que a pessoa escolheu.
 * - Itens soltos: mantém o que foi somado além do mínimo (ex.: travessas extras, escadas).
 * - Grupos, mudando a altura: mantém a proporção da mistura (ex.: metade 1 m, metade 1,5 m).
 * - Grupos, mudando as torres: a torre nova recebe o item mais usado; ao tirar torre, sai do menos usado.
 */
export function reajustar(itens: Item[], qtd: Qtd, de: { altura: number; torres: number }, para: { altura: number; torres: number }, regras: Regras = SEM_REGRAS): Qtd {
  const q: Qtd = { ...qtd };
  for (const it of itens) {
    if (it.grupo) continue;
    const antes = sugerida(it, de.altura, de.torres);
    const agora = sugerida(it, para.altura, para.torres);
    q[it.id] = agora + Math.max(0, (qtd[it.id] ?? 0) - antes);
  }

  for (const [g, its] of Object.entries(gruposDe(itens))) {
    const minAntes = minimoGrupo(itens, g, de.altura, de.torres, regras);
    const minAgora = minimoGrupo(itens, g, para.altura, para.torres, regras);
    if (minAntes === minAgora) continue;
    const total = its.reduce((s, i) => s + (qtd[i.id] ?? 0), 0);

    if (de.torres === para.torres && total > 0) {
      // mesma quantidade de torres, outra altura: escala cada item
      const fator = minAgora / minAntes;
      const alvo = Math.max(minAgora, Math.round(total * fator));
      let soma = 0;
      for (const it of its) {
        q[it.id] = Math.round((qtd[it.id] ?? 0) * fator);
        soma += q[it.id];
      }
      const maior = its.reduce((a, b) => ((q[b.id] ?? 0) > (q[a.id] ?? 0) ? b : a));
      q[maior.id] += alvo - soma;
      continue;
    }

    let diff = minAgora - minAntes;
    if (diff > 0) {
      const maior = its.reduce((a, b) => ((qtd[b.id] ?? 0) > (qtd[a.id] ?? 0) ? b : a));
      q[maior.id] = (qtd[maior.id] ?? 0) + diff;
    } else {
      // tira do item menos usado primeiro (empate: o último da lista)
      const ordem = [...its].reverse().sort((a, b) => (q[a.id] ?? 0) - (q[b.id] ?? 0));
      for (const it of ordem) {
        if (diff === 0) break;
        const tira = Math.min(q[it.id] ?? 0, -diff);
        q[it.id] = (q[it.id] ?? 0) - tira;
        diff += tira;
      }
    }
  }
  return q;
}
