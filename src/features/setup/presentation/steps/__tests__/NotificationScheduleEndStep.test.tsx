// src/features/setup/presentation/steps/__tests__/NotificationScheduleEndStep.test.tsx
import React from 'react';
import { fireEvent, render as testingRender } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';
import { NotificationScheduleEndStep } from '../NotificationScheduleEndStep';

const render = (element: React.ReactElement) =>
  testingRender(<ThemeProvider forcedMode="light">{element}</ThemeProvider>);

const colors = {
  textPrimary: '#000',
  accent: '#FFC814',
  surface: '#F5F5F5',
  borderDefault: '#E0E0E0',
};

describe('NotificationScheduleEndStep', () => {
  it('renders the end-time label and hour/minute wheel values', () => {
    const hourScrollRef = React.createRef<any>();
    const minuteScrollRef = React.createRef<any>();
    const { getByText, getAllByText } = render(
      <NotificationScheduleEndStep
        colors={colors}
        hourValues={['21', '22']}
        minuteValues={['00', '30']}
        hourScrollRef={hourScrollRef}
        minuteScrollRef={minuteScrollRef}
        onHourMomentumScrollEnd={jest.fn()}
        onMinuteMomentumScrollEnd={jest.fn()}
      />,
    );
    expect(getByText('setup.endTime')).toBeTruthy();
    expect(getAllByText('21').length).toBeGreaterThan(0);
    expect(getAllByText('00').length).toBeGreaterThan(0);
  });

  it('fires onMinuteMomentumScrollEnd when the minute wheel scroll settles', () => {
    const hourScrollRef = React.createRef<any>();
    const minuteScrollRef = React.createRef<any>();
    const onMinuteMomentumScrollEnd = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <NotificationScheduleEndStep
        colors={colors}
        hourValues={['21']}
        minuteValues={['00']}
        hourScrollRef={hourScrollRef}
        minuteScrollRef={minuteScrollRef}
        onHourMomentumScrollEnd={jest.fn()}
        onMinuteMomentumScrollEnd={onMinuteMomentumScrollEnd}
      />,
    );
    const scrollViews = UNSAFE_getAllByType(require('react-native').ScrollView);
    fireEvent(scrollViews[1], 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 0 } } });
    expect(onMinuteMomentumScrollEnd).toHaveBeenCalledTimes(1);
  });
});
