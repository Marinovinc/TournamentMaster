/**
 * Script per applicare branding a IschiaFishing
 * Dati raccolti da: https://ischiafishing-it.webnode.it/
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyBranding() {
  const tenantSlug = 'ischiafishing';

  // Dati branding raccolti dal sito ufficiale
  const brandingData = {
    // Identità visiva
    logo: 'https://065019982e.cbaul-cdnwnd.com/2739e1543a7cae9e87851aaaa68e8048/200000000-7847879434/ischiafishing.jpg',
    bannerImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=400&fit=crop', // Mare di Ischia generico
    primaryColor: '#0077B6',    // Blu oceano
    secondaryColor: '#023E8A',  // Blu profondo

    // Descrizione
    description: `ASD IschiaFishing è un'associazione di appassionati di pesca e mare fondata il 17 gennaio 2016 a Forio, Ischia.

L'associazione opera come ente non commerciale senza fini di lucro con l'obiettivo di promuovere, programmare, organizzare e realizzare l'attività della pesca sportiva, delle attività subacquee, del nuoto pinnato e della nautica.

Le nostre finalità includono la tutela ambientale, la conservazione marina e la promozione turistica attraverso eventi e campagne di sensibilizzazione.

"IL MARE È DI CHI LO SA ASCOLTARE"`,

    // Contatti
    contactEmail: 'ischiafishing@hotmail.com',
    contactPhone: '+39 3483382247',
    website: 'https://ischiafishing-it.webnode.it/',
    address: 'C.so Francesco Regine, 32 - Forio (NA)',

    // Social (non trovati sul sito, lasciamo null)
    socialFacebook: null,
    socialInstagram: null,
    socialYoutube: null,

    // FIPSAS
    fipsasCode: null,  // Codice non disponibile sul sito
    fipsasRegion: 'Campania',
  };

  try {
    // Trova il tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      console.error(`❌ Tenant "${tenantSlug}" non trovato!`);
      return;
    }

    console.log(`\n📋 TENANT TROVATO: ${tenant.name}`);
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Slug: ${tenant.slug}`);

    console.log('\n📦 STATO ATTUALE:');
    console.log(`   Logo: ${tenant.logo || '(non impostato)'}`);
    console.log(`   Banner: ${tenant.bannerImage || '(non impostato)'}`);
    console.log(`   Descrizione: ${tenant.description ? tenant.description.substring(0, 50) + '...' : '(non impostata)'}`);
    console.log(`   Email: ${tenant.contactEmail || '(non impostata)'}`);
    console.log(`   Telefono: ${tenant.contactPhone || '(non impostato)'}`);

    // Applica branding
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: brandingData
    });

    console.log('\n✅ BRANDING APPLICATO CON SUCCESSO!');
    console.log('\n🎨 NUOVO BRANDING:');
    console.log(`   Logo: ${updated.logo}`);
    console.log(`   Banner: ${updated.bannerImage}`);
    console.log(`   Colore primario: ${updated.primaryColor}`);
    console.log(`   Colore secondario: ${updated.secondaryColor}`);
    console.log(`   Email: ${updated.contactEmail}`);
    console.log(`   Telefono: ${updated.contactPhone}`);
    console.log(`   Website: ${updated.website}`);
    console.log(`   Indirizzo: ${updated.address}`);
    console.log(`   Regione FIPSAS: ${updated.fipsasRegion}`);

    console.log('\n🌐 PAGINA PUBBLICA:');
    console.log(`   http://localhost:3000/it/associazioni/${tenantSlug}`);

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

applyBranding();
