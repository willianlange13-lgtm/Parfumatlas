// Prata em escala e ouro champanhe só para o item principal.
export const OURO = "#D8B970";
export const ACORDES: Record<string, string> = {
  Frutado: "#D8B970",
  Amadeirado: "#7F8AA0",
  Baunilha: "#A3ADBE",
  Gourmand: "#A3ADBE",
  Especiado: "#6E7A90",
  Âmbar: "#9099AC",
  Oriental: "#A3ADBE",
  Aquático: "#C9D1DE",
  Cítrico: "#DCECFD",
  Aromático: "#B4BDCC",
  Floral: "#8E99AD",
  Couro: "#6E7A90",
  Verde: "#B4BDCC",
};
export const corDoAcorde = (a?: string | null) => (a && ACORDES[a]) || "#9099AC";
export function hexA(h: string, a: number) {
  return `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
}
