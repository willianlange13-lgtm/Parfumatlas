import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "server-only" quebra fora do servidor do Next; nos testes vira um módulo vazio
      "server-only": fileURLToPath(new URL("./src/lib/__testes__/vazio.ts", import.meta.url)),
    },
  },
  test: { include: ["src/**/*.test.ts"] },
});
