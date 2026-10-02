import { CadastroCliente } from "@/components/cliente/CadastroCliente";
import base from "@/data/desenho/CadastroPreto.json";

export const metadata = { title: "Adicionar perfume" };

export default async function Adicionar({ searchParams }: PageProps<"/adicionar">) {
  const sp = await searchParams;
  return (
    <CadastroCliente base={base as never} modoInicial={typeof sp.modo === "string" ? sp.modo : undefined} />
  );
}
