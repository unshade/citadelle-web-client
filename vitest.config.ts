import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node 20+ has globalThis.crypto, File, TextEncoder/TextDecoder built in
    environment: "node",
    globals: true,
  },
});
