import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type APIResponse, type FullConfig, type Page } from '@playwright/test';

export const PLAYWRIGHT_AUTH_FILE = path.join('.playwright', 'auth', 'user.json');

const TEST_PASSWORD = 'PlaywrightPassword123!';

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL?.toString() ?? 'http://localhost:3000';
  const apiBaseURL = resolveApiBaseUrl(baseURL);
  const authFile = path.resolve(process.cwd(), PLAYWRIGHT_AUTH_FILE);
  const browser = await chromium.launch();

  try {
    await mkdir(path.dirname(authFile), { recursive: true });

    const page = await browser.newPage();
    const email = `playwright-${Date.now()}@example.com`;
    const organizationSuffix = Date.now().toString(36);
    const organizationSlug = `playwright-org-${organizationSuffix}`;

    const signUpResponse = await postWithRetries(page, `${apiBaseURL}/api/auth/sign-up/email`, {
      data: {
        name: 'Playwright User',
        email,
        password: TEST_PASSWORD,
      },
    });

    if (!signUpResponse.ok()) {
      throw new Error(`Failed to create Playwright user: ${signUpResponse.status()}`);
    }

    const createOrganizationResponse = await postWithRetries(
      page,
      `${apiBaseURL}/api/auth/organization/create`,
      {
        data: {
          name: `Playwright Org ${organizationSuffix}`,
          slug: organizationSlug,
        },
      }
    );

    if (!createOrganizationResponse.ok()) {
      throw new Error(
        `Failed to create Playwright organization: ${createOrganizationResponse.status()}`
      );
    }

    const createdOrganization = (await createOrganizationResponse.json()) as { id: string };

    const setActiveResponse = await postWithRetries(
      page,
      `${apiBaseURL}/api/auth/organization/set-active`,
      {
        data: {
          organizationId: createdOrganization.id,
        },
      }
    );

    if (!setActiveResponse.ok()) {
      throw new Error(`Failed to activate Playwright organization: ${setActiveResponse.status()}`);
    }

    await page.context().storageState({ path: authFile });
  } finally {
    await browser.close();
  }
}

async function postWithRetries(
  page: Page,
  url: string,
  options: Parameters<Page['request']['post']>[1]
): Promise<APIResponse> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 60_000) {
    try {
      const response = await page.request.post(url, {
        ...options,
        timeout: 3_000,
      });

      if (response.ok() || response.status() < 500) {
        return response;
      }
    } catch {
      // Keep polling until the auth endpoint becomes reachable.
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Timed out waiting for Playwright auth endpoint: ${url}`);
}

function resolveApiBaseUrl(baseURL: string): string {
  const url = new URL(baseURL);

  if (url.port === '3000') {
    url.port = '3001';
  }

  return url.origin;
}
