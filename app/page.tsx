import { getSite } from "../lib/store";
import { waLink, type Item } from "../lib/site";
import { formatarTelefone, listaEmTexto } from "../lib/info";
import Calculadora from "./Calculadora";
import HeroTorre from "./HeroTorre";
import { Caminhao, Chat, Check, Cubo, Email, IconeWa, Pino, Regua, Relogio, Telefone } from "./Icones";

// lê as configurações do painel a cada visita (o KV da Cloudflare responde em milissegundos)
export const dynamic = "force-dynamic";

function SemFoto() {
  return (
    <svg viewBox="0 0 64 64" className="sem-foto" aria-hidden="true">
      <path d="M16 8v48M48 8v48M16 12h32M16 34h32M16 34l32 20M48 34L16 54M16 12l32 20M48 12L16 32" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function Produto({ it, destaque }: { it: Item; destaque?: boolean }) {
  return (
    <li className={`produto${destaque ? " destaque" : ""}`}>
      <div className="produto-foto">
        {it.foto ? <img src={it.foto} alt={it.nome} width={400} height={300} loading="lazy" decoding="async" /> : <SemFoto />}
      </div>
      <div className="produto-txt">
        <span className="produto-tag">{it.categoria === "andaime" ? "Painel de andaime" : "Acessório"}</span>
        <h3>{it.nome}</h3>
        {it.descricao && <p>{it.descricao}</p>}
      </div>
    </li>
  );
}

const ICONES_FAIXA = [Caminhao, Cubo, Regua, Chat];

export default async function Home() {
  const site = await getSite();
  const { empresa } = site;
  const wa = waLink(empresa.whatsapp, "Olá! Gostaria de um orçamento de andaimes.");
  const telefone = formatarTelefone(empresa.whatsapp);
  const andaimes = site.itens.filter((i) => i.categoria === "andaime");
  const acessorios = site.itens.filter((i) => i.categoria === "acessorio");
  const obras = site.obras.filter((o) => o.foto);
  const regiao = site.cidades[0] ?? "Taubaté";
  const cidades = listaEmTexto(site.cidades);
  const larguras = andaimes.map((a) => a.nome.replace(/^Andaime\s+/i, "")).join(" e ");
  const servicosTxt = site.servicos.map((s, i) => (i ? s.titulo.toLowerCase() : s.titulo)).join(" e ");

  const diferenciais = [
    ...site.servicos.map((s) => ({ t: s.titulo, d: s.descricao })),
    { t: "Torre sob medida", d: "Monte a altura e misture painéis de 1 m e 1,5 m." },
    { t: "Orçamento no WhatsApp", d: "A lista da sua torre chega pronta e respondemos com o valor." },
  ].slice(0, 4);

  const duvidas = [
    { p: "Como a calculadora define a altura da torre?", r: "Cada 2 painéis formam 1 m de altura. Você adiciona os painéis e a torre sobe na tela, com a altura sempre visível ao lado." },
    { p: "Posso misturar painéis de 1 m e de 1,5 m?", r: "Pode. Numa torre mista os níveis se alternam entre as duas larguras, e a calculadora avisa quando a combinação não fecha." },
    { p: "Quais acessórios preciso para montar?", r: "Cada torre leva 1 jogo de base (sapatas ou rodinhas) e 1 travessa por metro de altura. Plataformas e escadas você escolhe conforme a obra." },
    { p: "Vocês entregam e retiram na obra?", r: `${servicosTxt || "Entregamos"} em ${cidades}. Combinamos o dia e o horário pelo WhatsApp.` },
    { p: "Como recebo o valor da locação?", r: "Toque em enviar pedido: a lista da sua torre abre no WhatsApp, já preenchida. A gente confere os itens com você e responde com o orçamento." },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: empresa.nome,
    description: empresa.slogan,
    telephone: `+${empresa.whatsapp.replace(/\D/g, "")}`,
    ...(empresa.email ? { email: empresa.email } : {}),
    areaServed: site.cidades.map((c) => ({ "@type": "City", name: c })),
    ...(empresa.instagram || empresa.google ? { sameAs: [empresa.instagram, empresa.google].filter(Boolean) } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <a href="#calculadora" className="pular">Pular para a calculadora</a>

      <header className="topo">
        <div className="wrap topo-in">
          <a href="#" className="marca" translate="no">
            {empresa.logo && <img src={empresa.logo} alt="" width={29} height={42} />}
            <span>{empresa.nome.toUpperCase()}</span>
          </a>
          <nav aria-label="Principal">
            <a href="#equipamentos">Equipamentos</a>
            <a href="#calculadora">Calculadora</a>
            <a href="#duvidas">Dúvidas</a>
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
          <div className="wrap hero-grid">
            <div className="hero-txt">
              <h1>Aluguel de andaimes <span>em {regiao} e região</span></h1>
              <p>Veja os equipamentos, monte sua torre aqui embaixo e mande o pedido direto no WhatsApp. A gente entrega na sua obra.</p>
              <div className="hero-acoes">
                <a href="#calculadora" className="btn btn-marca">Montar minha torre</a>
                <a href={wa} className="btn btn-contorno" target="_blank" rel="noopener"><IconeWa size={20} /> Falar no WhatsApp</a>
              </div>
              <ul className="hero-pontos">
                {servicosTxt && <li><Check /> {servicosTxt} na obra</li>}
                {larguras && <li><Check /> Painéis de {larguras}</li>}
                <li><Check /> Orçamento direto no WhatsApp</li>
              </ul>
            </div>
            <figure className="hero-arte">
              <HeroTorre />
              <figcaption>
                <a href="#calculadora">Monte a sua na calculadora</a>
              </figcaption>
            </figure>
          </div>
          <div className="zebra" aria-hidden="true" />
        </section>

        <section className="faixa" aria-label="Diferenciais">
          <div className="wrap">
            <ul>
              {diferenciais.map((d, i) => {
                const Icone = ICONES_FAIXA[i % ICONES_FAIXA.length];
                return (
                  <li key={d.t}>
                    <Icone />
                    <div>
                      <b>{d.t}</b>
                      {d.d && <span>{d.d}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="equipamentos" className="secao" aria-labelledby="t-eq">
          <div className="wrap">
            <div className="secao-cab">
              <h2 id="t-eq">Equipamentos para alugar</h2>
              <p className="lead">Painéis de andaime e os acessórios para montar a torre completa, do chão ao topo.</p>
            </div>
            <ul className="produtos">
              {andaimes.map((it) => <Produto key={it.id} it={it} destaque />)}
              {acessorios.map((it) => <Produto key={it.id} it={it} />)}
            </ul>
          </div>
        </section>

        <section id="calculadora" className="secao secao-calc" aria-labelledby="t-calc">
          <div className="wrap">
            <div className="secao-cab">
              <h2 id="t-calc">Monte sua torre</h2>
              <p className="lead">Adicione os painéis e a torre sobe: cada 2 painéis são 1 m de altura. Cada peça que você coloca aparece montada ao lado.</p>
            </div>
            <Calculadora site={site} />
          </div>
        </section>

        <section id="como-funciona" className="secao secao-aco" aria-labelledby="t-como">
          <div className="wrap">
            <div className="secao-cab">
              <h2 id="t-como">Como funciona</h2>
              <p className="lead">Do pedido à obra em três passos, sem formulário longo e sem fila.</p>
            </div>
            <ol className="passos">
              <li><b>Monte sua torre</b><span>Adicione os painéis, a base e os acessórios. A torre se monta na tela enquanto você escolhe.</span></li>
              <li><b>Mande no WhatsApp</b><span>A lista chega pronta no nosso WhatsApp, e a gente responde com o orçamento.</span></li>
              <li><b>Receba na obra</b><span>{servicosTxt || "Entrega"} combinada com você, no dia e horário que ficar melhor.</span></li>
            </ol>
            <div className="cta-faixa">
              <p>Pronto para começar? Monte a torre ou chame a gente direto.</p>
              <div>
                <a href="#calculadora" className="btn btn-marca">Montar minha torre</a>
                <a href={wa} className="btn btn-wa" target="_blank" rel="noopener"><IconeWa size={20} /> WhatsApp</a>
              </div>
            </div>
          </div>
        </section>

        {obras.length > 0 && (
          <section className="secao" aria-labelledby="t-obras">
            <div className="wrap">
              <div className="secao-cab"><h2 id="t-obras">Obras que atendemos</h2></div>
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

        <section id="duvidas" className="secao" aria-labelledby="t-duvidas">
          <div className="wrap duvidas">
            <div className="duvidas-cab">
              <h2 id="t-duvidas">Dúvidas frequentes</h2>
              <p className="lead">Não achou o que procurava? Chame no WhatsApp que a gente responde.</p>
              <a href={wa} className="btn btn-wa" target="_blank" rel="noopener"><IconeWa size={20} /> Tirar dúvida</a>
            </div>
            <div className="faq">
              {duvidas.map((d) => (
                <details key={d.p}>
                  <summary>{d.p}</summary>
                  <p>{d.r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className="secao secao-clara" aria-labelledby="t-contato">
          <div className="wrap contato">
            <div>
              <h2 id="t-contato">Onde entregamos</h2>
              <p className="lead">Atendemos obras em {cidades}.</p>
              <ul className="cidades">{site.cidades.map((c) => <li key={c}>{c}</li>)}</ul>
              <p className="lead">Sua cidade não está na lista? Chame no WhatsApp que a gente vê.</p>
            </div>
            <div className="contato-card">
              <h3>Fale com a gente</h3>
              <ul className="contato-lista">
                <li><Telefone /><div><b>WhatsApp</b><a href={wa} target="_blank" rel="noopener">{telefone}</a></div></li>
                {empresa.email && <li><Email /><div><b>E-mail</b><a href={`mailto:${empresa.email}`}>{empresa.email}</a></div></li>}
                {empresa.endereco && <li><Pino /><div><b>Endereço</b>{empresa.endereco}</div></li>}
                {empresa.horario && <li><Relogio /><div><b>Horário</b>{empresa.horario}</div></li>}
              </ul>
              <a href={wa} className="btn btn-wa btn-cheio" target="_blank" rel="noopener"><IconeWa /> Chamar no WhatsApp</a>
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
        <div className="wrap rodape-grid">
          <div>
            <div className="rodape-marca" translate="no">
              {empresa.logo && <img src={empresa.logo} alt="" width={29} height={42} />}
              <span>{empresa.nome.toUpperCase()}</span>
            </div>
            <p>{empresa.slogan}.</p>
          </div>
          <nav aria-label="Rodapé">
            <h3>Navegação</h3>
            <ul>
              <li><a href="#equipamentos">Equipamentos</a></li>
              <li><a href="#calculadora">Monte sua torre</a></li>
              <li><a href="#como-funciona">Como funciona</a></li>
              <li><a href="#duvidas">Dúvidas frequentes</a></li>
              <li><a href="#contato">Contato</a></li>
            </ul>
          </nav>
          <div>
            <h3>Contato</h3>
            <ul>
              <li><a href={wa} target="_blank" rel="noopener">WhatsApp {telefone}</a></li>
              {empresa.email && <li><a href={`mailto:${empresa.email}`}>{empresa.email}</a></li>}
              {empresa.horario && <li>{empresa.horario}</li>}
              {empresa.instagram && <li><a href={empresa.instagram} target="_blank" rel="noopener">Instagram</a></li>}
            </ul>
          </div>
        </div>
        <div className="wrap rodape-fim">
          <span translate="no">© {new Date().getFullYear()} {empresa.nome}</span>
          <span>Aluguel de andaimes em {cidades}</span>
        </div>
      </footer>

      <nav className="barra-movel" aria-label="Ações rápidas">
        <a href="#calculadora" className="btn btn-marca">Calcular</a>
        <a href={wa} className="btn btn-wa" target="_blank" rel="noopener"><IconeWa size={20} /> WhatsApp</a>
      </nav>
    </>
  );
}
