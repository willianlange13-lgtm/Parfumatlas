import { SoComputador } from "@/cel/SoComputador";
import { connection } from "next/server";
import DesDNA from "@/desenho/DesDNA";
import { montarDNA } from "@/montar/dna";

export const metadata = { title: "DNA olfativo" };

export default async function DNA() {
  await connection();
  const v = await montarDNA();
  return (
    <>
      <div className="so-computador">
        <DesDNA v={v} />
      </div>
      <SoComputador titulo="DNA olfativo" texto="O radar do seu gosto, a evolução da coleção e as lacunas ficam no site do computador, onde cabem os gráficos." />
    </>
  );
}
