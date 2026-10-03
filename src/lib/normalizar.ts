/** Deixa a ficha no padrão do Fragrantica Brasil: notas e acordes em português, votos convertidos. */
import type { Votos } from "@/lib/tipos";

const tira = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// nome em inglês ou variação → nome usado no Fragrantica Brasil
const NOTA: Record<string, string> = {
  citron: "Cidra", cidra: "Cidra", mandarin: "Mandarina", "mandarin orange": "Mandarina", tangerine: "Tangerina", mint: "Hortelã", peppermint: "Hortelã", spearmint: "Hortelã",
  bergamot: "Bergamota", lemon: "Limão", "limao siciliano": "Limão", lime: "Lima", grapefruit: "Toranja", orange: "Laranja", "bitter orange": "Laranja amarga", yuzu: "Yuzu", petitgrain: "Petitgrain", neroli: "Neroli",
  blackcurrant: "Groselha-preta", "black currant": "Groselha-preta", "groselha negra": "Groselha-preta", "groselha-negra": "Groselha-preta", "groselha preta": "Groselha-preta", cassis: "Groselha-preta",
  coriander: "Coentro", basil: "Manjericão", carrot: "Cenoura", "carrot seed": "Cenoura", "carrot seeds": "Cenoura", "semente de cenoura": "Cenoura", "sementes de cenoura": "Cenoura",
  rose: "Rosa", fig: "Figo", amber: "Âmbar", ambar: "Âmbar", ambroxan: "Ambroxan", ambrette: "Semente de ambreta", ambreta: "Semente de ambreta", ambergris: "Âmbar cinzento",
  date: "Tâmara", dates: "Tâmara", tamaras: "Tâmara", apricot: "Damasco", alperce: "Damasco", peach: "Pêssego", pear: "Pera", apple: "Maçã", pineapple: "Abacaxi", plum: "Ameixa",
  raspberry: "Framboesa", strawberry: "Morango", cherry: "Cereja", lychee: "Lichia", litchi: "Lichia", coconut: "Coco", cucumber: "Pepino", watermelon: "Melancia", melon: "Melão", mango: "Manga",
  "passion fruit": "Maracujá", "red berries": "Frutas vermelhas", berries: "Frutas vermelhas", "fruity notes": "Notas frutadas",
  musk: "Almíscar", "white musk": "Almíscar branco", vanilla: "Baunilha", "tonka bean": "Fava tonka", tonka: "Fava tonka", "fava tonka": "Fava tonka", praline: "Praliné", caramel: "Caramelo",
  cacao: "Cacau", cocoa: "Cacau", chocolate: "Chocolate", coffee: "Café", honey: "Mel", rum: "Rum", cognac: "Conhaque", almond: "Amêndoa", hazelnut: "Avelã", milk: "Leite", sugar: "Açúcar",
  cedar: "Cedro", cedarwood: "Cedro", sandalwood: "Sândalo", vetiver: "Vetiver", patchouli: "Patchouli", oud: "Oud", agarwood: "Oud", "agarwood (oud)": "Oud", birch: "Bétula", oakmoss: "Musgo de carvalho",
  "woody notes": "Notas amadeiradas", guaiac: "Madeira de guaiaco", "guaiac wood": "Madeira de guaiaco", cashmeran: "Cashmeran", "cashmere wood": "Cashmeran", papyrus: "Papiro", cypress: "Cipreste", pine: "Pinho", fir: "Abeto", juniper: "Zimbro", "juniper berries": "Zimbro",
  lavender: "Lavanda", rosemary: "Alecrim", sage: "Sálvia", "clary sage": "Sálvia esclareia", thyme: "Tomilho", geranium: "Gerânio", violet: "Violeta", "violet leaf": "Folha de violeta", tuberose: "Tuberosa", peony: "Peônia",
  jasmine: "Jasmim", iris: "Íris", orris: "Íris", magnolia: "Magnólia", "lily of the valley": "Lírio-do-vale", ylang: "Ylang-ylang", "ylang-ylang": "Ylang-ylang", "orange blossom": "Flor de laranjeira", osmanthus: "Osmanthus", gardenia: "Gardênia", heliotrope: "Heliotropo",
  cardamom: "Cardamomo", cinnamon: "Canela", pepper: "Pimenta", "black pepper": "Pimenta-preta", "pink pepper": "Pimenta-rosa", saffron: "Açafrão", ginger: "Gengibre", nutmeg: "Noz-moscada", clove: "Cravo", licorice: "Alcaçuz", anise: "Anis", "star anise": "Anis-estrelado", elemi: "Elemi", cumin: "Cominho",
  incense: "Incenso", olibanum: "Olíbano", frankincense: "Olíbano", labdanum: "Labdano", benzoin: "Benjoim", myrrh: "Mirra", leather: "Couro", tobacco: "Tabaco", "sea notes": "Notas marinhas", "marine notes": "Notas marinhas", "aquatic notes": "Notas aquáticas",
  tea: "Chá", "green tea": "Chá verde", "black tea": "Chá preto", "green notes": "Notas verdes", grass: "Grama", "mate": "Erva-mate",
};

