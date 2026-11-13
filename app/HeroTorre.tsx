import { desenhar, svgParte, type Montagem } from "../lib/torre3d";

/** Exemplo fixo para a abertura: duas torres (5 m mista com rodinhas e 3 m com sapatas). */
const exemplo: Montagem = {
  altura: 5,
  alturas: [5, 3],
  niveisTotal: 8,
  total: 2,
  sobra: [],
  semLugar: 0,
  valida: true,
  torres: [
    { niveis: [1, 1.5, 1, 1.5, 1], frente: 1.5, fundo: 1, travessas: 5, plataformas: [1], escadas: 1, base: "rodinha" },
    { niveis: [1, 1, 1], frente: 1, fundo: 1, travessas: 3, plataformas: [], escadas: 0, base: "sapata" },
  ],
};

/** Torres montadas, desenhadas no servidor (sem JavaScript). Os níveis sobem um a um ao abrir a página. */
export default function HeroTorre() {
  const { grupos, viewBox } = desenhar(exemplo);
  return (
    <svg
      className="torre3d hero-torre"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-label="Exemplo de duas torres de andaime montadas, uma de 5 m e outra de 3 m"
    >
      {grupos.map((g, i) => (
        <g key={g.key} style={{ animationDelay: `${(i * 0.035).toFixed(2)}s` }}>
          {g.partes.map((p, j) => {
            const { tag, attrs } = svgParte(p);
            const { class: cls, ...resto } = attrs;
            if (tag === "line") return <line key={j} className={String(cls)} {...resto} />;
            if (tag === "polygon") return <polygon key={j} className={String(cls)} {...resto} />;
            return <text key={j} className={String(cls)} {...resto}>{p.tipo === "texto" ? p.texto : null}</text>;
          })}
        </g>
      ))}
    </svg>
  );
}
