"use client";
type SR = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void; start: () => void; stop: () => void };

/** Abre o microfone, ouve uma frase em português e devolve o texto. */
export function ouvirUmaVez(ok: (texto: string) => void, fim?: () => void): SR | null {
  const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  const C = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  if (!C) {
    alert("Este navegador não reconhece voz. No celular, use o Chrome ou o Safari.");
    fim?.();
    return null;
  }
  const r = new C();
  r.lang = "pt-BR";
  r.interimResults = false;
  r.onresult = (e) => ok(e.results[0][0].transcript);
  r.onend = () => fim?.();
  r.onerror = () => fim?.();
  r.start();
  return r;
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
