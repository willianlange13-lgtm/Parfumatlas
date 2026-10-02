import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";

/** "Usar hoje": registra o uso do dia e volta para a página de onde veio. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const volta = request.headers.get("referer") ?? "/";
  if (id && supabaseConfigurado()) {
    const supabase = await createClient();
    await supabase.from("usos").upsert({ colecao_id: id }, { onConflict: "colecao_id,dia" });
  }
  const url = new URL(volta, request.url);
  url.searchParams.set("usado", id);
  return NextResponse.redirect(url, 303);
}
