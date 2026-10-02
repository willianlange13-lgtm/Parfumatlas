"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

/** Criar ou trocar a senha (aberta pelo link do e-mail). */
export default function NovaSenha() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [repete, setRepete] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) return setErro("Use pelo menos 8 caracteres.");
    if (senha !== repete) return setErro("As duas senhas não são iguais.");
    setSalvando(true); setErro("");
    const { error } = await createClient().auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) setErro(error.message.includes("session") ? "O link expirou. Volte e peça outro em “Esqueci a senha”." : "Não consegui salvar a senha. Tente de novo.");
    else router.push("/");
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form onSubmit={salvar} className="card destaque" style={{ width: "100%", maxWidth: 420, gap: 16, padding: 32 }}>
        <Logo tamanho={56} />
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 500 }}>Nova senha</h1>
        <label className="campo"><input type="password" autoComplete="new-password" placeholder="Nova senha (mínimo 8)" value={senha} onChange={(e) => setSenha(e.target.value)} aria-label="Nova senha" /></label>
        <label className="campo"><input type="password" autoComplete="new-password" placeholder="Repita a senha" value={repete} onChange={(e) => setRepete(e.target.value)} aria-label="Repita a senha" /></label>
        <button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Salvar e entrar"}</button>
        {erro && <p style={{ margin: 0, color: "var(--erro)", fontSize: 13 }}>{erro}</p>}
      </form>
    </div>
  );
}
