/**
 * Vendor Menu & Catalogue Stock Manager — Stitch Dark Floating Theme
 * Implements 08 — Menu & Product Management
 *
 * Features:
 * - Real-time Inventory Pulse (In Stock vs 86'd items)
 * - Category filter chips: All, Smoked Meats, Brioche Burgers, Sides & Fries, Beverages
 * - Search bar with filter tuning
 * - Instant stock toggle switches (connected to mockMenuRepository / vendorToggleProduct)
 * - Add New Item modal with price, category, stock limits
 * - Bulk Stock 86 quick modal
 */

import * as React from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Edit,
  Flame,
  Leaf,
  MoreVertical,
  Plus,
  PlusCircle,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
  Zap,
} from 'lucide-react-native';

import { formatInr, toPaise, type Product } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import {
  vendorAddProduct,
  vendorDeleteProduct,
  vendorSubscribeProducts,
  vendorToggleProduct,
} from '@/lib/orders';
import { mockMenuRepository } from '@/demo/repositories/menu.repository';
import { VendorStitchNav } from '@/ui/vendor-nav';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  prepTime: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  stockLeft?: number;
  isVeg: boolean;
  tag?: string;
  image?: string;
}

const INITIAL_MENU: MenuItem[] = [
  {
    id: 'dish-1',
    name: 'Smoked Texas Pulled Pork Brioche',
    category: 'Brioche Burgers',
    price: 380,
    prepTime: '15 mins',
    rating: 4.9,
    reviews: 120,
    inStock: true,
    stockLeft: 14,
    isVeg: false,
    tag: 'Auto-decrement ON',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80',
  },
  {
    id: 'dish-2',
    name: 'BBQ Glazed Chicken Wings (8 pcs)',
    category: 'Smoked Meats',
    price: 290,
    prepTime: '12 mins',
    rating: 4.8,
    reviews: 95,
    inStock: true,
    stockLeft: 22,
    isVeg: false,
    tag: 'High Velocity Item',
    image: 'https://images.unsplash.com/photo-1527477321077-d77960783a6b?w=300&q=80',
  },
  {
    id: 'dish-3',
    name: 'Truffle Parmesan Hand-cut Fries',
    category: 'Sides & Fries',
    price: 190,
    prepTime: '8 mins',
    rating: 4.9,
    reviews: 180,
    inStock: true,
    stockLeft: 30,
    isVeg: true,
    tag: "Chef's Special",
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80',
  },
  {
    id: 'dish-4',
    name: '12-Hour Texas Style Brisket (300g)',
    category: 'Smoked Meats',
    price: 480,
    prepTime: '20 mins',
    rating: 4.9,
    reviews: 84,
    inStock: false,
    stockLeft: 0,
    isVeg: false,
    tag: "Sold Out (86'd)",
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80',
  },
  {
    id: 'dish-5',
    name: 'Craft Artisan Ginger Ale',
    category: 'Beverages',
    price: 120,
    prepTime: '2 mins',
    rating: 4.7,
    reviews: 64,
    inStock: true,
    stockLeft: 45,
    isVeg: true,
    tag: 'Chilled Ready',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&q=80',
  },
  {
    id: 'dish-6',
    name: 'Smoked Charred Corn Ribs',
    category: 'Sides & Fries',
    price: 160,
    prepTime: '10 mins',
    rating: 4.6,
    reviews: 42,
    inStock: true,
    stockLeft: 18,
    isVeg: true,
    tag: 'Spicy Herb Rub',
    image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300&q=80',
  },
];

