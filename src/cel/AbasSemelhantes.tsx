"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MONO, OURO, Pill, Rolar, Rot } from "./kit";

type Item = { sim: number; nome: string; marca: string; por: string; tag: string; bw: number; bh: number; br: string; capW: number; tampa: string; rot: string; fundo: string; vidro: string; href: string };
type Coluna = { nome: string; sub: string; itens: Item[] };

const curto = (n: string) => (n.startsWith("INSPIR") ? "Inspirados" : n.startsWith("NA SUA") ? "Na coleção" : "Fora da coleção");

/** Frasco pequeno a partir das medidas calculadas no servidor. */
export function FrascoMini({ it, w = 52, h = 58 }: { it: Pick<Item, "bw" | "bh" | "br" | "capW" | "tampa" | "rot" | "fundo" | "vidro">; w?: number; h?: number }) {
  const k = 0.62;
  return (
    <div style={{ width: w, height: h, borderRadius: 12, background: it.fundo, border: "1px solid var(--line)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 6, flexShrink: 0, overflow: "hidden" }}>
      <span style={{ width: it.capW * k, height: 8, borderRadius: 2, background: it.tampa }} />
      <span style={{ width: it.bw * k, height: it.bh * k, borderRadius: it.br, background: it.vidro, border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ width: it.bw * k - 6, height: 9, borderRadius: "50%", background: "#F4F7FC", color: "#0A0A0C", fontSize: 4, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{it.rot}</span>
      </span>
    </div>
  );
}

export function AbasSemelhantes({ colunas, perfumeId }: { colunas: Coluna[]; perfumeId?: string }) {
  const [i, setI] = useState(0);
  const [busca, setBusca] = useState<"" | "buscando" | string>("");
  const router = useRouter();
  const col = colunas[i];
  async function refazer() {
    if (!perfumeId) return;
    setBusca("buscando");
    try {
      const r = await fetch("/api/parecidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: perfumeId }), signal: AbortSignal.timeout(130000) });
      const j = await r.json();
      if (!r.ok) setBusca(j.erro ?? "Não consegui buscar agora.");
      else { setBusca(""); router.refresh(); }
    } catch {
      setBusca("A busca demorou demais. Tente de novo.");
    }
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <Rot>Semelhantes</Rot>
        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{col?.sub}</span>
      </div>
      <Rolar gap={6}>
        {colunas.map((c, k) => <Pill key={c.nome} on={k === i} onClick={() => setI(k)}>{curto(c.nome)}</Pill>)}
      </Rolar>
      <div>
        {(col?.itens ?? []).length === 0 && <div style={{ fontSize: 14, color: "var(--ink-3)", padding: "10px 0" }}>Nada nesta lista por enquanto.</div>}
        {(col?.itens ?? []).map((it, k) => (
          <Link key={it.nome} href={it.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: k ? "1px solid var(--line)" : "none" }}>
            <FrascoMini it={it} />
            <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>{it.nome}</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".08em", color: "var(--ink-3)", textTransform: "uppercase" }}>{it.marca} · {it.por}</span>
              {it.tag ? <span style={{ alignSelf: "flex-start", padding: "2px 8px", borderRadius: 8, background: "var(--chip-2)", fontSize: 10.5 }}>{it.tag}</span> : null}
            </div>
            <span style={{ fontSize: 15, color: OURO }}>{it.sim}%</span>
          </Link>
        ))}
      </div>
      {perfumeId && (
        <button type="button" onClick={refazer} disabled={busca === "buscando"} style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, color: "var(--ink-3)", fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 }}>
          {busca === "buscando" ? "Buscando parecidos… (até 1 minuto)" : "Buscar os parecidos de novo"}
        </button>
      )}
      {busca && busca !== "buscando" && <span style={{ fontSize: 13, color: "#E0A08F" }}>{busca}</span>}
    </div>
  );
}
