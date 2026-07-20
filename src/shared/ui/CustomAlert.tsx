import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppModal } from './feedback/AppModal';
import { AppButton, type AppButtonVariant } from './primitives/AppButton';

export interface AlertButton {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message?: string;
  content?: ReactNode;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [alertConfig, setAlertConfig] = useState<AlertOptions | null>(null);
  const hideAlert = useCallback(() => setAlertConfig(null), []);
  const showAlert = useCallback(
    (options: AlertOptions) =>
      setAlertConfig({
        ...options,
        buttons: options.buttons ?? [{ text: t('common.ok') }],
      }),
    [t],
  );
  const context = useMemo(() => ({ showAlert, hideAlert }), [hideAlert, showAlert]);
  const buttons = alertConfig?.buttons ?? [];

  const getVariant = (style: AlertButton['style']): AppButtonVariant =>
    style === 'destructive' ? 'destructive' : style === 'cancel' ? 'ghost' : 'primary';

  const handleButtonPress = async (button: AlertButton) => {
    hideAlert();
    await button.onPress?.();
  };

  return (
    <AlertContext.Provider value={context}>
      {children}
      <AppModal
        visible={alertConfig !== null}
        title={alertConfig?.title ?? ''}
        description={alertConfig?.message}
        dismissOnBackdropPress={false}
        onRequestClose={hideAlert}
        actions={
          <View style={[styles.actions, buttons.length > 2 && styles.vertical]}>
            {buttons.map((button, index) => (
              <AppButton
                key={`${button.text}-${index}`}
                fullWidth={buttons.length > 2}
                label={button.text}
                onPress={() => handleButtonPress(button)}
                variant={getVariant(button.style)}
                style={buttons.length <= 2 ? styles.horizontalAction : undefined}
              />
            ))}
          </View>
        }
      >
        {alertConfig?.content}
      </AppModal>
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextType {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export const createAlert = (showAlert: AlertContextType['showAlert']) => ({
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert({ title, message, buttons });
  },
});

const styles = StyleSheet.create({
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  vertical: {
    flexDirection: 'column',
  },
  horizontalAction: {
    flex: 1,
  },
});
