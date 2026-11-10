import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Tests always use an isolated local SQLite file, never the Turso database.
    env: {
      TURSO_DATABASE_URL: "file:./data/test.db",
      TURSO_AUTH_TOKEN: "",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
