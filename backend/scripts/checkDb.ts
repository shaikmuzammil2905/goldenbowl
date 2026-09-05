import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dps = await prisma.deliveryPartner.findMany();
  console.log("Delivery Partners in DB:", dps);
  
  const addrs = await prisma.savedAddress.findMany();
  console.log("Saved Addresses in DB:", addrs);

  const orders = await prisma.order.findMany({
    include: { items: true, branch: true }
  });
  console.log("Orders in DB:", orders);

  const issues = await prisma.supportIssue.findMany();
  console.log("Issues in DB:", issues);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
