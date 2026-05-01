import type { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class SkillsPage extends BasePage {
  readonly createBtn = this.page.locator('[data-testid="create-skill"]');
  readonly searchInput = this.page.locator('[data-testid="search-input"]');
  readonly tableRows = this.page.locator('table tbody tr');

  async goto() {
    await super.goto('/skills');
  }

  async createSkill() {
    await this.createBtn.click();
    await this.page.waitForTimeout(500);
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.page.waitForTimeout(600);
  }

  async clickSkillRow(name: string) {
    await this.page.locator('table tbody tr').filter({ hasText: name }).click();
    await this.page.waitForTimeout(500);
  }

  async deleteSkill(name: string) {
    const row = this.page.locator('table tbody tr').filter({ hasText: name });
    await row.hover();
    await row.locator('[data-testid="delete-btn"]').click();
    await this.page.waitForTimeout(500);
    await this.page.locator('button:has-text("确认")').click();
    await this.waitForToast('删除成功');
  }

  async toggleFavorite(name: string) {
    const row = this.page.locator('table tbody tr').filter({ hasText: name });
    await row.locator('[data-testid="favorite-btn"]').click();
    await this.page.waitForTimeout(500);
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }
}
