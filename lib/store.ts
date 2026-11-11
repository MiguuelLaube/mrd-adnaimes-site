import "server-only";
import { cache } from "react";
import { padrao, type Site } from "./site";

/**
 * Onde os dados do painel ficam guardados:
 * - na Cloudflare: no KV ligado ao Worker como DADOS (configurações em "site", fotos em "foto:<nome>");
 * - rodando local (next dev): em arquivos (.data/site.json e public/uploads).
 */
type KV = {
  get(chave: string, tipo: "text"): Promise<string | null>;
  getWithMetadata<M>(chave: string, tipo: "arrayBuffer"): Promise<{ value: ArrayBuffer | null; metadata: M | null }>;
  put(chave: string, valor: string | ArrayBuffer, opcoes?: { metadata?: unknown }): Promise<void>;
};

async function kv(): Promise<KV | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return ((env as unknown as { DADOS?: KV }).DADOS) ?? null;
  } catch {
    return null; // fora da Cloudflare
  }
}

const LOCAL = () => `${process.cwd()}/.data/site.json`;

/** Mescla com o padrão para que campos novos nunca fiquem indefinidos. */
function normalizar(s: Partial<Site>): Site {
  return {
    ...padrao,
    ...s,
    empresa: { ...padrao.empresa, ...(s.empresa ?? {}) },
    pedido: { ...padrao.pedido, ...(s.pedido ?? {}) },
  };
}

/** cache(): layout (metadata) e página leem o mesmo dado uma vez por requisição. */
export const getSite = cache(async function getSite(): Promise<Site> {
  try {
    const banco = await kv();
    if (banco) {
      const json = await banco.get("site", "text");
      return json ? normalizar(JSON.parse(json)) : padrao;
    }
    const fs = await import("fs/promises");
    return normalizar(JSON.parse(await fs.readFile(LOCAL(), "utf8")));
  } catch {
    return padrao;
  }
});

export async function saveSite(site: Site) {
  const json = JSON.stringify(site);
  const banco = await kv();
  if (banco) return banco.put("site", json);
  const fs = await import("fs/promises");
  await fs.mkdir(`${process.cwd()}/.data`, { recursive: true });
  await fs.writeFile(LOCAL(), json);
}

/** Guarda uma foto e devolve o endereço público dela. */
export async function uploadFoto(file: File): Promise<string> {
  const nome = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
  const dados = await file.arrayBuffer();
  const banco = await kv();
  if (banco) {
    await banco.put(`foto:${nome}`, dados, { metadata: { tipo: file.type } });
    return `/fotos/${nome}`;
  }
  const fs = await import("fs/promises");
  const dir = `${process.cwd()}/public/uploads`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(`${dir}/${nome}`, Buffer.from(dados));
  return `/uploads/${nome}`;
}

/** Lê uma foto guardada no KV (usado pela rota /fotos/[nome]). */
export async function lerFoto(nome: string) {
  const banco = await kv();
  if (!banco) return null;
  const { value, metadata } = await banco.getWithMetadata<{ tipo?: string }>(`foto:${nome}`, "arrayBuffer");
  return value ? { dados: value, tipo: metadata?.tipo ?? "application/octet-stream" } : null;
}
