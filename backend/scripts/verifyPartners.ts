import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Verifying all delivery partners...')
  
  const result = await prisma.deliveryPartner.updateMany({
    data: {
      verificationStatus: 'VERIFIED',
      documentsVerified: true
    }
  })

  console.log(`Verified ${result.count} delivery partners.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
