import { carregarAcervo } from "@/lib/dados";
import { hm } from "@/lib/analise";

/** Exporta a coleção como planilha (CSV, abre no Excel e no Google Planilhas). */
export async function GET() {
  const { colecao } = await carregarAcervo();
  const cab = ["Nº", "Perfume", "Casa", "Ano", "Concentração", "Família", "Situação", "Saída", "Coração", "Fundo", "Fixação", "Projeção", "Adicionado em", "Anotação"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const linhas = [...colecao].sort((a, b) => a.numero - b.numero).map((e) => [
    e.numero, e.perfume.nome, e.perfume.casa, e.perfume.ano ?? "", e.perfume.concentracao ?? "", e.perfume.familia, e.situacao,
    e.perfume.notas.saida.join(", "), e.perfume.notas.coracao.join(", "), e.perfume.notas.fundo.join(", "),
    e.perfume.fixacaoH ? hm(e.perfume.fixacaoH) : "", e.perfume.projecaoM ? `${e.perfume.projecaoM} m` : "", e.adicionadoEm.slice(0, 10), e.anotacao ?? "",
  ].map(esc).join(";"));
  const csv = "﻿" + [cab.map(esc).join(";"), ...linhas].join("\r\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="parfum-atlas-colecao.csv"' } });
}
