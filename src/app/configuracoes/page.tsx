import { connection } from "next/server";
import { supabaseConfigurado } from "@/lib/supabase/server";
import { obterConfig } from "@/lib/config";
import { carregarAcervo } from "@/lib/dados";
import { afinidade, classe } from "@/lib/analise";
import { Ajustes } from "@/cel/Ajustes";
import { sair } from "./sair";

export const metadata = { title: "Configurações" };

export default async function Configuracoes() {
  await connection();
  const cfg = await obterConfig();
  const acervo = await carregarAcervo();
  const c = classe(acervo.colecao);
  const pcts = acervo.lancamentos.map((l) => afinidade(l.perfume, acervo.colecao));
  return <Ajustes cfg={cfg} classe={c.nome} total={c.total} pcts={pcts} podeSalvar={supabaseConfigurado()} sair={sair} />;
}
