import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { garantirPerfume, linhaDoPerfume } from "@/lib/dados";
import type { Perfume } from "@/lib/tipos";

type Corpo = { perfume: Perfume; situacao?: string; anotacao?: string; minhaFixacao?: number | null; minhaProjecao?: number | null; minhaNota?: number | null };

/** Salva a edição da ficha e da sua entrada na coleção. */
/** A IA pode levar alguns segundos pesquisando. */
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const b = (await request.json()) as Corpo;
  if (!supabaseConfigurado()) return NextResponse.json({ erro: "O banco ainda não está ligado. Configure o Supabase para salvar." }, { status: 400 });
  const supabase = await createClient();
  const id = await garantirPerfume(supabase, b.perfume.id);
  if (!id) return NextResponse.json({ erro: "Perfume não encontrado." }, { status: 404 });
  const { error } = await supabase.from("perfumes").update(linhaDoPerfume({ ...b.perfume, revisar: [] })).eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  const sit = ["tenho", "tive", "quero", "assinatura"].includes(b.situacao ?? "") ? b.situacao : "tenho";
  if (sit === "assinatura") await supabase.from("colecao").update({ situacao: "tenho" }).eq("situacao", "assinatura").neq("perfume_id", id);
  const { error: e2 } = await supabase.from("colecao").upsert({ perfume_id: id, situacao: sit, anotacao: b.anotacao || null, minha_fixacao: b.minhaFixacao ?? null, minha_projecao: b.minhaProjecao ?? null, minha_nota: b.minhaNota ?? null }, { onConflict: "user_id,perfume_id" });
  if (e2) return NextResponse.json({ erro: e2.message }, { status: 500 });
  return NextResponse.json({ id });
}
