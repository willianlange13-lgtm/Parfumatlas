import { connection } from "next/server";
import { montarSommelier } from "@/montar/sommelier";
import { obterConfig } from "@/lib/config";
import { SommelierCliente } from "@/components/cliente/SommelierCliente";

export const metadata = { title: "Sommelier" };

export default async function Sommelier({ searchParams }: PageProps<"/sommelier">) {
  await connection();
  const sp = await searchParams;
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const d = await montarSommelier(s("c"));
  const cfg = await obterConfig();
  const temPedido = Boolean(s("q") || s("voz"));
  return (
    <SommelierCliente base={d.base as never} iniciais={(temPedido ? [] : d.msgs) as never} perfumeId={s("perfume")} pergunta={s("q")} voz={s("voz") === "1"} conversaId={s("c")} falarRespostas={cfg.vozRespostas} />
  );
}
