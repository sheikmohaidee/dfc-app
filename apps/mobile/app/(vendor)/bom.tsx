/**
 * Vendor Ingredient-Level BOM & Cascading Stock Management.
 *
 * Merchants can toggle base raw ingredients (e.g. Parotta Dough, Idli Batter, Basundi Milk)
 * and the system automatically cascades stock availability to all dependent dishes.
 */

import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Layers, Sparkles } from 'lucide-react-native';

import {
  SEED_INGREDIENTS,
  type Ingredient,
} from '@dfc/core';

export default function VendorBomScreen() {
  const router = useRouter();
  const [ingredients, setIngredients] = React.useState<Ingredient[]>(SEED_INGREDIENTS);

  const handleToggle = (item: Ingredient) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIngredients((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, inStock: !i.inStock } : i)),
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <ArrowLeft size={20} color="#FAFAFA" />
        </Pressable>
        <View style={styles.headerTitleGroup}>
          <View style={styles.rowAlign}>
            <Layers size={16} color="#D97706" />
            <Text style={styles.headerTitle}>Ingredient BOM Cascade</Text>
          </View>
          <Text style={styles.headerSub}>Control base raw materials to auto-toggle dishes</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBanner}>
          <Sparkles size={16} color="#D97706" />
          <Text style={styles.infoText}>
            Run out of raw dough or gravy? Flipping one ingredient OFF here instantly marks every linked
            dish as Out of Stock for customers!
          </Text>
        </View>

        <View style={styles.list}>
          {ingredients.map((ing) => (
            <View key={ing.id} style={[styles.card, !ing.inStock && styles.cardInactive]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleCol}>
                  <Text style={styles.ingName}>{ing.name}</Text>
                  <Text style={styles.ingNameTa}>{ing.nameTa}</Text>
                  <Text style={styles.unitText}>Raw Unit: {ing.unit}</Text>
                </View>

                <Switch
                  value={ing.inStock}
                  onValueChange={() => handleToggle(ing)}
                  trackColor={{ false: '#3F3F46', true: '#16A34A' }}
                  thumbColor="#FAFAFA"
                />
              </View>

              <View style={styles.linkedDishesBox}>
                <Text style={styles.linkedHeader}>
                  LINKED DISHES ({ing.linkedProductIds.length})
                </Text>
                <View style={styles.dishPillRow}>
                  {ing.linkedProductIds.map((id) => (
                    <View key={id} style={[styles.dishPill, !ing.inStock && styles.dishPillDisabled]}>
                      <Text style={[styles.dishPillText, !ing.inStock && styles.dishPillTextDisabled]}>
                        {id.replace('prod-', '').replace(/-/g, ' ').toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.statusFooter}>
                <Text
                  style={[
                    styles.statusIndicator,
                    ing.inStock ? styles.statusInStock : styles.statusOutOfStock,
                  ]}
                >
                  {ing.inStock ? '● Active in Customer App' : '○ Disabled Across Customer App'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#18181B',
    gap: 12,
  },
  backButton: {
    padding: 6,
  },
  headerTitleGroup: {
    flex: 1,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  headerSub: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E140A',
    borderColor: '#451A03',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 11.5,
    color: '#FED7AA',
    lineHeight: 16,
    flex: 1,
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 16,
    gap: 12,
  },
  cardInactive: {
    borderColor: '#7F1D1D',
    backgroundColor: '#1F1010',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleCol: {
    flex: 1,
  },
  ingName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  ingNameTa: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
  },
  unitText: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 3,
  },
  linkedDishesBox: {
    backgroundColor: '#09090B',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  linkedHeader: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 0.6,
  },
  dishPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dishPill: {
    backgroundColor: '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dishPillDisabled: {
    backgroundColor: '#3F1212',
  },
  dishPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  dishPillTextDisabled: {
    color: '#F87171',
    textDecorationLine: 'line-through',
  },
  statusFooter: {
    borderTopWidth: 1,
    borderColor: '#27272A',
    paddingTop: 8,
  },
  statusIndicator: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusInStock: {
    color: '#16A34A',
  },
  statusOutOfStock: {
    color: '#EF4444',
  },
});
