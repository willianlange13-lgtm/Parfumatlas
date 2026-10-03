"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DesCadastro from "@/desenho/DesCadastro";
import { CelCadastro } from "@/cel/CelCadastro";
import { nota as refNota } from "@/data/referencia";
import { hexA } from "@/lib/cores";
import type { Perfume } from "@/lib/tipos";

type Modo = "foto" | "link" | "nome" | "voz";
type Cand = { nome: string; casa: string; concentracao: string; por: string; pct: number; link?: string; imagem?: string | null };
type Ficha = Omit<Perfume, "id" | "clima"> & { revisar: string[] };
type SR = { lang: string; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void; start: () => void };

const OURO = "#D8B970";
const CORES = ["#7F8AA0", "#B4BDCC", "#9099AC"];
const ROT: Record<Modo, string> = { foto: "Foto", link: "Link", nome: "Nome", voz: "Voz" };
const PH: Record<Modo, string> = { foto: "Ou cole o link de qualquer site de perfume", link: "Cole o link do Fragrantica, Parfumo ou do site da marca", nome: "Digite o nome e a casa, ex.: Aventus Creed", voz: "Ou digite o nome do perfume" };
const NIVEL_F = ["Muito fraca", "Fraca", "Moderada", "Longa", "Eterna"];
const NIVEL_P = ["Íntima", "Moderada", "Forte", "Enorme"];

