from playwright.sync_api import sync_playwright
import time
import json
import base64

def test_mcp_admin_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We must actually login using credentials. Next-auth session token mock isn't enough because the page itself requires a proper auth session. Let's just create an authenticated context properly.
        # Next-auth uses a JWT token. Let's mock the session route and tell next-auth we're logged in.
        # Actually it redirects us to the login page.
        # Let's mock the credentials provider response.
        page = browser.new_page()

        # Let's intercept the session call to return a valid session. NextAuth gets session from /api/auth/session
        page.route("**/api/auth/session", lambda route: route.fulfill(
            status=200,
            json={"user": {"name": "Admin", "email": "admin@example.com", "role": "admin"}}
        ))

        # We also need to set the `next-auth.session-token` cookie so middleware lets us through.
        page.context.add_cookies([{
            "name": "next-auth.session-token",
            "value": "mocked-token-for-admin",
            "domain": "localhost",
            "path": "/"
        }])

        # And let's intercept nextjs middleware which checks for this token.
        # The easiest way is to mock all /api calls needed for the page.
        page.route("**/api/admin/mcp-servers", lambda route: route.fulfill(status=200, json={"servers": []}))
        page.route("**/api/admin/agents", lambda route: route.fulfill(status=200, json={"agents": []}))

        page.goto("http://localhost:3000/admin/agents")

        # Take a screenshot to see if middleware still blocks us
        time.sleep(2)
        page.screenshot(path="mcp_ui_auth.png", full_page=True)

        try:
            # Click the MCP Tools tab
            page.get_by_text("MCP Tools").click(timeout=5000)

            # Click Configure Local SSE Server
            page.get_by_role("button", name="Configure Local SSE Server").click(timeout=5000)

            # Select HTTP (Remote API)
            page.locator("select").select_option("http")

            # Fill in header inputs
            page.get_by_placeholder("Key (e.g., Authorization)").fill("Authorization")
            page.get_by_placeholder("Value (e.g., Bearer token...)").fill("Bearer custom_token")

            # Click Add Header button
            page.get_by_role("button", name="Add").click()

            # Add another header
            page.get_by_placeholder("Key (e.g., Authorization)").fill("Custom-Id")
            page.get_by_placeholder("Value (e.g., Bearer token...)").fill("12345")
            page.get_by_role("button", name="Add").click()

            # Wait a moment to ensure UI updates
            time.sleep(2)

            # Take a screenshot
            page.screenshot(path="mcp_ui_success.png", full_page=True)
        except Exception as e:
            print(f"Error clicking: {e}")

        browser.close()

if __name__ == "__main__":
    test_mcp_admin_ui()
