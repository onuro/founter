import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Reset Prisma connection (useful after database restore)
export async function resetPrismaConnection(): Promise<void> {
  await prisma.$disconnect();
  // Force a new connection on next query
  await prisma.$connect();
}
