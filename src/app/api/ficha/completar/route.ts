import { NextResponse, type NextRequest } from "next/server";
import { completarFicha, type FichaIA } from "@/lib/ficha";
import { guardarNoAcervo } from "@/lib/acervo-global";

/** Segunda etapa da ficha: votos e parecidos, em segundo plano. */
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const f = (await request.json()) as FichaIA;
  try {
    const pronta = await completarFicha(f);
    // os votos da segunda etapa dão o nível mais votado ao perfume no acervo
    if (pronta.votos?.fixacao?.some((x) => x > 0)) await guardarNoAcervo(pronta);
    return NextResponse.json(pronta);
  } catch (e) {
    console.error("completar", e);
    return NextResponse.json({ ...f, completar: false, erroComplemento: true });
  }
}
