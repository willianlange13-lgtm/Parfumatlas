import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { buscarEntrada, garantirPerfume, linhaDoPerfume } from "@/lib/dados";
import { buscarParecidos } from "@/lib/ficha";
import { geminiConfigurado } from "@/lib/gemini";

/** Refaz a busca de parecidos de um perfume salvo, sem recadastrar. */
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const { id } = (await request.json()) as { id: string };
  if (!supabaseConfigurado() || !geminiConfigurado()) return NextResponse.json({ erro: "Banco ou IA não configurados." }, { status: 400 });
  const { perfume } = await buscarEntrada(id);
  if (!perfume) return NextResponse.json({ erro: "Perfume não encontrado." }, { status: 404 });
  try {
    const parecidos = await buscarParecidos(perfume.nome, perfume.casa);
    if (!parecidos.length) return NextResponse.json({ erro: "Não achei parecidos comparados diretamente com este perfume." }, { status: 404 });
    const supabase = await createClient();
    const idBanco = await garantirPerfume(supabase, id);
    if (!idBanco) return NextResponse.json({ erro: "Perfume não encontrado." }, { status: 404 });
    const { error } = await supabase.from("perfumes").update(linhaDoPerfume({ ...perfume, parecidos })).eq("id", idBanco);
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json({ n: parecidos.length });
  } catch (e) {
    return NextResponse.json({ erro: `A busca falhou: ${e instanceof Error ? e.message.slice(0, 160) : e}` }, { status: 500 });
  }
}
