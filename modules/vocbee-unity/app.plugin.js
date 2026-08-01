const { withGradleProperties } = require('expo/config-plugins');

module.exports = (config) =>
  withGradleProperties(config, (next) => {
    for (const [key, value] of Object.entries({
      minSdkVersion: '25',
      reactNativeArchitectures: 'arm64-v8a',
    })) {
      const existing = next.modResults.find((item) => item.type === 'property' && item.key === key);
      if (existing) existing.value = value;
      else next.modResults.push({ type: 'property', key, value });
    }
    return next;
  });
