const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Database RAILWAY
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd@hopper.proxy.rlwy.net:48529/railway'
    }
  }
});

async function main() {
  console.log('Disabling foreign key checks...');
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;

  console.log('Reading SQL dump...');
  const sql = fs.readFileSync('data_export.sql', 'utf8');

  // Split into statements
  const statements = sql
    .split(/;[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`Found ${statements.length} statements to execute\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.length < 10) continue;

    // Skip problematic statements
    if (stmt.includes('LOCK TABLES') || stmt.includes('UNLOCK TABLES')) {
      continue;
    }

    try {
      await prisma.$executeRawUnsafe(stmt);
      if (stmt.startsWith('INSERT')) {
        const table = stmt.match(/INSERT INTO `(\w+)`/)?.[1];
        console.log(`Inserted into ${table}`);
        success++;
      }
    } catch (e) {
      if (!e.message.includes('Duplicate entry')) {
        errors++;
        if (errors < 5) {
          console.log(`Error: ${e.message.substring(0, 100)}`);
        }
      }
    }
  }

  console.log(`\nCompleted: ${success} inserts, ${errors} errors\n`);

  console.log('Re-enabling foreign key checks...');
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;

  // Verify counts
  console.log('Final counts in Railway DB:');
  console.log('- Users:', await prisma.user.count());
  console.log('- Tenants:', await prisma.tenant.count());
  console.log('- Tournaments:', await prisma.tournament.count());
  console.log('- Species:', await prisma.species.count());
  console.log('- Teams:', await prisma.team.count());
  console.log('- Catches:', await prisma.catch.count());
  console.log('- Fishing Zones:', await prisma.fishingZone.count());
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
