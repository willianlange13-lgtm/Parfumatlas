"use client";
type Resultado = { isFinal?: boolean; 0: { transcript: string } };
type SR = {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  onresult: (e: { resultIndex?: number; results: ArrayLike<Resultado> }) => void;
  onend: () => void; onerror: (e: { error?: string }) => void; onspeechend?: () => void;
  start: () => void; stop: () => void; abort: () => void;
};

export type Escuta = { parar: () => void };
export type OpcoesVoz = {
  /** texto final ouvido (uma frase) */
  aoOuvir: (texto: string) => void;
  /** texto parcial enquanto a pessoa fala (para mostrar na tela) */
  aoParcial?: (texto: string) => void;
  /** acabou de ouvir (com ou sem texto) */
  aoFim?: () => void;
  /** mensagem de erro já pronta para mostrar */
  aoErro?: (msg: string) => void;
};

const MSG: Record<string, string> = {
  "not-allowed": "O microfone está bloqueado para o Atlas. Libere o microfone nas permissões do navegador e toque de novo.",
  "service-not-allowed": "Este aparelho não deixa o app instalado usar o reconhecimento de voz. Gravando o áudio…",
  "no-speech": "Não ouvi nada. Toque no microfone e fale o nome do perfume.",
  "audio-capture": "Não achei o microfone deste aparelho.",
  network: "O reconhecimento de voz precisa de internet. Tente de novo.",
  aborted: "",
};

/**
 * Ouve uma frase em português e devolve o texto. Usa o reconhecimento de voz do navegador; aproveita o
 * texto parcial se a frase final não vier (acontece no iPhone) e para sozinho depois de alguns segundos.
 * Sem reconhecimento (Firefox, app instalado no iPhone), grava o áudio e manda transcrever (/api/transcrever).
 */
let atual: Escuta | null = null;
/** Para a escuta aberta (= "terminei de falar": entrega o que já foi ouvido). */
export function pararEscuta() { atual?.parar(); }

export function ouvir(o: OpcoesVoz): Escuta {
  atual = ouvirAgora(o);
  return atual;
}

function ouvirAgora(o: OpcoesVoz): Escuta {
  const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  const C = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  if (!C) return gravarETranscrever(o);

  let texto = "", entregue = false, terminou = false, trocouParaGravacao = false;
  let gravacao: Escuta | null = null;
  const r = new C();
  r.lang = "pt-BR";
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 1;
  const entregar = () => {
    if (entregue) return;
    entregue = true;
    const t = texto.trim();
    if (t) o.aoOuvir(t);
  };
  // segurança: se o navegador não encerrar sozinho, encerra e usa o que ouviu
  const limite = setTimeout(() => { try { r.stop(); } catch { /* já parou */ } }, 12000);
  r.onresult = (e) => {
    let t = "";
    for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
    texto = t;
    o.aoParcial?.(t);
    const ultimo = e.results[e.results.length - 1];
    if (ultimo?.isFinal) { entregar(); try { r.stop(); } catch { /* já parou */ } }
  };
  r.onerror = (e) => {
    const cod = e?.error ?? "";
    if (cod === "service-not-allowed" && !texto) {
      // app instalado no iPhone: grava o áudio no lugar do reconhecimento
      trocouParaGravacao = true;
      o.aoErro?.(MSG[cod]);
      gravacao = gravarETranscrever(o);
      return;
    }
    if (cod === "no-speech" && texto) return; // falou algo: o fim entrega
    const msg = MSG[cod] ?? (cod ? `O reconhecimento de voz falhou (${cod}). Tente de novo.` : "");
    if (msg) o.aoErro?.(msg);
  };
  r.onend = () => {
    if (terminou || trocouParaGravacao) return;
    terminou = true;
    clearTimeout(limite);
    entregar();
    o.aoFim?.();
  };
  try {
    r.start();
  } catch {
    // start fora de um toque (abertura automática) pode ser recusado: pede o toque
    clearTimeout(limite);
    o.aoErro?.("Toque no microfone para começar a falar.");
    o.aoFim?.();
  }
  return {
    parar: () => {
      if (gravacao) { gravacao.parar(); return; }
      // parar = "terminei de falar": o onend entrega o que foi ouvido
      try { r.stop(); } catch { /* já parou */ }
    },
  };
}

/** Grava até 8 s (ou até tocar de novo) e manda o áudio para a IA transcrever. */
function gravarETranscrever(o: OpcoesVoz): Escuta {
  let rec: MediaRecorder | null = null, parado = false;
  const parar = () => { parado = true; if (rec && rec.state === "recording") rec.stop(); };
  (async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      o.aoErro?.("Este navegador não grava áudio. No celular, use o Chrome ou o Safari.");
      o.aoFim?.();
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      o.aoErro?.(MSG["not-allowed"]);
      o.aoFim?.();
      return;
    }
    const tipo = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"].find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
    rec = tipo ? new MediaRecorder(stream, { mimeType: tipo }) : new MediaRecorder(stream);
    const partes: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) partes.push(e.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const audio = new Blob(partes, { type: rec?.mimeType || tipo || "audio/webm" });
      if (audio.size < 2000) { o.aoErro?.(MSG["no-speech"]); o.aoFim?.(); return; }
      o.aoParcial?.("Entendendo…");
      try {
        const base64 = await new Promise<string>((ok, erro) => { const f = new FileReader(); f.onload = () => ok(String(f.result).split(",")[1] ?? ""); f.onerror = erro; f.readAsDataURL(audio); });
        const r = await fetch("/api/transcrever", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mime: audio.type.split(";")[0], base64 }) });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.texto?.trim()) o.aoOuvir(j.texto.trim());
        else o.aoErro?.(j.erro ?? "Não entendi o áudio. Tente de novo falando o nome e a casa.");
      } catch {
        o.aoErro?.("Não consegui mandar o áudio. Tente de novo.");
      }
      o.aoFim?.();
    };
    rec.start();
    if (parado) rec.stop();
    else setTimeout(() => { if (rec?.state === "recording") rec.stop(); }, 8000);
  })();
  return { parar };
}

/** Compatível com as chamadas antigas: ouve uma frase e devolve o texto. */
export function ouvirUmaVez(ok: (texto: string) => void, fim?: () => void, erro?: (msg: string) => void): Escuta {
  return ouvir({ aoOuvir: ok, aoFim: fim, aoErro: erro ?? ((m) => { if (m && !/Gravando o áudio/.test(m)) alert(m); }) });
}

/** Reduz a foto para mandar à IA (lado maior com até `max` px, JPEG). */
export async function reduzirFoto(f: File, max = 1000) {
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.src = url;
  await img.decode();
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = img.width * k;
  c.height = img.height * k;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL("image/jpeg", 0.85);
  URL.revokeObjectURL(url);
  return { url: dataUrl, mime: "image/jpeg", base64: dataUrl.split(",")[1] };
}
