import { NextResponse, type NextRequest } from "next/server";
import { buscarNoAcervo, buscarNoAcervoPorNotas, fotoDoLink } from "@/lib/acervo-global";
import { notasPT } from "@/lib/normalizar";
import { semFundo } from "@/lib/sem-fundo";

/** Busca ao vivo no acervo, sem IA (aba Perfume enquanto digita e aba Notas). */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const notas = request.nextUrl.searchParams.getAll("nota").map((n) => n.trim()).filter(Boolean);
  const linhas = notas.length
    ? (await buscarNoAcervoPorNotas(notas, 16)).map((r) => ({ ...r, pct: 0 }))
    : q.length >= 2 ? await buscarNoAcervo(q, 8) : [];
  const itens = linhas.map((r) => ({
    nome: r.nome, casa: r.casa, pct: r.pct, link: r.fragrantica ?? undefined, imagem: semFundo(fotoDoLink(r.fragrantica)),
    notas: notasPT([...r.notas_saida, ...r.notas_coracao, ...r.notas_fundo]).slice(0, 6),
  }));
  return NextResponse.json({ itens }, { headers: { "Cache-Control": "private, max-age=60" } });
}
