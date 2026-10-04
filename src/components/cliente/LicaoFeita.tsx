"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Botão "Marcar como feita" da Escola do nariz. */
export function LicaoFeita({ semana, feita, cor, corFeita }: { semana: string; feita: boolean; cor: string; corFeita: string }) {
  const [ok, setOk] = useState(feita);
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();
  async function alternar() {
    setOcupado(true);
    const r = await fetch("/api/escola", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ semana, feita: !ok }) });
    if (r.ok) { setOk(!ok); router.refresh(); }
    setOcupado(false);
  }
  return (
    <button type="button" onClick={alternar} disabled={ocupado}
      style={{ alignSelf: "flex-start", marginTop: 4, padding: "7px 14px", borderRadius: "var(--r-ctl)", border: `1px solid ${ok ? corFeita : cor}`, background: "transparent", color: ok ? corFeita : cor, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
      {ocupado ? "…" : ok ? "✓ Feita · desfazer" : "Marcar como feita"}
    </button>
  );
}
