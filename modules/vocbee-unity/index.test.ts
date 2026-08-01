jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: () => null,
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

import { getGameInfo, openGame } from './index';

it('returns typed failures when session data or native runtime is unavailable', async () => {
  await expect(openGame('[]')).resolves.toMatchObject({
    ok: false,
    code: 'INVALID_SESSION_JSON',
  });
  await expect(openGame(JSON.stringify({ value: 'ı'.repeat(33_000) }))).resolves.toMatchObject({
    ok: false,
    code: 'INVALID_SESSION_JSON',
  });
  await expect(openGame('{}')).resolves.toMatchObject({
    ok: false,
    code: 'NATIVE_MODULE_UNAVAILABLE',
  });
  await expect(getGameInfo()).resolves.toMatchObject({
    runtimeAvailable: false,
    error: 'NATIVE_MODULE_UNAVAILABLE',
  });
});
