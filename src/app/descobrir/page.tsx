import { SoComputador } from "@/cel/SoComputador";
import { connection } from "next/server";
import DesDescobrir from "@/desenho/DesDescobrir";
import { montarDescobrir } from "@/montar/descobrir";

export const metadata = { title: "Descobrir" };

export default async function Descobrir({ searchParams }: PageProps<"/descobrir">) {
  await connection();
  const sp = await searchParams;
  const v = await montarDescobrir(typeof sp.nota === "string" ? sp.nota : undefined);
  return (
    <>
      <div className="so-computador">
        <DesDescobrir v={v} />
      </div>
      <SoComputador titulo="Descobrir" texto="A escola de perfumes, a árvore das famílias, a linha do tempo e o mapa das casas ficam no site do computador." />
    </>
  );
}
