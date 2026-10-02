import { notFound } from "next/navigation";
import { connection } from "next/server";
import DesFicha from "@/desenho/DesFicha";
import { montarFicha } from "@/montar/ficha";
import { buscarEntrada } from "@/lib/dados";
import { obterClima } from "@/lib/clima";
import { graficoClima } from "@/lib/analise";
import { CelFicha } from "@/cel/CelFicha";

export default async function Ficha({ params }: PageProps<"/colecao/[id]">) {
  await connection();
  const { id } = await params;
  const v = await montarFicha(decodeURIComponent(id));
  if (!v) notFound();
  const { entrada, perfume: p } = await buscarEntrada(decodeURIComponent(id));
  const clima = await obterClima();
  const g = graficoClima(p!);
  const hoje = g.pts.length ? { cidade: clima.cidade, temp: clima.agora.temp, horas: `${Math.round(g.estimar(clima.agora.temp))} horas` } : null;
  return (
    <>
      <div className="so-computador">
        <DesFicha v={v} />
      </div>
      <div className="so-celular">
        <CelFicha v={v} x={{ p: p!, entradaId: entrada?.id ?? null, numero: entrada?.numero, situacao: entrada?.situacao ?? null, foto: entrada?.foto ?? null, hoje }} />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: PageProps<"/colecao/[id]">) {
  const { id } = await params;
  const { perfume } = await buscarEntrada(decodeURIComponent(id));
  return { title: perfume ? `${perfume.nome} · ${perfume.casa}` : "Perfume" };
}