/** "Damasco/Alperce (apricot) (em algumas fontes)" → "Damasco". */
export function notaPT(n: string) {
  const limpa = n.replace(/\([^)]*\)/g, "").split(/\s*\/\s*/)[0].replace(/\s+/g, " ").trim();
  const t = tira(limpa);
  const traduzida = NOTA[t] ?? NOTA[limpa.toLowerCase()];
  if (traduzida) return traduzida;
  return limpa.charAt(0).toUpperCase() + limpa.slice(1);
}

export function notasPT(lista: string[] | undefined) {
  return [...new Set((lista ?? []).map(notaPT).filter(Boolean))];
}

// acordes do Fragrantica (inglês ou português) → como aparecem no Fragrantica Brasil
const ACORDE: Record<string, string> = {
  citrus: "Cítrico", citrico: "Cítrico", green: "Verde", verde: "Verde", aromatic: "Aromático", aromatico: "Aromático", "fresh spicy": "Fresco especiado", "fresco especiado": "Fresco especiado",
  fruity: "Frutado", frutado: "Frutado", amber: "Âmbar", ambar: "Âmbar", woody: "Amadeirado", amadeirado: "Amadeirado", "warm spicy": "Especiado quente", "quente especiado": "Especiado quente", "especiado quente": "Especiado quente",
  "soft spicy": "Especiado suave", sweet: "Doce", doce: "Doce", musky: "Almiscarado", almiscarado: "Almiscarado", vanilla: "Baunilha", baunilha: "Baunilha", powdery: "Atalcado", atalcado: "Atalcado",
  floral: "Floral", "white floral": "Floral branco", "floral branco": "Floral branco", "yellow floral": "Floral amarelo", rose: "Rosa", leather: "Couro", couro: "Couro", tobacco: "Tabaco", tabaco: "Tabaco",
  smoky: "Esfumaçado", esfumacado: "Esfumaçado", earthy: "Terroso", terroso: "Terroso", aquatic: "Aquático", aquatico: "Aquático", marine: "Marinho", marinho: "Marinho", ozonic: "Ozônico", ozonico: "Ozônico",
  fresh: "Fresco", fresco: "Fresco", herbal: "Herbal", lavender: "Lavanda", lavanda: "Lavanda", oud: "Oud", balsamic: "Balsâmico", balsamico: "Balsâmico", mossy: "Musgoso", musgoso: "Musgoso",
  tropical: "Tropical", coconut: "Coco", honey: "Mel", coffee: "Café", lactonic: "Lactônico", lactonico: "Lactônico", mineral: "Mineral", salty: "Salgado", salgado: "Salgado", cherry: "Cereja",
  iris: "Íris", violet: "Violeta", patchouli: "Patchouli", animalic: "Animálico", resinous: "Resinoso", resinoso: "Resinoso", gourmand: "Gourmand", cacao: "Cacau", nutty: "Amendoado", caramel: "Caramelo",
  metallic: "Metálico", soapy: "Ensaboado", cinnamon: "Canela", rum: "Rum", whiskey: "Uísque", "tuberose": "Tuberosa", "aldehydic": "Aldeídico",
};

