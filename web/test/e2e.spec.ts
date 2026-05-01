import { test } from '@playwright/test';
import { loadYamlFiles, runTestCase } from './runner/yaml-runner';
import type { TestCase } from './runner/types';

const testCases = loadYamlFiles('test/data');

// 按模块分组
const grouped = testCases.reduce<Record<string, TestCase[]>>((acc, tc) => {
  const mod = tc.module || 'default';
  if (!acc[mod]) acc[mod] = [];
  acc[mod].push(tc);
  return acc;
}, {});

// 为每个模块创建 describe 分组
for (const [module, cases] of Object.entries(grouped)) {
  test.describe(module, () => {
    for (const tc of cases) {
      const tags = tc.tags?.join(', ') || '';
      test.describe.configure({ mode: 'serial' });

      test(`${tc.name} [${tags}]`, async ({ page }) => {
        await runTestCase(page, tc);
      });
    }
  });
}
