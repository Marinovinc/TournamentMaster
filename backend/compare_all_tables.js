const { PrismaClient } = require('@prisma/client');

const localPrisma = new PrismaClient({
  datasources: { db: { url: 'mysql://root@localhost:3306/tournamentmaster' }}
});

const railwayPrisma = new PrismaClient({
  datasources: { db: { url: 'mysql://root:wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd@hopper.proxy.rlwy.net:48529/railway' }}
});

async function main() {
  console.log('=== CONFRONTO COMPLETO LOCALE vs RAILWAY ===\n');

  const tables = [
    { name: 'user', fn: p => p.user.count() },
    { name: 'tenant', fn: p => p.tenant.count() },
    { name: 'tournament', fn: p => p.tournament.count() },
    { name: 'species', fn: p => p.species.count() },
    { name: 'team', fn: p => p.team.count() },
    { name: 'teamMember', fn: p => p.teamMember.count() },
    { name: 'catch', fn: p => p.catch.count() },
    { name: 'fishingZone', fn: p => p.fishingZone.count() },
    { name: 'tournamentRegistration', fn: p => p.tournamentRegistration.count() },
    { name: 'tournamentSpecies', fn: p => p.tournamentSpecies.count() },
    { name: 'tournamentStaff', fn: p => p.tournamentStaff.count() },
    { name: 'leaderboardEntry', fn: p => p.leaderboardEntry.count() },
    { name: 'strike', fn: p => p.strike.count() },
    { name: 'document', fn: p => p.document.count() },
    { name: 'auditLog', fn: p => p.auditLog.count() },
    { name: 'refreshToken', fn: p => p.refreshToken.count() },
  ];

  console.log('Tabella                  | LOCALE | RAILWAY | STATUS');
  console.log('-------------------------|--------|---------|--------');

  let hasError = false;

  for (const table of tables) {
    try {
      const localCount = await table.fn(localPrisma);
      const railwayCount = await table.fn(railwayPrisma);
      const status = localCount === railwayCount ? 'OK' : 'DIVERSO';
      if (localCount !== railwayCount) hasError = true;
      const nameCol = table.name.padEnd(25);
      const localCol = String(localCount).padEnd(7);
      const railwayCol = String(railwayCount).padEnd(8);
      console.log(`${nameCol}| ${localCol}| ${railwayCol}| ${status}`);
    } catch (e) {
      console.log(`${table.name.padEnd(25)}| ERROR: ${e.message.substring(0, 40)}`);
    }
  }

  console.log('\n' + (hasError ? 'CI SONO DIFFERENZE!' : 'TUTTI I DATI CORRISPONDONO'));
}

main()
  .catch(console.error)
  .finally(async () => {
    await localPrisma.$disconnect();
    await railwayPrisma.$disconnect();
  });
