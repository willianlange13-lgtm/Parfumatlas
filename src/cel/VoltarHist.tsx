"use client";
import { useRouter } from "next/navigation";
import { Icone } from "@/components/Icone";

/** Voltar para a tela anterior (ou para o Início, se abriu direto). */
export function VoltarHist({ para = "/" }: { para?: string }) {
  const router = useRouter();
  return (
    <button type="button" className="c-circ" style={{ width: 36, height: 36 }} aria-label="Voltar" onClick={() => (history.length > 1 ? router.back() : router.push(para))}>
      <Icone nome="voltar" tamanho={18} />
    </button>
  );
}
