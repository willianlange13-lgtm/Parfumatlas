import { connection } from "next/server";
import { montarColecao } from "@/montar/colecao";
import { ColecaoCliente } from "@/components/cliente/ColecaoCliente";

export const metadata = { title: "Coleção" };

export default async function Colecao() {
  await connection();
  const d = await montarColecao();
  return (
    <ColecaoCliente d={d} />
  );
}
