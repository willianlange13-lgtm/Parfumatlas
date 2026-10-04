"use client";
import { Children, useEffect, useState, type ReactNode } from "react";

/**
 * Vitrine do Início (docs/DECISOES.md §21): os destaques passam sozinhos a cada 8 s,
 * param com o mouse em cima e trocam pelos pontinhos.
 */
export function Carrossel({ children, t }: { children: ReactNode; t: { amber: string; line2: string } }) {
  const itens = Children.toArray(children);
  const [i, setI] = useState(0);
  const [parado, setParado] = useState(false);
  useEffect(() => {
    if (parado || itens.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % itens.length), 8000);
    return () => clearInterval(id);
  }, [parado, itens.length]);
  return (
    <div onMouseEnter={() => setParado(true)} onMouseLeave={() => setParado(false)}
      style={{ position: "relative", height: "580px", borderRadius: "var(--r-ed)", border: "1px solid var(--ouro-linha)", overflow: "hidden" }}>
      {itens.map((c, k) => (
        <div key={k} aria-hidden={k !== i} style={{ position: "absolute", inset: 0, opacity: k === i ? 1 : 0, transition: "opacity .9s ease", pointerEvents: k === i ? "auto" : "none" }}>{c}</div>
      ))}
      {itens.length > 1 ? (
        <div style={{ position: "absolute", right: "28px", top: "28px", zIndex: 3, display: "flex", gap: "8px" }}>
          {itens.map((_, k) => (
            <button key={k} type="button" aria-label={`Destaque ${k + 1}`} onClick={() => setI(k)}
              style={{ width: k === i ? "22px" : "8px", height: "8px", padding: 0, border: "none", borderRadius: "4px", background: k === i ? t.amber : t.line2, cursor: "pointer", transition: "width .3s ease, background .3s ease" }} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
