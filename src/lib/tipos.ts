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
  /** "fragrantica" quando veio da contagem real; "estimativa" quando a IA estimou pelas resenhas; "acervo" = só o nível mais votado */
  origem?: "fragrantica" | "estimativa" | "acervo";
  /** só com origem "acervo": nível mais votado no Fragrantica (sem distribuição) */
  nivelFixacao?: string;
  nivelProjecao?: string;
  /** quando a IA completou o que o acervo deixou vazio (não repete a cada visita) */
  completadoEm?: string;
  /** nível de fixação/projeção estimado pelas resenhas (perfume novo, sem votos no Fragrantica); não vai para o acervo */
  estimado?: boolean;
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
  parecidos?: { nome: string; casa: string; tipo: "inspirou" | "clone" | "parecido"; pct: number; fonte?: string | null; trecho?: string | null; link?: string | null; imagem?: string | null;
    /** faixa de parentesco ("88–92%"), tipo de relação, ⭐ fora do radar, semelhança e diferença */
    faixa?: string | null; relacao?: string | null; radar?: boolean; relevancia?: number; semelhanca?: string | null; diferenca?: string | null }[];
  /** pesquisa de semelhantes em andamento na OpenAI (código e hora de início) */
  buscaParecidos?: { id: string; inicio: number } | null;
  /** original que este perfume imita (chave para reaproveitar a pesquisa) */
  dnaOriginal?: string | null;
  /** de onde veio a ficha: "acervo" (lote importado, sem custo) ou "ia" (pesquisa paga) */
  fonteFicha?: "acervo" | "ia" | null;
  /** só no cadastro: a ficha já estava salva e foi reaproveitada (sem custo) */
  reaproveitada?: boolean;
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
  /** dias em que foi usado ("Usar hoje"), do mais recente ao mais antigo */
  usos?: string[];
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
