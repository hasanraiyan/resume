from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.set_viewport_size({"width": 375, "height": 812})

    # We must mock /api/auth/session to simulate a logged-in user to bypass the login page
    page.route("*/**/api/auth/session", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"user": {"id": "123", "name": "Test User", "email": "test@test.com", "role": "user"}}'
    ))

    # Mock the bootstrap to return empty lists so we don't block on MongoDB
    page.route("*/**/api/money/bootstrap*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"accounts": [], "categories": [], "transactions": [], "stats": {"totalAccountBalance": 0, "totalTransactionCount": 0, "accountCount": 0, "categoryCount": 0}}'
    ))

    page.goto("http://localhost:3000/apps/pocketly")
    page.wait_for_timeout(2000)

    # Click the Settings shortcut button on mobile header
    page.get_by_label("Open settings").click()
    page.wait_for_timeout(1000)

    # Click on the Export button in the Settings tab
    # Find the button that contains the text 'Export'
    page.get_by_role("button", name="Export", exact=True).click()
    page.wait_for_timeout(1000)

    # Wait for the modal to appear (matching the H2 inside the modal)
    page.locator("h2").filter(has_text="Export Data").wait_for(state="visible")
    page.wait_for_timeout(1000)

    # Take screenshot of the export modal
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(2000)

if __name__ == "__main__":
    import os
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
