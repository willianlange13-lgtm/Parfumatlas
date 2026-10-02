import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { garantirPerfume } from "@/lib/dados";

const VALIDAS = ["tenho", "tive", "quero", "assinatura"];

/** Muda a situação de um perfume na coleção (cria a entrada se ainda não existir). */
export async function POST(request: NextRequest) {
  const f = await request.formData();
  const perfume = String(f.get("perfume") ?? "");
  const situacao = String(f.get("situacao") ?? "");
  let destino = request.headers.get("referer") ?? `/colecao/${perfume}`;
  if (supabaseConfigurado() && perfume && VALIDAS.includes(situacao)) {
    const supabase = await createClient();
    const id = await garantirPerfume(supabase, perfume);
    if (id) {
      if (situacao === "assinatura") await supabase.from("colecao").update({ situacao: "tenho" }).eq("situacao", "assinatura");
      await supabase.from("colecao").upsert({ perfume_id: id, situacao }, { onConflict: "user_id,perfume_id" });
      // a ficha aberta pelo id do catálogo passa a usar o id do banco
      if (id !== perfume) destino = destino.replace(`/colecao/${perfume}`, `/colecao/${id}`);
    }
  }
  return NextResponse.redirect(new URL(destino, request.url), 303);
}
