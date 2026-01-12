import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debug() {
  const tournamentId = 'demo-tournament-completed';

  // 1. Teams
  const teams = await prisma.team.findMany({
    where: { tournamentId },
    include: { captain: { select: { firstName: true, lastName: true } } },
  });
  console.log('=== TEAMS ===');
  teams.forEach(t => console.log(`ID: ${t.id}, Name: ${t.name}, BoatName: ${t.boatName}, CaptainId: ${t.captainId}`));

  // 2. TeamMembers
  const teamMembers = await prisma.teamMember.findMany({
    where: { team: { tournamentId } },
    select: { userId: true, teamId: true },
  });
  console.log('\n=== TEAM MEMBERS ===');
  teamMembers.forEach(m => console.log(`userId: ${m.userId} -> teamId: ${m.teamId}`));

  // 3. Build userToTeamMap
  const userToTeamMap = new Map<string, string>();
  teamMembers.forEach((m) => {
    if (m.userId) userToTeamMap.set(m.userId, m.teamId);
  });
  teams.forEach((t) => userToTeamMap.set(t.captainId, t.id));

  console.log('\n=== USER TO TEAM MAP (after both) ===');
  userToTeamMap.forEach((v, k) => console.log(`${k} -> ${v}`));

  // 4. Catches
  const catches = await prisma.catch.findMany({
    where: { tournamentId, status: 'APPROVED' },
    select: { userId: true, user: { select: { firstName: true, lastName: true } } },
    take: 6
  });
  console.log('\n=== CATCHES (first 6) - checking if mapped ===');
  catches.forEach(c => {
    const teamId = userToTeamMap.get(c.userId);
    console.log(`${c.user.firstName} ${c.user.lastName} (${c.userId}) -> teamId: ${teamId || 'NOT FOUND'}`);
  });

  await prisma.$disconnect();
}
debug();
