import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";

/** Guarda a inscrição de avisos deste aparelho. */
export async function POST(request: NextRequest) {
  const sub = (await request.json()) as { endpoint?: string; keys?: Record<string, string> };
  if (!sub.endpoint || !sub.keys) return NextResponse.json({ erro: "Inscrição inválida" }, { status: 400 });
  if (!supabaseConfigurado()) return NextResponse.json({ erro: "O banco ainda não está ligado." }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.from("inscricoes_push").upsert({ endpoint: sub.endpoint, chaves: sub.keys }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
