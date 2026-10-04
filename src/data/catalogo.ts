import { semFundo } from "@/lib/sem-fundo";
import type { Forma, Perfume, Votos, ItemColecao, Lancamento } from "@/lib/tipos";
import { familiaAtlas } from "@/lib/normalizar";

/** Coleção de exemplo. Aparece enquanto o banco estiver vazio. Dados ilustrativos. */

type Base = {
  id: string; nome: string; casa: string; ano: number; conc?: string; perf: string[]; familia: string; acorde: string; genero: string; pais: string;
  desc?: string; saida: string[]; coracao: string[]; fundo: string[]; acordes: [string, number][]; fix: number; proj: number;
  forma: Forma; tampa: string; insp?: string; est?: [number, number, number, number]; dia?: [number, number];
};

function votosDe(b: Base): Votos {
  const f = b.fix;
  const fixacao: Votos["fixacao"] = f >= 8 ? [2, 6, 22, 44, 26] : f >= 7 ? [3, 8, 32, 41, 16] : f >= 6 ? [4, 12, 40, 34, 10] : [8, 22, 44, 21, 5];
  const p = b.proj;
  const projecao: Votos["projecao"] = p >= 1.8 ? [6, 30, 44, 20] : p >= 1.4 ? [10, 46, 34, 10] : p >= 1.1 ? [16, 54, 24, 6] : [28, 52, 16, 4];
  const [pr, ve, ou, iv] = b.est ?? [70, 50, 70, 50];
  const [dia, noite] = b.dia ?? [70, 60];
  return {
    total: 600 + ((b.nome.length * 97) % 900),
    fixacao, projecao,
    estacoes: { primavera: pr, verao: ve, outono: ou, inverno: iv },
    dia, noite,
    ocasioes: [
      { nome: "Trabalho", v: Math.round(40 + (dia - 50) * 0.6) },
      { nome: "Dia a dia", v: Math.round(dia * 0.75) },
      { nome: "Encontro", v: Math.round(noite * 0.9) },
      { nome: "Festa", v: Math.round(noite * 0.7) },
      { nome: "Formal", v: Math.round(30 + (b.acorde === "Amadeirado" ? 20 : 5)) },
      { nome: "Esporte", v: Math.round(b.acorde === "Cítrico" || b.acorde === "Aquático" ? 45 : 18) },
    ],
  };
}

/** Pontos de fixação por temperatura (reviews com data e cidade). */
function climaDe(b: Base) {
  const pontos = [];
  let s = b.nome.length * 7919;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 30; i++) {
    const t = 14 + rnd() * 22;
    const seco = rnd() > 0.45;
    const h = b.fix + 1.1 - (t - 18) * 0.16 + (seco ? -0.25 : 0.2) + (rnd() - 0.5) * 0.7;
    pontos.push({ t: Math.round(t * 10) / 10, h: Math.max(2.5, Math.round(h * 10) / 10), seco });
  }
  return { n: 180 + ((b.nome.length * 31) % 200), pontos };
}

/** Número do perfume no Fragrantica: a foto oficial fica em fimgs.net. */
const FRAGRANTICA: Record<string, number> = {
  "aventus": 9828,
  "cdni": 34696,
  "blue-talisman": 84224,
  "erba-pura": 55157,
  "bleu-chanel": 25967,
  "oud-wood": 1826,
  "layton": 39314,
  "le-male-elixir": 81642,
  "khamrah": 75805,
  "sauvage-elixir": 68415,
  "br540": 33519,
  "adg-profondo": 59532,
  "neroli-portofino": 12192,
  "angels-share": 62615,
  "khamrah-qahwa": 88175,
  "supremacy-silver": 27352,
  "explorer": 52002,
  "absolu-aventus": 106624,
  "aventus-cologne": 51692,
  "khamrah-dukhan": 104529,
  "le-male-elixir-absolu": 101529,
  "erba-gold": 76683,
  "sauvage-eau-forte": 95863,
  "portrait-lady": 10464,
  "ombre-leather": 50239,
  "green-irish-tweed": 474,
  "eau-sauvage": 231,
  "fleur-narcotique": 27571,
  "lust-in-paradise": 53588
};
// passa pelo recorte também (docs/DECISOES.md §17): antes o catálogo mostrava a foto com fundo branco
const fotoOficial = (id: string) => (FRAGRANTICA[id] ? semFundo(`https://fimgs.net/mdimg/perfume/375x500.${FRAGRANTICA[id]}.jpg`) : null);

