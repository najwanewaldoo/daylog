import { defineConfig } from "drizzle-kit";

// Optional: the app creates its tables automatically on first use.
// Use `npx drizzle-kit push` only if you want drizzle-kit to manage the schema.
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file:./data/daylog.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
