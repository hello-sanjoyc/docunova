import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import env from './env';

// Use explicit runtime datasource URL for app execution.
// (prisma.config.ts is used by CLI commands like migrate/generate.)
const log: Prisma.LogLevel[] =
  env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'];

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const prisma = new PrismaClient({
  log,
  adapter,
});

export default prisma;
