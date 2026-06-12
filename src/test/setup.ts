import '@testing-library/jest-dom';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'vitest-axe/dist/matchers';
import type { AxeMatchers } from 'vitest-axe/dist/matchers';

expect.extend({ toHaveNoViolations });

declare module 'vitest' {
  interface Assertion<T> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
