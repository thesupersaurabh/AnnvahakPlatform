import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { ChevronLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, endpoints } from '../../../utils/api';

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  quantity: string;
  unit: string;
  image_url: string;
  is_available: boolean;
}

const UNIT_OPTIONS = ['kg', 'g', 'lb', 'pcs', 'bundle', 'ton', 'box'];
const CATEGORY_OPTIONS = ['Vegetables', 'Fruits', 'Dairy', 'Grains', 'Meat', 'Poultry', 'Seafood', 'Other'];

// Helper function to convert to camelCase for display
const toCamelCase = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, isAuthenticated } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    unit: 'kg',
    image_url: '',
    is_available: true
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });
  
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);
  
  // Fetch product data
  useEffect(() => {
    if (isAuthenticated && token && id) {
      fetchProductData();
    }
  }, [isAuthenticated, token, id]);
  
  const fetchProductData = async () => {
    try {
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in to view this product');
        router.replace('/(auth)/login');
        return;
      }

      const response = await api.get<{ product: any }>(
        endpoints.products.details(id as string),
        token
      );
      
      if (!response.success || !response.data.product) {
        throw new Error('Failed to fetch product');
      }
      
      const product = response.data.product;
      
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price.toString(),
        quantity: product.quantity.toString(),
        unit: product.unit,
        image_url: product.image_url || '',
        is_available: product.is_available
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product information');
      router.back();
    } finally {
      setInitialLoading(false);
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be a valid positive number';
    }
    
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a valid positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const pickImage = async () => {
    try {
      // Show action sheet to choose between camera, gallery, or URL
      Alert.alert(
        "Add Image",
        "Choose an option",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Take Photo",
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
                return;
              }
              
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });
              
              if (!result.canceled) {
                setFormData({ ...formData, image_url: result.assets[0].uri });
              }
            }
          },
          {
            text: "Choose from Gallery",
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
                return;
              }
              
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });
              
              if (!result.canceled) {
                setFormData({ ...formData, image_url: result.assets[0].uri });
              }
            }
          },
          {
            text: "Enter Image URL",
            onPress: () => {
              Alert.prompt(
                "Enter Image URL",
                "Paste a direct URL to an image",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  {
                    text: "OK",
                    onPress: (url: string | undefined) => {
                      if (url && url.trim()) {
                        setFormData({ ...formData, image_url: url.trim() });
                      }
                    }
                  }
                ],
                "plain-text"
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'An error occurred while selecting an image');
    }
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!token) {
      Alert.alert('Authentication Error', 'Please log in to update this product');
      router.replace('/(auth)/login');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Check if we need to upload the image first (if it's a local file)
      let finalImageUrl = formData.image_url;
      
      // If image_url starts with 'file://' or similar local path, it's a local file
      if (formData.image_url.startsWith('file:') || 
          formData.image_url.includes('ExperienceData') || 
          formData.image_url.includes('ImagePicker')) {
        
        // For demo, we'll replace it with a random image URL from the internet
        finalImageUrl = `https://source.unsplash.com/random/800x600?agricultural,farm,crop&sig=${Date.now()}`;
        
        // Show a message to the user
        Alert.alert(
          'Image Conversion',
          'Local images are being converted to web URLs for demonstration purposes.'
        );
      }
      
      // Create product data according to API documentation
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category.toLowerCase(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        unit: formData.unit.toLowerCase(),
        is_available: formData.is_available,
        image_url: finalImageUrl
      };

      console.log('Updating product with data:', productData);

      // Send request to update product using our API utilities
      const response = await api.put(
        endpoints.products.update(id as string),
        productData,
        token
      );

      if (response.success) {
        // Success, redirect to product details page
        Alert.alert(
          'Success',
          'Product updated successfully!',
          [
            {
              text: 'View Product',
              onPress: () => router.replace(`/product/${id}`)
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!fontsLoaded || initialLoading) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centerContainer]}>
        <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#000"} />
        <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>Loading product...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Edit Product</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.formContainer}>
          {/* Product Image */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              style={[styles.imagePicker, isDarkMode && styles.darkImagePicker]}
              onPress={pickImage}
              disabled={imageUploading}
            >
              {formData.image_url ? (
                <Image
                  source={{ uri: formData.image_url }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePickerContent}>
                  <Camera size={32} color={isDarkMode ? '#aaa' : '#666'} />
                  <Text style={[styles.imagePickerText, isDarkMode && { color: '#aaa' }]}>
                    Add Product Image
                  </Text>
                </View>
              )}
              
              {imageUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Product Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.darkText]}>Product Name *</Text>
            <TextInput
              style={[
                styles.input,
                isDarkMode && styles.darkInput,
                errors.name && styles.inputError
              ]}
              placeholder="Enter product name"
              placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>
          
          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.darkText]}>Description *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                isDarkMode && styles.darkInput,
                errors.description && styles.inputError
              ]}
              placeholder="Enter product description"
              placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>
          
          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.darkText]}>Category *</Text>
            <TouchableOpacity
              style={[
                styles.input,
                isDarkMode && styles.darkInput,
                errors.category && styles.inputError
              ]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={[
                formData.category ? styles.pickerValueText : styles.pickerPlaceholder,
                isDarkMode && (formData.category ? styles.darkText : { color: '#666' })
              ]}>
                {formData.category ? toCamelCase(formData.category) : "Select category"}
              </Text>
            </TouchableOpacity>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            
            {showCategoryPicker && (
              <View style={[styles.pickerItems, isDarkMode && styles.darkPickerItems]}>
                {CATEGORY_OPTIONS.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.pickerItem,
                      formData.category.toLowerCase() === category.toLowerCase() && styles.selectedPickerItem,
                      isDarkMode && formData.category.toLowerCase() === category.toLowerCase() && { backgroundColor: '#1e3a29' }
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, category: category });
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        formData.category.toLowerCase() === category.toLowerCase() && styles.selectedPickerItemText,
                        isDarkMode && styles.darkPickerItemText,
                        isDarkMode && formData.category.toLowerCase() === category.toLowerCase() && { color: '#6abf69' }
                      ]}
                    >
                      {toCamelCase(category)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          {/* Price */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.darkText]}>Price (₹) *</Text>
            <TextInput
              style={[
                styles.input,
                isDarkMode && styles.darkInput,
                errors.price && styles.inputError
              ]}
              placeholder="Enter price"
              placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="decimal-pad"
            />
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>
          
          {/* Quantity and Unit */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, isDarkMode && styles.darkText]}>Quantity *</Text>
              <TextInput
                style={[
                  styles.input,
                  isDarkMode && styles.darkInput,
                  errors.quantity && styles.inputError
                ]}
                placeholder="Enter quantity"
                placeholderTextColor={isDarkMode ? '#666' : '#aaa'}
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                keyboardType="decimal-pad"
              />
              {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
            </View>
            
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, isDarkMode && styles.darkText]}>Unit of Measure *</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  isDarkMode && styles.darkInput,
                  errors.unit && styles.inputError
                ]}
                onPress={() => setShowUnitPicker(!showUnitPicker)}
              >
                <Text style={[
                  formData.unit ? styles.pickerValueText : styles.pickerPlaceholder,
                  isDarkMode && (formData.unit ? styles.darkText : { color: '#666' })
                ]}>
                  {formData.unit ? toCamelCase(formData.unit) : "Select unit"}
                </Text>
              </TouchableOpacity>
              {errors.unit && <Text style={styles.errorText}>{errors.unit}</Text>}
              
              {showUnitPicker && (
                <View style={[styles.pickerItems, isDarkMode && styles.darkPickerItems]}>
                  {UNIT_OPTIONS.map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.pickerItem,
                        formData.unit.toLowerCase() === unit.toLowerCase() && styles.selectedPickerItem,
                        isDarkMode && formData.unit.toLowerCase() === unit.toLowerCase() && { backgroundColor: '#1e3a29' }
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, unit: unit });
                        setShowUnitPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          formData.unit.toLowerCase() === unit.toLowerCase() && styles.selectedPickerItemText,
                          isDarkMode && styles.darkPickerItemText,
                          isDarkMode && formData.unit.toLowerCase() === unit.toLowerCase() && { color: '#6abf69' }
                        ]}
                      >
                        {toCamelCase(unit)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          
          {/* Available Switch */}
          <View style={styles.switchContainer}>
            <Text style={[styles.label, isDarkMode && styles.darkText]}>Available for Purchase</Text>
            <Switch
              value={formData.is_available}
              onValueChange={(value) => setFormData({ ...formData, is_available: value })}
              trackColor={{ false: '#767577', true: '#4caf50' }}
              thumbColor={formData.is_available ? '#fff' : '#f4f3f4'}
            />
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Update Product</Text>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.noteText, isDarkMode && { color: '#aaa' }]}>
            * If you make significant changes, your product may require re-approval.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  darkHeader: {
    backgroundColor: '#1e1e1e',
    borderBottomColor: '#2c2c2c',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  formContainer: {
    padding: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePicker: {
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkImagePicker: {
    backgroundColor: '#2c2c2c',
    borderColor: '#444',
  },
  imagePickerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  darkInput: {
    backgroundColor: '#2c2c2c',
    borderColor: '#444',
    color: '#fff',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#ff4d4f',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  pickerItems: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  darkPickerItems: {
    backgroundColor: '#2c2c2c',
    borderColor: '#444',
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  darkPickerItem: {
    borderBottomColor: '#444',
  },
  selectedPickerItem: {
    backgroundColor: '#e8f5e9',
  },
  pickerItemText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  darkPickerItemText: {
    color: '#fff',
  },
  selectedPickerItemText: {
    color: '#4caf50',
    fontFamily: 'Inter_600SemiBold',
  },
  pickerValueText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#aaa',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
}); 