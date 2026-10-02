import { NextResponse, type NextRequest } from "next/server";
import { gerarFicha, ultimoErroFicha } from "@/lib/ficha";

/** A IA pode levar alguns segundos pesquisando. */
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const c = (await request.json()) as { nome: string; casa: string; concentracao?: string; link?: string };
  const f = await gerarFicha(c);
  if (!f) {
    const cota = ultimoErroFicha.includes("429");
    const ocupado = ultimoErroFicha.includes("503");
    const msg = cota
      ? "A cota gratuita da IA do Google acabou por agora. Tente de novo em alguns minutos ou ative o faturamento no Google AI Studio."
      : ocupado
        ? "A IA do Google está sobrecarregada neste momento. Tente de novo em um minuto."
        : `Não consegui montar a ficha desse perfume.${ultimoErroFicha ? ` Detalhe: ${ultimoErroFicha}` : " Confira o nome ou cole o link do Fragrantica."}`;
    return NextResponse.json({ erro: msg }, { status: 404 });
  }
  return NextResponse.json(f);
}
