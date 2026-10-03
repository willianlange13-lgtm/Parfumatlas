/** Dados de referência: notas, casas, lições e ícones. */

export const ICONE_NOTA: Record<string, string> = {
  fruta: "M12 8c-4 0-7 3-7 7s3 6 7 6 7-2 7-6-3-7-7-7z M12 8c0-2 1-4 3-5",
  citrico: "M12 3a9 9 0 1 0 0.01 0 M12 3v18 M3 12h18 M5.6 5.6l12.8 12.8 M18.4 5.6L5.6 18.4",
  baga: "M8 14a3 3 0 1 0 0.01 0 M16 14a3 3 0 1 0 0.01 0 M12 9a3 3 0 1 0 0.01 0 M12 6V3",
  flor: "M12 7.5a2.5 2.5 0 1 0 0.01 0 M16.5 10.8a2.5 2.5 0 1 0 0.01 0 M14.8 16a2.5 2.5 0 1 0 0.01 0 M9.2 16a2.5 2.5 0 1 0 0.01 0 M7.5 10.8a2.5 2.5 0 1 0 0.01 0",
  folha: "M5 19C5 10 11 5 19 5c0 8-5 14-14 14z M5 19L13 11",
  madeira: "M12 4a8 8 0 1 0 0.01 0 M12 7a5 5 0 1 0 0.01 0 M12 10a2 2 0 1 0 0.01 0",
  gota: "M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z",
  especiaria: "M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z",
  resina: "M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z",
  baunilha: "M6 20C10 14 14 8 18 4 M9 20c4-5 8-11 11-15",
  nuvem: "M7 17a4 4 0 0 1 0-8 5 5 0 0 1 9.5-1A4 4 0 0 1 17 17z",
};

const TIPO: Record<string, string> = {
  Abacaxi: "fruta", Maçã: "fruta", Pera: "fruta", Tâmara: "fruta", Frutas: "fruta", Pêssego: "fruta", Lichia: "fruta",
  "Groselha-preta": "baga", "Frutas vermelhas": "baga",
  Bergamota: "citrico", Toranja: "citrico", Laranja: "citrico", Limão: "citrico", Mandarina: "citrico", Tangerina: "citrico",
  Neroli: "flor", Jasmim: "flor", Rosa: "flor", "Flor de laranjeira": "flor", Gerânio: "flor", Violeta: "flor", Tuberosa: "flor", Peônia: "flor", Íris: "flor",
  Lavanda: "folha", Patchouli: "folha", "Musgo de carvalho": "folha", Hortelã: "folha", Alecrim: "folha", Cipreste: "folha", "Folhas de violeta": "folha", Vetiver: "folha", Musgo: "folha",
  Bétula: "madeira", Cedro: "madeira", Oud: "madeira", Sândalo: "madeira", Madeiras: "madeira", Amberwood: "madeira", Carvalho: "madeira", "Resina de abeto": "madeira",
  "Notas marinhas": "gota", Mel: "gota", Conhaque: "gota", Café: "gota",
  Canela: "especiaria", Cardamomo: "especiaria", Gengibre: "especiaria", Açafrão: "especiaria", "Noz-moscada": "especiaria", Pimenta: "especiaria", "Pimenta-rosa": "especiaria", Alcaçuz: "especiaria",
  Incenso: "resina", Benjoim: "resina", Mirra: "resina", Âmbar: "resina", Ambrofix: "resina", Ambroxan: "resina", Couro: "resina", Tabaco: "resina",
  Baunilha: "baunilha", Tonka: "baunilha", Praliné: "baunilha",
  Almíscar: "nuvem", "Âmbar cinzento": "nuvem",
};

/**
 * Foto real de cada nota: a imagem principal do artigo da Wikipédia (em inglês) sobre a planta ou a matéria-prima.
 * Notas abstratas (almíscar, âmbar, notas marinhas…) ficam com o ícone.
 */
