"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icone } from "@/components/Icone";
import { Frasco } from "@/components/Frasco";
import type { Perfume } from "@/lib/tipos";
import { Card, MONO, NotaChip, OURO, Rot } from "./kit";
import { ouvirUmaVez, reduzirFoto } from "./voz";

type E = { situacao: string; anotacao: string; foto: string | null; minhaFixacao: number | null; minhaProjecao: number | null; minhaNota: number | null };
const NF = ["Muito fraca", "Fraca", "Moderada", "Duradoura", "Muito longa"];
const NP = ["Íntima", "Moderada", "Forte", "Enorme"];

export function Editar({ p: p0, e: e0, podeSalvar }: { p: Perfume; e: E; podeSalvar: boolean }) {
  const router = useRouter();
  const [p, setP] = useState(p0);
  const [e, setE] = useState(e0);
  const [foto, setFoto] = useState<string | null>(e0.foto);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  const campo = (l: string, v: string, set: (x: string) => void) => (
    <label style={{ borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", padding: "8px 11px", display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
      <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".1em", color: "var(--ink-3)" }}>{l}</span>
      <input value={v} onChange={(x) => set(x.target.value)} style={{ background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 14, padding: 0, minWidth: 0 }} />
    </label>
  );
  const tira = (k: "saida" | "coracao" | "fundo", n: string) => setP({ ...p, notas: { ...p.notas, [k]: p.notas[k].filter((x) => x !== n) } });
  const poe = (k: "saida" | "coracao" | "fundo") => { const n = prompt("Nome da nota"); if (n?.trim()) setP({ ...p, notas: { ...p.notas, [k]: [...p.notas[k], n.trim()] } }); };

  async function trocarFoto(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    if (!f) return;
    const r = await reduzirFoto(f, 1200);
    setFoto(r.url);
    if (!podeSalvar) return;
    const res = await fetch("/api/foto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfume: p.id, foto: { mime: r.mime, base64: r.base64 } }) });
    if (!res.ok) setErro((await res.json()).erro ?? "Não consegui enviar a foto.");
  }
  async function salvar() {
    if (!podeSalvar) { setErro("O banco ainda não está ligado. Configure o Supabase para salvar."); return; }
    setOcupado(true); setErro("");
    const r = await fetch("/api/editar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfume: p, ...e }) });
    const j = await r.json();
    setOcupado(false);
    if (!r.ok) setErro(j.erro ?? "Não consegui salvar.");
    else { router.push(`/colecao/${j.id}`); router.refresh(); }
  }
  const segs = (n: number, total: number, val: number | null, set: (v: number) => void, nomes: string[]) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: total }, (_, i) => <button key={i} type="button" onClick={() => set(i + 1)} aria-label={nomes[i]} style={{ flex: 1, height: 10, borderRadius: 3, border: "none", padding: 0, background: val && i < val ? OURO : "var(--chip-2)" }} />)}
      </div>
      <span style={{ fontSize: 12.5, textAlign: "right", color: "var(--ink-2)" }}>{val ? nomes[val - 1] : "toque para marcar"}</span>
    </div>
  );

  return (
    <div className="c-tela sem-barra" style={{ maxWidth: 620, margin: "0 auto" }}>
      <div className="c-topo">
        <button type="button" onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--ink-2)", fontSize: 14 }}>Cancelar</button>
        <span className="c-topo-tit">Editar perfume</span>
        <button type="button" onClick={salvar} disabled={ocupado} style={{ background: "none", border: "none", color: OURO, fontSize: 14, fontWeight: 600 }}>{ocupado ? "Salvando…" : "Salvar"}</button>
      </div>
      {erro && <span style={{ color: "var(--erro)", fontSize: 13.5 }}>{erro}</span>}
      <input id="editar-foto" type="file" accept="image/*" capture="environment" hidden onChange={trocarFoto} />
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
        <span style={{ width: 64, height: 80, borderRadius: 14, background: "var(--surface)", border: "1px solid var(--line)", overflow: "hidden", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6, flexShrink: 0 }}>
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : <Frasco nome={p.nome} casa={p.casa} acorde={p.acorde} forma={p.forma} tampa={p.tampa} escala={0.5} />}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Foto do seu frasco</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="c-pill" style={{ height: 32, borderRadius: 16, fontSize: 12.5 }} onClick={() => document.getElementById("editar-foto")?.click()}><Icone nome="camera" tamanho={14} />Trocar</button>
            {p.imagem && <button type="button" className="c-pill" style={{ height: 32, borderRadius: 16, fontSize: 12.5 }} onClick={() => setFoto(p.imagem ?? null)}>Usar a oficial</button>}
          </div>
        </div>
      </div>
      <div className="c-grade2" style={{ gap: 8 }}>
        {campo("NOME", p.nome, (v) => setP({ ...p, nome: v }))}
        {campo("CASA", p.casa, (v) => setP({ ...p, casa: v }))}
        {campo("CONCENTRAÇÃO", p.concentracao ?? "", (v) => setP({ ...p, concentracao: v }))}
        {campo("ANO", p.ano ? String(p.ano) : "", (v) => setP({ ...p, ano: Number(v) || undefined }))}
        {campo("PERFUMISTA", p.perfumistas.join(", "), (v) => setP({ ...p, perfumistas: v.split(",").map((x) => x.trim()).filter(Boolean) }))}
        {campo("FAMÍLIA", p.familia, (v) => setP({ ...p, familia: v }))}
        {campo("GÊNERO", p.genero ?? "", (v) => setP({ ...p, genero: v }))}
        {campo("PAÍS", p.pais ?? "", (v) => setP({ ...p, pais: v }))}
      </div>
      <Rot>Situação</Rot>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[["tenho", "Tenho"], ["tive", "Tive"], ["quero", "Quero"], ["assinatura", "★ Assinatura"]].map(([k, n]) => (
          <button key={k} type="button" className={`c-pill ${e.situacao === k ? "on" : ""}`} style={{ height: 34, borderRadius: 17 }} onClick={() => setE({ ...e, situacao: k })}>{n}</button>
        ))}
      </div>
      <Rot>Anotação</Rot>
      <label className="c-campo" style={{ height: "auto", minHeight: 80, alignItems: "flex-start", padding: 14, borderRadius: 16, border: "1px solid var(--line-2)", background: "transparent" }}>
        <textarea value={e.anotacao} onChange={(x) => setE({ ...e, anotacao: x.target.value })} rows={3} placeholder="Como ele fica em você, quando usar, de onde veio…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 14.5, resize: "none", fontFamily: "var(--sans)" }} />
        <button type="button" onClick={() => ouvirUmaVez((t) => setE((x) => ({ ...x, anotacao: `${x.anotacao ? x.anotacao + " " : ""}${t}` })))} style={{ background: "none", border: "none", color: "var(--ink-2)" }} aria-label="Ditar anotação"><Icone nome="mic" tamanho={17} /></button>
      </label>
      <Card pad={14} gap={12}>
        <Rot>Pirâmide</Rot>
        {([["SAÍDA", "saida"], ["CORAÇÃO", "coracao"], ["FUNDO", "fundo"]] as const).map(([nome, k]) => (
          <div key={k} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)" }}>{nome}</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {p.notas[k].map((n) => (
                <button key={n} type="button" onClick={() => tira(k, n)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 9px 2px 2px", borderRadius: 16, background: "var(--chip)", border: "none", color: "var(--ink)", fontSize: 12 }} aria-label={`Tirar ${n}`}>
                  <NotaChip nome={n} tam={22} rotulo={false} />{n}<span style={{ color: "var(--ink-3)" }}>×</span>
                </button>
              ))}
              <button type="button" onClick={() => poe(k)} className="tracejado" style={{ background: "none", padding: "3px 10px", borderRadius: 14 }}>+ nota</button>
            </div>
          </div>
        ))}
      </Card>
      <Card pad={14} gap={12}>
        <Rot>Como fica em você</Rot>
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)" }}>FIXAÇÃO NA SUA PELE</span>
        {segs(5, 5, e.minhaFixacao, (v) => setE({ ...e, minhaFixacao: v }), NF)}
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)" }}>PROJEÇÃO NA SUA PELE</span>
        {segs(4, 4, e.minhaProjecao, (v) => setE({ ...e, minhaProjecao: v }), NP)}
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)" }}>SUA NOTA</span>
        {segs(5, 5, e.minhaNota, (v) => setE({ ...e, minhaNota: v }), ["★ 1 de 5", "★ 2 de 5", "★ 3 de 5", "★ 4 de 5", "★ 5 de 5"])}
      </Card>
      <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 16, background: "var(--chip)", fontSize: 12.5, lineHeight: 1.45, color: "var(--ink-2)" }}>
        <Icone nome="check" tamanho={16} />Os dados da comunidade continuam na ficha. Aqui vale a sua pele.
      </div>
    </div>
  );
}
