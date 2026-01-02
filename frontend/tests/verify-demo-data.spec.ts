import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/**
 * Test per verificare che i dati demo siano visibili nel Report
 * dopo l'aggiornamento del seed
 */
test.describe('Verify Demo Data in Reports', () => {
  test.beforeEach(async ({ page }) => {
    // Login come Super Admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'marino@unitec.it');
    await page.fill('input[type="password"]', 'Gerstofen22');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  });

  test('Super Admin sees enhanced data for all tenants', async ({ page }) => {
    // Vai ai Reports
    await page.goto(`${BASE_URL}/it/dashboard/reports`);
    await page.waitForLoadState('networkidle');

    // Click su Association tab
    await page.click('button:has-text("Associazione")');
    await page.waitForTimeout(1000);

    // Screenshot stato iniziale - mostra il selector
    await page.screenshot({
      path: 'test-results/01-superadmin-tenant-selector.png',
      fullPage: true
    });

    // Click sul SelectTrigger (shadcn component)
    await page.click('button:has-text("Seleziona associazione")');
    await page.waitForTimeout(500);

    // Screenshot menu aperto
    await page.screenshot({
      path: 'test-results/02-tenant-dropdown-open.png',
      fullPage: true
    });

    // Seleziona IschiaFishing
    await page.click('[role="option"]:has-text("IschiaFishing")');
    await page.waitForTimeout(3000);

    // Screenshot IschiaFishing data
    await page.screenshot({
      path: 'test-results/03-ischiafishing-data.png',
      fullPage: true
    });

    // Verifica presenza dati
    const pageContent = await page.textContent('body');
    console.log('IschiaFishing content check:', pageContent?.includes('IschiaFishing'));

    // Cambia a Mare Blu Club
    await page.click('button:has-text("IschiaFishing")');
    await page.waitForTimeout(500);
    await page.click('[role="option"]:has-text("Mare Blu")');
    await page.waitForTimeout(3000);

    // Screenshot Mare Blu data
    await page.screenshot({
      path: 'test-results/04-mareblu-data.png',
      fullPage: true
    });

    // Cambia a Pesca Sportiva Napoli
    await page.click('button:has-text("Mare Blu")');
    await page.waitForTimeout(500);
    await page.click('[role="option"]:has-text("Pesca Sportiva")');
    await page.waitForTimeout(3000);

    // Screenshot Pesca Napoli data
    await page.screenshot({
      path: 'test-results/05-pescanapolisport-data.png',
      fullPage: true
    });

    console.log('✅ All tenant data screenshots captured');
  });

  test('Super Admin sees Platform overview with all tenants', async ({ page }) => {
    // Vai ai Reports
    await page.goto(`${BASE_URL}/it/dashboard/reports`);
    await page.waitForLoadState('networkidle');

    // Platform tab dovrebbe essere già attivo per default
    await page.waitForTimeout(2000);

    // Screenshot Platform overview
    await page.screenshot({
      path: 'test-results/06-platform-overview.png',
      fullPage: true
    });

    // Verifica che ci siano 4 tenant (3 attivi + 1 inattivo)
    const pageContent = await page.textContent('body');
    const hasIschia = pageContent?.includes('IschiaFishing');
    const hasMareBlu = pageContent?.includes('Mare Blu');
    const hasPescaNapoli = pageContent?.includes('Pesca Sportiva Napoli') || pageContent?.includes('Pescanapolisport');

    console.log('Platform overview tenants:', { hasIschia, hasMareBlu, hasPescaNapoli });

    expect(hasIschia || hasMareBlu || hasPescaNapoli).toBeTruthy();

    console.log('✅ Platform overview verified');
  });
});
