"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MONO, OURO, Rolar, Rot } from "./kit";

type Item = { nome: string; casa: string; pct: number; original: boolean; imagem: string | null; href: string };

/**
 * Semelhantes com foto. A busca automática só roda quando a pessoa toca;
 * o resultado soma ao que já existe, e a pessoa tira os errados (X) ou cola o link de um que faltou.
 */
export function Semelhantes({ itens, perfumeId }: { itens: Item[]; perfumeId: string }) {
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState("");
  const router = useRouter();
  async function enviar(corpo: Record<string, string>, rotulo: string) {
    setOcupado(rotulo); setMsg("");
    try {
      const r = await fetch("/api/parecidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: perfumeId, ...corpo }), signal: AbortSignal.timeout(125000) });
      const j = await r.json();
      if (!r.ok) setMsg(j.erro ?? "Não deu certo agora.");
      else {
        if (corpo.acao === "buscar") setMsg(j.novos ? `Entraram ${j.novos} novo${j.novos > 1 ? "s" : ""}. Toque no X para tirar os que não forem parecidos.` : "A busca não achou nenhum novo.");
        router.refresh();
      }
    } catch {
      setMsg("A busca demorou demais. Tente de novo.");
    } finally {
      setOcupado("");
    }
  }
  const adicionar = () => {
    const link = prompt("Cole o link da página do perfume no Fragrantica:");
    if (link?.trim()) enviar({ acao: "adicionar", link: link.trim() }, "adicionando");
  };
  const remover = (nome: string) => { if (confirm(`Tirar ${nome} dos semelhantes?`)) enviar({ acao: "remover", nome }, "removendo"); };
  const btn = { background: "none", border: "none", padding: 0, color: "var(--ink-3)", fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 } as const;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
      <Rot>Semelhantes</Rot>
      <Rolar gap={10}>
        {itens.map((it) => (
          <div key={it.nome} style={{ position: "relative", width: 112, flexShrink: 0 }}>
            <Link href={it.href} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ position: "relative", width: 112, height: 130, borderRadius: 14, background: it.imagem ? "#FFFFFF" : "var(--surface)", border: `1px solid ${it.original ? OURO : "var(--line)"}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {it.imagem
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={it.imagem} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  : <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--ink-3)", padding: 8, textAlign: "center" }}>{it.casa.toUpperCase()}</span>}
                <span style={{ position: "absolute", bottom: 6, right: 6, padding: "2px 6px", borderRadius: 8, background: "rgba(10,10,12,.78)", color: OURO, fontSize: 11, fontFamily: MONO }}>{it.pct}%</span>
              </span>
              <span style={{ fontSize: 13, lineHeight: 1.25 }}>{it.nome}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".06em", color: "var(--ink-3)", textTransform: "uppercase" }}>{it.original ? "o original" : it.casa}</span>
            </Link>
            <button type="button" aria-label={`Tirar ${it.nome}`} onClick={() => remover(it.nome)} disabled={Boolean(ocupado)} style={{ position: "absolute", top: 6, left: 6, width: 24, height: 24, borderRadius: 12, border: "none", background: "rgba(10,10,12,.78)", color: "#fff", fontSize: 14, lineHeight: "24px", padding: 0 }}>×</button>
          </div>
        ))}
        <button type="button" onClick={adicionar} disabled={Boolean(ocupado)} style={{ width: 112, height: 130, flexShrink: 0, borderRadius: 14, border: "1px dashed var(--line-2)", background: "transparent", color: "var(--ink-2)", fontSize: 13 }}>+ colar link do Fragrantica</button>
      </Rolar>
      <button type="button" onClick={() => enviar({ acao: "buscar" }, "buscando")} disabled={Boolean(ocupado)} style={{ ...btn, alignSelf: "flex-start" }}>
        {ocupado === "buscando" ? "Buscando semelhantes… (até 1 minuto)" : ocupado ? "Salvando…" : itens.length ? "Buscar mais semelhantes" : "Buscar semelhantes automaticamente"}
      </button>
      {msg && <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{msg}</span>}
    </div>
  );
}
