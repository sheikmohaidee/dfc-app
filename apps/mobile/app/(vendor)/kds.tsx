/**
 * Mobile / Tablet Kitchen Display System (KDS) Screen for Merchants.
 * Stitch Dark Floating Theme — Implements 05 — Kitchen Preparation KDS
 *
 * Features:
 * - Large Circular Timer & Kitchen Pace Dial (SVG radial progress)
 * - Delivery Rider Sync Island (Captain Suresh Kumar Ather EV 350m live tracker)
 * - Workstation Station Routing (Grill, Fryer & Assembly, Thermal Packaging)
 * - Customer Special Request Sticky Note
 * - Station Stage Progression & Buffer Extension
 */

import * as React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Leaf,
  MessageSquare,
  PackageCheck,
  Phone,
  Pin,
  Plus,
  RefreshCw,
  Sparkles,
  Timer,
  Truck,
  Utensils,
  Zap,
} from 'lucide-react-native';

import { VendorStitchNav } from '@/ui/vendor-nav';
import { mockOrderRepository } from '@/demo/repositories/order.repository';

export default function VendorKdsScreen() {
  const router = useRouter();

  // 6 mins 14 secs = 374 seconds
  const [secondsLeft, setSecondsLeft] = React.useState(374);
  const [totalSla] = React.useState(1080); // 18 mins
  const [fryerProgress, setFryerProgress] = React.useState(78);
  const [markedReady, setMarkedReady] = React.useState(false);
  const [bufferAdded, setBufferAdded] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  // Radial progress calculations (radius = 70, circumference = 2 * PI * 70 = 439.8)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.max(0, Math.min(1, (totalSla - secondsLeft) / totalSla));
  const strokeDashoffset = circumference * (1 - progressRatio);

  const handleMarkReady = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMarkedReady(true);
    mockOrderRepository.completePreparation('order-9402');
    setTimeout(() => {
      router.push('/(vendor)/order/order-9402' as never);
    }, 600);
  };

  const handleAddBuffer = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSecondsLeft((prev) => prev + 300);
    setBufferAdded(true);
    Alert.alert('Buffer Added', '+5 Mins added to kitchen timer. Captain Suresh Kumar notified.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E10' }}>
      {/* Dynamic Live Header Sub-Banner */}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
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
            <ArrowLeft size={18} color="#E5E1E4" />
          </Pressable>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: '#FFB59C' }} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#E5E1E4',
                  letterSpacing: -0.2,
                }}
              >
                Order #DFC-8492
              </Text>
              <View
                style={{
                  backgroundColor: '#2A2A2C',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 9999,
                }}
              >
                <Text style={{ fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', color: '#C8BFFF' }}>
                  PRIORITY
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 11, color: '#928F9E', marginTop: 1 }}>
              Kitchen Station Dispatch • Indiranagar
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
            borderRadius: 8,
            backgroundColor: '#201F21',
            borderWidth: 1,
            borderColor: '#2A2A2C',
          }}
        >
          <Clock size={13} color="#7BD0FF" />
          <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#C9C4D5' }}>
            Target: 18m
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110, gap: 14 }}
      >
        {/* 1. Large Circular Timer & Kitchen Pace Dial Bento */}
        <View
          style={{
            borderRadius: 20,
            backgroundColor: '#1C1B1D',
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#2A2A2C',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.7,
            shadowRadius: 24,
          }}
        >
          {/* Radial SVG Dial */}
          <View style={{ width: 170, height: 170, alignItems: 'center', justifyContent: 'center', marginVertical: 4 }}>
            <Svg width={160} height={160} viewBox="0 0 160 160">
              {/* Background track circle */}
              <Circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#353437"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Progress circle */}
              <Circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#FFB59C"
                strokeWidth="10"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${strokeDashoffset}`}
                strokeLinecap="round"
                fill="transparent"
                transform="rotate(-90 80 80)"
              />
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#928F9E',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                PREP COUNTDOWN
              </Text>
              <Text
                style={{
                  fontSize: 32,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#E5E1E4',
                  letterSpacing: -1,
                  marginTop: 2,
                }}
              >
                {mm}:{ss}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'PlusJakartaSans_700Bold',
                  fontWeight: '700',
                  color: '#FFB59C',
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}
              >
                REMAINING
              </Text>
            </View>
          </View>

          {/* Pace Status Pill */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 9999,
              backgroundColor: '#2A2A2C',
              marginTop: 4,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#7BD0FF' }} />
            <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#E5E1E4' }}>
              ON TRACK • Kitchen Pace Normal
            </Text>
          </View>

          {/* Elapsed vs SLA Micro Bar */}
          <View
            style={{
              width: '100%',
              maxWidth: 280,
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 12,
            }}
          >
            <Text style={{ fontSize: 11, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
              Elapsed: 12m 46s
            </Text>
            <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#C8BFFF' }}>
              18m 00s SLA Max
            </Text>
          </View>
        </View>

        {/* 2. Delivery Rider Sync Island */}
        <View
          style={{
            borderRadius: 18,
            backgroundColor: '#201F21',
            padding: 14,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#353437',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Truck size={20} color="#C8BFFF" />
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: '#FFB59C',
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'PlusJakartaSans_700Bold',
                      fontWeight: '700',
                      color: '#E5E1E4',
                    }}
                  >
                    Captain Suresh Kumar
                  </Text>
                  <CheckCircle2 size={15} color="#7BD0FF" />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: '#FFB59C',
                    marginTop: 1,
                  }}
                >
                  Arriving in 3 mins (350m away)
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Call Captain Suresh"
                onPress={() => Alert.alert('Calling Courier', 'Dialing Captain Suresh Kumar (+91 98450 12345)...')}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: '#353437',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Phone size={15} color="#E5E1E4" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Chat with Captain"
                onPress={() => Alert.alert('Dispatch Chat', 'Opening dispatch chat with Captain Suresh Kumar.')}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: '#353437',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare size={15} color="#7BD0FF" />
              </Pressable>
            </View>
          </View>

          {/* Spatial Progress Line */}
          <View style={{ backgroundColor: '#0E0E10', borderRadius: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 10, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                Kitchen (You)
              </Text>
              <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFB59C' }}>
                Ather EV • 350m
              </Text>
              <Text style={{ fontSize: 10, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                Gate Entry
              </Text>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: 9999,
                backgroundColor: '#353437',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <View
                style={{
                  width: '74%',
                  height: '100%',
                  borderRadius: 9999,
                  backgroundColor: '#FFB59C',
                }}
              />
            </View>
          </View>

          {/* Rush Dispatch Notice */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(142, 44, 1, 0.25)',
              paddingHorizontal: 10,
              paddingVertical: 7,
              borderRadius: 8,
            }}
          >
            <Zap size={14} color="#FFB59C" />
            <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#FFB59C' }}>
              Rider is arriving early! Please expedite packaging.
            </Text>
          </View>
        </View>

        {/* 3. Kitchen Workstation Progress */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'PlusJakartaSans_700Bold',
                fontWeight: '700',
                color: '#E5E1E4',
              }}
            >
              Workstation Progress
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#C8BFFF' }}>
              2 of 3 Stations Complete
            </Text>
          </View>

          {/* Station 1: Grill Station */}
          <View
            style={{
              borderRadius: 16,
              backgroundColor: '#201F21',
              padding: 14,
              borderWidth: 1,
              borderColor: '#2A2A2C',
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: '#353437',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Flame size={16} color="#E5E1E4" />
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                    Grill Station
                  </Text>
                  <Text style={{ fontSize: 10, color: '#928F9E' }}>Lead: Chef Mohan</Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: 'rgba(106, 90, 205, 0.25)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 9999,
                }}
              >
                <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: '#C8BFFF' }}>
                  READY
                </Text>
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#2A2A2C',
                  padding: 8,
                  borderRadius: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <CheckCircle2 size={16} color="#C8BFFF" />
                  <View>
                    <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#E5E1E4' }}>
                      Smoked Texas Pulled Pork
                    </Text>
                    <Text style={{ fontSize: 10, color: '#928F9E' }}>14h slow cooked • Hot hold 68°C</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>1x</Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#2A2A2C',
                  padding: 8,
                  borderRadius: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <CheckCircle2 size={16} color="#C8BFFF" />
                  <View>
                    <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#E5E1E4' }}>
                      BBQ Glazed Chicken Wings (8 pcs)
                    </Text>
                    <Text style={{ fontSize: 10, color: '#928F9E' }}>Hickory charcoal seared • Glazed</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>2x</Text>
              </View>
            </View>
          </View>

          {/* Station 2: Fryer & Assembly Station */}
          <View
            style={{
              borderRadius: 16,
              backgroundColor: '#201F21',
              padding: 14,
              borderWidth: 1,
              borderColor: '#8E2C01',
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: '#8E2C01',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Flame size={16} color="#FFB59C" />
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                    Fryer & Assembly
                  </Text>
                  <Text style={{ fontSize: 10, color: '#928F9E' }}>Lead: Chef Ankit</Text>
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: 'rgba(142, 44, 1, 0.4)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 9999,
                }}
              >
                <View style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: '#FFB59C' }} />
                <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFB59C' }}>
                  In Fryer • 90s left
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: '#353437', borderRadius: 10, padding: 10, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <RefreshCw size={14} color="#FFB59C" />
                  <View>
                    <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#E5E1E4' }}>
                      Truffle Parmesan Hand-cut Fries
                    </Text>
                    <Text style={{ fontSize: 10, color: '#FFB59C' }}>
                      Crispy double fry stage 2 • Hot basket #3
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>1x Lrg</Text>
              </View>
              <View style={{ height: 4, borderRadius: 9999, backgroundColor: '#201F21', overflow: 'hidden' }}>
                <View style={{ width: `${fryerProgress}%`, height: '100%', backgroundColor: '#FFB59C' }} />
              </View>
            </View>
          </View>

          {/* Station 3: Packaging Station */}
          <View
            style={{
              borderRadius: 16,
              backgroundColor: '#201F21',
              padding: 14,
              borderWidth: 1,
              borderColor: '#2A2A2C',
              gap: 8,
              opacity: 0.85,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: '#353437',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PackageCheck size={16} color="#928F9E" />
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                    Packaging & Bagging
                  </Text>
                  <Text style={{ fontSize: 10, color: '#928F9E' }}>Station 04 • Thermal Dispatch</Text>
                </View>
              </View>
              <Text style={{ fontSize: 10, color: '#928F9E', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                Queued
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: '#928F9E', marginLeft: 40 }}>
              Thermal Bag Seal & Steam Vents (Awaiting handoff from Fryer)
            </Text>
          </View>
        </View>

        {/* 4. Customer Special Request Sticky Note */}
        <View
          style={{
            borderRadius: 16,
            backgroundColor: '#201F21',
            padding: 14,
            borderWidth: 1,
            borderColor: '#8E2C01',
            flexDirection: 'row',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: '#FFB59C',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Pin size={18} color="#380C00" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#FFB59C',
                  letterSpacing: 0.5,
                }}
              >
                CUSTOMER KITCHEN MEMO
              </Text>
              <View style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: '#FFB59C' }} />
              <Text style={{ fontSize: 10, color: '#928F9E' }}>Dietary & Pack</Text>
            </View>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans_700Bold',
                fontWeight: '700',
                color: '#E5E1E4',
                marginTop: 4,
              }}
            >
              “Extra spicy glaze dip on the side, no plastic cutlery”
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Leaf size={12} color="#10B981" />
              <Text style={{ fontSize: 11, color: '#FFAA8D', fontFamily: 'PlusJakartaSans_500Medium' }}>
                Cutlery-free eco order verified
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Bottom Kitchen CTAs */}
        <View style={{ gap: 8, marginTop: 4 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark all items prepared and ready"
            onPress={handleMarkReady}
            style={{
              height: 52,
              borderRadius: 16,
              backgroundColor: markedReady ? '#7BD0FF' : '#6A5ACD',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: markedReady ? '#7BD0FF' : '#6A5ACD',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
            }}
          >
            <CheckCircle2 size={20} color={markedReady ? '#001E2C' : '#F0EBFF'} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'PlusJakartaSans_700Bold',
                fontWeight: '700',
                color: markedReady ? '#001E2C' : '#F0EBFF',
              }}
            >
              {markedReady ? 'Order Ready for Pickup!' : 'Mark All Items Prepared & Ready ✓'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add 5 mins prep buffer"
            onPress={handleAddBuffer}
            style={{
              height: 44,
              borderRadius: 14,
              backgroundColor: '#201F21',
              borderWidth: 1,
              borderColor: '#2A2A2C',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Clock size={16} color="#FFB59C" />
            <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#E5E1E4' }}>
              {bufferAdded ? '+5m Buffer Active' : '+ Add 5 Mins Prep Buffer (Notify Rider)'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <VendorStitchNav activeTab="live" />
    </View>
  );
}
