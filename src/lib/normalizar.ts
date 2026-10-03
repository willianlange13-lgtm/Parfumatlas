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
  "pink pepper tree": "Pimenta-rosa", "sichuan pepper": "Pimenta de Sichuan", "szechuan pepper": "Pimenta de Sichuan", "black currant leaf": "Folha de groselha-preta",
  salt: "Sal", "sea salt": "Sal marinho", "sea water": "Água do mar", seaweed: "Alga marinha", algae: "Alga marinha", driftwood: "Madeira flutuante", "ozonic notes": "Notas ozônicas",
  "water notes": "Notas aquáticas", "watery notes": "Notas aquáticas", "fresh notes": "Notas frescas", "citrus notes": "Notas cítricas", "spicy notes": "Notas especiadas", "floral notes": "Notas florais",
  "white flowers": "Flores brancas", "musky notes": "Notas almiscaradas", "powdery notes": "Notas atalcadas", "earthy notes": "Notas terrosas", "animalic notes": "Notas animálicas", "aldehydes": "Aldeídos",
  "mandarin orange peel": "Casca de mandarina", "orange peel": "Casca de laranja", "lemon peel": "Casca de limão", "blood orange": "Laranja sanguínea", kumquat: "Kumquat", "calabrian bergamot": "Bergamota da Calábria",
  "red apple": "Maçã vermelha", "green apple": "Maçã verde", "pear blossom": "Flor de pera", quince: "Marmelo", guava: "Goiaba", papaya: "Mamão", banana: "Banana", "black cherry": "Cereja preta", blueberry: "Mirtilo", blackberry: "Amora", "wild strawberry": "Morango silvestre", rhubarb: "Ruibarbo", "pomegranate": "Romã", grape: "Uva", "white grape": "Uva branca",
  "orange flower": "Flor de laranjeira", "neroli oil": "Neroli", "lotus": "Lótus", "water lily": "Lírio d'água", lily: "Lírio", "freesia": "Frésia", mimosa: "Mimosa", "lilac": "Lilás", "honeysuckle": "Madressilva", "frangipani": "Frangipani", "tiare flower": "Flor de tiaré", "sambac jasmine": "Jasmim sambac", "jasmine sambac": "Jasmim sambac", "turkish rose": "Rosa turca", "bulgarian rose": "Rosa búlgara", "damask rose": "Rosa damascena", "may rose": "Rosa de maio", "rose petals": "Pétalas de rosa", "cyclamen": "Ciclâmen", "carnation": "Cravo (flor)", "chamomile": "Camomila", "marigold": "Calêndula",
  "tarragon": "Estragão", "artemisia": "Artemísia", "wormwood": "Absinto", "fennel": "Erva-doce", "dill": "Endro", "bay leaf": "Folha de louro", "laurel": "Louro", "eucalyptus": "Eucalipto", "tea tree": "Melaleuca", "galbanum": "Gálbano", "fig leaf": "Folha de figo", "tomato leaf": "Folha de tomate", "mastic": "Mástique", "lentisque": "Lentisco", "hay": "Feno", "tobacco leaf": "Folha de tabaco",
  "whiskey": "Uísque", "whisky": "Uísque", "champagne": "Champanhe", "wine": "Vinho", "vodka": "Vodca", "gin": "Gim", "bourbon vanilla": "Baunilha bourbon", "madagascar vanilla": "Baunilha de Madagascar", "vanilla absolute": "Baunilha", "marshmallow": "Marshmallow", "cotton candy": "Algodão-doce", "toffee": "Toffee", "brown sugar": "Açúcar mascavo", "pistachio": "Pistache", "chestnut": "Castanha", "coconut milk": "Leite de coco", "cream": "Creme", "butter": "Manteiga", "bread": "Pão", "rice": "Arroz", "biscuit": "Biscoito",
  "atlas cedar": "Cedro do Atlas", "virginia cedar": "Cedro da Virgínia", "texas cedar": "Cedro do Texas", "white cedar": "Cedro branco", "haitian vetiver": "Vetiver do Haiti", "indonesian patchouli": "Patchouli da Indonésia", "australian sandalwood": "Sândalo australiano", "mysore sandalwood": "Sândalo de Mysore", "teak": "Teca", "ebony": "Ébano", "rosewood": "Pau-rosa", "oak": "Carvalho", "oakwood": "Madeira de carvalho", "balsam fir": "Abeto balsâmico", "pine needles": "Agulhas de pinheiro", "akigalawood": "Akigalawood", "iso e super": "Iso E Super", "norlimbanol": "Norlimbanol", "clearwood": "Clearwood",
  "ambergris accord": "Âmbar cinzento", "amberwood": "Madeira ambarada", "ambrocenide": "Ambrocenide", "cetalox": "Cetalox", "hedione": "Hedione", "calone": "Calone", "helional": "Helional", "javanol": "Javanol", "sandalore": "Sandalore", "habanolide": "Habanolide", "galaxolide": "Galaxolide", "muscone": "Muscona", "musk ketone": "Almíscar", "cashmere musk": "Almíscar de cashmere", "skin musk": "Almíscar de pele",
  "leather accord": "Couro", "suede": "Camurça", "tobacco blossom": "Flor de tabaco", "smoke": "Fumaça", "birch tar": "Alcatrão de bétula", "cade": "Cade", "styrax": "Estoraque", "tolu balsam": "Bálsamo de tolu", "peru balsam": "Bálsamo do Peru", "copahu": "Copaíba", "elemi resin": "Elemi", "opoponax": "Opoponax", "resins": "Resinas",
  tea: "Chá", "green tea": "Chá verde", "black tea": "Chá preto", "green notes": "Notas verdes", grass: "Grama", "mate": "Erva-mate",
};

