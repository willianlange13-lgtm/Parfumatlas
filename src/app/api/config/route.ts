import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { COLUNA } from "@/lib/config";

/** Salva um ou mais campos das configurações. */
export async function POST(request: NextRequest) {
  const b = (await request.json()) as Record<string, unknown>;
  if (!supabaseConfigurado()) return NextResponse.json({ erro: "O banco ainda não está ligado. As mudanças valem só nesta tela." }, { status: 400 });
  const linha: Record<string, unknown> = {};
  Object.entries(b).forEach(([k, v]) => { if (COLUNA[k]) linha[COLUNA[k]] = v; });
  if (!Object.keys(linha).length) return NextResponse.json({ ok: true });
  const supabase = await createClient();
  const { error } = await supabase.from("configuracoes").upsert(linha, { onConflict: "user_id" });
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
