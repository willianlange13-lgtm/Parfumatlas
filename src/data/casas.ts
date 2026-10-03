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
