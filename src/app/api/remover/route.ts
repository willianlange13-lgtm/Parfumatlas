import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";

/** Remove o perfume da coleção (apaga a entrada, os usos e a foto). A ficha do perfume continua no catálogo. */
export async function POST(request: NextRequest) {
  const f = await request.formData();
  const perfume = String(f.get("perfume") ?? "");
  if (!supabaseConfigurado()) return NextResponse.json({ erro: "O banco ainda não está ligado." }, { status: 400 });
  if (!/^[0-9a-f-]{36}$/.test(perfume)) return NextResponse.json({ erro: "Este perfume é de demonstração." }, { status: 400 });
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("colecao").delete().eq("perfume_id", perfume);
  if (u.user) await supabase.storage.from("frascos").remove([`${u.user.id}/${perfume}.jpg`]);
  return NextResponse.redirect(new URL("/colecao", request.url), 303);
}
