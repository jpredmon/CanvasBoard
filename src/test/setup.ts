import '@testing-library/jest-dom';

import { expect } from 'vitest';
import type { AxeMatchers } from 'vitest-axe/dist/matchers';
import { toHaveNoViolations } from 'vitest-axe/dist/matchers';

expect.extend({ toHaveNoViolations });

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Assertion<T> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
