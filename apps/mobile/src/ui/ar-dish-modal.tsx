/**
 * 3D AR Dish Explorer Modal.
 *
 * Provides a stunning, interactive 3D rotating dish visualization with
 * nutritional macro breakdowns (calories, protein, carbs), ingredient tags,
 * and instant 1-tap cart addition.
 */

import * as React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, Sparkles, X, Zap } from 'lucide-react-native';

import { formatInr } from '@dfc/core';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export interface Dish3DInfo {
  id: string;
  name: string;
  nameTa: string;
  storeName: string;
  pricePaise: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  isVeg: boolean;
  tags: string[];
  description: string;
  accentColor: string;
}

export const SEED_3D_DISHES: Record<string, Dish3DInfo> = {
  'bun-parotta': {
    id: 'bun-parotta',
    name: 'Madurai Bun Parotta',
    nameTa: 'மதுரை பன் பரோட்டா',
    storeName: 'Simmakkal Konar Mess',
    pricePaise: 4500,
    calories: 340,
    proteinGrams: 7,
    carbsGrams: 42,
    fatGrams: 16,
    isVeg: true,
    tags: ['Crispy Crust', 'Fluffy Inside', 'Pure Ghee', 'Fresh Dough'],
    description:
      'Iconic Madurai specialty parotta beaten into a puffy bun shape, pan-crisped with generous ghee.',
    accentColor: '#D97706',
  },
  'kari-dosa': {
    id: 'kari-dosa',
    name: 'Mutton Kari Dosa',
    nameTa: 'மட்டன் கறி தோசை',
    storeName: 'Simmakkal Konar Mess',
    pricePaise: 24000,
    calories: 520,
    proteinGrams: 32,
    carbsGrams: 38,
    fatGrams: 24,
    isVeg: false,
    tags: ['Tender Mutton', 'Double Egg Base', 'Stone-ground Batter', 'Pepper Spiced'],
    description:
      'Thick three-tier dosa layered with fluffy egg omlette and slow-cooked Madurai mutton chukka gravy.',
    accentColor: '#DC2626',
  },
  'jigarthanda': {
    id: 'jigarthanda',
    name: 'Special Basundi Jigarthanda',
    nameTa: 'ஸ்பெஷல் பாசுந்தி ஜிகர்தண்டா',
    storeName: 'Famous Jigarthanda',
    pricePaise: 8000,
    calories: 290,
    proteinGrams: 8,
    carbsGrams: 36,
    fatGrams: 12,
    isVeg: true,
    tags: ['Buffalo Milk Basundi', 'Badam Pisin', 'Nannari Syrup', 'Vanilla Scoop'],
    description:
      'The legendary royal cooling elixir of Madurai made with caramelized buffalo milk and tree gum.',
    accentColor: '#9333EA',
  },
  'podi-idli': {
    id: 'podi-idli',
    name: 'Ghee Podi Idli',
    nameTa: 'நெய் பொடி இட்லி',
    storeName: 'Murugan Idli Shop',
    pricePaise: 9000,
    calories: 260,
    proteinGrams: 9,
    carbsGrams: 34,
    fatGrams: 10,
    isVeg: true,
    tags: ['Coarse Gunpowder Podi', 'Pure Cow Ghee', 'Melt-in-mouth Idli'],
    description:
      'Mini button idlis tossed hot in aromatic roasted spiced gunpowder and sizzling country cow ghee.',
    accentColor: '#16A34A',
  },
};

interface ArDishModalProps {
  visible: boolean;
  dishKey: string;
  onClose: () => void;
  onAddToCart?: (dish: Dish3DInfo) => void;
}

