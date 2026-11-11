"use client";
import { useState, useTransition } from "react";
import type { Item, Regra, Site } from "../../lib/site";
import { enviarFoto, sair, salvar } from "./actions";

const REGRAS: Record<Regra, string> = {
  por_metro: "Por metro de altura (por torre)",
  por_torre: "Por torre",
  opcional: "Opcional (começa em 0)",
};

function Foto({ valor, onChange }: { valor: string; onChange: (url: string) => void }) {
  const [enviando, setEnviando] = useState(false);
  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.set("foto", f);
      onChange(await enviarFoto(fd));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha no envio");
    } finally {
      setEnviando(false);
      e.target.value = "";
    }
  }
  return (
    <div className="foto-campo">
      {valor ? <img src={valor} alt="" /> : <div className="foto-vazia">Sem foto</div>}
      <label className="btn btn-sec">
        {enviando ? "Enviando…" : valor ? "Trocar foto" : "Enviar foto"}
        <input type="file" accept="image/*" hidden onChange={escolher} disabled={enviando} />
      </label>
      {valor && <button type="button" className="link" onClick={() => onChange("")}>remover</button>}
    </div>
  );
}

export default function Editor({ inicial }: { inicial: Site }) {
  const [site, setSite] = useState(inicial);
  const [status, setStatus] = useState("");
  const [pendente, start] = useTransition();

  const emp = (k: keyof Site["empresa"], v: string) => setSite({ ...site, empresa: { ...site.empresa, [k]: v } });
  const item = (i: number, p: Partial<Item>) => setSite({ ...site, itens: site.itens.map((it, j) => (j === i ? { ...it, ...p } : it)) });
  const mover = <T,>(arr: T[], i: number, d: number) => {
    const a = [...arr];
    const j = i + d;
    if (j < 0 || j >= a.length) return a;
    [a[i], a[j]] = [a[j], a[i]];
    return a;
  };

  function gravar() {
    setStatus("");
    start(async () => {
      try {
        await salvar(site);
        setStatus("Salvo! O site já foi atualizado.");
      } catch (e) {
        setStatus("Erro ao salvar: " + (e instanceof Error ? e.message : ""));
      }
    });
  }

  return (
    <main className="admin">
      <header className="admin-topo">
        <h1>Painel</h1>
        <div>
          <a href="/" target="_blank" className="link">ver site</a>
          <form action={sair} style={{ display: "inline" }}><button className="link">sair</button></form>
        </div>
      </header>

      <section className="card">
        <h2>Empresa</h2>
        <div className="grade">
          <label>Nome<input value={site.empresa.nome} onChange={(e) => emp("nome", e.target.value)} /></label>
          <label>WhatsApp (com DDD, ex.: 12991234567)<input inputMode="tel" value={site.empresa.whatsapp} onChange={(e) => emp("whatsapp", e.target.value)} /></label>
          <label className="largo">Frase de destaque<input value={site.empresa.slogan} onChange={(e) => emp("slogan", e.target.value)} /></label>
          <label>Endereço<input value={site.empresa.endereco} onChange={(e) => emp("endereco", e.target.value)} /></label>
          <label>Horário<input value={site.empresa.horario} onChange={(e) => emp("horario", e.target.value)} /></label>
          <label>E-mail<input type="email" autoComplete="off" spellCheck={false} value={site.empresa.email} onChange={(e) => emp("email", e.target.value)} /></label>
          <label>Link do Instagram<input value={site.empresa.instagram} onChange={(e) => emp("instagram", e.target.value)} /></label>
          <label>Link do Google (perfil/avaliações)<input value={site.empresa.google} onChange={(e) => emp("google", e.target.value)} /></label>
          <label className="largo">Cidades atendidas (separadas por vírgula)
            <input value={site.cidades.join(", ")} onChange={(e) => setSite({ ...site, cidades: e.target.value.split(",").map((c) => c.trim()).filter(Boolean) })} />
          </label>
        </div>
        <p className="rotulo">Logo</p>
        <Foto valor={site.empresa.logo} onChange={(u) => emp("logo", u)} />
      </section>

      <section className="card">
        <h2>Equipamentos e regras da calculadora</h2>
        <div className="grade">
          <label>Pedido mínimo de painéis
            <input type="number" min={0} step={1} value={site.pedido.minimoPaineis} onChange={(e) => setSite({ ...site, pedido: { ...site.pedido, minimoPaineis: Math.max(0, Number(e.target.value)) } })} />
          </label>
          <label>Altura máxima por torre (m)
            <input type="number" min={1} step={1} value={site.pedido.alturaMaxima} onChange={(e) => setSite({ ...site, pedido: { ...site.pedido, alturaMaxima: Math.max(1, Number(e.target.value)) } })} />
          </label>
          <label>Mínimo de cada tamanho de painel
            <input type="number" min={0} step={1} value={site.pedido.minimoPorTamanho} onChange={(e) => setSite({ ...site, pedido: { ...site.pedido, minimoPorTamanho: Math.max(0, Number(e.target.value)) } })} />
          </label>
        </div>
        <p className="ajuda">
          Itens com o mesmo <b>grupo</b> somam para um mínimo comum e o cliente pode misturar (ex.: <i>largura</i> para os painéis de 1 m e 1,5 m,
          <i> base</i> para sapatas e rodinhas). Deixe o grupo vazio para itens independentes.
        </p>
        {site.itens.map((it, i) => (
          <div key={i} className="item-ed">
            <Foto valor={it.foto} onChange={(u) => item(i, { foto: u })} />
            <div className="grade">
              <label>Nome<input value={it.nome} onChange={(e) => item(i, { nome: e.target.value })} /></label>
              <label>Categoria
                <select value={it.categoria} onChange={(e) => item(i, { categoria: e.target.value as Item["categoria"] })}>
                  <option value="andaime">Andaime</option><option value="acessorio">Acessório</option>
                </select>
              </label>
              <label className="largo">Descrição<input value={it.descricao} onChange={(e) => item(i, { descricao: e.target.value })} /></label>
              <label>Regra de quantidade
                <select value={it.regra} onChange={(e) => item(i, { regra: e.target.value as Regra })}>
                  {Object.entries(REGRAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              {it.regra !== "opcional" && (
                <label>Quantidade mínima {it.regra === "por_metro" ? "por metro" : "por torre"}
                  <input type="number" min={0} step={1} value={it.quantidade} onChange={(e) => item(i, { quantidade: Math.max(0, Number(e.target.value)) })} />
                </label>
              )}
              <label>Grupo<input value={it.grupo} placeholder="(nenhum)" onChange={(e) => item(i, { grupo: e.target.value.trim().toLowerCase() })} /></label>
              <label className="check"><input type="checkbox" checked={it.ajustavel} onChange={(e) => item(i, { ajustavel: e.target.checked })} /> Cliente pode aumentar a quantidade</label>
            </div>
            <div className="acoes">
              <button type="button" className="link" onClick={() => setSite({ ...site, itens: mover(site.itens, i, -1) })}>↑</button>
              <button type="button" className="link" onClick={() => setSite({ ...site, itens: mover(site.itens, i, 1) })}>↓</button>
              <button type="button" className="link perigo" onClick={() => confirm(`Remover "${it.nome}"?`) && setSite({ ...site, itens: site.itens.filter((_, j) => j !== i) })}>remover</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-sec" onClick={() => setSite({ ...site, itens: [...site.itens, { id: `item-${Date.now()}`, nome: "Novo item", descricao: "", foto: "", categoria: "acessorio", grupo: "", regra: "opcional", quantidade: 0, ajustavel: true }] })}>
          + Adicionar item
        </button>
      </section>

      <section className="card">
        <h2>Serviços</h2>
        {site.servicos.map((s, i) => (
          <div key={i} className="linha">
            <input value={s.titulo} placeholder="Título" onChange={(e) => setSite({ ...site, servicos: site.servicos.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)) })} />
            <input value={s.descricao} placeholder="Descrição" onChange={(e) => setSite({ ...site, servicos: site.servicos.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x)) })} />
            <button type="button" className="link perigo" onClick={() => setSite({ ...site, servicos: site.servicos.filter((_, j) => j !== i) })}>remover</button>
          </div>
        ))}
        <button type="button" className="btn btn-sec" onClick={() => setSite({ ...site, servicos: [...site.servicos, { titulo: "", descricao: "" }] })}>+ Adicionar serviço</button>
      </section>

      <section className="card">
        <h2>Obras realizadas</h2>
        <div className="obras-ed">
          {site.obras.map((o, i) => (
            <div key={i} className="obra-ed">
              <Foto valor={o.foto} onChange={(u) => setSite({ ...site, obras: site.obras.map((x, j) => (j === i ? { ...x, foto: u } : x)) })} />
              <input value={o.legenda} placeholder="Legenda (ex.: Fachada em Taubaté)" onChange={(e) => setSite({ ...site, obras: site.obras.map((x, j) => (j === i ? { ...x, legenda: e.target.value } : x)) })} />
              <button type="button" className="link perigo" onClick={() => setSite({ ...site, obras: site.obras.filter((_, j) => j !== i) })}>remover</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-sec" onClick={() => setSite({ ...site, obras: [...site.obras, { foto: "", legenda: "" }] })}>+ Adicionar obra</button>
      </section>

      <div className="salvar-barra">
        <span aria-live="polite">{status}</span>
        <button className="btn" onClick={gravar} disabled={pendente}>{pendente ? "Salvando…" : "Salvar alterações"}</button>
      </div>
    </main>
  );
}
