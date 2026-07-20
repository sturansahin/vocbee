import React, { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import {
  AppButton,
  AppInput,
  AppModal,
  AppSwitch,
  AppText,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  OfflineState,
  ProgressBar,
  SectionCard,
  SelectionRow,
  SettingsRow,
  Surface,
} from '@shared/ui';
import { ThemeProvider, useTheme } from '@shared/theme';
import { useReducedMotion, useResponsiveLayout } from '@shared/responsive';

function CatalogShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const navigation = useNavigation();
  const { colors, spacing } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { gap: spacing.xl }]}
      style={{ backgroundColor: colors.background }}
      testID={`devtools-catalog-${title.toLowerCase()}`}
    >
      <View>
        <AppText accessibilityRole="header" variant="screenTitle">
          {title}
        </AppText>
        <AppText color="textSecondary">{description}</AppText>
      </View>
      {children}
      <AppButton
        label="Back to Developer Test Panel"
        onPress={() => navigation.goBack()}
        testID={`devtools-catalog-back-${title.toLowerCase()}`}
        variant="outline"
      />
    </ScrollView>
  );
}

export function ComponentCatalogScreen() {
  const [pressedCount, setPressedCount] = useState(0);
  const [switchValue, setSwitchValue] = useState(false);
  const [selection, setSelection] = useState('regular');
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <CatalogShell
      description="Interactive public primitive variants. Every action mutates local catalog state only."
      title="Components"
    >
      <SectionCard title="Buttons">
        <View style={styles.sectionBody}>
          {(['primary', 'secondary', 'outline', 'ghost', 'destructive'] as const).map((variant) => (
            <AppButton
              key={variant}
              label={`${variant} (${pressedCount})`}
              onPress={() => setPressedCount((count) => count + 1)}
              testID={`catalog-button-${variant}`}
              variant={variant}
            />
          ))}
          <AppButton label="Loading" loading onPress={() => undefined} />
          <AppButton disabled label="Disabled" onPress={() => undefined} />
          <IconButton
            accessibilityLabel="Catalog favorite"
            icon={(color) => <MaterialIcons color={color} name="star" size={24} />}
            onPress={() => setPressedCount((count) => count + 1)}
            testID="catalog-icon-button"
          />
        </View>
      </SectionCard>
      <SectionCard title="Inputs and controls">
        <View style={styles.sectionBody}>
          <AppInput helperText="Visible helper text" label="Email" placeholder="bee@example.com" />
          <AppInput errorText="This field is required" label="Password" secureTextEntry />
          <AppSwitch
            accessibilityLabel="Catalog switch"
            onValueChange={setSwitchValue}
            testID="catalog-switch"
            value={switchValue}
          />
          <ProgressBar accessibilityLabel="Catalog progress" value={0.64} />
        </View>
      </SectionCard>
      <SectionCard title="Rows">
        <View style={styles.sectionBody}>
          <SettingsRow
            label="Open modal"
            onPress={() => setModalVisible(true)}
            showChevron
            testID="catalog-open-modal"
          />
          {['compact', 'regular', 'wide'].map((item) => (
            <SelectionRow
              key={item}
              label={item}
              onPress={() => setSelection(item)}
              selected={selection === item}
              testID={`catalog-selection-${item}`}
            />
          ))}
        </View>
      </SectionCard>
      <AppModal
        actions={
          <AppButton
            fullWidth={false}
            label="Done"
            onPress={() => setModalVisible(false)}
            testID="catalog-modal-done"
          />
        }
        onRequestClose={() => setModalVisible(false)}
        title="Catalog modal"
        visible={modalVisible}
      >
        <AppText>This modal is isolated from production side effects.</AppText>
      </AppModal>
    </CatalogShell>
  );
}

type StateName =
  | 'loading'
  | 'empty'
  | 'error'
  | 'offline'
  | 'home-ready'
  | 'home-tutorial'
  | 'settings-free'
  | 'settings-premium'
  | 'settings-permission-denied';

const STATE_NAMES: readonly StateName[] = [
  'loading',
  'empty',
  'error',
  'offline',
  'home-ready',
  'home-tutorial',
  'settings-free',
  'settings-premium',
  'settings-permission-denied',
];

