import { NextResponse, type NextRequest } from "next/server";
import { completarFicha, type FichaIA } from "@/lib/ficha";

/** Segunda etapa da ficha: votos e parecidos, em segundo plano. */
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const f = (await request.json()) as FichaIA;
  try {
    return NextResponse.json(await completarFicha(f));
  } catch (e) {
    console.error("completar", e);
    return NextResponse.json({ ...f, completar: false, erroComplemento: true });
  }
}
