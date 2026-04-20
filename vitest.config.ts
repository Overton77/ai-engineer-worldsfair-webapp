import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["lib/**/*.test.{ts,tsx}", "components/**/*.test.{ts,tsx}"],
    css: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // Stub Next.js' server-only guard in unit tests; the module is a
      // dev-time barrier, not runtime behaviour.
      "server-only": fileURLToPath(
        new URL("./vitest.server-only-stub.ts", import.meta.url),
      ),
    },
  },
});
