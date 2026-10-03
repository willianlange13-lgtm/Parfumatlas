import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { linhaDoPerfume } from "@/lib/dados";
import type { FichaIA } from "@/lib/ficha";

/** Salva a ficha (ou reaproveita a que já existe) e cria a entrada na coleção. */
/** A IA pode levar alguns segundos pesquisando. */
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const b = (await request.json()) as { ficha: FichaIA; situacao: string; anotacao?: string; minhaFixacao?: number | null; minhaProjecao?: number | null; foto?: { mime: string; base64: string } };
  if (!supabaseConfigurado()) return NextResponse.json({ erro: "O banco ainda não está ligado. Configure o Supabase para salvar." }, { status: 400 });
  const supabase = await createClient();
  const linha = linhaDoPerfume({ ...b.ficha, id: "" });
  const { data: p, error } = await supabase.from("perfumes").upsert(linha, { onConflict: "casa,nome,concentracao" }).select("id").single();
  if (error || !p) return NextResponse.json({ erro: error?.message ?? "Erro ao salvar a ficha" }, { status: 500 });

  let foto_url: string | null = null;
  if (b.foto) {
    const { data: u } = await supabase.auth.getUser();
    const caminho = `${u.user?.id}/${p.id}.jpg`;
    const bin = Buffer.from(b.foto.base64, "base64");
    const up = await supabase.storage.from("frascos").upload(caminho, bin, { contentType: b.foto.mime, upsert: true });
    if (!up.error) {
      const { data: s } = await supabase.storage.from("frascos").createSignedUrl(caminho, 60 * 60 * 24 * 365 * 5);
      foto_url = s?.signedUrl ?? null;
    }
  }
  const situacao = ["tenho", "tive", "quero", "assinatura"].includes(b.situacao) ? b.situacao : "tenho";
  if (situacao === "assinatura") await supabase.from("colecao").update({ situacao: "tenho" }).eq("situacao", "assinatura");
  const { data: c, error: e2 } = await supabase.from("colecao").upsert({ perfume_id: p.id, situacao, anotacao: b.anotacao || null, ...(b.minhaFixacao ? { minha_fixacao: b.minhaFixacao } : {}), ...(b.minhaProjecao ? { minha_projecao: b.minhaProjecao } : {}), ...(foto_url ? { foto_url } : {}) }, { onConflict: "user_id,perfume_id" }).select("numero").single();
  if (e2) return NextResponse.json({ erro: e2.message }, { status: 500 });
  return NextResponse.json({ id: p.id, numero: c?.numero });
}
