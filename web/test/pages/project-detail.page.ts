import type { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ProjectDetailPage extends BasePage {
  readonly createPromptBtn = this.page.locator('[data-testid="create-prompt"]');
  readonly searchInput = this.page.locator('[data-testid="search-input"]');
  readonly tableRows = this.page.locator('table tbody tr');
  readonly backBtn = this.page.locator('[data-testid="back-btn"]');

  async open(projectId: number) {
    await super.goto(`/projects/${projectId}`);
  }

  async createPrompt() {
    await this.createPromptBtn.click();
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
    await this.page.locator('button:has-text("确认")').click();
    await this.waitForToast('删除成功');
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async goBack() {
    await this.backBtn.click();
    await this.page.waitForTimeout(500);
  }
}
