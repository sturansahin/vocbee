// src/devtools/__tests__/guard.test.ts
// Verifies the binding safety contract of isDevToolsEnabled (guard.ts):
//  - true only when __DEV__ is true
//  - EXPO_PUBLIC_ENABLE_DEVTOOLS can only narrow (force-disable), never widen into production
//  - __DEV__ === false (production build) is ALWAYS disabled regardless of the env flag

describe('devtools guard (isDevToolsEnabled)', () => {
  const originalDev = (global as any).__DEV__;
  const originalEnv = process.env.EXPO_PUBLIC_ENABLE_DEVTOOLS;

  afterEach(() => {
    (global as any).__DEV__ = originalDev;
    process.env.EXPO_PUBLIC_ENABLE_DEVTOOLS = originalEnv;
    jest.resetModules();
  });

  function loadGuard(): { isDevToolsEnabled: boolean } {
    let guardModule: { isDevToolsEnabled: boolean };
    jest.isolateModules(() => {
      guardModule = require('../guard');
    });
    return guardModule!;
  }

  it('is enabled in dev by default (no env override)', () => {
    (global as any).__DEV__ = true;
    delete process.env.EXPO_PUBLIC_ENABLE_DEVTOOLS;

    const { isDevToolsEnabled } = loadGuard();
    expect(isDevToolsEnabled).toBe(true);
  });

  it('production disabled behavior: is ALWAYS disabled when __DEV__ is false, even if the env flag says "true"', () => {
    (global as any).__DEV__ = false;
    process.env.EXPO_PUBLIC_ENABLE_DEVTOOLS = 'true';

    const { isDevToolsEnabled } = loadGuard();
    expect(isDevToolsEnabled).toBe(false);
  });

  it('production disabled behavior: is disabled when __DEV__ is false and no env override is set', () => {
    (global as any).__DEV__ = false;
    delete process.env.EXPO_PUBLIC_ENABLE_DEVTOOLS;

    const { isDevToolsEnabled } = loadGuard();
    expect(isDevToolsEnabled).toBe(false);
  });

  it('env flag can narrow (force-disable) devtools while still in __DEV__', () => {
    (global as any).__DEV__ = true;
    process.env.EXPO_PUBLIC_ENABLE_DEVTOOLS = 'false';

    const { isDevToolsEnabled } = loadGuard();
    expect(isDevToolsEnabled).toBe(false);
  });

  it('env flag cannot widen access when __DEV__ is false ("true" has no effect in production)', () => {
    (global as any).__DEV__ = false;
    process.env.EXPO_PUBLIC_ENABLE_DEVTOOLS = 'true';

    const { isDevToolsEnabled } = loadGuard();
    expect(isDevToolsEnabled).toBe(false);
  });
});
