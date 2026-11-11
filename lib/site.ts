export type Regra = "por_metro" | "por_torre" | "opcional";

export type Item = {
  id: string;
  nome: string;
  descricao: string;
  foto: string;
  categoria: "andaime" | "acessorio";
  /** Itens do mesmo grupo são alternativos: o cliente escolhe um (ex.: largura, base). */
  grupo: string;
  regra: Regra;
  /** Quantidade sugerida por metro de altura ou por torre. */
  quantidade: number;
  ajustavel: boolean;
};

export type Site = {
  empresa: {
    nome: string;
    slogan: string;
    whatsapp: string;
    endereco: string;
    horario: string;
    instagram: string;
    google: string;
    email: string;
    logo: string;
  };
  cidades: string[];
  itens: Item[];
  servicos: { titulo: string; descricao: string }[];
  obras: { foto: string; legenda: string }[];
};

export const padrao: Site = {
  empresa: {
    nome: "MRD Andaimes",
    slogan: "Locação de andaimes com entrega em Taubaté e região",
    whatsapp: "5512999999999",
    endereco: "Taubaté - SP",
    horario: "Segunda a sexta, 7h às 17h. Sábado, 7h às 12h.",
    instagram: "",
    google: "",
    email: "",
    logo: "/logo-icone.png",
  },
  cidades: ["Taubaté", "Tremembé", "Pindamonhangaba", "Caçapava", "São José dos Campos"],
  itens: [
    { id: "andaime-1m", nome: "Andaime 1 m", descricao: "Painel tubular de 1 m de largura. Ideal para espaços estreitos.", foto: "/produtos/andaime-1m.webp", categoria: "andaime", grupo: "largura", regra: "por_metro", quantidade: 2, ajustavel: true },
    { id: "andaime-15m", nome: "Andaime 1,5 m", descricao: "Painel tubular de 1,5 m de largura. Mais área de trabalho.", foto: "/produtos/andaime-15m.webp", categoria: "andaime", grupo: "largura", regra: "por_metro", quantidade: 2, ajustavel: true },
    { id: "travessa", nome: "Travessa", descricao: "Travamento em X que dá rigidez à torre.", foto: "/produtos/travessa.svg", categoria: "acessorio", grupo: "", regra: "por_metro", quantidade: 1, ajustavel: true },
    { id: "sapatas", nome: "Sapatas (jogo com 4)", descricao: "Base fixa e nivelada para a torre.", foto: "/produtos/sapatas.svg", categoria: "acessorio", grupo: "base", regra: "por_torre", quantidade: 1, ajustavel: true },
    { id: "rodinhas", nome: "Rodinhas (jogo com 4)", descricao: "Base com rodízios para mover a torre.", foto: "/produtos/rodinhas.svg", categoria: "acessorio", grupo: "base", regra: "por_torre", quantidade: 1, ajustavel: true },
    { id: "plataforma-p", nome: "Plataforma pequena", descricao: "Piso de trabalho para o andaime de 1 m.", foto: "/produtos/plataforma-pequena.svg", categoria: "acessorio", grupo: "", regra: "opcional", quantidade: 0, ajustavel: true },
    { id: "plataforma-g", nome: "Plataforma grande", descricao: "Piso de trabalho para o andaime de 1,5 m.", foto: "/produtos/plataforma-grande.svg", categoria: "acessorio", grupo: "", regra: "opcional", quantidade: 0, ajustavel: true },
    { id: "escada", nome: "Escada", descricao: "Acesso seguro aos níveis da torre.", foto: "/produtos/escada.svg", categoria: "acessorio", grupo: "", regra: "opcional", quantidade: 0, ajustavel: true },
  ],
  servicos: [
    { titulo: "Entrega", descricao: "Levamos o equipamento até a sua obra." },
    { titulo: "Retirada", descricao: "Buscamos tudo no fim da locação." },
  ],
  obras: [],
};

export function waLink(numero: string, texto: string) {
  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
}