async function reduzir(f: File) {
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.src = url;
  await img.decode();
  const k = Math.min(1, 1000 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = img.width * k; c.height = img.height * k;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL("image/jpeg", 0.85);
  return { url: dataUrl, mime: "image/jpeg", base64: dataUrl.split(",")[1] };
}

export function CadastroCliente({ base, modoInicial }: { base: Record<string, unknown> & { t: Record<string, string> }; modoInicial?: string }) {
  const t: Record<string, string> = { ...base.t, ouro: OURO };
  const router = useRouter();
  const [modo, setModo] = useState<Modo>((["foto", "link", "nome", "voz"].includes(modoInicial ?? "") ? modoInicial : "foto") as Modo);
  const [foto, setFoto] = useState<{ url: string; mime: string; base64: string } | null>(null);
  const [lido, setLido] = useState<string[]>([]);
  const [cands, setCands] = useState<Cand[]>([]);
  const [sel, setSel] = useState<number>(-1);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [situacao, setSituacao] = useState("tenho");
  const [anotacao, setAnotacao] = useState("");
  const [ocupado, setOcupado] = useState<"" | "lendo" | "ficha" | "salvando">("");
  const [ouvindo, setOuvindo] = useState(false);
  const [fala, setFala] = useState("");
  const [erro, setErro] = useState("");
  const [pesquisou, setPesquisou] = useState(false);
  const link = useRef<string | undefined>(undefined);

  async function identificar(m: "foto" | "link" | "nome", texto?: string, f?: { mime: string; base64: string }, rapido = false) {
    setOcupado("lendo"); setErro(""); setFicha(null); setSel(-1); setPesquisou(false);
    link.current = m === "link" ? texto : undefined;
    try {
      const r = await fetch("/api/identificar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modo: m, texto, foto: f, rapido }) });
      const j = await r.json();
      setLido(j.lido ?? []);
      setCands(j.candidatos ?? []);
      setPesquisou(!rapido);
      if (rapido) return; // enquanto digita: só mostra o catálogo, sem erro e sem escolher
      if (!j.candidatos?.length) setErro(j.ia === false ? "A IA ainda não está ligada (falta a chave do Gemini na Vercel). Sem ela, só acho os perfumes do catálogo de exemplo." : "Não encontrei esse perfume. Tente o nome completo com a casa, ou cole o link do Fragrantica.");
      // só segue direto quando veio de um link; por nome, voz ou foto a pessoa escolhe a opção
      else if (m === "link" && j.candidatos.length === 1) escolher(j.candidatos[0], 0);
    } catch {
      setErro("Não consegui identificar agora. Tente de novo.");
    } finally {
      setOcupado((o) => (o === "lendo" ? "" : o));
    }
  }

  async function escolher(c: Cand, i: number) {
    setSel(i); setOcupado("ficha"); setErro("");
    try {
      const r = await fetch("/api/ficha", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: c.nome, casa: c.casa, concentracao: c.concentracao, link: c.link ?? link.current }) });
      const j = await r.json();
      if (!r.ok) setErro(j.erro ?? "Não consegui montar a ficha.");
      else setFicha(j);
    } catch {
      setErro("Não consegui montar a ficha agora.");
    } finally {
      setOcupado("");
    }
  }

  function ouvir() {
    const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const C = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!C) { setErro("Este navegador não reconhece voz. No celular, use o Chrome ou o Safari."); return; }
    const r = new C();
    r.lang = "pt-BR";
    r.onresult = (e) => { const txt = e.results[0][0].transcript; setFala(`“${txt}”`); identificar("nome", txt); };
    r.onend = () => setOuvindo(false);
    r.onerror = () => setOuvindo(false);
    setFala("Fale o nome e a casa do perfume…");
    setOuvindo(true);
    r.start();
  }

  async function salvar() {
    if (!ficha) return;
    setOcupado("salvando"); setErro("");
    const r = await fetch("/api/salvar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ficha, situacao, anotacao, foto: foto ? { mime: foto.mime, base64: foto.base64 } : undefined }) });
    const j = await r.json();
    setOcupado("");
    if (!r.ok) setErro(j.erro ?? "Não consegui salvar.");
    else router.push(`/colecao/${j.id}`);
  }

  const muda = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFicha((f) => {
      if (!f) return f;
      const n = { ...f, revisar: f.revisar.filter((r) => !r.toLowerCase().startsWith(k.slice(0, 4).toLowerCase())) };
      if (k === "NOME") n.nome = v; else if (k === "CASA") n.casa = v; else if (k === "CONCENTRAÇÃO") n.concentracao = v; else if (k === "ANO") n.ano = Number(v) || undefined;
      else if (k === "PERFUMISTA") n.perfumistas = v.split(/,| e /).map((x) => x.trim()).filter(Boolean); else if (k === "FAMÍLIA") n.familia = v; else if (k === "GÊNERO") n.genero = v; else if (k === "PAÍS") n.pais = v;
      return n;
    });
  };

  // ---------- dados para o desenho ----------
  const etapa = ficha ? 3 : cands.length ? 2 : 1;
  const passo = (n: number, nome: string) => {
    const feito = n < etapa, atual = n === etapa;
    return { n: feito ? "✓" : String(n), nome, bg: feito ? t.amber : atual ? OURO : "transparent", cor: feito ? t.onBtn : atual ? "#1A1407" : t.ink3, borda: feito ? t.amber : atual ? OURO : t.line2, txt: atual ? t.ink : feito ? t.ink2 : t.ink3, linha: n < 4 ? "block" : "none" };
  };
  const rev = (l: string) => Boolean(ficha?.revisar.some((r) => r.toLowerCase().slice(0, 4) === l.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").slice(0, 4) || r.toLowerCase().slice(0, 4) === l.toLowerCase().slice(0, 4)));
  const campo = (l: string, v: string | undefined) => { const r = rev(l) || !v; return { l, v: v || "a confirmar", st: r ? "REVISAR" : "✓", stCor: r ? OURO : t.ink3, borda: r ? OURO : t.line, mudar: muda(l) }; };
  const campos = ficha ? [campo("NOME", ficha.nome), campo("CASA", ficha.casa), campo("CONCENTRAÇÃO", ficha.concentracao), campo("ANO", ficha.ano ? String(ficha.ano) : ""), campo("PERFUMISTA", ficha.perfumistas.join(" e ")), campo("FAMÍLIA", ficha.familia), campo("GÊNERO", ficha.genero), campo("PAÍS", ficha.pais)] : [];
  const checks = ficha ? [ficha.nome, ficha.casa, ficha.concentracao, ficha.ano, ficha.perfumistas.length, ficha.familia, ficha.genero, ficha.pais, ficha.descricao, ficha.notas.saida.length, ficha.notas.coracao.length, ficha.notas.fundo.length, ficha.acordes.length, ficha.fixacaoH, ficha.projecaoM, ficha.votos?.estacoes, ficha.votos?.ocasioes?.length, ficha.votos?.dia, ficha.acorde, ficha.fontes?.length] : [];
  const pend = campos.filter((c) => c.st === "REVISAR").length;
  const ok = checks.filter(Boolean).length - pend;
  const tot = 20;
  const arco = (fr: number) => { const c = 42, r = 34, a0 = -Math.PI / 2, a1 = a0 + Math.max(0.01, fr) * 2 * Math.PI * 0.9999; return `M ${(c + Math.cos(a0) * r).toFixed(1)} ${(c + Math.sin(a0) * r).toFixed(1)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${(c + Math.cos(a1) * r).toFixed(1)} ${(c + Math.sin(a1) * r).toFixed(1)}`; };
  const seg = (n: number) => Array.from({ length: 5 }, (_, i) => (i < n ? t.amber : t.chip2));
  const nivelF = ficha?.votos ? ficha.votos.fixacao.indexOf(Math.max(...ficha.votos.fixacao)) : -1;
  const nivelP = ficha?.votos ? ficha.votos.projecao.indexOf(Math.max(...ficha.votos.projecao)) : -1;
  const addNota = (k: "saida" | "coracao" | "fundo") => () => { const n = prompt("Nome da nota"); if (n && ficha) setFicha({ ...ficha, notas: { ...ficha.notas, [k]: [...ficha.notas[k], n.trim()] } }); };
  const notaChip = (n: string) => { const r = refNota(n); return { nome: n, d: r.icone, cor: t.amber, bg: r.foto ? "#FFFFFF" : hexA(t.amber, 0.14), borda: hexA(t.amber, 0.45), img: r.foto ?? "", semImg: !r.foto }; };

  const v = {
    ...base,
    t,
    passos: [passo(1, "Identificar"), passo(2, "Confirmar"), passo(3, "Revisar ficha"), passo(4, "Salvar")],
    metodos: (Object.keys(ROT) as Modo[]).map((m) => ({ nome: ROT[m], bg: m === modo ? t.btn : "transparent", cor: m === modo ? t.onBtn : t.ink2, pick: () => { setModo(m); setErro(""); if (m === "voz") ouvir(); if (m === "foto" && !foto) document.getElementById("foto-frasco")?.click(); } })),
    escolherFoto: () => { if (modo === "voz") ouvir(); else document.getElementById("foto-frasco")?.click(); },
    fotoEscolhida: async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = await reduzir(f); setFoto(r); setModo("foto"); identificar("foto", undefined, { mime: r.mime, base64: r.base64 }); e.target.value = ""; },
    foto: foto?.url ?? null,
    semFoto: !foto,
    ouvindo,
    falaTxt: fala,
    rotuloVisor: ocupado === "lendo" ? "LENDO…" : foto ? "SUA FOTO" : modo === "voz" ? "TOQUE PARA FALAR" : "TOQUE PARA FOTOGRAFAR",
    temLido: lido.length > 0,
    lido,
    identificar: (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim(); if (!q) return; identificar(/^https?:\/\//.test(q) ? "link" : "nome", q); },
    placeholder: PH[modo],
    botaoBusca: ocupado === "lendo" ? "Buscando…" : "Buscar",
    candTxt: foto ? "candidatos encontrados pela foto, do mais provável ao menos" : "candidatos encontrados, do mais provável ao menos",
    temCand: cands.length > 0,
    semCand: cands.length === 0,
    candVazio: ocupado === "lendo" ? "Procurando…" : "Tire uma foto do frasco, cole um link, digite o nome ou toque em Voz. Os candidatos aparecem aqui.",
    candidatos: cands.map((c, i) => {
      const s = i === sel, cor = CORES[i % 3];
      return { nome: c.nome, casaUp: c.casa.toUpperCase(), conc: c.concentracao || "—", por: c.por, pct: c.pct, corPct: s ? OURO : t.ink3, tampa: "#C9A227",
        vidro: `linear-gradient(115deg, rgba(255,255,255,.35) 0%, ${hexA(cor, 0.32)} 45%, ${hexA(cor, 0.6)} 100%)`, palco: `radial-gradient(ellipse at 50% 85%, ${hexA(cor, 0.3)} 0%, rgba(0,0,0,0) 70%)`,
        bg: s ? t.chip2 : "transparent", borda: s ? OURO : t.line, btn: s ? (ocupado === "ficha" ? "Montando ficha…" : "✓ É este") : "É este", btnBg: s ? t.btn : "transparent", btnCor: s ? t.onBtn : t.ink, btnBorda: s ? "none" : `1px solid ${t.line2}`, pick: () => escolher(c, i) };
    }),
    porNome: (e: React.MouseEvent) => { e.preventDefault(); setModo("nome"); (document.querySelector('input[name="q"]') as HTMLInputElement | null)?.focus(); },
    outraFoto: (e: React.MouseEvent) => { e.preventDefault(); document.getElementById("foto-frasco")?.click(); },
    temFicha: Boolean(ficha),
    campos,
    piramide: ficha ? ([["SAÍDA", "saida"], ["CORAÇÃO", "coracao"], ["FUNDO", "fundo"]] as const).map(([nome, k]) => ({ nome, notas: ficha.notas[k].map(notaChip), addNota: addNota(k) })) : [],
    desemp: ficha ? [
      { l: "FIXAÇÃO", seg: seg(nivelF + 1), v: `${NIVEL_F[nivelF] ?? "—"}${ficha.fixacaoH ? ` · ${Math.floor(ficha.fixacaoH)}h${String(Math.round((ficha.fixacaoH % 1) * 60)).padStart(2, "0")}` : ""}` },
      { l: "PROJEÇÃO", seg: seg(Math.round(((nivelP + 1) / 4) * 5)), v: `${NIVEL_P[nivelP] ?? "—"}${ficha.projecaoM ? ` · ${ficha.projecaoM.toFixed(1).replace(".", ",")} m` : ""}` },
    ] : [],
    prog: { trilho: "M 8.0 42.0 a 34 34 0 1 0 68.0 0 a 34 34 0 1 0 -68.0 0 Z", arco: arco(ok / tot), pct: Math.round((ok / tot) * 100), ok, tot, rev: pend },
    fontes: (ficha?.fontes ?? []).map((f) => ({ nome: f.nome, info: f.oQue, ic: "✓", bg: t.amber })).concat(foto ? [{ nome: "Imagem do frasco", info: "salva no Atlas", ic: "✓", bg: t.amber }] : []),
    como: [["tenho", "Tenho"], ["quero", "Quero"], ["tive", "Tive"], ["assinatura", "★ Assinatura"]].map(([k, nome]) => ({ nome, bg: k === situacao ? t.btn : t.chip, cor: k === situacao ? t.onBtn : t.ink2, pick: () => setSituacao(k) })),
    mudarAnotacao: (e: React.ChangeEvent<HTMLInputElement>) => setAnotacao(e.target.value),
    salvar,
    salvarTxt: ocupado === "salvando" ? "Salvando…" : "Salvar na coleção",
    erro,
  };
  const cel = {
    modo, setModo: (m: Modo) => { setModo(m); setErro(""); }, foto: foto?.url ?? null, lido, cands, sel, ficha, setFicha, situacao, setSituacao, anotacao, setAnotacao, ocupado, ouvindo, fala, erro,
    identificar, pesquisou, escolher, ouvir, salvar, fotoEscolhida: v.fotoEscolhida, campos, prog: v.prog, fontes: v.fontes, desemp: v.desemp,
    quando: ficha?.votos ? [["Inverno", ficha.votos.estacoes.inverno], ["Primavera", ficha.votos.estacoes.primavera], ["Verão", ficha.votos.estacoes.verao], ["Outono", ficha.votos.estacoes.outono], ["Dia", ficha.votos.dia], ["Noite", ficha.votos.noite]] as [string, number][] : [],
  };
  return (
    <>
      <div className="so-computador"><DesCadastro v={v} /></div>
      <div className="so-celular"><CelCadastro c={cel} modoInicial={modoInicial} /></div>
    </>
  );
}
