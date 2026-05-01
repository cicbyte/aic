import type { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CategoriesPage extends BasePage {
  readonly createBtn = this.page.locator('[data-testid="create-category"]');
  readonly searchInput = this.page.locator('[data-testid="search-input"]');

  async goto() {
    await super.goto('/categories');
  }

  async createCategory() {
    await this.createBtn.click();
    await this.page.waitForTimeout(500);
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.page.waitForTimeout(600);
  }

  async deleteCategory(name: string) {
    const row = this.page.locator('[data-testid="category-row"]').filter({ hasText: name });
    await row.hover();
    await row.locator('[data-testid="delete-btn"]').click();
    await this.page.waitForTimeout(500);
    await this.page.locator('button:has-text("确认")').click();
    await this.waitForToast('删除成功');
  }

  async getRowCount(): Promise<number> {
    return this.page.locator('[data-testid="category-row"]').count();
  }

  async hasRowWithText(text: string): Promise<boolean> {
    const count = await this.page.locator('[data-testid="category-row"]').filter({ hasText: text }).count();
    return count > 0;
  }
}