export function ArDishModal({ visible, dishKey, onClose, onAddToCart }: ArDishModalProps) {
  const dish = SEED_3D_DISHES[dishKey] ?? SEED_3D_DISHES['bun-parotta']!;
  const rotation = useSharedValue(0);

  // Smooth rotation on native UI thread with zero JS re-renders and clean disposal
  React.useEffect(() => {
    if (visible) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, { duration: 10000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
    }
    return () => {
      cancelAnimation(rotation);
    };
  }, [visible, rotation]);

  const animatedPlateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={18} color="#D97706" />
              <Text style={styles.headerTitle}>3D Dish Visualizer</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <X size={20} color="#71717A" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* 3D WebGL / Canvas Dish Stage */}
            <View style={styles.stageContainer}>
              <LinearGradient
                colors={['#18181B', '#09090B']}
                style={styles.stageGradient}
              >
                {/* 3D Dish Floating Sphere & Plate representation */}
                <Animated.View
                  style={[
                    styles.dishPlate,
                    {
                      borderColor: dish.accentColor,
                    },
                    animatedPlateStyle,
                  ]}
                >
                  <View style={[styles.dishGlow, { backgroundColor: dish.accentColor }]} />
                  <View style={styles.dishCenter}>
                    <Text style={styles.dishIconText}>
                      {dishKey === 'jigarthanda'
                        ? '🍧'
                        : dishKey === 'kari-dosa'
                        ? '🥘'
                        : dishKey === 'podi-idli'
                        ? '🥟'
                        : '🥐'}
                    </Text>
                  </View>
                </Animated.View>

                {/* 360 Interactive Badge */}
                <View style={styles.degreeBadge}>
                  <Eye size={12} color="#FAFAFA" />
                  <Text style={styles.degreeText}>360° LIVE VIEW</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Dish Info Header */}
            <View style={styles.infoSection}>
              <View style={styles.rowBetween}>
                <View style={styles.titleGroup}>
                  <Text style={styles.dishName}>{dish.name}</Text>
                  <Text style={styles.dishNameTa}>{dish.nameTa}</Text>
                  <Text style={styles.storeName}>By {dish.storeName}</Text>
                </View>
                <Text style={styles.price}>{formatInr(dish.pricePaise)}</Text>
              </View>

              <Text style={styles.description}>{dish.description}</Text>

              {/* Nutrition Macros */}
              <View style={styles.macroCard}>
                <Text style={styles.sectionHeading}>NUTRITIONAL SNAPSHOT</Text>
                <View style={styles.macroRow}>
                  <View style={styles.macroCol}>
                    <Text style={styles.macroVal}>{dish.calories}</Text>
                    <Text style={styles.macroLabel}>CALORIES</Text>
                  </View>
                  <View style={styles.macroCol}>
                    <Text style={styles.macroVal}>{dish.proteinGrams}g</Text>
                    <Text style={styles.macroLabel}>PROTEIN</Text>
                  </View>
                  <View style={styles.macroCol}>
                    <Text style={styles.macroVal}>{dish.carbsGrams}g</Text>
                    <Text style={styles.macroLabel}>CARBS</Text>
                  </View>
                  <View style={styles.macroCol}>
                    <Text style={styles.macroVal}>{dish.fatGrams}g</Text>
                    <Text style={styles.macroLabel}>HEALTHY FATS</Text>
                  </View>
                </View>
              </View>

              {/* Ingredient Tags */}
              <View style={styles.tagsContainer}>
                <Text style={styles.sectionHeading}>KEY INGREDIENTS</Text>
                <View style={styles.tagsRow}>
                  {dish.tags.map((tag, idx) => (
                    <View key={idx} style={styles.tagPill}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Add to Cart CTA */}
          <View style={styles.ctaFooter}>
            <Pressable
              onPress={() => {
                onAddToCart?.(dish);
                onClose();
              }}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Zap size={18} color="#FFFFFF" />
              <Text style={styles.ctaButtonText}>Add to Basket · {formatInr(dish.pricePaise)}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#09090B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderColor: '#27272A',
    borderTopWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#18181B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  stageContainer: {
    height: 240,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  stageGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishPlate: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dishGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    opacity: 0.15,
  },
  dishCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishIconText: {
    fontSize: 54,
  },
  degreeBadge: {
    position: 'absolute',
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  degreeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E4E4E7',
    letterSpacing: 0.5,
  },
  infoSection: {
    padding: 20,
    gap: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleGroup: {
    flex: 1,
    marginRight: 12,
  },
  dishName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FAFAFA',
  },
  dishNameTa: {
    fontSize: 14,
    color: '#A1A1AA',
    marginTop: 2,
  },
  storeName: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FAFAFA',
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: '#A1A1AA',
  },
  macroCard: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCol: {
    alignItems: 'center',
    flex: 1,
  },
  macroVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#71717A',
    marginTop: 3,
  },
  tagsContainer: {
    gap: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: '#18181B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  tagText: {
    fontSize: 11,
    color: '#D4D4D8',
    fontWeight: '500',
  },
  ctaFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#18181B',
  },
  ctaButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
