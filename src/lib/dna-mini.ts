/**
 * Mini DNA olfativo: a "impressão digital" do perfume em pequeno (docs/DECISOES.md §18).
 * Mesmo desenho do radar da ficha (acordes mais fortes, do topo no sentido horário), só que compacto,
 * para servir de assinatura em cards, comparação e Sommelier. viewBox 0 0 100 100.
 */
export type DnaMini = { forma: string; eixos: string; aro: string };

export function dnaMini(acordes: { nome: string; valor: number }[]): DnaMini | null {
  const base = acordes.length && acordes.every((a) => !a.valor) ? acordes.map((a, i) => ({ ...a, valor: Math.max(30, 100 - i * 12) })) : acordes;
  const ac = [...base].sort((a, b) => b.valor - a.valor).slice(0, 8);
  if (ac.length < 3) return null;
  const n = ac.length, c = 50, R = 44;
  const ang = (i: number) => (i * 2 * Math.PI) / n - Math.PI / 2;
  const p = (x: number) => x.toFixed(1);
  const pts = ac.map((a, i) => { const r = 8 + (Math.max(0, Math.min(100, a.valor)) / 100) * (R - 8); return [c + Math.cos(ang(i)) * r, c + Math.sin(ang(i)) * r]; });
  return {
    forma: "M " + pts.map((q) => `${p(q[0])} ${p(q[1])}`).join(" L ") + " Z",
    eixos: ac.map((_, i) => `M ${c} ${c} L ${p(c + Math.cos(ang(i)) * R)} ${p(c + Math.sin(ang(i)) * R)}`).join(" "),
    aro: `M ${c - R} ${c} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0 Z`,
  };
}
