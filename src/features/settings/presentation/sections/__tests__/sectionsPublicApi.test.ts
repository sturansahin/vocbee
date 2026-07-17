import * as sections from '..';

describe('settings sections public API', () => {
    it('exports only visible settings sections', () => {
        expect(sections).toEqual(expect.objectContaining({
            ProfileSettingsSection: expect.any(Function),
            PremiumSettingsSection: expect.any(Function),
            LanguageSettingsSection: expect.any(Function),
            NotificationSettingsSection: expect.any(Function),
            DangerZoneSection: expect.any(Function),
        }));
        expect(sections).not.toHaveProperty('SyncSettingsSection');
    });
});