export const WIKI_NOTA: Record<string, string> = {
  Abacaxi: "Pineapple", Maçã: "Apple", Pera: "Pear", Tâmara: "Date_palm", Pêssego: "Peach", Lichia: "Lychee",
  "Groselha-preta": "Blackcurrant", "Frutas vermelhas": "Raspberry", Frutas: "Fruit",
  Bergamota: "Bergamot_orange", Toranja: "Grapefruit", Laranja: "Orange_(fruit)", Limão: "Lemon", Mandarina: "Mandarin_orange", Tangerina: "Tangerine",
  Neroli: "Neroli", Jasmim: "Jasminum_officinale", Rosa: "Rosa_×_damascena", "Flor de laranjeira": "Orange_blossom", Gerânio: "Pelargonium_graveolens", Violeta: "Viola_odorata", Tuberosa: "Polianthes_tuberosa", Peônia: "Paeonia_lactiflora", Íris: "Iris_pallida",
  Lavanda: "Lavandula_angustifolia", Patchouli: "Patchouli", "Musgo de carvalho": "Evernia_prunastri", Hortelã: "Mentha_×_piperita", Alecrim: "Rosemary", Cipreste: "Cupressus_sempervirens", Vetiver: "Chrysopogon_zizanioides",
  Bétula: "Betula_pendula", Cedro: "Cedrus_atlantica", Oud: "Agarwood", Sândalo: "Santalum_album", Carvalho: "Quercus_robur", "Resina de abeto": "Abies_alba",
  Mel: "Honey", Conhaque: "Cognac", Café: "Coffee_bean",
  Canela: "Cinnamon", Cardamomo: "Cardamom", Gengibre: "Ginger", Açafrão: "Saffron", "Noz-moscada": "Nutmeg", Pimenta: "Black_pepper", "Pimenta-rosa": "Schinus_terebinthifolia", Alcaçuz: "Liquorice",
  Incenso: "Frankincense", Benjoim: "Benzoin_resin", Mirra: "Myrrh", Couro: "Leather", Tabaco: "Tobacco",
  Baunilha: "Vanilla", Tonka: "Tonka_bean", Praliné: "Praline_(nut_confection)",
};

export function nota(nome: string) {
  const wiki = WIKI_NOTA[nome];
  return { nome, foto: wiki ? `/api/nota-foto?n=${encodeURIComponent(nome)}` : null, icone: ICONE_NOTA[TIPO[nome] ?? "nuvem"] };
}

export const ENCICLOPEDIA: Record<string, { tipo: string; origem: string; como: string; conhecer: string[] }> = {
  Abacaxi: { tipo: "Nota de saída · família frutada", origem: "Fruta tropical das Américas.", como: "A fruta não rende óleo. O cheiro vem de moléculas como o alil caproato.", conhecer: ["Absolu Aventus", "Supremacy Silver"] },
  Maçã: { tipo: "Nota de saída · família frutada", origem: "Cultivada há milênios na Ásia Central.", como: "Reconstruída em laboratório, a partir de ésteres frutados.", conhecer: ["Be Delicious"] },
  Pera: { tipo: "Nota de saída · família frutada", origem: "Fruta de clima temperado, da Europa e da Ásia.", como: "Sem óleo natural. O acorde vem de acetatos frutados.", conhecer: ["Pear & Freesia"] },
  Laranja: { tipo: "Nota de saída · família cítrica", origem: "Sul da China, hoje cultivada no mundo todo.", como: "Prensagem a frio da casca.", conhecer: ["Eau d'Orange Verte"] },
  Gengibre: { tipo: "Nota de coração · família especiada", origem: "Raiz do Sudeste Asiático.", como: "Destilação a vapor da raiz seca.", conhecer: ["Ginger Essence"] },
  Tâmara: { tipo: "Nota de coração · família gourmand", origem: "Palmeira do Oriente Médio e do Norte da África.", como: "Extrato e acordes doces de frutas secas.", conhecer: ["Angels’ Share"] },
};

export const CURIOSIDADES = [
  { nota: "Abacaxi", titulo: "O abacaxi que não vem do abacaxi", texto: "A fruta não rende óleo para perfume. Quando um perfume cheira a abacaxi, o efeito costuma vir de moléculas criadas em laboratório, como o alil caproato." },
  { nota: "Tâmara", titulo: "A tâmara que adoça sem açúcar", texto: "A tâmara dos perfumes árabes é um acorde de frutas secas e mel. Ela dá a sensação de doce sem usar baunilha em excesso." },
  { nota: "Gengibre", titulo: "O gengibre que esfria", texto: "Na saída, o gengibre parece fresco e picante ao mesmo tempo. É por isso que ele aparece tanto em perfumes de verão." },
  { nota: "Pera", titulo: "A pera que não existe em óleo", texto: "Assim como o abacaxi, a pera não dá óleo. O cheiro é montado com acetatos que lembram a fruta madura." },
];

