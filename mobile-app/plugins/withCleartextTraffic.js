const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/**
 * Ensures android:usesCleartextTraffic="true" is set on <application>
 * so standalone Android APKs can communicate with local HTTP development servers.
 */
module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.$['android:usesCleartextTraffic'] = 'true';
    return cfg;
  });
};
