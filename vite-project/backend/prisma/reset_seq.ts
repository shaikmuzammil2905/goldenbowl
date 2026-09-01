import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const maxProduct = await prisma.product.aggregate({ _max: { id: true } });
  const maxId = maxProduct._max.id || 15;
  console.log(`Current max product ID: ${maxId}`);
  await prisma.$executeRawUnsafe(`SELECT setval('products_id_seq', ${maxId})`);
  console.log(`Successfully updated products_id_seq sequence to ${maxId}!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
