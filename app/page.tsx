import { getSite } from "../lib/store";
import { waLink, type Item } from "../lib/site";
import Calculadora from "./Calculadora";

export const revalidate = 3600;

function IconeWa({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path fill="currentColor" d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.7 1.9 6.6L3 29l7-2.2c1.8 1 3.9 1.6 6 1.6 7 0 12.7-5.7 12.7-12.7S23 3 16 3zm0 23.2c-2 0-3.9-.6-5.5-1.6l-.4-.2-4.1 1.3 1.3-4-.3-.4a10.4 10.4 0 1 1 9 4.9zm5.7-7.8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.9-1.7-2.2-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.8.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.4z" />
    </svg>
  );
}

function SemFoto() {
  return (
    <svg viewBox="0 0 64 64" className="sem-foto" aria-hidden="true">
      <path d="M16 8v48M48 8v48M16 12h32M16 34h32M16 34l32 20M48 34L16 54M16 12l32 20M48 12L16 32" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function Produto({ it }: { it: Item }) {
  return (
    <li className="produto">
      <div className="produto-foto">
        {it.foto ? <img src={it.foto} alt={it.nome} width={400} height={300} loading="lazy" decoding="async" /> : <SemFoto />}
      </div>
      <div className="produto-txt">
        <h3>{it.nome}</h3>
        {it.descricao && <p>{it.descricao}</p>}
      </div>
    </li>
  );
}

export default async function Home() {
  const site = await getSite();
  const { empresa } = site;
  const wa = waLink(empresa.whatsapp, "Olá! Gostaria de um orçamento de andaimes.");
  const andaimes = site.itens.filter((i) => i.categoria === "andaime");
  const acessorios = site.itens.filter((i) => i.categoria === "acessorio");
  const obras = site.obras.filter((o) => o.foto);
  const regiao = site.cidades[0] ?? "Taubaté";

  return (
    <>
      <a href="#calculadora" className="pular">Pular para a calculadora</a>

      <header className="topo">
        <div className="wrap topo-in">
          <a href="#" className="marca" translate="no">
            {empresa.logo && <img src={empresa.logo} alt="" width={29} height={42} />}
            <span>{empresa.nome.toUpperCase()}</span>
          </a>
          <nav aria-label="Principal">
            <a href="#calculadora">Calculadora</a>
            <a href="#equipamentos">Equipamentos</a>
            <a href="#contato">Contato</a>
          </nav>
          <a href={wa} className="topo-wa" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">
            <IconeWa />
            <span>WhatsApp</span>
          </a>
        </div>
      </header>

      <main id="conteudo">
        <section className="hero">
          <div className="wrap">
            <h1>Aluguel de andaimes <span>em {regiao} e região</span></h1>
            <p>Veja os equipamentos, monte sua torre aqui embaixo e mande o pedido direto no WhatsApp. A gente entrega na sua obra.</p>
          </div>
          <div className="hero-barra" aria-hidden="true" />
          <div className="zebra" aria-hidden="true" />
        </section>

        <section id="equipamentos" className="secao" aria-labelledby="t-eq">
          <div className="wrap">
            <h2 id="t-eq">Equipamentos para alugar</h2>
            {andaimes.length > 0 && (
              <>
                <h3 className="sub">Andaimes tubulares</h3>
                <ul className="produtos">{andaimes.map((it) => <Produto key={it.id} it={it} />)}</ul>
              </>
            )}
            {acessorios.length > 0 && (
              <>
                <h3 className="sub">Acessórios</h3>
                <ul className="produtos">{acessorios.map((it) => <Produto key={it.id} it={it} />)}</ul>
              </>
            )}
          </div>
        </section>

        <section id="calculadora" className="secao secao-calc" aria-labelledby="t-calc">
          <div className="wrap">
            <h2 id="t-calc">Monte sua torre</h2>
            <p className="lead">Adicione os painéis e a torre sobe: cada 2 painéis são 1 m de altura. Cada peça que você coloca aparece montada.</p>
            <Calculadora site={site} />
          </div>
        </section>

        <section className="secao secao-aco" aria-labelledby="t-como">
          <div className="wrap">
            <h2 id="t-como">Como funciona</h2>
            <ol className="passos">
              <li><b>Monte sua torre</b><span>Escolha altura, largura e quantas torres precisa.</span></li>
              <li><b>Mande no WhatsApp</b><span>A lista chega pronta e respondemos com o orçamento.</span></li>
              <li><b>Receba na obra</b><span>{site.servicos.map((s, i) => (i ? s.titulo.toLowerCase() : s.titulo)).join(" e ") || "Entrega"} combinada com você.</span></li>
            </ol>
            {site.servicos.length > 0 && (
              <ul className="servicos">
                {site.servicos.map((s) => (
                  <li key={s.titulo}><b>{s.titulo}</b>{s.descricao && <span>{s.descricao}</span>}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {obras.length > 0 && (
          <section className="secao" aria-labelledby="t-obras">
            <div className="wrap">
              <h2 id="t-obras">Obras que atendemos</h2>
              <ul className="obras">
                {obras.map((o, i) => (
                  <li key={i}>
                    <figure>
                      <img src={o.foto} alt={o.legenda || "Obra atendida"} width={600} height={450} loading="lazy" decoding="async" />
                      {o.legenda && <figcaption>{o.legenda}</figcaption>}
                    </figure>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section id="contato" className="secao" aria-labelledby="t-contato">
          <div className="wrap contato">
            <div>
              <h2 id="t-contato">Onde entregamos</h2>
              <ul className="cidades">{site.cidades.map((c) => <li key={c}>{c}</li>)}</ul>
              <p className="lead">Sua cidade não está na lista? Chame no WhatsApp que a gente vê.</p>
            </div>
            <div className="contato-card">
              {empresa.endereco && <p><b>Endereço</b>{empresa.endereco}</p>}
              {empresa.horario && <p><b>Horário</b>{empresa.horario}</p>}
              {empresa.email && <p><b>E-mail</b><a href={`mailto:${empresa.email}`}>{empresa.email}</a></p>}
              <a href={wa} className="btn btn-wa btn-cheio" target="_blank" rel="noopener"><IconeWa /> Falar no WhatsApp</a>
              {(empresa.instagram || empresa.google) && (
                <div className="redes">
                  {empresa.instagram && <a href={empresa.instagram} target="_blank" rel="noopener">Instagram</a>}
                  {empresa.google && <a href={empresa.google} target="_blank" rel="noopener">Avaliações no Google</a>}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="rodape">
        <div className="wrap" translate="no">© {empresa.nome}</div>
      </footer>

      <nav className="barra-movel" aria-label="Ações rápidas">
        <a href="#calculadora" className="btn btn-marca">Calcular</a>
        <a href={wa} className="btn btn-wa" target="_blank" rel="noopener"><IconeWa size={20} /> WhatsApp</a>
      </nav>
    </>
  );
}
