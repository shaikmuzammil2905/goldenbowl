import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const PASSWORD_SALT = process.env.PASSWORD_SALT || 'goldenbowl_password_salt_2026';

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, PASSWORD_SALT, 10000, 64, 'sha512').toString('hex');
}

async function main() {
  const adminPasswordHash = hashPassword('GoldenBowl2026!');

  console.log('Seeding Master Admin, Support, and Delivery users in AWS RDS...');

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@goldenbowl.com' },
    update: {
      password: adminPasswordHash,
      role: 'ADMIN',
      name: 'Golden Admin',
    },
    create: {
      email: 'admin@goldenbowl.com',
      password: adminPasswordHash,
      role: 'ADMIN',
      name: 'Golden Admin',
      provider: 'email',
    },
  });
  console.log('Admin user ready:', admin.email, 'Role:', admin.role);

  // 2. Support User
  const support = await prisma.user.upsert({
    where: { email: 'support@goldenbowl.com' },
    update: {
      password: adminPasswordHash,
      role: 'SUPPORT',
      name: 'Golden Support',
    },
    create: {
      email: 'support@goldenbowl.com',
      password: adminPasswordHash,
      role: 'SUPPORT',
      name: 'Golden Support',
      provider: 'email',
    },
  });
  console.log('Support user ready:', support.email, 'Role:', support.role);

  // 3. Support Agent Alias (for agent@goldenbowl.com placeholder in UI)
  const agent = await prisma.user.upsert({
    where: { email: 'agent@goldenbowl.com' },
    update: {
      password: adminPasswordHash,
      role: 'SUPPORT',
      name: 'Support Agent',
    },
    create: {
      email: 'agent@goldenbowl.com',
      password: adminPasswordHash,
      role: 'SUPPORT',
      name: 'Support Agent',
      provider: 'email',
    },
  });
  console.log('Support agent ready:', agent.email, 'Role:', agent.role);

  // 4. Delivery Partner User
  const delivery = await prisma.user.upsert({
    where: { email: 'delivery@goldenbowl.com' },
    update: {
      password: adminPasswordHash,
      role: 'DELIVERY',
      name: 'Golden Delivery',
      mobile: '9876543210',
    },
    create: {
      email: 'delivery@goldenbowl.com',
      password: adminPasswordHash,
      role: 'DELIVERY',
      name: 'Golden Delivery',
      mobile: '9876543210',
      provider: 'mobile',
    },
  });
  console.log('Delivery user ready:', delivery.email, 'Role:', delivery.role);

  console.log('Database master users setup complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
