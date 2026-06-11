type AdRequestOptions = {
    requestNonPersonalizedAdsOnly?: boolean;
};

export const AD_IDS = {
    BANNER: '',
    INTERSTITIAL: '',
    APP_OPEN: '',
};

export const getDefaultAdRequestOptions = (): AdRequestOptions => ({
    requestNonPersonalizedAdsOnly: true,
});

export const requestAdConsent = async (): Promise<void> => undefined;

export const initializeAdMob = async (): Promise<boolean> => false;

export const ensureAdMobReady = async (): Promise<boolean> => false;

export const loadInterstitial = async (_forceReload: boolean = false): Promise<boolean> => false;

export const showInterstitial = async (): Promise<boolean> => false;

export const refreshAdInventoryOnForeground = async (
    _forceReload: boolean = true
): Promise<void> => undefined;

export const checkAndShowAppOpenAd = async (): Promise<void> => undefined;

export const getBannerAdComponent = () => null;

export const getBannerAdSize = () => ({});

export const areAdsSupported = () => false;
