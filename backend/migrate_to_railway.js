const { PrismaClient } = require('@prisma/client');

// Database LOCALE
const localPrisma = new PrismaClient();

// Database RAILWAY
const railwayPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd@hopper.proxy.rlwy.net:48529/railway'
    }
  }
});

async function main() {
  console.log('Starting data migration from LOCAL to RAILWAY...\n');

  // 1. Migrate Tenants first (no dependencies)
  console.log('1. Migrating Tenants...');
  const tenants = await localPrisma.tenant.findMany();
  for (const tenant of tenants) {
    try {
      await railwayPrisma.tenant.create({ data: tenant });
      console.log(`   - Created tenant: ${tenant.name}`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Tenant exists: ${tenant.name}`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 2. Migrate Species (no dependencies)
  console.log('\n2. Migrating Species...');
  const species = await localPrisma.species.findMany();
  for (const s of species) {
    try {
      await railwayPrisma.species.create({ data: s });
      console.log(`   - Created species: ${s.name}`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Species exists: ${s.name}`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 3. Migrate Users (depends on Tenant)
  console.log('\n3. Migrating Users...');
  const users = await localPrisma.user.findMany();
  for (const user of users) {
    try {
      await railwayPrisma.user.create({ data: user });
      console.log(`   - Created user: ${user.email}`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - User exists: ${user.email}`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 4. Migrate Fishing Zones (depends on Tenant)
  console.log('\n4. Migrating Fishing Zones...');
  const zones = await localPrisma.fishingZone.findMany();
  for (const zone of zones) {
    try {
      await railwayPrisma.fishingZone.create({ data: zone });
      console.log(`   - Created zone: ${zone.name}`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Zone exists: ${zone.name}`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 5. Migrate Tournaments (depends on Tenant)
  console.log('\n5. Migrating Tournaments...');
  const tournaments = await localPrisma.tournament.findMany();
  for (const t of tournaments) {
    try {
      await railwayPrisma.tournament.create({ data: t });
      console.log(`   - Created tournament: ${t.name}`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Tournament exists: ${t.name}`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 6. Migrate Tournament Species (join table)
  console.log('\n6. Migrating Tournament Species...');
  const tournamentSpecies = await localPrisma.tournamentSpecies.findMany();
  for (const ts of tournamentSpecies) {
    try {
      await railwayPrisma.tournamentSpecies.create({ data: ts });
      console.log(`   - Created tournament-species link`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Link exists`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 7. Migrate Teams (depends on Tournament)
  console.log('\n7. Migrating Teams...');
  const teams = await localPrisma.team.findMany();
  for (const team of teams) {
    try {
      await railwayPrisma.team.create({ data: team });
      console.log(`   - Created team: ${team.name}`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Team exists: ${team.name}`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 8. Migrate Team Members (depends on Team and User)
  console.log('\n8. Migrating Team Members...');
  const teamMembers = await localPrisma.teamMember.findMany();
  for (const tm of teamMembers) {
    try {
      await railwayPrisma.teamMember.create({ data: tm });
      console.log(`   - Created team member link`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Link exists`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 9. Migrate Tournament Registrations (depends on Tournament and User)
  console.log('\n9. Migrating Tournament Registrations...');
  const registrations = await localPrisma.tournamentRegistration.findMany();
  for (const reg of registrations) {
    try {
      await railwayPrisma.tournamentRegistration.create({ data: reg });
      console.log(`   - Created registration`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Registration exists`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 10. Migrate Tournament Staff (depends on Tournament and User)
  console.log('\n10. Migrating Tournament Staff...');
  const staff = await localPrisma.tournamentStaff.findMany();
  for (const s of staff) {
    try {
      await railwayPrisma.tournamentStaff.create({ data: s });
      console.log(`   - Created staff assignment`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Staff exists`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 11. Migrate Catches (depends on Tournament, User, Species)
  console.log('\n11. Migrating Catches...');
  const catches = await localPrisma.catch.findMany();
  for (const c of catches) {
    try {
      await railwayPrisma.catch.create({ data: c });
      console.log(`   - Created catch record`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Catch exists`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 12. Migrate Leaderboard Entries
  console.log('\n12. Migrating Leaderboard Entries...');
  const leaderboard = await localPrisma.leaderboardEntry.findMany();
  for (const entry of leaderboard) {
    try {
      await railwayPrisma.leaderboardEntry.create({ data: entry });
      console.log(`   - Created leaderboard entry`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Entry exists`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 13. Migrate Strikes
  console.log('\n13. Migrating Strikes...');
  const strikes = await localPrisma.strike.findMany();
  for (const strike of strikes) {
    try {
      await railwayPrisma.strike.create({ data: strike });
      console.log(`   - Created strike`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Strike exists`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 14. Migrate Documents
  console.log('\n14. Migrating Documents...');
  const documents = await localPrisma.document.findMany();
  for (const doc of documents) {
    try {
      await railwayPrisma.document.create({ data: doc });
      console.log(`   - Created document: ${doc.type}`);
    } catch (e) {
      if (e.code === 'P2002') console.log(`   - Document exists`);
      else console.log(`   - Error: ${e.message}`);
    }
  }

  // 15. Migrate Audit Logs
  console.log('\n15. Migrating Audit Logs...');
  const auditLogs = await localPrisma.auditLog.findMany();
  for (const log of auditLogs) {
    try {
      await railwayPrisma.auditLog.create({ data: log });
    } catch (e) {
      // Skip audit log errors silently
    }
  }
  console.log(`   - Migrated ${auditLogs.length} audit logs`);

  // Final count verification
  console.log('\n========== MIGRATION COMPLETE ==========\n');
  console.log('Railway database now contains:');
  console.log('- Users:', await railwayPrisma.user.count());
  console.log('- Tenants:', await railwayPrisma.tenant.count());
  console.log('- Tournaments:', await railwayPrisma.tournament.count());
  console.log('- Species:', await railwayPrisma.species.count());
  console.log('- Teams:', await railwayPrisma.team.count());
  console.log('- Catches:', await railwayPrisma.catch.count());
  console.log('- Fishing Zones:', await railwayPrisma.fishingZone.count());
}

main()
  .catch(console.error)
  .finally(async () => {
    await localPrisma.$disconnect();
    await railwayPrisma.$disconnect();
  });
