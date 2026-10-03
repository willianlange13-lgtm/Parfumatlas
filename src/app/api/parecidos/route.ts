import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { buscarEntrada, garantirPerfume, linhaDoPerfume, perfumeDaLinha } from "@/lib/dados";
import { parecidoDoLink } from "@/lib/ficha";
import { lerPesquisaFundo, usaOpenAI } from "@/lib/gemini";
import { chave, converter, iniciarBuscaSemelhantes, ordenar, reaproveitar, type Resultado } from "@/lib/semelhantes";
import type { Perfume } from "@/lib/tipos";

/**
 * Semelhantes de um perfume salvo.
 * buscar: reaproveita a lista de outro perfume com o mesmo original ou começa a pesquisa em segundo plano;
 * verificar: consulta a pesquisa e salva quando fica pronta; remover / adicionar: edição da pessoa.
 */
export const maxDuration = 60;

type Corpo = { id: string; acao: "buscar" | "verificar" | "remover" | "adicionar"; nova?: boolean; nome?: string; link?: string };

export async function POST(request: NextRequest) {
  const b = (await request.json()) as Corpo;
  if (!supabaseConfigurado()) return NextResponse.json({ erro: "Banco não configurado." }, { status: 400 });
  const { perfume } = await buscarEntrada(b.id);
  if (!perfume) return NextResponse.json({ erro: "Perfume não encontrado." }, { status: 404 });
  const supabase = await createClient();
  const id = await garantirPerfume(supabase, b.id);
  if (!id) return NextResponse.json({ erro: "Perfume não encontrado." }, { status: 404 });
  const salvar = async (p: Perfume) => {
    const { error } = await supabase.from("perfumes").update(linhaDoPerfume(p)).eq("id", id);
    if (error) throw new Error(error.message);
  };
  const atuais = perfume.parecidos ?? [];

  try {
    if (b.acao === "remover") {
      await salvar({ ...perfume, parecidos: atuais.filter((x) => chave(x.nome) !== chave(b.nome ?? "")) });
      return NextResponse.json({ estado: "pronta" });
    }

    if (b.acao === "adicionar") {
      const p = parecidoDoLink(b.link ?? "");
      if (!p) return NextResponse.json({ erro: "Cole o link da página do perfume no Fragrantica." }, { status: 400 });
      if (atuais.some((x) => chave(x.nome) === chave(p.nome))) return NextResponse.json({ erro: `${p.nome} já está na lista.` }, { status: 400 });
      await salvar({ ...perfume, parecidos: ordenar([...atuais, p]) });
      return NextResponse.json({ estado: "pronta" });
    }

    if (b.acao === "buscar") {
      if (!usaOpenAI()) return NextResponse.json({ erro: "A pesquisa de semelhantes usa o ChatGPT: configure a chave da OpenAI." }, { status: 400 });
      // 1) reaproveita: outro perfume com o mesmo original já foi pesquisado
      const dna = perfume.dnaOriginal ?? (atuais.find((x) => x.tipo === "inspirou") ? chave(atuais.find((x) => x.tipo === "inspirou")!.nome) : null);
      if (!b.nova && dna) {
        const { data } = await supabase.from("perfumes").select("*").eq("votos->>dnaOriginal", dna).neq("id", id).limit(1).maybeSingle();
        const outro = data ? perfumeDaLinha(data) : null;
        if (outro?.parecidos?.length) {
          await salvar({ ...perfume, parecidos: reaproveitar(outro, perfume), dnaOriginal: dna });
          return NextResponse.json({ estado: "pronta", reaproveitado: outro.nome });
        }
      }
      // 2) pesquisa nova, em segundo plano na OpenAI
      const codigo = await iniciarBuscaSemelhantes(perfume);
      await salvar({ ...perfume, buscaParecidos: { id: codigo, inicio: Date.now() } });
      return NextResponse.json({ estado: "pendente" });
    }

    // verificar
    const busca = perfume.buscaParecidos;
    if (!busca) return NextResponse.json({ estado: "nada" });
    if (Date.now() - busca.inicio > 20 * 60 * 1000) {
      await salvar({ ...perfume, buscaParecidos: null });
      return NextResponse.json({ estado: "falhou", erro: "A pesquisa passou de 20 minutos e foi cancelada." });
    }
    const r = await lerPesquisaFundo<Resultado>(busca.id);
    if (r.estado === "pendente") return NextResponse.json({ estado: "pendente" });
    if (r.estado === "falhou" || !r.dados) {
      await salvar({ ...perfume, buscaParecidos: null });
      return NextResponse.json({ estado: "falhou", erro: `A pesquisa falhou (${r.erro ?? "sem motivo"}).` });
    }
    const { parecidos, dnaOriginal } = converter(r.dados, perfume);
    await salvar({ ...perfume, parecidos, dnaOriginal: dnaOriginal ?? perfume.dnaOriginal ?? null, buscaParecidos: null });
    return NextResponse.json({ estado: "pronta", n: parecidos.length });
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message.slice(0, 200) : "Não deu certo agora." }, { status: 500 });
  }
}
