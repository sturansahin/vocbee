import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { CustomerInfo, PurchasesEntitlementInfo } from 'react-native-purchases';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useAuth } from './AuthContext';
import {
    addRevenueCatCustomerInfoListener,
    getActiveAdFreeEntitlement,
    getRevenueCatCustomerInfo,
    hasActiveAdFreeEntitlement,
    openRevenueCatCustomerCenter,
    presentAdFreePaywall,
    restoreRevenueCatPurchases,
    syncRevenueCatPreferredUILocale,
} from '../services/revenueCatService';
import i18n from '../services/i18n';

interface MonetizationContextType {
    isLoading: boolean;
    isAdFree: boolean;
    customerInfo: CustomerInfo | null;
    activeEntitlement: PurchasesEntitlementInfo | null;
    refreshCustomerInfo: () => Promise<boolean>;
    presentRemoveAdsPaywall: () => Promise<boolean>;
    restorePurchases: () => Promise<boolean>;
    openCustomerCenter: () => Promise<void>;
}

const MonetizationContext = createContext<MonetizationContextType | undefined>(undefined);

export function MonetizationProvider({ children }: { children: ReactNode }) {
    const { user, profile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

    const userId = user?.uid ?? null;

    const revenueCatAttributes = useMemo(() => ({
        email: user?.email ?? profile.email ?? null,
        displayName: profile.name || user?.displayName || null,
    }), [profile.email, profile.name, user?.displayName, user?.email]);

    useEffect(() => {
        const handleLanguageChanged = (language: string) => {
            syncRevenueCatPreferredUILocale(language).catch(error => {
                console.warn('[RevenueCat] Failed to update paywall language', error);
            });
        };

        handleLanguageChanged(i18n.resolvedLanguage || i18n.language);
        i18n.on('languageChanged', handleLanguageChanged);

        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, []);

    const applyCustomerInfo = useCallback((nextCustomerInfo: CustomerInfo | null): boolean => {
        setCustomerInfo(nextCustomerInfo);
        return hasActiveAdFreeEntitlement(nextCustomerInfo);
    }, []);

    const refreshCustomerInfo = useCallback(async (): Promise<boolean> => {
        if (!userId) {
            setCustomerInfo(null);
            return false;
        }

        const nextCustomerInfo = await getRevenueCatCustomerInfo(userId, revenueCatAttributes);
        return applyCustomerInfo(nextCustomerInfo);
    }, [applyCustomerInfo, revenueCatAttributes, userId]);

    useEffect(() => {
        let cancelled = false;
        let unsubscribe: (() => void) | null = null;

        if (!userId) {
            setCustomerInfo(null);
            setIsLoading(false);
            return () => undefined;
        }

        setIsLoading(true);

        getRevenueCatCustomerInfo(userId, revenueCatAttributes)
            .then(nextCustomerInfo => {
                if (cancelled) {
                    return;
                }

                applyCustomerInfo(nextCustomerInfo);
                unsubscribe = addRevenueCatCustomerInfoListener(updatedCustomerInfo => {
                    if (!cancelled) {
                        applyCustomerInfo(updatedCustomerInfo);
                    }
                });
            })
            .catch(error => {
                console.warn('[RevenueCat] Failed to load customer info', error);
                if (!cancelled) {
                    setCustomerInfo(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
            unsubscribe?.();
        };
    }, [applyCustomerInfo, revenueCatAttributes, userId]);

    const presentRemoveAdsPaywall = useCallback(async (): Promise<boolean> => {
        if (!userId) {
            return false;
        }

        const { result, customerInfo: updatedCustomerInfo } = await presentAdFreePaywall(
            userId,
            revenueCatAttributes
        );

        if (updatedCustomerInfo) {
            return applyCustomerInfo(updatedCustomerInfo);
        }

        return result === PAYWALL_RESULT.NOT_PRESENTED && (await refreshCustomerInfo());
    }, [applyCustomerInfo, refreshCustomerInfo, revenueCatAttributes, userId]);

    const restorePurchases = useCallback(async (): Promise<boolean> => {
        if (!userId) {
            return false;
        }

        const restoredCustomerInfo = await restoreRevenueCatPurchases(userId, revenueCatAttributes);
        return applyCustomerInfo(restoredCustomerInfo);
    }, [applyCustomerInfo, revenueCatAttributes, userId]);

    const openCustomerCenter = useCallback(async (): Promise<void> => {
        if (!userId) {
            return;
        }

        const updatedCustomerInfo = await openRevenueCatCustomerCenter(userId, revenueCatAttributes);
        applyCustomerInfo(updatedCustomerInfo);
    }, [applyCustomerInfo, revenueCatAttributes, userId]);

    const activeEntitlement = getActiveAdFreeEntitlement(customerInfo);
    const value = useMemo<MonetizationContextType>(() => ({
        isLoading,
        isAdFree: Boolean(activeEntitlement?.isActive),
        customerInfo,
        activeEntitlement,
        refreshCustomerInfo,
        presentRemoveAdsPaywall,
        restorePurchases,
        openCustomerCenter,
    }), [
        activeEntitlement,
        customerInfo,
        isLoading,
        openCustomerCenter,
        presentRemoveAdsPaywall,
        refreshCustomerInfo,
        restorePurchases,
    ]);

    return (
        <MonetizationContext.Provider value={value}>
            {children}
        </MonetizationContext.Provider>
    );
}

export function useMonetization() {
    const context = useContext(MonetizationContext);
    if (context === undefined) {
        throw new Error('useMonetization must be used within a MonetizationProvider');
    }
    return context;
}
