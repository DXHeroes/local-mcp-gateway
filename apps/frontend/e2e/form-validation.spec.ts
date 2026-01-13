/**
 * E2E Tests - Form Validation
 *
 * Tests for form validation across the application:
 * - Profile name validation (alphanumeric, dash, underscore, 1-50 chars)
 * - Profile description validation (max 500 chars)
 * - MCP server name validation
 * - MCP server URL validation
 * - Error messages in UI
 * - Duplicate name handling
 *
 * Test Suite 2.1: Form Validation
 */
/** biome-ignore-all lint/suspicious/noExplicitAny: Test file allows any types */

import { expect, test } from '@playwright/test';
import { expectValidationError, retryRequest, safeDelete } from './helpers';
import { McpServersPage } from './pages/McpServersPage';
import { ProfilesPage } from './pages/ProfilesPage';

const API_URL = 'http://localhost:3001';

test.describe('Form Validation', () => {
  // Clean up test data before and after each test
  test.beforeEach(async ({ page }) => {
    // Clean up test profiles
    try {
      const profilesResponse = await page.request.get(`${API_URL}/api/profiles`);
      if (profilesResponse.ok()) {
        const profiles = await profilesResponse.json();
        for (const profile of profiles) {
          if (profile.name.startsWith('test-validation-')) {
            await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
            await page.waitForTimeout(100);
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    // Clean up test MCP servers
    try {
      const serversResponse = await page.request.get(`${API_URL}/api/mcp-servers`);
      if (serversResponse.ok()) {
        const servers = await serversResponse.json();
        for (const server of servers) {
          if (server.name.startsWith('test-validation-')) {
            await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
            await page.waitForTimeout(100);
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    await page.waitForTimeout(500);
  });

  test.afterEach(async ({ page }) => {
    // Same cleanup as beforeEach
    try {
      const profilesResponse = await page.request.get(`${API_URL}/api/profiles`);
      if (profilesResponse.ok()) {
        const profiles = await profilesResponse.json();
        for (const profile of profiles) {
          if (profile.name.startsWith('test-validation-')) {
            await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
            await page.waitForTimeout(100);
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    try {
      const serversResponse = await page.request.get(`${API_URL}/api/mcp-servers`);
      if (serversResponse.ok()) {
        const servers = await serversResponse.json();
        for (const server of servers) {
          if (server.name.startsWith('test-validation-')) {
            await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
            await page.waitForTimeout(100);
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    await page.waitForTimeout(500);
  });

  test.describe('Profile Name Validation', () => {
    test('2.1.1: Reject profile name with invalid characters', async ({ page }) => {
      // GIVEN: User is on profiles page
      const profilesPage = new ProfilesPage(page);
      await profilesPage.goto();

      // WHEN: User tries to create profile with invalid name
      await profilesPage.clickCreateProfile();
      await profilesPage.fillProfileForm('test@profile!');

      // Try to submit
      await profilesPage.submitProfileForm();

      // THEN: Should show validation error
      await expectValidationError(
        page,
        'Name must contain only alphanumeric characters, dashes, and underscores'
      ).catch(async () => {
        // Alternative error messages
        await expectValidationError(page, 'Invalid name').catch(async () => {
          await expectValidationError(page, 'only alphanumeric');
        });
      });
    });

    test('2.1.2: Reject profile name that is too long', async ({ page }) => {
      // GIVEN: User is on profiles page
      const profilesPage = new ProfilesPage(page);
      await profilesPage.goto();

      // WHEN: User tries to create profile with name > 50 chars
      const longName = 'a'.repeat(51);
      await profilesPage.clickCreateProfile();
      await profilesPage.fillProfileForm(longName);

      // THEN: Input should show error or prevent input
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      const inputValue = await nameInput.inputValue();

      // Either the input is limited to 50 chars, or validation error is shown
      if (inputValue.length > 50) {
        await profilesPage.submitProfileForm();
        await expectValidationError(page, 'Name must be').catch(async () => {
          await expectValidationError(page, 'too long').catch(async () => {
            await expectValidationError(page, 'maximum');
          });
        });
      } else {
        expect(inputValue.length).toBeLessThanOrEqual(50);
      }
    });

    test('2.1.3: Accept valid profile names', async ({ page }) => {
      // GIVEN: User is on profiles page
      const profilesPage = new ProfilesPage(page);
      await profilesPage.goto();

      // WHEN: User creates profile with valid names
      const validNames = [
        'test-validation-profile1',
        'test_validation_profile2',
        'testValidation123',
      ];

      for (const validName of validNames) {
        await profilesPage.clickCreateProfile();
        await profilesPage.fillProfileForm(validName, 'Valid profile');
        await profilesPage.submitProfileForm();

        // THEN: Profile should be created successfully
        await page.waitForTimeout(1000);

        // Verify profile exists via API
        const response = await retryRequest(page.request, 'get', `${API_URL}/api/profiles`, {});
        const profiles = await response.json();
        const created = profiles.find((p: any) => p.name === validName);
        expect(created).toBeDefined();
      }
    });
  });

  test.describe('Profile Description Validation', () => {
    test('2.1.4: Reject profile description that is too long', async ({ page }) => {
      // GIVEN: User is on profiles page
      const profilesPage = new ProfilesPage(page);
      await profilesPage.goto();

      // WHEN: User tries to create profile with description > 500 chars
      const longDescription = 'a'.repeat(501);
      await profilesPage.clickCreateProfile();
      await profilesPage.fillProfileForm('test-validation-desc', longDescription);

      // THEN: Should show validation error or limit input
      const descInput = page
        .locator('textarea[name="description"], textarea[placeholder*="description" i]')
        .first();
      const inputValue = await descInput.inputValue();

      if (inputValue.length > 500) {
        await profilesPage.submitProfileForm();
        await expectValidationError(page, 'Description must be max 500 characters').catch(
          async () => {
            await expectValidationError(page, 'too long').catch(async () => {
              await expectValidationError(page, 'maximum');
            });
          }
        );
      } else {
        expect(inputValue.length).toBeLessThanOrEqual(500);
      }
    });

    test('2.1.5: Accept valid profile description', async ({ page }) => {
      // GIVEN: User is on profiles page
      const profilesPage = new ProfilesPage(page);
      await profilesPage.goto();

      // WHEN: User creates profile with valid description (< 500 chars)
      const validDescription = 'This is a valid description for testing purposes.';
      await profilesPage.clickCreateProfile();
      await profilesPage.fillProfileForm('test-validation-valid-desc', validDescription);
      await profilesPage.submitProfileForm();

      // THEN: Profile should be created successfully
      await page.waitForTimeout(1000);

      const response = await retryRequest(page.request, 'get', `${API_URL}/api/profiles`, {});
      const profiles = await response.json();
      const created = profiles.find((p: any) => p.name === 'test-validation-valid-desc');
      expect(created).toBeDefined();
      expect(created.description).toBe(validDescription);
    });
  });

  test.describe('Duplicate Profile Name Handling', () => {
    test('2.1.6: Reject duplicate profile name', async ({ page }) => {
      // GIVEN: Profile already exists
      const existingName = 'test-validation-duplicate';
      await retryRequest(page.request, 'post', `${API_URL}/api/profiles`, {
        data: {
          name: existingName,
          description: 'Existing profile',
        },
      });

      // WHEN: User tries to create another profile with same name
      const profilesPage = new ProfilesPage(page);
      await profilesPage.goto();
      await profilesPage.clickCreateProfile();
      await profilesPage.fillProfileForm(existingName, 'Duplicate profile');
      await profilesPage.submitProfileForm();

      // THEN: Should show error
      await expectValidationError(page, 'Profile with this name already exists').catch(async () => {
        await expectValidationError(page, 'already exists').catch(async () => {
          await expectValidationError(page, 'duplicate');
        });
      });
    });
  });

  test.describe('MCP Server URL Validation', () => {
    test('2.1.7: Reject invalid URL format', async ({ page }) => {
      // GIVEN: User is on MCP servers page
      const serversPage = new McpServersPage(page);
      await serversPage.goto();

      // WHEN: User tries to create server with invalid URL
      await serversPage.clickCreateServer();

      // Fill form with invalid URL
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      await nameInput.fill('test-validation-invalid-url');

      // Select remote_http type
      const typeSelect = page.locator('select[name="type"], [data-testid="type-select"]').first();
      if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeSelect.selectOption('remote_http');
      } else {
        // Click radio button for remote_http
        await page.getByRole('radio', { name: /remote.*http/i }).click();
      }

      const urlInput = page.locator('input[name="url"], input[placeholder*="url" i]').first();
      await urlInput.fill('not-a-url');

      // Try to submit
      const submitButton = page
        .getByRole('button', { name: /create|save/i })
        .filter({ hasText: /create|save/i })
        .first();
      await submitButton.click();

      // THEN: Should show validation error
      await expectValidationError(page, 'Invalid URL format').catch(async () => {
        await expectValidationError(page, 'valid URL').catch(async () => {
          await expectValidationError(page, 'must be a URL');
        });
      });
    });

    test('2.1.8: Reject URL without protocol', async ({ page }) => {
      // GIVEN: User is on MCP servers page
      const serversPage = new McpServersPage(page);
      await serversPage.goto();

      // WHEN: User tries to create server with URL missing protocol
      await serversPage.clickCreateServer();

      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      await nameInput.fill('test-validation-no-protocol');

      // Select remote_http type
      const typeSelect = page.locator('select[name="type"], [data-testid="type-select"]').first();
      if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeSelect.selectOption('remote_http');
      } else {
        await page.getByRole('radio', { name: /remote.*http/i }).click();
      }

      const urlInput = page.locator('input[name="url"], input[placeholder*="url" i]').first();
      await urlInput.fill('example.com/mcp');

      const submitButton = page
        .getByRole('button', { name: /create|save/i })
        .filter({ hasText: /create|save/i })
        .first();
      await submitButton.click();

      // THEN: Should show validation error
      await expectValidationError(page, 'URL must start with http:// or https://').catch(
        async () => {
          await expectValidationError(page, 'protocol').catch(async () => {
            await expectValidationError(page, 'http://');
          });
        }
      );
    });

    test('2.1.9: Accept valid URLs', async ({ page }) => {
      // GIVEN: User is on MCP servers page
      const serversPage = new McpServersPage(page);
      await serversPage.goto();

      // WHEN: User creates server with valid URLs
      const validUrls = ['https://example.com/mcp', 'http://localhost:8080/mcp'];

      for (let i = 0; i < validUrls.length; i++) {
        const url = validUrls[i];
        await serversPage.clickCreateServer();

        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
        await nameInput.fill(`test-validation-valid-url-${i}`);

        // Select remote_http type
        const typeSelect = page.locator('select[name="type"], [data-testid="type-select"]').first();
        if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          await typeSelect.selectOption('remote_http');
        } else {
          await page.getByRole('radio', { name: /remote.*http/i }).click();
        }

        const urlInput = page.locator('input[name="url"], input[placeholder*="url" i]').first();
        await urlInput.fill(url);

        const submitButton = page
          .getByRole('button', { name: /create|save/i })
          .filter({ hasText: /create|save/i })
          .first();
        await submitButton.click();

        // THEN: Server should be created successfully
        await page.waitForTimeout(1000);

        const response = await retryRequest(page.request, 'get', `${API_URL}/api/mcp-servers`, {});
        const servers = await response.json();
        const created = servers.find((s: any) => s.name === `test-validation-valid-url-${i}`);
        expect(created).toBeDefined();
        expect(created.config.url).toBe(url);
      }
    });
  });

  test.describe('MCP Server Name Validation', () => {
    test('2.1.10: Reject empty server name', async ({ page }) => {
      // GIVEN: User is on MCP servers page
      const serversPage = new McpServersPage(page);
      await serversPage.goto();

      // WHEN: User tries to create server without name
      await serversPage.clickCreateServer();

      // Leave name empty
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      await nameInput.fill('');

      // Select remote_http type
      const typeSelect = page.locator('select[name="type"], [data-testid="type-select"]').first();
      if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeSelect.selectOption('remote_http');
      } else {
        await page.getByRole('radio', { name: /remote.*http/i }).click();
      }

      const urlInput = page.locator('input[name="url"], input[placeholder*="url" i]').first();
      await urlInput.fill('https://example.com/mcp');

      const submitButton = page
        .getByRole('button', { name: /create|save/i })
        .filter({ hasText: /create|save/i })
        .first();

      // Submit button should be disabled, or show error on click
      const isDisabled = await submitButton.isDisabled();
      if (!isDisabled) {
        await submitButton.click();
        await expectValidationError(page, 'Name is required').catch(async () => {
          await expectValidationError(page, 'required').catch(async () => {
            await expectValidationError(page, 'cannot be empty');
          });
        });
      } else {
        expect(isDisabled).toBe(true);
      }
    });
  });
});
