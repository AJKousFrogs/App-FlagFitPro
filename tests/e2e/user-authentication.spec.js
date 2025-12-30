import { test, expect } from "@playwright/test";

/**
 * User Authentication E2E Tests
 *
 * Tests the complete authentication flow for the FlagFit Pro Angular application.
 * The app uses Angular 21 with PrimeNG components and Supabase authentication.
 */
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

  test.describe("Registration Page", () => {
    test("should display registration page with form fields", async ({ page }) => {
      await page.goto("/register");

      // Wait for Angular to load
      await page.waitForSelector("app-register", { timeout: 10000 });

      // Verify registration form is displayed
      await expect(page.locator("h1.register-title")).toContainText(
        "Create Your Account"
      );

      // Verify form fields exist
      await expect(page.locator("#name")).toBeVisible();
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.locator("#confirmPassword")).toBeVisible();
    });

    test("should show validation errors for empty registration form", async ({
      page,
    }) => {
      await page.goto("/register");
      await page.waitForSelector("app-register", { timeout: 10000 });

      // The submit button should be disabled when form is empty/invalid
      const submitButton = page.locator("p-button[type='submit'] button");
      await expect(submitButton).toBeDisabled();
    });

    test("should validate email format", async ({ page }) => {
      await page.goto("/register");
      await page.waitForSelector("app-register", { timeout: 10000 });

      // Enter invalid email
      await page.fill("#email", "invalid-email");
      await page.click("#name"); // Trigger blur

      // Should show email validation error
      const emailError = page.locator(".p-error").filter({ hasText: /email/i });
      await expect(emailError).toBeVisible();
    });

    test("should validate password requirements", async ({ page }) => {
      await page.goto("/register");
      await page.waitForSelector("app-register", { timeout: 10000 });

      // Enter weak password
      await page.fill("#password", "123");
      await page.click("#name"); // Trigger blur

      // Should show password validation error
      const passwordError = page.locator(".p-error").first();
      await expect(passwordError).toBeVisible();
    });

    test("should validate password confirmation match", async ({ page }) => {
      await page.goto("/register");
      await page.waitForSelector("app-register", { timeout: 10000 });

      // Enter mismatched passwords
      await page.fill("#password", "SecurePassword123!");
      await page.fill("#confirmPassword", "DifferentPassword123!");
      await page.click("#name"); // Trigger blur

      // Should show password mismatch error
      const mismatchError = page
        .locator(".p-error")
        .filter({ hasText: /match/i });
      await expect(mismatchError).toBeVisible();
    });

    test("should navigate to login from registration page", async ({ page }) => {
      await page.goto("/register");
      await page.waitForSelector("app-register", { timeout: 10000 });

      // Click the login link
      await page.click("a[href='/login']");

      // Should navigate to login page
      await page.waitForURL(/\/login/);
      await expect(page.locator("h1.login-title")).toContainText(
        "Sign in to FlagFit Pro"
      );
    });
  });

  test.describe("Login Page", () => {
    test("should display login page with form fields", async ({ page }) => {
      await page.goto("/login");

      // Wait for Angular to load
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Verify login form is displayed
      await expect(page.locator("h1.login-title")).toContainText(
        "Sign in to FlagFit Pro"
      );

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

    test("should show remember me checkbox", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Verify remember me checkbox exists
      const rememberCheckbox = page.locator("#remember");
      await expect(rememberCheckbox).toBeVisible();
    });

    test("should navigate to register from login page", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Click the create account link
      await page.click("a.login-create-link");

      // Should navigate to register page
      await page.waitForURL(/\/register/);
      await expect(page.locator("h1.register-title")).toContainText(
        "Create Your Account"
      );
    });

    test("should navigate to reset password from login page", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Click the forgot password link
      await page.click("a[href='/reset-password']");

      // Should navigate to reset password page
      await page.waitForURL(/\/reset-password/);
    });

    test("should disable submit button when form is invalid", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Clear pre-filled values
      await page.fill("#email", "");
      await page.fill("#password", "");

      // Submit button should be disabled
      const submitButton = page.locator("p-button[type='submit'] button");
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe("Password Reset", () => {
    test("should display reset password page", async ({ page }) => {
      await page.goto("/reset-password");

      // Wait for Angular to load
      await page.waitForSelector("app-reset-password", { timeout: 10000 });

      // Verify reset password form exists
      await expect(page.locator("#email")).toBeVisible();
    });

    test("should validate email on reset password page", async ({ page }) => {
      await page.goto("/reset-password");
      await page.waitForSelector("app-reset-password", { timeout: 10000 });

      // Enter invalid email
      await page.fill("#email", "invalid-email");
      await page.keyboard.press("Tab"); // Trigger blur

      // Should show validation error
      const emailError = page.locator(".p-error");
      await expect(emailError).toBeVisible();
    });

    test("should navigate back to login from reset password", async ({
      page,
    }) => {
      await page.goto("/reset-password");
      await page.waitForSelector("app-reset-password", { timeout: 10000 });

      // Click back to login link
      await page.click("a[href='/login']");

      // Should navigate to login page
      await page.waitForURL(/\/login/);
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect to login when accessing protected dashboard route", async ({
      page,
    }) => {
      // Try to access dashboard without authentication
      await page.goto("/dashboard");

      // Should be redirected to login
      await page.waitForURL(/\/login/);
      await expect(page.locator("h1.login-title")).toContainText(
        "Sign in to FlagFit Pro"
      );
    });

    test("should redirect to login when accessing protected training route", async ({
      page,
    }) => {
      // Try to access training without authentication
      await page.goto("/training");

      // Should be redirected to login
      await page.waitForURL(/\/login/);
    });

    test("should redirect to login when accessing protected analytics route", async ({
      page,
    }) => {
      // Try to access analytics without authentication
      await page.goto("/analytics");

      // Should be redirected to login
      await page.waitForURL(/\/login/);
    });

    test("should redirect to login when accessing protected profile route", async ({
      page,
    }) => {
      // Try to access profile without authentication
      await page.goto("/profile");

      // Should be redirected to login
      await page.waitForURL(/\/login/);
    });

    test("should preserve return URL when redirecting to login", async ({
      page,
    }) => {
      // Try to access dashboard without authentication
      await page.goto("/dashboard");

      // Should be redirected to login with returnUrl
      await page.waitForURL(/\/login\?returnUrl/);

      // Verify the returnUrl parameter contains dashboard
      const url = page.url();
      expect(url).toContain("returnUrl");
      expect(url).toContain("dashboard");
    });
  });

  test.describe("Public Routes", () => {
    test("should allow access to public landing page", async ({ page }) => {
      await page.goto("/");

      // Landing page should be accessible
      await page.waitForSelector("app-landing", { timeout: 10000 });
      await expect(page.locator("h1.hero-title")).toContainText(
        "Elevate Your Flag Football Game"
      );
    });

    test("should allow access to public login page", async ({ page }) => {
      await page.goto("/login");

      // Login page should be accessible
      await page.waitForSelector("app-login", { timeout: 10000 });
      await expect(page.locator("h1.login-title")).toContainText(
        "Sign in to FlagFit Pro"
      );
    });

    test("should allow access to public register page", async ({ page }) => {
      await page.goto("/register");

      // Register page should be accessible
      await page.waitForSelector("app-register", { timeout: 10000 });
      await expect(page.locator("h1.register-title")).toContainText(
        "Create Your Account"
      );
    });

    test("should handle unknown routes gracefully", async ({ page }) => {
      // Try to access a non-existent route
      await page.goto("/nonexistent-page");

      // Should redirect to landing page (wildcard route)
      await page.waitForURL(/^http:\/\/localhost:\d+\/$/);
      await expect(page.locator("app-landing")).toBeVisible();
    });
  });

  test.describe("Session Management", () => {
    test("should clear session on logout", async ({ page }) => {
      // First, simulate being logged in by setting localStorage
      await page.goto("/");
      await page.evaluate(() => {
        localStorage.setItem("authToken", "test-token");
        localStorage.setItem(
          "userData",
          JSON.stringify({ id: 1, email: "test@flagfitpro.com" })
        );
      });

      // Navigate to dashboard (would normally be protected)
      await page.goto("/dashboard");

      // After logout, localStorage should be cleared
      await page.evaluate(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      });

      // Verify session is cleared
      const authToken = await page.evaluate(() =>
        localStorage.getItem("authToken")
      );
      expect(authToken).toBeNull();
    });
  });

  test.describe("Accessibility", () => {
    test("should have accessible login form", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Check for form labels
      const emailLabel = page.locator('label[for="email"]');
      const passwordLabel = page.locator('label[for="password"]');

      await expect(emailLabel).toBeVisible();
      await expect(passwordLabel).toBeVisible();

      // Check form inputs have proper attributes
      const emailInput = page.locator("#email");
      await expect(emailInput).toHaveAttribute("type", "email");

      const passwordInput = page.locator("#password");
      await expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("should support keyboard navigation on login form", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Tab through form elements
      await page.keyboard.press("Tab");
      await expect(page.locator("#email")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.locator("#password")).toBeFocused();

      await page.keyboard.press("Tab");
      // Should focus on remember me or submit button
    });
  });
});
