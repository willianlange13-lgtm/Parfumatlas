import Link from "next/link";

const est = (cx: number, cy: number, cima: number, baixo: number, h: number) => {
  const k = 0.14;
  return `M${cx} ${cy - cima} Q${cx + h * k} ${cy - h * k} ${cx + h} ${cy} Q${cx + h * k} ${cy + h * k} ${cx} ${cy + baixo} Q${cx - h * k} ${cy + h * k} ${cx - h} ${cy} Q${cx - h * k} ${cy - h * k} ${cx} ${cy - cima} Z`;
};

/** Símbolo do Atlas: globo, órbita, agulha da bússola com estrelas e a gota em ouro. */
export function Logo({ tamanho = 40, traco = 1.2 }: { tamanho?: number; traco?: number }) {
  const id = `folga-${tamanho}`;
  const f = 1.15 + 1.6 * traco;
  return (
    <svg viewBox="0 0 100 120" style={{ width: (tamanho * 100) / 120, height: tamanho, flexShrink: 0 }} aria-hidden="true">
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="120">
          <rect width="100" height="120" fill="#fff" />
          <rect x={50 - f} width={2 * f} height="120" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${id})`} fill="none" stroke="#E6EBE7">
        <circle cx="50" cy="62" r="30" strokeWidth={1.15 * traco} />
        <ellipse cx="50" cy="62" rx="16.8" ry="21.6" strokeWidth={0.85 * traco} />
        <ellipse cx="50" cy="62" rx="40.5" ry="9" strokeWidth={traco} />
      </g>
      <rect x={50 - 0.6 * traco} y="20" width={1.2 * traco} height="80" fill="#E6EBE7" />
      <path d={est(50, 22, 13, 5, 5.6)} fill="#E6EBE7" />
      <path d={est(50, 99, 5, 12, 4.8)} fill="#E6EBE7" />
      <path d="M50 50 C53 55.5 54.6 58.6 54.6 61.6 a4.6 4.6 0 0 1 -9.2 0 C45.4 58.6 47 55.5 50 50 Z" fill="var(--ouro)" />
    </svg>
  );
}

/** Assinatura horizontal: símbolo + ATLAS + PARFUM. */
export function Marca({ tamanho = 44 }: { tamanho?: number }) {
  const atlas = tamanho * 0.42;
  return (
    <Link href="/" className="marca" aria-label="Parfum Atlas, início">
      <Logo tamanho={tamanho} traco={tamanho < 40 ? 1.9 : 1.6} />
      <span style={{ display: "flex", flexDirection: "column", gap: atlas * 0.22, lineHeight: 1, fontFamily: "var(--marca)" }}>
        <span style={{ fontSize: atlas, fontWeight: 400, letterSpacing: ".24em" }}>ATLAS</span>
        <span style={{ fontSize: atlas * 0.4, letterSpacing: ".5em", color: "var(--ouro)" }}>PARFUM</span>
      </span>
    </Link>
  );
}
