"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { Icone } from "@/components/Icone";

export default function Entrar() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"livre" | "enviando" | "enviado" | "erro">("livre");
  const [erro, setErro] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback`, shouldCreateUser: true },
    });
    if (error) { setErro(error.message); setEstado("erro"); } else setEstado("enviado");
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form onSubmit={enviar} className="card destaque" style={{ width: "100%", maxWidth: 420, gap: 18, padding: 32 }}>
        <Logo tamanho={64} />
        <div>
          <p className="rotulo" style={{ letterSpacing: ".4em", color: "var(--ink-2)" }}>Bem-vindo ao</p>
          <h1 style={{ margin: "8px 0 0", fontSize: 40, fontWeight: 500, letterSpacing: ".03em", lineHeight: 1 }}>PARFUM ATLAS</h1>
        </div>
        {estado === "enviado" ? (
          <p className="texto-2" style={{ margin: 0 }}>Mandamos um link de acesso para <b style={{ color: "var(--ink)" }}>{email}</b>. Abra o e-mail neste aparelho e toque no link.</p>
        ) : (
          <>
            <p className="texto-2" style={{ margin: 0 }}>Entre com o seu e-mail. Você recebe um link de acesso, sem senha.</p>
            <label className="campo">
              <Icone nome="email" tamanho={18} />
              <input type="email" required autoComplete="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail" />
            </label>
            <button className="btn" type="submit" disabled={estado === "enviando"}>{estado === "enviando" ? "Enviando…" : "Receber link de acesso"}</button>
            {estado === "erro" && <p style={{ margin: 0, color: "var(--erro)", fontSize: 13 }}>{erro}</p>}
          </>
        )}
      </form>
    </div>
  );
}
