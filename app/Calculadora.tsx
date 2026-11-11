"use client";
import { useMemo, useState } from "react";
import { waLink, type Item, type Site } from "../lib/site";
import Torre3D from "./Torre3D";
import { montar } from "../lib/torre3d";
import { gruposDe, passo, quantidadesIniciais, reajustar, statusGrupo, sugerida } from "../lib/calculo";

const MAX = 30;

const ROTULO_GRUPO: Record<string, string> = { largura: "Painéis de andaime", base: "Base das torres" };
const AJUDA_GRUPO: Record<string, string> = {
  largura: "Pode misturar as larguras. Pedido mínimo: 4 painéis, com pelo menos 2 de cada tamanho escolhido.",
  base: "Pode misturar sapatas e rodinhas.",
};

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
  const [qtd, setQtd] = useState(() => quantidadesIniciais(site.itens, 6, 1, site.pedido));
  const [servicos, setServicos] = useState<string[]>(site.servicos.map((s) => s.titulo));
  const [nome, setNome] = useState("");
  const [local, setLocal] = useState("");

  const grupos = useMemo(() => gruposDe(site.itens), [site.itens]);
  const soltos = site.itens.filter((it) => !it.grupo);

  // mudar altura ou torres reajusta a lista sem apagar o que a pessoa escolheu
  const mudarObra = (a: number, t: number) => {
    setQtd(reajustar(site.itens, qtd, { altura, torres }, { altura: a, torres: t }, site.pedido));
    setAltura(a);
    setTorres(t);
  };
  const ajustar = (it: Item, d: number, min = 0) => setQtd({ ...qtd, [it.id]: passo(it, qtd[it.id] ?? 0, d, min, site.pedido) });


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
          {it.ajustavel && <button type="button" aria-label={`Menos ${it.nome}`} disabled={q <= min} onClick={() => ajustar(it, -1, min)}>−</button>}
          <b>{q}</b>
          {it.ajustavel && <button type="button" aria-label={`Mais ${it.nome}`} onClick={() => ajustar(it, 1, min)}>+</button>}
        </span>
      </li>
    );
  };

  return (
    <div className="calc">
      <div className="calc-visual">
        <Torre3D montagem={montar(site.itens, qtd, altura, torres)} />
      </div>

      <div className="calc-painel">
        <div className="calc-steppers">
          <Stepper rotulo="Altura" valor={altura} min={1} max={MAX} sufixo=" m" onChange={(v) => mudarObra(v, torres)} />
          <Stepper rotulo="Torres" valor={torres} min={1} max={20} onChange={(v) => mudarObra(altura, v)} />
        </div>

        <h3 className="lista-titulo">O que vai na sua obra</h3>

        {Object.entries(grupos).map(([g, its]) => {
          const st = statusGrupo(site.itens, g, qtd, altura, torres, site.pedido);
          return (
            <section key={g} className="grupo" aria-labelledby={`g-${g}`}>
              <header className="grupo-topo">
                <div>
                  <h4 id={`g-${g}`}>{ROTULO_GRUPO[g] ?? g}</h4>
                  {AJUDA_GRUPO[g] && <p>{AJUDA_GRUPO[g]}</p>}
                </div>
                <span className={`grupo-status ${st.ok ? "ok" : "falta"}`} aria-live="polite">{st.texto}</span>
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
