"use client";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { reduzirFoto } from "./voz";

const ICO: Record<string, string> = {
  editar: "M5 7V5h14v2 M12 5v14 M9 19h6",
  foto: "M4 8h4l2-3h4l2 3h4v11H4z M12 10a3.5 3.5 0 1 0 .01 0",
  tive: "M9 3h6v3H9z M8 8h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z",
  share: "M12 3v12 M7 8l5-5 5 5 M5 14v6h14v-6",
  lixo: "M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13",
};

function Item({ ic, titulo, sub, onClick, perigo }: { ic: string; titulo: string; sub: string; onClick: () => void; perigo?: boolean }) {
  return (
    <button type="button" onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", background: "none", borderWidth: "1px 0 0", borderStyle: "solid", borderColor: "var(--line)", color: perigo ? "var(--erro)" : "var(--ink)", textAlign: "left", width: "100%" }}>
      <span style={{ width: 36, height: 36, borderRadius: 12, background: perigo ? "rgba(229,140,122,.12)" : "var(--chip)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }}><path d={ICO[ic]} /></svg>
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 15 }}>{titulo}</span>
        <span style={{ fontSize: 12, color: perigo ? "rgba(229,140,122,.75)" : "var(--ink-3)" }}>{sub}</span>
      </span>
    </button>
  );
}

async function postar(url: string, dados: Record<string, string>) {
  const f = new FormData();
  Object.entries(dados).forEach(([k, v]) => f.append(k, v));
  return fetch(url, { method: "POST", body: f, redirect: "manual" });
}

/** Botão "···" da ficha: editar, trocar foto, mover para Tive, compartilhar e remover. */
export function OpcoesPerfume({ id, nome, casa, entradaId, situacao, numero }: { id: string; nome: string; casa: string; entradaId: string | null; situacao: string | null; numero?: number; children?: ReactNode }) {
  const router = useRouter();
  const [aberto, setAberto] = useState<"" | "menu" | "remover">("");
  const [ocupado, setOcupado] = useState(false);
  const naColecao = Boolean(entradaId);
  const idFoto = `trocar-foto-${useId().replace(/:/g, "")}`; // a ficha tem este menu no celular e no computador

  async function moverTive() {
    setOcupado(true);
    await postar("/api/situacao", { perfume: id, situacao: "tive" });
    setOcupado(false);
    setAberto("");
    router.refresh();
  }
  async function remover() {
    setOcupado(true);
    const r = await postar("/api/remover", { perfume: id });
    setOcupado(false);
    if (r.type === "opaqueredirect" || r.ok) router.push("/colecao");
    else alert("Não consegui remover agora.");
  }
  async function trocarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setOcupado(true);
    const foto = await reduzirFoto(f, 1200);
    const r = await fetch("/api/foto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfume: id, foto: { mime: foto.mime, base64: foto.base64 } }) });
    setOcupado(false);
    setAberto("");
    if (!r.ok) alert((await r.json()).erro ?? "Não consegui trocar a foto.");
    else router.refresh();
  }
  async function compartilhar() {
    const url = location.href;
    const nav = navigator as Navigator & { share?: (d: { title: string; url: string }) => Promise<void> };
    if (nav.share) await nav.share({ title: `${nome} · Parfum Atlas`, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); alert("Link copiado."); }
    setAberto("");
  }

  return (
    <>
      <button type="button" className="c-circ" style={{ width: 36, height: 36 }} aria-label="Opções do perfume" onClick={() => setAberto("menu")}>
        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" }}><path d="M5 12h.01 M12 12h.01 M19 12h.01" /></svg>
      </button>
      <input id={idFoto} type="file" accept="image/*" capture="environment" hidden onChange={trocarFoto} />
      {/* a folha vai direto para o <body>: dentro do topo (que tem desfoque) ela ficaria presa lá em cima */}
      {aberto && typeof document !== "undefined" ? createPortal(<>
      {aberto === "menu" && (
        <>
          <div className="c-folha-fundo" onClick={() => setAberto("")} />
          <div className="c-folha" role="dialog" aria-label="Opções do perfume" style={{ gap: 6 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingBottom: 8 }}>
              <span style={{ fontSize: 17, fontWeight: 500 }}>{nome}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".1em", color: "var(--ink-3)" }}>{casa.toUpperCase()}{numero ? ` · ENTRADA Nº ${String(numero).padStart(3, "0")}` : ""}</span>
            </div>
            <Item ic="editar" titulo="Editar ficha" sub="nome, notas, foto e anotação" onClick={() => router.push(`/editar/${id}`)} />
            <Item ic="foto" titulo={ocupado ? "Enviando…" : "Trocar foto do frasco"} sub="tirar outra ou usar a oficial" onClick={() => document.getElementById(idFoto)?.click()} />
            {naColecao && situacao !== "tive" && <Item ic="tive" titulo="Mover para Tive" sub="acabou ou vendeu, o histórico fica" onClick={moverTive} />}
            <Item ic="share" titulo="Compartilhar ficha" sub="imagem ou link" onClick={compartilhar} />
            {naColecao && <Item ic="lixo" titulo="Remover da coleção" sub="apaga a entrada e as anotações" perigo onClick={() => setAberto("remover")} />}
          </div>
        </>
      )}
      {aberto === "remover" && (
        <>
          <div className="c-folha-fundo" onClick={() => setAberto("")} />
          <div role="alertdialog" aria-label={`Remover o ${nome}?`} style={{ position: "fixed", left: 24, right: 24, top: "50%", transform: "translateY(-50%)", zIndex: 42, borderRadius: 26, background: "#141417", border: "1px solid var(--line-2)", padding: 22, display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
            <span style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(229,140,122,.14)", color: "var(--erro)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.6 }}><path d={ICO.lixo} /></svg>
            </span>
            <span style={{ fontSize: 18, fontWeight: 500 }}>Remover o {nome}?</span>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>Se ele só acabou, mova para <b>Tive</b> e o DNA continua contando. Remover apaga a entrada, a foto e as anotações.</span>
            <button type="button" className="c-btn" style={{ height: 46, borderRadius: 23, width: "100%" }} onClick={moverTive} disabled={ocupado}>Mover para Tive</button>
            <button type="button" className="c-btn sec" style={{ height: 46, borderRadius: 23, width: "100%", color: "var(--erro)", borderColor: "rgba(229,140,122,.5)" }} onClick={remover} disabled={ocupado}>{ocupado ? "Removendo…" : "Remover"}</button>
            <button type="button" style={{ background: "none", border: "none", color: "var(--ink-2)", fontSize: 14, padding: 6 }} onClick={() => setAberto("")}>Cancelar</button>
          </div>
        </>
      )}
      </>, document.body) : null}
    </>
  );
}
