"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MONO, OURO, Rot } from "./kit";

type Item = { nome: string; casa: string; pct: number; original: boolean; imagem: string | null; href: string; faixa: string; relacao: string | null; radar: boolean; semelhanca: string | null; diferenca: string | null; manual: boolean };

/**
 * Semelhantes pelo método de parentesco: 7 perfumes (⭐ = fora do radar) com faixa, relação, semelhança e diferença.
 * A pesquisa roda na OpenAI em segundo plano; a tela consulta até ficar pronta (dá para sair e voltar).
 */
export function Semelhantes({ itens, perfumeId, buscando, nome }: { itens: Item[]; perfumeId: string; buscando: boolean; nome: string }) {
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(buscando ? "pesquisando" : "");
  const router = useRouter();
  const vivo = useRef(true);

  const chamar = useCallback(async (corpo: Record<string, unknown>) => {
    const r = await fetch("/api/parecidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: perfumeId, ...corpo }), signal: AbortSignal.timeout(60000) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.erro ?? "Não deu certo agora.");
    return j as { estado: string; erro?: string; n?: number; reaproveitado?: string };
  }, [perfumeId]);

  // consulta a pesquisa a cada 8 s até ficar pronta
  const acompanhar = useCallback(async () => {
    setOcupado("pesquisando");
    for (let i = 0; i < 90 && vivo.current; i++) {
      await new Promise((ok) => setTimeout(ok, 8000));
      try {
        const j = await chamar({ acao: "verificar" });
        if (j.estado === "pendente") continue;
        if (j.estado === "pronta") { setMsg(`Pronto: ${j.n} semelhantes.`); router.refresh(); }
        else if (j.estado === "falhou") setMsg(j.erro ?? "A pesquisa falhou.");
        break;
      } catch { /* tenta de novo na próxima volta */ }
    }
    if (vivo.current) setOcupado("");
  }, [chamar, router]);

  useEffect(() => {
    vivo.current = true;
    if (buscando) Promise.resolve().then(acompanhar);
    return () => { vivo.current = false; };
  }, [buscando, acompanhar]);

  async function buscar(nova: boolean) {
    setMsg(""); setOcupado("pesquisando");
    try {
      const j = await chamar({ acao: "buscar", nova });
      if (j.estado === "pronta") { setMsg(j.reaproveitado ? `Reaproveitei a pesquisa do ${j.reaproveitado} (mesmo original), sem custo.` : "Pronto."); setOcupado(""); router.refresh(); }
      else acompanhar();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Não deu certo agora."); setOcupado("");
    }
  }
  async function editar(corpo: Record<string, unknown>) {
    setOcupado("salvando"); setMsg("");
    try { await chamar(corpo); router.refresh(); } catch (e) { setMsg(e instanceof Error ? e.message : "Não deu certo agora."); }
    setOcupado("");
  }
  const adicionar = () => { const link = prompt("Cole o link da página do perfume no Fragrantica:"); if (link?.trim()) editar({ acao: "adicionar", link: link.trim() }); };
  const remover = (nome: string) => { if (confirm(`Tirar ${nome} dos semelhantes?`)) editar({ acao: "remover", nome }); };
  const link = { background: "none", border: "none", padding: 0, color: "var(--ink-3)", fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <Rot>Semelhantes</Rot>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>🧬 = quanto lembra o {nome}</span>
      </div>
      {itens.map((it, k) => (
        <div key={it.nome} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderTop: k ? "1px solid var(--line)" : "none" }}>
          <Link href={it.href} style={{ width: 64, height: 76, flexShrink: 0, borderRadius: 12, background: it.imagem ? "#FFFFFF" : "var(--surface)", border: `1px solid ${it.original ? OURO : "var(--line)"}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {it.imagem
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={it.imagem} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
              : <span style={{ fontFamily: MONO, fontSize: 8, color: "var(--ink-3)", padding: 4, textAlign: "center" }}>{it.casa.toUpperCase()}</span>}
          </Link>
          <Link href={it.href} style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>{it.radar ? "⭐ " : ""}{it.nome}</span>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".06em", color: "var(--ink-3)", textTransform: "uppercase" }}>{it.casa}{it.manual ? " · adicionado por você" : ""}</span>
            <span style={{ fontSize: 12.5, color: OURO }}>{it.original ? `o original${it.faixa && it.faixa !== "o original" ? ` · 🧬 ${it.faixa}` : ""}` : `🧬 ${it.faixa}`}{it.relacao && !it.original ? ` · ${it.relacao}` : ""}</span>
            {it.semelhanca && <span style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.35 }}>≈ {it.semelhanca}</span>}
            {it.diferenca && <span style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.35 }}>≠ {it.diferenca}</span>}
          </Link>
          <button type="button" aria-label={`Tirar ${it.nome}`} onClick={() => remover(it.nome)} disabled={Boolean(ocupado)} style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 13, border: "1px solid var(--line-2)", background: "transparent", color: "var(--ink-3)", fontSize: 14, lineHeight: "24px", padding: 0 }}>×</button>
        </div>
      ))}
      {itens.length === 0 && !ocupado && <div style={{ fontSize: 14, color: "var(--ink-3)" }}>Nenhum semelhante ainda.</div>}
      {ocupado === "pesquisando" && <span style={{ fontSize: 13, color: "var(--ink-3)" }}>Pesquisando parentes olfativos… leva de 1 a 4 minutos. Pode sair da tela: o resultado fica salvo quando você voltar.</span>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <button type="button" onClick={() => buscar(false)} disabled={Boolean(ocupado)} style={link}>{itens.length ? "Atualizar semelhantes" : "Buscar semelhantes"}</button>
        {itens.length > 0 && <button type="button" onClick={() => buscar(true)} disabled={Boolean(ocupado)} style={link}>Pesquisa nova</button>}
        <button type="button" onClick={adicionar} disabled={Boolean(ocupado)} style={link}>+ colar link do Fragrantica</button>
      </div>
      {msg && <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{msg}</span>}
    </div>
  );
}
