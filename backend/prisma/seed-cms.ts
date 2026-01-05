/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: prisma/seed-cms.ts
 * Creato: 2026-01-05
 * Descrizione: Seed CMS - Features, Pricing Plans, FAQs, Disciplines
 *
 * Esecuzione: npx ts-node prisma/seed-cms.ts
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📝 Seeding CMS content...\n');

  // ================================
  // 1. FEATURES
  // ================================
  console.log('✨ Creating features...');

  const featuresData = [
    { icon: 'Trophy', title: 'Gestione Tornei Completa', description: 'Crea e gestisci tornei di ogni tipo: giornalieri, settimanali, campionati stagionali. Definisci regole personalizzate, quote di iscrizione e premi.', badge: 'Core', sortOrder: 1 },
    { icon: 'Camera', title: 'Registrazione Catture con Foto', description: 'I partecipanti possono registrare le catture con foto geolocalizzate. Sistema di guida per posizionamento corretto del pesce nella foto.', badge: 'Core', sortOrder: 2 },
    { icon: 'MapPin', title: 'Validazione GPS Automatica', description: 'Verifica automatica della posizione del pescatore nell\'area di gara. Previene frodi e garantisce la regolarita delle competizioni.', badge: 'Sicurezza', sortOrder: 3 },
    { icon: 'BarChart3', title: 'Classifiche in Tempo Reale', description: 'Classifiche aggiornate istantaneamente dopo ogni cattura validata. I partecipanti possono seguire la loro posizione durante tutto il torneo.', badge: 'Live', sortOrder: 4 },
    { icon: 'Users', title: 'Gestione Partecipanti', description: 'Sistema completo per iscrizioni, pagamenti, comunicazioni. Supporto per team e classifiche individuali contemporaneamente.', badge: 'Core', sortOrder: 5 },
    { icon: 'Bell', title: 'Notifiche Push', description: 'Notifiche in tempo reale per inizio torneo, nuove catture dei competitor, aggiornamenti classifica e comunicazioni dall\'organizzatore.', badge: 'Premium', sortOrder: 6 },
    { icon: 'Smartphone', title: 'App Mobile Dedicata', description: 'App nativa per iOS e Android con funzionalita offline. Registra catture anche senza connessione, sincronizza quando torni online.', badge: 'Mobile', sortOrder: 7 },
    { icon: 'Shield', title: 'Anti-Frode Avanzato', description: 'Sistema multi-livello: verifica GPS, analisi foto con AI, controllo timestamp, validazione incrociata. Garantisce competizioni eque.', badge: 'Sicurezza', sortOrder: 8 },
    { icon: 'Zap', title: 'Performance Ottimizzate', description: 'Infrastruttura cloud scalabile per gestire migliaia di partecipanti contemporaneamente senza rallentamenti.', badge: 'Tech', sortOrder: 9 },
    { icon: 'Globe', title: 'Multilingua', description: 'Piattaforma disponibile in italiano, inglese, tedesco e spagnolo. Perfetta per tornei internazionali.', badge: 'Global', sortOrder: 10 },
    { icon: 'Clock', title: 'Storico Completo', description: 'Accedi allo storico di tutti i tuoi tornei, catture e risultati. Statistiche personali e confronto con altri pescatori.', badge: 'Analytics', sortOrder: 11 },
    { icon: 'CheckCircle', title: 'Certificazione FIPSAS', description: 'Supporto per numero tessera FIPSAS. I risultati possono essere esportati per competizioni ufficiali federali.', badge: 'Ufficiale', sortOrder: 12 },
  ];

  for (const feature of featuresData) {
    await prisma.feature.upsert({
      where: { id: `feature-it-${feature.sortOrder}` },
      update: feature,
      create: { id: `feature-it-${feature.sortOrder}`, ...feature, locale: 'it' },
    });
  }

  // ================================
  // 2. PRICING PLANS
  // ================================
  console.log('💰 Creating pricing plans...');

  // Starter Plan
  const starterPlan = await prisma.pricingPlan.upsert({
    where: { id: 'plan-starter-it' },
    update: {},
    create: {
      id: 'plan-starter-it',
      name: 'Starter',
      description: 'Per piccoli tornei locali',
      price: 'Gratis',
      priceDetail: 'per sempre',
      icon: 'Zap',
      highlighted: false,
      cta: 'Inizia Gratis',
      ctaVariant: 'outline',
      sortOrder: 1,
      locale: 'it',
    },
  });

  const starterFeatures = [
    { text: 'Fino a 3 tornei/anno', included: true, sortOrder: 1 },
    { text: 'Max 30 partecipanti/torneo', included: true, sortOrder: 2 },
    { text: 'Classifiche in tempo reale', included: true, sortOrder: 3 },
    { text: 'Validazione GPS base', included: true, sortOrder: 4 },
    { text: 'Supporto email', included: true, sortOrder: 5 },
    { text: 'Statistiche avanzate', included: false, sortOrder: 6 },
    { text: 'Personalizzazione brand', included: false, sortOrder: 7 },
    { text: 'API access', included: false, sortOrder: 8 },
  ];

  for (const feature of starterFeatures) {
    await prisma.planFeature.upsert({
      where: { id: `starter-feature-${feature.sortOrder}` },
      update: feature,
      create: { id: `starter-feature-${feature.sortOrder}`, planId: starterPlan.id, ...feature },
    });
  }

  // Pro Plan
  const proPlan = await prisma.pricingPlan.upsert({
    where: { id: 'plan-pro-it' },
    update: {},
    create: {
      id: 'plan-pro-it',
      name: 'Pro',
      description: 'Per associazioni e circoli',
      price: '29',
      priceDetail: '/mese',
      icon: 'Building2',
      highlighted: true,
      badge: 'Piu popolare',
      cta: 'Prova 14 giorni gratis',
      ctaVariant: 'default',
      sortOrder: 2,
      locale: 'it',
    },
  });

  const proFeatures = [
    { text: 'Tornei illimitati', included: true, sortOrder: 1 },
    { text: 'Max 200 partecipanti/torneo', included: true, sortOrder: 2 },
    { text: 'Classifiche in tempo reale', included: true, sortOrder: 3 },
    { text: 'Validazione GPS avanzata', included: true, sortOrder: 4 },
    { text: 'Supporto prioritario', included: true, sortOrder: 5 },
    { text: 'Statistiche avanzate', included: true, sortOrder: 6 },
    { text: 'Personalizzazione brand', included: true, sortOrder: 7 },
    { text: 'API access', included: false, sortOrder: 8 },
  ];

  for (const feature of proFeatures) {
    await prisma.planFeature.upsert({
      where: { id: `pro-feature-${feature.sortOrder}` },
      update: feature,
      create: { id: `pro-feature-${feature.sortOrder}`, planId: proPlan.id, ...feature },
    });
  }

  // Enterprise Plan
  const enterprisePlan = await prisma.pricingPlan.upsert({
    where: { id: 'plan-enterprise-it' },
    update: {},
    create: {
      id: 'plan-enterprise-it',
      name: 'Enterprise',
      description: 'Per federazioni e grandi eventi',
      price: 'Personalizzato',
      priceDetail: 'contattaci',
      icon: 'Crown',
      highlighted: false,
      cta: 'Contattaci',
      ctaVariant: 'outline',
      ctaLink: 'mailto:sales@tournamentmaster.it',
      sortOrder: 3,
      locale: 'it',
    },
  });

  const enterpriseFeatures = [
    { text: 'Tornei illimitati', included: true, sortOrder: 1 },
    { text: 'Partecipanti illimitati', included: true, sortOrder: 2 },
    { text: 'Classifiche in tempo reale', included: true, sortOrder: 3 },
    { text: 'Validazione multi-livello', included: true, sortOrder: 4 },
    { text: 'Account manager dedicato', included: true, sortOrder: 5 },
    { text: 'Statistiche avanzate', included: true, sortOrder: 6 },
    { text: 'White-label completo', included: true, sortOrder: 7 },
    { text: 'API access completo', included: true, sortOrder: 8 },
  ];

  for (const feature of enterpriseFeatures) {
    await prisma.planFeature.upsert({
      where: { id: `enterprise-feature-${feature.sortOrder}` },
      update: feature,
      create: { id: `enterprise-feature-${feature.sortOrder}`, planId: enterprisePlan.id, ...feature },
    });
  }

  // ================================
  // 3. FAQs
  // ================================
  console.log('❓ Creating FAQs...');

  const faqsData = [
    { question: 'Posso cambiare piano in qualsiasi momento?', answer: 'Si, puoi fare upgrade o downgrade del tuo piano in qualsiasi momento. Le modifiche saranno effettive dal ciclo di fatturazione successivo.', category: 'pricing', sortOrder: 1 },
    { question: 'C\'e un periodo di prova?', answer: 'Il piano Pro include 14 giorni di prova gratuita. Non e richiesta carta di credito per iniziare.', category: 'pricing', sortOrder: 2 },
    { question: 'Come funziona il pagamento?', answer: 'Accettiamo carte di credito, Apple Pay, Google Pay e bonifico bancario (solo per piani annuali). La fatturazione e mensile o annuale con 2 mesi gratis.', link: '/payments/guide', linkText: 'Vedi Guida Tariffe Completa', category: 'pricing', sortOrder: 3 },
    { question: 'Cosa succede se supero i limiti del piano?', answer: 'Ti avviseremo quando ti avvicini ai limiti. Potrai fare upgrade o completare il torneo corrente prima di dover cambiare piano.', category: 'pricing', sortOrder: 4 },
    { question: 'Quanto guadagna la mia associazione dalle iscrizioni?', answer: 'La tua associazione trattiene tutto tranne EUR5 fissi per iscrizione (es. quota EUR20 = EUR15 per te). Le commissioni Stripe sono ripartite proporzionalmente.', link: '/payments/guide', linkText: 'Vedi Simulazione Guadagni', category: 'pricing', sortOrder: 5 },
  ];

  for (const faq of faqsData) {
    await prisma.faq.upsert({
      where: { id: `faq-it-${faq.sortOrder}` },
      update: faq,
      create: { id: `faq-it-${faq.sortOrder}`, ...faq, locale: 'it' },
    });
  }

  // ================================
  // 4. DISCIPLINES
  // ================================
  console.log('🎣 Creating disciplines...');

  const disciplinesData = [
    // Sea fishing
    { code: 'big_game', name: 'Big Game', subtitle: 'Pesca d\'Altura', description: 'Traina d\'altura oltre le 6 miglia per tonno rosso, pescespada, alalunga e lampuga.', icon: 'Fish', category: 'sea', sortOrder: 1 },
    { code: 'drifting', name: 'Drifting', subtitle: 'Pesca in Deriva', description: 'Barca in deriva con pasturazione a sarda per tonno rosso e grandi pelagici.', icon: 'Waves', category: 'sea', sortOrder: 2 },
    { code: 'traina_costiera', name: 'Traina Costiera', subtitle: 'Piccola Traina', description: 'Traina con artificiali o esca naturale per spigole, palamite e serra.', icon: 'Ship', category: 'sea', sortOrder: 3 },
    { code: 'vertical_jigging', name: 'Vertical Jigging', subtitle: 'Jigging Verticale', description: 'Tecnica con jig metallici per dentici, ricciole e cernie su fondali profondi.', icon: 'ArrowDown', category: 'sea', sortOrder: 4 },
    { code: 'bolentino', name: 'Bolentino', subtitle: 'Pesca a Fondo', description: 'Pesca verticale su fondali da 30 a 400 metri per occhioni, naselli e cernie.', icon: 'Anchor', category: 'sea', sortOrder: 5 },
    { code: 'eging', name: 'Eging', subtitle: 'Pesca ai Cefalopodi', description: 'Tecnica giapponese con totanare (egi) per calamari, seppie e totani.', icon: 'Target', category: 'sea', sortOrder: 6 },
    { code: 'spinning_mare', name: 'Spinning Mare', subtitle: 'Spinning in Mare', description: 'Lancio e recupero con artificiali dalla barca o dalla riva per predatori marini.', icon: 'Zap', category: 'sea', sortOrder: 7 },
    { code: 'surfcasting', name: 'Surfcasting', subtitle: 'Surfcasting', description: 'Lancio tecnico dalla spiaggia con canne lunghe per orate, spigole e mormore.', icon: 'Sunrise', category: 'sea', sortOrder: 8 },
    { code: 'shore', name: 'Shore', subtitle: 'Pesca da Riva', description: 'Tecniche miste dalla costa: spinning, bolognese e fondo leggero.', icon: 'Mountain', category: 'sea', sortOrder: 9 },
    // Freshwater
    { code: 'fly_fishing', name: 'Fly Fishing', subtitle: 'Pesca a Mosca', description: 'Tecnica elegante con coda di topo e mosche artificiali per trote e temoli.', icon: 'Wind', category: 'freshwater', sortOrder: 10 },
    { code: 'spinning_fiume', name: 'Spinning Fiume', subtitle: 'Spinning Fiume', description: 'Lancio con artificiali in fiume per lucci, persici, aspi e siluri.', icon: 'Zap', category: 'freshwater', sortOrder: 11 },
    { code: 'carpfishing', name: 'Carpfishing', subtitle: 'Carpfishing', description: 'Pesca stanziale alla carpa con boilies, hair rig e attrezzatura specializzata.', icon: 'Tent', category: 'freshwater', sortOrder: 12 },
    { code: 'feeder', name: 'Feeder', subtitle: 'Feeder Fishing', description: 'Pesca a fondo con pasturatore per ciprinidi in acque ferme e correnti.', icon: 'Package', category: 'freshwater', sortOrder: 13 },
    { code: 'trota_lago', name: 'Trota Lago', subtitle: 'Trota Lago', description: 'Pesca alla trota in lago con bombarda, vetrino o spinning leggero.', icon: 'Droplets', category: 'freshwater', sortOrder: 14 },
    { code: 'trota_torrente', name: 'Trota Torrente', subtitle: 'Trota Torrente', description: 'Pesca alla trota in torrente con tecniche al tocco, spinning o mosca.', icon: 'TreePine', category: 'freshwater', sortOrder: 15 },
    { code: 'bass_fishing', name: 'Bass Fishing', subtitle: 'Black Bass', description: 'Pesca sportiva al persico trota con esche artificiali e tecniche americane.', icon: 'Trophy', category: 'freshwater', sortOrder: 16 },
    { code: 'colpo', name: 'Colpo', subtitle: 'Pesca al Colpo', description: 'Pesca di precisione con canna fissa o bolognese per gare su ciprinidi.', icon: 'Target', category: 'freshwater', sortOrder: 17 },
    // Social
    { code: 'social', name: 'Social', subtitle: 'Eventi Sociali', description: 'Raduni e manifestazioni di pesca non agonistiche.', icon: 'Users', category: 'social', sortOrder: 18 },
  ];

  for (const discipline of disciplinesData) {
    await prisma.disciplineInfo.upsert({
      where: { code_locale: { code: discipline.code, locale: 'it' } },
      update: discipline,
      create: { ...discipline, locale: 'it' },
    });
  }

  console.log('\n✅ CMS Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 CMS CONTENT:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✨ Features: ${featuresData.length}`);
  console.log(`💰 Pricing Plans: 3 (Starter, Pro, Enterprise)`);
  console.log(`❓ FAQs: ${faqsData.length}`);
  console.log(`🎣 Disciplines: ${disciplinesData.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ CMS Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
