"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import DesSommelier from "@/desenho/DesSommelier";
import { CelSommelier, type VSom } from "@/cel/CelSommelier";

type Msg = Record<string, unknown> & { eu?: boolean; som?: boolean; texto: string; foto?: string | null };
type Base = Record<string, unknown> & { t: Record<string, string>; atalhos: { nome: string; d: string }[]; rapidas: string[]; filtros: { nome: string; opcoes: { nome: string }[] }[] };
type SR = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void; start: () => void; stop: () => void };

const CHAVE_FILTRO = ["ocasiao", "sentir", "origem"] as const;

export function SommelierCliente({ base, iniciais, perfumeId, pergunta, voz, conversaId: c0, falarRespostas = true }: { base: Base; iniciais: Msg[]; perfumeId?: string; pergunta?: string; voz?: boolean; conversaId?: string; falarRespostas?: boolean }) {
  const t = base.t;
  const [msgs, setMsgs] = useState<Msg[]>(iniciais);
  const [pensando, setPensando] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [conversaId, setConversaId] = useState<string | undefined>(c0);
  const [filtros, setFiltros] = useState<Record<string, string>>({ ocasiao: "", sentir: "", origem: "Minha coleção" });
  const rec = useRef<SR | null>(null);
  const enviado = useRef(false);

  const mandar = useCallback(async (texto: string, foto?: { mime: string; base64: string; url: string }, porVoz = false) => {
    if (!texto.trim() && !foto) return;
    const minha: Msg = { eu: true, som: false, texto: texto || "Vou com essa roupa. Qual deles combina mais?", foto: foto?.url ?? null, semFoto: false, soTexto: !foto };
    const historico = [...msgs.filter((m) => !m.demo), minha];
    setMsgs(historico);
    setPensando(true);
    try {
      const r = await fetch("/api/sommelier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagens: historico.map((m) => ({ papel: m.eu ? "eu" : "sommelier", texto: m.texto })), filtros, foto: foto ? { mime: foto.mime, base64: foto.base64 } : undefined, perfumeId, conversaId }),
      });
      const j = await r.json();
      setConversaId(j.conversaId ?? conversaId);
      setMsgs((m) => [...m, j.msg]);
      if ("speechSynthesis" in window && falarRespostas && (voz || porVoz)) {
        const u = new SpeechSynthesisUtterance(j.texto);
        u.lang = "pt-BR";
        window.speechSynthesis.speak(u);
      }
    } catch {
      setMsgs((m) => [...m, { som: true, eu: false, texto: "Não consegui responder agora. Tente de novo em instantes." }]);
    } finally {
      setPensando(false);
    }
  }, [msgs, filtros, perfumeId, conversaId, voz, falarRespostas]);

  const falar = useCallback(() => {
    const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const C = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!C) { alert("Este navegador não reconhece voz. No celular, use o Chrome ou o Safari."); return; }
    if (ouvindo) { rec.current?.stop(); return; }
    const r = new C();
    r.lang = "pt-BR";
    r.interimResults = false;
    r.onresult = (e) => { const txt = e.results[0][0].transcript; mandar(txt, undefined, true); };
    r.onend = () => setOuvindo(false);
    r.onerror = () => setOuvindo(false);
    rec.current = r;
    setOuvindo(true);
    r.start();
  }, [ouvindo, mandar]);

  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;
    setTimeout(() => (pergunta ? mandar(pergunta) : voz ? falar() : undefined), 0);
  }, [pergunta, voz, mandar, falar]);

  async function fotoEscolhida(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = Math.min(1, 900 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = img.width * k; c.height = img.height * k;
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.85);
    mandar("", { mime: "image/jpeg", base64: dataUrl.split(",")[1], url: dataUrl });
    e.target.value = "";
  }

  const v = {
    ...base,
    msgs,
    pensando,
    vazio: msgs.length === 0 && !pensando,
    demo: msgs.some((m) => m.demo),
    nova: () => { setMsgs([]); setConversaId(undefined); history.replaceState(null, "", "/sommelier"); },
    enviar: (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = e.currentTarget; const q = (f.elements.namedItem("q") as HTMLInputElement); mandar(q.value); q.value = ""; },
    fotoEscolhida,
    escolherFoto: () => document.getElementById("foto-look")?.click(),
    falar,
    vozRotulo: ouvindo ? "Parar de ouvir" : "Falar",
    atalhos: base.atalhos.map((a) => ({ ...a, pick: (e: React.MouseEvent) => { e.preventDefault(); if (a.nome === "Analisar meu look") document.getElementById("foto-look")?.click(); else mandar(a.nome); } })),
    rapidas: base.rapidas.map((q) => ({ t: q, pick: () => mandar(q) })),
    filtros: base.filtros.map((f, i) => ({
      nome: f.nome,
      opcoes: f.opcoes.map((o) => {
        const k = CHAVE_FILTRO[i];
        const on = filtros[k] === o.nome;
        return { nome: o.nome, bg: on ? t.btn : t.chip, cor: on ? t.onBtn : t.ink2, pick: () => setFiltros((x) => ({ ...x, [k]: x[k] === o.nome ? "" : o.nome })) };
      }),
    })),
  };
  return (
    <>
      <div className="so-computador"><DesSommelier v={v} /></div>
      <div className="so-celular"><CelSommelier v={v as unknown as VSom} /></div>
    </>
  );
}