export function StateCatalogScreen() {
  const [state, setState] = useState<StateName>('loading');
  const stateView =
    state === 'loading' ? (
      <LoadingState title="Loading vocabulary" />
    ) : state === 'empty' ? (
      <EmptyState message="Add a favorite to populate this state." title="No favorites" />
    ) : state === 'error' ? (
      <ErrorState
        message="A deterministic preview error."
        onRetry={() => setState('loading')}
        retryLabel="Retry"
        title="Could not load"
      />
    ) : state === 'offline' ? (
      <OfflineState cached message="Showing cached content." title="You are offline" />
    ) : state === 'home-ready' ? (
      <SectionCard title="Home · ready">
        <View style={styles.sectionBody}>
          <AppText variant="metric">A1 · 12/100 words</AppText>
          <ProgressBar accessibilityLabel="Home preview progress" value={0.12} />
          <AppText variant="screenTitle">Haus</AppText>
          <AppText color="textSecondary">House</AppText>
        </View>
      </SectionCard>
    ) : state === 'home-tutorial' ? (
      <SectionCard title="Home · tutorial">
        <View style={styles.sectionBody}>
          <AppText>Swipe right to mark this word as learned.</AppText>
          <SelectionRow label="Tutorial spotlight target" selected />
        </View>
      </SectionCard>
    ) : state === 'settings-free' ? (
      <SectionCard title="Settings · free">
        <SettingsRow label="Remove ads" value="Available" showChevron />
      </SectionCard>
    ) : state === 'settings-premium' ? (
      <SectionCard title="Settings · premium">
        <SettingsRow label="Ad-free active" value="Active" />
      </SectionCard>
    ) : (
      <SectionCard title="Settings · permission denied">
        <ErrorState
          message="Notifications remain disabled until system permission is granted."
          title="Permission required"
        />
      </SectionCard>
    );

  return (
    <CatalogShell
      description="Loading, empty, error/retry and offline/cached states without external writes."
      title="States"
    >
      <View style={styles.row}>
        {STATE_NAMES.map((name) => (
          <AppButton
            key={name}
            fullWidth={false}
            label={name}
            onPress={() => setState(name)}
            testID={`catalog-state-${name}`}
            variant={state === name ? 'primary' : 'outline'}
          />
        ))}
      </View>
      <Surface style={styles.statePreview}>{stateView}</Surface>
    </CatalogShell>
  );
}

function ThemePreview({ mode }: { mode: 'light' | 'dark' }) {
  const { colors, radii, spacing } = useTheme();
  const roles = [
    'background',
    'surface',
    'surfaceElevated',
    'surfaceMuted',
    'accent',
    'success',
    'warning',
    'danger',
    'focusRing',
  ] as const;

  return (
    <Surface
      style={[styles.themePreview, { padding: spacing.lg }]}
      testID={`catalog-theme-${mode}`}
    >
      <AppText variant="sectionTitle">{mode}</AppText>
      <View style={styles.swatches}>
        {roles.map((role) => (
          <View key={role} style={styles.swatchRow}>
            <View
              style={[styles.swatch, { backgroundColor: colors[role], borderRadius: radii.sm }]}
            />
            <AppText variant="caption">{role}</AppText>
          </View>
        ))}
      </View>
    </Surface>
  );
}

export function ThemeCatalogScreen() {
  return (
    <CatalogShell description="Both semantic theme contracts rendered side by side." title="Theme">
      <ThemeProvider forcedMode="light">
        <ThemePreview mode="light" />
      </ThemeProvider>
      <ThemeProvider forcedMode="dark">
        <ThemePreview mode="dark" />
      </ThemeProvider>
    </CatalogShell>
  );
}

export function ResponsiveCatalogScreen() {
  const layout = useResponsiveLayout();
  return (
    <CatalogShell
      description="Live dimensions update with orientation and size-class changes."
      title="Responsive"
    >
      <Surface style={styles.sectionBody}>
        <AppText>Width: {layout.width}</AppText>
        <AppText>Height: {layout.height}</AppText>
        <AppText>Orientation: {layout.orientation}</AppText>
        <AppText>Size class: {layout.sizeClass}</AppText>
        <AppText>Small height: {String(layout.isSmallHeight)}</AppText>
        <AppText>Content max width: {layout.contentMaxWidth}</AppText>
        <AppText>Horizontal gutter: {layout.horizontalGutter}</AppText>
      </Surface>
    </CatalogShell>
  );
}

export function AccessibilityCatalogScreen() {
  const [announced, setAnnounced] = useState(false);
  return (
    <CatalogShell
      description="Roles, labels, selected/disabled/busy states and minimum touch targets."
      title="Accessibility"
    >
      <IconButton
        accessibilityLabel="Announce accessible action"
        icon={(color) => <MaterialIcons color={color} name="record-voice-over" size={24} />}
        onPress={() => setAnnounced(true)}
        testID="catalog-accessibility-action"
      />
      <AppText accessibilityLiveRegion="polite">
        {announced ? 'Accessible action activated' : 'Activate the labeled icon action'}
      </AppText>
      <SelectionRow disabled label="Disabled selected row" selected />
      <AppButton label="Busy action" loading onPress={() => undefined} />
    </CatalogShell>
  );
}

export function MotionCatalogScreen() {
  const platformReducedMotion = useReducedMotion();
  const [manualReducedMotion, setManualReducedMotion] = useState(platformReducedMotion);
  return (
    <CatalogShell
      description="Platform reduced-motion status and a deterministic static preview override."
      title="Motion"
    >
      <AppText>Platform reduced motion: {String(platformReducedMotion)}</AppText>
      <AppSwitch
        accessibilityLabel="Use reduced motion preview"
        onValueChange={setManualReducedMotion}
        testID="catalog-motion-switch"
        value={manualReducedMotion}
      />
      <Surface style={styles.sectionBody}>
        <AppText variant="sectionTitle">
          {manualReducedMotion ? 'Static celebration' : 'Animated celebration'}
        </AppText>
      </Surface>
    </CatalogShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 20,
  },
  sectionBody: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statePreview: {
    minHeight: 260,
    overflow: 'hidden',
  },
  themePreview: {
    gap: 12,
  },
  swatches: {
    gap: 8,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 32,
    height: 32,
  },
});
