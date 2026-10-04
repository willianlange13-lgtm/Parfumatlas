import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { marcarLicao } from "@/lib/escola";

/** Escola do nariz: marca a lição da semana como feita (ou desfaz). */
export async function POST(request: NextRequest) {
  if (!supabaseConfigurado()) return NextResponse.json({ erro: "Banco não configurado." }, { status: 400 });
  const { semana, feita } = (await request.json()) as { semana?: string; feita?: boolean };
  if (!semana) return NextResponse.json({ erro: "Lição inválida." }, { status: 400 });
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return NextResponse.json({ erro: "Entre no Atlas." }, { status: 401 });
  return (await marcarLicao(sb, semana, Boolean(feita))) ? NextResponse.json({ ok: true }) : NextResponse.json({ erro: "Não consegui salvar." }, { status: 500 });
}
