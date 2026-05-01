import { test } from '@playwright/test';
import { loadYamlFiles, runTestCase } from './runner/yaml-runner';
import type { TestCase } from './runner/types';

const testCases = loadYamlFiles('data');

const grouped = testCases.reduce<Record<string, TestCase[]>>((acc, tc) => {
  const mod = tc.module || 'default';
  if (!acc[mod]) acc[mod] = [];
  acc[mod].push(tc);
  return acc;
}, {});

for (const [module, cases] of Object.entries(grouped)) {
  test.describe(`${module}`, () => {
    test.describe.configure({ mode: 'serial' });
    for (const tc of cases) {
      const tags = tc.tags?.join(', ') || '';
      test(`${tc.name} [${tags}]`, async ({ page }) => {
        await runTestCase(page, tc);
      });
    }
  });
}
