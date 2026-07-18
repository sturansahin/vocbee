// file: components/__tests__/CustomAlert.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { AlertProvider, useAlert, createAlert } from '../CustomAlert';
import { ThemeProvider } from '@shared/theme';

// Test component that uses the alert hook
const TestConsumer = ({ onShowAlert }: { onShowAlert?: (showAlert: any) => void }) => {
  const { showAlert, hideAlert } = useAlert();

  React.useEffect(() => {
    if (onShowAlert) {
      onShowAlert(showAlert);
    }
  }, [showAlert, onShowAlert]);

  return (
    <>
      <TouchableOpacity
        testID="show-alert"
        onPress={() => showAlert({ title: 'Test Title', message: 'Test Message' })}
      >
        <Text>Show Alert</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="hide-alert" onPress={hideAlert}>
        <Text>Hide Alert</Text>
      </TouchableOpacity>
    </>
  );
};

// Wrapper with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <AlertProvider>{ui}</AlertProvider>
    </ThemeProvider>,
  );
};

describe('CustomAlert', () => {
  describe('AlertProvider', () => {
    it('renders children correctly', () => {
      const { getByText } = renderWithProviders(<Text>Child Content</Text>);
      expect(getByText('Child Content')).toBeTruthy();
    });

    it('provides showAlert and hideAlert functions', () => {
      const { getByTestId } = renderWithProviders(<TestConsumer />);
      expect(getByTestId('show-alert')).toBeTruthy();
      expect(getByTestId('hide-alert')).toBeTruthy();
    });
  });

  describe('useAlert hook', () => {
    it('throws error when used outside AlertProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const ThrowingComponent = () => {
        useAlert();
        return null;
      };

      expect(() => {
        render(
          <ThemeProvider>
            <ThrowingComponent />
          </ThemeProvider>,
        );
      }).toThrow('useAlert must be used within an AlertProvider');

      consoleSpy.mockRestore();
    });

    it('shows alert with title and message', async () => {
      const { getByTestId, getByText } = renderWithProviders(<TestConsumer />);

      fireEvent.press(getByTestId('show-alert'));

      await waitFor(() => {
        expect(getByText('Test Title')).toBeTruthy();
        expect(getByText('Test Message')).toBeTruthy();
      });
    });

    it('shows alert with custom buttons', async () => {
      const onPressMock = jest.fn();

      const TestWithButtons = () => {
        const { showAlert } = useAlert();
        return (
          <TouchableOpacity
            testID="show-custom-alert"
            onPress={() =>
              showAlert({
                title: 'Confirm',
                message: 'Are you sure?',
                buttons: [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: onPressMock },
                ],
              })
            }
          >
            <Text>Show Custom Alert</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId, getByText } = renderWithProviders(<TestWithButtons />);

      fireEvent.press(getByTestId('show-custom-alert'));

      await waitFor(() => {
        expect(getByText('Cancel')).toBeTruthy();
        expect(getByText('Delete')).toBeTruthy();
      });
    });

    it('calls button onPress and hides alert', async () => {
      const onPressMock = jest.fn();

      const TestWithCallback = () => {
        const { showAlert } = useAlert();
        return (
          <TouchableOpacity
            testID="show-callback-alert"
            onPress={() =>
              showAlert({
                title: 'Test',
                buttons: [{ text: 'OK', onPress: onPressMock }],
              })
            }
          >
            <Text>Show</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId, getByText } = renderWithProviders(<TestWithCallback />);

      fireEvent.press(getByTestId('show-callback-alert'));

      await waitFor(() => {
        expect(getByText('OK')).toBeTruthy();
      });

      fireEvent.press(getByText('OK'));

      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('shows default OK button when no buttons provided', async () => {
      const TestDefaultButton = () => {
        const { showAlert } = useAlert();
        return (
          <TouchableOpacity
            testID="show-default-alert"
            onPress={() => showAlert({ title: 'Simple Alert' })}
          >
            <Text>Show</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId, getByText } = renderWithProviders(<TestDefaultButton />);

      fireEvent.press(getByTestId('show-default-alert'));

      await waitFor(() => {
        expect(getByText('common.ok')).toBeTruthy(); // Mocked t() returns key
      });
    });

    it('renders custom content when provided', async () => {
      const TestCustomContent = () => {
        const { showAlert } = useAlert();
        return (
          <TouchableOpacity
            testID="show-content-alert"
            onPress={() =>
              showAlert({
                title: 'Custom Content',
                content: <Text>Animated streak stats</Text>,
              })
            }
          >
            <Text>Show</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId, getByText } = renderWithProviders(<TestCustomContent />);

      fireEvent.press(getByTestId('show-content-alert'));

      await waitFor(() => {
        expect(getByText('Custom Content')).toBeTruthy();
        expect(getByText('Animated streak stats')).toBeTruthy();
      });
    });
  });

  describe('createAlert helper', () => {
    it('creates alert function', () => {
      const showAlertMock = jest.fn();
      const alertHelper = createAlert(showAlertMock);

      alertHelper.alert('Title', 'Message');

      expect(showAlertMock).toHaveBeenCalledWith({
        title: 'Title',
        message: 'Message',
        buttons: undefined,
      });
    });

    it('creates alert with buttons', () => {
      const showAlertMock = jest.fn();
      const alertHelper = createAlert(showAlertMock);
      const buttons = [{ text: 'OK' }];

      alertHelper.alert('Title', 'Message', buttons);

      expect(showAlertMock).toHaveBeenCalledWith({
        title: 'Title',
        message: 'Message',
        buttons,
      });
    });
  });

  describe('button styles', () => {
    it('renders destructive button with correct style', async () => {
      const TestDestructive = () => {
        const { showAlert } = useAlert();
        return (
          <TouchableOpacity
            testID="show-destructive"
            onPress={() =>
              showAlert({
                title: 'Confirm Delete',
                buttons: [{ text: 'Delete Item', style: 'destructive' }],
              })
            }
          >
            <Text>Show</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId, getByText } = renderWithProviders(<TestDestructive />);

      fireEvent.press(getByTestId('show-destructive'));

      await waitFor(() => {
        expect(getByText('Delete Item')).toBeTruthy();
      });
    });

    it('renders multiple buttons (>2) in vertical layout', async () => {
      const TestMultipleButtons = () => {
        const { showAlert } = useAlert();
        return (
          <TouchableOpacity
            testID="show-multi"
            onPress={() =>
              showAlert({
                title: 'Choose',
                buttons: [{ text: 'Option 1' }, { text: 'Option 2' }, { text: 'Option 3' }],
              })
            }
          >
            <Text>Show</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId, getByText } = renderWithProviders(<TestMultipleButtons />);

      fireEvent.press(getByTestId('show-multi'));

      await waitFor(() => {
        expect(getByText('Option 1')).toBeTruthy();
        expect(getByText('Option 2')).toBeTruthy();
        expect(getByText('Option 3')).toBeTruthy();
      });
    });
  });
});
