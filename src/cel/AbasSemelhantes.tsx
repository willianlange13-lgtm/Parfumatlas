"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MONO, OURO, Rolar, Rot } from "./kit";

type Item = { nome: string; casa: string; pct: number; original: boolean; imagem: string | null; href: string };

/** Uma lista só de perfumes semelhantes, com a foto do frasco (tenha ou não na coleção). */
export function AbasSemelhantes({ itens, perfumeId }: { itens: Item[]; perfumeId?: string }) {
  const [busca, setBusca] = useState<"" | "buscando" | string>("");
  const router = useRouter();
  async function refazer() {
    if (!perfumeId) return;
    setBusca("buscando");
    try {
      const r = await fetch("/api/parecidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: perfumeId }), signal: AbortSignal.timeout(130000) });
      const j = await r.json();
      if (!r.ok) setBusca(j.erro ?? "Não consegui buscar agora.");
      else { setBusca(`Encontrei ${j.n} semelhante${j.n === 1 ? "" : "s"}.${j.descartados?.length ? ` Descartei por a fonte não confirmar: ${j.descartados.join(", ")}.` : ""}`); router.refresh(); }
    } catch {
      setBusca("A busca demorou demais. Tente de novo.");
    }
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
      <Rot>Semelhantes</Rot>
      {itens.length === 0 ? (
        <div style={{ fontSize: 14, color: "var(--ink-3)" }}>Nenhum semelhante encontrado ainda.</div>
      ) : (
        <Rolar gap={10}>
          {itens.map((it) => (
            <Link key={it.nome} href={it.href} style={{ width: 112, flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ position: "relative", width: 112, height: 130, borderRadius: 14, background: it.imagem ? "#FFFFFF" : "var(--surface)", border: `1px solid ${it.original ? OURO : "var(--line)"}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {it.imagem
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={it.imagem} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  : <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--ink-3)", padding: 8, textAlign: "center" }}>{it.casa.toUpperCase()}</span>}
                <span style={{ position: "absolute", top: 6, right: 6, padding: "2px 6px", borderRadius: 8, background: "rgba(10,10,12,.78)", color: OURO, fontSize: 11, fontFamily: MONO }}>{it.pct}%</span>
              </span>
              <span style={{ fontSize: 13, lineHeight: 1.25 }}>{it.nome}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".06em", color: "var(--ink-3)", textTransform: "uppercase" }}>{it.original ? "o original" : it.casa}</span>
            </Link>
          ))}
        </Rolar>
      )}
      {perfumeId && (
        <button type="button" onClick={refazer} disabled={busca === "buscando"} style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, color: "var(--ink-3)", fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 }}>
          {busca === "buscando" ? "Buscando semelhantes… (até 1 minuto)" : "Buscar os semelhantes e a mesma casa de novo"}
        </button>
      )}
      {busca && busca !== "buscando" && <span style={{ fontSize: 13, color: busca.startsWith("Encontrei") ? "var(--ink-3)" : "#E0A08F" }}>{busca}</span>}
    </div>
  );
}
