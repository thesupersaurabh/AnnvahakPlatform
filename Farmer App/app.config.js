module.exports = {
  name: "AnnVahak Seller",
  slug: "annvahakseller",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  owner: "thesaurabh",
  splash: {
    image: "./assets/splash/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: {
    supportsTablet: true,
    splash: {
      image: "./assets/splash/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    }
  },
  android: {
    package: "com.annvahak.seller",
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#ffffff"
    },
    splash: {
      image: "./assets/splash/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    }
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
          targetSdkVersion: 34
        }
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: "fa589723-813b-47a6-8c4f-fe14699bd3b5"
    }
  }
};
