// src/features/setup/presentation/steps/__tests__/NotificationScheduleStartStep.test.tsx
import React from 'react';
import { fireEvent, render as testingRender } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';
import { NotificationScheduleStartStep } from '../NotificationScheduleStartStep';

const render = (element: React.ReactElement) =>
  testingRender(<ThemeProvider forcedMode="light">{element}</ThemeProvider>);

const colors = {
  textPrimary: '#000',
  accent: '#FFC814',
  surface: '#F5F5F5',
  borderDefault: '#E0E0E0',
};

describe('NotificationScheduleStartStep', () => {
  it('renders the start-time label and hour/minute wheel values', () => {
    const hourScrollRef = React.createRef<any>();
    const minuteScrollRef = React.createRef<any>();
    const { getByText, getAllByText } = render(
      <NotificationScheduleStartStep
        colors={colors}
        hourValues={['09', '10']}
        minuteValues={['00', '30']}
        hourScrollRef={hourScrollRef}
        minuteScrollRef={minuteScrollRef}
        onHourMomentumScrollEnd={jest.fn()}
        onMinuteMomentumScrollEnd={jest.fn()}
      />,
    );
    expect(getByText('setup.startTime')).toBeTruthy();
    expect(getAllByText('09').length).toBeGreaterThan(0);
    expect(getAllByText('00').length).toBeGreaterThan(0);
  });

  it('fires onHourMomentumScrollEnd when the hour wheel scroll settles', () => {
    const hourScrollRef = React.createRef<any>();
    const minuteScrollRef = React.createRef<any>();
    const onHourMomentumScrollEnd = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <NotificationScheduleStartStep
        colors={colors}
        hourValues={['09']}
        minuteValues={['00']}
        hourScrollRef={hourScrollRef}
        minuteScrollRef={minuteScrollRef}
        onHourMomentumScrollEnd={onHourMomentumScrollEnd}
        onMinuteMomentumScrollEnd={jest.fn()}
      />,
    );
    const scrollViews = UNSAFE_getAllByType(require('react-native').ScrollView);
    fireEvent(scrollViews[0], 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 0 } } });
    expect(onHourMomentumScrollEnd).toHaveBeenCalledTimes(1);
  });
});
