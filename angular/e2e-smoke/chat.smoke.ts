import { test, expect } from "@playwright/test";

/**
 * Merlin chat smoke. The composer is now wired to POST /api/ai/chat (no longer a
 * dead stub). With AI processing enabled (the default when privacy settings can't
 * load in this backend-less harness), the input is interactive and the Send button
 * is present. We don't assert a real model reply (no backend) — only that the
 * screen boots, the composer accepts input, and nothing throws.
 */
test("Merlin renders a live composer that accepts input, no uncaught errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/chat");
  await expect(page).toHaveURL(/\/chat/);
  await expect(page.locator(".topbar h1")).toContainText("Merlin");

  // Welcome bubble + a live (non-disabled) composer input.
  await expect(page.locator(".thread .bubble.ai").first()).toBeVisible();
  const input = page.locator(".composer input").first();
  await expect(input).toBeEnabled();
  await input.fill("should I sprint today?");
  await expect(input).toHaveValue("should I sprint today?");

  // Send button present and reachable.
  await expect(
    page.locator(".composer .btn", { hasText: "Send" }),
  ).toBeVisible();

  expect(errors, `uncaught errors:\n${errors.join("\n")}`).toEqual([]);
});
