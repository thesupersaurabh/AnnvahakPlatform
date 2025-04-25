import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ThemeProvider } from '../hooks/useTheme';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible
SplashScreen.preventAutoHideAsync();

// This component handles authentication routing logic
function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading auth state
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    // If on the root route, allow access
    if (!segments[0]) {
      return;
    }
    
    // If not authenticated but trying to access a protected route, redirect to login
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } 
    // If authenticated but trying to access auth routes, redirect to main app
    else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/products');
    }
  }, [isAuthenticated, segments, isLoading]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  // Log information about cart and wishlist removal
  useEffect(() => {
    console.log('INFO: Cart and Wishlist functionality have been removed from the AnnVahak Seller app as they are not needed for farmer users.');
    console.log('INFO: Products tab is now renamed to Home instead of having a separate dashboard.');
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontError) console.error('Font loading error:', fontError);
  }, [fontError]);

  // Return null during loading to avoid showing anything beneath splash screen
  if (!fontsLoaded && !fontError) {
    return null;
  }
  
  return (
    <View style={{ flex: 1, opacity: 1 }} onLayout={onLayoutRootView}>
      <ThemeProvider>
        <AuthProvider>
          <AuthContextProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="product/[id]" options={{ title: 'Product Details', headerShown: true }} />
              <Stack.Screen name="product/create" options={{ title: 'Add Product', headerShown: true }} />
              <Stack.Screen name="product/edit/[id]" options={{ title: 'Edit Product', headerShown: true }} />
              <Stack.Screen name="chat/[id]" options={{ title: 'Chat', headerShown: true }} />
              <Stack.Screen name="order/[id]" options={{ title: 'Order Details', headerShown: true }} />
            </Stack>
          </AuthContextProvider>
        </AuthProvider>
      </ThemeProvider>
    </View>
  );
}