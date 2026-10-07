import { describe, expect, it } from "vitest";
import { acordePrincipal, chaveAcorde, horasDosVotos, mesmoAcorde, metrosDosVotos, NIVEIS_FIXACAO, NIVEIS_PROJECAO, temVotos } from "@/lib/normalizar";

describe("acordes com nomes diferentes que querem dizer o mesmo (DECISOES §26)", () => {
  it("almíscar e almiscarado", () => expect(mesmoAcorde("Almíscar", "Almiscarado")).toBe(true));
  it("madeira e amadeirado", () => expect(mesmoAcorde("Madeira", "Amadeirado")).toBe(true));
  it("não junta acordes diferentes", () => expect(mesmoAcorde("Floral", "Frutado")).toBe(false));
  it("palavra curta fica inteira", () => expect(chaveAcorde("Oud")).toBe("oud"));
});

describe("acorde principal do Atlas", () => {
  it("mapeia acordes do Fragrantica", () => {
    expect(acordePrincipal("Oud")).toBe("Amadeirado");
    expect(acordePrincipal("Doce")).toBe("Baunilha");
    expect(acordePrincipal("Marinho")).toBe("Aquático");
  });
  it("desconhecido cai em Aromático", () => expect(acordePrincipal("Inventado")).toBe("Aromático"));
});

describe("régua única de fixação e projeção", () => {
  it("100% num nível dá exatamente as horas desse nível", () => {
    NIVEIS_FIXACAO.forEach((n, i) => expect(horasDosVotos([0, 0, 0, 0, 0].map((_, j) => (j === i ? 100 : 0)))).toBe(n.h));
  });
  it("100% num nível dá exatamente os metros desse nível", () => {
    NIVEIS_PROJECAO.forEach((n, i) => expect(metrosDosVotos([0, 0, 0, 0].map((_, j) => (j === i ? 100 : 0)))).toBe(n.m));
  });
  it("votos zerados não contam como votos", () => {
    expect(temVotos([0, 0, 0])).toBe(false);
    expect(temVotos(undefined)).toBe(false);
    expect(temVotos([0, 3, 0])).toBe(true);
  });
});
