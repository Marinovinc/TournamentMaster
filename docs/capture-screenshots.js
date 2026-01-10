/**
 * Capture screenshots for TournamentMaster Admin Manual
 * Uses Playwright to navigate and capture key pages
 */

const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const BASE_URL = 'http://localhost:3000';
const LOCALE = 'it';

// Test credentials (adjust as needed)
const TEST_EMAIL = 'admin@ischiafishing.it';
const TEST_PASSWORD = 'demo123';

async function captureScreenshots() {
    const browser = await chromium.launch({
        headless: false,  // Show browser for debugging
        slowMo: 500
    });

    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 },
        locale: 'it-IT'
    });

    const page = await context.newPage();

    try {
        console.log('Starting screenshot capture...\n');

        // 1. Login Page
        console.log('1. Capturing login page...');
        await page.goto(`${BASE_URL}/${LOCALE}/login`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '01_login.png'),
            fullPage: false
        });
        console.log('   Done: 01_login.png');

        // Try to login
        console.log('   Attempting login...');
        try {
            await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL);
            await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard**', { timeout: 10000 });
            console.log('   Login successful!');
        } catch (e) {
            console.log('   Login failed or not required, continuing...');
        }

        // 2. Dashboard
        console.log('2. Capturing dashboard...');
        await page.goto(`${BASE_URL}/${LOCALE}/dashboard`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '02_dashboard.png'),
            fullPage: false
        });
        console.log('   Done: 02_dashboard.png');

        // 3. Tournament List
        console.log('3. Capturing tournaments list...');
        await page.goto(`${BASE_URL}/${LOCALE}/dashboard/tournaments`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '03_tournaments.png'),
            fullPage: false
        });
        console.log('   Done: 03_tournaments.png');

        // 4. Tournament Detail (if exists)
        console.log('4. Capturing tournament detail...');
        try {
            // Try to click on first tournament
            const tournamentLink = await page.$('a[href*="/tournaments/"]');
            if (tournamentLink) {
                await tournamentLink.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
                await page.screenshot({
                    path: path.join(SCREENSHOTS_DIR, '04_tournament_detail.png'),
                    fullPage: false
                });
                console.log('   Done: 04_tournament_detail.png');
            } else {
                // Try demo tournament
                await page.goto(`${BASE_URL}/${LOCALE}/dashboard/tournaments/demo-tournament-completed`);
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
                await page.screenshot({
                    path: path.join(SCREENSHOTS_DIR, '04_tournament_detail.png'),
                    fullPage: false
                });
                console.log('   Done: 04_tournament_detail.png');
            }
        } catch (e) {
            console.log('   Could not capture tournament detail');
        }

        // 5. Participants
        console.log('5. Capturing participants...');
        try {
            await page.goto(`${BASE_URL}/${LOCALE}/dashboard/tournaments/demo-tournament-completed/participants`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '05_participants.png'),
                fullPage: false
            });
            console.log('   Done: 05_participants.png');
        } catch (e) {
            console.log('   Could not capture participants');
        }

        // 6. Judges
        console.log('6. Capturing judges...');
        try {
            await page.goto(`${BASE_URL}/${LOCALE}/dashboard/tournaments/demo-tournament-completed/judges`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '06_judges.png'),
                fullPage: false
            });
            console.log('   Done: 06_judges.png');
        } catch (e) {
            console.log('   Could not capture judges');
        }

        // 7. Live (Catture in tempo reale)
        console.log('7. Capturing live catches...');
        try {
            await page.goto(`${BASE_URL}/${LOCALE}/dashboard/tournaments/demo-tournament-completed/live`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '07_catches.png'),
                fullPage: false
            });
            console.log('   Done: 07_catches.png');
        } catch (e) {
            console.log('   Could not capture catches');
        }

        // 8. Leaderboard (pagina pubblica classifiche)
        console.log('8. Capturing leaderboard...');
        try {
            await page.goto(`${BASE_URL}/${LOCALE}/leaderboard`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '08_leaderboard.png'),
                fullPage: false
            });
            console.log('   Done: 08_leaderboard.png');
        } catch (e) {
            console.log('   Could not capture leaderboard');
        }

        // 9. Users
        console.log('9. Capturing users...');
        try {
            await page.goto(`${BASE_URL}/${LOCALE}/dashboard/users`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '09_users.png'),
                fullPage: false
            });
            console.log('   Done: 09_users.png');
        } catch (e) {
            console.log('   Could not capture users');
        }

        // 10. Archive
        console.log('10. Capturing archive...');
        try {
            await page.goto(`${BASE_URL}/${LOCALE}/dashboard/archive`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '10_archive.png'),
                fullPage: false
            });
            console.log('   Done: 10_archive.png');
        } catch (e) {
            console.log('   Could not capture archive');
        }

        // 11. Messages
        console.log('11. Capturing messages...');
        try {
            await page.goto(`${BASE_URL}/${LOCALE}/dashboard/messages`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '11_messages.png'),
                fullPage: false
            });
            console.log('   Done: 11_messages.png');
        } catch (e) {
            console.log('   Could not capture messages');
        }

        // 12. Public association page
        console.log('12. Capturing public association page...');
        try {
            await page.goto(`${BASE_URL}/${LOCALE}/associazioni/ischiafishing`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '12_association_public.png'),
                fullPage: false
            });
            console.log('   Done: 12_association_public.png');
        } catch (e) {
            console.log('   Could not capture public association page');
        }

        console.log('\n=== Screenshot capture complete! ===');
        console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);

    } catch (error) {
        console.error('Error during capture:', error.message);
    } finally {
        await browser.close();
    }
}

captureScreenshots();
