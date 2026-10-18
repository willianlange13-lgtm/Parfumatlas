"use client";
import { useState } from "react";

/** marca -> nome de arquivo: minúsculas, sem acento, símbolos/espaço viram hífen. */
export const slugMarca = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * Logo da marca: usa public/marcas/<slug>.webp quando existe; se não houver (ou falhar),
 * mostra um selo tipográfico com as iniciais em ouro — nunca fica quebrado.
 */
export function LogoMarca({ casa, tam = 28 }: { casa: string; tam?: number }) {
  const [erro, setErro] = useState(false);
  const ini = casa.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const selo = (
    <span style={{ fontFamily: "var(--marca)", fontSize: Math.round(tam * 0.42), letterSpacing: ".02em", color: "var(--acento)", lineHeight: 1 }}>{ini}</span>
  );
  return (
    <span style={{ position: "relative", width: tam, height: tam, borderRadius: "50%", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--line-2)", flexShrink: 0 }}>
      {erro ? selo : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/marcas/${slugMarca(casa)}.webp`} alt={casa} onError={() => setErro(true)} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fff" }} />
      )}
    </span>
  );
}
