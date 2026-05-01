import type { Page, Locator } from '@playwright/test';

const API_BASE = 'http://localhost:3052/api/v1';

export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForToast(message: string) {
    await this.page.locator(`[class*="toast"]`).filter({ hasText: message }).first().waitFor({ timeout: 10_000 });
    await this.page.waitForTimeout(1500);
  }

  async waitForUrl(pattern: RegExp | string) {
    await this.page.waitForURL(pattern, { timeout: 10_000 });
  }

  async apiRequest(method: string, path: string, body?: Record<string, unknown>) {
    const response = await this.page.request.fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      data: body,
    });
    return response.json();
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }
}
