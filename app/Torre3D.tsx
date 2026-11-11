"use client";
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import { desenhar, svgParte, type Montagem } from "../lib/torre3d";

/** Torre em 3D: cada peça adicionada "encaixa" de cima para baixo; peças removidas somem. */
export default function Torre3D({ montagem }: { montagem: Montagem }) {
  const { grupos, viewBox } = desenhar(montagem);
  const descricao = `${montagem.total > 1 ? `${montagem.total} torres` : "Torre"} de andaime com ${montagem.altura} m de altura`;

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <m.svg
          className="torre3d"
          role="img"
          aria-label={descricao}
          preserveAspectRatio="xMidYMax meet"
          initial={false}
          animate={{ viewBox }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        >
          <AnimatePresence initial={false}>
            {grupos.map((g) => (
              <m.g
                key={g.key}
                initial={{ opacity: 0, y: -18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 260, damping: 24, delay: g.atraso }}
              >
                {g.partes.map((p, i) => {
                  const { tag, attrs } = svgParte(p);
                  const { class: cls, ...resto } = attrs;
                  if (tag === "line") return <line key={i} className={String(cls)} {...resto} />;
                  if (tag === "polygon") return <polygon key={i} className={String(cls)} {...resto} />;
                  return <text key={i} className={String(cls)} {...resto}>{p.tipo === "texto" ? p.texto : null}</text>;
                })}
              </m.g>
            ))}
          </AnimatePresence>
        </m.svg>
      </MotionConfig>
    </LazyMotion>
  );
}
