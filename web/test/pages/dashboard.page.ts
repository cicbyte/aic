import type { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  async goto() {
    await super.goto('/');
  }

  async getStatValue(label: string): Promise<string> {
    const stat = this.page.locator('[data-testid="stat-item"]').filter({ hasText: label });
    return (await stat.locator('[data-testid="stat-value"]').textContent()) ?? '';
  }

  async getRecentUpdates(): Promise<string[]> {
    const items = this.page.locator('[data-testid="recent-update"]');
    const count = await items.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      if (text) texts.push(text);
    }
    return texts;
  }
}