/** "Damasco/Alperce (apricot) (em algumas fontes)" → "Damasco". */
/** A nota está na tabela de tradução? (as que não estão vão para a tradução automática) */
export function notaConhecida(n: string) {
  const limpa = n.replace(/\([^)]*\)/g, "").split(/\s*\/\s*/)[0].replace(/\s+/g, " ").trim();
  return Boolean(NOTA[tira(limpa)] ?? NOTA[limpa.toLowerCase()]);
}
export const acordeConhecido = (a: string) => Boolean(ACORDE[tira(a.replace(/\([^)]*\)/g, ""))]);

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
  // aceita lista [42, 194, ...], objeto {"muito fraco": 42, ...} e textos como "855 votos"
  const lista = (l: unknown): unknown[] => (Array.isArray(l) ? l : l && typeof l === "object" ? Object.values(l) : []);
  const numero = (x: unknown) => {
    if (x && typeof x === "object") { const o = x as Record<string, unknown>; x = o.votos ?? o.v ?? o.valor ?? o.count ?? o.n; }
    return parseFloat(String(x ?? "").replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")) || 0;
  };
  const pct = (l: unknown, n: number) => {
    const b = lista(l);
    const a = Array.from({ length: n }, (_, i) => Math.max(0, numero(b[i])));
    const s = a.reduce((x, y) => x + y, 0);
    return s > 0 ? a.map((x) => Math.round((x / s) * 100)) : null;
  };
  const o = v as Record<string, unknown>;
  const fix = pct(o.fixacao ?? o.longevidade ?? o.longevity, 5), proj = pct(o.projecao ?? o.rastro ?? o.sillage, 4);
  const eb = (v.estacoes ?? {}) as Record<string, unknown>;
  const e = { primavera: numero(eb.primavera), verao: numero(eb.verao ?? eb["verão"]), outono: numero(eb.outono), inverno: numero(eb.inverno) };
  const maxE = Math.max(e.primavera, e.verao, e.outono, e.inverno, numero(v.dia), numero(v.noite), 1);
  const rel = (x?: unknown) => Math.round((numero(x) / maxE) * 100);
  if (!fix && !proj && maxE <= 1) return undefined;
  return {
    total: numero(v.total),
    // sem contagem não inventa: fica zerado e a tela avisa que faltam os votos
    fixacao: (fix ?? [0, 0, 0, 0, 0]) as Votos["fixacao"],
    projecao: (proj ?? [0, 0, 0, 0]) as Votos["projecao"],
    estacoes: { primavera: rel(e.primavera), verao: rel(e.verao), outono: rel(e.outono), inverno: rel(e.inverno) },
    dia: rel(v.dia), noite: rel(v.noite),
    ocasioes: v.ocasioes?.length ? v.ocasioes : ocasioesPadrao,
    origem: v.origem === "estimativa" ? "estimativa" : "fragrantica",
  };
}