function p(b: Base): Perfume {
  return {
    id: b.id, nome: b.nome, casa: b.casa, ano: b.ano, concentracao: b.conc ?? "Eau de Parfum", perfumistas: b.perf,
    familia: familiaAtlas(b.familia, b.acorde), acorde: b.acorde, genero: b.genero, pais: b.pais, descricao: b.desc,
    notas: { saida: b.saida, coracao: b.coracao, fundo: b.fundo },
    acordes: b.acordes.map(([nome, valor]) => ({ nome, valor })),
    fixacaoH: b.fix, projecaoM: b.proj, votos: votosDe(b), clima: climaDe(b),
    forma: b.forma, tampa: b.tampa, inspiradoEm: b.insp, imagem: fotoOficial(b.id),
    fontes: [{ nome: "Fragrantica", oQue: "notas e votos" }, { nome: "Parfumo", oQue: "ano e família" }],
  };
}

export const PERFUMES: Perfume[] = [
  p({ id: "aventus", nome: "Aventus", casa: "Creed", ano: 2010, perf: ["Jean-Christophe Hérault", "Olivier Creed"], familia: "Chipre frutado", acorde: "Frutado", genero: "Masculino", pais: "França",
    desc: "Chipre frutado de 2010. Abacaxi e groselha na saída, bétula defumada no coração, musgo e âmbar cinzento no fundo.",
    saida: ["Abacaxi", "Bergamota", "Groselha-preta", "Maçã"], coracao: ["Bétula", "Patchouli", "Jasmim", "Rosa"], fundo: ["Almíscar", "Musgo de carvalho", "Âmbar cinzento", "Baunilha"],
    acordes: [["Frutado", 100], ["Amadeirado", 74], ["Fresco", 62], ["Esfumaçado", 56], ["Couro", 44], ["Almíscar", 40], ["Cítrico", 38], ["Aromático", 30]],
    fix: 7.6, proj: 1.5, forma: "alto", tampa: "#141417", est: [82, 74, 58, 35], dia: [88, 52] }),
  p({ id: "cdni", nome: "Club de Nuit Intense", casa: "Armaf", ano: 2015, perf: ["Claude Lascaut"], familia: "Chipre frutado", acorde: "Frutado", genero: "Masculino", pais: "Emirados Árabes", insp: "aventus",
    desc: "A leitura árabe do Aventus: mais fumaça, mais projeção e um fundo de baunilha.",
    saida: ["Abacaxi", "Limão", "Groselha-preta", "Maçã"], coracao: ["Bétula", "Jasmim", "Rosa"], fundo: ["Baunilha", "Almíscar", "Âmbar cinzento", "Patchouli"],
    acordes: [["Frutado", 92], ["Esfumaçado", 80], ["Amadeirado", 70], ["Cítrico", 50], ["Almíscar", 44]], fix: 8.6, proj: 1.9, forma: "alto", tampa: "#141417", est: [70, 52, 74, 60], dia: [62, 74] }),
  p({ id: "blue-talisman", nome: "Blue Talisman", casa: "Ex Nihilo", ano: 2022, conc: "Eau de Parfum", perf: ["Quentin Bisch"], familia: "Âmbar frutado", acorde: "Frutado", genero: "Unissex", pais: "França",
    desc: "Pera, bergamota e gengibre sobre um fundo de almíscar e madeiras claras.",
    saida: ["Pera", "Bergamota", "Tangerina"], coracao: ["Gengibre", "Flor de laranjeira"], fundo: ["Almíscar", "Madeiras", "Ambrofix"],
    acordes: [["Frutado", 94], ["Almíscar", 70], ["Cítrico", 60], ["Especiado", 42], ["Amadeirado", 40]], fix: 7.7, proj: 1.3, forma: "ret", tampa: "#C9A227", est: [86, 72, 60, 40], dia: [84, 56] }),
  p({ id: "erba-pura", nome: "Erba Pura", casa: "Xerjoff", ano: 2019, perf: ["Chris Maurice"], familia: "Âmbar frutado", acorde: "Frutado", genero: "Unissex", pais: "Itália",
    desc: "Laranja e frutas vermelhas luminosas sobre baunilha e almíscar. Projeção generosa.",
    saida: ["Laranja", "Limão", "Bergamota"], coracao: ["Frutas vermelhas", "Frutas"], fundo: ["Baunilha", "Almíscar", "Âmbar"],
    acordes: [["Frutado", 100], ["Doce", 72], ["Cítrico", 60], ["Âmbar", 52], ["Almíscar", 48]], fix: 8.4, proj: 2, forma: "redondo", tampa: "#B8963A", est: [84, 70, 66, 50], dia: [80, 68] }),
  p({ id: "bleu-chanel", nome: "Bleu de Chanel", casa: "Chanel", ano: 2010, perf: ["Jacques Polge"], familia: "Amadeirado aromático", acorde: "Amadeirado", genero: "Masculino", pais: "França",
    desc: "Toranja e incenso sobre cedro e sândalo. Elegante e versátil.",
    saida: ["Toranja", "Limão", "Hortelã"], coracao: ["Gengibre", "Noz-moscada", "Jasmim"], fundo: ["Incenso", "Cedro", "Sândalo", "Vetiver"],
    acordes: [["Amadeirado", 90], ["Cítrico", 74], ["Aromático", 60], ["Incenso", 52], ["Fresco", 50]], fix: 7.1, proj: 1.3, forma: "ret", tampa: "#141417", est: [78, 66, 74, 60], dia: [82, 62] }),
  p({ id: "oud-wood", nome: "Oud Wood", casa: "Tom Ford", ano: 2007, conc: "Eau de Parfum", perf: ["Richard Herpin"], familia: "Amadeirado especiado", acorde: "Amadeirado", genero: "Unissex", pais: "Estados Unidos",
    desc: "Oud macio com sândalo, cardamomo e um toque de baunilha.",
    saida: ["Cardamomo", "Pimenta-rosa"], coracao: ["Oud", "Sândalo", "Vetiver"], fundo: ["Tonka", "Baunilha", "Âmbar"],
    acordes: [["Amadeirado", 100], ["Oud", 82], ["Especiado", 60], ["Âmbar", 48], ["Baunilha", 36]], fix: 7, proj: 1.1, forma: "ret", tampa: "#B08D3C", est: [44, 20, 86, 90], dia: [40, 88] }),
  p({ id: "layton", nome: "Layton", casa: "Parfums de Marly", ano: 2016, perf: ["Hamid Merati-Kashani"], familia: "Oriental especiado", acorde: "Baunilha", genero: "Masculino", pais: "França",
    desc: "Maçã, lavanda e baunilha. Marcante, feito para noites amenas.",
    saida: ["Maçã", "Bergamota", "Lavanda"], coracao: ["Gerânio", "Violeta", "Jasmim"], fundo: ["Baunilha", "Cardamomo", "Pimenta", "Sândalo"],
    acordes: [["Baunilha", 90], ["Aromático", 70], ["Especiado", 64], ["Frutado", 52], ["Amadeirado", 44]], fix: 8.8, proj: 1.8, forma: "largo", tampa: "#B8963A", est: [60, 30, 90, 84], dia: [46, 90] }),
  p({ id: "le-male-elixir", nome: "Le Male Elixir", casa: "Jean Paul Gaultier", ano: 2023, perf: ["Quentin Bisch"], familia: "Oriental fougère", acorde: "Baunilha", genero: "Masculino", pais: "França",
    desc: "Lavanda, mel e tonka. Denso e doce.",
    saida: ["Lavanda", "Hortelã"], coracao: ["Mel", "Baunilha"], fundo: ["Tonka", "Benjoim", "Tabaco"],
    acordes: [["Baunilha", 92], ["Doce", 84], ["Aromático", 66], ["Mel", 60], ["Tabaco", 40]], fix: 9, proj: 1.9, forma: "redondo", tampa: "#9AA0A8", est: [40, 16, 84, 94], dia: [34, 94] }),
  p({ id: "khamrah", nome: "Khamrah", casa: "Lattafa", ano: 2022, perf: [], familia: "Oriental gourmand", acorde: "Baunilha", genero: "Unissex", pais: "Emirados Árabes", insp: "angels-share",
    desc: "Canela, tâmara e praliné. Um gourmand quente e licoroso.",
    saida: ["Canela", "Noz-moscada", "Bergamota"], coracao: ["Tâmara", "Praliné", "Tuberosa"], fundo: ["Baunilha", "Tonka", "Benjoim", "Mirra"],
    acordes: [["Doce", 96], ["Baunilha", 84], ["Especiado", 72], ["Âmbar", 60], ["Gourmand", 58]], fix: 9.2, proj: 1.8, forma: "redondo", tampa: "#B08D3C", est: [36, 12, 86, 96], dia: [30, 92] }),
  p({ id: "sauvage-elixir", nome: "Sauvage Elixir", casa: "Dior", ano: 2021, conc: "Elixir", perf: ["François Demachy"], familia: "Aromático especiado", acorde: "Especiado", genero: "Masculino", pais: "França",
    desc: "Lavanda, canela e alcaçuz em concentração alta.",
    saida: ["Toranja", "Canela", "Noz-moscada", "Cardamomo"], coracao: ["Lavanda"], fundo: ["Alcaçuz", "Sândalo", "Âmbar", "Patchouli"],
    acordes: [["Especiado", 92], ["Aromático", 80], ["Lavanda", 70], ["Amadeirado", 60], ["Âmbar", 50]], fix: 9.4, proj: 2.1, forma: "largo", tampa: "#141417", est: [50, 24, 86, 88], dia: [44, 88] }),
  p({ id: "br540", nome: "Baccarat Rouge 540", casa: "Maison Francis Kurkdjian", ano: 2015, perf: ["Francis Kurkdjian"], familia: "Âmbar floral", acorde: "Âmbar", genero: "Unissex", pais: "França",
    desc: "Açafrão, jasmim e âmbar cinzento. Aéreo e reconhecível.",
    saida: ["Açafrão", "Jasmim"], coracao: ["Âmbar cinzento", "Amberwood"], fundo: ["Cedro", "Resina de abeto"],
    acordes: [["Âmbar", 94], ["Amadeirado", 70], ["Doce", 60], ["Floral", 42], ["Mineral", 40]], fix: 8.6, proj: 1.7, forma: "ret", tampa: "#C9A227", est: [72, 50, 82, 70], dia: [62, 80] }),
  p({ id: "adg-profondo", nome: "Acqua di Giò Profondo", casa: "Giorgio Armani", ano: 2020, perf: ["Alberto Morillas"], familia: "Aquático aromático", acorde: "Aquático", genero: "Masculino", pais: "Itália",
    desc: "Notas marinhas, bergamota e patchouli. Fresco e mineral.",
    saida: ["Notas marinhas", "Bergamota", "Mandarina"], coracao: ["Alecrim", "Lavanda", "Cipreste"], fundo: ["Patchouli", "Almíscar", "Âmbar"],
    acordes: [["Aquático", 92], ["Aromático", 70], ["Cítrico", 64], ["Fresco", 60], ["Amadeirado", 40]], fix: 6.4, proj: 1.2, forma: "alto", tampa: "#2A2A30", est: [84, 92, 40, 16], dia: [90, 34] }),
  p({ id: "neroli-portofino", nome: "Neroli Portofino", casa: "Tom Ford", ano: 2011, conc: "Eau de Parfum", perf: ["Rodrigo Flores-Roux"], familia: "Cítrico aromático", acorde: "Cítrico", genero: "Unissex", pais: "Estados Unidos",
    desc: "Bergamota, neroli e âmbar. Mediterrâneo e luminoso.",
    saida: ["Bergamota", "Limão", "Mandarina"], coracao: ["Neroli", "Flor de laranjeira", "Jasmim"], fundo: ["Âmbar", "Almíscar", "Angélica"],
    acordes: [["Cítrico", 98], ["Floral", 60], ["Aromático", 54], ["Fresco", 50]], fix: 5.4, proj: 1.0, forma: "ret", tampa: "#6B4A2B", est: [86, 94, 30, 10], dia: [94, 26] }),

  // fora da coleção (semelhantes, lacunas, lançamentos)
  p({ id: "angels-share", nome: "Angels’ Share", casa: "Kilian", ano: 2020, perf: ["Benoist Lapouza"], familia: "Oriental gourmand", acorde: "Baunilha", genero: "Unissex", pais: "França", saida: ["Conhaque"], coracao: ["Canela", "Tonka", "Carvalho"], fundo: ["Praliné", "Baunilha", "Sândalo"], acordes: [["Doce", 90], ["Baunilha", 80], ["Especiado", 60]], fix: 8, proj: 1.5, forma: "ret", tampa: "#B08D3C" }),
  p({ id: "khamrah-qahwa", nome: "Khamrah Qahwa", casa: "Lattafa", ano: 2023, perf: [], familia: "Oriental gourmand", acorde: "Baunilha", genero: "Unissex", pais: "Emirados Árabes", insp: "angels-share", saida: ["Canela", "Cardamomo"], coracao: ["Café", "Praliné"], fundo: ["Baunilha", "Tonka"], acordes: [["Doce", 90], ["Café", 76], ["Baunilha", 70]], fix: 9, proj: 1.7, forma: "redondo", tampa: "#6B4A2B" }),
  p({ id: "supremacy-silver", nome: "Supremacy Silver", casa: "Afnan", ano: 2017, perf: [], familia: "Chipre frutado", acorde: "Frutado", genero: "Masculino", pais: "Emirados Árabes", insp: "aventus", saida: ["Abacaxi", "Bergamota"], coracao: ["Bétula", "Jasmim"], fundo: ["Almíscar", "Âmbar cinzento"], acordes: [["Frutado", 90], ["Amadeirado", 60], ["Almíscar", 50]], fix: 7, proj: 1.4, forma: "alto", tampa: "#C9D1DE" }),
  p({ id: "explorer", nome: "Explorer", casa: "Montblanc", ano: 2019, perf: ["Jordi Fernández", "Antoine Maisondieu"], familia: "Amadeirado aromático", acorde: "Amadeirado", genero: "Masculino", pais: "França", insp: "aventus", saida: ["Bergamota", "Pimenta-rosa"], coracao: ["Vetiver", "Couro"], fundo: ["Ambroxan", "Patchouli"], acordes: [["Amadeirado", 88], ["Cítrico", 50], ["Couro", 40]], fix: 6.5, proj: 1.2, forma: "ret", tampa: "#141417" }),
  p({ id: "absolu-aventus", nome: "Absolu Aventus", casa: "Creed", ano: 2023, perf: [], familia: "Chipre amadeirado", acorde: "Amadeirado", genero: "Masculino", pais: "França", desc: "A versão mais intensa do Aventus. Mais madeira e menos abacaxi.", saida: ["Abacaxi", "Bergamota", "Toranja"], coracao: ["Bétula", "Pimenta-rosa"], fundo: ["Âmbar cinzento", "Musgo de carvalho", "Patchouli"], acordes: [["Amadeirado", 90], ["Frutado", 80], ["Esfumaçado", 66], ["Almíscar", 40]], fix: 8.3, proj: 1.8, forma: "alto", tampa: "#141417", est: [60, 40, 84, 78], dia: [54, 80] }),
  p({ id: "aventus-cologne", nome: "Aventus Cologne", casa: "Creed", ano: 2019, perf: [], familia: "Cítrico aromático", acorde: "Cítrico", genero: "Masculino", pais: "França", saida: ["Mandarina", "Gengibre"], coracao: ["Vetiver", "Pimenta-rosa"], fundo: ["Almíscar", "Sândalo"], acordes: [["Cítrico", 86], ["Fresco", 70], ["Amadeirado", 50]], fix: 6, proj: 1.1, forma: "alto", tampa: "#C9D1DE" }),
  p({ id: "khamrah-dukhan", nome: "Khamrah Dukhan", casa: "Lattafa", ano: 2024, perf: [], familia: "Oriental gourmand", acorde: "Especiado", genero: "Unissex", pais: "Emirados Árabes", desc: "A versão esfumaçada do Khamrah. Mantém a tâmara e a baunilha e troca parte da doçura por incenso e tabaco.", saida: ["Incenso", "Canela"], coracao: ["Tâmara", "Tabaco"], fundo: ["Baunilha", "Benjoim"], acordes: [["Doce", 80], ["Esfumaçado", 76], ["Especiado", 70], ["Baunilha", 64]], fix: 9, proj: 1.8, forma: "redondo", tampa: "#6B4A2B" }),
  p({ id: "le-male-elixir-absolu", nome: "Le Male Elixir Absolu", casa: "Jean Paul Gaultier", ano: 2024, perf: [], familia: "Oriental fougère", acorde: "Baunilha", genero: "Masculino", pais: "França", desc: "Mais denso que o Le Male Elixir que você tem. Para noites frias.", saida: ["Lavanda"], coracao: ["Mel"], fundo: ["Tonka", "Baunilha"], acordes: [["Baunilha", 94], ["Doce", 90], ["Aromático", 50]], fix: 9.5, proj: 1.9, forma: "redondo", tampa: "#9AA0A8" }),
  p({ id: "erba-gold", nome: "Erba Gold", casa: "Xerjoff", ano: 2023, perf: [], familia: "Âmbar frutado", acorde: "Frutado", genero: "Unissex", pais: "Itália", desc: "Irmão do Erba Pura com fundo mais quente e dourado.", saida: ["Laranja", "Frutas"], coracao: ["Flor de laranjeira"], fundo: ["Âmbar", "Baunilha"], acordes: [["Frutado", 90], ["Âmbar", 70], ["Doce", 66]], fix: 8.6, proj: 1.8, forma: "redondo", tampa: "#B8963A" }),
  p({ id: "cdn-precieux", nome: "Club de Nuit Precieux", casa: "Armaf", ano: 2023, conc: "Extrait de Parfum", perf: [], familia: "Chipre frutado", acorde: "Frutado", genero: "Masculino", pais: "Emirados Árabes", desc: "Da mesma casa do seu Club de Nuit Intense, em versão extrait.", saida: ["Abacaxi"], coracao: ["Bétula"], fundo: ["Almíscar"], acordes: [["Frutado", 88], ["Esfumaçado", 60]], fix: 9, proj: 1.7, forma: "alto", tampa: "#C9D1DE" }),
  p({ id: "sauvage-eau-forte", nome: "Sauvage Eau Forte", casa: "Dior", ano: 2024, conc: "Parfum", perf: ["François Demachy"], familia: "Aromático", acorde: "Aquático", genero: "Masculino", pais: "França", desc: "Lavanda e cítricos na linha do seu Sauvage Elixir, bem mais leve.", saida: ["Lavanda", "Bergamota"], coracao: ["Laranja"], fundo: ["Âmbar"], acordes: [["Aromático", 86], ["Cítrico", 70], ["Fresco", 66]], fix: 6.6, proj: 1.3, forma: "largo", tampa: "#141417" }),
  p({ id: "portrait-lady", nome: "Portrait of a Lady", casa: "Frédéric Malle", ano: 2010, perf: ["Dominique Ropion"], familia: "Floral oriental", acorde: "Floral", genero: "Feminino", pais: "França", saida: ["Rosa", "Groselha-preta"], coracao: ["Patchouli", "Incenso"], fundo: ["Sândalo", "Almíscar"], acordes: [["Floral", 92], ["Patchouli", 70]], fix: 9, proj: 1.8, forma: "ret", tampa: "#141417" }),
  p({ id: "ombre-leather", nome: "Ombré Leather", casa: "Tom Ford", ano: 2018, perf: ["Sonia Constant"], familia: "Couro", acorde: "Couro", genero: "Unissex", pais: "Estados Unidos", saida: ["Cardamomo"], coracao: ["Couro", "Jasmim"], fundo: ["Âmbar", "Musgo"], acordes: [["Couro", 94], ["Especiado", 50]], fix: 8, proj: 1.4, forma: "ret", tampa: "#B08D3C" }),
  p({ id: "green-irish-tweed", nome: "Green Irish Tweed", casa: "Creed", ano: 1985, perf: ["Pierre Bourdon"], familia: "Verde aromático", acorde: "Verde", genero: "Masculino", pais: "França", saida: ["Folhas de violeta", "Limão"], coracao: ["Íris", "Violeta"], fundo: ["Sândalo", "Âmbar cinzento"], acordes: [["Verde", 90], ["Aromático", 70]], fix: 7, proj: 1.3, forma: "alto", tampa: "#C9D1DE" }),
  p({ id: "eau-sauvage", nome: "Eau Sauvage", casa: "Dior", ano: 1966, conc: "Eau de Toilette", perf: ["Edmond Roudnitska"], familia: "Cítrico aromático", acorde: "Cítrico", genero: "Masculino", pais: "França", saida: ["Limão", "Bergamota"], coracao: ["Alecrim", "Jasmim"], fundo: ["Vetiver", "Musgo de carvalho"], acordes: [["Cítrico", 92], ["Aromático", 70]], fix: 5, proj: 1, forma: "ret", tampa: "#141417" }),
  p({ id: "fleur-narcotique", nome: "Fleur Narcotique", casa: "Ex Nihilo", ano: 2014, perf: ["Olivier Pescheux"], familia: "Floral frutado", acorde: "Floral", genero: "Unissex", pais: "França", saida: ["Lichia", "Pêssego"], coracao: ["Peônia", "Jasmim"], fundo: ["Almíscar", "Musgo"], acordes: [["Floral", 90], ["Frutado", 70]], fix: 7, proj: 1.3, forma: "ret", tampa: "#C9A227" }),
  p({ id: "lust-in-paradise", nome: "Lust in Paradise", casa: "Ex Nihilo", ano: 2015, perf: [], familia: "Floral frutado", acorde: "Floral", genero: "Unissex", pais: "França", saida: ["Pera"], coracao: ["Peônia"], fundo: ["Almíscar"], acordes: [["Floral", 86], ["Frutado", 72]], fix: 7, proj: 1.2, forma: "ret", tampa: "#C9A227" }),
];

