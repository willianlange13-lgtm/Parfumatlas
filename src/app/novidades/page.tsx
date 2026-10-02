import { connection } from "next/server";
import DesLancamentos from "@/desenho/DesLancamentos";
import { montarLancamentos } from "@/montar/lancamentos";
import { obterConfig } from "@/lib/config";
import { CelNovidades } from "@/cel/CelNovidades";

export const metadata = { title: "Lançamentos" };

export default async function Novidades({ searchParams }: PageProps<"/novidades">) {
  await connection();
  const sp = await searchParams;
  const cfg = await obterConfig();
  const v = await montarLancamentos(typeof sp.filtro === "string" ? sp.filtro : "voce", cfg.alertaAfinidade);
  return (
    <>
      <div className="so-computador">
        <DesLancamentos v={v} />
      </div>
      <div className="so-celular">
        <CelNovidades v={v} limite={cfg.alertaAfinidade} />
      </div>
    </>
  );
}
