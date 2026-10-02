import { notFound } from "next/navigation";
import { connection } from "next/server";
import { buscarEntrada } from "@/lib/dados";
import { supabaseConfigurado } from "@/lib/supabase/server";
import { Editar } from "@/cel/Editar";

export const metadata = { title: "Editar perfume" };

export default async function EditarPerfume({ params }: PageProps<"/editar/[id]">) {
  await connection();
  const { id } = await params;
  const { entrada, perfume } = await buscarEntrada(decodeURIComponent(id));
  if (!perfume) notFound();
  return (
    <Editar
      p={perfume}
      e={{ situacao: entrada?.situacao ?? "tenho", anotacao: entrada?.anotacao ?? "", foto: entrada?.foto ?? null, minhaFixacao: entrada?.minhaFixacao ?? null, minhaProjecao: entrada?.minhaProjecao ?? null, minhaNota: entrada?.minhaNota ?? null }}
      podeSalvar={supabaseConfigurado()}
    />
  );
}
