import path from "path";
import { defineConfig } from "prisma/config";

// Development: pakai SQLite lokal, Production (Vercel): pakai Turso
const dbUrl =
  process.env.TURSO_DATABASE_URL ??
  `file:${path.join(process.cwd(), "dev.db")}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbUrl,
  },
});
