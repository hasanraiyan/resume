from playwright.sync_api import sync_playwright, expect
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to the login page
    page.goto("http://localhost:3000/login")

    # Fill in the credentials
    page.fill('input[name="username"]', os.environ.get("ADMIN_USERNAME", "admin"))
    page.fill('input[name="password"]', os.environ.get("ADMIN_PASSWORD", "admin"))

    # Click the login button
    page.click('button[type="submit"]')

    # Wait for navigation to the admin page
    page.wait_for_url("http://localhost:3000/admin")

    # Go to the meet page
    page.goto("http://localhost:3000/meet")

    # Take a screenshot of the lobby
    page.screenshot(path="jules-scratch/verification/lobby.png")

    # Click the "New meeting" button
    page.click('button:has-text("New meeting")')

    # Wait for the page to navigate to the green room
    page.wait_for_url("http://localhost:3000/meet/**")

    # Take a screenshot of the green room
    page.screenshot(path="jules-scratch/verification/green-room.png")

    # Click the "Join now" button
    page.click('button:has-text("Join now")')

    # Take a screenshot of the in-meeting page
    page.screenshot(path="jules-scratch/verification/in-meeting.png")


    # ---------------------
    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)