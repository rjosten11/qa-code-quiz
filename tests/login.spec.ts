import { test, expect } from '@playwright/test';

const TEST_DATA = {
  validUser: {
    username: 'SomeUser_name',
    password: 'TopSecret1234!'
  },
  invalidUser: {
    username: 'invaliduser',
    password: 'wrongpass'
  },
  baseUrl: 'http://localhost:8080'
};

test.describe('Login Page Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_DATA.baseUrl);
  });

  test('should display login page elements correctly', async ({ page }) => {
    await expect(page).toHaveTitle('Document');
    
    await expect(page.locator('text=qa.code-quiz.dev')).toBeVisible();
    
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Verify login button
    const loginButton = page.locator('button:has-text("LOGIN")');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
    
    // Verify help text
    await expect(page.locator('text=If you do not have an account, contact an admin')).toBeVisible();
  });

  test('should allow typing in input fields', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    
    // Type in username field
    await usernameInput.fill(TEST_DATA.validUser.username);
    await expect(usernameInput).toHaveValue(TEST_DATA.validUser.username);
    
    // Type in password field
    await passwordInput.fill(TEST_DATA.validUser.password);
    await expect(passwordInput).toHaveValue(TEST_DATA.validUser.password);
  });

  test('should clear input fields when cleared', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    
    // Fill fields
    await usernameInput.fill(TEST_DATA.validUser.username);
    await passwordInput.fill(TEST_DATA.validUser.password);
    
    // Clear fields
    await usernameInput.clear();
    await passwordInput.clear();
    
    // Verify fields are empty
    await expect(usernameInput).toHaveValue('');
    await expect(passwordInput).toHaveValue('');
  });

  test('should focus input fields correctly', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    
    // Focus username field
    await usernameInput.focus();
    await expect(usernameInput).toBeFocused();
    
    // Tab to password field
    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();
  });

  test('should handle valid login attempt', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    const loginButton = page.locator('button:has-text("LOGIN")');
    
    // Fill in valid credentials
    await usernameInput.fill(TEST_DATA.validUser.username);
    await passwordInput.fill(TEST_DATA.validUser.password);
    
    // Intercept network request (adjust URL based on your API)
    await page.route('**/api/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, token: 'mock-jwt-token' })
      });
    });
    
    // Click login button
    await loginButton.click();
    
    // Add assertions for successful login (adjust based on your app's behavior)
    // For example, check for redirect or success message
    // await expect(page).toHaveURL(/.*dashboard/);
    // await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should handle invalid login attempt', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    const loginButton = page.locator('button:has-text("LOGIN")');
    
    // Fill in invalid credentials
    await usernameInput.fill(TEST_DATA.invalidUser.username);
    await passwordInput.fill(TEST_DATA.invalidUser.password);
    
    // Intercept network request for failed login
    await page.route('**/api/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Invalid credentials' })
      });
    });
    
    // Click login button
    await loginButton.click();
    
    // Add assertions for failed login (adjust based on your app's behavior)
    // await expect(page.locator('text=Invalid credentials')).toBeVisible();
    // await expect(page).toHaveURL(TEST_DATA.baseUrl); // Should stay on login page
  });

  test('should handle empty form submission', async ({ page }) => {
    const loginButton = page.locator('button:has-text("LOGIN")');
    
    // Click login without filling fields
    await loginButton.click();
    
    // Add assertions for empty form handling (adjust based on your app's behavior)
    // This might show validation errors or prevent submission
    // await expect(page.locator('text=Username is required')).toBeVisible();
    // await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should handle partial form submission', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const loginButton = page.locator('button:has-text("LOGIN")');
    
    // Fill only username
    await usernameInput.fill(TEST_DATA.validUser.username);
    await loginButton.click();
    
    // Add assertions for partial form handling
    // await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should support keyboard navigation and Enter key submission', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    
    // Navigate and fill using keyboard
    await usernameInput.focus();
    await page.keyboard.type(TEST_DATA.validUser.username);
    await page.keyboard.press('Tab');
    await page.keyboard.type(TEST_DATA.validUser.password);
    
    // Mock the login request
    await page.route('**/api/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    // Submit using Enter key
    await page.keyboard.press('Enter');
    
    // Add assertions for form submission
    // The form should submit when Enter is pressed from password field
  });

  test('should apply correct styling and visual states', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    const loginButton = page.locator('button:has-text("LOGIN")');
    
    // Check initial styling
    await expect(usernameInput).toHaveCSS('border-radius', '15px');
    await expect(loginButton).toHaveCSS('background-color', 'rgb(4, 138, 191)');
    
    // Check focus state styling (border should change color on focus)
    await usernameInput.focus();
    await expect(usernameInput).toHaveCSS('border-color', 'rgb(245, 68, 88)');
    
    // Check button active state (you might need to use page.mouse for this)
    await loginButton.hover();
    // Add additional visual state checks as needed
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const loginForm = page.locator('.sc-ifAKCX');
    await expect(loginForm).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(loginForm).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(loginForm).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    const loginButton = page.locator('button:has-text("LOGIN")');
    
    // Fill form
    await usernameInput.fill(TEST_DATA.validUser.username);
    await passwordInput.fill(TEST_DATA.validUser.password);
    
    // Simulate network error
    await page.route('**/api/login', async route => {
      await route.abort('internetdisconnected');
    });
    
    // Attempt login
    await loginButton.click();
    
    // Add assertions for network error handling
    // await expect(page.locator('text=Network error')).toBeVisible();
    // await expect(page.locator('text=Please check your connection')).toBeVisible();
  });

  test('should maintain form state during loading', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    const loginButton = page.locator('button:has-text("LOGIN")');
    
    // Fill form
    await usernameInput.fill(TEST_DATA.validUser.username);
    await passwordInput.fill(TEST_DATA.validUser.password);
    
    // Mock slow response
    await page.route('**/api/login', async route => {
      await page.waitForTimeout(2000); // Simulate slow response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    // Click login and verify form state is maintained
    await loginButton.click();
    
    // Verify values are still in the inputs during loading
    await expect(usernameInput).toHaveValue(TEST_DATA.validUser.username);
    await expect(passwordInput).toHaveValue(TEST_DATA.validUser.password);
    
    // Check if button is disabled during loading (if implemented)
    // await expect(loginButton).toBeDisabled();
  });
});