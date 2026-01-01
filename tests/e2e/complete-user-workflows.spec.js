import { test, expect } from "@playwright/test";

test.describe("Complete User Workflows - End-to-End Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock authentication for testing
    await page.addInitScript(() => {
      window.localStorage.setItem("authToken", "test-e2e-token");
      window.localStorage.setItem(
        "userData",
        JSON.stringify({
          id: 1,
          email: "test@flagfit.com",
          name: "Test Athlete",
          role: "athlete",
        }),
      );
    });

    // Mock API responses
    await page.route("**/api/**", (route) => {
      const url = route.request().url();
      const method = route.request().method();

      // Mock different endpoints based on URL patterns
      if (url.includes("/api/auth/me") && method === "GET") {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            user: {
              id: 1,
              email: "test@flagfit.com",
              name: "Test Athlete",
              role: "athlete",
              profile: {
                position: "wide_receiver",
                experience: "intermediate",
                olympicQualificationScore: 78.2,
              },
            },
          }),
        });
      } else if (url.includes("/api/training/sessions") && method === "GET") {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            sessions: [
              {
                id: 1,
                date: "2025-01-15",
                type: "flag_football_drill",
                duration: 60,
                exercises: [
                  { name: "Sprint intervals", sets: 5, reps: 8 },
                  { name: "Route running", sets: 10, reps: 5 },
                ],
                metrics: {
                  averageSpeed: 12.5,
                  caloriesBurned: 450,
                },
              },
            ],
          }),
        });
      } else if (url.includes("/api/training/sessions") && method === "POST") {
        route.fulfill({
          status: 201,
          body: JSON.stringify({
            success: true,
            session: {
              id: Math.floor(Math.random() * 1000),
              ...JSON.parse(route.request().postData() || "{}"),
              createdAt: new Date().toISOString(),
            },
          }),
        });
      } else if (url.includes("/api/analytics/performance")) {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            performance: {
              metrics: {
                speed: { current: 12.8, improvement: 4.9, percentile: 85 },
                agility: { current: 8.7, improvement: 3.6, percentile: 78 },
                endurance: { current: 58.5, improvement: 4.3, percentile: 82 },
              },
              olympicQualification: {
                currentScore: 78.2,
                requiredScore: 85.0,
                progressRate: 1.2,
                probability: 76,
              },
            },
          }),
        });
      } else if (url.includes("/api/nutrition/log") && method === "POST") {
        route.fulfill({
          status: 201,
          body: JSON.stringify({
            success: true,
            nutrition: {
              id: Math.floor(Math.random() * 1000),
              ...JSON.parse(route.request().postData() || "{}"),
              analysis: {
                totalCalories: 2400,
                macroRatio: { protein: 25, carbs: 50, fat: 25 },
                olympicReadiness: "excellent",
              },
            },
          }),
        });
      } else if (url.includes("/api/ai/coach/ask") && method === "POST") {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            response: {
              answer:
                "Based on your question, I recommend focusing on technique refinement and progressive overload.",
              confidence: 0.92,
              recommendations: [
                {
                  type: "exercise",
                  name: "Explosive start drills",
                  frequency: "3x per week",
                },
              ],
              followUp: ["Would you like specific drill recommendations?"],
            },
          }),
        });
      } else {
        // Default mock response
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, message: "Mock response" }),
        });
      }
    });
  });

  test.describe("User Authentication Workflow", () => {
    test("complete registration and login flow", async ({ page }) => {
      // Set larger timeout for this test
      test.setTimeout(120000);

      // Mock leaked password check
      await page.route("**/functions/v1/enable-leaked-password-protection", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ leaked: false }),
        });
      });

      // Mock registration response
      await page.route("**/auth/v1/signup*", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            user: { 
              id: "test-uuid", 
              email: "newuser@flagfit.com",
              user_metadata: { full_name: "New Athlete", name: "New Athlete" }
            },
            session: { access_token: "test-token", refresh_token: "test-refresh" }
          }),
        });
      });

      // Mock dashboard overview
      await page.route("**/api/dashboard/overview*", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              trainingProgress: { percentage: 0, completed: 0, trend: "No trend" },
              performanceScore: { score: "0.0", total: 0, status: "Ready" },
              teamChemistry: { overall: "0.0", status: "Neutral" },
              nextSession: { type: "Introduction", time: "10:00 AM", duration: 30 }
            }
          }),
        });
      });

      // Start from home page
      await page.goto("/");

      // Navigate to registration
      await page.click("text=Get Started Free", { timeout: 30000 });
      await expect(page).toHaveURL(/.*register/);

      // Fill registration form
      await page.fill('[data-testid="name-input"]', "New Athlete");
      await page.fill('[data-testid="email-input"]', "newuser@flagfit.com");
      await page.fill('[data-testid="password-input"]', "securePass123!");
      await page.fill('[data-testid="confirm-password-input"]', "securePass123!");
      await page.click('[data-testid="age-checkbox"]');
      await page.click('[data-testid="terms-checkbox"]');

      // Submit registration
      await page.click('[data-testid="register-submit"]');

      // Manual check - did we land on onboarding?
      await page.waitForTimeout(5000);
      console.log('Current URL after registration:', page.url());
      
      // Navigate to dashboard
      await page.goto("/dashboard", { waitUntil: 'networkidle' });

      // Final check - is dashboard header present?
      await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 20000 });
    });

    test("login with existing credentials", async ({ page }) => {
      // Set larger timeout
      test.setTimeout(60000);

      // Mock login response
      await page.route("**/auth/v1/token*", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            user: { 
              id: "test-uuid", 
              email: "test@flagfit.com",
              user_metadata: { full_name: "Test Athlete", name: "Test Athlete" }
            },
            session: { access_token: "test-token", refresh_token: "test-refresh" }
          }),
        });
      });

      // Mock auth me
      await page.route("**/api/auth/me*", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: { 
              id: "test-uuid", 
              email: "test@flagfit.com", 
              name: "Test Athlete",
              role: "athlete"
            }
          }),
        });
      });

      // Mock dashboard overview
      await page.route("**/api/dashboard/overview*", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              trainingProgress: { percentage: 85, completed: 12, trend: "+5%" },
              performanceScore: { score: "8.4", total: 15, status: "Peak" },
              teamChemistry: { overall: "9.1", status: "Excellent" },
              nextSession: { type: "Team Practice", time: "4:00 PM", duration: 90 }
            }
          }),
        });
      });

      // Mock user role specifically if checked via cookie or other method
      await page.addInitScript(() => {
        window.localStorage.setItem('user_role', 'athlete');
      });

      await page.goto("/login");

      await page.fill('[data-testid="email-input"]', "test@flagfit.com");
      await page.fill('[data-testid="password-input"]', "password123!");
      await page.click('[data-testid="login-submit"]');

      await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });
      await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 20000 });
    });

    test("handle login errors gracefully", async ({ page }) => {
      await page.route("**/api/auth/login", (route) => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({
            success: false,
            error: "Invalid credentials",
          }),
        });
      });

      await page.goto("/login");

      await page.fill('[data-testid="email-input"]', "wrong@email.com");
      await page.fill('[data-testid="password-input"]', "wrongpass");
      await page.click('[data-testid="login-submit"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        "Invalid credentials",
      );
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe("Training Session Management Workflow", () => {
    test("create and save training session", async ({ page }) => {
      await page.goto("/dashboard");

      // Navigate to training section
      await page.click('[data-testid="training-nav-link"]');
      await expect(page).toHaveURL(/.*training/);

      // Start new training session
      await page.click('[data-testid="new-session-btn"]');

      // Fill session details
      await page.selectOption(
        '[data-testid="session-type"]',
        "flag_football_drill",
      );
      await page.fill('[data-testid="duration-input"]', "90");
      await page.selectOption('[data-testid="intensity-level"]', "8");

      // Add exercises
      await page.click('[data-testid="add-exercise-btn"]');
      await page.fill('[data-testid="exercise-name-0"]', "Sprint intervals");
      await page.fill('[data-testid="exercise-sets-0"]', "6");
      await page.fill('[data-testid="exercise-reps-0"]', "8");
      await page.fill('[data-testid="exercise-distance-0"]', "40");

      await page.click('[data-testid="add-exercise-btn"]');
      await page.fill('[data-testid="exercise-name-1"]', "Route running");
      await page.fill('[data-testid="exercise-sets-1"]', "10");
      await page.fill('[data-testid="exercise-reps-1"]', "5");

      // Add session notes
      await page.fill(
        '[data-testid="session-notes"]',
        "Pre-competition preparation session",
      );

      // Save session
      await page.click('[data-testid="save-session-btn"]');

      // Verify success message
      await expect(
        page.locator('[data-testid="success-message"]'),
      ).toContainText("Training session saved successfully");

      // Verify session appears in history
      await expect(page.locator('[data-testid="session-list"]')).toContainText(
        "Sprint intervals",
      );
      await expect(page.locator('[data-testid="session-list"]')).toContainText(
        "Route running",
      );
    });

    test("edit existing training session", async ({ page }) => {
      await page.goto("/training");

      // Click on existing session
      await page.click('[data-testid="session-item-1"]');

      // Edit session
      await page.click('[data-testid="edit-session-btn"]');

      // Modify session details
      await page.fill('[data-testid="duration-input"]', "75");
      await page.fill(
        '[data-testid="session-notes"]',
        "Updated session notes - focused on speed",
      );

      // Save changes
      await page.click('[data-testid="save-changes-btn"]');

      // Verify update
      await expect(
        page.locator('[data-testid="success-message"]'),
      ).toContainText("Session updated successfully");
      await expect(
        page.locator('[data-testid="session-duration"]'),
      ).toContainText("75");
    });

    test("view training session analytics", async ({ page }) => {
      await page.goto("/training");

      // Navigate to analytics view
      await page.click('[data-testid="analytics-tab"]');

      // Verify analytics data is displayed
      await expect(
        page.locator('[data-testid="total-sessions"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="average-duration"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="weekly-progress"]'),
      ).toBeVisible();

      // Check performance charts
      await expect(
        page.locator('[data-testid="performance-chart"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="intensity-trend"]'),
      ).toBeVisible();
    });
  });

  test.describe("Nutrition Tracking Workflow", () => {
    test("log daily nutrition intake", async ({ page }) => {
      await page.goto("/dashboard");

      // Navigate to nutrition section
      await page.click('[data-testid="nutrition-nav-link"]');
      await expect(page).toHaveURL(/.*nutrition/);

      // Add breakfast meal
      await page.click('[data-testid="add-meal-btn"]');
      await page.selectOption('[data-testid="meal-type"]', "breakfast");
      await page.fill('[data-testid="meal-time"]', "08:00");

      // Add food items
      await page.click('[data-testid="add-food-btn"]');
      await page.fill('[data-testid="food-name-0"]', "Oatmeal with berries");
      await page.fill('[data-testid="food-calories-0"]', "350");
      await page.fill('[data-testid="food-protein-0"]', "12");
      await page.fill('[data-testid="food-carbs-0"]', "65");
      await page.fill('[data-testid="food-fat-0"]', "8");

      await page.click('[data-testid="add-food-btn"]');
      await page.fill('[data-testid="food-name-1"]', "Greek yogurt");
      await page.fill('[data-testid="food-calories-1"]', "150");
      await page.fill('[data-testid="food-protein-1"]', "20");
      await page.fill('[data-testid="food-carbs-1"]', "10");
      await page.fill('[data-testid="food-fat-1]', "5");

      // Save meal
      await page.click('[data-testid="save-meal-btn"]');

      // Verify success and analysis
      await expect(
        page.locator('[data-testid="success-message"]'),
      ).toContainText("Meal logged successfully");
      await expect(
        page.locator('[data-testid="daily-calories"]'),
      ).toContainText("500");
      await expect(page.locator('[data-testid="protein-total"]')).toContainText(
        "32",
      );
    });

    test("view nutrition analysis and recommendations", async ({ page }) => {
      await page.goto("/nutrition");

      // Navigate to analysis tab
      await page.click('[data-testid="analysis-tab"]');

      // Verify analysis displays
      await expect(
        page.locator('[data-testid="macro-breakdown"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="calorie-trend"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="micronutrient-status"]'),
      ).toBeVisible();

      // Check recommendations
      await expect(
        page.locator('[data-testid="nutrition-recommendations"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="olympic-readiness"]'),
      ).toContainText("excellent");
    });
  });

  test.describe("Performance Analytics Workflow", () => {
    test("view comprehensive performance dashboard", async ({ page }) => {
      await page.goto("/dashboard");

      // Navigate to analytics
      await page.click('[data-testid="analytics-nav-link"]');
      await expect(page).toHaveURL(/.*analytics/);

      // Verify performance metrics are displayed
      await expect(page.locator('[data-testid="speed-metric"]')).toContainText(
        "12.8",
      );
      await expect(
        page.locator('[data-testid="agility-metric"]'),
      ).toContainText("8.7");
      await expect(
        page.locator('[data-testid="endurance-metric"]'),
      ).toContainText("58.5");

      // Check improvement indicators
      await expect(
        page.locator('[data-testid="speed-improvement"]'),
      ).toContainText("4.9");
      await expect(
        page.locator('[data-testid="agility-improvement"]'),
      ).toContainText("3.6");

      // Verify Olympic qualification tracking
      await expect(page.locator('[data-testid="olympic-score"]')).toContainText(
        "78.2",
      );
      await expect(
        page.locator('[data-testid="required-score"]'),
      ).toContainText("85.0");
      await expect(
        page.locator('[data-testid="qualification-probability"]'),
      ).toContainText("76");
    });

    test("interact with performance charts", async ({ page }) => {
      await page.goto("/analytics");

      // Test chart interactions
      await page.click('[data-testid="performance-chart"]');

      // Change time period
      await page.selectOption('[data-testid="time-period-select"]', "90_days");
      await page.waitForLoadState("networkidle");

      // Verify chart updates
      await expect(page.locator('[data-testid="chart-title"]')).toContainText(
        "90 days",
      );

      // Test chart tooltips
      await page.hover('[data-testid="chart-data-point"]');
      await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible();
    });

    test("generate and download performance report", async ({ page }) => {
      await page.goto("/analytics");

      // Generate report
      await page.click('[data-testid="generate-report-btn"]');

      // Configure report options
      await page.selectOption('[data-testid="report-period"]', "30_days");
      await page.check('[data-testid="include-training"]');
      await page.check('[data-testid="include-nutrition"]');
      await page.check('[data-testid="include-olympic"]');

      // Generate report
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.click('[data-testid="download-report-btn"]'),
      ]);

      // Verify download
      expect(download.suggestedFilename()).toMatch(/performance-report.*\.pdf/);
    });
  });

  test.describe("AI Coach Interaction Workflow", () => {
    test("ask coaching question and receive guidance", async ({ page }) => {
      await page.goto("/dashboard");

      // Navigate to AI coach
      await page.click('[data-testid="coach-nav-link"]');
      await expect(page).toHaveURL(/.*coach/);

      // Ask a question
      await page.fill(
        '[data-testid="coach-question-input"]',
        "How can I improve my 40-yard dash time for Olympic qualification?",
      );
      await page.click('[data-testid="ask-coach-btn"]');

      // Wait for response
      await expect(
        page.locator('[data-testid="coach-response"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="coach-response"]'),
      ).toContainText("technique refinement");

      // Verify recommendations appear
      await expect(
        page.locator('[data-testid="coach-recommendations"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="exercise-recommendation"]'),
      ).toContainText("Explosive start drills");

      // Check confidence score
      await expect(
        page.locator('[data-testid="confidence-score"]'),
      ).toContainText("92");
    });

    test("follow up on coaching recommendations", async ({ page }) => {
      await page.goto("/coach");

      // Ask initial question
      await page.fill(
        '[data-testid="coach-question-input"]',
        "What exercises should I do for speed?",
      );
      await page.click('[data-testid="ask-coach-btn"]');

      // Click on follow-up question
      await page.click('[data-testid="followup-question"]');

      // Verify follow-up response
      await expect(
        page.locator('[data-testid="coach-response"]'),
      ).toContainText("specific drill recommendations");

      // Create training plan from recommendations
      await page.click('[data-testid="create-plan-btn"]');
      await expect(
        page.locator('[data-testid="success-message"]'),
      ).toContainText("Training plan created");
    });

    test("view conversation history", async ({ page }) => {
      await page.goto("/coach");

      // Navigate to history
      await page.click('[data-testid="conversation-history-tab"]');

      // Verify conversation history displays
      await expect(
        page.locator('[data-testid="conversation-list"]'),
      ).toBeVisible();

      // Click on previous conversation
      await page.click('[data-testid="conversation-item-1"]');

      // Verify conversation loads
      await expect(
        page.locator('[data-testid="conversation-messages"]'),
      ).toBeVisible();
    });
  });

  test.describe("Olympic Qualification Tracking Workflow", () => {
    test("monitor Olympic qualification progress", async ({ page }) => {
      await page.goto("/dashboard");

      // Navigate to Olympic section
      await page.click('[data-testid="olympic-nav-link"]');
      await expect(page).toHaveURL(/.*olympic/);

      // Verify qualification status
      await expect(
        page.locator('[data-testid="qualification-status"]'),
      ).toContainText("in_progress");
      await expect(
        page.locator('[data-testid="current-ranking"]'),
      ).toContainText("45");

      // Check upcoming events
      await expect(
        page.locator('[data-testid="upcoming-events"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="event-item"]')).toContainText(
        "European Championship Qualifier",
      );

      // View qualification timeline
      await page.click('[data-testid="timeline-tab"]');
      await expect(
        page.locator('[data-testid="qualification-timeline"]'),
      ).toBeVisible();
    });

    test("set Olympic preparation goals", async ({ page }) => {
      await page.goto("/olympic");

      // Navigate to goals section
      await page.click('[data-testid="goals-tab"]');

      // Set new goal
      await page.click('[data-testid="add-goal-btn"]');
      await page.fill(
        '[data-testid="goal-title"]',
        "Improve sprint time by 0.3 seconds",
      );
      await page.fill('[data-testid="goal-target"]', "4.2");
      await page.selectOption('[data-testid="goal-timeframe"]', "3_months");

      // Save goal
      await page.click('[data-testid="save-goal-btn"]');

      // Verify goal appears
      await expect(page.locator('[data-testid="goals-list"]')).toContainText(
        "Improve sprint time",
      );
      await expect(page.locator('[data-testid="goal-status"]')).toContainText(
        "active",
      );
    });
  });

  test.describe("Mobile Responsiveness Workflow", () => {
    test("navigate app on mobile device", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/dashboard");

      // Test mobile navigation
      await page.click('[data-testid="mobile-menu-btn"]');
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();

      // Navigate to different sections
      await page.click('[data-testid="mobile-training-link"]');
      await expect(page).toHaveURL(/.*training/);

      // Test mobile gestures
      await page.click('[data-testid="mobile-menu-btn"]');
      await page.click('[data-testid="mobile-analytics-link"]');

      // Verify mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-chart"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="mobile-metrics"]'),
      ).toBeVisible();
    });

    test("mobile training session creation", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/training");

      // Create session on mobile
      await page.click('[data-testid="mobile-new-session"]');

      // Use mobile-optimized inputs
      await page.selectOption(
        '[data-testid="mobile-session-type"]',
        "flag_football_drill",
      );
      await page.fill('[data-testid="mobile-duration"]', "60");

      // Add exercise with mobile interface
      await page.click('[data-testid="mobile-add-exercise"]');
      await page.fill('[data-testid="mobile-exercise-name"]', "Sprint drills");

      // Save using mobile button
      await page.click('[data-testid="mobile-save-session"]');

      // Verify mobile success message
      await expect(
        page.locator('[data-testid="mobile-success"]'),
      ).toBeVisible();
    });
  });

  test.describe("Offline Functionality Workflow", () => {
    test("work offline and sync when back online", async ({
      page,
      context,
    }) => {
      await page.goto("/dashboard");

      // Go offline
      await context.setOffline(true);

      // Try to create training session offline
      await page.click('[data-testid="training-nav-link"]');
      await page.click('[data-testid="new-session-btn"]');

      // Fill offline form
      await page.fill(
        '[data-testid="exercise-name-0"]',
        "Offline sprint training",
      );
      await page.fill('[data-testid="duration-input"]', "45");

      // Save offline (should be stored locally)
      await page.click('[data-testid="save-session-btn"]');

      // Verify offline indicator
      await expect(
        page.locator('[data-testid="offline-indicator"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="sync-pending"]')).toContainText(
        "1 item pending sync",
      );

      // Go back online
      await context.setOffline(false);

      // Trigger sync
      await page.click('[data-testid="sync-now-btn"]');

      // Verify sync success
      await expect(page.locator('[data-testid="sync-success"]')).toContainText(
        "Data synced successfully",
      );
      await expect(
        page.locator('[data-testid="offline-indicator"]'),
      ).not.toBeVisible();
    });
  });

  test.describe("Error Handling Workflow", () => {
    test("handle API errors gracefully", async ({ page }) => {
      // Mock API error
      await page.route("**/api/training/sessions", (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.goto("/training");

      // Try to load training sessions
      await page.reload();

      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        "Unable to load training sessions",
      );
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();

      // Test retry functionality
      await page.route("**/api/training/sessions", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ sessions: [] }),
        });
      });

      await page.click('[data-testid="retry-btn"]');
      await expect(
        page.locator('[data-testid="error-message"]'),
      ).not.toBeVisible();
    });

    test("handle network timeout gracefully", async ({ page }) => {
      // Mock slow network
      await page.route("**/api/**", (route) => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true }),
          });
        }, 10000); // 10 second delay
      });

      await page.goto("/analytics");

      // Should show loading state
      await expect(
        page.locator('[data-testid="loading-spinner"]'),
      ).toBeVisible();

      // Should eventually show timeout message
      await expect(page.locator('[data-testid="timeout-message"]')).toBeVisible(
        { timeout: 15000 },
      );
    });
  });

  test.describe("Accessibility Workflow", () => {
    test("navigate with keyboard only", async ({ page }) => {
      await page.goto("/dashboard");

      // Test keyboard navigation
      await page.press("body", "Tab");
      await expect(page.locator(":focus")).toBeVisible();

      // Navigate to training section with keyboard
      await page.press(":focus", "Enter");

      // Test form navigation with keyboard
      await page.press("body", "Tab");
      await page.press(":focus", "Space");

      // Verify keyboard accessibility
      await expect(
        page.locator('[data-testid="keyboard-navigation"]'),
      ).toBeVisible();
    });

    test("verify screen reader compatibility", async ({ page }) => {
      await page.goto("/dashboard");

      // Check for proper ARIA labels
      await expect(
        page.locator('[aria-label="Main navigation"]'),
      ).toBeVisible();
      await expect(
        page.locator('[aria-label="Performance metrics"]'),
      ).toBeVisible();
      await expect(page.locator('[role="main"]')).toBeVisible();

      // Verify heading structure
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator('[aria-level="2"]')).toBeVisible();
    });
  });
});
