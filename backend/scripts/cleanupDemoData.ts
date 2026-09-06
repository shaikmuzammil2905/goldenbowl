import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting demo data cleanup...')
  
  // Clean up delivery partners with dummy data
  // e.g., emails ending in @demo.com or explicit dummy names
  const result = await prisma.deliveryPartner.deleteMany({
    where: {
      user: {
        email: {
          endsWith: '@demo.com' // Adjust this logic as needed
        }
      }
    }
  })

  console.log(`Deleted ${result.count} demo delivery partners.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
