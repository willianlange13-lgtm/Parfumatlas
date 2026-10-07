// Atlas Vivo: cada acorde tem um matiz próprio (dado, não enfeite); a papoula é o acento da interface.
export const OURO = "#FF6B3D";
export const ACORDES: Record<string, string> = {
  Frutado: "#FF8A5C",
  Amadeirado: "#B08E6A",
  Baunilha: "#EBCB98",
  Gourmand: "#C9946A",
  Especiado: "#D9663F",
  Âmbar: "#E0A04A",
  Oriental: "#C98B5A",
  Aquático: "#6FA9C4",
  Cítrico: "#F2D06B",
  Aromático: "#7FB59A",
  Floral: "#E58FA0",
  Couro: "#8C6B55",
  Verde: "#94B86E",
};
export const corDoAcorde = (a?: string | null) => (a && ACORDES[a]) || "#8AA094";
export function hexA(h: string, a: number) {
  return `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
}
