import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Home, ShoppingBag, MessageSquare, User, ShoppingCart, Heart } from 'lucide-react-native';
import { useCart } from '../../hooks/useCart';
import { useTheme } from '../../hooks/useTheme';

export default function TabsLayout() {
  const { isDarkMode, colors } = useTheme();
  const { totalItems } = useCart();
  
  const tabIconColor = isDarkMode ? '#888' : '#666';
  const tabActiveIconColor = isDarkMode ? '#fff' : '#1a1a1a';
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabActiveIconColor,
        tabBarInactiveTintColor: tabIconColor,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        },
        tabBarItemStyle: {
          padding: 5,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 12,
          marginBottom: 5,
          fontWeight: '600',
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color }) => <Heart size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <ShoppingCart size={22} color={color} />,
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: { 
            backgroundColor: isDarkMode ? '#ff4545' : colors.primary,
            color: '#fff',
            fontSize: 10,
          },
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <ShoppingBag size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}