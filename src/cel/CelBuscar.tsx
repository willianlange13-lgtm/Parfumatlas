"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icone } from "@/components/Icone";
import { Btn, Card, Mini, MONO, NotaChip, OURO, Rot, TituloAba } from "./kit";
import { ouvir, reduzirFoto, type Escuta } from "./voz";

export type ItemBusca = { imagem?: string | null; id: string; nome: string; casa: string; acorde: string; forma: string; tampa: string; ano: number | null; notas: string[]; tem: boolean; quero: boolean; pct: number; inspiradoEm: string | null };
type Cand = { nome: string; casa: string; concentracao: string; por: string; pct: number; link?: string };
type DoAcervo = { nome: string; casa: string; pct: number; link?: string; imagem?: string | null; notas: string[] };
type Recente = { nome: string; casa: string; href: string; sub: string; pct: number; tem: boolean };

const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const mesmo = (a: { nome: string; casa: string }, b: { nome: string; casa: string }) => normal(a.nome) === normal(b.nome) && normal(a.casa) === normal(b.casa);
const CHAVE = "atlas-buscas";

function lerRecentes(): Recente[] {
  try { return JSON.parse(localStorage.getItem(CHAVE) ?? "[]"); } catch { return []; }
}
export function guardarRecente(r: Recente) {
  try {
    const l = lerRecentes().filter((x) => x.href !== r.href);
    localStorage.setItem(CHAVE, JSON.stringify([r, ...l].slice(0, 8)));
  } catch { /* sem armazenamento: segue sem histórico */ }
}

const hrefDe = (p: ItemBusca) => `/buscar/resultado?id=${encodeURIComponent(p.id)}`;
const hrefCand = (c: Cand) => `/buscar/resultado?nome=${encodeURIComponent(c.nome)}&casa=${encodeURIComponent(c.casa)}${c.concentracao ? `&conc=${encodeURIComponent(c.concentracao)}` : ""}${c.link ? `&link=${encodeURIComponent(c.link)}` : ""}`;

function LinhaP({ p, dir, sub, borda = true }: { p: ItemBusca; dir?: React.ReactNode; sub?: string; borda?: boolean }) {
  return (
    <Link href={hrefDe(p)} prefetch={false} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: borda ? "1px solid var(--line)" : "none" }}>
      <Mini nome={p.nome} casa={p.casa} acorde={p.acorde} forma={p.forma} tampa={p.tampa} foto={p.imagem} oficial={Boolean(p.imagem)} w={46} h={52} />
      <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>{p.nome}</span>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".08em", color: "var(--ink-3)", textTransform: "uppercase" }}>{p.casa}</span>
        {sub ? <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{sub}</span> : null}
      </div>
      {dir ?? (p.tem ? <Icone nome="check" tamanho={18} /> : <span style={{ fontSize: 15, color: p.pct >= 85 ? OURO : "var(--ink-2)" }}>{p.pct}%</span>)}
    </Link>
  );
}

