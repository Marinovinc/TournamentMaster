"""
Final Complete Test - All Improvements
"""
from playwright.sync_api import sync_playwright
import time

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        results = []

        print("=" * 70)
        print("FINAL TEST SUITE - TournamentMaster Improvements")
        print("=" * 70)

        # Test 1: Homepage Features Section
        print("\n[1/5] Testing Homepage Features Section...")
        page.goto("http://localhost:3000/it", wait_until="networkidle")
        time.sleep(2)

        features_title = page.locator('text="Tutto quello che serve per i tuoi tornei"')
        has_features = features_title.count() > 0
        results.append(("Homepage Features Section", has_features))
        print(f"      Result: {'PASS' if has_features else 'FAIL'}")

        # Test 2: Footer Social Links
        print("\n[2/5] Testing Footer Social Links...")
        footer = page.locator('footer')
        facebook = page.locator('a[aria-label="Facebook"]')
        instagram = page.locator('a[aria-label="Instagram"]')
        has_social = facebook.count() > 0 and instagram.count() > 0
        results.append(("Footer Social Links", has_social))
        print(f"      Result: {'PASS' if has_social else 'FAIL'}")
        page.screenshot(path="C:/Users/marin/Downloads/TournamentMaster/test_homepage_final.png")

        # Test 3: Tournaments Search Bar
        print("\n[3/5] Testing Search Bar...")
        page.goto("http://localhost:3000/it/tournaments", wait_until="networkidle")
        time.sleep(2)

        search_input = page.locator('input[placeholder*="Cerca"]')
        has_search = search_input.count() > 0
        results.append(("Search Bar Present", has_search))
        print(f"      Result: {'PASS' if has_search else 'FAIL'}")

        # Test search filtering
        if has_search:
            print("      Testing search filtering...")
            search_input.fill("Capri")
            time.sleep(1)
            counter = page.locator('text=/Mostrando \\d+ di \\d+/')
            if counter.count() > 0:
                print(f"      Filter result: {counter.first.inner_text()}")

        # Test 4: Load More
        print("\n[4/5] Testing Load More...")
        search_input.fill("")  # Clear search
        time.sleep(1)

        load_more = page.locator('button:has-text("Carica altri")')
        has_load_more = load_more.count() > 0
        results.append(("Load More Button", has_load_more))
        print(f"      Result: {'PASS' if has_load_more else 'FAIL'}")

        if has_load_more:
            counter_before = page.locator('text=/Mostrando \\d+ di \\d+/').first.inner_text()
            load_more.click()
            time.sleep(1)
            counter_after = page.locator('text=/Mostrando \\d+ di \\d+/').first.inner_text()
            print(f"      Before: {counter_before}")
            print(f"      After:  {counter_after}")
            load_more_works = counter_before != counter_after
            results.append(("Load More Works", load_more_works))

        page.screenshot(path="C:/Users/marin/Downloads/TournamentMaster/test_tournaments_final.png")

        # Test 5: Tournament Card Features
        print("\n[5/5] Testing Tournament Card Features...")
        page.goto("http://localhost:3000/it/tournaments", wait_until="networkidle")
        time.sleep(2)

        # Check for "Giorni di Pesca" text
        giorni_pesca = page.locator('text="Giorni di Pesca:"')
        has_giorni = giorni_pesca.count() > 0

        # Check for "Iscrizioni entro" text
        iscrizioni = page.locator('text=/Iscrizioni entro/')
        has_iscrizioni = iscrizioni.count() > 0

        card_features = has_giorni and has_iscrizioni
        results.append(("Card Date Features", card_features))
        print(f"      'Giorni di Pesca': {'FOUND' if has_giorni else 'NOT FOUND'}")
        print(f"      'Iscrizioni entro': {'FOUND' if has_iscrizioni else 'NOT FOUND'}")
        print(f"      Result: {'PASS' if card_features else 'FAIL'}")

        browser.close()

        # Summary
        print("\n" + "=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
        passed = sum(1 for _, r in results if r)
        total = len(results)

        for name, result in results:
            icon = "PASS" if result else "FAIL"
            print(f"  [{icon}] {name}")

        print(f"\nTotal: {passed}/{total} tests passed")
        print("=" * 70)

        return passed == total

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
