import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useWishlist, WishlistItem } from '../../hooks/useWishlist';
import { useCart } from '../../hooks/useCart';
import { Heart, ShoppingCart, X, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useState, useCallback } from 'react';

export default function Wishlist() {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // We don't need to fetch anything since wishlist is stored locally,
    // but we'll simulate a refresh for better UX
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const addItemToCart = (item: WishlistItem) => {
    addToCart({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      unit: item.unit,
      imageUrl: item.imageUrl,
      farmerId: item.farmerId,
      farmerName: item.farmerName
    });
    
    removeFromWishlist(item.id);
  };

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1558350315-8aa00e8e4590' }}
          style={styles.emptyImage}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Your wishlist is empty</Text>
        <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>Save items you like for later</Text>
        <TouchableOpacity 
          style={[styles.shopButton, { backgroundColor: colors.primary }]} 
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.shopButtonText}>Explore Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Wishlist</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <RefreshCw size={22} color={colors.text} />
            )}
          </TouchableOpacity>
          <Heart size={24} color="#FF4D4F" />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={[styles.wishlistItem, { backgroundColor: colors.card }]}>
            <TouchableOpacity 
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.itemContent}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemPrice, { color: colors.text }]}>₹{item.price}/{item.unit}</Text>
                <Text style={[styles.farmerName, { color: colors.secondary }]}>Sold by: {item.farmerName}</Text>
              </View>
            </TouchableOpacity>
            
            <View style={[styles.itemActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.actionButton, { borderRightColor: colors.border }]}
                onPress={() => removeFromWishlist(item.id)}
              >
                <X size={18} color="#FF4D4F" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.addToCartButton, { backgroundColor: colors.primary }]}
                onPress={() => addItemToCart(item)}
              >
                <ShoppingCart size={16} color="#fff" />
                <Text style={styles.addToCartText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
  },
  wishlistItem: {
    margin: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    padding: 15,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  farmerName: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  itemActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  addToCartButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 100,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 25,
  },
  shopButton: {
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
}); 