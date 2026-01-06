/**
 * Test E2E: Delete Team con Cascade
 * Data: 2026-01-05
 *
 * Questo script verifica che l'eliminazione di un Team
 * elimini automaticamente tutti i TeamMember associati (cascade delete)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Colori per output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`${colors.cyan}[Step ${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}  ✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}  ✗ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}  ℹ ${message}${colors.reset}`);
}

async function main() {
  log('');
  log('═'.repeat(60), 'cyan');
  log('  TEST E2E: DELETE TEAM CON CASCADE', 'cyan');
  log('═'.repeat(60), 'cyan');
  log('');

  let testTeamId = null;
  let testMemberIds = [];
  let testPassed = true;

  try {
    // ================================================
    // STEP 1: Trova un torneo esistente
    // ================================================
    logStep(1, 'Cerco un torneo esistente...');

    const tournament = await prisma.tournament.findFirst({
      where: { status: { not: 'CANCELLED' } },
      select: { id: true, name: true },
    });

    if (!tournament) {
      logError('Nessun torneo trovato. Creo un torneo di test...');

      // Trova un tenant e un organizer
      const tenant = await prisma.tenant.findFirst();
      const organizer = await prisma.user.findFirst({
        where: { role: { in: ['SUPER_ADMIN', 'TENANT_ADMIN', 'ORGANIZER'] } },
      });

      if (!tenant || !organizer) {
        throw new Error('Impossibile trovare tenant o organizer per creare torneo');
      }

      const newTournament = await prisma.tournament.create({
        data: {
          name: 'Torneo Test Delete E2E',
          discipline: 'DRIFTING',
          status: 'DRAFT',
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-02-02'),
          registrationOpens: new Date('2026-01-15'),
          registrationCloses: new Date('2026-01-31'),
          location: 'Test Location',
          tenantId: tenant.id,
          organizerId: organizer.id,
        },
      });
      tournament.id = newTournament.id;
      tournament.name = newTournament.name;
      logSuccess(`Torneo creato: ${newTournament.name}`);
    } else {
      logSuccess(`Torneo trovato: ${tournament.name}`);
    }

    // ================================================
    // STEP 2: Trova un utente per il capitano
    // ================================================
    logStep(2, 'Cerco un utente per il capitano...');

    const captain = await prisma.user.findFirst({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!captain) {
      throw new Error('Nessun utente trovato per il capitano');
    }

    logSuccess(`Capitano: ${captain.firstName} ${captain.lastName}`);

    // ================================================
    // STEP 3: Crea team di test
    // ================================================
    logStep(3, 'Creo team di test...');

    const timestamp = Date.now();
    const testTeam = await prisma.team.create({
      data: {
        name: `Test Team E2E ${timestamp}`,
        boatName: `Test Boat ${timestamp}`,
        boatNumber: 9999,
        captainId: captain.id,
        tournamentId: tournament.id,
        clubName: 'Test Club E2E',
      },
    });

    testTeamId = testTeam.id;
    logSuccess(`Team creato: ${testTeam.name} (ID: ${testTeam.id})`);

    // ================================================
    // STEP 4: Aggiungi membri al team
    // ================================================
    logStep(4, 'Aggiungo membri al team...');

    // Membro 1: Team Leader (utente registrato)
    const member1 = await prisma.teamMember.create({
      data: {
        teamId: testTeam.id,
        userId: captain.id,
        role: 'TEAM_LEADER',
      },
    });
    testMemberIds.push(member1.id);
    logSuccess(`Membro 1 (TEAM_LEADER): ${member1.id}`);

    // Membro 2: Crew (utente registrato)
    const otherUser = await prisma.user.findFirst({
      where: {
        isActive: true,
        id: { not: captain.id },
      },
    });

    if (otherUser) {
      const member2 = await prisma.teamMember.create({
        data: {
          teamId: testTeam.id,
          userId: otherUser.id,
          role: 'CREW',
        },
      });
      testMemberIds.push(member2.id);
      logSuccess(`Membro 2 (CREW): ${member2.id}`);
    }

    // Membro 3: Skipper esterno
    const member3 = await prisma.teamMember.create({
      data: {
        teamId: testTeam.id,
        externalName: 'Mario Rossi Test',
        externalPhone: '+39 333 1234567',
        isExternal: true,
        role: 'SKIPPER',
      },
    });
    testMemberIds.push(member3.id);
    logSuccess(`Membro 3 (SKIPPER esterno): ${member3.id}`);

    // Membro 4: Guest esterno
    const member4 = await prisma.teamMember.create({
      data: {
        teamId: testTeam.id,
        externalName: 'Luigi Verdi Test',
        isExternal: true,
        role: 'GUEST',
      },
    });
    testMemberIds.push(member4.id);
    logSuccess(`Membro 4 (GUEST esterno): ${member4.id}`);

    logInfo(`Totale membri creati: ${testMemberIds.length}`);

    // ================================================
    // STEP 5: Verifica membri esistono PRIMA del delete
    // ================================================
    logStep(5, 'Verifico membri esistono prima del delete...');

    const membersBefore = await prisma.teamMember.count({
      where: { teamId: testTeam.id },
    });

    if (membersBefore === testMemberIds.length) {
      logSuccess(`Membri trovati: ${membersBefore}`);
    } else {
      logError(`Attesi ${testMemberIds.length} membri, trovati ${membersBefore}`);
      testPassed = false;
    }

    // ================================================
    // STEP 6: Elimina il team
    // ================================================
    logStep(6, 'Elimino il team...');

    const deletedTeam = await prisma.team.delete({
      where: { id: testTeam.id },
    });

    logSuccess(`Team eliminato: ${deletedTeam.name}`);
    testTeamId = null; // Marcato come eliminato

    // ================================================
    // STEP 7: Verifica CASCADE DELETE
    // ================================================
    logStep(7, 'Verifico cascade delete dei membri...');

    // Verifica che il team non esista piu
    const teamAfter = await prisma.team.findUnique({
      where: { id: testTeam.id },
    });

    if (teamAfter === null) {
      logSuccess('Team non piu presente nel database');
    } else {
      logError('ERRORE: Team ancora presente!');
      testPassed = false;
    }

    // Verifica che i membri siano stati eliminati
    const membersAfter = await prisma.teamMember.count({
      where: { teamId: testTeam.id },
    });

    if (membersAfter === 0) {
      logSuccess('Tutti i membri sono stati eliminati (CASCADE OK)');
    } else {
      logError(`ERRORE: ${membersAfter} membri ancora presenti!`);
      testPassed = false;
    }

    // Verifica anche cercando per ID specifici
    for (const memberId of testMemberIds) {
      const member = await prisma.teamMember.findUnique({
        where: { id: memberId },
      });
      if (member !== null) {
        logError(`ERRORE: Membro ${memberId} ancora presente!`);
        testPassed = false;
      }
    }

    if (testPassed) {
      logSuccess('Verifica ID specifici: tutti eliminati');
    }

  } catch (error) {
    logError(`Errore durante il test: ${error.message}`);
    testPassed = false;

    // Cleanup in caso di errore
    if (testTeamId) {
      try {
        await prisma.team.delete({ where: { id: testTeamId } });
        logInfo('Cleanup: team di test eliminato');
      } catch (e) {
        // Ignora errori di cleanup
      }
    }
  }

  // ================================================
  // RISULTATO FINALE
  // ================================================
  log('');
  log('═'.repeat(60), 'cyan');
  if (testPassed) {
    log('  RISULTATO: TEST PASSATO ✓', 'green');
    log('', 'green');
    log('  Il cascade delete funziona correttamente:', 'green');
    log('  - Team eliminato', 'green');
    log('  - Tutti i TeamMember eliminati automaticamente', 'green');
  } else {
    log('  RISULTATO: TEST FALLITO ✗', 'red');
    log('', 'red');
    log('  Verificare la configurazione onDelete: Cascade', 'red');
    log('  nello schema.prisma per TeamMember', 'red');
  }
  log('═'.repeat(60), 'cyan');
  log('');

  return testPassed;
}

main()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((e) => {
    console.error('Errore fatale:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
