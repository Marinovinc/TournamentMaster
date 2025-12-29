"""
Test Load More and Banner Images functionality
"""
from playwright.sync_api import sync_playwright
import time

def test_tournaments_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("=" * 60)
        print("Testing Tournaments Page with 8 Tournaments")
        print("=" * 60)

        # Navigate to tournaments
        page.goto("http://localhost:3000/it/tournaments", wait_until="networkidle")
        time.sleep(2)

        # Check initial load (should show 6 cards)
        cards = page.locator('[class*="rounded-lg"][class*="overflow-hidden"]').all()
        print(f"\n1. Initial Cards Displayed: {len(cards)}")

        # Check for Load More button
        load_more = page.locator('button:has-text("Carica altri")')
        has_load_more = load_more.count() > 0
        print(f"2. Load More Button Present: {'YES' if has_load_more else 'NO'}")

        # Check counter text
        counter = page.locator('text=/Mostrando \\d+ di \\d+/')
        if counter.count() > 0:
            counter_text = counter.first.inner_text()
            print(f"3. Counter Text: {counter_text}")
        else:
            print("3. Counter Text: NOT FOUND")

        # Click Load More if present
        if has_load_more:
            print("\n4. Clicking Load More...")
            load_more.click()
            time.sleep(1)

            # Check cards after load more
            cards_after = page.locator('[class*="rounded-lg"][class*="overflow-hidden"]').all()
            print(f"5. Cards After Load More: {len(cards_after)}")

            # Check counter again
            if counter.count() > 0:
                counter_text = counter.first.inner_text()
                print(f"6. Counter After: {counter_text}")

        # Check for banner images
        print("\n7. Checking Banner Images...")
        images = page.locator('img[alt*="Banner"]').all()
        print(f"   Found {len(images)} banner images")

        # Check for discipline badges
        print("\n8. Checking Discipline Badges...")
        badges = page.locator('[class*="Badge"]').all()
        print(f"   Found {len(badges)} badges")

        # Take screenshot
        page.screenshot(path="C:/Users/marin/Downloads/TournamentMaster/test_tournaments_8.png")
        print("\n9. Screenshot saved: test_tournaments_8.png")

        browser.close()
        print("\n" + "=" * 60)
        print("TEST COMPLETED")
        print("=" * 60)

if __name__ == "__main__":
    test_tournaments_page()
