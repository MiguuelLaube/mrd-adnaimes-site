"use client";
import { useMemo, useState } from "react";
import { waLink, type Item, type Site } from "../lib/site";
import Torre3D from "./Torre3D";
import { montar } from "../lib/torre3d";
import { gruposDe, motivoPainel, mudar, mudarTorres, podeMudar, podeMudarTorres, quantidadesIniciais, statusGrupo, sugerida } from "../lib/calculo";

const ROTULO_GRUPO: Record<string, string> = { largura: "Painéis de andaime", base: "Base das torres" };
const AJUDA_GRUPO: Record<string, string> = {
  largura: "2 painéis = 1 m. Misturando 1 m e 1,5 m, os níveis se alternam.",
  base: "Pode misturar sapatas e rodinhas.",
};

function Stepper({ rotulo, valor, podeMenos, podeMais, onChange, sufixo }: { rotulo: string; valor: number; podeMenos: boolean; podeMais: boolean; onChange: (v: number) => void; sufixo?: string }) {
  return (
    <div className="stepper">
      <span className="stepper-rotulo" id={`r-${rotulo}`}>{rotulo}</span>
      <div className="stepper-ctl" role="group" aria-labelledby={`r-${rotulo}`}>
        <button type="button" aria-label={`Diminuir ${rotulo.toLowerCase()}`} disabled={!podeMenos} onClick={() => onChange(valor - 1)}>−</button>
        <output aria-live="polite">{valor}{sufixo && <small>{sufixo}</small>}</output>
        <button type="button" aria-label={`Aumentar ${rotulo.toLowerCase()}`} disabled={!podeMais} onClick={() => onChange(valor + 1)}>+</button>
      </div>
    </div>
  );
}

