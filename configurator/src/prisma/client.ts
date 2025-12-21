import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Singleton Prisma client for reuse across the app.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
  adapter?: PrismaPg;
};

const allowInsecureTls = ["1", "true", "yes"].includes(
  (process.env.ALLOW_INSECURE_TLS ?? "").toLowerCase(),
);

const resolvePgConnection = (connectionString: string | undefined) => {
  if (!connectionString) return { connectionString: undefined, ssl: undefined as Pool["options"]["ssl"] };

  // `pg` parses `sslmode` from the connection string and will override the `ssl`
  // option we pass in. To control behavior, we strip `sslmode` from the string
  // and map it ourselves.
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode")?.toLowerCase();
    url.searchParams.delete("sslmode");

    // If connecting to Supabase (or any host containing "supabase"),
    // force SSL but skip certificate validation to avoid SELF_SIGNED_CERT_IN_CHAIN.
    const isSupabase = url.hostname.includes("supabase");

    const ssl = (() => {
      if (allowInsecureTls || isSupabase) return { rejectUnauthorized: false };
      if (sslmode === "disable") return undefined;
      if (sslmode === "require") return { rejectUnauthorized: false };
      if (sslmode?.startsWith("verify")) return { rejectUnauthorized: true };
      return undefined;
    })();

    return { connectionString: url.toString(), ssl };
  } catch {
    return { connectionString, ssl: allowInsecureTls ? { rejectUnauthorized: false } : undefined };
  }
};

const { connectionString, ssl } = resolvePgConnection(process.env.DATABASE_URL ?? process.env.DIRECT_URL);

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    ssl,
  });

const adapter = globalForPrisma.adapter ?? new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
  globalForPrisma.adapter = adapter;
}

export type PrismaTx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
