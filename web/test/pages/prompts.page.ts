import type { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class PromptsPage extends BasePage {
  readonly createBtn = this.page.locator('[data-testid="create-prompt"]');
  readonly searchInput = this.page.locator('[data-testid="search-input"]');
  readonly tableRows = this.page.locator('table tbody tr');

  async goto() {
    await super.goto('/prompts');
  }

  async createPrompt() {
    await this.createBtn.click();
    await this.page.waitForTimeout(500);
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.page.waitForTimeout(600);
  }

  async clickPromptRow(title: string) {
    await this.page.locator('table tbody tr').filter({ hasText: title }).click();
    await this.page.waitForTimeout(500);
  }

  async deletePrompt(title: string) {
    const row = this.page.locator('table tbody tr').filter({ hasText: title });
    await row.hover();
    await row.locator('[data-testid="delete-btn"]').click();
    await this.page.waitForTimeout(500);
    // confirm delete
    await this.page.locator('button:has-text("确认")').click();
    await this.waitForToast('删除成功');
  }

  async toggleFavorite(title: string) {
    const row = this.page.locator('table tbody tr').filter({ hasText: title });
    await row.locator('[data-testid="favorite-btn"]').click();
    await this.page.waitForTimeout(500);
  }

  async selectCategoryFilter(category: string) {
    await this.page.locator('[data-testid="category-filter"]').click();
    await this.page.locator('[role="option"]').filter({ hasText: category }).click();
    await this.page.waitForTimeout(600);
  }

  async selectFavoriteFilter(status: string) {
    await this.page.locator('[data-testid="favorite-filter"]').click();
    await this.page.locator('[role="option"]').filter({ hasText: status }).click();
    await this.page.waitForTimeout(600);
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async hasRowWithText(text: string): Promise<boolean> {
    const count = await this.page.locator('table tbody tr').filter({ hasText: text }).count();
    return count > 0;
  }
}
