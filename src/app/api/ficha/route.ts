import { NextResponse, type NextRequest } from "next/server";
import { gerarFicha } from "@/lib/ficha";

/** A IA pode levar alguns segundos pesquisando. */
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const c = (await request.json()) as { nome: string; casa: string; concentracao?: string; link?: string };
  const f = await gerarFicha(c);
  if (!f) return NextResponse.json({ erro: "Não encontrei a ficha desse perfume. Confira o nome ou cole o link do Fragrantica." }, { status: 404 });
  return NextResponse.json(f);
}
