import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { expect, type Page, type Locator } from '@playwright/test';
import type { RunContext, Step, TestCase, TestSuite, Precondition, Postcondition } from './types';

const API_BASE = 'http://localhost:3052';

export function loadYamlFiles(dir: string): TestCase[] {
  const yamlDir = path.resolve(dir);
  const files = fs.readdirSync(yamlDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  const allCases: TestCase[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(yamlDir, file), 'utf-8');
    const suite = yaml.load(content) as TestSuite;
    if (suite && Array.isArray(suite.tests)) {
      for (const tc of suite.tests) {
        allCases.push({
          ...tc,
          module: suite.module,
          base_url: tc.base_url || suite.base_url || '',
        });
      }
    }
  }

  return allCases;
}

function resolveTemplate(str: string, vars: Record<string, string>): string {
  return str.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

async function executePreconditions(ctx: RunContext, preconditions: Precondition[]) {
  ctx.vars['_ts'] = String(Date.now());
  for (const pre of preconditions) {
    const [method, urlPath] = pre.api.split(' ');
    const body = pre.body ? JSON.parse(JSON.stringify(pre.body)) : undefined;
    if (body) {
      for (const key of Object.keys(body)) {
        if (typeof body[key] === 'string') {
          body[key] = resolveTemplate(body[key], ctx.vars);
          if (/^\d+$/.test(body[key] as string)) {
            body[key] = Number(body[key]);
          }
        }
      }
    }

    const response = await ctx.page.request.fetch(`${API_BASE}${urlPath}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      data: body,
    });
    const json = await response.json();

    if (json.code !== 0) {
      if (pre.ignoreError) continue;
      throw new Error(`前置条件失败 [${pre.name}]: ${json.message}`);
    }

    if (pre.extract && json.data) {
      const fieldMap: Record<string, string> = {
        categoryId: 'categoryId',
        projectId: 'projectId',
        promptId: 'promptId',
        id: 'id',
        skillId: 'skillId',
      };
      const dataField = fieldMap[pre.extract] || pre.extract;
      const value = json.data[dataField];
      if (value !== undefined) {
        ctx.vars[pre.extract] = String(value);
      }
    }
  }
}

async function executePostconditions(ctx: RunContext, postconditions: Postcondition[]) {
  for (const post of postconditions) {
    if (post.api) {
      const [method, urlPath] = post.api.split(' ');
      const body = post.body ? JSON.parse(JSON.stringify(post.body)) : undefined;
      if (body) {
        for (const key of Object.keys(body)) {
          if (typeof body[key] === 'string') {
            body[key] = resolveTemplate(body[key], ctx.vars);
          }
        }
      }
      try {
        await ctx.page.request.fetch(`${API_BASE}${urlPath}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          data: body,
        });
      } catch {
        // cleanup best-effort
      }
    }
  }
}

async function executeStep(ctx: RunContext, step: Step) {
  const { page, vars } = ctx;

  const resolve = (s?: string) => s ? resolveTemplate(s, vars) : '';
  const locator = resolve(step.locator);
  const value = resolve(step.value);

  switch (step.action) {
    case 'click': {
      const el = locator.startsWith('text=') ? page.getByText(locator.slice(5)).first() : page.locator(locator).first();
      await el.click({ timeout: 10_000 });
      break;
    }
    case 'fill': {
      const el = locator.startsWith('text=') ? page.getByText(locator.slice(5)).first() : page.locator(locator).first();
      await el.fill(value);
      break;
    }
    case 'select': {
      const el = page.locator(locator);
      await el.click();
      const option = page.locator(`[role="option"]:has-text("${value}")`).first();
      await option.click();
      break;
    }
    case 'hover': {
      const el = page.locator(locator).first();
      await el.hover();
      break;
    }
    case 'keyboard': {
      await page.keyboard.press(value);
      break;
    }
    case 'wait': {
      if (step.duration) {
        await page.waitForTimeout(step.duration);
      } else if (step.condition === 'navigation') {
        await page.waitForURL(/.*/, { timeout: 10_000 });
      } else if (step.condition === 'api_response') {
        await page.waitForTimeout(1000);
      } else {
        await page.waitForTimeout(500);
      }
      break;
    }
    case 'expect': {
      let el: Locator = locator.startsWith('text=')
        ? page.getByText(locator.slice(5))
        : page.locator(locator);

      if (step.visible !== undefined && !step.count) {
        el = el.first();
      }

      if (step.visible !== undefined) {
        if (step.visible) {
          await expect(el).toBeVisible({ timeout: 10_000 });
        } else {
          await expect(el).not.toBeVisible({ timeout: 10_000 });
        }
      } else if (step.count !== undefined) {
        await expect(el).toHaveCount(step.count, { timeout: 10_000 });
      } else if (step.text !== undefined) {
        await expect(el).toHaveText(value);
      } else if (step.contains !== undefined) {
        await expect(el).toContainText(value);
      } else {
        await expect(el).toBeVisible({ timeout: 10_000 });
      }
      break;
    }
    case 'screenshot': {
      await page.screenshot({ path: value || `screenshot-${Date.now()}.png` });
      break;
    }
    case 'assertUrl': {
      if (value) {
        await page.waitForURL(new RegExp(value), { timeout: 10_000 });
      }
      break;
    }
    default:
      throw new Error(`未知 action: ${step.action}`);
  }
}

export async function runTestCase(page: Page, testCase: TestCase) {
  const ctx: RunContext = {
    page,
    vars: {},
    baseUrl: 'http://localhost:3052',
  };

  try {
    if (testCase.preconditions?.length) {
      await executePreconditions(ctx, testCase.preconditions);
    }

    if (testCase.base_url) {
      await page.goto(testCase.base_url);
      await page.waitForLoadState('networkidle');
    }

    for (const step of testCase.steps) {
      await executeStep(ctx, step);
    }
  } finally {
    if (testCase.postconditions?.length) {
      await executePostconditions(ctx, testCase.postconditions);
    }
  }
}
