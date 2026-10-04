import { notFound } from "next/navigation";
import { connection } from "next/server";
import DesFicha from "@/desenho/DesFicha";
import { montarFicha } from "@/montar/ficha";
import { buscarEntrada } from "@/lib/dados";
import { obterClima } from "@/lib/clima";
import { graficoClima } from "@/lib/analise";
import { CelFicha } from "@/cel/CelFicha";
import { OpcoesPerfume } from "@/cel/OpcoesPerfume";
import Link from "next/link";

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
        <DesFicha v={v} acoes={p?.id ? (
          // editar e o menu (trocar foto, Tive, compartilhar, remover) também no computador
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--fonte, inherit)", letterSpacing: 0 }}>
            {p.fonteFicha && <span title="De onde veio a ficha" style={{ padding: "6px 12px", borderRadius: 14, border: `1px solid ${p.fonteFicha === "ia" ? "var(--ouro)" : "var(--line-2)"}`, color: p.fonteFicha === "ia" ? "var(--ouro)" : "var(--ink-2)", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".06em" }}>{p.fonteFicha === "ia" ? "FICHA POR IA" : "FICHA DO ACERVO"}</span>}
            <Link href={`/editar/${p.id}`} prefetch={false} className="c-btn sec" style={{ height: 36, borderRadius: 18, padding: "0 16px", fontSize: 13, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Editar</Link>
            <OpcoesPerfume id={p.id} nome={p.nome} casa={p.casa} entradaId={entrada?.id ?? null} situacao={entrada?.situacao ?? null} numero={entrada?.numero} />
          </span>
        ) : null} />
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

