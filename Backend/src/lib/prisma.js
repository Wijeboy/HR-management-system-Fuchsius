import { PrismaClient } from "@prisma/client";

const normalizeMongoUrl = (value) => {
  if (!value) return "";

  try {
    const url = new URL(value);

    // Prisma's MongoDB connector expects a database name in the URL path.
    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/hrms";
    }

    return url.toString();
  } catch {
    return value;
  }
};

if (!process.env.DATABASE_URL && process.env.MONGO_URI) {
  process.env.DATABASE_URL = normalizeMongoUrl(process.env.MONGO_URI);
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
