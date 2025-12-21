import { test, expect } from "@playwright/test";

test.describe("User Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("should complete user registration flow", async ({ page }) => {
    await page.goto("/register.html");

    // Verify registration form is displayed
    await expect(page.locator("h1")).toContainText("Register");
    await expect(page.locator("#registration-form")).toBeVisible();

    // Fill out registration form
    await page.fill("#email", "newuser@example.com");
    await page.fill("#password", "StrongPassword123!");
    await page.fill("#confirmPassword", "StrongPassword123!");
    await page.fill("#firstName", "John");
    await page.fill("#lastName", "Athlete");
    await page.selectOption("#role", "athlete");
    await page.selectOption("#position", "wide_receiver");

    // Submit registration
    await page.click("#register-btn");

    // Verify successful registration
    await expect(page.locator(".success-message")).toContainText(
      "Registration successful",
    );

    // Should redirect to login or dashboard
    await page.waitForURL(/\/(login|dashboard)\.html/);
  });

  test("should handle registration validation errors", async ({ page }) => {
    await page.goto("/register.html");

    // Try to submit with missing required fields
    await page.click("#register-btn");

    // Verify validation errors are displayed
    await expect(page.locator(".error-message")).toContainText("required");
  });

  test("should complete user login flow", async ({ page }) => {
    await page.goto("/login.html");

    // Verify login form is displayed
    await expect(page.locator("h1")).toContainText("Login");
    await expect(page.locator("#login-form")).toBeVisible();

    // Fill out login credentials
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "TestPassword123!");

    // Submit login
    await page.click("#login-btn");

    // Verify successful login and redirect to dashboard
    await page.waitForURL("/dashboard.html");
    await expect(page.locator(".welcome-message")).toContainText("Welcome");
  });

  test("should handle invalid login credentials", async ({ page }) => {
    await page.goto("/login.html");

    // Try login with invalid credentials
    await page.fill("#email", "invalid@example.com");
    await page.fill("#password", "wrongpassword");
    await page.click("#login-btn");

    // Verify error message is displayed
    await expect(page.locator(".error-message")).toContainText(
      "Invalid credentials",
    );

    // Should remain on login page
    await expect(page).toHaveURL("/login.html");
  });

  test("should handle password reset flow", async ({ page }) => {
    await page.goto("/login.html");

    // Click forgot password link
    await page.click("#forgot-password-link");
    await page.waitForURL("/reset-password.html");

    // Fill out password reset form
    await page.fill("#email", "test@example.com");
    await page.click("#reset-btn");

    // Verify reset email confirmation
    await expect(page.locator(".info-message")).toContainText(
      "Password reset email sent",
    );
  });

  test("should maintain authentication state across pages", async ({
    page,
  }) => {
    // Login first
    await page.goto("/login.html");
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "TestPassword123!");
    await page.click("#login-btn");
    await page.waitForURL("/dashboard.html");

    // Navigate to other pages and verify user remains authenticated
    await page.goto("/training.html");
    await expect(page.locator(".user-info")).toContainText("test@example.com");

    await page.goto("/analytics.html");
    await expect(page.locator(".user-info")).toContainText("test@example.com");

    // Verify auth token exists in localStorage
    const authToken = await page.evaluate(() =>
      localStorage.getItem("auth_token"),
    );
    expect(authToken).toBeTruthy();
  });

  test("should handle logout functionality", async ({ page }) => {
    // Login first
    await page.goto("/login.html");
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "TestPassword123!");
    await page.click("#login-btn");
    await page.waitForURL("/dashboard.html");

    // Logout
    await page.click("#logout-btn");

    // Verify logout success and redirect
    await page.waitForURL("/index.html");

    // Verify auth data is cleared
    const authToken = await page.evaluate(() =>
      localStorage.getItem("auth_token"),
    );
    expect(authToken).toBeNull();
  });

  test("should redirect unauthenticated users from protected pages", async ({
    page,
  }) => {
    // Try to access protected page without authentication
    await page.goto("/dashboard.html");

    // Should redirect to login page
    await page.waitForURL("/login.html");
    await expect(page.locator(".info-message")).toContainText("Please log in");
  });

  test("should handle session expiration gracefully", async ({ page }) => {
    // Login first
    await page.goto("/login.html");
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "TestPassword123!");
    await page.click("#login-btn");
    await page.waitForURL("/dashboard.html");

    // Simulate expired token
    await page.evaluate(() => {
      localStorage.setItem("auth_token", "expired-token");
    });

    // Try to make an authenticated request
    await page.reload();

    // Should detect expired token and redirect to login
    await page.waitForURL("/login.html");
    await expect(page.locator(".info-message")).toContainText(
      "Session expired",
    );
  });

  test("should validate password strength requirements", async ({ page }) => {
    await page.goto("/register.html");

    const weakPasswords = ["123", "password", "abc123", "Password", "12345678"];

    for (const password of weakPasswords) {
      await page.fill("#password", password);
      await page.fill("#confirmPassword", password);

      // Check if password strength indicator shows weak
      const strengthIndicator = page.locator("#password-strength");
      await expect(strengthIndicator).toContainText(/weak|invalid/i);
    }

    // Test strong password
    await page.fill("#password", "StrongP@ssw0rd123!");
    await page.fill("#confirmPassword", "StrongP@ssw0rd123!");

    const strengthIndicator = page.locator("#password-strength");
    await expect(strengthIndicator).toContainText(/strong|valid/i);
  });

  test("should handle remember me functionality", async ({ page }) => {
    await page.goto("/login.html");

    await page.fill("#email", "test@example.com");
    await page.fill("#password", "TestPassword123!");
    await page.check("#remember-me");
    await page.click("#login-btn");

    await page.waitForURL("/dashboard.html");

    // Close and reopen browser (simulate new session)
    await page.context().storageState({ path: "auth-state.json" });

    // New page with stored state should remain logged in
    const newPage = await page.context().newPage();
    await newPage.goto("/dashboard.html");

    await expect(newPage.locator(".welcome-message")).toContainText("Welcome");
  });
});
