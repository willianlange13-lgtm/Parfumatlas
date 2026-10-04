/**
 * Relevância das casas no mundo da perfumaria (tabela fixa: não gasta IA).
 * 1 = grifes e nicho · 2 = casas árabes e de contratipos consolidadas · 3 = casas menores (fora do radar).
 */
const NIVEL_1 = [
  "louis vuitton", "dior", "christian dior", "chanel", "creed", "tom ford", "guerlain", "hermes", "yves saint laurent", "ysl", "giorgio armani", "armani",
  "prada", "versace", "dolce gabbana", "dolce & gabbana", "givenchy", "jean paul gaultier", "paco rabanne", "rabanne", "carolina herrera", "valentino", "burberry",
  "montblanc", "azzaro", "hugo boss", "boss", "calvin klein", "bvlgari", "bulgari", "cartier", "gucci", "lancome", "mugler", "kenzo", "issey miyake", "davidoff",
  "parfums de marly", "maison francis kurkdjian", "mfk", "initio", "xerjoff", "amouage", "roja", "roja parfums", "byredo", "le labo", "kilian", "by kilian",
  "nishane", "frederic malle", "diptyque", "jo malone", "acqua di parma", "penhaligons", "penhaligon's", "memo paris", "mancera", "montale", "zara",
  "o boticario", "boticario", "natura", "eudora",
];
const NIVEL_2 = [
  "al haramain", "afnan", "lattafa", "lattafa perfumes", "armaf", "rasasi", "french avenue", "fragrance world", "maison alhambra", "alhambra", "rayhaan",
  "ajmal", "swiss arabian", "arabian oud", "nabeel", "khadlaj", "paris corner", "zimaya", "maison asrar", "orientica", "emper", "riiffs", "al wataniah",
  "jo milano", "jo milano paris", "gulf orchid", "le chameau", "ard al zaafaran", "fragrance du bois", "bharara",
];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9& ']+/g, " ").replace(/\s+/g, " ").trim();
const tem = (lista: string[], casa: string) => { const c = norm(casa); return lista.some((x) => c === x || c.startsWith(x + " ")); };

export function nivelCasa(casa: string): 1 | 2 | 3 {
  if (tem(NIVEL_1, casa)) return 1;
  if (tem(NIVEL_2, casa)) return 2;
  return 3;
}

/** Bônus de desempate pela relevância da casa (até ~5 pontos). */
export const bonusCasa = (casa: string) => ({ 1: 5, 2: 3, 3: 0 })[nivelCasa(casa)];

/**
 * Origem das casas (para a trava dos semelhantes: só brasileiras, americanas e árabes).
 * Casa fora da tabela usa o país que a pesquisa informar.
 */
const ARABES = [
  "al haramain", "afnan", "lattafa", "armaf", "rasasi", "french avenue", "fragrance world", "maison alhambra", "alhambra", "rayhaan", "ajmal",
  "swiss arabian", "arabian oud", "nabeel", "khadlaj", "paris corner", "zimaya", "maison asrar", "orientica", "emper", "riiffs", "al wataniah",
  "jo milano", "gulf orchid", "le chameau", "ard al zaafaran", "fragrance du bois", "bidaya", "bidaya parfums", "al absar", "atralia", "ahmed al maghribi",
  "bujairami", "fakhar", "khalis", "asdaaf", "anfas", "al rehab", "surrati", "abdul samad al qurashi", "amouage", "dumont", "dumont paris",
  "fa paris", "pendora", "pendora scents", "milestone", "the woods collection", "camara", "al majed", "hamidi", "ibraheem al qurashi",
];
const BRASILEIRAS = ["o boticario", "boticario", "natura", "eudora", "thera", "thera cosmeticos", "mahogany", "jequiti", "phytoderm", "il profumo", "la rive", "lacqua di fiori", "ciclo", "ciclo cosmeticos", "granado", "phebo", "quem disse berenice", "vult", "wepink", "we pink", "boca rosa", "o boticário"];
const AMERICANAS = [
  "montagne", "montagne parfums", "alt", "alt fragrances", "dossier", "oakcha", "tom ford", "calvin klein", "michael kors", "ralph lauren", "estee lauder",
  "clinique", "coach", "vince camuto", "victoria's secret", "victorias secret", "bath & body works", "bath and body works", "abercrombie & fitch",
  "abercrombie", "hollister", "american eagle", "tommy hilfiger", "kenneth cole", "perry ellis", "nautica", "john varvatos", "donna karan", "dkny",
  "le labo", "imaginary authors", "d s & durga", "ds & durga", "commodity", "phlur", "glossier", "kayali", "billie eilish", "ariana grande", "elizabeth arden",
  "pacific scents", "scentbird", "dua", "dua fragrances",
];
const EUROPEIAS = ["louis vuitton", "dior", "chanel", "creed", "guerlain", "hermes", "yves saint laurent", "prada", "versace", "givenchy", "jean paul gaultier", "paco rabanne", "rabanne", "carolina herrera", "valentino", "burberry", "montblanc", "azzaro", "hugo boss", "bvlgari", "cartier", "gucci", "lancome", "mugler", "kenzo", "issey miyake", "davidoff", "parfums de marly", "maison francis kurkdjian", "initio", "xerjoff", "roja", "byredo", "kilian", "nishane", "frederic malle", "diptyque", "jo malone", "acqua di parma", "penhaligons", "memo paris", "mancera", "montale", "zara", "dolce gabbana", "giorgio armani", "armani"];

