/**
 * Daily Morning Subscriptions - Customer Mobile Screen.
 *
 * Lets Madurai families subscribe to morning essentials (Fresh Milk, Batter, Flowers, Newspapers)
 * delivered fresh at their doorstep between 6:00 AM - 7:30 AM every morning.
 */

import * as React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  PauseCircle,
  PlayCircle,
  Plus,
  Sparkles,
  Sun,
} from 'lucide-react-native';

import {
  calculateMonthlySubscriptionPaise,
  ESSENTIAL_SUBSCRIPTION_CATALOGUE,
  formatInr,
  SEED_SUBSCRIPTIONS,
  type DailySubscription,
  type SubscriptionFrequency,
  type SubscriptionItem,
} from '@dfc/core';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = React.useState<DailySubscription[]>(SEED_SUBSCRIPTIONS);
  const [selectedItem, setSelectedItem] = React.useState<SubscriptionItem>(
    ESSENTIAL_SUBSCRIPTION_CATALOGUE[0]!,
  );
  const [frequency, setFrequency] = React.useState<SubscriptionFrequency>('daily');
  const [quantity, setQuantity] = React.useState(1);
  const [subscribedToast, setSubscribedToast] = React.useState(false);

  const handleTogglePause = (subId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, isActive: !s.isActive } : s)),
    );
  };

  const handleAddSubscription = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newSub: DailySubscription = {
      id: `sub-${Date.now()}`,
      customerUid: 'cust-current',
      customerName: 'Customer',
      customerPhone: '+919876543210',
      localityId: 'kk-nagar',
      addressLine: '14, 80 Feet Road, Madurai',
      item: selectedItem,
      quantity,
      frequency,
      deliverySlot: '06:00 AM - 07:30 AM',
      isActive: true,
      startDate: '2026-09-02',
      nextDeliveryDate: '2026-09-02',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSubscriptions((prev) => [newSub, ...prev]);
    setSubscribedToast(true);
    setTimeout(() => setSubscribedToast(false), 3000);
  };

  const monthlyEstPaise = calculateMonthlySubscriptionPaise({
    item: selectedItem,
    quantity,
    frequency,
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color="#F4F4F5" />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Morning Subscriptions</Text>
          <Text style={styles.headerSub}>காலை அத்தியாவசிய விநியோகம்</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Morning Slot Banner */}
        <View style={styles.slotBanner}>
          <View style={styles.slotIconWrapper}>
            <Sun size={20} color="#F59E0B" />
          </View>
          <View style={styles.slotTextWrapper}>
            <Text style={styles.slotTitle}>Delivered 06:00 AM – 07:30 AM</Text>
            <Text style={styles.slotSub}>
              Fresh doorstep drop before morning breakfast. No waking up early or missed delivery calls.
            </Text>
          </View>
        </View>

        {/* Subscribe New Essential Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Sparkles size={16} color="#3B82F6" />
            <Text style={styles.cardTitle}>Choose Your Daily Essential</Text>
          </View>

          {/* Items Selector */}
          <View style={styles.itemsGrid}>
            {ESSENTIAL_SUBSCRIPTION_CATALOGUE.map((item) => {
              const isSelected = selectedItem.id === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedItem(item);
                  }}
                  style={[styles.itemPill, isSelected && styles.itemPillActive]}
                >
                  <View style={styles.itemPillText}>
                    <Text style={[styles.itemName, isSelected && styles.itemNameActive]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemNameTa}>{item.nameTa}</Text>
                  </View>
                  <Text style={[styles.itemPrice, isSelected && styles.itemPriceActive]}>
                    {formatInr(item.unitPricePaise)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Quantity Controls */}
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Daily Quantity ({selectedItem.unit}):</Text>
            <View style={styles.qtyControls}>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (quantity > 1) setQuantity((q) => q - 1);
                }}
                style={styles.qtyButton}
              >
                <Minus size={14} color="#A1A1AA" />
              </Pressable>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (quantity < 10) setQuantity((q) => q + 1);
                }}
                style={styles.qtyButton}
              >
                <Plus size={14} color="#A1A1AA" />
              </Pressable>
            </View>
          </View>

          {/* Frequency Selector */}
          <View style={styles.freqContainer}>
            <Text style={styles.freqLabel}>Schedule Frequency:</Text>
            <View style={styles.freqRow}>
              {(['daily', 'weekdays', 'weekends'] as SubscriptionFrequency[]).map((f) => {
                const isActive = frequency === f;
                return (
                  <Pressable
                    key={f}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setFrequency(f);
                    }}
                    style={[styles.freqPill, isActive && styles.freqPillActive]}
                  >
                    <Text style={[styles.freqText, isActive && styles.freqTextActive]}>
                      {f === 'daily' ? 'Everyday' : f === 'weekdays' ? 'Mon – Fri' : 'Sat – Sun'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Monthly Estimate & Subscribe Button */}
          <View style={styles.subscribeFooter}>
            <View>
              <Text style={styles.estLabel}>Monthly Estimated Bill</Text>
              <Text style={styles.estValue}>{formatInr(monthlyEstPaise)}</Text>
            </View>
            <Pressable onPress={handleAddSubscription} style={styles.subscribeButton}>
              <Text style={styles.subscribeButtonText}>Start Subscription</Text>
            </Pressable>
          </View>
        </View>

        {/* Active Subscriptions List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Active Subscriptions ({subscriptions.length})</Text>
        </View>

        {subscriptions.map((sub) => (
          <View
            key={sub.id}
            style={[styles.activeSubCard, !sub.isActive && styles.activeSubCardPaused]}
          >
            <View style={styles.activeSubHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeSubTitle}>
                  {sub.quantity}× {sub.item.name}
                </Text>
                <Text style={styles.activeSubTa}>{sub.item.nameTa}</Text>
                <Text style={styles.activeSubSchedule}>
                  ⏰ {sub.deliverySlot} · {sub.frequency.toUpperCase()}
                </Text>
              </View>
              <Pressable
                onPress={() => handleTogglePause(sub.id)}
                style={[styles.pauseButton, !sub.isActive && styles.resumeButton]}
              >
                {sub.isActive ? (
                  <>
                    <PauseCircle size={14} color="#F59E0B" />
                    <Text style={styles.pauseText}>Pause</Text>
                  </>
                ) : (
                  <>
                    <PlayCircle size={14} color="#10B981" />
                    <Text style={styles.resumeText}>Resume</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.activeSubFooter}>
              <Text style={styles.activeSubNext}>
                Next drop: {sub.isActive ? 'Tomorrow at 06:30 AM' : 'Paused'}
              </Text>
              <Text style={styles.activeSubPrice}>
                {formatInr(sub.item.unitPricePaise * sub.quantity)} / day
              </Text>
            </View>
          </View>
        ))}

        {subscribedToast && (
          <View style={styles.toast}>
            <CheckCircle2 size={16} color="#10B981" />
            <Text style={styles.toastText}>Subscription activated! First delivery tomorrow morning.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F4F4F5',
  },
  headerSub: {
    fontSize: 11,
    color: '#71717A',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  slotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#78350F25',
    borderWidth: 1,
    borderColor: '#F59E0B40',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  slotIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTextWrapper: {
    flex: 1,
  },
  slotTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FDE68A',
  },
  slotSub: {
    fontSize: 11,
    color: '#D4D4D8',
    marginTop: 2,
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4F4F5',
  },
  itemsGrid: {
    gap: 8,
  },
  itemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    padding: 12,
  },
  itemPillActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E3A8A25',
  },
  itemPillText: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  itemNameActive: {
    color: '#93C5FD',
  },
  itemNameTa: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  itemPriceActive: {
    color: '#60A5FA',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingTop: 12,
  },
  qtyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#09090B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  qtyButton: {
    padding: 4,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4F4F5',
    minWidth: 20,
    textAlign: 'center',
  },
  freqContainer: {
    gap: 8,
  },
  freqLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  freqPillActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E3A8A30',
  },
  freqText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  freqTextActive: {
    color: '#93C5FD',
  },
  subscribeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingTop: 14,
  },
  estLabel: {
    fontSize: 10,
    color: '#71717A',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  estValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
  },
  subscribeButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeSubCard: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  activeSubCardPaused: {
    opacity: 0.6,
    borderColor: '#3F3F46',
  },
  activeSubHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  activeSubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4F4F5',
  },
  activeSubTa: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  activeSubSchedule: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 4,
    fontWeight: '600',
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#78350F25',
    borderWidth: 1,
    borderColor: '#F59E0B40',
  },
  resumeButton: {
    backgroundColor: '#064E3B25',
    borderColor: '#10B98140',
  },
  pauseText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  resumeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  activeSubFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingTop: 8,
  },
  activeSubNext: {
    fontSize: 11,
    color: '#71717A',
  },
  activeSubPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E4E4E7',
  },
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#064E3B',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#ECFDF5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
