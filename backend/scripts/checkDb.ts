import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dps = await prisma.deliveryPartner.findMany();
  console.log("Delivery Partners in DB:", dps);
  
  const addrs = await prisma.savedAddress.findMany();
  console.log("Saved Addresses in DB:", addrs);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
