"use client";
import { useMemo, useState } from "react";
import { waLink, type Item, type Site } from "../lib/site";
import Torre, { type TorreInfo } from "./Torre";

const MAX = 30;

function sugerida(it: Item, altura: number, torres: number) {
  if (it.regra === "por_metro") return it.quantidade * altura * torres;
  if (it.regra === "por_torre") return it.quantidade * torres;
  return 0;
}

/** Largura em metros a partir do nome ("Andaime 1,5 m" → 1.5). */
function larguraDe(nome = "") {
  const m = nome.match(/(\d+(?:[.,]\d+)?)\s*m\b/i);
  return m ? Number(m[1].replace(",", ".")) : 1;
}

const ROTULO_GRUPO: Record<string, string> = { largura: "Painéis de andaime", base: "Base das torres" };
const AJUDA_GRUPO: Record<string, string> = {
  largura: "Pode misturar as larguras.",
  base: "Pode misturar sapatas e rodinhas.",
};

/**
 * Itens com o mesmo grupo somam para um mínimo comum (ex.: painéis de 1 m + 1,5 m).
 * O mínimo do grupo é a maior sugestão entre os itens; começa todo no primeiro item.
 */
function quantidadesIniciais(itens: Item[], altura: number, torres: number) {
  const q: Record<string, number> = {};
  const vistos = new Set<string>();
  for (const it of itens) {
    if (!it.grupo) q[it.id] = sugerida(it, altura, torres);
    else if (!vistos.has(it.grupo)) {
      vistos.add(it.grupo);
      q[it.id] = Math.max(...itens.filter((i) => i.grupo === it.grupo).map((i) => sugerida(i, altura, torres)));
    } else q[it.id] = 0;
  }
  return q;
}

/** Distribui larguras e bases pelas torres desenhadas, conforme as quantidades. */
function montarTorres(itens: Item[], qtd: Record<string, number>, altura: number, torres: number): TorreInfo[] {
  const paineis = itens.filter((i) => i.grupo === "largura");
  const larguras: number[] = [];
  for (const it of paineis) {
    const n = Math.round((qtd[it.id] ?? 0) / (2 * altura));
    for (let k = 0; k < n; k++) larguras.push(larguraDe(it.nome));
  }
  const padraoLarg = larguraDe(paineis.find((i) => (qtd[i.id] ?? 0) > 0)?.nome ?? paineis[0]?.nome);
  const rodinhas = itens.filter((i) => i.grupo === "base" && /rod/i.test(i.nome)).reduce((s, i) => s + (qtd[i.id] ?? 0), 0);
  const sapatas = itens.filter((i) => i.grupo === "base" && !/rod/i.test(i.nome)).reduce((s, i) => s + (qtd[i.id] ?? 0), 0);
  return Array.from({ length: torres }, (_, t) => ({
    largura: larguras[t] ?? padraoLarg,
    // sapatas primeiro, depois rodinhas; sem base suficiente, a torre aparece sem nada embaixo
    base: t < sapatas ? "sapata" : t < sapatas + rodinhas ? "rodinha" : "nenhuma",
  }));
}

function Stepper({ rotulo, valor, min, max, onChange, sufixo }: { rotulo: string; valor: number; min: number; max: number; onChange: (v: number) => void; sufixo?: string }) {
  return (
    <div className="stepper">
      <span className="stepper-rotulo" id={`r-${rotulo}`}>{rotulo}</span>
      <div className="stepper-ctl" role="group" aria-labelledby={`r-${rotulo}`}>
        <button type="button" aria-label={`Diminuir ${rotulo.toLowerCase()}`} disabled={valor <= min} onClick={() => onChange(valor - 1)}>−</button>
        <output aria-live="polite">{valor}{sufixo && <small>{sufixo}</small>}</output>
        <button type="button" aria-label={`Aumentar ${rotulo.toLowerCase()}`} disabled={valor >= max} onClick={() => onChange(valor + 1)}>+</button>
      </div>
    </div>
  );
}

