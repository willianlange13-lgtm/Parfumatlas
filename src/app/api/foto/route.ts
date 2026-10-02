import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";

/** Troca a foto do frasco de um perfume da coleção. */
/** A IA pode levar alguns segundos pesquisando. */
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const b = (await request.json()) as { perfume: string; foto: { mime: string; base64: string } };
  if (!supabaseConfigurado()) return NextResponse.json({ erro: "O banco ainda não está ligado. Configure o Supabase para salvar fotos." }, { status: 400 });
  if (!/^[0-9a-f-]{36}$/.test(b.perfume)) return NextResponse.json({ erro: "Este perfume é de demonstração." }, { status: 400 });
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.json({ erro: "Entre na sua conta." }, { status: 401 });
  const caminho = `${u.user.id}/${b.perfume}.jpg`;
  const up = await supabase.storage.from("frascos").upload(caminho, Buffer.from(b.foto.base64, "base64"), { contentType: b.foto.mime, upsert: true });
  if (up.error) return NextResponse.json({ erro: up.error.message }, { status: 500 });
  const { data: s } = await supabase.storage.from("frascos").createSignedUrl(caminho, 60 * 60 * 24 * 365 * 5);
  // a assinatura muda a cada upload, o que também evita a foto antiga no cache
  await supabase.from("colecao").update({ foto_url: s?.signedUrl ?? null }).eq("perfume_id", b.perfume);
  return NextResponse.json({ ok: true });
}
