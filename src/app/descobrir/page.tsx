import { CelDescobrir } from "@/cel/CelDescobrir";
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
      <div className="so-celular">
        <CelDescobrir v={v} />
      </div>
    </>
  );
}
