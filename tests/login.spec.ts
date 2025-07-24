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
    
    const loginButton = page.locator('button:has-text("LOGIN")');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
    
    await expect(page.locator('text=If you do not have an account, contact an admin')).toBeVisible();
  });

  test('should allow typing in input fields', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    
    await usernameInput.fill(TEST_DATA.validUser.username);
    await expect(usernameInput).toHaveValue(TEST_DATA.validUser.username);
    
    await passwordInput.fill(TEST_DATA.validUser.password);
    await expect(passwordInput).toHaveValue(TEST_DATA.validUser.password);
  });

  test('should clear input fields when cleared', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    
    await usernameInput.fill(TEST_DATA.validUser.username);
    await passwordInput.fill(TEST_DATA.validUser.password);
    
    await usernameInput.clear();
    await passwordInput.clear();
    
    await expect(usernameInput).toHaveValue('');
    await expect(passwordInput).toHaveValue('');
  });

  test('should focus input fields correctly', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    
    await usernameInput.focus();
    await expect(usernameInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();
  });

  test('should handle valid login attempt', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    const loginButton = page.locator('button:has-text("LOGIN")');
    
    await usernameInput.fill(TEST_DATA.validUser.username);
    await passwordInput.fill(TEST_DATA.validUser.password);
    
    await loginButton.click();
    
    await expect(page.locator('text=Hello')).toBeVisible();
  });

  test('should handle invalid login attempt', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    const loginButton = page.locator('button:has-text("LOGIN")');
    
    await usernameInput.fill(TEST_DATA.invalidUser.username);
    await passwordInput.fill(TEST_DATA.invalidUser.password);
    
    await loginButton.click();
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should handle empty form submission', async ({ page }) => {
    const loginButton = page.locator('button:has-text("LOGIN")');
    
    await loginButton.click();
    
    await expect(page.locator('text=Input missing')).toBeVisible();
  });

  test('should handle partial form submission', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const loginButton = page.locator('button:has-text("LOGIN")');
    
    await usernameInput.fill(TEST_DATA.validUser.username);
    await loginButton.click();
    
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should support keyboard navigation and Enter key submission', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    
    await usernameInput.focus();
    await page.keyboard.type(TEST_DATA.validUser.username);
    await page.keyboard.press('Tab');
    await page.keyboard.type(TEST_DATA.validUser.password);
    await page.keyboard.press('Enter');
    
    await expect(page.locator('text=Hello')).toBeVisible();
  });

  test('should apply correct styling and visual states', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Enter Username"]');
    const passwordInput = page.locator('input[placeholder="password"]');
    const loginButton = page.locator('button:has-text("LOGIN")');
    
    await expect(usernameInput).toHaveCSS('border-radius', '15px');
    await expect(passwordInput).toHaveCSS('border-radius', '15px');
    await expect(loginButton).toHaveCSS('background-color', 'rgb(4, 138, 191)');
    
    await usernameInput.focus();
    await expect(usernameInput).toHaveCSS('border-color', 'rgb(245, 68, 88)');
    await passwordInput.focus();
    await expect(passwordInput).toHaveCSS('border-color', 'rgb(245, 68, 88)');
    
    await loginButton.hover();
    await expect(loginButton).toHaveCSS('border-color', 'rgba(4, 138, 191, 0.75)');
  
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const loginForm = page.locator('.sc-ifAKCX');
    await expect(loginForm).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(loginForm).toBeVisible();
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(loginForm).toBeVisible();
  });

});