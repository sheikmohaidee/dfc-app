/**
 * DFC Live Order & Medicine Tracking Screen - Full Stitch Design Implementation
 * Map View Section with Route Nodes, Pull-up Sheet, 6-Stage Timeline, Captain Info Card, and Delivery OTP.
 */

import * as React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Clock,
  Home,
  KeyRound,
  MessageSquare,
  Phone,
  Pill,
  Sparkles,
  Star,
  Utensils,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr, isTerminal, type Order, type Rider } from '@dfc/core';
import { subscribeOrder } from '@/lib/orders';
import { subscribeRider, subscribeRiderPosition, type LatLng } from '@/lib/riders';
import { DEMO_MODE } from '@/demo/config';
import { mockOrderRepository } from '@/demo/repositories/order.repository';
import { Screen } from '@/ui';
import { DFCBottomNav } from '@/ui/bottom-nav';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [assignedRider, setAssignedRider] = React.useState<Rider | null>(null);
  const [riderPos, setRiderPos] = React.useState<LatLng | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [advancing, setAdvancing] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    return subscribeOrder(id, (o) => {
      setOrder(o);
      setLoading(false);
    });
  }, [id]);

  React.useEffect(() => {
    if (!order?.riderUid) {
      setAssignedRider(null);
      setRiderPos(null);
      return;
    }
    const unsubRider = subscribeRider(order.riderUid, (r) => {
      setAssignedRider(r);
    });
    const unsubPos = subscribeRiderPosition(order.riderUid, (pos) => {
      setRiderPos(pos);
    });
    return () => {
      unsubRider();
      unsubPos();
    };
  }, [order?.riderUid]);

  const handleAdvanceStage = async () => {
    if (!order) return;
    setAdvancing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updated = mockOrderRepository.advanceStatus(order.id);
      if (updated) setOrder(updated);
    } finally {
      setAdvancing(false);
    }
  };

  if (!order && !loading) {
    return (
      <Screen edges={['top']}>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text style={{ fontFamily: 'Archivo', fontSize: 16, fontWeight: '700', color: '#141B2B' }}>
            Order not found
          </Text>
          <Pressable
            onPress={() => router.replace('/(customer)/orders')}
            style={{ backgroundColor: '#7A1F3D', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
              Back to Orders
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const isDelivered = order?.status === 'delivered';
  const riderName = assignedRider?.name || order?.riderName || order?.captainName || 'Captain';

  // 6 Timeline Stages
  const stages = [
    { title: 'Prescription Verified', desc: 'Pharmacy validated items & stock.', completed: true, active: false },
    {
      title: 'Store Packing & Ready',
      desc: 'Items are securely boxed with tamper seal.',
      completed: order?.status !== 'incoming' && order?.status !== 'admin_review',
      active: order?.status === 'vendor_accepted' || order?.status === 'packing',
    },
    {
      title: 'Captain Assigned',
      desc: `${riderName} assigned for pickup.`,
      completed: ['ready_for_pickup', 'dispatched', 'picked_up', 'out_for_delivery', 'delivered'].includes(
        order?.status || '',
      ),
      active: order?.status === 'ready_for_pickup' || order?.status === 'dispatched',
    },
    {
      title: 'Picked Up from Store',
      desc: `${riderName} picked up order from store.`,
      completed: ['picked_up', 'out_for_delivery', 'delivered'].includes(order?.status || ''),
      active: order?.status === 'picked_up',
    },
    {
      title: 'On the Way to You',
      desc: `En route to ${order?.addressLine || 'your location'}.`,
      completed: ['out_for_delivery', 'delivered'].includes(order?.status || ''),
      active: order?.status === 'out_for_delivery',
    },
    {
      title: 'Delivered & Handed Over',
      desc: 'OTP verified at doorstep.',
      completed: isDelivered,
      active: isDelivered,
    },
  ];

  return (
    <Screen edges={['top']}>
      {/* Top Header Bar */}
      <View
        style={{
          height: 60,
          backgroundColor: '#F9F9FF',
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#DAC0C430',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#E9EDFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color="#7A1F3D" strokeWidth={2.2} />
        </Pressable>

        <Text
          style={{
            fontFamily: 'Archivo',
            fontSize: 18,
            fontWeight: '800',
            color: '#7A1F3D',
            letterSpacing: -0.3,
          }}
        >
          ORD-#{order?.code || '9824-XT'}
        </Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Demo Stage Advance Tool */}
        {DEMO_MODE && !isDelivered ? (
          <View
            style={{
              backgroundColor: '#FFFBEB',
              borderBottomWidth: 1,
              borderBottomColor: '#FDE68A',
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#D97706" />
              <Text style={{ fontFamily: 'Archivo', fontSize: 12, fontWeight: '700', color: '#92400E' }}>
                DEMO STAGE CONTROLLER
              </Text>
            </View>
            <Pressable
              onPress={handleAdvanceStage}
              disabled={advancing}
              style={{
                backgroundColor: '#D97706',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontFamily: 'Archivo', fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                {advancing ? 'Advancing...' : '⚡ Advance Stage →'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Map View Section */}
        <View
          style={{
            height: 240,
            backgroundColor: '#E1E8FD',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Simulated Map Visual */}
          <View
            style={{
              position: 'absolute',
              top: 36,
              left: 40,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#FFFFFF',
              borderWidth: 2,
              borderColor: '#7A1F3D',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Pill size={22} color="#7A1F3D" />
          </View>

          {/* Dotted Route Curve Line */}
          <View
            style={{
              width: 140,
              height: 2,
              borderStyle: 'dashed',
              borderWidth: 1.5,
              borderColor: '#7A1F3D',
              transform: [{ rotate: '32deg' }],
            }}
          />

          {/* Destination Node */}
          <View
            style={{
              position: 'absolute',
              bottom: 40,
              right: 40,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#7A1F3D',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Home size={22} color="#FFFFFF" />
          </View>
        </View>

        {/* Pull-Up Tracking Canvas */}
        <View
          style={{
            backgroundColor: '#F9F9FF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: -20,
            paddingTop: 12,
            paddingHorizontal: 20,
            shadowColor: '#000000',
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 48,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#DAC0C4',
              alignSelf: 'center',
              marginBottom: 16,
            }}
          />

          {/* Header row: ETA & Live Pulse */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#DAC0C430',
              marginBottom: 20,
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: 'Archivo',
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#554245',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                Estimated Arrival
              </Text>
              <Text
                style={{
                  fontFamily: 'Archivo',
                  fontSize: 30,
                  fontWeight: '800',
                  color: '#141B2B',
                  letterSpacing: -0.5,
                }}
              >
                12:45 <Text style={{ fontSize: 18, color: '#554245' }}>PM</Text>
              </Text>
            </View>

            {/* Live Tracking Pulse */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#F0FDF4',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: '#0A6A3230',
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#0A6A32',
                }}
              />
              <Text
                style={{
                  fontFamily: 'Archivo',
                  fontSize: 11,
                  fontWeight: '800',
                  color: '#0A6A32',
                  letterSpacing: 0.5,
                }}
              >
                LIVE TRACKING
              </Text>
            </View>
          </View>

          {/* Delivery OTP Card */}
          {!isDelivered ? (
            <View
              style={{
                backgroundColor: '#EFF6FF',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#2563EB30',
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: '#2563EB',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={18} color="#FFFFFF" strokeWidth={2.2} />
                </View>
                <View>
                  <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#1E3A8A' }}>
                    Delivery OTP
                  </Text>
                  <Text style={{ fontFamily: 'Archivo', fontSize: 11, color: '#1E40AF' }}>
                    Share with captain at doorstep
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#2563EB50',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Archivo',
                    fontSize: 18,
                    fontWeight: '800',
                    color: '#1E40AF',
                    letterSpacing: 3,
                  }}
                >
                  {order?.deliveryOtp || '8492'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Vertical 6-Stage Timeline */}
          <View className="mb-6">
            <Text
              style={{
                fontFamily: 'Archivo',
                fontSize: 11,
                fontWeight: '700',
                color: '#7A1F3D',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 16,
              }}
            >
              Live Order Progress
            </Text>

            <View style={{ paddingLeft: 12 }}>
              {stages.map((stage, i) => {
                return (
                  <View key={stage.title} className="flex-row gap-3">
                    <View className="items-center">
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: stage.completed
                            ? '#7A1F3D'
                            : stage.active
                            ? '#FDF2F5'
                            : '#FFFFFF',
                          borderWidth: stage.completed ? 0 : 2,
                          borderColor: stage.active ? '#7A1F3D' : '#DAC0C4',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {stage.completed ? (
                          <Check size={13} color="#FFFFFF" strokeWidth={3} />
                        ) : stage.active ? (
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#7A1F3D' }} />
                        ) : null}
                      </View>
                      {i < stages.length - 1 ? (
                        <View
                          style={{
                            width: 2,
                            height: 28,
                            backgroundColor: stage.completed ? '#7A1F3D' : '#DAC0C4',
                          }}
                        />
                      ) : null}
                    </View>

                    <View className="flex-1 pb-4">
                      <Text
                        style={{
                          fontFamily: 'Archivo',
                          fontSize: 14,
                          fontWeight: stage.completed || stage.active ? '700' : '500',
                          color: stage.completed || stage.active ? '#141B2B' : '#887275',
                        }}
                      >
                        {stage.title}
                      </Text>
                      {stage.desc ? (
                        <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245', marginTop: 2 }}>
                          {stage.desc}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Captain Info Card */}
          <View
            style={{
              backgroundColor: '#F1F3FF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#DAC0C4',
              padding: 16,
              marginBottom: 20,
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: '#7A1F3D',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                  }}
                >
                  <Text style={{ fontFamily: 'Archivo', fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>
                    M
                  </Text>
                </View>

                <View>
                  <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                    {assignedRider?.name || order?.riderName || 'Muthu Kumar'}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <View className="flex-row items-center gap-0.5">
                      <Star size={12} color="#D97706" fill="#D97706" />
                      <Text style={{ fontFamily: 'Archivo', fontSize: 12, fontWeight: '700', color: '#141B2B' }}>
                        {assignedRider?.rating || 4.9}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }}>
                      • {assignedRider?.vehicle || 'TVS Jupiter'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* License Plate Badge */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#DAC0C4',
                  flexDirection: 'row',
                  overflow: 'hidden',
                }}
              >
                <View style={{ backgroundColor: '#E9EDFF', paddingHorizontal: 6, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: 'Archivo', fontSize: 10, fontWeight: '800', color: '#554245' }}>
                    TN 59
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: 'Archivo', fontSize: 11, fontWeight: '800', color: '#141B2B' }}>
                    AZ 1234
                  </Text>
                </View>
              </View>
            </View>

            {/* Call & Chat Action Buttons */}
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => void Linking.openURL(`tel:${assignedRider?.phone || '+919876500004'}`)}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: '#7A1F3D',
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Phone size={16} color="#FFFFFF" />
                <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                  Call Captain
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(customer)/chat')}
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#DAC0C4',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare size={18} color="#7A1F3D" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <DFCBottomNav activeTab="track" />
    </Screen>
  );
}
