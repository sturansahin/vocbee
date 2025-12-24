const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow loading vocabulary files packaged as plain text assets.
// This avoids Metro having to parse/bundle huge JSON modules during development.
if (!config.resolver.assetExts.includes('txt')) {
  config.resolver.assetExts.push('txt');
}

module.exports = config;
