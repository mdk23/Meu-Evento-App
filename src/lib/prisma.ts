import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaTransaction: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

/**
 * Dedicated client for `$transaction(async (tx) => ...)` interactive transactions.
 * `DATABASE_URL` goes through Neon's pooled/PgBouncer endpoint, which doesn't reliably
 * hold one physical connection open across a transaction's multiple round trips —
 * that surfaces as "Transaction not found... refers to an old closed transaction".
 * Interactive transactions must run over the direct (non-pooled) connection instead.
 */
export const prismaTransaction =
  globalForPrisma.prismaTransaction ??
  new PrismaClient({
    datasourceUrl: process.env.DIRECT_URL,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaTransaction = prismaTransaction;
}
