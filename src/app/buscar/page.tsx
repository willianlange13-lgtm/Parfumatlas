import { connection } from "next/server";
import { carregarAcervo } from "@/lib/dados";
import { afinidade, naColecao } from "@/lib/analise";
import { CelBuscar, type ItemBusca } from "@/cel/CelBuscar";

export const metadata = { title: "Buscar" };

export default async function Buscar({ searchParams }: PageProps<"/buscar">) {
  await connection();
  const sp = await searchParams;
  const acervo = await carregarAcervo();
  const meus = new Set(naColecao(acervo.colecao).map((e) => e.perfumeId));
  const quero = new Set(acervo.colecao.filter((e) => e.situacao === "quero").map((e) => e.perfumeId));
  const lista: ItemBusca[] = [...acervo.perfumes.values()].map((p) => ({
    id: p.id, nome: p.nome, casa: p.casa, acorde: p.acorde, forma: p.forma, tampa: p.tampa, ano: p.ano ?? null,
    notas: [...p.notas.saida, ...p.notas.coracao, ...p.notas.fundo], tem: meus.has(p.id), quero: quero.has(p.id),
    pct: afinidade(p, acervo.colecao), inspiradoEm: p.inspiradoEm ? acervo.perfumes.get(p.inspiradoEm)?.nome ?? null : null,
  }));
  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <CelBuscar lista={lista} modoInicial={typeof sp.modo === "string" ? sp.modo : undefined} />
    </div>
  );
}
