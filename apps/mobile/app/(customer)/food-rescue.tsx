/**
 * Food Rescue Radar - Customer Mobile Screen.
 *
 * Displays live, freshly cooked meals from canceled orders at 50%–70% OFF
 * with a 15-minute countdown clock to eliminate food waste in Madurai.
 */

import * as React from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Clock, Flame, Sparkles, Store, Zap } from 'lucide-react-native';

import { formatInr, getRescueRemainingMs, type FoodRescueListing } from '@dfc/core';

// Sample Live Food Rescue Deals for Madurai customers
const SEED_MOBILE_RESCUES: FoodRescueListing[] = [
  {
    id: 'rescue-mob-1',
    originalOrderId: 'ord-9821',
    storeId: 'simmakkal-konar-mess',
    storeName: 'Simmakkal Konar Mess',
    localityId: 'simmakkal',
    items: [
      { id: 'i1', name: 'Madurai Bun Parotta', quantity: 3, unit: 'pc', unitPricePaise: 4500, included: true, confidence: 1.0 },
      { id: 'i2', name: 'Mutton Kari Dosa', quantity: 1, unit: 'plate', unitPricePaise: 24000, included: true, confidence: 1.0 },
    ],
    originalSubtotalPaise: 37500,
    rescuePricePaise: 15000, // 60% OFF -> ₹150
    discountPercentage: 60,
    createdAt: Date.now() - 4 * 60 * 1000,
    expiresAt: Date.now() + 11 * 60 * 1000,
    status: 'active',
  },
  {
    id: 'rescue-mob-2',
    originalOrderId: 'ord-9822',
    storeId: 'murugan-idli-shop',
    storeName: 'Murugan Idli Shop',
    localityId: 'kk-nagar',
    items: [
      { id: 'i1', name: 'Ghee Podi Idli (2 pcs)', quantity: 2, unit: 'plate', unitPricePaise: 9000, included: true, confidence: 1.0 },
      { id: 'i2', name: 'Medhu Vada', quantity: 2, unit: 'pc', unitPricePaise: 4000, included: true, confidence: 1.0 },
    ],
    originalSubtotalPaise: 26000,
    rescuePricePaise: 10400, // 60% OFF -> ₹104
    discountPercentage: 60,
    createdAt: Date.now() - 7 * 60 * 1000,
    expiresAt: Date.now() + 8 * 60 * 1000,
    status: 'active',
  },
];

export default function FoodRescueScreen() {
  const router = useRouter();
  const [deals] = React.useState<FoodRescueListing[]>(SEED_MOBILE_RESCUES);
  const [now, setNow] = React.useState(Date.now());
  const [claimedIds, setClaimedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClaim = (deal: FoodRescueListing) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setClaimedIds((prev) => new Set([...prev, deal.id]));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <ArrowLeft size={20} color="#FAFAFA" />
        </Pressable>
        <View style={styles.headerTitleGroup}>
          <View style={styles.headerRow}>
            <Flame size={16} color="#F97316" />
            <Text style={styles.headerTitle}>Food Rescue Radar</Text>
          </View>
          <Text style={styles.headerSub}>Piping hot canceled meals at 50%–70% OFF</Text>
        </View>
      </View>

      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.bannerCard}>
            <Sparkles size={16} color="#F97316" />
            <Text style={styles.bannerText}>
              Food is already packed &amp; ready at the counter. Claim now to receive priority 15-min delivery!
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const remMs = getRescueRemainingMs(item, now);
          const mins = Math.floor(remMs / 60000);
          const secs = Math.floor((remMs % 60000) / 1000);
          const isClaimed = claimedIds.has(item.id);
          const isExpired = remMs <= 0 && !isClaimed;

          return (
            <View style={[styles.card, isClaimed && styles.cardClaimed]}>
              <View style={styles.cardHeader}>
                <View style={styles.storeCol}>
                  <View style={styles.storeRow}>
                    <Store size={14} color="#A1A1AA" />
                    <Text style={styles.storeName}>{item.storeName}</Text>
                  </View>
                  <Text style={styles.localityText}>({item.localityId})</Text>
                </View>

                <View style={styles.badgeRow}>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{item.discountPercentage}% OFF</Text>
                  </View>
                  {!isClaimed && !isExpired && (
                    <View style={styles.timerBadge}>
                      <Clock size={11} color="#EA580C" />
                      <Text style={styles.timerText}>
                        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Items */}
              <View style={styles.itemsBox}>
                {item.items.map((i, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemQuantity}>{i.quantity}×</Text>
                    <Text style={styles.itemName}>{i.name}</Text>
                  </View>
                ))}
              </View>

              {/* Pricing & CTA */}
              <View style={styles.cardFooter}>
                <View style={styles.priceGroup}>
                  <Text style={styles.rescuePrice}>{formatInr(item.rescuePricePaise)}</Text>
                  <Text style={styles.originalPrice}>{formatInr(item.originalSubtotalPaise)}</Text>
                </View>

                {isClaimed ? (
                  <View style={styles.claimedSuccessBadge}>
                    <Text style={styles.claimedSuccessText}>✓ Order Placed!</Text>
                  </View>
                ) : isExpired ? (
                  <Text style={styles.expiredText}>Deal Expired</Text>
                ) : (
                  <Pressable
                    onPress={() => handleClaim(item)}
                    style={({ pressed }) => [
                      styles.claimButton,
                      pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                    ]}
                  >
                    <Zap size={15} color="#FFFFFF" />
                    <Text style={styles.claimButtonText}>Instant Rescue Claim</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  headerRow: {
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
  listContainer: {
    padding: 16,
    gap: 14,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E140A',
    borderColor: '#451A03',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  bannerText: {
    fontSize: 11.5,
    color: '#FED7AA',
    lineHeight: 16,
    flex: 1,
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 16,
    gap: 12,
  },
  cardClaimed: {
    borderColor: '#15803D',
    backgroundColor: '#052E16',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storeCol: {
    flex: 1,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  localityText: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discountBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timerText: {
    color: '#C2410C',
    fontSize: 10,
    fontWeight: '700',
  },
  itemsBox: {
    backgroundColor: '#09090B',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F97316',
  },
  itemName: {
    fontSize: 12,
    color: '#D4D4D8',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#27272A',
    paddingTop: 10,
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  rescuePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FAFAFA',
  },
  originalPrice: {
    fontSize: 12,
    color: '#71717A',
    textDecorationLine: 'line-through',
  },
  claimButton: {
    backgroundColor: '#F97316',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  claimedSuccessBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  claimedSuccessText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  expiredText: {
    fontSize: 12,
    color: '#71717A',
    fontStyle: 'italic',
  },
});
