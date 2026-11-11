export const COOKIE = "adm";

/** Token derivado da senha: trocar ADMIN_PASSWORD desloga todo mundo. */
export async function tokenEsperado(): Promise<string | null> {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha) return null;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`andaimes:${senha}`));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
