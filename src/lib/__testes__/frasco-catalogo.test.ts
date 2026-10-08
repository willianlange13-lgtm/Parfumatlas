import { describe, expect, it } from "vitest";
import { frascoDoCatalogo } from "@/lib/frasco-catalogo";

describe("frascoDoCatalogo", () => {
  it("acha o frasco pela casa e pelo nome, ignorando 'Perfumes' e acentos", () => {
    expect(frascoDoCatalogo("Lattafa Perfumes", "Khamrah Qahwa")).toMatch(/^\/frascos\/\d+\.webp$/);
    expect(frascoDoCatalogo("Maison Alhambra", "Glacier Pour Homme")).toMatch(/^\/frascos\/\d+\.webp$/);
  });
  it("aceita o nome sem a cor entre parênteses", () => {
    expect(frascoDoCatalogo("Afnan", "9pm Femme")).toBe(frascoDoCatalogo("Afnan", "9PM FEMME (PURPLE)"));
  });
  it("não inventa: casa ou nome diferentes não casam", () => {
    expect(frascoDoCatalogo("Creed", "Aventus")).toBeNull();
    expect(frascoDoCatalogo("Lattafa", "Khamrah Qahwa Extra Inexistente")).toBeNull();
    expect(frascoDoCatalogo("Lattafa", "Khamrah")).toBeNull(); // só existem as versões Qahwa, Dukhan e Waha
    expect(frascoDoCatalogo(null, "Khamrah Qahwa")).toBeNull();
  });
});
