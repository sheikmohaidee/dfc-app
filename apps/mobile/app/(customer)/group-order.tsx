/**
 * Group Order Room & Proportional Split Billing Screen.
 *
 * Lets friends/colleagues join via room code (DFC-XXXX), build a cart collaboratively,
 * view proportional delivery fee breakdowns, and settle via direct UPI/card.
 */

import * as React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Check, Copy, Share2, ShieldCheck, Users, Utensils, Zap } from 'lucide-react-native';

import {
  computeGroupBillSplit,
  createGroupOrderRoom,
  formatInr,
  joinGroupOrderRoom,
  type GroupOrderRoom,
} from '@dfc/core';

export default function GroupOrderScreen() {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  // Initialize a demo Group Room
  const [room] = React.useState<GroupOrderRoom>(() => {
    const r = createGroupOrderRoom(
      { uid: 'u1', name: 'Anand (You)', phone: '+919876500001' },
      { id: 'murugan-idli-shop', name: 'Murugan Idli Shop', localityId: 'kk-nagar' },
      2900, // ₹29 delivery fee
    );
    const r2 = joinGroupOrderRoom(r, { uid: 'u2', name: 'Priya S.', phone: '+919876500002' });
    const r3 = joinGroupOrderRoom(r2, { uid: 'u3', name: 'Karthik R.', phone: '+919876500003' });

    // Pre-populate demo basket items
    r3.items = [
      {
        id: 'i1',
        name: 'Ghee Podi Idli (2 pcs)',
        quantity: 2,
        unit: 'plate',
        unitPricePaise: 9000,
        included: true,
        confidence: 1.0,
        addedByUid: 'u1',
        addedByName: 'Anand (You)',
      },
      {
        id: 'i2',
        name: 'Medhu Vada',
        quantity: 2,
        unit: 'pc',
        unitPricePaise: 4000,
        included: true,
        confidence: 1.0,
        addedByUid: 'u2',
        addedByName: 'Priya S.',
      },
      {
        id: 'i3',
        name: 'Kumbakonam Degree Coffee',
        quantity: 3,
        unit: 'cup',
        unitPricePaise: 6000,
        included: true,
        confidence: 1.0,
        addedByUid: 'u3',
        addedByName: 'Karthik R.',
      },
    ];
    return r3;
  });

  const { splits, pricing } = React.useMemo(() => computeGroupBillSplit(room), [room]);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(room.roomCode);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Join my DFC Group Order from ${room.storeName}! Enter Room Code: ${room.roomCode}`,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <ArrowLeft size={20} color="#FAFAFA" />
        </Pressable>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Group Order Room</Text>
          <Text style={styles.headerSub}>{room.storeName} ({room.localityId})</Text>
        </View>
        <Pressable onPress={handleShare} style={styles.shareButton}>
          <Share2 size={18} color="#FAFAFA" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Room Code Share Card */}
        <View style={styles.codeCard}>
          <View style={styles.codeLeft}>
            <Text style={styles.codeLabel}>ROOM CODE</Text>
            <Text style={styles.codeText}>{room.roomCode}</Text>
          </View>
          <Pressable onPress={handleCopyCode} style={styles.copyButton}>
            {copied ? <Check size={14} color="#16A34A" /> : <Copy size={14} color="#FAFAFA" />}
            <Text style={styles.copyButtonText}>{copied ? 'Copied' : 'Copy Code'}</Text>
          </Pressable>
        </View>

        {/* Room Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={16} color="#71717A" />
            <Text style={styles.sectionTitle}>PARTICIPANTS ({room.members.length})</Text>
          </View>

          <View style={styles.membersRow}>
            {room.members.map((member) => (
              <View key={member.uid} style={styles.memberAvatarCol}>
                <View style={[styles.memberAvatar, { backgroundColor: member.avatarColor }]}>
                  <Text style={styles.avatarInitial}>{member.name.charAt(0)}</Text>
                </View>
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.name}
                </Text>
                {member.isHost && <Text style={styles.hostBadge}>HOST</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* Live Basket Breakdown by Member */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Utensils size={16} color="#71717A" />
            <Text style={styles.sectionTitle}>COLLABORATIVE BASKET</Text>
          </View>

          <View style={styles.basketContainer}>
            {room.items.map((item) => (
              <View key={item.id} style={styles.basketItem}>
                <View style={styles.basketItemLeft}>
                  <Text style={styles.itemTitle}>
                    {item.quantity}× {item.name}
                  </Text>
                  <Text style={styles.itemBy}>Added by {item.addedByName}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatInr((item.unitPricePaise ?? 0) * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Proportional Split Billing Table */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShieldCheck size={16} color="#16A34A" />
            <Text style={styles.sectionTitle}>PROPORTIONAL BILL SPLIT</Text>
          </View>

          <View style={styles.splitTable}>
            {splits.map((s) => (
              <View key={s.memberUid} style={styles.splitRow}>
                <View style={styles.splitUserCol}>
                  <Text style={styles.splitUserName}>{s.memberName}</Text>
                  <Text style={styles.splitSubtext}>
                    Food {formatInr(s.subtotalPaise)} + Delivery share {formatInr(s.shareOfDeliveryPaise)}
                  </Text>
                </View>
                <Text style={styles.splitUserTotal}>{formatInr(s.totalPaise)}</Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Consolidated Total (Inc. ₹29 Delivery)</Text>
              <Text style={styles.totalValue}>{formatInr(pricing.totalPaise)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Checkout CTA */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push('/(customer)/orders');
          }}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Zap size={18} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            Lock &amp; Submit Order · {formatInr(pricing.totalPaise)}
          </Text>
        </Pressable>
      </View>
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
  shareButton: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  codeCard: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeLeft: {
    gap: 4,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 0.8,
  },
  codeText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 1,
  },
  copyButton: {
    backgroundColor: '#27272A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 0.8,
  },
  membersRow: {
    flexDirection: 'row',
    gap: 14,
  },
  memberAvatarCol: {
    alignItems: 'center',
    width: 68,
    gap: 4,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  memberName: {
    fontSize: 11,
    color: '#D4D4D8',
    textAlign: 'center',
  },
  hostBadge: {
    fontSize: 8,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  basketContainer: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 14,
    gap: 12,
  },
  basketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  basketItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  itemBy: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FAFAFA',
  },
  splitTable: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 14,
    gap: 12,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#27272A',
    paddingBottom: 10,
  },
  splitUserCol: {
    flex: 1,
  },
  splitUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  splitSubtext: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  splitUserTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FAFAFA',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#18181B',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
