/** Desenho das torres: 1 nível = 1 m, com painéis, travessa em X e a base de cada torre. */
export type TorreInfo = { largura: number; base: "sapata" | "rodinha" | "nenhuma" };

const NIVEL = 40;
const VISIVEIS = 3;

export default function Torre({ niveis, torres }: { niveis: number; torres: TorreInfo[] }) {
  const vis = torres.slice(0, VISIVEIS);
  const gap = 14;
  const base = 14;
  const larguras = vis.map((t) => Math.round(Math.max(0.6, Math.min(2, t.largura)) * 40));
  const larguraTotal = larguras.reduce((s, w) => s + w, 0) + (vis.length - 1) * gap;
  const W = larguraTotal + 70;
  const H = niveis * NIVEL + base + 10;
  const x0 = 50;
  const chao = H - 4;
  const topo = chao - base - niveis * NIVEL;
  const meio = chao - base - (niveis * NIVEL) / 2;
  const xs = larguras.map((_, i) => x0 + larguras.slice(0, i).reduce((s, w) => s + w + gap, 0));

  return (
    <svg className="torre" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax meet" role="img"
      aria-label={`${torres.length > 1 ? `${torres.length} torres` : "Torre"} de andaime com ${niveis} m de altura`}>
      <g className="cota">
        <line x1={22} y1={chao - base} x2={22} y2={topo} />
        <line x1={16} y1={chao - base} x2={28} y2={chao - base} />
        <line x1={16} y1={topo} x2={28} y2={topo} />
        <text x={14} y={meio} transform={`rotate(-90 14 ${meio})`} textAnchor="middle">{niveis} m</text>
      </g>

      {vis.map((t, i) => {
        const x = xs[i];
        const w = larguras[i];
        return (
          <g key={i}>
            {Array.from({ length: niveis }, (_, n) => {
              const yb = chao - base - n * NIVEL;
              const yt = yb - NIVEL;
              return (
                <g key={n} className="nivel" style={{ animationDelay: `${Math.min(n, 8) * 25}ms` }}>
                  <line className="travessa" x1={x} y1={yb - 3} x2={x + w} y2={yt + 3} />
                  <line className="travessa" x1={x + w} y1={yb - 3} x2={x} y2={yt + 3} />
                  <line className="tubo" x1={x} y1={yb} x2={x} y2={yt} />
                  <line className="tubo" x1={x + w} y1={yb} x2={x + w} y2={yt} />
                  <line className="tubo" x1={x} y1={yt + 4} x2={x + w} y2={yt + 4} />
                </g>
              );
            })}
            <rect className="piso" x={x - 3} y={topo - 2} width={w + 6} height={5} rx={1} />
            {t.base === "rodinha" ? (
              <>
                <line className="tubo" x1={x} y1={chao - base} x2={x} y2={chao - 7} />
                <line className="tubo" x1={x + w} y1={chao - base} x2={x + w} y2={chao - 7} />
                <circle className="roda" cx={x} cy={chao - 4} r={4} />
                <circle className="roda" cx={x + w} cy={chao - 4} r={4} />
              </>
            ) : t.base === "sapata" ? (
              <>
                <line className="tubo" x1={x} y1={chao - base} x2={x} y2={chao - 3} />
                <line className="tubo" x1={x + w} y1={chao - base} x2={x + w} y2={chao - 3} />
                <rect className="sapata" x={x - 6} y={chao - 3} width={12} height={3} />
                <rect className="sapata" x={x + w - 6} y={chao - 3} width={12} height={3} />
              </>
            ) : (
              <>
                <line className="tubo sem-base" x1={x} y1={chao - base} x2={x} y2={chao - 3} />
                <line className="tubo sem-base" x1={x + w} y1={chao - base} x2={x + w} y2={chao - 3} />
              </>
            )}
          </g>
        );
      })}
      {torres.length > VISIVEIS && (
        <text className="mais" x={x0 + larguraTotal + 6} y={chao - base - 6}>+{torres.length - VISIVEIS}</text>
      )}
      <line className="chao" x1={0} y1={chao} x2={W} y2={chao} />
    </svg>
  );
}
