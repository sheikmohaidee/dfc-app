/**
 * Vendor Order Fulfilment & Dispatch Details — Stitch Dark Floating Theme
 * Implements:
 * - 03 — Order Details (Kitchen Checklist, Station Routing, Captain Telemetry, Settlement)
 * - 04 — Accept / Reject Order (Prep Time Matrix 10m/20m/30m/45m, Rejection Guardrails)
 * - 06 — Ready for Handover OTP (Bag Staging, 4-digit code, Bluetooth Beacon, Dispatch Checklist)
 */

import * as React from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Headphones,
  Info,
  Layers,
  Leaf,
  MapPin,
  MessageSquare,
  PackageCheck,
  Phone,
  Printer,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Truck,
  User,
  Utensils,
  Volume2,
  X,
  Zap,
} from 'lucide-react-native';

import { formatInr, type Order } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import { demoStorage } from '@/demo/storage';
import { mockOrderRepository } from '@/demo/repositories/order.repository';

interface ChecklistItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  notes: string;
  station: string;
  prepared: boolean;
}

export default function VendorOrderDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();

  const [order, setOrder] = React.useState<Order | null>(null);
  const [kotPrinting, setKotPrinting] = React.useState(false);
  const [kotPrinted, setKotPrinted] = React.useState(false);

  // Prep Countdown (8 mins 42 secs = 522s)
  const [seconds, setSeconds] = React.useState(522);

  // Interactive Checklist
  const [checklist, setChecklist] = React.useState<ChecklistItem[]>([
    {
      id: 'item-1',
      name: 'Smoked Texas Pulled Pork Brioche',
      qty: 1,
      price: 380,
      notes: 'Slow cooked 14h, brioche bun, apple cider slaw',
      station: 'Pit Smoker',
      prepared: true,
    },
    {
      id: 'item-2',
      name: 'Smoked BBQ Chicken Wings',
      qty: 2,
      price: 580,
      notes: '6 pcs, hickory charred, ranch dip',
      station: 'Charcoal Grill',
      prepared: true,
    },
    {
      id: 'item-3',
      name: 'Truffle Parmesan Hand-cut Fries',
      qty: 1,
      price: 190,
      notes: 'White truffle oil, fresh shaved parmesan, herb dust',
      station: 'Deep Fryer 2',
      prepared: false,
    },
  ]);

  // Handover Checklist (06)
  const [handoverChecks, setHandoverChecks] = React.useState([
    { id: 'h1', title: 'Thermal insulated bag seal applied', sub: 'Tamper-proof sticker #9921 attached', checked: true },
    { id: 'h2', title: 'Food temperature verified hot', sub: 'Sensor logged at 68.4°C (>65°C target)', checked: true },
    { id: 'h3', title: 'Cutlery omission verified', sub: 'Customer opted into Eco Zero-Plastic', checked: true },
    { id: 'h4', title: 'Bill & KOT receipt taped to exterior', sub: 'Barcode facing outwards for scanner', checked: true },
  ]);

  // Modals
  const [prepModalVisible, setPrepModalVisible] = React.useState(false);
  const [rejectModalVisible, setRejectModalVisible] = React.useState(false);
  const [handoverModalVisible, setHandoverModalVisible] = React.useState(false);
  const [handoverSuccess, setHandoverSuccess] = React.useState(false);

  // Prep Selection
  const [selectedPrepMins, setSelectedPrepMins] = React.useState(20);
  const [selectedRejectReason, setSelectedRejectReason] = React.useState<string | null>(null);

  React.useEffect(() => {
    const update = () => {
      const found = (id ? mockOrderRepository.getOrderById(id) : null) || mockOrderRepository.getOrders()[0] || null;
      setOrder(found);
    };
    update();
    const unsub = demoStorage.subscribe(update);
    return unsub;
  }, [id]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const checkedCount = checklist.filter((i) => i.prepared).length;
  const allPrepared = checkedCount === checklist.length;

  const toggleCheck = (itemId: string) => {
    void Haptics.selectionAsync();
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, prepared: !item.prepared } : item,
      ),
    );
  };

  const toggleHandoverCheck = (checkId: string) => {
    void Haptics.selectionAsync();
    setHandoverChecks((prev) =>
      prev.map((c) => (c.id === checkId ? { ...c, checked: !c.checked } : c)),
    );
  };

  const allHandoverVerified = handoverChecks.every((c) => c.checked);

  const handlePrintKOT = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setKotPrinting(true);
    setTimeout(() => {
      setKotPrinting(false);
      setKotPrinted(true);
      setTimeout(() => setKotPrinted(false), 3000);
    }, 1200);
  };

  const handleConfirmHandover = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHandoverSuccess(true);
    if (order?.id) {
      void mockOrderRepository.completePreparation(order.id);
    }
    setTimeout(() => {
      setHandoverModalVisible(false);
      router.replace('/(vendor)/inbox');
    }, 1500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#131315' }}>
      {/* 1. Header Bar */}
      <View
        style={{
          paddingTop: 48,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: 'rgba(19, 19, 21, 0.96)',
          borderBottomWidth: 1,
          borderBottomColor: '#201F21',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: '#201F21',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#2A2A2C',
          }}
        >
          <ArrowLeft size={18} color="#E5E1E4" />
        </Pressable>

        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 10,
              fontFamily: 'PlusJakartaSans_800ExtraBold',
              fontWeight: '800',
              color: '#C8BFFF',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            KITCHEN DISPATCH
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'PlusJakartaSans_700Bold',
              fontWeight: '700',
              color: '#E5E1E4',
              letterSpacing: -0.2,
            }}
          >
            Order Details
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Call Support"
          onPress={() => Alert.alert('Kitchen Support', 'Connecting to DFC Kitchen Operations desk...')}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: '#201F21',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#2A2A2C',
          }}
        >
          <Headphones size={18} color="#E5E1E4" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 120, gap: 14 }}
      >
        {/* Top Sub-Header & KOT Action */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: '#6A5ACD' }} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'PlusJakartaSans_700Bold',
                fontWeight: '700',
                color: '#C8BFFF',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              LIVE KITCHEN TICKET #DFC-8492
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Print KOT"
            onPress={handlePrintKOT}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
              backgroundColor: '#2A2A2C',
            }}
          >
            <Printer size={15} color={kotPrinted ? '#FFB59C' : '#C8BFFF'} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: kotPrinted ? '#FFB59C' : '#E5E1E4',
              }}
            >
              {kotPrinting ? 'Printing...' : kotPrinted ? 'Printed ✓' : 'Print KOT'}
            </Text>
          </Pressable>
        </View>

        {/* 1. Order Status Header Card */}
        <View
          style={{
            borderRadius: 20,
            backgroundColor: '#201F21',
            padding: 16,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.7,
            shadowRadius: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 9999,
                backgroundColor: 'rgba(106, 90, 205, 0.25)',
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#C8BFFF' }} />
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#C8BFFF',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                IN PREPARATION (COOKING)
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10, color: '#928F9E', textTransform: 'uppercase' }}>TIMER TARGET</Text>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#FFB59C',
                }}
              >
                {mm}:{ss}
              </Text>
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="#FFB59C" />
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                Pickup in 9 mins
              </Text>
              <Text style={{ fontSize: 12, color: '#928F9E' }}>• Target: 8:24 PM</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Zap size={14} color="#C8BFFF" />
              <Text style={{ fontSize: 11, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                DFC Gourmet Food Express • Instant Delivery Priority
              </Text>
            </View>
          </View>

          {/* Micro Pipeline Tracker */}
          <View style={{ flexDirection: 'row', gap: 6, paddingTop: 4 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ height: 4, borderRadius: 9999, backgroundColor: '#6A5ACD' }} />
              <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#C8BFFF' }}>
                Accepted (8:11 PM)
              </Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ height: 4, borderRadius: 9999, backgroundColor: '#FFB59C' }} />
              <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#FFB59C' }}>
                In Wok / Oven
              </Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ height: 4, borderRadius: 9999, backgroundColor: '#353437' }} />
              <Text style={{ fontSize: 10, color: '#928F9E' }}>
                Ready for Pickup
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Delivery Partner / Captain Card */}
        <View
          style={{
            borderRadius: 20,
            backgroundColor: '#201F21',
            padding: 16,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: '#353437',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Truck size={24} color="#7BD0FF" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                  Captain Suresh Kumar
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 2,
                    backgroundColor: '#2A2A2C',
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontSize: 10, color: '#FFB59C', fontWeight: '700' }}>4.9 ★</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: '#928F9E', marginTop: 2 }}>
                Ather 450X (EV) • KA-01-MJ-8190
              </Text>
            </View>
          </View>

          {/* Telemetry Status Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#1C1B1D',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color="#7BD0FF" />
              <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#7BD0FF' }}>
                1.2 km away • Arriving in 4 mins
              </Text>
            </View>
            <View
              style={{
                backgroundColor: 'rgba(0, 115, 156, 0.3)',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: '#DBF0FF' }}>
                ON ROUTE
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call Captain"
              onPress={() => Alert.alert('Calling Courier', 'Calling Captain Suresh Kumar (+91 98450 12345)...')}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#2A2A2C',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Phone size={15} color="#C8BFFF" />
              <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#E5E1E4' }}>
                Call Captain
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chat with Captain"
              onPress={() => Alert.alert('Dispatch Chat', 'Opening live chat with Captain Suresh.')}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#2A2A2C',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <MessageSquare size={15} color="#7BD0FF" />
              <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#E5E1E4' }}>
                Chat
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Customer Profile & Special Instructions Box */}
        <View
          style={{
            borderRadius: 20,
            backgroundColor: '#201F21',
            padding: 16,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9999,
                  backgroundColor: 'rgba(106, 90, 205, 0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#C8BFFF' }}>
                  RS
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                  Rahul Sharma
                </Text>
                <Text style={{ fontSize: 11, color: '#C8BFFF', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                  DFC Premier Guest • 42 past orders
                </Text>
              </View>
            </View>
            <ShieldCheck size={18} color="#7BD0FF" />
          </View>

          {/* Highlighted Chef Note Box */}
          <View
            style={{
              backgroundColor: 'rgba(142, 44, 1, 0.25)',
              borderRadius: 12,
              padding: 12,
              flexDirection: 'row',
              gap: 10,
              borderWidth: 1,
              borderColor: '#8E2C01',
            }}
          >
            <AlertCircle size={18} color="#FFB59C" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#FFB59C',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                SPECIAL CHEF & PACKAGING NOTE
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: '#FFAA8D',
                  marginTop: 2,
                  lineHeight: 18,
                }}
              >
                "Please make sure pulled pork is packed in insulated foil. Extra napkins requested."
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Itemized Kitchen Checklist */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Utensils size={16} color="#C8BFFF" />
              <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                Kitchen Assembly Checklist
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: '#C8BFFF' }}>
              {checkedCount} of {checklist.length} Checked
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            {checklist.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => toggleCheck(item.id)}
                style={{
                  borderRadius: 16,
                  backgroundColor: item.prepared ? '#201F21' : '#2A2A2C',
                  padding: 14,
                  borderWidth: 1,
                  borderColor: item.prepared ? '#2A2A2C' : '#8E2C01',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    backgroundColor: item.prepared ? '#6A5ACD' : '#353437',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  {item.prepared ? <Check size={16} color="#F0EBFF" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'PlusJakartaSans_700Bold',
                        color: '#E5E1E4',
                        textDecorationLine: item.prepared ? 'line-through' : 'none',
                        opacity: item.prepared ? 0.75 : 1,
                      }}
                    >
                      {item.qty}x {item.name}
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                      ₹{item.price}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#928F9E', marginTop: 2 }}>{item.notes}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <View
                      style={{
                        backgroundColor: item.prepared ? 'rgba(106, 90, 205, 0.25)' : 'rgba(142, 44, 1, 0.3)',
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: 9999,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontFamily: 'PlusJakartaSans_700Bold',
                          color: item.prepared ? '#C8BFFF' : '#FFB59C',
                        }}
                      >
                        {item.prepared ? 'Prepared ✓' : 'In Progress...'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: '#928F9E' }}>Station: {item.station}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 5. Financial & Settlement Summary */}
        <View
          style={{
            borderRadius: 20,
            backgroundColor: '#201F21',
            padding: 16,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Receipt size={16} color="#C8BFFF" />
              <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                Payout & Financial Breakdown
              </Text>
            </View>
            <View style={{ backgroundColor: '#2A2A2C', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9999 }}>
              <Text style={{ fontSize: 9, color: '#928F9E', fontWeight: '600' }}>Merchant View</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: '#928F9E' }}>Item Subtotal</Text>
            <Text style={{ fontSize: 12, color: '#E5E1E4', fontWeight: '600' }}>₹1,150.00</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: '#928F9E' }}>Packaging Charge</Text>
            <Text style={{ fontSize: 12, color: '#E5E1E4', fontWeight: '600' }}>₹25.00</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: '#928F9E' }}>GST Collected (5%)</Text>
            <Text style={{ fontSize: 12, color: '#E5E1E4', fontWeight: '600' }}>₹58.75</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: '#FFB4AB' }}>DFC Commission (10% + Tax)</Text>
            <Text style={{ fontSize: 12, color: '#FFB4AB', fontWeight: '600' }}>-₹123.75</Text>
          </View>

          <View style={{ height: 1, backgroundColor: '#2A2A2C', marginVertical: 4 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <View>
              <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                Net Merchant Payable
              </Text>
              <Text style={{ fontSize: 10, color: '#928F9E' }}>Credited via instant escrow</Text>
            </View>
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'PlusJakartaSans_800ExtraBold',
                fontWeight: '800',
                color: '#C8BFFF',
              }}
            >
              ₹1,110.00
            </Text>
          </View>

          <View
            style={{
              backgroundColor: '#1C1B1D',
              borderRadius: 10,
              padding: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
            }}
          >
            <ShieldCheck size={14} color="#7BD0FF" />
            <Text style={{ fontSize: 11, color: '#928F9E' }}>
              <Text style={{ color: '#E5E1E4', fontWeight: '700' }}>Paid Online via UPI</Text> • Auto-settles tomorrow at 6:00 AM
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24,
          backgroundColor: 'rgba(19, 19, 21, 0.96)',
          borderTopWidth: 1,
          borderTopColor: '#201F21',
          flexDirection: 'row',
          gap: 10,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reprint KOT"
          onPress={handlePrintKOT}
          style={{
            flex: 1,
            height: 50,
            borderRadius: 14,
            backgroundColor: '#2A2A2C',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Printer size={16} color="#928F9E" />
          <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#E5E1E4' }}>
            Reprint KOT
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ready for Pickup / Handover"
          onPress={() => setHandoverModalVisible(true)}
          style={{
            flex: 1.6,
            height: 50,
            borderRadius: 14,
            backgroundColor: allPrepared ? '#FFB59C' : '#6A5ACD',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            shadowColor: allPrepared ? '#FFB59C' : '#6A5ACD',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_700Bold',
              fontWeight: '700',
              color: allPrepared ? '#380C00' : '#F0EBFF',
            }}
          >
            {allPrepared ? 'Handover to Captain Suresh →' : 'Mark Ready for Pickup →'}
          </Text>
        </Pressable>
      </View>

      {/* Handover OTP Modal (06 — Ready for Handover OTP) */}
      <Modal
        visible={handoverModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHandoverModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#1C1B1D',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              gap: 14,
              maxHeight: '85%',
              borderWidth: 1,
              borderColor: '#2A2A2C',
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#2A2A2C',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 9999,
                    alignSelf: 'flex-start',
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#7BD0FF' }} />
                  <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#7BD0FF' }}>
                    PICKUP READY
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#E5E1E4',
                    marginTop: 4,
                  }}
                >
                  Waiting for Rider Handover
                </Text>
              </View>
              <Pressable
                onPress={() => setHandoverModalVisible(false)}
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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {/* Bag Token Tag */}
              <View
                style={{
                  backgroundColor: '#201F21',
                  borderRadius: 14,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <PackageCheck size={22} color="#C8BFFF" />
                  <View>
                    <Text style={{ fontSize: 10, color: '#928F9E', textTransform: 'uppercase', fontWeight: '700' }}>
                      STORAGE STAGING
                    </Text>
                    <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                      Bag #B-14 • Rack 2
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#2A2A2C', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, color: '#FFB59C', fontWeight: '700' }}>Thermal Shelf</Text>
                </View>
              </View>

              {/* Secure 4-Digit Handover Code */}
              <View style={{ backgroundColor: '#201F21', borderRadius: 16, padding: 14, gap: 8 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#C8BFFF',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}
                >
                  SECURE HANDOVER CODE
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginVertical: 6 }}>
                  {['4', '8', '1', '9'].map((digit, idx) => (
                    <View
                      key={idx}
                      style={{
                        width: 54,
                        height: 58,
                        borderRadius: 14,
                        backgroundColor: '#2A2A2C',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#353437',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 26,
                          fontFamily: 'PlusJakartaSans_800ExtraBold',
                          fontWeight: '800',
                          color: '#E5E1E4',
                        }}
                      >
                        {digit}
                      </Text>
                    </View>
                  ))}
                </View>
                <View
                  style={{
                    backgroundColor: '#1C1B1D',
                    borderRadius: 10,
                    padding: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={14} color="#C8BFFF" />
                  <Text style={{ fontSize: 11, color: '#C8BFFF', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    OTP Verified Automatically via Bluetooth Beacon
                  </Text>
                </View>
              </View>

              {/* Handover Protocol Checklist */}
              <View style={{ backgroundColor: '#201F21', borderRadius: 16, padding: 14, gap: 8 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#928F9E',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}
                >
                  HANDOVER PROTOCOL CHECKLIST
                </Text>
                <View style={{ gap: 6 }}>
                  {handoverChecks.map((chk) => (
                    <Pressable
                      key={chk.id}
                      onPress={() => toggleHandoverCheck(chk.id)}
                      style={{
                        backgroundColor: '#2A2A2C',
                        borderRadius: 12,
                        padding: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          backgroundColor: chk.checked ? '#6A5ACD' : '#353437',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {chk.checked ? <Check size={14} color="#F0EBFF" /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: '#E5E1E4', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                          {chk.title}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#928F9E' }}>{chk.sub}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Confirm Handover Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirm Handover to Captain Suresh"
                onPress={handleConfirmHandover}
                style={{
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: allHandoverVerified ? '#6A5ACD' : '#353437',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <Zap size={18} color={allHandoverVerified ? '#F0EBFF' : '#928F9E'} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'PlusJakartaSans_700Bold',
                    fontWeight: '700',
                    color: allHandoverVerified ? '#F0EBFF' : '#928F9E',
                  }}
                >
                  {handoverSuccess ? 'Handover Confirmed ✓' : 'Confirm Handover to Captain Suresh'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
