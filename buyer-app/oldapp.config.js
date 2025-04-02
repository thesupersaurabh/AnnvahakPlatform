module.exports = {
  name: "Annvahak",
  slug: "annvahak-buyer",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  jsEngine: "hermes",
  ios: {
    supportsTablet: true,
    jsEngine: "hermes"
  },
  android: {
    package: "com.annvahakbuyer",
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#ffffff"
    },
    jsEngine: "hermes",
    enableProguardInReleaseBuilds: true,
    enableShrinkResources: true,
    extractNativeLibs: false
  },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
          minSdkVersion: 24,      
          targetSdkVersion: 34,
          enableProguardInReleaseBuilds: true,
          enableShrinkResources: true,
          useLegacyPackaging: false
        },
        ios: {
          deploymentTarget: "15.1"
        }
      }
    ]
  ],
  experiments: {
    typedRoutes: true,
    tsconfigPaths: true
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: "665a9fe4-90a6-4549-ba2b-35006ace24ef"
    }
  }
};
