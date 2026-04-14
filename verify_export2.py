from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.set_viewport_size({"width": 375, "height": 812})

    # Catch console errors
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda err: errors.append(err.message))

    page.route("*/**/api/auth/session", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"user": {"id": "123", "name": "Test User", "email": "test@test.com", "role": "user"}}'
    ))

    page.route("*/**/api/money/bootstrap*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"accounts": [], "categories": [], "transactions": [{"date": "2026-04-14T00:00:00.000Z", "type": "income", "amount": 100, "categoryId": "123"}], "stats": {"totalAccountBalance": 0, "totalTransactionCount": 0, "accountCount": 0, "categoryCount": 0}}'
    ))

    page.goto("http://localhost:3000/apps/pocketly")
    page.wait_for_timeout(2000)

    page.get_by_label("Open settings").click()
    page.wait_for_timeout(1000)

    page.get_by_role("button", name="Export", exact=True).click()
    page.wait_for_timeout(1000)

    page.locator("h2").filter(has_text="Export Data").wait_for(state="visible")
    page.wait_for_timeout(1000)

    # Click generate pdf
    page.get_by_role("button", name="Generate PDF").click()
    page.wait_for_timeout(2000)

    print("Errors:", errors)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
