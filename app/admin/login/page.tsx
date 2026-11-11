"use client";
import { useActionState } from "react";
import { entrar } from "../actions";

export default function Login() {
  const [erro, acao, pendente] = useActionState(entrar, null);
  return (
    <main className="login">
      <form action={acao} className="card">
        <h1>Painel</h1>
        <label>Senha<input type="password" name="senha" required autoComplete="current-password" /></label>
        {erro && <p className="erro">{erro}</p>}
        <button className="btn" disabled={pendente}>{pendente ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>
  );
}
