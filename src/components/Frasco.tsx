import { hexA, corDoAcorde } from "@/lib/cores";

export type Forma = "alto" | "ret" | "redondo" | "largo";
const FORMAS: Record<Forma, [number, number, number, number]> = {
  alto: [54, 104, 9, 0.5],
  ret: [70, 86, 11, 0.48],
  redondo: [84, 78, 40, 0.4],
  largo: [92, 70, 12, 0.42],
};

type Props = { nome: string; casa: string; acorde?: string | null; forma?: Forma; tampa?: string; escala?: number };

/** Frasco desenhado, usado enquanto não há foto real do perfume. */
export function Frasco({ nome, casa, acorde, forma = "ret", tampa = "#141417", escala = 1 }: Props) {
  const cor = corDoAcorde(acorde);
  const [w, h, r, c] = FORMAS[forma];
  const k = escala;
  const curto = nome.length > 13 ? nome.split(" ").slice(0, 2).join(" ") : nome;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }} aria-hidden="true">
      <div style={{ width: w * c * k, height: 24 * k, borderRadius: 3, background: tampa, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)" }} />
      <div style={{ width: w * 0.22 * k, height: Math.max(3, 6 * k), background: "#8E99AD" }} />
      <div
        style={{
          width: w * k, height: h * k, borderRadius: r * k,
          background: `linear-gradient(115deg, rgba(255,255,255,.38) 0%, ${hexA(cor, 0.3)} 38%, ${hexA(cor, 0.55)} 100%)`,
          border: "1px solid var(--line-2)", boxShadow: "0 14px 26px rgba(0,0,0,.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span style={{ width: (w - 14) * k, height: Math.min(40 * k, h * 0.42 * k), borderRadius: "50%", background: "#F4F7FC", color: "#0A0A0C", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", lineHeight: 1.05 }}>
          <span style={{ fontSize: 6 * k, letterSpacing: ".14em" }}>{casa.split(" ")[0].toUpperCase().slice(0, 8)}</span>
          <span style={{ fontSize: 9 * k, fontWeight: 600 }}>{curto}</span>
        </span>
      </div>
    </div>
  );
}

/** Palco com o frasco ou a foto real. */
export function Palco({ altura = 200, foto, raio = 20, children, ...p }: Props & { altura?: number; foto?: string | null; raio?: number; children?: React.ReactNode }) {
  const cor = corDoAcorde(p.acorde);
  return (
    <div style={{ position: "relative", height: altura, borderRadius: raio, overflow: "hidden", border: "1px solid var(--line)", background: `radial-gradient(ellipse at 50% 85%, ${hexA(cor, 0.22)} 0%, ${hexA(cor, 0.06)} 55%, var(--surface) 100%)`, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: altura * 0.12, flexShrink: 0 }}>
      {children}
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt={p.nome} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Frasco {...p} />
      )}
    </div>
  );
}
