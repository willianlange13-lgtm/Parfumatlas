import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { geminiTexto, usaOpenAI } from "@/lib/gemini";

/**
 * Transcreve uma frase falada (quando o navegador não tem reconhecimento de voz, ex.: app instalado no iPhone).
 * OpenAI: endpoint de transcrição; Gemini: o áudio vai junto do pedido. Custa centavos por frase.
 */
export const maxDuration = 30;

// dica curta: uma lista longa fazia o Whisper "ecoar" o próprio prompt quando o áudio saía sem fala clara
const DICA = "Perfumes e marcas (árabes e de grife).";

// quando o áudio é curto/sem fala, a IA às vezes devolve o próprio prompt ou ruído: isso não é transcrição
function valido(texto: string): string {
  const t = (texto ?? "").replace(/^["“]|["”]$/g, "").trim();
  const n = t.toLowerCase();
  if (!t || t.length < 2) return "";
  if (n.includes("perfumes e marcas") || n.includes("casas comuns") || n.startsWith("nome de perfume")) return "";
  return t;
}

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
        if (r.ok) {
          const j = (await r.json()) as { text?: string };
          const texto = valido(j.text ?? "");
          if (!texto) return NextResponse.json({ erro: "Não entendi. Toque no microfone e fale o nome e a casa." }, { status: 422 });
          return NextResponse.json({ texto });
        }
        console.error("[atlas:transcrever]", modelo, r.status, (await r.text()).slice(0, 200));
      }
      return NextResponse.json({ erro: "Não consegui transcrever o áudio agora." }, { status: 502 });
    }
    if (process.env.GEMINI_API_KEY) {
      const bruto = await geminiTexto([{ text: `Transcreva exatamente o que a pessoa falou neste áudio, sem comentar. ${DICA} Responda só com a frase.` }, { inlineData: { mimeType: tipo, data: base64 } }], { temperatura: 0 });
      const texto = valido(bruto);
      if (!texto) return NextResponse.json({ erro: "Não entendi. Toque no microfone e fale o nome e a casa." }, { status: 422 });
      return NextResponse.json({ texto });
    }
    return NextResponse.json({ erro: "A IA não está ligada (falta a chave na Vercel)." }, { status: 400 });
  } catch (e) {
    console.error("[atlas:transcrever]", e instanceof Error ? e.message : e);
    return NextResponse.json({ erro: "Não consegui transcrever o áudio agora." }, { status: 502 });
  }
}
