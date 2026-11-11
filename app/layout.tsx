import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { getSite } from "../lib/store";

// Archivo com eixo de largura: o corpo usa a largura normal e os títulos usam a versão larga, como no logo.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--f-corpo", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { empresa, cidades } = await getSite();
  const regiao = cidades[0] ?? "Taubaté";
  return {
    title: `Aluguel de andaimes em ${regiao} e região | ${empresa.nome}`,
    description: `Aluguel de andaimes tubulares, travessas, plataformas, sapatas, rodinhas e escadas em ${regiao} e região. Calcule as peças e peça o orçamento pelo WhatsApp.`,
    openGraph: { title: `Aluguel de andaimes em ${regiao} | ${empresa.nome}`, locale: "pt_BR", type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
