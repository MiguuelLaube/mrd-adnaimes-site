/** Ícones de traço simples (decorativos: sempre aria-hidden). */
type P = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function IconeWa({ size = 22 }: P) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path fill="currentColor" d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.7 1.9 6.6L3 29l7-2.2c1.8 1 3.9 1.6 6 1.6 7 0 12.7-5.7 12.7-12.7S23 3 16 3zm0 23.2c-2 0-3.9-.6-5.5-1.6l-.4-.2-4.1 1.3 1.3-4-.3-.4a10.4 10.4 0 1 1 9 4.9zm5.7-7.8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.9-1.7-2.2-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.8.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.4z" />
    </svg>
  );
}

export const Caminhao = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></svg>
);
export const Cubo = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8" /></svg>
);
export const Regua = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}><path d="M7 3v18M17 3v18M7 8h10M7 14h10M7 8l10 6" /></svg>
);
export const Chat = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 5h16v11H9l-5 4z" /></svg>
);
export const Check = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}><path d="M5 12.5l4.5 4.5L19 7" /></svg>
);
export const Relogio = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const Pino = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 21s-6-5.6-6-10a6 6 0 0 1 12 0c0 4.4-6 10-6 10z" /><circle cx="12" cy="11" r="2" /></svg>
);
export const Email = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg>
);
export const Telefone = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}><path d="M6 3h3l1.5 4-2 1.5a11 11 0 0 0 6 6L16 12.5 20 14v3a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2z" /></svg>
);