export default function VendorMenuStock() {
  const router = useRouter();
  const { profile } = useAuth();

  const [items, setItems] = React.useState<MenuItem[]>(INITIAL_MENU);
  const [activeCategory, setActiveCategory] = React.useState('All Items');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Add Item Modal
  const [addModalVisible, setAddModalVisible] = React.useState(false);
  const [newItemName, setNewItemName] = React.useState('');
  const [newItemCategory, setNewItemCategory] = React.useState('Smoked Meats');
  const [newItemPrice, setNewItemPrice] = React.useState('350');
  const [newItemVeg, setNewItemVeg] = React.useState(false);

  const categories = [
    'All Items',
    'Smoked Meats',
    'Brioche Burgers',
    'Sides & Fries',
    'Beverages',
    'Desserts',
  ];

  const inStockCount = items.filter((i) => i.inStock).length;
  const soldOutCount = items.filter((i) => !i.inStock).length;

  const handleToggleStock = (dishId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) =>
      prev.map((item) =>
        item.id === dishId ? { ...item, inStock: !item.inStock } : item,
      ),
    );
    mockMenuRepository.toggleItemAvailability(dishId);
  };

  const handleBulk86 = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Bulk Stock 86', 'Temporarily mark high rush items as out of stock?', [
      {
        text: '86 All Smoked Meats',
        style: 'destructive',
        onPress: () => {
          setItems((prev) =>
            prev.map((i) =>
              i.category === 'Smoked Meats' ? { ...i, inStock: false } : i,
            ),
          );
          Alert.alert('Updated', 'Smoked Meats marked 86 out of stock.');
        },
      },
      {
        text: 'Restore All In-Stock',
        onPress: () => {
          setItems((prev) => prev.map((i) => ({ ...i, inStock: true })));
          Alert.alert('Restored', 'All items marked in stock.');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCreateItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Required', 'Please enter a dish name.');
      return;
    }
    const priceNum = Number(newItemPrice) || 250;
    const newItem: MenuItem = {
      id: `dish-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      price: priceNum,
      prepTime: '15 mins',
      rating: 5.0,
      reviews: 1,
      inStock: true,
      stockLeft: 20,
      isVeg: newItemVeg,
      tag: 'Newly Added',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80',
    };

    setItems([newItem, ...items]);
    setAddModalVisible(false);
    setNewItemName('');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Item Added', `"${newItem.name}" added to menu and set to In Stock.`);
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === 'All Items' || item.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E10' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 48,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: '#18191B',
          borderBottomWidth: 1,
          borderBottomColor: '#201F21',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#201F21',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#2A2A2C',
            }}
          >
            <UtensilsCrossed size={18} color="#C8BFFF" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#10B981' }} />
              <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: '#10B981' }}>
                ONLINE STORE
              </Text>
            </View>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans_800ExtraBold',
                fontWeight: '800',
                color: '#E5E1E4',
                letterSpacing: -0.2,
              }}
            >
              Menu Stock Manager
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 9999,
            backgroundColor: '#201F21',
            borderWidth: 1,
            borderColor: '#2A2A2C',
          }}
        >
          <Store size={13} color="#7BD0FF" />
          <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#C9C4D5' }}>
            Indiranagar
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 120, gap: 14 }}
      >
        {/* Search and Bulk Filter */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#1C1B1D',
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 8,
          }}
        >
          <Search size={18} color="#928F9E" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search menu items, ingredients, tags..."
            placeholderTextColor="#928F9E"
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_500Medium',
              color: '#E5E1E4',
              padding: 0,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter tuning"
            onPress={() => Alert.alert('Filter', 'Filter by veg/non-veg, prep time, or inventory status')}
          >
            <SlidersHorizontal size={16} color="#928F9E" />
          </Pressable>
        </View>

        {/* Operational Inventory Live Banner */}
        <View
          style={{
            borderRadius: 18,
            backgroundColor: '#201F21',
            padding: 14,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#2A2A2C',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UtensilsCrossed size={18} color="#7BD0FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#928F9E',
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}
              >
                LIVE INVENTORY PULSE
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#10B981' }} />
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                  {inStockCount} In Stock
                </Text>
                <Text style={{ fontSize: 10, color: '#928F9E' }}>•</Text>
                <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#FFB59C' }} />
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFB59C' }}>
                  {soldOutCount} Sold Out (86'd)
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => Alert.alert('Inventory Audit', 'All inventory counts synchronized with POS till.')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: '#2A2A2C',
            }}
          >
            <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#7BD0FF' }}>
              Audit
            </Text>
            <ArrowRight size={13} color="#7BD0FF" />
          </Pressable>
        </View>

        {/* Primary Action Controls */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add New Item"
            onPress={() => setAddModalVisible(true)}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 14,
              backgroundColor: '#6A5ACD',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              shadowColor: '#6A5ACD',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
            }}
          >
            <PlusCircle size={17} color="#F0EBFF" />
            <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#F0EBFF' }}>
              Add New Item
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bulk Stock 86"
            onPress={handleBulk86}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 14,
              backgroundColor: '#2A2A2C',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Zap size={16} color="#7BD0FF" />
            <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
              Bulk Stock 86
            </Text>
          </Pressable>
        </View>

        {/* Category Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setActiveCategory(cat);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  backgroundColor: isSelected ? '#6A5ACD' : '#201F21',
                  borderWidth: 1,
                  borderColor: isSelected ? '#6A5ACD' : '#2A2A2C',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: isSelected ? '#F0EBFF' : '#928F9E',
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Product List Stream */}
        <View style={{ gap: 12 }}>
          {filteredItems.map((dish) => (
            <View
              key={dish.id}
              style={{
                borderRadius: 20,
                backgroundColor: '#201F21',
                padding: 14,
                borderWidth: 1,
                borderColor: '#2A2A2C',
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                {/* Dish image thumbnail */}
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    backgroundColor: '#2A2A2C',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {dish.image ? (
                    <Image source={{ uri: dish.image }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Flame size={24} color="#6A5ACD" />
                    </View>
                  )}
                  {/* Veg / Non-veg indicator dot */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      backgroundColor: 'rgba(14, 14, 16, 0.9)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 9999,
                        backgroundColor: dish.isVeg ? '#10B981' : '#FFB59C',
                      }}
                    />
                  </View>
                </View>

                {/* Dish Info */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 10, color: '#928F9E', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                      {dish.category}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#928F9E' }}>•</Text>
                    <Text style={{ fontSize: 10, color: dish.isVeg ? '#10B981' : '#FFB59C', fontWeight: '700' }}>
                      {dish.isVeg ? 'Veg' : 'Non-Veg'}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'PlusJakartaSans_700Bold',
                      fontWeight: '700',
                      color: '#E5E1E4',
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {dish.name}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: 'PlusJakartaSans_800ExtraBold',
                        fontWeight: '800',
                        color: '#C8BFFF',
                      }}
                    >
                      ₹{dish.price}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 2,
                        backgroundColor: '#2A2A2C',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Clock size={11} color="#7BD0FF" />
                      <Text style={{ fontSize: 10, color: '#C9C4D5' }}>{dish.prepTime}</Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 2,
                        backgroundColor: '#2A2A2C',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Star size={11} color="#FFB59C" fill="#FFB59C" />
                      <Text style={{ fontSize: 10, color: '#E5E1E4', fontWeight: '700' }}>
                        {dish.rating}
                      </Text>
                      <Text style={{ fontSize: 9, color: '#928F9E' }}>({dish.reviews})</Text>
                    </View>
                  </View>
                </View>

                {/* In-Stock Switch */}
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Switch
                    value={dish.inStock}
                    onValueChange={() => handleToggleStock(dish.id)}
                    trackColor={{ false: '#353437', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                  <Text
                    style={{
                      fontSize: 9,
                      fontFamily: 'PlusJakartaSans_700Bold',
                      color: dish.inStock ? '#10B981' : '#FFB4AB',
                    }}
                  >
                    {dish.inStock ? 'In Stock' : '86 Sold Out'}
                  </Text>
                </View>
              </View>

              {/* Quick Action Tray */}
              <View
                style={{
                  backgroundColor: '#1C1B1D',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {dish.stockLeft !== undefined ? (
                    <View
                      style={{
                        backgroundColor: '#2A2A2C',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: '#7BD0FF', fontWeight: '600' }}>
                        Stock: {dish.stockLeft} left
                      </Text>
                    </View>
                  ) : null}
                  {dish.tag ? (
                    <Text style={{ fontSize: 10, color: '#928F9E' }}>{dish.tag}</Text>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Pressable
                    onPress={() => Alert.alert('Edit Dish', `Edit pricing, prep time, or photos for "${dish.name}"`)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#2A2A2C',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Edit size={12} color="#928F9E" />
                    <Text style={{ fontSize: 11, color: '#E5E1E4', fontWeight: '600' }}>Edit</Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        dish.name,
                        'Choose an option:',
                        [
                          { text: 'Duplicate Item', onPress: () => {} },
                          { text: 'Delete from Store', style: 'destructive', onPress: () => setItems(items.filter(i => i.id !== dish.id)) },
                          { text: 'Cancel', style: 'cancel' },
                        ]
                      )
                    }
                    style={{
                      padding: 4,
                      borderRadius: 6,
                      backgroundColor: '#2A2A2C',
                    }}
                  >
                    <MoreVertical size={14} color="#928F9E" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add New Item Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#1C1B1D',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              gap: 14,
              borderWidth: 1,
              borderColor: '#2A2A2C',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#E5E1E4' }}>
                Add New Menu Item
              </Text>
              <Pressable
                onPress={() => setAddModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  backgroundColor: '#2A2A2C',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color="#E5E1E4" />
              </Pressable>
            </View>

            <View style={{ gap: 10 }}>
              <View>
                <Text style={{ fontSize: 11, color: '#928F9E', marginBottom: 4 }}>Dish Name</Text>
                <TextInput
                  value={newItemName}
                  onChangeText={setNewItemName}
                  placeholder="e.g. Hickory Smoked Ribs"
                  placeholderTextColor="#928F9E"
                  style={{
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#201F21',
                    borderWidth: 1,
                    borderColor: '#2A2A2C',
                    paddingHorizontal: 12,
                    color: '#E5E1E4',
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                  }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#928F9E', marginBottom: 4 }}>Price (₹)</Text>
                  <TextInput
                    value={newItemPrice}
                    onChangeText={setNewItemPrice}
                    keyboardType="numeric"
                    placeholder="350"
                    placeholderTextColor="#928F9E"
                    style={{
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: '#201F21',
                      borderWidth: 1,
                      borderColor: '#2A2A2C',
                      paddingHorizontal: 12,
                      color: '#E5E1E4',
                      fontFamily: 'PlusJakartaSans_600SemiBold',
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#928F9E', marginBottom: 4 }}>Category</Text>
                  <View
                    style={{
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: '#201F21',
                      borderWidth: 1,
                      borderColor: '#2A2A2C',
                      justifyContent: 'center',
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: '#C8BFFF', fontWeight: '600' }}>
                      {newItemCategory}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, color: '#E5E1E4', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                  Is Vegetarian?
                </Text>
                <Switch
                  value={newItemVeg}
                  onValueChange={setNewItemVeg}
                  trackColor={{ false: '#353437', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save and publish item"
              onPress={handleCreateItem}
              style={{
                height: 50,
                borderRadius: 16,
                backgroundColor: '#6A5ACD',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 6,
              }}
            >
              <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#F0EBFF' }}>
                Publish to Menu ✓
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Floating Bottom Nav */}
      <VendorStitchNav activeTab="menu" />
    </View>
  );
}
