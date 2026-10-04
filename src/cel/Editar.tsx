"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icone } from "@/components/Icone";
import { Frasco } from "@/components/Frasco";
import type { Perfume, Votos } from "@/lib/tipos";
import { ACORDES, CONCENTRACOES, FAMILIAS, GENEROS, NIVEIS_FIXACAO, NIVEIS_PROJECAO, acordePrincipal, familiaAtlas } from "@/lib/normalizar";
import { Card, MONO, NotaChip, OURO, Rot } from "./kit";
import { reduzirFoto } from "./voz";

type E = { situacao: string; anotacao: string; foto: string | null; minhaFixacao: number | null; minhaProjecao: number | null; minhaNota: number | null };
const NF = NIVEIS_FIXACAO.map((n) => `${n.nome} · ${n.faixa}`);
const NP = NIVEIS_PROJECAO.map((n) => `${n.nome} · ${n.faixa}`);
const FORCA = ["Leve", "Presente", "Marcante", "Forte", "Dominante"];
const QUANTO = ["Pouco", "Às vezes", "Bem", "Muito bem", "Ideal"];
/** Votos vazios para ficha feita à mão: nada inventado, só o que você marcar. */
const VAZIO: Votos = { total: 0, fixacao: [0, 0, 0, 0, 0], projecao: [0, 0, 0, 0], estacoes: { primavera: 0, verao: 0, outono: 0, inverno: 0 }, dia: 0, noite: 0, ocasioes: [] };
const nivel = (v?: number) => (v ? Math.max(1, Math.min(5, Math.round(v / 20))) : null);

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
  // caixa de seleção (concentração e gênero); valor antigo fora da lista continua aparecendo
  const escolha = (l: string, v: string, opcoes: readonly string[], set: (x: string) => void) => (
    <label style={{ borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", padding: "8px 11px", display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
      <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".1em", color: "var(--ink-3)" }}>{l}</span>
      <select value={v} onChange={(x) => set(x.target.value)} style={{ background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 14, padding: 0, minWidth: 0, fontFamily: "inherit" }}>
        <option value="" style={{ color: "#000" }}>escolher</option>
        {v && !opcoes.includes(v) && <option value={v} style={{ color: "#000" }}>{v}</option>}
        {opcoes.map((o) => <option key={o} value={o} style={{ color: "#000" }}>{o}</option>)}
      </select>
    </label>
  );
  // acordes: força em 5 níveis (20 a 100); o mais forte vira o acorde principal
  const acordesNovos = (lista: { nome: string; valor: number }[]) => {
    const ord = [...lista].sort((a, b) => b.valor - a.valor);
    setP({ ...p, acordes: ord, acorde: ord[0] ? acordePrincipal(ord[0].nome) : p.acorde, familia: p.familia || familiaAtlas(ord.map((a) => a.nome).join(" "), ord[0]?.nome) });
  };
  const faltam = ACORDES.filter((a) => !p.acordes.some((x) => x.nome.toLowerCase() === a.toLowerCase()));
  // quando usar: estações, dia e noite em 5 níveis
  const votos = p.votos ?? VAZIO;
  const mudaVoto = (k: "primavera" | "verao" | "outono" | "inverno" | "dia" | "noite", v: number) =>
    setP({ ...p, votos: k === "dia" || k === "noite" ? { ...votos, [k]: v * 20 } : { ...votos, estacoes: { ...votos.estacoes, [k]: v * 20 } } });
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
            <button type="button" className="c-pill" style={{ height: 32, borderRadius: "var(--r-ctl)", fontSize: 12.5 }} onClick={() => document.getElementById("editar-foto")?.click()}><Icone nome="camera" tamanho={14} />Trocar</button>
            {p.imagem && <button type="button" className="c-pill" style={{ height: 32, borderRadius: "var(--r-ctl)", fontSize: 12.5 }} onClick={() => setFoto(p.imagem ?? null)}>Usar a oficial</button>}
          </div>
        </div>
      </div>
      <div className="c-grade2" style={{ gap: 8 }}>
        {campo("NOME", p.nome, (v) => setP({ ...p, nome: v }))}
        {campo("CASA", p.casa, (v) => setP({ ...p, casa: v }))}
        {escolha("CONCENTRAÇÃO", p.concentracao ?? "", CONCENTRACOES, (v) => setP({ ...p, concentracao: v }))}
        {campo("ANO", p.ano ? String(p.ano) : "", (v) => setP({ ...p, ano: Number(v) || undefined }))}
        {campo("PERFUMISTA", p.perfumistas.join(", "), (v) => setP({ ...p, perfumistas: v.split(",").map((x) => x.trim()).filter(Boolean) }))}
        <label style={{ borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", padding: "8px 11px", display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".1em", color: "var(--ink-3)" }}>FAMÍLIA</span>
          <select value={p.familia} onChange={(x) => setP({ ...p, familia: x.target.value })} style={{ background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 14, padding: 0, minWidth: 0, fontFamily: "inherit" }}>
            {FAMILIAS.map((f) => <option key={f} value={f} style={{ color: "#000" }}>{f}</option>)}
          </select>
        </label>
        {escolha("GÊNERO", p.genero ?? "", GENEROS, (v) => setP({ ...p, genero: v }))}
        {campo("PAÍS", p.pais ?? "", (v) => setP({ ...p, pais: v }))}
      </div>
      <Rot>Situação</Rot>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[["tenho", "Tenho"], ["tive", "Tive"], ["quero", "Quero"], ["assinatura", "★ Assinatura"]].map(([k, n]) => (
          <button key={k} type="button" className={`c-pill ${e.situacao === k ? "on" : ""}`} style={{ height: 34, borderRadius: "var(--r-ctl)" }} onClick={() => setE({ ...e, situacao: k })}>{n}</button>
        ))}
      </div>
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
        <Rot>Acordes</Rot>
        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Desenham o DNA olfativo da ficha. Toque na barra para dar a força.</span>
        {p.acordes.map((a) => (
          <div key={a.nome} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, flexGrow: 1 }}>{a.nome}</span>
              <button type="button" onClick={() => acordesNovos(p.acordes.filter((x) => x.nome !== a.nome))} style={{ background: "none", border: "none", color: "var(--ink-3)", fontSize: 13 }} aria-label={`Tirar ${a.nome}`}>tirar ×</button>
            </div>
            {segs(5, 5, nivel(a.valor), (v) => acordesNovos(p.acordes.map((x) => (x.nome === a.nome ? { ...x, valor: v * 20 } : x))), FORCA)}
          </div>
        ))}
        {faltam.length > 0 && (
          <select value="" onChange={(x) => { const nome = x.target.value; if (nome) acordesNovos([...p.acordes, { nome, valor: 60 }]); }}
            style={{ height: 38, borderRadius: "var(--r-ctl)", border: "1px dashed var(--line-2)", background: "transparent", color: "var(--ink-2)", fontSize: 13.5, padding: "0 10px", fontFamily: "inherit" }}>
            <option value="" style={{ color: "#000" }}>+ acorde</option>
            {faltam.map((a) => <option key={a} value={a} style={{ color: "#000" }}>{a}</option>)}
          </select>
        )}
      </Card>
      <Card pad={14} gap={12}>
        <Rot>Quando usar</Rot>
        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Estação e período em que ele funciona. Vale para a sugestão do dia pelo clima.</span>
        {([["PRIMAVERA", "primavera"], ["VERÃO", "verao"], ["OUTONO", "outono"], ["INVERNO", "inverno"], ["DIA", "dia"], ["NOITE", "noite"]] as const).map(([nome, k]) => (
          <div key={k} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)" }}>{nome}</span>
            {segs(5, 5, nivel(k === "dia" || k === "noite" ? votos[k] : votos.estacoes[k]), (v) => mudaVoto(k, v), QUANTO)}
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
