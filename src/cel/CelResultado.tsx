"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Anel, Card, MONO, NotaChip, OURO, PalcoC, Rot, Topo } from "./kit";
import { guardarRecente } from "./CelBuscar";
import type { Perfume } from "@/lib/tipos";

type V = { tem: boolean; quero: boolean; pct: number; parecido: { nome: string; sim: number } | null; linhas: { l: string; a: string; b: string }[]; texto: string };

/** Negrito simples: **assim**. */
function Rico({ t }: { t: string }) {
  return <>{t.split(/(\*\*[^*]+\*\*)/).map((x, i) => (x.startsWith("**") ? <b key={i}>{x.slice(2, -2)}</b> : <span key={i}>{x}</span>))}</>;
}

export function CelResultado({ p, v, novo, podeSalvar }: { p: Perfume; v: V; novo: boolean; podeSalvar: boolean }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState("");
  const [erro, setErro] = useState("");
  useEffect(() => {
    guardarRecente({ nome: p.nome, casa: p.casa, href: location.pathname + location.search, sub: v.tem ? "Você tem" : v.parecido && v.parecido.sim >= 82 ? `Parecido com o ${v.parecido.nome}, que você tem` : `${v.pct}% de afinidade`, pct: v.pct, tem: v.tem });
  }, [p, v]);

  async function marcar(situacao: "quero" | "tenho") {
    if (!podeSalvar) { setErro("O banco ainda não está ligado. Configure o Supabase para salvar."); return; }
    setOcupado(situacao); setErro("");
    try {
      if (novo || !p.id) {
        const { id: _id, clima: _c, ...ficha } = p;
        void _id; void _c;
        const r = await fetch("/api/salvar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ficha: { ...ficha, revisar: p.revisar ?? [] }, situacao }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.erro);
        router.push(situacao === "tenho" ? `/colecao/${j.id}` : "/colecao");
      } else {
        const f = new FormData();
        f.append("perfume", p.id); f.append("situacao", situacao);
        const r = await fetch("/api/situacao", { method: "POST", body: f });
        if (r.url.includes("/entrar")) throw new Error("Entre na sua conta para salvar.");
        router.push(situacao === "tenho" ? new URL(r.url).pathname.startsWith("/colecao/") ? new URL(r.url).pathname : `/colecao/${p.id}` : "/colecao");
      }
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : "Não consegui salvar agora.");
      setOcupado("");
    }
  }

  const s = v.parecido?.nome.split(" ").slice(0, 2).join(" ");
  return (
    <div className="c-tela sem-barra">
      <Topo titulo="Resultado" voltar direita={<button type="button" className="c-circ" style={{ width: 36, height: 36 }} aria-label="Compartilhar" onClick={() => { const n = navigator as Navigator & { share?: (d: object) => Promise<void> }; if (n.share) n.share({ title: p.nome, url: location.href }).catch(() => {}); }}><svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.6 }}><path d="M12 3v12 M7 8l5-5 5 5 M5 14v6h14v-6" /></svg></button>} />
      <div style={{ display: "flex", gap: 14, alignItems: "stretch", flexShrink: 0 }}>
        <div style={{ width: 118, flexShrink: 0 }}><PalcoC nome={p.nome} casa={p.casa} acorde={p.acorde} forma={p.forma} tampa={p.tampa} foto={p.imagem} altura={150} k={0.8} raio={18} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0, paddingTop: 6 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".08em", color: "var(--ink-3)" }}>{p.casa.toUpperCase()}{p.ano ? ` · ${p.ano}` : ""}</span>
          <span style={{ fontSize: 24, fontFamily: "var(--marca)", fontWeight: 500, lineHeight: 1.1 }}>{p.nome}</span>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <span style={{ padding: "2px 8px", borderRadius: 8, background: "var(--chip-2)", fontSize: 11.5 }}>{v.tem ? "Você tem" : "Você não tem"}</span>
            {v.quero && <span style={{ padding: "2px 8px", borderRadius: 8, background: "rgba(216,185,112,.16)", color: OURO, fontSize: 11.5 }}>No seu Quero</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Anel valor={v.pct / 100} txt={`${v.pct}%`} tam={46} sw={4} cor={OURO} />
            <span style={{ fontSize: 12.5, lineHeight: 1.35, color: "var(--ink-2)" }}>de afinidade<br />com o seu DNA</span>
          </div>
        </div>
      </div>

      <Card fundo="destaque" pad={16}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: 14, background: "var(--chip-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "none", stroke: "currentColor", strokeWidth: 1.6 }}><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2 6.1 20.5l1.3-6.6L2.5 9.4l6.6-.8z" /></svg></span>
          <Rot>Vale a pena?</Rot>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.6 }}><Rico t={v.texto} /></div>
      </Card>

      {v.linhas.length > 0 && (
        <Card pad={16} gap={0}>
          <Rot style={{ marginBottom: 10 }}>Comparado ao que você tem</Rot>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 10px", fontSize: 13.5 }}>
            <span />
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", color: OURO, paddingBottom: 8 }}>{p.nome.split(" ").slice(0, 2).join(" ").toUpperCase()}</span>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", color: "var(--ink-3)", paddingBottom: 8 }}>SEU {s?.toUpperCase()}</span>
            {v.linhas.map((l) => (
              <div key={l.l} style={{ display: "contents" }}>
                <span style={{ color: "var(--ink-3)", padding: "10px 0", borderTop: "1px solid var(--line)" }}>{l.l}</span>
                <span style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>{l.a}</span>
                <span style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>{l.b}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
        {[...p.notas.saida.slice(0, 1), ...p.notas.coracao.slice(0, 1), ...p.notas.fundo.slice(0, 1)].map((n) => <NotaChip key={n} nome={n} tam={26} fs={13} />)}
      </div>
      {p.id && !novo ? <Link href={`/colecao/${p.id}`} style={{ fontSize: 13.5, color: "var(--ink-2)", alignSelf: "flex-start", borderBottom: "1px solid var(--prata)" }}>Ver a ficha completa</Link> : null}
      {erro && <span style={{ color: "var(--erro)", fontSize: 13.5 }}>{erro}</span>}
      {!v.tem && (
        <div className="c-rodape">
          <button type="button" className="c-btn sec" style={{ height: 52, borderRadius: 26 }} onClick={() => marcar("tenho")} disabled={Boolean(ocupado)}>{ocupado === "tenho" ? "Salvando…" : "Comprei"}</button>
          <button type="button" className="c-btn" style={{ height: 52, borderRadius: 26, flexGrow: 1 }} onClick={() => marcar("quero")} disabled={Boolean(ocupado) || v.quero}>{v.quero ? "✓ No seu Quero" : ocupado === "quero" ? "Salvando…" : "Adicionar ao Quero"}</button>
        </div>
      )}
    </div>
  );
}
