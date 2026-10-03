import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { buscarEntrada, garantirPerfume, linhaDoPerfume } from "@/lib/dados";
import { buscarParecidos, parecidoDoLink } from "@/lib/ficha";
import { geminiConfigurado } from "@/lib/gemini";
import type { Perfume } from "@/lib/tipos";

/** Semelhantes de um perfume salvo: buscar (soma aos que já estão), remover um ou adicionar pelo link. */
export const maxDuration = 120;

const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export async function POST(request: NextRequest) {
  const b = (await request.json()) as { id: string; acao: "buscar" | "remover" | "adicionar"; nome?: string; link?: string };
  if (!supabaseConfigurado()) return NextResponse.json({ erro: "Banco não configurado." }, { status: 400 });
  const { perfume } = await buscarEntrada(b.id);
  if (!perfume) return NextResponse.json({ erro: "Perfume não encontrado." }, { status: 404 });
  const atuais = perfume.parecidos ?? [];
  let lista: NonNullable<Perfume["parecidos"]> = atuais;
  let novos = 0;
  if (b.acao === "remover") {
    lista = atuais.filter((x) => normal(x.nome) !== normal(b.nome ?? ""));
  } else if (b.acao === "adicionar") {
    const p = parecidoDoLink(b.link ?? "");
    if (!p) return NextResponse.json({ erro: "Cole o link da página do perfume no Fragrantica." }, { status: 400 });
    if (atuais.some((x) => normal(x.nome) === normal(p.nome))) return NextResponse.json({ erro: `${p.nome} já está na lista.` }, { status: 400 });
    lista = [...atuais, p];
    novos = 1;
  } else {
    if (!geminiConfigurado()) return NextResponse.json({ erro: "IA não configurada." }, { status: 400 });
    try {
      const achados = await buscarParecidos(perfume.nome, perfume.casa);
      const extra = achados.filter((x) => !atuais.some((a) => normal(a.nome) === normal(x.nome)));
      lista = [...atuais, ...extra].slice(0, 20);
      novos = extra.length;
    } catch (e) {
      return NextResponse.json({ erro: `A busca falhou: ${e instanceof Error ? e.message.slice(0, 120) : e}` }, { status: 500 });
    }
  }
  const supabase = await createClient();
  const id = await garantirPerfume(supabase, b.id);
  if (!id) return NextResponse.json({ erro: "Perfume não encontrado." }, { status: 404 });
  const { error } = await supabase.from("perfumes").update(linhaDoPerfume({ ...perfume, parecidos: lista })).eq("id", id);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ n: lista.length, novos });
}
