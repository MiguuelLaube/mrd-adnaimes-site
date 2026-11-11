import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { getSite } from "../lib/store";

const corpo = Barlow({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-corpo", display: "swap" });
const titulo = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--f-titulo", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { empresa, cidades } = await getSite();
  const regiao = cidades[0] ?? "Taubaté";
  return {
    title: `Aluguel de andaimes em ${regiao} e região | ${empresa.nome}`,
    description: `Aluguel de andaimes tubulares, travessas, plataformas, sapatas, rodinhas e escadas em ${regiao} e região. Calcule as peças e peça o orçamento pelo WhatsApp.`,
    openGraph: { title: `Aluguel de andaimes em ${regiao} | ${empresa.nome}`, locale: "pt_BR", type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#25303a", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${titulo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
