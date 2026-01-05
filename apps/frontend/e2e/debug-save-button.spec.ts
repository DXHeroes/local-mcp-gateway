/** biome-ignore-all lint/suspicious/noExplicitAny: Test file */
import { test, expect } from '@playwright/test';
import { createTestProfile, createTestMcpServer, assignServerToProfile, safeDelete } from './helpers';
import { ProfileEditPage } from './pages/ProfileEditPage';

const API_URL = 'http://localhost:3001';
const CONTEXT7_URL = 'https://mcp.context7.com/mcp';

test.beforeEach(async ({ page }) => {
  const profiles = await page.request.get(`${API_URL}/api/profiles`);
  if (profiles.ok()) {
    const data = await profiles.json();
    for (const profile of data) {
      if (profile.name.startsWith('test-debug')) {
        await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
      }
    }
  }
  const servers = await page.request.get(`${API_URL}/api/mcp-servers`);
  if (servers.ok()) {
    const data = await servers.json();
    for (const server of data) {
      if (server.name.startsWith('test-debug')) {
        await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
      }
    }
  }
  await page.waitForTimeout(500);
});

test('Debug Save Button - Mimic 1.2.1', async ({ page }) => {
  const profile = await createTestProfile(page.request, 'test-debug');
  const server = await createTestMcpServer(page.request, 'test-debug-server', 'remote_http', { url: CONTEXT7_URL });
  await assignServerToProfile(page.request, profile.id, server.id);

  const editPage = new ProfileEditPage(page);
  await editPage.goto(profile.id);
  await editPage.expandAndRefreshServerTools('test-debug-server');

  // Get tool name exactly like test 1.2.1 does
  const toolName = await page
    .locator('[data-testid="tool-item"]')
    .first()
    .locator('h3')
    .textContent() || 'resolve-library-id';

  console.log('Tool name extracted:', toolName.trim());

  // Now toggle using the SAME method as test 1.2.1
  console.log('\n=== Before Toggle ===');
  await page.screenshot({ path: '/tmp/test-before-toggle.png' });

  // Method 1: Use toggleTool (currently failing)
  console.log('\n=== Method 1: toggleTool ===');

  // Debug: Check what getTool actually returns
  const toolLocator = editPage.getTool('test-debug-server', toolName.trim());
  const toolHTML = await toolLocator.evaluate(el => ({
    tag: el.tagName,
    dataTestId: el.getAttribute('data-testid'),
    dataToolName: el.getAttribute('data-tool-name'),
    innerHTML: el.innerHTML.substring(0, 200)
  }));
  console.log('getTool returns element:', toolHTML);

  // Compare checkboxes found by different methods
  const checkboxViaGetTool = toolLocator.getByRole('checkbox').first();
  const checkboxViaDirect = page
    .locator('[data-testid="tool-item"]')
    .first()
    .getByRole('checkbox')
    .first();

  const checkbox1HTML = await checkboxViaGetTool.evaluate(el => el.outerHTML.substring(0, 150));
  const checkbox2HTML = await checkboxViaDirect.evaluate(el => el.outerHTML.substring(0, 150));

  console.log('Checkbox via getTool:', checkbox1HTML);
  console.log('Checkbox via direct:', checkbox2HTML);
  console.log('Are they the same?', checkbox1HTML === checkbox2HTML);

  console.log('\nCalling toggleTool with:', 'test-debug-server', toolName.trim(), false);
  await editPage.toggleTool('test-debug-server', toolName.trim(), false);

  // Check if it worked
  let afterMethod1 = await checkboxViaGetTool.isChecked();
  console.log('After toggleTool, checkbox:', afterMethod1);

  // Method 2: Direct click without tool scoping
  console.log('\n=== Method 2: Direct click ===');
  const allCheckboxes = page.getByRole('checkbox');
  const checkboxCount = await allCheckboxes.count();
  console.log('Total checkboxes on page:', checkboxCount);

  // Find the checkbox within the first tool-item
  const firstToolCheckbox = page
    .locator('[data-testid="tool-item"]')
    .first()
    .getByRole('checkbox')
    .first();

  const before = await firstToolCheckbox.isChecked();
  console.log('Before direct click:', before);

  await firstToolCheckbox.click({ force: true });
  await page.waitForTimeout(1500);

  const after = await firstToolCheckbox.isChecked();
  console.log('After direct click:', after);

  console.log('\n=== After Toggle ===');
  await page.screenshot({ path: '/tmp/test-after-toggle.png' });

  // Check if Save button appears
  const saveButton = page.getByRole('button', { name: /save changes/i });
  const saveCount = await saveButton.count();
  console.log('Save buttons found:', saveCount);

  if (saveCount > 0) {
    const saveText = await saveButton.first().textContent();
    console.log('Save button text:', saveText);
    console.log('✅ SUCCESS - Save button appeared!');
  } else {
    console.log('❌ FAIL - Save button did NOT appear');

    // Debug: Check checkbox state
    const tool = editPage.getTool('test-debug-server', toolName.trim());
    const checkbox = tool.getByRole('checkbox').first();
    const isChecked = await checkbox.isChecked();
    console.log('Checkbox is still checked:', isChecked);

    // Debug: Check if there's any button
    const allButtons = await page.locator('button').allTextContents();
    console.log('All buttons on page:', allButtons);
  }

  await page.screenshot({ path: '/tmp/test-final.png' });
});
