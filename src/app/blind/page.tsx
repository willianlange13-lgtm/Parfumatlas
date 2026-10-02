import { connection } from "next/server";
import { carregarAcervo } from "@/lib/dados";
import { naColecao, similaridade } from "@/lib/analise";
import { Blind } from "@/cel/Blind";

export const metadata = { title: "Blind test" };

export default async function BlindTest({ searchParams }: PageProps<"/blind">) {
  await connection();
  const sp = await searchParams;
  const acervo = await carregarAcervo();
  const meus = naColecao(acervo.colecao).map((e) => e.perfume);
  const a = meus.find((p) => p.id === sp.a) ?? acervo.perfumes.get(String(sp.a ?? "")) ?? meus[0];
  const parecidos = meus.filter((p) => p.id !== a?.id).map((p) => ({ p, s: a ? similaridade(a, p) : 0 })).sort((x, y) => y.s - x.s).slice(0, 2).map((x) => x.p);
  const lista = meus.map((p) => ({ id: p.id, nome: p.nome, casa: p.casa }));
  const ini = [a, ...parecidos].filter(Boolean).map((p) => p!.id);
  return <Blind lista={lista} inicial={ini} />;
}
