import "server-only";
import { completarFicha, type FichaIA } from "@/lib/ficha";
import { linhaDoPerfume } from "@/lib/dados";
import { guardarNoAcervo } from "@/lib/acervo-global";
import type { Perfume } from "@/lib/tipos";

type Cliente = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

/** Junta à ficha salva o que a IA completou: só entra onde a ficha ainda está vazia (docs/DECISOES.md §23). */
export function juntarCompletado(perfume: Perfume, b: Partial<Perfume>): Perfume {
  const n = perfume.notas;
  return {
    ...perfume,
    parecidos: b.parecidos?.length ? b.parecidos : perfume.parecidos,
    mesmaCasa: b.mesmaCasa?.length ? b.mesmaCasa : perfume.mesmaCasa,
    votos: b.votos ?? perfume.votos,
    fixacaoH: b.fixacaoH ?? perfume.fixacaoH,
    projecaoM: b.projecaoM ?? perfume.projecaoM,
    ano: perfume.ano ?? b.ano,
    concentracao: perfume.concentracao || b.concentracao,
    genero: perfume.genero || b.genero,
    descricao: perfume.descricao || b.descricao,
    pais: perfume.pais || b.pais,
    perfumistas: perfume.perfumistas.length ? perfume.perfumistas : (b.perfumistas ?? []),
    familia: perfume.familia || b.familia || perfume.familia,
    notas: { saida: n.saida.length ? n.saida : (b.notas?.saida ?? []), coracao: n.coracao.length ? n.coracao : (b.notas?.coracao ?? []), fundo: n.fundo.length ? n.fundo : (b.notas?.fundo ?? []) },
    // a IA só devolve acordes diferentes quando faltavam ou quando trouxe a força real da barra
    acordes: b.acordes?.length ? b.acordes : perfume.acordes,
    acorde: b.acordes?.length && b.acorde ? b.acorde : perfume.acorde,
    imagem: perfume.imagem ?? b.imagem,
  };
}

/** A ficha do acervo ainda tem buraco que a IA pode tapar? */
export function temBuraco(p: Perfume): boolean {
  const v = p.votos;
  return !p.ano || !p.concentracao || !p.genero || !p.pais || !p.descricao || !p.perfumistas.length
    || !p.notas.saida.length || !p.notas.coracao.length || !p.notas.fundo.length || !p.acordes.length
    || !v?.estacoes || Object.values(v.estacoes).every((x) => !x) || !v.fixacao?.some((x) => x > 0);
}

/**
 * Ficha salva que veio do acervo e ficou com campos vazios: completa em segundo plano, uma vez só
 * (marca `votos.completadoEm`), e guarda o resultado também no acervo para os próximos.
 */
export async function completarSalvo(sb: Cliente, p: Perfume): Promise<void> {
  if (p.fonteFicha !== "acervo" || p.votos?.completadoEm || !temBuraco(p)) return;
  const base: FichaIA = { ...p, revisar: [], completar: true };
  const pronta = await completarFicha(base);
  const novo = juntarCompletado(p, pronta);
  novo.votos = { ...(novo.votos ?? pronta.votos!), completadoEm: pronta.votos?.completadoEm ?? new Date().toISOString() };
  const { error } = await sb.from("perfumes").update(linhaDoPerfume(novo)).eq("id", p.id);
  if (error) console.error("[atlas:completar_salvo]", p.nome, error.message);
  else await guardarNoAcervo({ ...pronta, ...novo, revisar: [] } as FichaIA).catch(() => null);
}
