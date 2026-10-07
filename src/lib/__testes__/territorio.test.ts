import { describe, expect, it } from "vitest";
import { territorio } from "@/lib/territorio";

describe("territórios olfativos (DECISOES §18)", () => {
  it("oud nos acordes pesa mais que a família", () => expect(territorio("Floral", [{ nome: "Oud" }]).nome).toBe("bronze"));
  it("família cítrica vira mineral", () => expect(territorio("Cítrica").nome).toBe("mineral"));
  it("sem família cai no neutro da marca", () => expect(territorio(null).nome).toBe("menta"));
});
