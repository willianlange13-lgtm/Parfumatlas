import { CelDNA } from "@/cel/CelDNA";
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
      <div className="so-celular">
        <CelDNA v={v} />
      </div>
    </>
  );
}
