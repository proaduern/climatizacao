import { PrismaClient } from '@prisma/client';

declare global {
  var prismaClimaGlobal: PrismaClient | undefined;
}

export const prisma = globalThis.prismaClimaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaClimaGlobal = prisma;
}

export default prisma;
