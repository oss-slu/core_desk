import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "#prisma-client";

const normalizeConnectionString = (rawUrl) => {
  if (!rawUrl) return rawUrl;

  const url = new URL(rawUrl);
  const sslmode = url.searchParams.get("sslmode");

  // Prisma v7 uses pg adapter semantics; preserve classic libpq "require" behavior.
  if (sslmode === "require" && !url.searchParams.has("uselibpqcompat")) {
    url.searchParams.set("uselibpqcompat", "true");
  }

  return url.toString();
};

const adapter = new PrismaPg({
  connectionString: normalizeConnectionString(process.env.DATABASE_URL),
});

export const prisma = new PrismaClient({ adapter });
export default prisma;
