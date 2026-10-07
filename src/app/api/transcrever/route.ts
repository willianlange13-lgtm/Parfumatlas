import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { geminiTexto, usaOpenAI } from "@/lib/gemini";

/**
 * Transcreve uma frase falada (quando o navegador não tem reconhecimento de voz, ex.: app instalado no iPhone).
 * OpenAI: endpoint de transcrição; Gemini: o áudio vai junto do pedido. Custa centavos por frase.
 */
export const maxDuration = 30;

const DICA = "Nome de perfume e da casa, em português ou inglês. Casas comuns: Lattafa, Armaf, Afnan, Al Haramain, Rasasi, Maison Alhambra, French Avenue, Ajmal, Swiss Arabian, Arabian Oud, Rayhaan, Paris Corner, Fragrance World, Khadlaj, Ard Al Zaafaran, Dior, Chanel, Creed.";

export async function POST(request: NextRequest) {
  if (supabaseConfigurado()) {
    const { data } = await (await createClient()).auth.getUser();
    if (!data.user) return NextResponse.json({ erro: "Entre no Atlas." }, { status: 401 });
  }
  const { mime, base64 } = (await request.json().catch(() => ({}))) as { mime?: string; base64?: string };
  if (!base64 || base64.length > 6_000_000) return NextResponse.json({ erro: "Áudio vazio ou longo demais." }, { status: 400 });
  const tipo = (mime || "audio/webm").split(";")[0];
  try {
    if (process.env.OPENAI_API_KEY && (usaOpenAI() || !process.env.GEMINI_API_KEY)) {
      const ext = tipo.includes("mp4") || tipo.includes("aac") ? "m4a" : tipo.includes("ogg") ? "ogg" : tipo.includes("wav") ? "wav" : "webm";
      for (const modelo of ["gpt-4o-mini-transcribe", "whisper-1"]) {
        const form = new FormData();
        form.append("file", new Blob([Buffer.from(base64, "base64")], { type: tipo }), `fala.${ext}`);
        form.append("model", modelo);
        form.append("language", "pt");
        form.append("prompt", DICA);
        const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form, signal: AbortSignal.timeout(25000) });
        if (r.ok) { const j = (await r.json()) as { text?: string }; return NextResponse.json({ texto: (j.text ?? "").trim() }); }
        console.error("[atlas:transcrever]", modelo, r.status, (await r.text()).slice(0, 200));
      }
      return NextResponse.json({ erro: "Não consegui transcrever o áudio agora." }, { status: 502 });
    }
    if (process.env.GEMINI_API_KEY) {
      const texto = await geminiTexto([{ text: `Transcreva exatamente o que a pessoa falou neste áudio, sem comentar. ${DICA} Responda só com a frase.` }, { inlineData: { mimeType: tipo, data: base64 } }], { temperatura: 0 });
      return NextResponse.json({ texto: texto.replace(/^["“]|["”]$/g, "").trim() });
    }
    return NextResponse.json({ erro: "A IA não está ligada (falta a chave na Vercel)." }, { status: 400 });
  } catch (e) {
    console.error("[atlas:transcrever]", e instanceof Error ? e.message : e);
    return NextResponse.json({ erro: "Não consegui transcrever o áudio agora." }, { status: 502 });
  }
}
