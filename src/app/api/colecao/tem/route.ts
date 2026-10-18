import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";

/** Diz se o usuário já tem (ou teve/quer) esse perfume na coleção, para avisar antes de adicionar de novo. */
export async function GET(request: NextRequest) {
  const nome = (request.nextUrl.searchParams.get("nome") ?? "").trim();
  const casa = (request.nextUrl.searchParams.get("casa") ?? "").trim();
  if (!nome || !casa || !supabaseConfigurado()) return NextResponse.json({ tem: false });
  try {
    const sb = await createClient();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return NextResponse.json({ tem: false });
    // acha a(s) ficha(s) com esse nome e casa (ignora acento/caixa via ilike)
    const { data: ps } = await sb.from("perfumes").select("id").ilike("nome", nome).ilike("casa", casa).limit(5);
    const ids = (ps ?? []).map((p) => p.id as string);
    if (!ids.length) return NextResponse.json({ tem: false });
    // a coleção já é filtrada pelo usuário (RLS); pega a entrada se existir
    const { data: c } = await sb.from("colecao").select("situacao, numero").in("perfume_id", ids).order("numero", { ascending: true }).limit(1).maybeSingle();
    if (!c) return NextResponse.json({ tem: false });
    return NextResponse.json({ tem: true, situacao: c.situacao, numero: c.numero });
  } catch {
    return NextResponse.json({ tem: false });
  }
}
