/**
 * Smoke Tests - Basic navigation and page load verification
 *
 * These tests verify that all pages load correctly when authenticated.
 */

import { expect, test } from '@playwright/test';
import { API_BASE } from './helpers';

const API_URL = API_BASE;

test.describe('Smoke Tests', () => {
  test('should load Profiles page (home)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Nav should be visible
    await expect(page.getByRole('link', { name: 'Profiles' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'MCP Servers' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Debug Logs' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Docs' })).toBeVisible();

    // Profiles heading
    await expect(page.getByRole('heading', { name: 'Profiles' })).toBeVisible({ timeout: 10000 });
  });

  test('should load MCP Servers page', async ({ page }) => {
    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'MCP Servers' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('button', { name: 'Add MCP Server' })).toBeVisible();
  });

  test('should load Debug Logs page', async ({ page }) => {
    await page.goto('/debug-logs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Debug Logs' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should load Docs page', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('networkidle');

    // Docs page should load with documentation content
    await expect(page.getByText('Documentation').first()).toBeVisible({ timeout: 10000 });
  });

  test('should load Organizations page', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate between pages via nav links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to MCP Servers
    await page.getByRole('link', { name: 'MCP Servers' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'MCP Servers' })).toBeVisible({
      timeout: 30000,
    });

    // Navigate to Debug Logs
    await page.getByRole('link', { name: 'Debug Logs' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Debug Logs' })).toBeVisible({
      timeout: 30000,
    });

    // Navigate back to Profiles
    await page.getByRole('link', { name: 'Profiles' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Profiles' })).toBeVisible({ timeout: 30000 });
  });

  test('should display user info in nav bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sign out button should exist
    const signOutButton = page.getByTitle('Sign out');
    await expect(signOutButton).toBeVisible({ timeout: 10000 });
  });

  test('health endpoint should respond', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
  });
});