export default function Calculadora({ site }: { site: Site }) {
  const [torres, setTorres] = useState(1);
  const [qtd, setQtd] = useState(() => quantidadesIniciais(site.itens, 6, 1, site.pedido));
  const [servicos, setServicos] = useState<string[]>(site.servicos.map((s) => s.titulo));
  const [nome, setNome] = useState("");
  const [local, setLocal] = useState("");

  const grupos = useMemo(() => gruposDe(site.itens), [site.itens]);
  const soltos = site.itens.filter((it) => !it.grupo);

  // a altura não é escolhida: sai da quantidade de painéis
  const montagem = montar(site.itens, qtd, torres);
  const altura = montagem.altura;
  const niveis = montagem.niveisTotal;

  // mudar torres reajusta a lista sem apagar o que a pessoa escolheu
  const mudarQtdTorres = (t: number) => {
    if (!podeMudarTorres(site.itens, qtd, torres, t - torres, site.pedido)) return;
    setQtd(mudarTorres(site.itens, qtd, torres, t, site.pedido));
    setTorres(t);
  };
  const pode = (it: Item, d: number, min: number) => podeMudar(site.itens, qtd, it, d, min, torres, site.pedido);
  /** Por que o + está travado (aparece embaixo do nome). */
  const motivo = (it: Item, q: number) => {
    if (it.grupo === "largura") return motivoPainel(site.itens, qtd, it, torres, site.pedido);
    if (it.grupo) return "";
    if (/plataforma/i.test(it.nome)) return q === 0 ? "Não cabe nesta torre" : "Não cabe mais";
    if (/escada/i.test(it.nome)) return "Já cobre toda a altura";
    if (it.regra === "por_metro") return "Máximo de 2 por metro";
    return "";
  };
  const ajustar = (it: Item, d: number, min = 0) => setQtd(mudar(site.itens, qtd, it, d, min, torres, site.pedido));

  const totalPecas = site.itens.reduce((soma, it) => soma + (qtd[it.id] ?? 0), 0);

  const texto = [
    "Olá! Gostaria de um orçamento de andaimes.",
    "",
    `Altura: ${[...new Set(montagem.alturas)].sort((a, b) => b - a).join(" e ")} m`,
    `Torres: ${torres}`,
    "",
    ...site.itens.filter((it) => (qtd[it.id] ?? 0) > 0).map((it) => `• ${qtd[it.id]}x ${it.nome}`),
    ...(servicos.length ? ["", `Serviços: ${servicos.join(", ")}`] : []),
    ...(nome || local ? [""] : []),
    ...(nome ? [`Nome: ${nome}`] : []),
    ...(local ? [`Local da obra: ${local}`] : []),
  ].join("\n");

  const pedidoHref = waLink(site.empresa.whatsapp, texto);

  // função (não componente) para não remontar as linhas a cada render
  const linha = (it: Item, min = 0) => {
    const q = qtd[it.id] ?? 0;
    const podeMenos = pode(it, -1, min);
    const podeMais = pode(it, 1, min);
    const aviso = !podeMais ? motivo(it, q) : "";
    return (
      <li key={it.id} className={q === 0 ? "zero" : ""}>
        <span className="lista-nome">
          {it.nome.replace(/\s*\(.*\)\s*$/, "")}
          {/\(.*\)/.test(it.nome) && <small>{it.nome.match(/\((.*)\)/)![1]}</small>}
          {aviso ? <small className="lista-aviso">{aviso}</small> : it.regra === "opcional" && q === 0 && <small className="lista-opc">se precisar</small>}
        </span>
        <span className="lista-qtd">
          {it.ajustavel && <button type="button" aria-label={`Menos ${it.nome}`} disabled={!podeMenos} onClick={() => ajustar(it, -1, min)}>−</button>}
          <b>{q}</b>
          {it.ajustavel && <button type="button" aria-label={`Mais ${it.nome}`} disabled={!podeMais} onClick={() => ajustar(it, 1, min)}>+</button>}
        </span>
      </li>
    );
  };

  return (
    <div className="calc">
      {/* No computador esta coluna fica fixa: torre, resumo e botão sempre à vista enquanto a lista rola. */}
      <div className="calc-lateral">
        <div className="calc-visual">
          <Torre3D montagem={montagem} />
        </div>
        <div className="calc-resumo">
          <dl className="resumo-num">
            <div><dt>Altura</dt><dd>{altura}<small> m</small></dd></div>
            <div><dt>Torres</dt><dd>{torres}</dd></div>
            <div><dt>Peças</dt><dd>{totalPecas}</dd></div>
          </dl>
          <a className="btn btn-wa btn-cheio" href={pedidoHref} target="_blank" rel="noopener">
            Enviar pedido pelo WhatsApp
          </a>
          <p className="nota">Quantidades mínimas sugeridas. A gente confere tudo com você antes de fechar.</p>
        </div>
      </div>

      <div className="calc-painel">
        <div className="calc-steppers">
          <Stepper rotulo="Torres" valor={torres} podeMenos={podeMudarTorres(site.itens, qtd, torres, -1, site.pedido)} podeMais={podeMudarTorres(site.itens, qtd, torres, 1, site.pedido)} onChange={mudarQtdTorres} />
          <div className="stepper altura-lida">
            <span className="stepper-rotulo">Altura</span>
            <output aria-live="polite">{altura}<small> m</small></output>
          </div>
        </div>

        <h3 className="lista-titulo">O que vai na sua obra</h3>

        {Object.entries(grupos).map(([g, its]) => {
          const st = statusGrupo(site.itens, g, qtd, torres, site.pedido);
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
          <ul className="lista lista-soltos">
            {soltos.map((it) => linha(it, sugerida(it, niveis, torres)))}
          </ul>
        )}

        <div className="calc-extra">
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
        </div>

        <a className="btn btn-wa btn-cheio so-movel" href={pedidoHref} target="_blank" rel="noopener">
          Enviar pedido pelo WhatsApp
        </a>
        <p className="nota so-movel">Essas são as quantidades mínimas. A gente confere tudo com você antes de fechar.</p>
      </div>
    </div>
  );
}
