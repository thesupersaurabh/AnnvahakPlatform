import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Image,
  Modal
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { ChevronDown, Plus } from 'lucide-react-native';
import { api, endpoints } from '../../utils/api';
import { productService } from '../../services/productService';

// Define the product categories
const PRODUCT_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Poultry',
  'Meat',
  'Herbs',
  'Other'
];

// Define the unit types
const UNIT_TYPES = [
  'kg',
  'gram',
  'liter',
  'piece',
  'dozen',
  'bundle',
  'box'
];

// Helper function to convert to camelCase for display
const toCamelCase = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function CreateProduct() {
  const { colors } = useTheme();
  const { token } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState(UNIT_TYPES[0]);
  const [customUnit, setCustomUnit] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImage, setShowImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showCustomUnitInput, setShowCustomUnitInput] = useState(false);
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!price.trim()) {
      errors.price = 'Price is required';
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      errors.price = 'Price must be a positive number';
    }
    
    if (!stock.trim()) {
      errors.stock = 'Stock quantity is required';
    } else if (isNaN(Number(stock)) || Number(stock) < 0) {
      errors.stock = 'Stock must be a non-negative number';
    }
    
    if (imageUrl.trim() && !imageUrl.match(/^https?:\/\/.*\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i)) {
      errors.imageUrl = 'Image URL must be a valid image link';
    }
    
    if (showCustomCategoryInput && !customCategory.trim()) {
      errors.category = 'Custom category cannot be empty';
    }
    
    if (showCustomUnitInput && !customUnit.trim()) {
      errors.unit = 'Custom unit cannot be empty';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!token) {
      Alert.alert('Authentication Error', 'You need to be logged in to create a product');
      return;
    }
    
    setLoading(true);
    
    try {
      // Determine the final category value - custom or selected from list
      const finalCategory = showCustomCategoryInput ? customCategory : category;
      // Determine the final unit value - custom or selected from list
      const finalUnit = showCustomUnitInput ? customUnit : unit;
      
      // Create a proper object structure according to API documentation
      const productData = {
        name,
        description,
        category: finalCategory.toLowerCase(), // Convert category to lowercase for API
        price: Number(price),
        quantity: Number(stock),
        unit: finalUnit.toLowerCase(), // Convert unit to lowercase for API
        image_url: imageUrl.trim() || 'https://dummyimage.com/400x300/'
      };
      
      console.log('Submitting product with data:', productData);
      
      // Call the API directly as per documentation
      const response = await api.post(
        endpoints.products.create,
        productData,
        token
      );
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Product created successfully! Waiting for admin approval.',
          [
            { 
              text: 'View Products', 
              onPress: () => router.push('/(tabs)/products') 
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewImage = () => {
    if (imageUrl.trim()) {
      setShowImage(true);
    } else {
      Alert.alert('Error', 'Please enter an image URL first');
    }
  };
  
  const handleCustomCategorySelection = () => {
    setShowCustomCategoryInput(true);
    setShowCategoryModal(false);
  };
  
  const handleCustomUnitSelection = () => {
    setShowCustomUnitInput(true);
    setShowUnitModal(false);
  };

  const handleCustomCategoryChange = (text: string) => {
    setCustomCategory(text);
  };

  const handleCustomUnitChange = (text: string) => {
    setCustomUnit(text);
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Add New Product',
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontFamily: 'Inter_600SemiBold',
          },
        }} 
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Product Name</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: formErrors.name ? colors.error : colors.border
              }
            ]}
            placeholder="Enter product name"
            placeholderTextColor={colors.secondary}
            value={name}
            onChangeText={setName}
          />
          {formErrors.name && (
            <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.name}</Text>
          )}
          
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[
              styles.textArea, 
              { 
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: formErrors.description ? colors.error : colors.border
              }
            ]}
            placeholder="Describe your product..."
            placeholderTextColor={colors.secondary}
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
          {formErrors.description && (
            <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.description}</Text>
          )}
          
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={[styles.label, { color: colors.text }]}>Price (₹)</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: formErrors.price ? colors.error : colors.border
                  }
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.secondary}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
              {formErrors.price && (
                <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.price}</Text>
              )}
            </View>
            
            <View style={styles.column}>
              <Text style={[styles.label, { color: colors.text }]}>Stock Quantity</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: formErrors.stock ? colors.error : colors.border
                  }
                ]}
                placeholder="0"
                placeholderTextColor={colors.secondary}
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
              />
              {formErrors.stock && (
                <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.stock}</Text>
              )}
            </View>
          </View>
          
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          {showCustomCategoryInput ? (
            <View>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: formErrors.category ? colors.error : colors.border
                  }
                ]}
                placeholder="Enter custom category"
                placeholderTextColor={colors.secondary}
                value={customCategory}
                onChangeText={handleCustomCategoryChange}
              />
              <TouchableOpacity 
                style={styles.switchButton} 
                onPress={() => setShowCustomCategoryInput(false)}
              >
                <Text style={{ color: colors.primary }}>Use standard category</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={[styles.dropdownText, { color: colors.text }]}>{toCamelCase(category)}</Text>
                <ChevronDown size={20} color={colors.secondary} />
              </TouchableOpacity>
            </>
          )}
          {formErrors.category && (
            <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.category}</Text>
          )}
          
          <Modal
            visible={showCategoryModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
                
                <ScrollView style={styles.modalScrollView}>
                  {PRODUCT_CATEGORIES.map((item) => (
                    <TouchableOpacity 
                      key={item}
                      style={[
                        styles.modalItem,
                        category === item && { backgroundColor: `${colors.primary}20` }
                      ]}
                      onPress={() => {
                        setCategory(item);
                        setShowCategoryModal(false);
                      }}
                    >
                      <Text 
                        style={[
                          styles.modalItemText, 
                          { color: colors.text },
                          category === item && { color: colors.primary, fontFamily: 'Inter_600SemiBold' }
                        ]}
                      >
                        {toCamelCase(item)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Custom category option */}
                  <TouchableOpacity 
                    style={[styles.modalItem, styles.customOptionItem]}
                    onPress={handleCustomCategorySelection}
                  >
                    <Plus size={16} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text 
                      style={[
                        styles.modalItemText,
                        { color: colors.primary, fontFamily: 'Inter_600SemiBold' }
                      ]}
                    >
                      Add Custom Category
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
                
                <TouchableOpacity 
                  style={[styles.modalCloseButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowCategoryModal(false)}
                >
                  <Text style={[styles.modalCloseText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          
          <Text style={[styles.label, { color: colors.text }]}>Unit of Measure</Text>
          {showCustomUnitInput ? (
            <View>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: formErrors.unit ? colors.error : colors.border
                  }
                ]}
                placeholder="Enter custom unit"
                placeholderTextColor={colors.secondary}
                value={customUnit}
                onChangeText={handleCustomUnitChange}
              />
              <TouchableOpacity 
                style={styles.switchButton} 
                onPress={() => setShowCustomUnitInput(false)}
              >
                <Text style={{ color: colors.primary }}>Use standard unit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowUnitModal(true)}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>{toCamelCase(unit)}</Text>
              <ChevronDown size={20} color={colors.secondary} />
            </TouchableOpacity>
          )}
          {formErrors.unit && (
            <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.unit}</Text>
          )}
          
          <Modal
            visible={showUnitModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowUnitModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Unit</Text>
                
                <ScrollView style={styles.modalScrollView}>
                  {UNIT_TYPES.map((item) => (
                    <TouchableOpacity 
                      key={item}
                      style={[
                        styles.modalItem,
                        unit === item && { backgroundColor: `${colors.primary}20` }
                      ]}
                      onPress={() => {
                        setUnit(item);
                        setShowUnitModal(false);
                      }}
                    >
                      <Text 
                        style={[
                          styles.modalItemText, 
                          { color: colors.text },
                          unit === item && { color: colors.primary, fontFamily: 'Inter_600SemiBold' }
                        ]}
                      >
                        {toCamelCase(item)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Custom unit option */}
                  <TouchableOpacity 
                    style={[styles.modalItem, styles.customOptionItem]}
                    onPress={handleCustomUnitSelection}
                  >
                    <Plus size={16} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text 
                      style={[
                        styles.modalItemText,
                        { color: colors.primary, fontFamily: 'Inter_600SemiBold' }
                      ]}
                    >
                      Add Custom Unit
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
                
                <TouchableOpacity 
                  style={[styles.modalCloseButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowUnitModal(false)}
                >
                  <Text style={[styles.modalCloseText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          
          <Text style={[styles.label, { color: colors.text }]}>Image URL</Text>
          <View style={styles.imageUrlContainer}>
            <TextInput
              style={[
                styles.imageUrlInput, 
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: formErrors.imageUrl ? colors.error : colors.border
                }
              ]}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={colors.secondary}
              value={imageUrl}
              onChangeText={setImageUrl}
            />
            <TouchableOpacity 
              style={[styles.previewButton, { backgroundColor: colors.primary }]}
              onPress={handlePreviewImage}
            >
              <Text style={styles.previewButtonText}>Preview</Text>
            </TouchableOpacity>
          </View>
          {formErrors.imageUrl && (
            <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.imageUrl}</Text>
          )}
          
          {showImage && imageUrl && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.imagePreview}
                resizeMode="cover"
                onError={() => {
                  Alert.alert('Error', 'Failed to load image. Please check the URL.');
                  setShowImage(false);
                }}
              />
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Create Product</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScrollView: {
    marginBottom: 20,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  customOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 16,
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  modalCloseButton: {
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  imageUrlContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  imageUrlInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginRight: 8,
  },
  previewButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  previewButtonText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  imagePreviewContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    marginBottom: 8,
  },
  submitButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  switchButton: {
    alignSelf: 'flex-start',
    marginVertical: 8,
    marginBottom: 16,
  }
}); 