const d = (s: string) => new Date(s + "T12:00:00-04:00").toISOString();
const atras = (dias: number) => new Date(Date.now() - dias * 864e5).toISOString();

/** Os 13 frascos de exemplo. */
export const COLECAO: ItemColecao[] = [
  { id: "c1", perfumeId: "aventus", numero: 1, situacao: "assinatura", adicionadoEm: d("2022-03-10"), ultimoUso: atras(3), anotacao: "Meu primeiro nicho. Na pele a fumaça aparece mais que no papel. Melhor em dia quente, de manhã." },
  { id: "c2", perfumeId: "bleu-chanel", numero: 2, situacao: "tenho", adicionadoEm: d("2022-07-02"), ultimoUso: atras(9) },
  { id: "c3", perfumeId: "neroli-portofino", numero: 3, situacao: "tenho", adicionadoEm: d("2023-01-15"), ultimoUso: atras(45) },
  { id: "c4", perfumeId: "oud-wood", numero: 4, situacao: "tenho", adicionadoEm: d("2023-06-20"), ultimoUso: atras(60) },
  { id: "c5", perfumeId: "erba-pura", numero: 5, situacao: "tenho", adicionadoEm: d("2024-02-11"), ultimoUso: atras(20) },
  { id: "c6", perfumeId: "adg-profondo", numero: 6, situacao: "tenho", adicionadoEm: d("2024-05-08"), ultimoUso: atras(14) },
  { id: "c7", perfumeId: "br540", numero: 7, situacao: "tenho", adicionadoEm: d("2024-11-30"), ultimoUso: atras(11) },
  { id: "c8", perfumeId: "layton", numero: 8, situacao: "tenho", adicionadoEm: d("2025-04-19"), ultimoUso: atras(12) },
  { id: "c9", perfumeId: "blue-talisman", numero: 9, situacao: "tenho", adicionadoEm: d("2025-10-03"), ultimoUso: atras(6) },
  { id: "c10", perfumeId: "sauvage-elixir", numero: 10, situacao: "tenho", adicionadoEm: d("2026-08-02"), ultimoUso: atras(8) },
  { id: "c11", perfumeId: "le-male-elixir", numero: 11, situacao: "tenho", adicionadoEm: d("2026-08-10"), ultimoUso: atras(40) },
  { id: "c12", perfumeId: "cdni", numero: 12, situacao: "tenho", adicionadoEm: d("2026-08-28"), ultimoUso: atras(5) },
  { id: "c13", perfumeId: "khamrah", numero: 13, situacao: "tenho", adicionadoEm: d("2026-09-12"), ultimoUso: atras(4) },
  { id: "q1", perfumeId: "absolu-aventus", numero: 14, situacao: "quero", adicionadoEm: d("2026-09-22") },
];