export type Origem = "arabe" | "brasileira" | "americana" | "outra" | "desconhecida";

/** Origem pela tabela; se a casa não estiver nela, pelo país informado. */
export function origemCasa(casa: string, pais?: string | null): Origem {
  if (tem(ARABES, casa)) return "arabe";
  if (tem(BRASILEIRAS, casa)) return "brasileira";
  if (tem(AMERICANAS, casa)) return "americana";
  if (tem(EUROPEIAS, casa)) return "outra";
  const p = norm(pais ?? "");
  if (!p) return "desconhecida";
  if (/emirados|uae|united arab|dubai|arabia|saudi|kuwait|catar|qatar|oma|oman|bahrein|bahrain|jordania|jordan|libano|lebanon/.test(p)) return "arabe";
  if (/brasil|brazil/.test(p)) return "brasileira";
  if (/estados unidos|eua|usa|united states|america/.test(p)) return "americana";
  return "outra";
}

/** País da casa, só das que temos certeza (o resto fica para revisar). */
const PAIS_CASA: [string[], string][] = [
  [["lattafa", "maison alhambra", "alhambra", "rayhaan", "afnan", "armaf", "rasasi", "al haramain", "swiss arabian", "ajmal", "khadlaj", "paris corner", "ahmed al maghribi", "french avenue", "fragrance world"], "Emirados Árabes Unidos"],
  [["arabian oud", "abdul samad al qurashi", "ibrahim al qurashi"], "Arábia Saudita"],
];
export const paisDaCasa = (casa: string) => PAIS_CASA.find(([l]) => tem(l, casa))?.[1] ?? null;

/** A trava: só casas brasileiras, americanas e árabes. */
export const casaPermitida = (casa: string, pais?: string | null) => ["arabe", "brasileira", "americana"].includes(origemCasa(casa, pais));

/** Coordenadas da cidade da casa (ou da capital do país), para a linha cartográfica da ficha. */
const COORD: Record<string, [string, number, number]> = {
  paris: ["PARIS", 48.86, 2.35], "turim e milao": ["MILÃO", 45.46, 9.19], milao: ["MILÃO", 45.46, 9.19], "nova york": ["NOVA YORK", 40.71, -74.01],
  londres: ["LONDRES", 51.51, -0.13], "dubai e sharjah": ["DUBAI", 25.2, 55.27], dubai: ["DUBAI", 25.2, 55.27],
  "emirados arabes unidos": ["DUBAI", 25.2, 55.27], "arabia saudita": ["RIADE", 24.71, 46.68], franca: ["PARIS", 48.86, 2.35], italia: ["MILÃO", 45.46, 9.19],
  "estados unidos": ["NOVA YORK", 40.71, -74.01], "reino unido": ["LONDRES", 51.51, -0.13], brasil: ["SÃO PAULO", -23.55, -46.63], espanha: ["MADRI", 40.42, -3.7],
  alemanha: ["BERLIM", 52.52, 13.4], suica: ["GENEBRA", 46.2, 6.14], kuwait: ["KUWAIT", 29.38, 47.99], catar: ["DOHA", 25.29, 51.53], oma: ["MASCATE", 23.59, 58.41],
};
export function coordenadas(cidade?: string | null, pais?: string | null): string {
  const k = (x?: string | null) => (x ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const c = COORD[k(cidade)] ?? COORD[k(pais)];
  if (!c) return "";
  const [nome, la, lo] = c;
  return `${nome} · ${Math.abs(la).toFixed(2)}° ${la >= 0 ? "N" : "S"} ${Math.abs(lo).toFixed(2)}° ${lo >= 0 ? "E" : "W"}`;
}
