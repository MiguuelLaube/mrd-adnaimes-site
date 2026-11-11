"use client";
import { useMemo, useState } from "react";
import { waLink, type Item, type Site } from "../lib/site";
import Torre from "./Torre";

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
  const grupos = useMemo(() => {
    const g: Record<string, Item[]> = {};
    for (const it of site.itens) if (it.grupo) (g[it.grupo] ??= []).push(it);
    return g;
  }, [site.itens]);
  const [escolha, setEscolha] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(grupos).map(([g, its]) => [g, its[0].id])),
  );
  const [extra, setExtra] = useState<Record<string, number>>({});
  const [servicos, setServicos] = useState<string[]>(site.servicos.map((s) => s.titulo));
  const [nome, setNome] = useState("");
  const [local, setLocal] = useState("");

  const ativos = site.itens.filter((it) => !it.grupo || escolha[it.grupo] === it.id);
  const linhas = ativos.map((it) => {
    const min = sugerida(it, altura, torres);
    return { it, min, qtd: min + (extra[it.id] ?? 0) };
  });
  const ajustar = (id: string, min: number, qtd: number, d: number) =>
    setExtra({ ...extra, [id]: Math.max(0, qtd + d - min) });

  const itemLargura = site.itens.find((i) => i.id === escolha.largura);
  const itemBase = site.itens.find((i) => i.id === escolha.base);

  const texto = [
    "Olá! Gostaria de um orçamento de andaimes.",
    "",
    `Altura da obra: ${altura} m`,
    `Torres: ${torres}`,
    "",
    ...linhas.filter((l) => l.qtd > 0).map((l) => `• ${l.qtd}x ${l.it.nome}`),
    ...(servicos.length ? ["", `Serviços: ${servicos.join(", ")}`] : []),
    ...(nome || local ? [""] : []),
    ...(nome ? [`Nome: ${nome}`] : []),
    ...(local ? [`Local da obra: ${local}`] : []),
  ].join("\n");

  return (
    <div className="calc">
      <div className="calc-visual">
        <Torre niveis={altura} torres={torres} largura={larguraDe(itemLargura?.nome)} rodinhas={/rod/i.test(itemBase?.nome ?? "")} />
      </div>

      <div className="calc-painel">
        <div className="calc-steppers">
          <Stepper rotulo="Altura" valor={altura} min={1} max={MAX} sufixo=" m" onChange={(v) => { setAltura(v); setExtra({}); }} />
          <Stepper rotulo="Torres" valor={torres} min={1} max={20} onChange={(v) => { setTorres(v); setExtra({}); }} />
        </div>

        {Object.entries(grupos).map(([g, its]) => (
          <fieldset key={g} className="segmento">
            <legend>{g === "largura" ? "Largura do andaime" : g === "base" ? "Base da torre" : g}</legend>
            <div>
              {its.map((it) => (
                <label key={it.id} className={escolha[g] === it.id ? "on" : ""}>
                  <input type="radio" name={`g-${g}`} checked={escolha[g] === it.id} onChange={() => setEscolha({ ...escolha, [g]: it.id })} />
                  {it.nome.replace(/^Andaime\s+/i, "").replace(/\s*\(.*\)/, "")}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <h3 className="lista-titulo">O que vai na sua obra</h3>
        <ul className="lista">
          {linhas.map(({ it, min, qtd }) => (
            <li key={it.id} className={qtd === 0 ? "zero" : ""}>
              <span className="lista-nome">
                {it.nome}
                {it.regra === "opcional" && qtd === 0 && <small>se precisar</small>}
              </span>
              <span className="lista-qtd">
                {it.ajustavel && (
                  <button type="button" aria-label={`Menos ${it.nome}`} disabled={qtd <= min} onClick={() => ajustar(it.id, min, qtd, -1)}>−</button>
                )}
                <b>{qtd}</b>
                {it.ajustavel && (
                  <button type="button" aria-label={`Mais ${it.nome}`} onClick={() => ajustar(it.id, min, qtd, 1)}>+</button>
                )}
              </span>
            </li>
          ))}
        </ul>

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
