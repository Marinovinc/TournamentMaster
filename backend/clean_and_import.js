const { PrismaClient } = require('@prisma/client');

// Database RAILWAY
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd@hopper.proxy.rlwy.net:48529/railway'
    }
  }
});

async function main() {
  console.log('Cleaning Railway database...\n');

  // Disable FK checks
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;

  // Delete all data in reverse dependency order
  console.log('Deleting catches...');
  await prisma.$executeRaw`DELETE FROM catches`;

  console.log('Deleting leaderboard_entries...');
  await prisma.$executeRaw`DELETE FROM leaderboard_entries`;

  console.log('Deleting strikes...');
  await prisma.$executeRaw`DELETE FROM strikes`;

  console.log('Deleting documents...');
  await prisma.$executeRaw`DELETE FROM documents`;

  console.log('Deleting audit_logs...');
  await prisma.$executeRaw`DELETE FROM audit_logs`;

  console.log('Deleting team_members...');
  await prisma.$executeRaw`DELETE FROM team_members`;

  console.log('Deleting teams...');
  await prisma.$executeRaw`DELETE FROM teams`;

  console.log('Deleting tournament_staff...');
  await prisma.$executeRaw`DELETE FROM tournament_staff`;

  console.log('Deleting tournament_registrations...');
  await prisma.$executeRaw`DELETE FROM tournament_registrations`;

  console.log('Deleting tournament_species...');
  await prisma.$executeRaw`DELETE FROM tournament_species`;

  console.log('Deleting fishing_zones...');
  await prisma.$executeRaw`DELETE FROM fishing_zones`;

  console.log('Deleting tournaments...');
  await prisma.$executeRaw`DELETE FROM tournaments`;

  console.log('Deleting refresh_tokens...');
  await prisma.$executeRaw`DELETE FROM refresh_tokens`;

  console.log('Deleting users...');
  await prisma.$executeRaw`DELETE FROM users`;

  console.log('Deleting species...');
  await prisma.$executeRaw`DELETE FROM species`;

  console.log('Deleting tenants...');
  await prisma.$executeRaw`DELETE FROM tenants`;

  // Re-enable FK checks
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;

  console.log('\nDatabase cleaned!');

  // Verify
  console.log('\nCounts after cleaning:');
  console.log('- Users:', await prisma.user.count());
  console.log('- Tenants:', await prisma.tenant.count());
  console.log('- Tournaments:', await prisma.tournament.count());
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
