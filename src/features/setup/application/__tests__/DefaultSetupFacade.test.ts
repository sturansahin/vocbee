import { DefaultSetupFacade } from '../DefaultSetupFacade';
import type { SetupPlatformGateway } from '../setupContracts';

function makeGateway(): SetupPlatformGateway {
  return {
    getNotificationPermissionGranted: jest.fn(async () => true),
    requestNotificationPermission: jest.fn(async () => true),
    openSystemSettings: jest.fn(async () => undefined),
    persistCompletion: jest.fn(async () => undefined),
    prepareLearningContent: jest.fn(async () => undefined),
  };
}

describe('DefaultSetupFacade', () => {
  it('persists setup, refreshes auth settings, then prepares learning content', async () => {
    const gateway = makeGateway();
    const refresh = jest.fn(async () => undefined);
    const input = {
      nativeLanguage: 'turkish',
      targetLanguage: 'english',
      level: 'beginner',
      user: null,
      notificationPermissionGranted: true,
      startHour: '09',
      startMinute: '00',
      endHour: '21',
      endMinute: '00',
      frequency: 'every2hours' as const,
    };

    await new DefaultSetupFacade(gateway).complete(input, refresh);

    expect(gateway.persistCompletion).toHaveBeenCalledWith(input);
    expect(refresh).toHaveBeenCalled();
    expect(gateway.prepareLearningContent).toHaveBeenCalledWith(input);
    expect((gateway.persistCompletion as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      refresh.mock.invocationCallOrder[0],
    );
    expect(refresh.mock.invocationCallOrder[0]).toBeLessThan(
      (gateway.prepareLearningContent as jest.Mock).mock.invocationCallOrder[0],
    );
  });

  it('fails closed for invalid preferences', async () => {
    const gateway = makeGateway();
    await expect(
      new DefaultSetupFacade(gateway).complete(
        {
          nativeLanguage: '',
          targetLanguage: 'english',
          level: 'beginner',
          user: null,
          notificationPermissionGranted: false,
          startHour: '09',
          startMinute: '00',
          endHour: '21',
          endMinute: '00',
          frequency: 'every2hours',
        },
        async () => undefined,
      ),
    ).rejects.toThrow('Setup cannot be completed');
    expect(gateway.persistCompletion).not.toHaveBeenCalled();
  });
});
