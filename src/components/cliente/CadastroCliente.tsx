"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DesCadastro from "@/desenho/DesCadastro";
import { CelCadastro } from "@/cel/CelCadastro";
import { nota as refNota } from "@/data/referencia";
import { hexA } from "@/lib/cores";
import type { Perfume } from "@/lib/tipos";
import { CONCENTRACOES, GENEROS, NIVEIS_FIXACAO, NIVEIS_PROJECAO } from "@/lib/normalizar";
import { semFundo } from "@/lib/sem-fundo";
import { EditorAcordes, EditorNota, EditorQuando } from "@/cel/EditoresFicha";
import { seloBusca, seloFicha } from "@/lib/selo-fonte";
import { ouvir as ouvirVoz, pararEscuta } from "@/cel/voz";

type Modo = "foto" | "link" | "nome" | "voz";
type Cand = { nome: string; casa: string; concentracao: string; por: string; pct: number; link?: string; imagem?: string | null };
type Ficha = Omit<Perfume, "id" | "clima"> & { revisar: string[]; completar?: boolean; fragrantica?: string };

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
  // mesmo dourado do celular no acento e nos títulos (src/desenho/h2.ts)
  const t: Record<string, string> = { ...base.t, ouro: OURO, amber: "#D8B970", amberTxt: "#E0C78C" };
  const router = useRouter();
  const [modo, setModo] = useState<Modo>((["foto", "link", "nome", "voz"].includes(modoInicial ?? "") ? modoInicial : "foto") as Modo);
  const [foto, setFoto] = useState<{ url: string; mime: string; base64: string } | null>(null);
  const [lido, setLido] = useState<string[]>([]);
  const [cands, setCands] = useState<Cand[]>([]);
  const [sel, setSel] = useState<number>(-1);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [situacao, setSituacao] = useState("tenho");
  const [anotacao, setAnotacao] = useState("");
  const [minhaFixacao, setMinhaFixacao] = useState<number | null>(null);
  const [minhaProjecao, setMinhaProjecao] = useState<number | null>(null);
  const [minhaNota, setMinhaNota] = useState<number | null>(null);
  const [ocupado, setOcupado] = useState<"" | "lendo" | "ficha" | "salvando">("");
  const [ouvindo, setOuvindo] = useState(false);
  const [ouvido, setOuvido] = useState(""); // frase falada, procurada no efeito abaixo
  const [fala, setFala] = useState("");
  const [erro, setErro] = useState("");
  const [pesquisou, setPesquisou] = useState(false);
  const [buscaIA, setBuscaIA] = useState<boolean | null>(null);
  const [completando, setCompletando] = useState(false);
  const link = useRef<string | undefined>(undefined);
  const manualRef = useRef(false); // ficha feita à mão (sem pesquisa)
  const ultimaBusca = useRef("");
  const salvoId = useRef<string | null>(null); // ficha salva antes da segunda etapa terminar

  async function identificar(m: "foto" | "link" | "nome", texto?: string, f?: { mime: string; base64: string }, rapido = false): Promise<Cand[]> {
    let achados: Cand[] = [];
    setOcupado("lendo"); setErro(""); setFicha(null); setSel(-1); setPesquisou(false);
    link.current = m === "link" ? texto : undefined;
    if (m === "nome" && texto) ultimaBusca.current = texto;
    try {
      const r = await fetch("/api/identificar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modo: m, texto, foto: f, rapido }) });
      const j = await r.json();
      setLido(j.lido ?? []);
      setCands(j.candidatos ?? []);
      achados = j.candidatos ?? [];
      setBuscaIA(rapido ? null : Boolean(j.buscaIA));
      setPesquisou(!rapido);
      if (rapido) return achados; // enquanto digita: só mostra o catálogo, sem erro e sem escolher
      if (!j.candidatos?.length) setErro(j.ia === false ? "A IA ainda não está ligada (falta a chave do Gemini na Vercel). Sem ela, só acho os perfumes do catálogo de exemplo." : "Não encontrei esse perfume. Tente o nome completo com a casa, ou cole o link do Fragrantica.");
      // só segue direto quando veio de um link; por nome, voz ou foto a pessoa escolhe a opção
      else if (m === "link" && j.candidatos.length === 1) escolher(j.candidatos[0], 0);
    } catch {
      setErro("Não consegui identificar agora. Tente de novo.");
    } finally {
      setOcupado((o) => (o === "lendo" ? "" : o));
    }
    return achados;
  }

  async function escolher(c: Cand, i: number) {
    manualRef.current = false;
    setSel(i); setOcupado("ficha"); setErro("");
    try {
      const r = await fetch("/api/ficha", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: c.nome, casa: c.casa, concentracao: c.concentracao, link: c.link ?? link.current }), signal: AbortSignal.timeout(130000) });
      const j = await r.json().catch(() => ({ erro: "A pesquisa passou do tempo limite. Tente de novo." }));
      if (!r.ok) setErro(j.erro ?? "Não consegui montar a ficha.");
      else { setFicha(j); if (j.completar) completar(j); }
    } catch (e) {
      setErro(e instanceof Error && e.name === "TimeoutError" ? "A pesquisa demorou demais. Tente de novo ou cole o link do Fragrantica." : "Não consegui montar a ficha agora.");
    } finally {
      setOcupado("");
    }
  }

  // voz: procura o que foi falado e, se achar com segurança (ou só um), já monta a ficha
  useEffect(() => {
    if (!ouvido) return;
    const txt = ouvido;
    Promise.resolve().then(async () => {
      setOuvido("");
      const achados = await identificar("nome", txt);
      if (achados.length && (achados.length === 1 || achados[0].pct >= 85)) escolher(achados[0], 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvido]);

  const mexeu = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);
  const quando = (v?: Ficha["votos"]) => (v ? [v.estacoes, v.dia, v.noite] : null);
  /** Votos e parecidos em segundo plano: a ficha já aparece enquanto isso. */
  async function completar(base: Ficha) {
    setCompletando(true);
    try {
      const r = await fetch("/api/ficha/completar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(base), signal: AbortSignal.timeout(130000) });
      const j = (await r.json()) as Ficha;
      const falhou = (j as Ficha & { erroComplemento?: string | boolean }).erroComplemento;
      if (falhou) setErro(`A IA não conseguiu completar a ficha agora${typeof falhou === "string" ? ` (${falhou})` : ""}. Pode salvar assim; ao abrir a ficha depois, ela tenta de novo.`);
      else if (!j.votos?.nivelFixacao && !j.votos?.fixacao?.some((x) => x > 0)) setErro("A IA não achou fixação nem projeção desse perfume. Você pode marcar \"como fica em você\" ao lado.");
      // junta só o que a segunda busca traz, sem desfazer o que a pessoa já editou
      setFicha((f) => (f ? { ...f, ano: f.ano ?? j.ano, concentracao: f.concentracao || j.concentracao, genero: f.genero || j.genero, descricao: f.descricao || j.descricao,
        pais: f.pais || j.pais, familia: f.familia || j.familia,
        notas: { saida: f.notas.saida.length ? f.notas.saida : (j.notas?.saida ?? []), coracao: f.notas.coracao.length ? f.notas.coracao : (j.notas?.coracao ?? []), fundo: f.notas.fundo.length ? f.notas.fundo : (j.notas?.fundo ?? []) },
        // o que você mexeu enquanto a IA buscava fica como você deixou
        acordes: mexeu(f.acordes, base.acordes) || !j.acordes?.length ? f.acordes : j.acordes, acorde: mexeu(f.acordes, base.acordes) || !j.acordes?.length ? f.acorde : j.acorde, imagem: f.imagem ?? j.imagem, fragrantica: f.fragrantica ?? j.fragrantica, votos: j.votos ? (mexeu(quando(f.votos), quando(base.votos)) ? { ...j.votos, estacoes: f.votos!.estacoes, dia: f.votos!.dia, noite: f.votos!.noite, quandoEstimado: f.votos!.quandoEstimado } : j.votos) : f.votos, fixacaoH: j.fixacaoH ?? f.fixacaoH, projecaoM: j.projecaoM ?? f.projecaoM, parecidos: j.parecidos ?? f.parecidos, mesmaCasa: j.mesmaCasa ?? f.mesmaCasa, revisar: f.revisar.filter((x) => !["votos", "ano", "concentracao", "genero"].includes(x) || (j.revisar ?? []).includes(x)) } : f));
      // se a pessoa já salvou, leva o que chegou para a ficha salva
      if (salvoId.current) await fetch("/api/ficha/anexar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: salvoId.current, parecidos: j.parecidos, mesmaCasa: j.mesmaCasa, votos: j.votos, fixacaoH: j.fixacaoH, projecaoM: j.projecaoM, ano: j.ano, concentracao: j.concentracao, genero: j.genero, descricao: j.descricao, pais: j.pais, notas: j.notas, acordes: j.acordes, acorde: j.acorde, familia: j.familia, imagem: j.imagem }) }).then(() => router.refresh()).catch(() => {});
    } catch { /* fica com o que já tem */ } finally {
      setCompletando(false);
    }
  }

  /** Voz: ouve o nome, procura e, se achar com segurança (ou só um), já monta a ficha. Tocar de novo = "terminei de falar". */
  function ouvir() {
    if (ouvindo) { pararEscuta(); return; }
    setErro(""); setCands([]); setSel(-1); setFicha(null);
    setFala("Fale o nome e a casa do perfume…");
    setOuvindo(true);
    ouvirVoz({
      aoParcial: (t) => setFala(t === "Entendendo…" ? t : `“${t}”`),
      aoErro: (msg) => { if (/Gravando o áudio/.test(msg)) setFala("Gravando… fale o nome e a casa e toque para terminar."); else { setErro(msg); setFala(""); } },
      aoFim: () => setOuvindo(false),
      aoOuvir: (txt) => { setFala(`“${txt}”`); setOuvido(txt); },
    });
  }

  /** Adicionar sem pesquisa: ficha em branco com o nome digitado; você completa e salva (sem custo de IA). */
  function manual(texto?: string) {
    const campo = (document.querySelector('input[name="q"]') as HTMLInputElement | null)?.value;
    const q = (texto ?? campo ?? ultimaBusca.current ?? "").trim();
    manualRef.current = true;
    setCands([]); setSel(-1); setErro(""); setCompletando(false);
    setFicha({
      nome: /^https?:\/\//.test(q) ? "" : q, casa: "", concentracao: "", perfumistas: [], familia: "", acorde: "Amadeirado", genero: "", pais: "", descricao: "",
      notas: { saida: [], coracao: [], fundo: [] }, acordes: [], forma: "ret", tampa: "#141417", imagem: null, fonteFicha: null, revisar: ["nome", "casa"],
    });
  }

  async function salvar() {
    if (!ficha) return;
    if (!ficha.nome.trim() || !ficha.casa.trim()) { setErro("Preencha o nome e a casa do perfume."); return; }
    setOcupado("salvando"); setErro("");
    const r = await fetch("/api/salvar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ficha, situacao, anotacao, minhaFixacao, minhaProjecao, minhaNota, foto: foto ? { mime: foto.mime, base64: foto.base64 } : undefined }) });
    const j = await r.json();
    setOcupado("");
    if (!r.ok) setErro(j.erro ?? "Não consegui salvar.");
    else { salvoId.current = j.id; router.push(`/colecao/${j.id}`); /* tudo já se preenche no cadastro: não precisa passar pelo Editar */ }
  }

  const muda = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
  const campo = (l: string, v: string | undefined, opcoes?: readonly string[]) => { const r = rev(l) || !v; return { l, v: v || "a confirmar", st: r ? "REVISAR" : "✓", stCor: r ? OURO : t.ink3, borda: r ? OURO : t.line, mudar: muda(l), opcoes: opcoes ? [...opcoes] : undefined }; };
  const campos = ficha ? [campo("NOME", ficha.nome), campo("CASA", ficha.casa), campo("CONCENTRAÇÃO", ficha.concentracao, CONCENTRACOES), campo("ANO", ficha.ano ? String(ficha.ano) : ""), campo("FAMÍLIA", ficha.familia), campo("GÊNERO", ficha.genero, GENEROS), campo("PAÍS", ficha.pais)] : [];
  const checks = ficha ? [ficha.nome, ficha.casa, ficha.concentracao, ficha.ano, ficha.familia, ficha.genero, ficha.pais, ficha.descricao, ficha.notas.saida.length, ficha.notas.coracao.length, ficha.notas.fundo.length, ficha.acordes.length, ficha.fixacaoH, ficha.projecaoM, ficha.votos?.estacoes, ficha.votos?.dia, ficha.acorde] : [];
  const pend = campos.filter((c) => c.st === "REVISAR").length;
  const ok = Math.max(0, checks.filter(Boolean).length - pend);
  const tot = 20;
  const arco = (fr: number) => { const c = 42, r = 34, a0 = -Math.PI / 2, a1 = a0 + Math.max(0.01, fr) * 2 * Math.PI * 0.9999; return `M ${(c + Math.cos(a0) * r).toFixed(1)} ${(c + Math.sin(a0) * r).toFixed(1)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${(c + Math.cos(a1) * r).toFixed(1)} ${(c + Math.sin(a1) * r).toFixed(1)}`; };
  const seg = (n: number) => Array.from({ length: 5 }, (_, i) => (i < n ? t.amber : t.chip2));
  const nivelF = ficha?.votos?.fixacao?.some((x) => x > 0) ? ficha.votos.fixacao.indexOf(Math.max(...ficha.votos.fixacao)) : -1;
  const nivelP = ficha?.votos?.projecao?.some((x) => x > 0) ? ficha.votos.projecao.indexOf(Math.max(...ficha.votos.projecao)) : -1;
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
    candTxt: `${foto ? "candidatos encontrados pela foto, do mais provável ao menos" : "candidatos encontrados, do mais provável ao menos"}${seloBusca(buscaIA) ? ` · ${seloBusca(buscaIA)!.txt}` : ""}`,
    seloFicha: seloFicha(ficha),
    temCand: cands.length > 0,
    semCand: cands.length === 0,
    candVazio: ocupado === "lendo" ? "Procurando…" : "Tire uma foto do frasco, cole um link, digite o nome ou toque em Voz. Os candidatos aparecem aqui.",
    candidatos: cands.map((c, i) => {
      const s = i === sel, cor = CORES[i % 3];
      return { foto: semFundo(c.imagem), nome: c.nome, casaUp: c.casa.toUpperCase(), conc: c.concentracao || "—", por: c.por, pct: c.pct, corPct: s ? OURO : t.ink3, tampa: "#C9A227",
        vidro: `linear-gradient(115deg, rgba(255,255,255,.35) 0%, ${hexA(cor, 0.32)} 45%, ${hexA(cor, 0.6)} 100%)`, palco: `radial-gradient(ellipse at 50% 85%, ${hexA(cor, 0.3)} 0%, rgba(0,0,0,0) 70%)`,
        bg: s ? t.chip2 : "transparent", borda: s ? OURO : t.line, btn: s ? (ocupado === "ficha" ? "Montando ficha…" : "✓ É este") : "É este", btnBg: s ? t.btn : "transparent", btnCor: s ? t.onBtn : t.ink, btnBorda: s ? "none" : `1px solid ${t.line2}`, pick: () => escolher(c, i) };
    }),
    porNome: (e: React.MouseEvent) => { e.preventDefault(); setModo("nome"); (document.querySelector('input[name="q"]') as HTMLInputElement | null)?.focus(); },
    outraFoto: (e: React.MouseEvent) => { e.preventDefault(); document.getElementById("foto-frasco")?.click(); },
    temFicha: Boolean(ficha),
    campos,
    piramide: ficha ? ([["SAÍDA", "saida"], ["CORAÇÃO", "coracao"], ["FUNDO", "fundo"]] as const).map(([nome, k]) => ({ nome, notas: ficha.notas[k].map(notaChip), addNota: addNota(k) })) : [],
    desemp: ficha ? [
      { l: ficha.votos?.origem === "estimativa" ? "FIXAÇÃO · ESTIMATIVA" : ficha.votos?.estimado ? "FIXAÇÃO · ESTIMATIVA" : ficha.votos?.origem === "acervo" ? "FIXAÇÃO · ACERVO" : "FIXAÇÃO", seg: seg(nivelF >= 0 ? nivelF + 1 : NIVEL_F.indexOf(ficha.votos?.nivelFixacao ?? "") + 1), v: `${NIVEL_F[nivelF] ?? ficha.votos?.nivelFixacao ?? (completando ? "buscando…" : "—")}${ficha.fixacaoH ? ` · ${Math.floor(ficha.fixacaoH)}h${String(Math.round((ficha.fixacaoH % 1) * 60)).padStart(2, "0")}` : ""}` },
      { l: ficha.votos?.origem === "estimativa" ? "PROJEÇÃO · ESTIMATIVA" : ficha.votos?.estimado ? "PROJEÇÃO · ESTIMATIVA" : ficha.votos?.origem === "acervo" ? "PROJEÇÃO · ACERVO" : "PROJEÇÃO", seg: seg(Math.round((((nivelP >= 0 ? nivelP : NIVEL_P.indexOf(ficha.votos?.nivelProjecao ?? "")) + 1) / 4) * 5)), v: `${NIVEL_P[nivelP] ?? ficha.votos?.nivelProjecao ?? (completando ? "buscando…" : "—")}${ficha.projecaoM ? ` · ${ficha.projecaoM.toFixed(1).replace(".", ",")} m` : ""}` },
    ] : [],
    prog: { trilho: "M 8.0 42.0 a 34 34 0 1 0 68.0 0 a 34 34 0 1 0 -68.0 0 Z", arco: arco(ok / tot), pct: Math.round((ok / tot) * 100), ok, tot, rev: pend },
    fontes: [] as { nome: string; info: string; ic: string; bg: string }[], // "fontes lidas" saiu da ficha
    como: [["tenho", "Tenho"], ["quero", "Quero"], ["tive", "Tive"], ["assinatura", "★ Assinatura"]].map(([k, nome]) => ({ nome, bg: k === situacao ? t.btn : t.chip, cor: k === situacao ? t.onBtn : t.ink2, pick: () => setSituacao(k) })),
    mudarAnotacao: (e: React.ChangeEvent<HTMLInputElement>) => setAnotacao(e.target.value),
    // "como fica em você": toque de novo no mesmo nível para desmarcar
    minhas: ([["FIXAÇÃO NA SUA PELE", NIVEIS_FIXACAO.map((n) => `${n.nome} · ${n.faixa}`), minhaFixacao, setMinhaFixacao], ["PROJEÇÃO NA SUA PELE", NIVEIS_PROJECAO.map((n) => `${n.nome} · ${n.faixa}`), minhaProjecao, setMinhaProjecao]] as const).map(([titulo, nomes, val, set]) => ({
      titulo,
      niveis: nomes.map((nome, i) => ({ nome, bg: val && i < val ? t.amber : t.chip2, pick: () => set(val === i + 1 ? null : i + 1) })),
      txt: val ? nomes[val - 1] : "toque para marcar · senão vale a média da comunidade",
    })),
    salvar,
    manual: () => manual(),
    // acordes, quando usar e a sua nota no próprio cadastro (docs/DECISOES.md §24)
    editores: ficha ? (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, marginTop: 16, gridColumn: "1 / -1" }}>
        <EditorAcordes acordes={ficha.acordes} set={(l, pr) => setFicha((f) => (f ? { ...f, acordes: l, acorde: pr ?? f.acorde } : f))} aviso={completando ? "A IA ainda está buscando; o que chegar entra aqui." : undefined} />
        <EditorQuando votos={ficha.votos} estimado={ficha.votos?.quandoEstimado} set={(vv) => setFicha((f) => (f ? { ...f, votos: vv } : f))} />
      </div>
    ) : null,
    notaEditor: <EditorNota val={minhaNota} set={setMinhaNota} />,
    salvarTxt: ocupado === "salvando" ? "Salvando…" : "Salvar na coleção",
    erro,
  };
  const cel = {
    modo, setModo: (m: Modo) => { setModo(m); setErro(""); }, foto: foto?.url ?? null, lido, cands, sel, ficha, setFicha, situacao, setSituacao, anotacao, setAnotacao, minhaFixacao, setMinhaFixacao, minhaProjecao, setMinhaProjecao, minhaNota, setMinhaNota, ocupado, ouvindo, fala, erro,
    identificar, pesquisou, completando, escolher, manual, seloBusca: seloBusca(buscaIA), seloFicha: seloFicha(ficha), ouvir, salvar, fotoEscolhida: v.fotoEscolhida, campos, prog: v.prog, fontes: v.fontes, desemp: v.desemp,
    quando: ficha?.votos ? [["Inverno", ficha.votos.estacoes.inverno], ["Primavera", ficha.votos.estacoes.primavera], ["Verão", ficha.votos.estacoes.verao], ["Outono", ficha.votos.estacoes.outono], ["Dia", ficha.votos.dia], ["Noite", ficha.votos.noite]] as [string, number][] : [],
  };
  return (
    <>
      <div className="so-computador"><DesCadastro v={v} /></div>
      <div className="so-celular"><CelCadastro c={cel} modoInicial={modoInicial} /></div>
    </>
  );
}
