import { corDoAcorde } from "@/lib/cores";
import { hexA, t } from "@/desenho/h2";
import type { Entrada, Perfume } from "@/lib/tipos";

const FORM: Record<string, [number, number, string, number]> = { alto: [54, 104, "9px", 0.5], ret: [70, 86, "11px", 0.48], redondo: [84, 78, "40px", 0.4], largo: [92, 70, "12px", 0.42] };

/** Card da vitrine (frasco grande). */
export function itemVitrine(p: Perfume, extra: { rel?: string; assin?: boolean; href?: string; situacao?: string; foto?: string | null; numero?: number; adicionado?: string; dias?: number } = {}) {
  const cor = corDoAcorde(p.acorde), f = FORM[p.forma] ?? FORM.ret;
  const curto = p.nome.length > 13 ? p.nome.split(" ").slice(0, 2).join(" ") : p.nome;
  const notas = [p.notas.saida[0], p.notas.coracao[0], p.notas.fundo[0]].filter(Boolean);
  return {
    id: p.id, nome: p.nome, marca: p.casa, marcaUp: p.casa.toUpperCase(), acorde: p.acorde, fam: p.familia, genero: p.genero ?? "—", notas: notas.join(" · "),
    corFam: cor, rel: extra.rel ?? "", assin: !!extra.assin, tampa: p.tampa,
    bw: f[0], bh: f[1], br: f[2], capW: Math.round(f[0] * f[3]), capH: 24, neckW: Math.round(f[0] * 0.22), lw: f[0] - 14, lh: Math.min(40, Math.round(f[1] * 0.42)),
    rotMarca: p.casa.split(" ")[0].toUpperCase().slice(0, 8), rotNome: curto,
    sombra: f[0] + 30, sombraM: Math.round((f[0] + 30) / 2),
    palco: `radial-gradient(ellipse at 50% 85%, ${hexA(cor, 0.22)} 0%, ${hexA(cor, 0.06)} 55%, ${t.surface} 100%)`,
    vidro: `linear-gradient(115deg, rgba(255,255,255,.38) 0%, ${hexA(cor, 0.3)} 38%, ${hexA(cor, 0.55)} 100%)`,
    href: extra.href ?? `/colecao/${p.id}`,
    situacao: extra.situacao ?? "",
    forma: p.forma, foto: extra.foto ?? p.imagem ?? null, oficial: !extra.foto && Boolean(p.imagem), numero: extra.numero ?? 0, adicionado: extra.adicionado ?? "", dias: extra.dias ?? 0,
    busca: [p.nome, p.casa, p.familia, ...p.notas.saida, ...p.notas.coracao, ...p.notas.fundo].join(" ").toLowerCase(),
  };
}

export function rotuloRelacao(e: Entrada, todos: Entrada[]) {
  const ids = new Set(todos.map((x) => x.perfume.id));
  if (e.perfume.inspiradoEm) return "Inspirado";
  if (todos.some((x) => x.perfume.inspiradoEm === e.perfume.id)) return "Original";
  return ids.size ? "" : "";
}
