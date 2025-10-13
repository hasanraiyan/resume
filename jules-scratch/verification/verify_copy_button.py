from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.goto("http://localhost:3000/blog/setting-up-prettier-husky-lint-staged-for-a-clean-mern-stack-workflow")

    # Wait for the copy button to be visible and then take a screenshot
    copy_button = page.locator('button[aria-label="Copy to clipboard"]')
    copy_button.wait_for(state='visible')
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
