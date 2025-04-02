import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { CartProvider } from '../hooks/useCart';
import { WishlistProvider } from '../hooks/useWishlist';
import { ThemeProvider } from '../hooks/useTheme';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

// This component handles authentication routing logic
function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to the login screen if not authenticated and not already in auth group
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to the main app if authenticated but still in auth group
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthContextProvider>
          <CartProvider>
            <WishlistProvider>
              <StatusBar style="auto" />
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="product/[id]" options={{ title: 'Product Details' }} />
                <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
              </Stack>
            </WishlistProvider>
          </CartProvider>
        </AuthContextProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}