/**
 * Stitch 02 — Services Hub Screen
 * Full-page services directory displaying DFC Core Ecosystem,
 * real-time status badges, search filter, and guarantee cards.
 */

import * as React from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Utensils,
  ShoppingBag,
  Printer,
  Package,
  Truck,
  ShoppingBag as BagIcon,
  Search,
  ChevronRight,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { Screen, T, Ta, FloatingCard, GlowBadge } from '@/ui';
import { ServiceCard } from '@/ui/cards';
import { StitchHeader } from '@/ui/stitch-header';
import { StitchNav } from '@/ui/stitch-nav';

interface ServiceItem {
  id: string;
  title: string;
  titleTa: string;
  subtitle: string;
  eta: string;
  badge: string;
  badgeTone: 'primary' | 'secondary' | 'tertiary' | 'success' | 'verify';
  route: string;
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  tags: string[];
}

export default function ServicesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'fast' | 'courier' | 'custom'>('all');

  const services: (ServiceItem & { imageUrl: string })[] = [
    {
      id: 'food',
      title: 'Food & Messes',
      titleTa: 'உணவு மற்றும் மெஸ்',
      subtitle: 'Authentic local cuisine, Madurai parotta, biryani & homestyle mess meals delivered steaming hot.',
      eta: '20-35 mins',
      badge: 'HOT MEALS',
      badgeTone: 'secondary',
      route: '/(customer)/food',
      imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
      icon: <Utensils size={22} color="#FFB59C" strokeWidth={2.2} />,
      iconBg: 'rgba(142, 44, 1, 0.25)',
      iconBorder: 'rgba(255, 181, 156, 0.3)',
      tags: ['food', 'mess', 'biryani', 'dinner', 'lunch', 'fast'],
    },
    {
      id: 'grocery',
      title: 'Supermarket & Essentials',
      titleTa: 'மளிகை & காய்கறிகள்',
      subtitle: 'Fresh vegetables, dairy, snacks & household pantry staples directly dispatched in minutes.',
      eta: '12-20 mins',
      badge: '15-MIN DISPATCH',
      badgeTone: 'success',
      route: '/(customer)/grocery',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
      icon: <ShoppingBag size={22} color="#6EE7B7" strokeWidth={2.2} />,
      iconBg: 'rgba(6, 78, 59, 0.3)',
      iconBorder: 'rgba(110, 231, 183, 0.3)',
      tags: ['grocery', 'vegetables', 'milk', 'snacks', 'fast'],
    },
    {
      id: 'print',
      title: 'Doorstep Print & Xerox',
      titleTa: 'ஜெராக்ஸ் & பிரிண்டிங்',
      subtitle: 'Upload documents, college assignments or contracts. High-quality printout delivered sealed.',
      eta: '25-40 mins',
      badge: 'CONFIDENTIAL',
      badgeTone: 'tertiary',
      route: '/(customer)/print',
      imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=80',
      icon: <Printer size={22} color="#7BD0FF" strokeWidth={2.2} />,
      iconBg: 'rgba(0, 115, 156, 0.25)',
      iconBorder: 'rgba(123, 208, 255, 0.3)',
      tags: ['print', 'xerox', 'documents', 'pdf', 'custom'],
    },
    {
      id: 'genie',
      title: 'Genie Custom Errands',
      titleTa: 'ஜீனி ஸ்பெஷல் சேவைகள்',
      subtitle: 'Anything you need done in Madurai. Forgotten keys, medicine fetch, tailoring pickup & more.',
      eta: '30-45 mins',
      badge: 'PERSONAL RUNNER',
      badgeTone: 'primary',
      route: '/(customer)/genie',
      imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&q=80',
      icon: <Package size={22} color="#C8BFFF" strokeWidth={2.2} />,
      iconBg: 'rgba(106, 90, 205, 0.25)',
      iconBorder: 'rgba(200, 191, 255, 0.3)',
      tags: ['genie', 'errand', 'custom', 'task'],
    },
    {
      id: 'pickup_drop',
      title: 'Direct Pickup & Drop',
      titleTa: 'பிக்அப் & டெலிவரி',
      subtitle: 'Fast point-to-point intra-city package transit with real-time GPS tracking & secure OTP release.',
      eta: '20-30 mins',
      badge: 'POINT TO POINT',
      badgeTone: 'verify',
      route: '/(customer)/pickup-drop',
      imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80',
      icon: <Truck size={22} color="#FCD34D" strokeWidth={2.2} />,
      iconBg: 'rgba(217, 119, 6, 0.2)',
      iconBorder: 'rgba(253, 230, 138, 0.3)',
      tags: ['pickup', 'drop', 'courier', 'package'],
    },
    {
      id: 'buy_deliver',
      title: 'Buy & Deliver',
      titleTa: 'வாங்கி தருதல்',
      subtitle: 'Tell our rider what to buy from any specific shop, medical hall or market stall in town.',
      eta: '35-50 mins',
      badge: 'ANY LOCAL STORE',
      badgeTone: 'tertiary',
      route: '/(customer)/buy-deliver',
      imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80',
      icon: <BagIcon size={22} color="#7BD0FF" strokeWidth={2.2} />,
      iconBg: 'rgba(0, 115, 156, 0.25)',
      iconBorder: 'rgba(123, 208, 255, 0.3)',
      tags: ['buy', 'deliver', 'store', 'shop', 'courier', 'custom'],
    },
  ];

  const filteredServices = services.filter((s) => {
    // Filter by category pill
    if (activeFilter === 'fast' && !s.tags.includes('fast')) return false;
    if (activeFilter === 'courier' && !s.tags.includes('courier')) return false;
    if (activeFilter === 'custom' && !s.tags.includes('custom')) return false;

    // Filter by text search
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q) ||
      s.titleTa.toLowerCase().includes(q) ||
      s.tags.some((t) => t.includes(q))
    );
  });

  return (
    <Screen edges={['top']} className="bg-surface-container-lowest">
      <StitchHeader title="DFC Ecosystem" subtitle="6 Active City Hubs" showNotifications showCart />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 }}
      >
        {/* Banner Card */}
        <FloatingCard glow className="p-4 mb-4 bg-surface-container-low border-primary/20">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={16} color="#C8BFFF" />
              <Text className="text-xs font-bold text-primary tracking-wider uppercase">
                DFC SuperApp Hub
              </Text>
            </View>
            <GlowBadge label="ALL HUBS LIVE" tone="success" />
          </View>
          <Text className="text-xl font-bold text-on-surface mb-1">
            Anything, Anywhere in Town
          </Text>
          <Text className="text-xs text-on-surface-variant leading-5">
            Every urban service unified under single-order accountability, verified local Captains, and zero surge pricing.
          </Text>
        </FloatingCard>

        {/* Search Bar */}
        <View
          style={{
            backgroundColor: '#1C1B1D',
            borderColor: '#2A2A2C',
            borderWidth: 1,
            borderRadius: 16,
          }}
          className="h-12 flex-row items-center px-3.5 mb-3"
        >
          <Search size={18} color="#928F9E" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search all services, errands, food..."
            placeholderTextColor="#928F9E"
            style={{
              flex: 1,
              marginLeft: 10,
              color: '#E5E1E4',
              fontSize: 14,
              fontWeight: '500',
            }}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text className="text-xs font-semibold text-primary">Clear</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
        >
          {[
            { id: 'all', label: 'All Services' },
            { id: 'fast', label: '⚡ Ultra Fast (<20m)' },
            { id: 'courier', label: '📦 Courier & Transit' },
            { id: 'custom', label: '✨ Custom Tasks' },
          ].map((pill) => {
            const active = activeFilter === pill.id;
            return (
              <Pressable
                key={pill.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setActiveFilter(pill.id as any);
                }}
                style={{
                  backgroundColor: active ? '#6A5ACD' : '#1C1B1D',
                  borderColor: active ? '#6A5ACD' : '#2A2A2C',
                  borderWidth: 1,
                  borderRadius: 9999,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: active ? '700' : '500',
                    color: active ? '#FFFFFF' : '#C9C4D5',
                  }}
                >
                  {pill.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Service Cards Stack */}
        <View className="gap-4 mb-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              title={service.title}
              titleTa={service.titleTa}
              subtitle={service.subtitle}
              eta={service.eta}
              badge={service.badge}
              badgeTone={service.badgeTone}
              icon={service.icon}
              iconBg={service.iconBg}
              iconBorder={service.iconBorder}
              imageUrl={service.imageUrl}
              onPress={() => {
                void Haptics.selectionAsync();
                router.push(service.route as any);
              }}
            />
          ))}

          {filteredServices.length === 0 ? (
            <View className="items-center py-12 px-6">
              <Package size={40} color="#928F9E" />
              <Text className="text-base font-bold text-on-surface mt-3">
                No matching service found
              </Text>
              <Text className="text-xs text-on-surface-variant text-center mt-1 mb-4">
                Don't worry — our Genie errand runners can handle virtually any custom request in Madurai.
              </Text>
              <Pressable
                onPress={() => router.push('/(customer)/genie')}
                style={{
                  backgroundColor: '#6A5ACD',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 9999,
                }}
              >
                <Text className="text-xs font-bold text-white">Create Genie Request</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* DFC Guarantee Sheet Card */}
        <FloatingCard className="p-4 bg-surface-container-low border-surface-container-high">
          <View className="flex-row items-center gap-2 mb-3">
            <ShieldCheck size={18} color="#6EE7B7" />
            <Text className="text-sm font-bold text-on-surface">The DFC Service Commitment</Text>
          </View>
          <View className="gap-2.5">
            <View className="flex-row items-center gap-2.5">
              <View className="w-1.5 h-1.5 rounded-full bg-primary" />
              <Text className="text-xs text-on-surface-variant flex-1">
                Verified Police-cleared town Captains equipped with live GPS tracking
              </Text>
            </View>
            <View className="flex-row items-center gap-2.5">
              <View className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <Text className="text-xs text-on-surface-variant flex-1">
                Direct WhatsApp and Call line with your delivery Captain at all times
              </Text>
            </View>
            <View className="flex-row items-center gap-2.5">
              <View className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              <Text className="text-xs text-on-surface-variant flex-1">
                Zero surge charges inside municipal limits — transparent flat distance billing
              </Text>
            </View>
          </View>
        </FloatingCard>
      </ScrollView>

      <StitchNav activeTab="services" />
    </Screen>
  );
}
