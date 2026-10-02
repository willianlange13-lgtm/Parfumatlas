import { connection } from "next/server";
import DesInicio from "@/desenho/DesInicio";
import { montarInicio } from "@/montar/inicio";
import { CelInicio } from "@/cel/CelInicio";

export default async function Inicio({ searchParams }: PageProps<"/">) {
  await connection();
  const sp = await searchParams;
  const v = await montarInicio(Number(sp.outra ?? 0) || 0);
  return (
    <>
      <div className="so-computador">
        <DesInicio v={v} />
      </div>
      <div className="so-celular">
        <CelInicio v={v} usado={typeof sp.usado === "string" ? sp.usado : undefined} />
      </div>
    </>
  );
}
