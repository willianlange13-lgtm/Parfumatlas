import Link from "next/link";
import { Btn, Card, Rot } from "./kit";

/** Telas de análise que ficam só no site do computador. */
export function SoComputador({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="so-celular c-tela" style={{ justifyContent: "center" }}>
      <Card fundo="destaque" pad={22}>
        <Rot>No computador</Rot>
        <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2 }}>{titulo}</div>
        <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>{texto}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn href="/" style={{ flexGrow: 1 }}>Voltar ao Início</Btn>
          <Link href="/colecao" className="c-btn sec" style={{ height: 46, borderRadius: "var(--r-ctl)" }}>Coleção</Link>
        </div>
      </Card>
    </div>
  );
}
