import type { Page } from '@playwright/test';

export interface Precondition {
  name: string;
  api: string;
  body?: Record<string, unknown>;
  extract?: string;
}

export interface Step {
  action: 'click' | 'fill' | 'wait' | 'expect' | 'select' | 'hover' | 'keyboard' | 'screenshot' | 'assertUrl';
  locator?: string;
  value?: string;
  visible?: boolean;
  count?: number;
  condition?: string;
  duration?: number;
  text?: string;
  contains?: string;
  options?: Record<string, unknown>;
}

export interface Postcondition {
  api?: string;
  body?: Record<string, unknown>;
  action?: string;
  locator?: string;
}

export interface TestCase {
  name: string;
  module: string;
  base_url?: string;
  preconditions?: Precondition[];
  steps: Step[];
  postconditions?: Postcondition[];
  tags?: string[];
}

export interface TestSuite {
  module: string;
  base_url?: string;
  tests: TestCase[];
}

export interface RunContext {
  page: Page;
  vars: Record<string, string>;
  baseUrl: string;
}
