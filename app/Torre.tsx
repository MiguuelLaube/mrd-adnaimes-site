/** Desenho da torre: 1 nível = 1 m, com painéis, travessa em X e a base escolhida. */
const NIVEL = 40;

export default function Torre({ niveis, torres, largura, rodinhas }: { niveis: number; torres: number; largura: number; rodinhas: boolean }) {
  const w = Math.round(Math.max(0.6, Math.min(2, largura)) * 40);
  const vis = Math.min(torres, 3);
  const gap = 14;
  const base = 14;
  const larguraTotal = vis * w + (vis - 1) * gap;
  const W = larguraTotal + 70;
  const H = niveis * NIVEL + base + 10;
  const x0 = 50;
  const chao = H - 4;

  return (
    <svg className="torre" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax meet" role="img"
      aria-label={`Torre de andaime com ${niveis} m de altura${torres > 1 ? `, ${torres} torres` : ""}`}>
      {/* cota de altura */}
      <g className="cota">
        <line x1={22} y1={chao - base} x2={22} y2={chao - base - niveis * NIVEL} />
        <line x1={16} y1={chao - base} x2={28} y2={chao - base} />
        <line x1={16} y1={chao - base - niveis * NIVEL} x2={28} y2={chao - base - niveis * NIVEL} />
        <text x={14} y={chao - base - (niveis * NIVEL) / 2} transform={`rotate(-90 14 ${chao - base - (niveis * NIVEL) / 2})`} textAnchor="middle">
          {niveis} m
        </text>
      </g>

      {Array.from({ length: vis }, (_, t) => {
        const x = x0 + t * (w + gap);
        return (
          <g key={t}>
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
            {/* plataforma no topo */}
            <rect className="piso" x={x - 3} y={chao - base - niveis * NIVEL - 2} width={w + 6} height={5} rx={1} />
            {rodinhas ? (
              <>
                <line className="tubo" x1={x} y1={chao - base} x2={x} y2={chao - 7} />
                <line className="tubo" x1={x + w} y1={chao - base} x2={x + w} y2={chao - 7} />
                <circle className="roda" cx={x} cy={chao - 4} r={4} />
                <circle className="roda" cx={x + w} cy={chao - 4} r={4} />
              </>
            ) : (
              <>
                <line className="tubo" x1={x} y1={chao - base} x2={x} y2={chao - 3} />
                <line className="tubo" x1={x + w} y1={chao - base} x2={x + w} y2={chao - 3} />
                <rect className="sapata" x={x - 6} y={chao - 3} width={12} height={3} />
                <rect className="sapata" x={x + w - 6} y={chao - 3} width={12} height={3} />
              </>
            )}
          </g>
        );
      })}
      {torres > 3 && (
        <text className="mais" x={x0 + larguraTotal + 6} y={chao - base - 6}>+{torres - 3}</text>
      )}
      <line className="chao" x1={0} y1={chao} x2={W} y2={chao} />
    </svg>
  );
}
