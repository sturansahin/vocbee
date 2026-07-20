// src/features/monetization/data/repositories/__tests__/RevenueCatRepository.test.ts
// Repository test against the real class, with react-native-purchases mocked globally (jest.setup.js).
// Covers restore flow + error fallback (docs/architecture.md).

import Purchases from 'react-native-purchases';
import { RevenueCatRepositoryImpl } from '../RevenueCatRepository';

describe('RevenueCatRepositoryImpl', () => {
  let repo: RevenueCatRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new RevenueCatRepositoryImpl();
  });

  it('configures Purchases and fetches customer info for a new user', async () => {
    const customerInfo = { entitlements: { active: {}, all: {} } };
    (Purchases.getCustomerInfo as jest.Mock).mockResolvedValueOnce(customerInfo);

    const result = await repo.getCustomerInfo('user-1', { email: 'a@b.com', displayName: 'A' });

    expect(Purchases.configure).toHaveBeenCalledTimes(1);
    expect(Purchases.setAttributes).toHaveBeenCalledWith({ firebase_uid: 'user-1' });
    expect(result).toEqual(customerInfo);
  });

  it('restores purchases via Purchases.restorePurchases (restore flow)', async () => {
    const restoredInfo = {
      entitlements: { active: { premium: { isActive: true } }, all: {} },
    };
    (Purchases.restorePurchases as jest.Mock).mockResolvedValueOnce(restoredInfo);

    const result = await repo.restore('user-1');

    expect(Purchases.restorePurchases).toHaveBeenCalledTimes(1);
    expect(result).toEqual(restoredInfo);
  });

  it('propagates errors from Purchases.getCustomerInfo (no silent fallback to null)', async () => {
    (Purchases.getCustomerInfo as jest.Mock).mockRejectedValueOnce(new Error('network down'));

    await expect(repo.getCustomerInfo('user-1')).rejects.toThrow('network down');
  });

  it('does not throw when subscriber attribute sync fails (best-effort, matches services/revenueCatService.ts)', async () => {
    (Purchases.setAttributes as jest.Mock).mockRejectedValueOnce(new Error('attr sync failed'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(repo.ensureConfigured('user-1')).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      '[RevenueCat] Failed to sync subscriber attributes',
      expect.any(Error),
    );

    warnSpy.mockRestore();
  });

  it('re-logs in when a different app user id is configured on an existing session', async () => {
    (Purchases.getCustomerInfo as jest.Mock).mockResolvedValue({
      entitlements: { active: {}, all: {} },
    });

    await repo.getCustomerInfo('user-1');
    await repo.getCustomerInfo('user-2');

    expect(Purchases.logIn).toHaveBeenCalledWith('user-2');
  });

  it('registers and unregisters a customer info listener', () => {
    const listener = jest.fn();
    const unsubscribe = repo.onCustomerInfoChanged(listener);

    expect(Purchases.addCustomerInfoUpdateListener).toHaveBeenCalledWith(listener);

    unsubscribe();
    expect(Purchases.removeCustomerInfoUpdateListener).toHaveBeenCalledWith(listener);
  });
});
