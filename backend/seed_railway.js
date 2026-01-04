const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Connessione DIRETTA a Railway
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd@hopper.proxy.rlwy.net:48529/railway'
    }
  }
});

async function main() {
  console.log('Seeding Railway database...');

  // Hash password
  const passwordHash = await bcrypt.hash('demo123', 12);
  console.log('Password hash created');

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ischiafishing.it',
      passwordHash: passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true
    }
  });

  console.log('Admin user created:');
  console.log('- ID:', admin.id);
  console.log('- Email:', admin.email);
  console.log('- Role:', admin.role);

  // Verify count
  const count = await prisma.user.count();
  console.log('\nTotal users now:', count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