export const CASAS: Record<string, { pais: string; cidade: string; x: number; y: number }> = {
  Creed: { pais: "França", cidade: "Paris", x: 511.7, y: 104.9 },
  "Ex Nihilo": { pais: "França", cidade: "Paris", x: 511.7, y: 104.9 },
  Chanel: { pais: "França", cidade: "Paris", x: 511.7, y: 104.9 },
  "Parfums de Marly": { pais: "França", cidade: "Paris", x: 511.7, y: 104.9 },
  "Maison Francis Kurkdjian": { pais: "França", cidade: "Paris", x: 511.7, y: 104.9 },
  Dior: { pais: "França", cidade: "Paris", x: 511.7, y: 104.9 },
  "Jean Paul Gaultier": { pais: "França", cidade: "Paris", x: 511.7, y: 104.9 },
  Kilian: { pais: "França", cidade: "Paris", x: 511.7, y: 104.9 },
  "Frédéric Malle": { pais: "França", cidade: "Paris", x: 511.7, y: 104.9 },
  Montblanc: { pais: "França", cidade: "Paris", x: 511.7, y: 104.9 },
  Xerjoff: { pais: "Itália", cidade: "Turim e Milão", x: 542.5, y: 129.5 },
  "Giorgio Armani": { pais: "Itália", cidade: "Turim e Milão", x: 542.5, y: 129.5 },
  Armaf: { pais: "Emirados Árabes", cidade: "Dubai e Sharjah", x: 776.5, y: 268.6 },
  Lattafa: { pais: "Emirados Árabes", cidade: "Dubai e Sharjah", x: 776.5, y: 268.6 },
  Afnan: { pais: "Emirados Árabes", cidade: "Dubai e Sharjah", x: 776.5, y: 268.6 },
  "Tom Ford": { pais: "Estados Unidos", cidade: "Nova York", x: 130, y: 161.3 },
};

export const LICOES = [
  { n: "01", titulo: "O que é um chipre", txt: "Bergamota na abertura, musgo de carvalho e patchouli no fundo. Elegante e seco.", familia: "Chipre", min: 8 },
  { n: "02", titulo: "Fougère: a família da lavanda", txt: "Lavanda, cumarina e musgo. A base de quase todo perfume masculino clássico.", familia: "fougère", min: 8 },
  { n: "03", titulo: "Oud de verdade e oud de laboratório", txt: "A resina rara da árvore agarwood e as versões sintéticas que dominam o mercado.", familia: "Oud", min: 10 },
  { n: "04", titulo: "Âmbar não é uma pedra", txt: "Um acorde quente de resinas, baunilha e láudano, criado para lembrar calor.", familia: "Âmbar", min: 10 },
  { n: "05", titulo: "Gourmand: perfume que dá fome", txt: "Baunilha, praliné, café. A família que nasceu nos anos 90.", familia: "gourmand", min: 9 },
  { n: "06", titulo: "Aquáticos e a calone", txt: "A molécula que trouxe o cheiro de mar para a perfumaria.", familia: "Aquático", min: 8 },
  { n: "07", titulo: "Cítricos: por que somem rápido", txt: "Moléculas leves evaporam primeiro. Como fazer um cítrico durar.", familia: "Cítrico", min: 7 },
  { n: "08", titulo: "Como ler uma pirâmide", txt: "Saída, coração e fundo, e por que a ordem engana.", familia: "", min: 6 },
];
export const LICOES_CONCLUIDAS = 2;

/** Eixos do DNA e para onde vai cada acorde. */
export const EIXOS = ["Cítrico", "Frutado", "Aromático", "Aquático", "Floral", "Amadeirado", "Âmbar", "Gourmand"] as const;
export const ACORDE_EIXO: Record<string, (typeof EIXOS)[number]> = {
  Cítrico: "Cítrico", Fresco: "Cítrico", Verde: "Aromático",
  Frutado: "Frutado",
  Aromático: "Aromático", Lavanda: "Aromático",
  Aquático: "Aquático", Mineral: "Aquático",
  Floral: "Floral",
  Amadeirado: "Amadeirado", Oud: "Amadeirado", Esfumaçado: "Amadeirado", Couro: "Amadeirado", Patchouli: "Amadeirado", Incenso: "Amadeirado",
  Âmbar: "Âmbar", Especiado: "Âmbar", Almíscar: "Âmbar", Tabaco: "Âmbar",
  Baunilha: "Gourmand", Doce: "Gourmand", Gourmand: "Gourmand", Mel: "Gourmand", Café: "Gourmand",
};

export const tipoNota = (n: string) => TIPO[n] ?? "nuvem";
