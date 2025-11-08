import { test, expect } from '@playwright/test'

test.describe('Training Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login.html')
    await page.fill('#email', 'athlete@example.com')
    await page.fill('#password', 'TestPassword123!')
    await page.click('#login-btn')
    await page.waitForURL('/dashboard.html')
  })

  test('should create and start a training session', async ({ page }) => {
    await page.goto('/training.html')

    // Verify training page loads
    await expect(page.locator('h1')).toContainText('Training')
    await expect(page.locator('#training-dashboard')).toBeVisible()

    // Click create new session
    await page.click('#create-session-btn')

    // Fill out session details
    await page.selectOption('#session-type', 'flag_football_specific')
    await page.fill('#session-duration', '60')
    await page.selectOption('#intensity-level', 'high')
    await page.fill('#session-goals', 'Improve speed and agility for flag pulling')

    // Add exercises
    await page.click('#add-exercise-btn')
    await page.fill('#exercise-name-0', 'Flag pulling drill')
    await page.fill('#exercise-sets-0', '3')
    await page.fill('#exercise-reps-0', '15')
    await page.fill('#exercise-rest-0', '60')

    await page.click('#add-exercise-btn')
    await page.fill('#exercise-name-1', '40-yard sprint')
    await page.fill('#exercise-sets-1', '5')
    await page.fill('#exercise-reps-1', '1')
    await page.fill('#exercise-rest-1', '90')

    // Save session
    await page.click('#save-session-btn')
    await expect(page.locator('.success-message')).toContainText('Session created')

    // Start the session
    await page.click('#start-session-btn')
    await expect(page.locator('#session-timer')).toBeVisible()
    await expect(page.locator('#current-exercise')).toContainText('Flag pulling drill')
  })

  test('should track exercise completion and progress', async ({ page }) => {
    await page.goto('/training.html')

    // Start an existing session
    await page.click('.session-card[data-session-id="1"]')
    await page.click('#start-session-btn')

    // Complete first exercise
    await expect(page.locator('#current-exercise-name')).toContainText('Flag pulling drill')
    
    // Mark set as complete
    await page.click('#complete-set-btn')
    await expect(page.locator('#sets-completed')).toContainText('1/3')

    // Add performance notes
    await page.fill('#set-notes', 'Good form, quick release')
    await page.click('#save-set-notes-btn')

    // Complete remaining sets
    await page.click('#complete-set-btn')
    await page.click('#complete-set-btn')

    // Move to next exercise
    await expect(page.locator('.exercise-complete-message')).toBeVisible()
    await page.click('#next-exercise-btn')
    await expect(page.locator('#current-exercise-name')).toContainText('40-yard sprint')

    // Record performance metrics
    await page.fill('#sprint-time', '4.65')
    await page.click('#record-time-btn')
    
    // Verify time is recorded
    await expect(page.locator('#recorded-times')).toContainText('4.65s')
  })

  test('should handle session pause and resume', async ({ page }) => {
    await page.goto('/training.html')
    
    // Start session
    await page.click('.session-card[data-session-id="1"]')
    await page.click('#start-session-btn')

    // Verify timer is running
    const initialTime = await page.locator('#session-timer').textContent()
    await page.waitForTimeout(2000)
    const runningTime = await page.locator('#session-timer').textContent()
    expect(runningTime).not.toBe(initialTime)

    // Pause session
    await page.click('#pause-session-btn')
    await expect(page.locator('#session-status')).toContainText('Paused')

    // Verify timer stops
    const pausedTime = await page.locator('#session-timer').textContent()
    await page.waitForTimeout(2000)
    const stillPausedTime = await page.locator('#session-timer').textContent()
    expect(stillPausedTime).toBe(pausedTime)

    // Resume session
    await page.click('#resume-session-btn')
    await expect(page.locator('#session-status')).toContainText('Active')

    // Verify timer resumes
    await page.waitForTimeout(2000)
    const resumedTime = await page.locator('#session-timer').textContent()
    expect(resumedTime).not.toBe(pausedTime)
  })

  test('should complete session and save results', async ({ page }) => {
    await page.goto('/training.html')
    
    // Start and complete a short session
    await page.click('.session-card[data-session-id="2"]') // Shorter session for testing
    await page.click('#start-session-btn')

    // Complete all exercises quickly
    while (await page.locator('#next-exercise-btn').isVisible()) {
      await page.click('#complete-set-btn')
      if (await page.locator('#next-exercise-btn').isVisible()) {
        await page.click('#next-exercise-btn')
      }
    }

    // End session
    await page.click('#end-session-btn')

    // Fill out session summary
    await page.selectOption('#session-rating', '4')
    await page.fill('#session-notes', 'Great session, felt strong throughout')
    await page.fill('#energy-level', '8')
    await page.fill('#difficulty-level', '7')

    // Save session results
    await page.click('#save-session-btn')
    await expect(page.locator('.completion-message')).toContainText('Session completed successfully')

    // Verify session appears in history
    await page.goto('/analytics.html')
    await expect(page.locator('.recent-sessions')).toContainText('Completed')
  })

  test('should display real-time performance analytics', async ({ page }) => {
    await page.goto('/training.html')
    
    // Start session with analytics enabled
    await page.click('.session-card[data-session-id="1"]')
    await page.check('#enable-analytics')
    await page.click('#start-session-btn')

    // Verify analytics panel is visible
    await expect(page.locator('#analytics-panel')).toBeVisible()
    await expect(page.locator('#heart-rate-display')).toBeVisible()
    await expect(page.locator('#performance-chart')).toBeVisible()

    // Simulate heart rate data input
    await page.fill('#manual-heart-rate', '150')
    await page.click('#update-heart-rate-btn')

    // Verify heart rate is displayed
    await expect(page.locator('#current-heart-rate')).toContainText('150 bpm')

    // Check performance zone calculation
    await expect(page.locator('#training-zone')).toContainText('Aerobic')
  })

  test('should integrate with AI coaching recommendations', async ({ page }) => {
    await page.goto('/training.html')

    // Access AI coach panel
    await page.click('#ai-coach-tab')
    await expect(page.locator('#ai-coach-panel')).toBeVisible()

    // Request training recommendations
    await page.fill('#current-goals', 'Improve 40-yard dash time')
    await page.fill('#recent-performance', 'Current time: 4.8 seconds')
    await page.click('#get-recommendations-btn')

    // Verify AI recommendations appear
    await expect(page.locator('#ai-recommendations')).toBeVisible()
    await expect(page.locator('#recommended-exercises')).toContainText('speed')

    // Apply recommended session
    await page.click('#apply-recommendation-btn')
    await expect(page.locator('.success-message')).toContainText('AI session applied')

    // Verify session is created with AI recommendations
    await expect(page.locator('#session-exercises')).toContainText('AI Generated')
  })

  test('should handle offline training mode', async ({ page }) => {
    await page.goto('/training.html')

    // Simulate going offline
    await page.context().setOffline(true)

    // Try to start a session
    await page.click('.session-card[data-session-id="1"]')
    await page.click('#start-session-btn')

    // Should enter offline mode
    await expect(page.locator('#offline-indicator')).toBeVisible()
    await expect(page.locator('#offline-mode-message')).toContainText('Training in offline mode')

    // Session should still function
    await expect(page.locator('#session-timer')).toBeVisible()
    await page.click('#complete-set-btn')

    // Come back online
    await page.context().setOffline(false)
    await page.reload()

    // Should sync offline data
    await expect(page.locator('#sync-indicator')).toContainText('Syncing')
    await expect(page.locator('.sync-success-message')).toContainText('Data synced successfully')
  })

  test('should handle exercise modifications during session', async ({ page }) => {
    await page.goto('/training.html')
    
    // Start session
    await page.click('.session-card[data-session-id="1"]')
    await page.click('#start-session-btn')

    // Modify current exercise
    await page.click('#modify-exercise-btn')
    await expect(page.locator('#exercise-modification-modal')).toBeVisible()

    // Change reps due to fatigue
    await page.fill('#modified-reps', '10') // Reduce from 15
    await page.fill('#modification-reason', 'Fatigue - reducing reps to maintain form')
    await page.click('#apply-modification-btn')

    // Verify modification is applied
    await expect(page.locator('#current-reps-target')).toContainText('10')
    await expect(page.locator('#modification-note')).toContainText('Modified due to fatigue')

    // Complete modified exercise
    await page.click('#complete-set-btn')
    await expect(page.locator('#sets-completed')).toContainText('1/3')
  })

  test('should generate post-session insights', async ({ page }) => {
    await page.goto('/training.html')
    
    // Complete a full session (simulated with shorter duration)
    await page.click('.session-card[data-session-id="3"]') // Quick test session
    await page.click('#start-session-btn')

    // Simulate completing session with performance data
    await page.fill('#performance-data', JSON.stringify({
      heartRate: { avg: 155, max: 180 },
      exercises: [
        { name: 'Sprint', performance: 'excellent' },
        { name: 'Agility', performance: 'good' }
      ]
    }))

    await page.click('#end-session-btn')
    await page.click('#save-session-btn')

    // View generated insights
    await expect(page.locator('#session-insights')).toBeVisible()
    await expect(page.locator('#performance-summary')).toContainText('Performance Summary')
    await expect(page.locator('#improvement-areas')).toContainText('Areas for Improvement')
    await expect(page.locator('#next-session-recommendations')).toContainText('Next Session Recommendations')

    // Verify insights are saved to profile
    await page.goto('/analytics.html')
    await expect(page.locator('.recent-insights')).toContainText('Session completed')
  })
})