/** Horas e metros a partir dos votos (mesma régua do Fragrantica). */
export const temVotos = (l?: number[]) => (l ?? []).some((x) => x > 0);
export const horasDosVotos = (f: number[]) => Math.round(f.reduce((s, x, i) => s + (x / 100) * [1.5, 3, 5.5, 9, 13][i], 0) * 10) / 10;
export const metrosDosVotos = (p: number[]) => Math.round(p.reduce((s, x, i) => s + (x / 100) * [0.4, 1.2, 2, 3][i], 0) * 10) / 10;

/**
 * As 8 famílias olfativas do Atlas. A família do Fragrantica ("Almíscar Floral Amadeirado",
 * "Aromatic Aquatic"…) vira UMA delas: vale a primeira palavra que pertence a uma família.
 */
export const FAMILIAS = ["Floral", "Cítrica", "Amadeirada", "Oriental", "Aromática", "Frutal", "Gourmand", "Chipre"] as const;
export type Familia = (typeof FAMILIAS)[number];

const PALAVRA_FAMILIA: [RegExp, Familia][] = [
  [/^(floral|florais|flores?|flower|white floral|rosa|rose|jasmim|jasmine|iris|violeta|violet|tuberosa|tuberose)$/, "Floral"],
  [/^(citric[oa]s?|citrus|hesperidad[oa]|hesperidic|hesperidee)$/, "Cítrica"],
  [/^(amadeirad[oa]s?|woody|wood|madeira|couro|leather|terros[oa]|earthy|musgos[oa]|mossy|oud|esfumaçad[oa]|smoky)$/, "Amadeirada"],
  [/^(oriental|orientais|ambar|amber|ambarad[oa]|especiad[oa]s?|spicy|resinos[oa]|balsamic[oa]|balsâmic[oa]|baunilha|vanilla|incenso|incense)$/, "Oriental"],
  [/^(aromatic[oa]s?|aromatic|fougere|foug[eè]re|verde|green|herbal|aquatic[oa]|aquatic|marinh[oa]|marine|ozonic[oa]|aquatica|fresc[oa]|fresh|lavanda|lavender)$/, "Aromática"],
  [/^(frutad[oa]s?|frutal|fruity|frutas?|fruit)$/, "Frutal"],
  [/^(gourmand|doce|sweet|lactonic[oa]|cafe|coffee|chocolate|caramelo|caramel)$/, "Gourmand"],
  [/^(chipre|chypre)$/, "Chipre"],
];

/** Converte qualquer família (ou, sem ela, o acorde principal) numa das 8. */
export function familiaAtlas(familia?: string | null, acordePrincipalNome?: string | null): Familia {
  const t = (s?: string | null) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (FAMILIAS.some((f) => t(f) === t(familia))) return FAMILIAS.find((f) => t(f) === t(familia))!;
  for (const w of t(familia).split(/[^a-z]+/).filter(Boolean)) {
    const achou = PALAVRA_FAMILIA.find(([re]) => re.test(w));
    if (achou) return achou[1];
  }
  for (const w of t(acordePrincipalNome).split(/[^a-z]+/).filter(Boolean)) {
    const achou = PALAVRA_FAMILIA.find(([re]) => re.test(w));
    if (achou) return achou[1];
  }
  return "Aromática";
}

/** Uma linha sobre cada família (aparece na ficha). */
export const SOBRE_FAMILIA: Record<Familia, string> = {
  Floral: "flores como jasmim, rosa e violeta",
  Cítrica: "limão, laranja e bergamota; fresca e leve",
  Amadeirada: "cedro, sândalo e vetiver; força e calor",
  Oriental: "resinas, especiarias e baunilha; marcante",
  Aromática: "ervas como lavanda, alecrim e hortelã",
  Frutal: "maçã, pera, pêssego ou frutas vermelhas",
  Gourmand: "lembra comida: chocolate, caramelo, leite",
  Chipre: "saída cítrica, fundo de madeira e musgo",
};
