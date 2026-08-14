import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts", // Tambahkan baris seed di sini jika ingin melakukan seed
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});