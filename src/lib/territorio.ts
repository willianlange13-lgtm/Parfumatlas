/**
 * Territórios olfativos (docs/DECISOES.md §18): a família do perfume "contamina" a interface com uma
 * atmosfera sutil. As cores entram como luz ambiente, brilhos, barras, bordas especiais e no DNA —
 * nunca como card inteiro pintado. Base preta continua sendo a marca.
 */
export type Territorio = { nome: string; a: string; b: string; glow: string };

const T: Record<string, Territorio> = {
  marinho: { nome: "mineral", a: "#5f8fa0", b: "#3f6f78", glow: "rgba(95,143,160,.16)" },        // cítrico, aquático, fresco
  verde: { nome: "verde frio", a: "#7f9d86", b: "#4f6f5c", glow: "rgba(127,157,134,.15)" },       // aromático
  floral: { nome: "rosa queimado", a: "#b98288", b: "#7a3a48", glow: "rgba(185,130,136,.15)" },   // floral
  frutal: { nome: "ameixa", a: "#c08a72", b: "#8a4a5a", glow: "rgba(192,138,114,.15)" },          // frutal
  ambar: { nome: "âmbar queimado", a: "#c58a4a", b: "#6a2a34", glow: "rgba(197,138,74,.16)" },    // oriental, âmbar
  gourmand: { nome: "resina", a: "#b98a5a", b: "#7a4a2e", glow: "rgba(185,138,90,.15)" },         // gourmand, baunilha, tabaco
  madeira: { nome: "castanho", a: "#a88462", b: "#3f5a48", glow: "rgba(168,132,98,.14)" },        // amadeirado
  chipre: { nome: "musgo", a: "#9a9a6a", b: "#5d6b4a", glow: "rgba(154,154,106,.14)" },           // chipre
  oud: { nome: "bronze", a: "#b08a52", b: "#2f4a3a", glow: "rgba(176,138,82,.16)" },              // oud
  neutro: { nome: "prata", a: "#c9d1de", b: "#d8b970", glow: "rgba(201,209,222,.10)" },
};

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Território a partir da família do Atlas e dos acordes (oud pesa mais que a família). */
export function territorio(familia?: string | null, acordes: { nome: string }[] = []): Territorio {
  const ac = acordes.slice(0, 3).map((a) => sem(a.nome)).join(" ");
  if (/\boud\b/.test(ac)) return T.oud;
  if (/tabaco|baunilha|cafe|mel|caramelo/.test(ac) && !/citric|aquatic/.test(ac.split(" ")[0] ?? "")) return T.gourmand;
  const f = sem(familia ?? "");
  if (/citric|aquat|marin|fresc/.test(f)) return T.marinho;
  if (/aromat/.test(f)) return T.verde;
  if (/floral/.test(f)) return T.floral;
  if (/frut/.test(f)) return T.frutal;
  if (/oriental|ambar/.test(f)) return T.ambar;
  if (/gourmand/.test(f)) return T.gourmand;
  if (/amadeir/.test(f)) return T.madeira;
  if (/chipre/.test(f)) return T.chipre;
  return T.neutro;
}

/** Variáveis CSS para pôr no contêiner da página: style={vars(territorio(...))}. */
export const varsTerritorio = (t: Territorio) => ({ "--terr-a": t.a, "--terr-b": t.b, "--terr-glow": t.glow }) as React.CSSProperties;
