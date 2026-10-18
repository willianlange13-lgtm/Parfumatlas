import Link from "next/link";

/** Estrela de quatro pontas (rosa dos ventos), desenhada a partir do centro. */
const estrela = (cx: number, cy: number, r: number, g = 0.34) =>
  `M${cx} ${cy - r} Q${cx + r * g} ${cy - r * g} ${cx + r} ${cy} Q${cx + r * g} ${cy + r * g} ${cx} ${cy + r} Q${cx - r * g} ${cy + r * g} ${cx - r} ${cy} Q${cx - r * g} ${cy - r * g} ${cx} ${cy - r} Z`;

/**
 * Símbolo do Parfum Atlas: um medalhão cartográfico (globo com meridianos),
 * a rosa dos ventos ao norte e, no centro, a gota em ouro. Linhas finas, gota em destaque.
 */
export function Logo({ tamanho = 40, traco = 1.2 }: { tamanho?: number; traco?: number }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: tamanho, height: tamanho, flexShrink: 0 }} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        {/* medalhão */}
        <circle cx="50" cy="52" r="34" strokeWidth={1.3 * traco} />
        <circle cx="50" cy="52" r="29" strokeWidth={0.5 * traco} opacity="0.5" />
        {/* globo: equador e meridiano, finos para recuar */}
        <ellipse cx="50" cy="52" rx="29" ry="8" strokeWidth={0.75 * traco} opacity="0.7" />
        <ellipse cx="50" cy="52" rx="11" ry="29" strokeWidth={0.75 * traco} opacity="0.7" />
      </g>
      {/* rosa dos ventos ao norte + marcas cardeais, em ouro */}
      <path d={estrela(50, 11, 6.4)} fill="var(--ouro)" />
      <g fill="currentColor" opacity="0.6">
        <circle cx="84" cy="52" r={1.1 * traco} />
        <circle cx="16" cy="52" r={1.1 * traco} />
        <circle cx="50" cy="86" r={1.1 * traco} />
      </g>
      {/* gota de perfume, em ouro, o foco */}
      <path d="M50 38 C56 47 59 51.5 59 56.5 a9 9 0 0 1 -18 0 C41 51.5 44 47 50 38 Z" fill="var(--ouro)" />
      <path d="M47 52.5 a3 3 0 0 0 1.6 4.4" fill="none" stroke="var(--on-acento, #1a1408)" strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

/** Assinatura horizontal: símbolo + ATLAS + PARFUM. */
export function Marca({ tamanho = 44 }: { tamanho?: number }) {
  const atlas = tamanho * 0.42;
  return (
    <Link href="/" className="marca" aria-label="Parfum Atlas, início">
      <Logo tamanho={tamanho} traco={tamanho < 40 ? 1.7 : 1.4} />
      <span style={{ display: "flex", flexDirection: "column", gap: atlas * 0.22, lineHeight: 1, fontFamily: "var(--marca)" }}>
        <span style={{ fontSize: atlas, fontWeight: 500, letterSpacing: ".22em" }}>ATLAS</span>
        <span style={{ fontSize: atlas * 0.4, letterSpacing: ".5em", color: "var(--ouro)" }}>PARFUM</span>
      </span>
    </Link>
  );
}
