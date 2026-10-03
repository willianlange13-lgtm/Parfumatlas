import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { buscarEntrada, garantirPerfume, linhaDoPerfume, perfumeDaLinha } from "@/lib/dados";
import { parecidoDoLink } from "@/lib/ficha";
import { lerPesquisaFundo } from "@/lib/gemini";
import { fotoConferida } from "@/lib/fotos";
import { buscarSemelhantesGratis, chave, converter, iniciarBuscaSemelhantes, ordenar, reaproveitar, type Resultado } from "@/lib/semelhantes";
import type { Perfume } from "@/lib/tipos";

/**
 * Semelhantes de um perfume salvo.
 * Prioridade: reaproveitar DNA já pesquisado -> Gemini -> OpenAI premium explicitamente habilitada.
 */
export const maxDuration = 60;

type Corpo = { id: string; acao: "buscar" | "verificar" | "remover" | "adicionar"; nova?: boolean; nome?: string; link?: string };

const premiumOpenAI = () => process.env.AI_PREMIUM_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY);
const geminiGratis = () => Boolean(process.env.GEMINI_API_KEY);

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
      // 1) custo zero: reaproveita pesquisa pronta de outro perfume com o mesmo DNA/original.
      const dna = perfume.dnaOriginal ?? (atuais.find((x) => x.tipo === "inspirou") ? chave(atuais.find((x) => x.tipo === "inspirou")!.nome) : null);
      if (!b.nova && dna) {
        const { data } = await supabase.from("perfumes").select("*").eq("votos->>dnaOriginal", dna).neq("id", id).limit(1).maybeSingle();
        const outro = data ? perfumeDaLinha(data) : null;
        if (outro?.parecidos?.length) {
          const parecidos = reaproveitar(outro, perfume);
          await salvar({ ...perfume, parecidos, dnaOriginal: dna, buscaParecidos: null });
          return NextResponse.json({ estado: "pronta", reaproveitado: outro.nome, n: parecidos.length, provedor: "cache-dna" });
        }
      }

      // 2) padrão econômico: Gemini direto. Não passa pelo roteador que prioriza OpenAI.
      if (geminiGratis()) {
        const resultado = await buscarSemelhantesGratis(perfume);
        const { parecidos, dnaOriginal } = converter(resultado, perfume);
        await salvar({ ...perfume, parecidos, dnaOriginal: dnaOriginal ?? perfume.dnaOriginal ?? null, buscaParecidos: null });
        return NextResponse.json({ estado: "pronta", n: parecidos.length, provedor: "gemini" });
      }

      // 3) OpenAI só entra quando o dono habilita AI_PREMIUM_ENABLED=true.
      if (premiumOpenAI()) {
        const codigo = await iniciarBuscaSemelhantes(perfume);
        await salvar({ ...perfume, buscaParecidos: { id: codigo, inicio: Date.now() } });
        return NextResponse.json({ estado: "pendente", provedor: "openai-premium" });
      }

      return NextResponse.json({ erro: "Configure GEMINI_API_KEY para pesquisa econômica ou habilite AI_PREMIUM_ENABLED=true para usar OpenAI." }, { status: 400 });
    }

    // "verificar" só é necessário para a pesquisa premium em background.
    const busca = perfume.buscaParecidos;
    if (!busca) return NextResponse.json({ estado: "nada" });
    if (!premiumOpenAI()) {
      await salvar({ ...perfume, buscaParecidos: null });
      return NextResponse.json({ estado: "falhou", erro: "Pesquisa premium desativada." });
    }
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
    const { parecidos: brutos, dnaOriginal } = converter(r.dados, perfume);
    // Fotos conferidas: abre a página do Fragrantica de cada item quando possível.
    // Isso existe porque links/IDs inventados pelo modelo já fizeram o Atlas mostrar o frasco de outro perfume.
    const parecidos = await Promise.all(brutos.map(async (x) => (x.trecho === "adicionado por você" ? x : { ...x, imagem: (await fotoConferida(x.link, x.nome)) ?? (x.tipo === "inspirou" ? x.imagem ?? null : null) })));
    await salvar({ ...perfume, parecidos, dnaOriginal: dnaOriginal ?? perfume.dnaOriginal ?? null, buscaParecidos: null });
    return NextResponse.json({ estado: "pronta", n: parecidos.length, provedor: "openai-premium" });
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message.slice(0, 200) : "Não deu certo agora." }, { status: 500 });
  }
}
