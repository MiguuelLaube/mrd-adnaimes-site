import "server-only";
import { cache } from "react";
import { list, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { padrao, type Site } from "./site";

const KEY = "config/site.json";
const LOCAL = path.join(process.cwd(), ".data", "site.json");
const temBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

/** Mescla com o padrão para que campos novos nunca fiquem indefinidos. */
function normalizar(s: Partial<Site>): Site {
  return { ...padrao, ...s, empresa: { ...padrao.empresa, ...(s.empresa ?? {}) } };
}

/** cache(): layout (metadata) e página leem o mesmo dado uma vez por requisição. */
export const getSite = cache(async function getSite(): Promise<Site> {
  try {
    if (temBlob()) {
      const { blobs } = await list({ prefix: KEY, limit: 1 });
      if (!blobs[0]) return padrao;
      const r = await fetch(`${blobs[0].url}?v=${new Date(blobs[0].uploadedAt).getTime()}`, { cache: "no-store" });
      return normalizar(await r.json());
    }
    return normalizar(JSON.parse(await fs.readFile(LOCAL, "utf8")));
  } catch {
    return padrao;
  }
});

export async function saveSite(site: Site) {
  const json = JSON.stringify(site);
  if (temBlob()) {
    await put(KEY, json, { access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 });
  } else {
    await fs.mkdir(path.dirname(LOCAL), { recursive: true });
    await fs.writeFile(LOCAL, json);
  }
}

export async function uploadFoto(file: File): Promise<string> {
  const nome = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  if (temBlob()) {
    const b = await put(`fotos/${nome}`, file, { access: "public", addRandomSuffix: true });
    return b.url;
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const final = `${Date.now()}-${nome}`;
  await fs.writeFile(path.join(dir, final), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${final}`;
}
