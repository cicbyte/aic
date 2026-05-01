import type { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class PromptEditorPage extends BasePage {
  readonly titleInput = this.page.locator('[data-testid="prompt-title"]');
  readonly descriptionInput = this.page.locator('[data-testid="prompt-description"]');
  readonly saveBtn = this.page.locator('[data-testid="save-prompt"]');
  readonly backBtn = this.page.locator('[data-testid="back-btn"]');

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async fillDescription(desc: string) {
    await this.descriptionInput.fill(desc);
  }

  async fillContent(content: string) {
    const editor = this.page.locator('.cm-content').first();
    await editor.click();
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.type(content);
  }

  async save() {
    await this.saveBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async selectCategory(name: string) {
    const select = this.page.locator('[data-testid="category-select"]');
    await select.click();
    await this.page.locator('[role="option"]').filter({ hasText: name }).click();
  }

  async selectProject(name: string) {
    const select = this.page.locator('[data-testid="project-select"]');
    await select.click();
    await this.page.locator('[role="option"]').filter({ hasText: name }).click();
  }

  async goBack() {
    await this.backBtn.click();
    await this.page.waitForTimeout(500);
  }

  async openVersionSheet() {
    await this.page.locator('[data-testid="version-btn"]').click();
    await this.page.waitForTimeout(500);
  }

  async closeVersionSheet() {
    await this.page.locator('[data-testid="close-version-sheet"]').click();
    await this.page.waitForTimeout(500);
  }

  async publishVersion(version: string) {
    await this.page.locator('[data-testid="publish-version-input"]').fill(version);
    await this.page.locator('[data-testid="publish-version-btn"]').click();
    await this.page.waitForTimeout(1000);
  }

  async getTitle(): Promise<string> {
    return this.titleInput.inputValue();
  }

  async isSaveDisabled(): Promise<boolean> {
    return this.saveBtn.isDisabled();
  }
}