export function acordePT(a: string) {
  const t = tira(a.replace(/\([^)]*\)/g, ""));
  return ACORDE[t] ?? a.trim().charAt(0).toUpperCase() + a.trim().slice(1).toLowerCase();
}

/** Acorde principal do Atlas (um dos 11) a partir do acorde do Fragrantica. */
export function acordePrincipal(a: string) {
  const m: Record<string, string> = {
    Cítrico: "Cítrico", Verde: "Verde", Aromático: "Aromático", "Fresco especiado": "Aromático", Herbal: "Aromático", Lavanda: "Aromático", Fresco: "Cítrico",
    Frutado: "Frutado", Tropical: "Frutado", Aquático: "Aquático", Marinho: "Aquático", Ozônico: "Aquático", Mineral: "Aquático", Salgado: "Aquático",
    Floral: "Floral", "Floral branco": "Floral", "Floral amarelo": "Floral", Rosa: "Floral", Íris: "Floral", Violeta: "Floral", Atalcado: "Floral", Tuberosa: "Floral",
    Amadeirado: "Amadeirado", Oud: "Amadeirado", Terroso: "Amadeirado", Musgoso: "Amadeirado", Esfumaçado: "Amadeirado", Patchouli: "Amadeirado",
    Couro: "Couro", Tabaco: "Couro", Animálico: "Couro",
    Âmbar: "Âmbar", Balsâmico: "Âmbar", Resinoso: "Âmbar", Almiscarado: "Âmbar",
    "Especiado quente": "Especiado", "Especiado suave": "Especiado", Canela: "Especiado",
    Doce: "Baunilha", Baunilha: "Baunilha", Gourmand: "Baunilha", Lactônico: "Baunilha", Café: "Baunilha", Mel: "Baunilha", Cacau: "Baunilha", Caramelo: "Baunilha", Coco: "Baunilha", Amendoado: "Baunilha",
  };
  return m[a] ?? "Aromático";
}

/** Converte contagens de votos (ou porcentagens) no formato do Atlas. */
export function votosDe(v: Partial<Votos> | undefined, ocasioesPadrao: { nome: string; v: number }[]): Votos | undefined {
  if (!v) return undefined;
  const pct = (l: number[] | undefined, n: number) => {
    const a = Array.from({ length: n }, (_, i) => Math.max(0, Number(l?.[i]) || 0));
    const s = a.reduce((x, y) => x + y, 0);
    return s > 0 ? a.map((x) => Math.round((x / s) * 100)) : null;
  };
  const fix = pct(v.fixacao, 5), proj = pct(v.projecao, 4);
  const e = v.estacoes ?? { primavera: 0, verao: 0, outono: 0, inverno: 0 };
  const maxE = Math.max(e.primavera, e.verao, e.outono, e.inverno, v.dia ?? 0, v.noite ?? 0, 1);
  const rel = (x?: number) => Math.round(((Number(x) || 0) / maxE) * 100);
  if (!fix && !proj && maxE <= 1) return undefined;
  return {
    total: v.total ?? 0,
    fixacao: (fix ?? [0, 0, 100, 0, 0]) as Votos["fixacao"],
    projecao: (proj ?? [0, 100, 0, 0]) as Votos["projecao"],
    estacoes: { primavera: rel(e.primavera), verao: rel(e.verao), outono: rel(e.outono), inverno: rel(e.inverno) },
    dia: rel(v.dia), noite: rel(v.noite),
    ocasioes: v.ocasioes?.length ? v.ocasioes : ocasioesPadrao,
  };
}

/** Horas e metros a partir dos votos (mesma régua do Fragrantica). */
export const horasDosVotos = (f: number[]) => Math.round(f.reduce((s, x, i) => s + (x / 100) * [1.5, 3, 5.5, 9, 13][i], 0) * 10) / 10;
export const metrosDosVotos = (p: number[]) => Math.round(p.reduce((s, x, i) => s + (x / 100) * [0.4, 1.2, 2, 3][i], 0) * 10) / 10;
