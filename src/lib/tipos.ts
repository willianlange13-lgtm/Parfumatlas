export type Situacao = "tenho" | "tive" | "quero" | "assinatura";
export type Forma = "alto" | "ret" | "redondo" | "largo";

export interface Votos {
  total: number;
  /** muito fraca, fraca, moderada, duradoura, muito longa (%) */
  fixacao: [number, number, number, number, number];
  /** íntima, moderada, forte, enorme (%) */
  projecao: [number, number, number, number];
  estacoes: { primavera: number; verao: number; outono: number; inverno: number };
  dia: number;
  noite: number;
  ocasioes: { nome: string; v: number }[];
  /** "fragrantica" quando veio da contagem real; "estimativa" quando a IA estimou pelas resenhas */
  origem?: "fragrantica" | "estimativa";
}

export interface PontoClima { t: number; h: number; seco: boolean }

export interface Perfume {
  id: string;
  nome: string;
  casa: string;
  ano?: number;
  concentracao?: string;
  perfumistas: string[];
  familia: string;
  acorde: string;
  genero?: string;
  pais?: string;
  descricao?: string;
  notas: { saida: string[]; coracao: string[]; fundo: string[] };
  acordes: { nome: string; valor: number }[];
  fixacaoH?: number;
  projecaoM?: number;
  votos?: Votos;
  clima?: { n: number; pontos: PontoClima[] };
  forma: Forma;
  tampa: string;
  inspiradoEm?: string;
  /** Parecidos segundo o Fragrantica e a comunidade (perfumes que podem não estar no catálogo). */
  /** outros perfumes da mesma marca (seção "Designer" do Fragrantica) */
  mesmaCasa?: { nome: string; link?: string | null; imagem?: string | null }[];
  parecidos?: { nome: string; casa: string; tipo: "inspirou" | "clone" | "parecido"; pct: number; fonte?: string | null; trecho?: string | null; link?: string | null; imagem?: string | null }[];
  imagem?: string | null;
  fontes?: { nome: string; url?: string; oQue: string }[];
  revisar?: string[];
}

export interface ItemColecao {
  id: string;
  perfumeId: string;
  numero: number;
  situacao: Situacao;
  adicionadoEm: string;
  ultimoUso?: string | null;
  anotacao?: string | null;
  foto?: string | null;
  minhaFixacao?: number | null;
  minhaProjecao?: number | null;
  minhaNota?: number | null;
}

export interface Lancamento {
  perfumeId: string;
  tipo: "FLANKER" | "VERSÃO NOVA" | "INSPIRADO" | "PARECIDO";
  ligacao: string;
  porque: string;
}

export interface Entrada extends ItemColecao {
  perfume: Perfume;
}
