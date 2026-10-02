import { connection } from "next/server";
import { acharPerfume, veredito } from "@/lib/veredito";
import { CelResultado } from "@/cel/CelResultado";
import { Topo } from "@/cel/kit";
import { supabaseConfigurado } from "@/lib/supabase/server";

export const metadata = { title: "Vale a pena?" };

export default async function Resultado({ searchParams }: PageProps<"/buscar/resultado">) {
  await connection();
  const sp = await searchParams;
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const { p, novo } = await acharPerfume({ id: s("id"), nome: s("nome"), casa: s("casa"), conc: s("conc"), link: s("link") });
  if (!p) {
    return (
      <div className="c-tela sem-barra" style={{ maxWidth: 620, margin: "0 auto" }}>
        <Topo titulo="Resultado" voltar />
        <p style={{ color: "var(--ink-2)" }}>Não encontrei a ficha desse perfume. Volte e tente o nome completo com a casa, ou cole o link do Fragrantica.</p>
      </div>
    );
  }
  const v = await veredito(p);
  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <CelResultado p={p} v={v} novo={novo} podeSalvar={supabaseConfigurado()} />
    </div>
  );
}
