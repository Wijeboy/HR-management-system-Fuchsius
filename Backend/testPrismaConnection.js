import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('🎉 Prisma successfully connected to MongoDB!');
  } catch (error) {
    console.error('❌ Prisma failed to connect to MongoDB:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();