export default function Calculadora({ site }: { site: Site }) {
  const [altura, setAltura] = useState(6);
  const [torres, setTorres] = useState(1);
  const [qtd, setQtd] = useState(() => quantidadesIniciais(site.itens, 6, 1));
  const [servicos, setServicos] = useState<string[]>(site.servicos.map((s) => s.titulo));
  const [nome, setNome] = useState("");
  const [local, setLocal] = useState("");

  const grupos = useMemo(() => {
    const g: Record<string, Item[]> = {};
    for (const it of site.itens) if (it.grupo) (g[it.grupo] ??= []).push(it);
    return g;
  }, [site.itens]);
  const soltos = site.itens.filter((it) => !it.grupo);

  const mudarObra = (a: number, t: number) => {
    setAltura(a);
    setTorres(t);
    setQtd(quantidadesIniciais(site.itens, a, t));
  };
  const ajustar = (id: string, d: number, min = 0) => setQtd({ ...qtd, [id]: Math.max(min, (qtd[id] ?? 0) + d) });

  const minGrupo = (its: Item[]) => Math.max(...its.map((i) => sugerida(i, altura, torres)));
  const totalGrupo = (its: Item[]) => its.reduce((s, i) => s + (qtd[i.id] ?? 0), 0);

  const texto = [
    "Olá! Gostaria de um orçamento de andaimes.",
    "",
    `Altura da obra: ${altura} m`,
    `Torres: ${torres}`,
    "",
    ...site.itens.filter((it) => (qtd[it.id] ?? 0) > 0).map((it) => `• ${qtd[it.id]}x ${it.nome}`),
    ...(servicos.length ? ["", `Serviços: ${servicos.join(", ")}`] : []),
    ...(nome || local ? [""] : []),
    ...(nome ? [`Nome: ${nome}`] : []),
    ...(local ? [`Local da obra: ${local}`] : []),
  ].join("\n");

  // função (não componente) para não remontar as linhas a cada render
  const linha = (it: Item, min = 0) => {
    const q = qtd[it.id] ?? 0;
    return (
      <li key={it.id} className={q === 0 ? "zero" : ""}>
        <span className="lista-nome">
          {it.nome.replace(/\s*\(.*\)\s*$/, "")}
          {/\(.*\)/.test(it.nome) && <small>{it.nome.match(/\((.*)\)/)![1]}</small>}
          {it.regra === "opcional" && q === 0 && <small>se precisar</small>}
        </span>
        <span className="lista-qtd">
          {it.ajustavel && <button type="button" aria-label={`Menos ${it.nome}`} disabled={q <= min} onClick={() => ajustar(it.id, -1, min)}>−</button>}
          <b>{q}</b>
          {it.ajustavel && <button type="button" aria-label={`Mais ${it.nome}`} onClick={() => ajustar(it.id, 1, min)}>+</button>}
        </span>
      </li>
    );
  };

  return (
    <div className="calc">
      <div className="calc-visual">
        <Torre niveis={altura} torres={montarTorres(site.itens, qtd, altura, torres)} />
      </div>

      <div className="calc-painel">
        <div className="calc-steppers">
          <Stepper rotulo="Altura" valor={altura} min={1} max={MAX} sufixo=" m" onChange={(v) => mudarObra(v, torres)} />
          <Stepper rotulo="Torres" valor={torres} min={1} max={20} onChange={(v) => mudarObra(altura, v)} />
        </div>

        <h3 className="lista-titulo">O que vai na sua obra</h3>

        {Object.entries(grupos).map(([g, its]) => {
          const min = minGrupo(its);
          const total = totalGrupo(its);
          const falta = min - total;
          return (
            <section key={g} className="grupo" aria-labelledby={`g-${g}`}>
              <header className="grupo-topo">
                <div>
                  <h4 id={`g-${g}`}>{ROTULO_GRUPO[g] ?? g}</h4>
                  {AJUDA_GRUPO[g] && <p>{AJUDA_GRUPO[g]}</p>}
                </div>
                <span className={`grupo-status ${falta > 0 ? "falta" : "ok"}`} aria-live="polite">
                  {falta > 0 ? `Faltam ${falta}` : `${total} de ${min} ✓`}
                </span>
              </header>
              <ul className="lista">{its.map((it) => linha(it))}</ul>
            </section>
          );
        })}

        {soltos.length > 0 && (
          <ul className="lista">
            {soltos.map((it) => linha(it, sugerida(it, altura, torres)))}
          </ul>
        )}

        {site.servicos.length > 0 && (
          <div className="calc-servicos">
            {site.servicos.map((s) => (
              <label key={s.titulo} className="chip">
                <input type="checkbox" checked={servicos.includes(s.titulo)} onChange={(e) => setServicos(e.target.checked ? [...servicos, s.titulo] : servicos.filter((x) => x !== s.titulo))} />
                {s.titulo}
              </label>
            ))}
          </div>
        )}

        <div className="calc-contato">
          <label>
            <span>Seu nome</span>
            <input name="nome" autoComplete="name" placeholder="Opcional…" value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
          <label>
            <span>Cidade ou bairro da obra</span>
            <input name="local" autoComplete="address-level2" placeholder="Ex.: Taubaté, Centro…" value={local} onChange={(e) => setLocal(e.target.value)} />
          </label>
        </div>

        <a className="btn btn-wa btn-cheio" href={waLink(site.empresa.whatsapp, texto)} target="_blank" rel="noopener">
          Enviar pedido pelo WhatsApp
        </a>
        <p className="nota">Essas são as quantidades mínimas. A gente confere tudo com você antes de fechar.</p>
      </div>
    </div>
  );
}
