import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { buscarEntrada, garantirPerfume, linhaDoPerfume } from "@/lib/dados";
import type { Perfume } from "@/lib/tipos";
import { juntarCompletado } from "@/lib/completar-salvo";

type Corpo = { id: string } & Pick<Perfume, "parecidos" | "mesmaCasa" | "votos" | "fixacaoH" | "projecaoM" | "ano" | "concentracao" | "genero" | "descricao"> & Partial<Pick<Perfume, "pais" | "perfumistas" | "notas" | "acordes" | "acorde" | "familia" | "imagem">>;

/** Junta à ficha já salva o que chegou da segunda etapa (parecidos, mesma casa, votos). */
export async function POST(request: NextRequest) {
  const b = (await request.json()) as Corpo;
  if (!supabaseConfigurado()) return NextResponse.json({ erro: "Banco não configurado." }, { status: 400 });
  const { perfume } = await buscarEntrada(b.id);
  if (!perfume) return NextResponse.json({ erro: "Perfume não encontrado." }, { status: 404 });
  const supabase = await createClient();
  const id = await garantirPerfume(supabase, b.id);
  if (!id) return NextResponse.json({ erro: "Perfume não encontrado." }, { status: 404 });
  const novo: Perfume = juntarCompletado(perfume, b);

  const { error } = await supabase.from("perfumes").update(linhaDoPerfume(novo)).eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
