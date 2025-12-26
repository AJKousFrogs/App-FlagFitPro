import { test, expect } from "@playwright/test";

test.describe("User Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    // Navigate to app first before accessing localStorage
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("should display registration page with form fields", async ({ page }) => {
    await page.goto("/register");

    // Wait for Angular to load
    await page.waitForSelector("app-register", { timeout: 10000 });

    // Verify registration form is displayed
    await expect(page.locator("h1.register-title")).toContainText("Create Your Account");

    // Verify form fields exist
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#confirmPassword")).toBeVisible();
  });

  test("should show validation errors for empty registration form", async ({ page }) => {
    await page.goto("/register");
    await page.waitForSelector("app-register", { timeout: 10000 });

    // The submit button should be disabled when form is empty/invalid
    const submitButton = page.locator("p-button[type='submit'] button");
    await expect(submitButton).toBeDisabled();
  });

  test("should navigate to login from registration page", async ({ page }) => {
    await page.goto("/register");
    await page.waitForSelector("app-register", { timeout: 10000 });

    // Click the login link
    await page.click("a[href='/login']");

    // Should navigate to login page
    await page.waitForURL(/\/login/);
    await expect(page.locator("h1.login-title")).toContainText("Sign in to FlagFit Pro");
  });

  test("should display login page with form fields", async ({ page }) => {
    await page.goto("/login");

    // Wait for Angular to load
    await page.waitForSelector("app-login", { timeout: 10000 });

    // Verify login form is displayed
    await expect(page.locator("h1.login-title")).toContainText("Sign in to FlagFit Pro");

    // Verify form fields exist
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("should show demo mode message on localhost", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("app-login", { timeout: 10000 });

    // Demo mode should be active on localhost
    const demoAlert = page.locator(".alert-info");
    await expect(demoAlert).toContainText("Demo Mode");
  });

  test("should pre-fill credentials in demo mode", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("app-login", { timeout: 10000 });

    // In demo mode, email should be pre-filled
    const emailInput = page.locator("#email");
    await expect(emailInput).toHaveValue("test@flagfitpro.com");

    // Password should also be pre-filled
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toHaveValue("TestDemo123!");
  });

  test("should navigate to register from login page", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("app-login", { timeout: 10000 });

    // Click the create account link
    await page.click("a.login-create-link");

    // Should navigate to register page
    await page.waitForURL(/\/register/);
    await expect(page.locator("h1.register-title")).toContainText("Create Your Account");
  });

  test("should navigate to reset password from login page", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("app-login", { timeout: 10000 });

    // Click the forgot password link
    await page.click("a[href='/reset-password']");

    // Should navigate to reset password page
    await page.waitForURL(/\/reset-password/);
  });

  test("should show remember me checkbox on login", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("app-login", { timeout: 10000 });

    // Verify remember me checkbox exists
    const rememberCheckbox = page.locator("#remember");
    await expect(rememberCheckbox).toBeVisible();
  });

  test("should redirect to login when accessing protected route", async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto("/dashboard");

    // Should be redirected to login page with returnUrl
    await page.waitForURL(/\/login/);
    await expect(page.locator("h1.login-title")).toContainText("Sign in to FlagFit Pro");
  });

  test("should display landing page correctly", async ({ page }) => {
    await page.goto("/");

    // Wait for Angular to load
    await page.waitForSelector("app-landing", { timeout: 10000 });

    // Verify landing page content
    await expect(page.locator("h1.hero-title")).toContainText("Elevate Your Flag Football Game");
  });
});