export const LANCAMENTOS: Lancamento[] = [
  { perfumeId: "khamrah-dukhan", tipo: "FLANKER", ligacao: "khamrah", porque: "A versão esfumaçada do Khamrah, que você já tem. Mantém a tâmara e a baunilha e troca parte da doçura por incenso e tabaco. Puxa sua coleção para um lado que ainda é fraco nela: o fumo." },
  { perfumeId: "absolu-aventus", tipo: "VERSÃO NOVA", ligacao: "aventus", porque: "A versão mais intensa do Aventus. Mais madeira e menos abacaxi." },
  { perfumeId: "le-male-elixir-absolu", tipo: "FLANKER", ligacao: "le-male-elixir", porque: "Mais denso que o Le Male Elixir que você tem. Para noites frias." },
  { perfumeId: "erba-gold", tipo: "FLANKER", ligacao: "erba-pura", porque: "Irmão do Erba Pura com fundo mais quente e dourado." },
  { perfumeId: "cdn-precieux", tipo: "INSPIRADO", ligacao: "cdni", porque: "Da mesma casa do seu Club de Nuit Intense, em versão extrait." },
  { perfumeId: "sauvage-eau-forte", tipo: "PARECIDO", ligacao: "sauvage-elixir", porque: "Lavanda e cítricos na linha do seu Sauvage Elixir, bem mais leve." },
];

/** Para cada lacuna do DNA, um perfume para começar. */
export const SUGESTAO_LACUNA: Record<string, string> = {
  Floral: "portrait-lady",
  Couro: "ombre-leather",
  Verde: "green-irish-tweed",
  Clássico: "eau-sauvage",
};
