"use client";
import { useActionState, useEffect, useState } from "react";
import type React from "react";
import "./entrar.css";
import { Logo } from "@/components/Logo";
import { Icone } from "@/components/Icone";
import { entrar, esqueci, type Resultado } from "./acoes";

export default function Entrar() {
  const [r, acaoEntrar, entrando] = useActionState<Resultado, FormData>(entrar, {});
  const [r2, acaoEsqueci, mandando] = useActionState<Resultado, FormData>(esqueci, {});
  const [ver, setVer] = useState(false);
  const [linkRuim, setLinkRuim] = useState(false);
  useEffect(() => { Promise.resolve().then(() => setLinkRuim(location.search.includes("erro=link"))); }, []);

  return (
    <div className="en">
      <section className="en-cartaz" aria-hidden="true">
        <div className="en-letreiro"><div>{Array.from({ length: 4 }, (_, k) => <span key={k}>Parfum Atlas&nbsp;·&nbsp;</span>)}</div></div>
        <span className="so-orbe en-orbe" />
      </section>
      <form action={acaoEntrar} className="en-form">
        <Logo tamanho={56} />
        <div className="en-tit">
          <p className="rotulo">Seu arquivo de fragrâncias</p>
          <h1 className="palavras"><span style={{ ["--i" as string]: 0 } as React.CSSProperties}>Bem-vindo&nbsp;</span><span style={{ ["--i" as string]: 1 } as React.CSSProperties}><em>de volta.</em></span></h1>
        </div>
        <label className="campo">
          <Icone nome="email" tamanho={18} />
          <input name="email" type="email" required autoComplete="email" placeholder="seu@email.com" aria-label="E-mail" />
        </label>
        <label className="campo">
          <svg viewBox="0 0 24 24" className="icone" style={{ width: 18, height: 18 }} aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3 M6 11h12v9H6z" /></svg>
          <input name="senha" type={ver ? "text" : "password"} required autoComplete="current-password" placeholder="Senha" aria-label="Senha" />
          <button type="button" onClick={() => setVer(!ver)} style={{ background: "none", border: "none", color: "var(--ink-3)", fontSize: 12.5, padding: "0 8px" }}>{ver ? "Ocultar" : "Mostrar"}</button>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--ink-2)", cursor: "pointer" }}>
          <input name="manter" type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: "var(--acento)" }} />
          Manter conectado neste aparelho
        </label>
        <button className="btn" type="submit" disabled={entrando}>{entrando ? "Entrando…" : "Entrar"}</button>
        {r.erro && <p style={{ margin: 0, color: "var(--erro)", fontSize: 13 }}>{r.erro}</p>}
        {linkRuim && !r.erro && <p style={{ margin: 0, color: "var(--erro)", fontSize: 13 }}>O link expirou. Peça outro em “Esqueci a senha”.</p>}
        <button formAction={acaoEsqueci} formNoValidate type="submit" disabled={mandando} style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, color: "var(--ink-2)", fontSize: 13.5, borderBottom: "1px solid var(--acento)" }}>
          {mandando ? "Mandando…" : "Esqueci a senha"}
        </button>
        {r2.ok && <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)" }}>{r2.ok}</p>}
        {r2.erro && <p style={{ margin: 0, color: "var(--erro)", fontSize: 13 }}>{r2.erro}</p>}
      </form>
    </div>
  );
}
