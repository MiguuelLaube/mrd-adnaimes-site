"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { COOKIE, tokenEsperado } from "../../lib/auth";
import { saveSite, uploadFoto } from "../../lib/store";
import type { Site } from "../../lib/site";

async function exigirLogin() {
  const esperado = await tokenEsperado();
  if (!esperado || (await cookies()).get(COOKIE)?.value !== esperado) throw new Error("Não autorizado");
}

export async function entrar(_: string | null, form: FormData) {
  const esperado = await tokenEsperado();
  if (!esperado) return "Defina ADMIN_PASSWORD nas variáveis de ambiente.";
  const senha = String(form.get("senha") ?? "");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`andaimes:${senha}`));
  const token = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  if (token !== esperado) return "Senha incorreta.";
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect("/admin");
}

export async function sair() {
  (await cookies()).delete(COOKIE);
  redirect("/admin/login");
}

export async function salvar(site: Site) {
  await exigirLogin();
  await saveSite(site);
  revalidatePath("/");
}

export async function enviarFoto(form: FormData) {
  await exigirLogin();
  const file = form.get("foto");
  if (!(file instanceof File) || !file.type.startsWith("image/")) throw new Error("Envie uma imagem.");
  if (file.size > 4 * 1024 * 1024) throw new Error("Imagem maior que 4 MB.");
  return uploadFoto(file);
}
