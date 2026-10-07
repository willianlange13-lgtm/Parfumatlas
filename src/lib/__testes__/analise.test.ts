import { describe, expect, it } from "vitest";
import { COLECAO, PERFUMES } from "@/data/catalogo";
import { adequacao, afinidade, classe, diasDesde, dna, esquecidos, naColecao, perfumeDoDia, similaridade } from "@/lib/analise";
import type { Entrada } from "@/lib/tipos";

const porId = new Map(PERFUMES.map((p) => [p.id, p]));
const colecao: Entrada[] = COLECAO.map((c) => ({ ...c, perfume: porId.get(c.perfumeId)! }));

describe("contagens da coleção", () => {
  it("naColecao só conta tenho e assinatura", () => {
    expect(naColecao(colecao).every((e) => e.situacao === "tenho" || e.situacao === "assinatura")).toBe(true);
  });
  it("diasDesde sem data é zero e nunca negativo", () => {
    expect(diasDesde(null)).toBe(0);
    expect(diasDesde(new Date(Date.now() + 5 * 864e5).toISOString())).toBe(0);
  });
  it("esquecidos vêm do mais parado para o menos", () => {
    const e = esquecidos(colecao);
    for (let i = 1; i < e.length; i++) expect(e[i - 1].dias).toBeGreaterThanOrEqual(e[i].dias);
  });
});

describe("DNA e afinidade", () => {
  it("o DNA tem os 8 eixos entre 0 e 100", () => {
    const d = dna(colecao);
    expect(d.eixos).toHaveLength(8);
    d.eixos.forEach((e) => { expect(e.v).toBeGreaterThanOrEqual(0); expect(e.v).toBeLessThanOrEqual(100); });
  });
  it("afinidade fica entre 0 e 100", () => {
    PERFUMES.forEach((p) => { const a = afinidade(p, colecao); expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThanOrEqual(100); });
  });
  it("um perfume é idêntico a si mesmo", () => {
    const p = PERFUMES[0];
    expect(similaridade(p, p)).toBeGreaterThanOrEqual(similaridade(p, PERFUMES[1]));
  });
  it("a classe do colecionador tem nome e total coerente", () => {
    const c = classe(colecao);
    expect(c.nome).toBeTruthy();
    expect(c.total).toBe(naColecao(colecao).length);
  });
});

describe("perfume do dia", () => {
  it("adequação é um número finito", () => {
    PERFUMES.forEach((p) => expect(Number.isFinite(adequacao(p, 32, 30))).toBe(true));
  });
  it("sugere um perfume que está na coleção, com o porquê", () => {
    const r = perfumeDoDia(colecao, 31, 30);
    expect(r).not.toBeNull();
    expect(naColecao(colecao).map((e) => e.perfumeId)).toContain(r!.entrada.perfumeId);
    expect(r!.porque).toMatch(/^Calor seco/);
  });
  it("coleção vazia não sugere nada", () => expect(perfumeDoDia([], 25, 50)).toBeNull());
});