export function CelBuscar({ lista, modoInicial }: { lista: ItemBusca[]; modoInicial?: string }) {
  const router = useRouter();
  const [aba, setAba] = useState<"perfume" | "notas" | "marca">(modoInicial === "notas" ? "notas" : modoInicial === "marca" ? "marca" : "perfume");
  const [q, setQ] = useState("");
  const [notas, setNotas] = useState<string[]>([]);
  const [novaNota, setNovaNota] = useState("");
  const [casa, setCasa] = useState("");
  const [cands, setCands] = useState<Cand[]>([]);
  const [lendo, setLendo] = useState("");
  const [erro, setErro] = useState("");
  const [recentes, setRecentes] = useState<Recente[]>([]);
  useEffect(() => { Promise.resolve().then(() => setRecentes(lerRecentes())); }, []);

  const achados = useMemo(() => {
    const t = normal(q.trim());
    if (!t) return [];
    // todas as palavras, em qualquer ordem ("lattafa khamrah" acha o Khamrah)
    const pal = t.split(/\s+/).filter(Boolean);
    return lista.filter((p) => { const alvo = normal(`${p.nome} ${p.casa} ${p.notas.join(" ")}`); return pal.every((w) => alvo.includes(w)); })
      .sort((a, b) => Number(normal(b.nome).startsWith(t)) - Number(normal(a.nome).startsWith(t)) || Number(normal(b.nome).startsWith(pal[0])) - Number(normal(a.nome).startsWith(pal[0])) || b.pct - a.pct).slice(0, 12);
  }, [q, lista]);

  // acervo global ao vivo, sem IA: enquanto digita (aba Perfume) e ao escolher notas (aba Notas)
  const [acervoQ, setAcervoQ] = useState<{ chave: string; itens: DoAcervo[] }>({ chave: "", itens: [] });
  const chaveAcervo = aba === "notas" ? (notas.length ? notas.map((n) => `nota=${encodeURIComponent(n)}`).join("&") : "") : aba === "perfume" && normal(q.trim()).length >= 2 && !/^https?:\/\//.test(q) ? `q=${encodeURIComponent(q.trim())}` : "";
  useEffect(() => {
    if (!chaveAcervo) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/acervo/buscar?${chaveAcervo}`, { signal: ctl.signal }).then((r) => r.json()).then((j) => setAcervoQ({ chave: chaveAcervo, itens: j.itens ?? [] })).catch(() => {});
    }, aba === "notas" ? 0 : 220);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [chaveAcervo, aba]);
  const doAcervo = acervoQ.chave === chaveAcervo && chaveAcervo ? acervoQ.itens.filter((a) => !lista.some((p) => mesmo(p, a))) : [];
  const buscandoAcervo = Boolean(chaveAcervo) && acervoQ.chave !== chaveAcervo;
  const listaAcervo = (titulo: string) => (doAcervo.length > 0 || buscandoAcervo) && (
    <Card pad={16} gap={0}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><Rot>{titulo}</Rot><span style={{ fontSize: 12, color: "var(--ink-3)" }}>{buscandoAcervo ? "procurando…" : "sem pesquisa paga"}</span></div>
      {doAcervo.map((a, i) => (
        <Link key={`${a.nome}|${a.casa}`} href={hrefCand({ nome: a.nome, casa: a.casa, concentracao: "", por: "Do acervo", pct: a.pct, link: a.link })} prefetch={false} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
          <Mini nome={a.nome} casa={a.casa} acorde="" forma="ret" tampa="#141B18" foto={a.imagem ?? undefined} oficial={Boolean(a.imagem)} w={46} h={52} />
          <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>{a.nome}</span>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".08em", color: "var(--ink-3)", textTransform: "uppercase" }}>{a.casa}</span>
            {a.notas.length > 0 && <span style={{ fontSize: 12, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.notas.join(", ").toLowerCase()}</span>}
          </div>
          {a.pct > 0 && <span style={{ fontSize: 14, color: a.pct >= 90 ? OURO : "var(--ink-2)" }}>{a.pct}%</span>}
        </Link>
      ))}
    </Card>
  );

  const todasNotas = useMemo(() => [...new Set(lista.flatMap((p) => p.notas))].sort((a, b) => a.localeCompare(b)), [lista]);
  const comNotas = (p: ItemBusca) => notas.every((n) => p.notas.includes(n));
  const tenhoN = notas.length ? lista.filter((p) => p.tem && comNotas(p)) : [];
  const conhecerN = notas.length ? lista.filter((p) => !p.tem && comNotas(p)).sort((a, b) => b.pct - a.pct) : [];
  const parciais = notas.length > 1 && !conhecerN.length ? lista.filter((p) => !p.tem && notas.some((n) => p.notas.includes(n))).sort((a, b) => b.pct - a.pct).slice(0, 4) : [];
  const casas = useMemo(() => {
    const m = new Map<string, ItemBusca[]>();
    lista.forEach((p) => m.set(p.casa, [...(m.get(p.casa) ?? []), p]));
    return [...m.entries()].sort((a, b) => b[1].filter((x) => x.tem).length - a[1].filter((x) => x.tem).length || a[0].localeCompare(b[0]));
  }, [lista]);

  async function identificar(modo: "foto" | "nome" | "link", texto?: string, foto?: { mime: string; base64: string }) {
    setLendo(modo === "foto" ? "Lendo o frasco…" : "Procurando…"); setErro(""); setCands([]);
    try {
      const r = await fetch("/api/identificar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modo, texto, foto }) });
      const j = await r.json();
      const c: Cand[] = j.candidatos ?? [];
      if (!c.length) setErro("Não encontrei. Tente o nome com a casa, ou fotografe o rótulo mais de perto.");
      else if (c[0].pct >= 90) router.push(hrefCand(c[0]));
      else setCands(c);
    } catch {
      setErro("Não consegui procurar agora. Tente de novo.");
    } finally {
      setLendo("");
    }
  }
  const escanear = () => document.getElementById("escanear")?.click();
  const escuta = useRef<Escuta | null>(null);
  // tocar no microfone de novo enquanto ouve = "terminei de falar"
  const falar = () => {
    if (lendo === "Ouvindo…" || lendo.startsWith("“")) { escuta.current?.parar(); return; }
    setErro(""); setCands([]); setLendo("Ouvindo…");
    escuta.current = ouvir({
      aoParcial: (t) => setLendo(t === "Entendendo…" ? t : `“${t}”`),
      aoOuvir: (t) => { setQ(t); setAba("perfume"); identificar("nome", t); },
      aoErro: (msg) => { if (/Gravando o áudio/.test(msg)) setLendo("Gravando… toque no microfone quando terminar."); else { setErro(msg); setLendo(""); } },
      aoFim: () => setLendo((x) => (x === "Ouvindo…" || x.startsWith("“") || x.startsWith("Gravando") || x === "Entendendo…" ? "" : x)),
    });
  };
  async function fotoEscolhida(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = await reduzirFoto(f);
    identificar("foto", undefined, { mime: r.mime, base64: r.base64 });
    e.target.value = "";
  }
  function addNota(n: string) {
    const achada = todasNotas.find((x) => normal(x) === normal(n.trim())) ?? n.trim();
    if (achada && !notas.includes(achada)) setNotas([...notas, achada]);
    setNovaNota("");
  }

  return (
    <div className="c-tela">
      <TituloAba titulo="Buscar" />
      <input id="escanear" type="file" accept="image/*" capture="environment" hidden onChange={fotoEscolhida} />
      <form className="c-campo" style={{ height: 52, borderRadius: "var(--r-ctl)", border: "1px solid var(--line-2)" }} onSubmit={(e) => { e.preventDefault(); if (q.trim()) identificar(/^https?:\/\//.test(q) ? "link" : "nome", q.trim()); }}>
        <Icone nome="busca" tamanho={18} />
        <input value={q} onChange={(e) => { setQ(e.target.value); if (aba !== "perfume") setAba("perfume"); }} placeholder="Nome, marca ou nota" aria-label="Buscar perfume" enterKeyHint="search" />
        <button type="button" className="c-circ" style={{ width: 36, height: 36, background: "var(--chip-2)" }} onClick={escanear} aria-label="Escanear frasco"><Icone nome="camera" tamanho={16} /></button>
        <button type="button" className="c-circ" style={{ width: 38, height: 38, background: "var(--btn)", color: "var(--on-btn)" }} onClick={falar} aria-label="Falar"><Icone nome="mic" tamanho={16} /></button>
      </form>
      <div className="c-seg">
        {(["perfume", "notas", "marca"] as const).map((k) => (
          <button key={k} type="button" className={aba === k ? "on" : ""} onClick={() => setAba(k)}>{k === "perfume" ? "Perfume" : k === "notas" ? "Notas" : "Marca"}</button>
        ))}
      </div>

      {lendo && <Card pad={14}><span style={{ fontSize: 14, color: "var(--ink-2)" }}>{lendo}</span></Card>}
      {erro && <Card pad={14}><span style={{ fontSize: 14, color: "var(--erro)" }}>{erro}</span></Card>}
      {cands.length > 0 && (
        <Card pad={16} gap={4}>
          <Rot style={{ marginBottom: 6 }}>É algum destes?</Rot>
          {cands.map((c, i) => (
            <Link key={i} href={hrefCand(c)} prefetch={false} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
              <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{c.nome}</span>
                <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".08em", color: "var(--ink-3)" }}>{c.casa.toUpperCase()}{c.concentracao ? ` · ${c.concentracao}` : ""}</span>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.por}</span>
              </div>
              <span style={{ fontSize: 14, color: i === 0 ? OURO : "var(--ink-2)" }}>{c.pct}%</span>
            </Link>
          ))}
        </Card>
      )}

      {aba === "perfume" && (
        <>
          {q.trim() && achados.length > 0 && (
            <Card pad={16} gap={0}>
              <Rot style={{ marginBottom: 6 }}>No catálogo do Atlas</Rot>
              {achados.map((p, i) => <LinhaP key={p.id} p={p} borda={i > 0} sub={p.tem ? "Você tem" : p.quero ? "No seu Quero" : p.inspiradoEm ? `Inspirado no ${p.inspiradoEm}` : undefined} />)}
            </Card>
          )}
          {q.trim() ? listaAcervo("No acervo de perfumes") : null}
          {q.trim() && !achados.length && !doAcervo.length && !buscandoAcervo && (
            <span style={{ fontSize: 13.5, color: "var(--ink-3)", padding: "2px 2px" }}>Nada no catálogo nem no acervo com esse nome.</span>
          )}
          {q.trim() ? (
            <button type="button" className="c-btn sec" style={{ height: 42, borderRadius: "var(--r-ctl)", flexShrink: 0 }} onClick={() => identificar(/^https?:\/\//.test(q) ? "link" : "nome", q.trim())}>
              <Icone nome="busca" tamanho={16} />Procurar “{q.trim().slice(0, 24)}” na internet
            </button>
          ) : null}
          {q.trim() ? null : (
            <>
              <Card fundo="destaque" pad={16}>
                <div style={{ display: "flex", gap: 14 }}>
                  <span style={{ width: 46, height: 46, borderRadius: "var(--r-ctl)", background: "rgba(255,107,61,.16)", color: OURO, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icone nome="camera" tamanho={20} /></span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 17, fontWeight: 500 }}>Modo compra</span>
                    <span style={{ fontSize: 13, lineHeight: 1.45, color: "var(--ink-2)" }}>Aponte a câmera para o frasco na loja. Mostra se você já tem, o que tem de parecido e se combina com o seu gosto.</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={escanear} style={{ flexGrow: 1 }}><Icone nome="camera" tamanho={17} />Escanear frasco</Btn>
                  <Btn sec onClick={falar}><Icone nome="mic" tamanho={17} />Falar</Btn>
                </div>
              </Card>
              {recentes.length > 0 && (
                <>
                  <Rot>Buscas recentes</Rot>
                  <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
                    {recentes.map((r, i) => {
                      const p = lista.find((x) => normal(x.nome) === normal(r.nome));
                      return (
                        <Link key={r.href} href={r.href} prefetch={false} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                          {p ? <Mini nome={p.nome} casa={p.casa} acorde={p.acorde} forma={p.forma} tampa={p.tampa} foto={p.imagem} oficial={Boolean(p.imagem)} w={46} h={52} /> : <span style={{ width: 46, height: 52, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)" }} />}
                          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                            <span style={{ fontSize: 15, fontWeight: 500 }}>{r.nome}</span>
                            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".08em", color: "var(--ink-3)" }}>{r.casa.toUpperCase()}</span>
                            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{r.sub}</span>
                          </div>
                          {r.tem ? <Icone nome="check" tamanho={18} /> : <span style={{ fontSize: 15, color: r.pct >= 85 ? OURO : "var(--ink-2)" }}>{r.pct}%</span>}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {aba === "notas" && (
        <>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
            {notas.map((n) => (
              <button key={n} type="button" onClick={() => setNotas(notas.filter((x) => x !== n))} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "3px 10px 3px 3px", borderRadius: "var(--r-ed)", background: "var(--chip)", border: "1px solid var(--line-2)", color: "var(--ink)", fontSize: 13 }}>
                <NotaChip nome={n} tam={26} rotulo={false} />{n}<span style={{ color: "var(--ink-3)" }}>×</span>
              </button>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); if (novaNota.trim()) addNota(novaNota); }} style={{ display: "inline-flex" }}>
              <input list="lista-notas" value={novaNota} onChange={(e) => { setNovaNota(e.target.value); if (todasNotas.includes(e.target.value)) addNota(e.target.value); }} placeholder="+ nota" aria-label="Adicionar nota" style={{ width: 110, height: 32, borderRadius: "var(--r-ctl)", border: "1px dashed var(--line-2)", background: "transparent", color: "var(--ink)", padding: "0 12px", fontSize: 12.5 }} />
              <datalist id="lista-notas">{todasNotas.map((n) => <option key={n} value={n} />)}</datalist>
            </form>
          </div>
          {!notas.length && (
            <Card pad={16} gap={10}>
              <span style={{ fontSize: 14, color: "var(--ink-2)" }}>Escolha uma ou mais notas para ver o que você tem e o que vale conhecer.</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Baunilha", "Tabaco", "Abacaxi", "Oud", "Lavanda", "Bergamota", "Couro", "Rosa"].filter((n) => todasNotas.includes(n)).map((n) => (
                  <button key={n} type="button" onClick={() => addNota(n)} style={{ background: "none", border: "none", padding: 0 }}><NotaChip nome={n} tam={24} fs={12.5} /></button>
                ))}
              </div>
            </Card>
          )}
          {notas.length > 0 && (
            <Card pad={16} gap={0}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><Rot>Você tem</Rot><span style={{ fontSize: 12, color: "var(--ink-3)" }}>{tenhoN.length} {tenhoN.length === 1 ? "perfume" : "perfumes"}</span></div>
              {tenhoN.map((p, i) => <LinhaP key={p.id} p={p} borda={i > 0} sub={notas.join(" e ").toUpperCase()} />)}
              {!tenhoN.length && <span style={{ fontSize: 13.5, color: "var(--ink-3)", padding: "6px 0" }}>Nenhum frasco seu tem {notas.length > 1 ? "essas notas juntas" : "essa nota"}.</span>}
            </Card>
          )}
          {notas.length > 0 && (
            <Card pad={16} gap={0}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><Rot>Para conhecer</Rot><span style={{ fontSize: 12, color: "var(--ink-3)" }}>por afinidade</span></div>
              {[...conhecerN, ...parciais].slice(0, 8).map((p, i) => <LinhaP key={p.id} p={p} borda={i > 0} dir={<span style={{ fontSize: 15, color: OURO }}>{p.pct}%</span>} sub={conhecerN.includes(p) ? (notas.length > 1 ? "as duas notas" : undefined) : notas.filter((n) => p.notas.includes(n)).join(", ").toLowerCase()} />)}
              {!conhecerN.length && !parciais.length && <span style={{ fontSize: 13.5, color: "var(--ink-3)", padding: "6px 0" }}>Nada fora da coleção com {notas.length > 1 ? "essas notas" : "essa nota"} no catálogo.</span>}
            </Card>
          )}
          {notas.length > 0 && listaAcervo(notas.length > 1 ? "No acervo, com essas notas" : "No acervo, com essa nota")}
        </>
      )}

      {aba === "marca" && (
        <Card pad={16} gap={0}>
          {casas.map(([c, ps], i) => (
            <div key={c} style={{ borderTop: i ? "1px solid var(--line)" : "none" }}>
              <button type="button" onClick={() => setCasa(casa === c ? "" : c)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 0", background: "none", border: "none", color: "var(--ink)", textAlign: "left" }}>
                <span style={{ flexGrow: 1, fontSize: 15 }}>{c}</span>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{ps.filter((p) => p.tem).length ? `${ps.filter((p) => p.tem).length} na coleção · ` : ""}{ps.length} no catálogo</span>
              </button>
              {casa === c && ps.map((p) => <LinhaP key={p.id} p={p} />)}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
