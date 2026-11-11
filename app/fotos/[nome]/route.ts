import { lerFoto } from "../../../lib/store";

/** Serve as fotos enviadas pelo painel (guardadas no KV da Cloudflare). */
export async function GET(_: Request, { params }: { params: Promise<{ nome: string }> }) {
  const { nome } = await params;
  const foto = await lerFoto(nome);
  if (!foto) return new Response("Foto não encontrada", { status: 404 });
  return new Response(foto.dados, {
    headers: { "Content-Type": foto.tipo, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
