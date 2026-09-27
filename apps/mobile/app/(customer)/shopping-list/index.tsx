/**
 * Stitch 07 — Shopping List Home Screen
 * Multimodal AI Scanner & List Manager:
 * - Segmented tabs: Create List / Saved Lists
 * - AI Multimodal Scanner Hero (Camera, Voice, Previous Orders, Manual)
 * - Starter Templates carousel
 * - Saved Lists stack with progress & mapped values
 * - StitchHeader & StitchNav
 */

import * as React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Camera,
  Check,
  ChevronRight,
  Clock,
  FileText,
  History,
  ListChecks,
  Mic,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formatInr } from '@dfc/core';
import { takePhoto, startRecording, stopRecording, cancelRecording } from '@/lib/media';
import { extractOrder, fallbackExtraction } from '@/lib/ai';
import { FloatingCard, GlowBadge, Screen } from '@/ui';
import { DFCPressable } from '@/ui/animated';
import { StitchHeader } from '@/ui/stitch-header';
import { StitchNav } from '@/ui/stitch-nav';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked?: boolean;
  mappedPricePaise?: number;
}

export interface ShoppingList {
  id: string;
  title: string;
  createdAt: number;
  itemCount: number;
  sourceKind: 'ocr' | 'voice' | 'manual' | 'template';
  items: ShoppingListItem[];
}

const STORAGE_KEY = 'dfc.shopping_lists.v1';

const SEED_LISTS: ShoppingList[] = [
  {
    id: 'list-weekly-1',
    title: 'Weekly Grocery & Provisions',
    createdAt: Date.now() - 86400000 * 2,
    itemCount: 5,
    sourceKind: 'template',
    items: [
      { id: '1', name: 'Ponni Boiled Rice', quantity: 5, unit: 'kg', mappedPricePaise: 32000, checked: true },
      { id: '2', name: 'Aavin Green Milk', quantity: 2, unit: 'L', mappedPricePaise: 9600, checked: true },
      { id: '3', name: 'Toor Dal First Quality', quantity: 1, unit: 'kg', mappedPricePaise: 16500 },
      { id: '4', name: 'Gold Winner Sunflower Oil', quantity: 1, unit: 'L', mappedPricePaise: 14500 },
      { id: '5', name: 'Madurai Country Eggs', quantity: 6, unit: 'pcs', mappedPricePaise: 4200 },
    ],
  },
  {
    id: 'list-pooja-2',
    title: 'Friday Pooja Essentials',
    createdAt: Date.now() - 86400000 * 5,
    itemCount: 4,
    sourceKind: 'ocr',
    items: [
      { id: 'p1', name: 'Malli Flowers (Madurai Jasmine)', quantity: 2, unit: 'muzham', mappedPricePaise: 8000, checked: true },
      { id: 'p2', name: 'Cycle Pure Agarbatti', quantity: 1, unit: 'pack', mappedPricePaise: 4500 },
      { id: 'p3', name: 'Pure Cow Ghee', quantity: 200, unit: 'ml', mappedPricePaise: 15000 },
      { id: 'p4', name: 'Karpooram (Camphor)', quantity: 1, unit: 'box', mappedPricePaise: 3500 },
    ],
  },
];

export default function ShoppingListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'create' | 'saved'>('create');
  const [lists, setLists] = React.useState<ShoppingList[]>(SEED_LISTS);
  const [loading, setLoading] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [showManualModal, setShowManualModal] = React.useState(false);
  const [manualTitle, setManualTitle] = React.useState('');
  const [manualText, setManualText] = React.useState('');

  React.useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setLists(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const saveLists = async (newLists: ShoppingList[]) => {
    setLists(newLists);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLists));
  };

  // 1. Take Photo Scanner
  const handleCameraScan = async () => {
    try {
      setLoading(true);
      const capture = await takePhoto();
      if (!capture) return;

      const aiRes = await extractOrder({
        kind: 'photo',
        base64: capture.base64,
        mimeType: capture.mimeType,
      }).catch(() => ({
        extraction: fallbackExtraction('Photo items'),
      }));

      const parsedItems: ShoppingListItem[] = aiRes.extraction.items.map((i, idx) => ({
        id: `ocr-${Date.now()}-${idx}`,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        mappedPricePaise: (i as any).unitPricePaise
          ? (i as any).unitPricePaise * i.quantity
          : i.estimatedPriceRupees
          ? i.estimatedPriceRupees * 100
          : 5000,
      }));

      const newList: ShoppingList = {
        id: `list-${Date.now()}`,
        title: aiRes.extraction.summary || 'Paper Note Scan',
        createdAt: Date.now(),
        itemCount: parsedItems.length,
        sourceKind: 'ocr',
        items: parsedItems,
      };

      const updated = [newList, ...lists];
      await saveLists(updated);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/(customer)/shopping-list/${newList.id}` as any);
    } catch (e) {
      Alert.alert('Scan Failed', 'Could not parse handwritten list. Please try again or type manually.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Voice Dictation
  const handleVoiceRecordStart = async () => {
    try {
      await startRecording();
      setRecording(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const handleVoiceRecordStop = async () => {
    if (!recording) return;
    setRecording(false);
    setLoading(true);
    try {
      const capture = await stopRecording();
      if (!capture || capture.durationMs < 700) {
        await cancelRecording();
        return;
      }

      const aiRes = await extractOrder({
        kind: 'voice',
        base64: capture.base64,
        mimeType: capture.mimeType,
      }).catch(() => ({
        extraction: fallbackExtraction('Milk, eggs, rice'),
      }));

      const parsedItems: ShoppingListItem[] = aiRes.extraction.items.map((i, idx) => ({
        id: `voice-${Date.now()}-${idx}`,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        mappedPricePaise: (i as any).unitPricePaise
          ? (i as any).unitPricePaise * i.quantity
          : i.estimatedPriceRupees
          ? i.estimatedPriceRupees * 100
          : 4500,
      }));

      const newList: ShoppingList = {
        id: `list-${Date.now()}`,
        title: aiRes.extraction.summary || 'Voice Dictated List',
        createdAt: Date.now(),
        itemCount: parsedItems.length,
        sourceKind: 'voice',
        items: parsedItems,
      };

      const updated = [newList, ...lists];
      await saveLists(updated);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/(customer)/shopping-list/${newList.id}` as any);
    } catch {
      Alert.alert('Voice Failed', 'Could not process audio. Please try speaking clearly.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Create from Starter Template
  const handleTemplateSelect = async (templateName: string, items: Array<{ name: string; qty: number; unit: string; price: number }>) => {
    void Haptics.selectionAsync();
    const newList: ShoppingList = {
      id: `list-${Date.now()}`,
      title: templateName,
      createdAt: Date.now(),
      itemCount: items.length,
      sourceKind: 'template',
      items: items.map((it, idx) => ({
        id: `tpl-${Date.now()}-${idx}`,
        name: it.name,
        quantity: it.qty,
        unit: it.unit,
        mappedPricePaise: it.price,
      })),
    };

    const updated = [newList, ...lists];
    await saveLists(updated);
    router.push(`/(customer)/shopping-list/${newList.id}` as any);
  };

  // 4. Save Manual List
  const handleCreateManual = async () => {
    if (!manualText.trim()) return;
    const lines = manualText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsedItems: ShoppingListItem[] = lines.map((line, idx) => ({
      id: `man-${Date.now()}-${idx}`,
      name: line,
      quantity: 1,
      unit: 'item',
      mappedPricePaise: 4000,
    }));

    const newList: ShoppingList = {
      id: `list-${Date.now()}`,
      title: manualTitle.trim() || 'Custom Shopping List',
      createdAt: Date.now(),
      itemCount: parsedItems.length,
      sourceKind: 'manual',
      items: parsedItems,
    };

    const updated = [newList, ...lists];
    await saveLists(updated);
    setShowManualModal(false);
    setManualTitle('');
    setManualText('');
    router.push(`/(customer)/shopping-list/${newList.id}` as any);
  };

  const deleteList = async (listId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = lists.filter((l) => l.id !== listId);
    await saveLists(updated);
  };

  return (
    <Screen edges={['top']} className="bg-surface-container-lowest">
      <StitchHeader
        title="Smart Shopping List"
        subtitle="Multimodal AI note & cart matcher"
        showNotifications
        showCart
      />

      {/* Segmented Control Bar */}
      <View className="px-4 pt-3 pb-2">
        <View
          style={{
            backgroundColor: '#1C1B1D',
            borderColor: '#2A2A2C',
            borderWidth: 1,
            borderRadius: 14,
            padding: 4,
            flexDirection: 'row',
          }}
        >
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setActiveTab('create');
            }}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: activeTab === 'create' ? '#6A5ACD' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: activeTab === 'create' ? '700' : '500',
                color: activeTab === 'create' ? '#FFFFFF' : '#928F9E',
              }}
            >
              + Create New List
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setActiveTab('saved');
            }}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: activeTab === 'saved' ? '#6A5ACD' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: activeTab === 'saved' ? '700' : '500',
                color: activeTab === 'saved' ? '#FFFFFF' : '#928F9E',
              }}
            >
              My Saved Lists ({lists.length})
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 110 }}
      >
        {activeTab === 'create' ? (
          <>
            {/* AI Multimodal Hero Scanner Card */}
            <FloatingCard glow className="p-4 mb-4 bg-surface-container-low border-primary/30">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <Sparkles size={16} color="#C8BFFF" />
                  <Text className="text-xs font-bold text-primary tracking-wider uppercase">
                    AI Multimodal Scanner
                  </Text>
                </View>
                <GlowBadge label="OCR READY" tone="primary" />
              </View>

              <Text className="text-lg font-bold text-on-surface mb-1">
                Zero-Typing Shopping Lists
              </Text>
              <Text className="text-xs text-on-surface-variant leading-5 mb-4">
                Snap a handwritten paper slip, upload a recipe, or hold the mic to dictate your groceries. Our AI parses quantities and matches live local stock.
              </Text>

              {/* 4 Input Channel Grid */}
              <View className="flex-row flex-wrap justify-between gap-y-2.5">
                {/* 1. Camera Photo */}
                <DFCPressable
                  scaleTo={0.94}
                  onPress={handleCameraScan}
                  style={{
                    width: '48.5%',
                    backgroundColor: '#1C1B1D',
                    borderColor: '#353437',
                    borderWidth: 1,
                    borderRadius: 14,
                    padding: 12,
                    alignItems: 'center',
                    shadowColor: '#000000',
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: 'rgba(106, 90, 205, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Camera size={20} color="#C8BFFF" />
                  </View>
                  <Text className="text-xs font-bold text-on-surface text-center mb-0.5">
                    Snap Photo
                  </Text>
                  <Text className="text-[10px] text-on-surface-variant text-center">
                    Handwritten notes
                  </Text>
                </DFCPressable>

                {/* 2. Voice Dictation */}
                <Pressable
                  onPressIn={handleVoiceRecordStart}
                  onPressOut={handleVoiceRecordStop}
                  style={{
                    width: '48.5%',
                    backgroundColor: recording ? 'rgba(147, 0, 10, 0.25)' : '#1C1B1D',
                    borderColor: recording ? '#FFB4AB' : '#353437',
                    borderWidth: 1,
                    borderRadius: 14,
                    padding: 12,
                    alignItems: 'center',
                    shadowColor: '#000000',
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: recording ? '#93000A' : 'rgba(217, 119, 6, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Mic size={20} color={recording ? '#FFFFFF' : '#FCD34D'} />
                  </View>
                  <Text className="text-xs font-bold text-on-surface text-center mb-0.5">
                    {recording ? 'Listening...' : 'Hold to Speak'}
                  </Text>
                  <Text className="text-[10px] text-on-surface-variant text-center">
                    Tamil or English voice
                  </Text>
                </Pressable>

                {/* 3. From Previous Orders */}
                <DFCPressable
                  scaleTo={0.94}
                  onPress={() => router.push('/(customer)/orders')}
                  style={{
                    width: '48.5%',
                    backgroundColor: '#1C1B1D',
                    borderColor: '#353437',
                    borderWidth: 1,
                    borderRadius: 14,
                    padding: 12,
                    alignItems: 'center',
                    shadowColor: '#000000',
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: 'rgba(10, 106, 50, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <History size={20} color="#6EE7B7" />
                  </View>
                  <Text className="text-xs font-bold text-on-surface text-center mb-0.5">
                    Previous Orders
                  </Text>
                  <Text className="text-[10px] text-on-surface-variant text-center">
                    1-tap re-import
                  </Text>
                </DFCPressable>

                {/* 4. Manual Text */}
                <DFCPressable
                  scaleTo={0.94}
                  onPress={() => setShowManualModal(true)}
                  style={{
                    width: '48.5%',
                    backgroundColor: '#1C1B1D',
                    borderColor: '#353437',
                    borderWidth: 1,
                    borderRadius: 14,
                    padding: 12,
                    alignItems: 'center',
                    shadowColor: '#000000',
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: 'rgba(0, 115, 156, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <FileText size={20} color="#7BD0FF" />
                  </View>
                  <Text className="text-xs font-bold text-on-surface text-center mb-0.5">
                    Type Manually
                  </Text>
                  <Text className="text-[10px] text-on-surface-variant text-center">
                    Quick text lines
                  </Text>
                </DFCPressable>
              </View>
            </FloatingCard>

            {/* Quick Starter Templates */}
            <Text className="text-sm font-bold text-on-surface uppercase tracking-wider mb-2.5">
              Quick Starter Templates
            </Text>

            <View className="gap-2.5 mb-5">
              {[
                {
                  title: 'South Indian Breakfast Kit',
                  itemsCount: 4,
                  estTotal: '₹220',
                  items: [
                    { name: 'Idli Dosa Batter (1kg)', qty: 1, unit: 'kg', price: 6500 },
                    { name: 'Aavin Full Cream Milk (500ml)', qty: 2, unit: 'pkts', price: 6000 },
                    { name: 'Narasus Coffee Powder', qty: 1, unit: 'pkt', price: 6500 },
                    { name: 'Country Eggs (6 pcs)', qty: 1, unit: 'pack', price: 3000 },
                  ],
                },
                {
                  title: 'Monthly Cleaning & Hygiene Pack',
                  itemsCount: 4,
                  estTotal: '₹340',
                  items: [
                    { name: 'Surf Excel Quick Wash', qty: 1, unit: 'kg', price: 14500 },
                    { name: 'Vim Dishwash Gel 500ml', qty: 1, unit: 'btl', price: 9500 },
                    { name: 'Lizol Floor Cleaner Citrus', qty: 1, unit: 'btl', price: 7500 },
                    { name: 'Scotch Brite Scrub Pad (3x)', qty: 1, unit: 'pack', price: 2500 },
                  ],
                },
                {
                  title: 'Fresh Daily Salad & Fruits',
                  itemsCount: 4,
                  estTotal: '₹195',
                  items: [
                    { name: 'Robusta Bananas', qty: 6, unit: 'pcs', price: 4000 },
                    { name: 'Country Cucumbers', qty: 500, unit: 'g', price: 3500 },
                    { name: 'Farm Fresh Tomatoes', qty: 1, unit: 'kg', price: 4000 },
                    { name: 'Pomegranate Seeds Cup', qty: 1, unit: 'cup', price: 8000 },
                  ],
                },
              ].map((tpl, i) => (
                <DFCPressable
                  key={i}
                  scaleTo={0.97}
                  onPress={() => handleTemplateSelect(tpl.title, tpl.items)}
                  style={{
                    backgroundColor: '#1C1B1D',
                    borderColor: '#2A2A2C',
                    borderWidth: 1,
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    shadowColor: '#000000',
                    shadowOpacity: 0.15,
                    shadowRadius: 5,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-sm font-bold text-on-surface mb-0.5">
                      {tpl.title}
                    </Text>
                    <Text className="text-xs text-on-surface-variant">
                      {tpl.itemsCount} curated items · Est. {tpl.estTotal}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1 bg-surface-container-highest px-2.5 py-1.5 rounded-lg">
                    <Text className="text-xs font-bold text-primary">Use</Text>
                    <ChevronRight size={13} color="#C8BFFF" strokeWidth={2.5} />
                  </View>
                </DFCPressable>
              ))}
            </View>
          </>
        ) : (
          /* Saved Lists Tab */
          <View className="gap-3">
            {lists.map((list) => {
              const checkedCount = list.items.filter((it) => it.checked).length;
              const totalPaise = list.items.reduce((acc, it) => acc + (it.mappedPricePaise || 0), 0);

              return (
                <DFCPressable
                  key={list.id}
                  scaleTo={0.975}
                  onPress={() => router.push(`/(customer)/shopping-list/${list.id}` as any)}
                  style={{
                    backgroundColor: '#1C1B1D',
                    borderColor: '#2A2A2C',
                    borderWidth: 1,
                    borderRadius: 18,
                    padding: 16,
                    shadowColor: '#000000',
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 3,
                  }}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-base font-bold text-on-surface mb-0.5">
                        {list.title}
                      </Text>
                      <Text className="text-xs text-on-surface-variant">
                        {list.items.length} items · Est. {formatInr(totalPaise)}
                      </Text>
                    </View>

                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        void deleteList(list.id);
                      }}
                      hitSlop={8}
                      className="p-1"
                    >
                      <Trash2 size={16} color="#928F9E" />
                    </Pressable>
                  </View>

                  {/* Progress segment */}
                  <View className="h-1.5 rounded-full bg-surface-container-highest mb-2.5 overflow-hidden">
                    <View
                      style={{
                        width: `${list.items.length > 0 ? (checkedCount / list.items.length) * 100 : 0}%`,
                        height: '100%',
                        backgroundColor: '#6A5ACD',
                      }}
                    />
                  </View>

                  <View className="flex-row items-center justify-between pt-1">
                    <Text className="text-xs text-on-surface-variant">
                      {checkedCount}/{list.items.length} items gathered
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-xs font-bold text-primary">Open List</Text>
                      <ChevronRight size={13} color="#C8BFFF" strokeWidth={2.5} />
                    </View>
                  </View>
                </DFCPressable>
              );
            })}

            {lists.length === 0 ? (
              <View className="items-center py-12">
                <ListChecks size={36} color="#928F9E" />
                <Text className="text-sm font-bold text-on-surface mt-3">No saved lists yet</Text>
                <Text className="text-xs text-on-surface-variant text-center mt-1 mb-4">
                  Create your first list by snapping a photo or choosing a template.
                </Text>
                <Pressable
                  onPress={() => setActiveTab('create')}
                  style={{
                    backgroundColor: '#6A5ACD',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 9999,
                  }}
                >
                  <Text className="text-xs font-bold text-white">Create List Now</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Manual Input Modal */}
      <Modal visible={showManualModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/70">
          <View
            style={{
              backgroundColor: '#1C1B1D',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: '80%',
            }}
          >
            <View className="flex-row items-center justify-between border-b border-surface-container-highest pb-3 mb-4">
              <Text className="text-base font-bold text-on-surface">Enter List Manually</Text>
              <Pressable onPress={() => setShowManualModal(false)}>
                <Text className="text-xs font-bold text-primary">Cancel</Text>
              </Pressable>
            </View>

            <TextInput
              value={manualTitle}
              onChangeText={setManualTitle}
              placeholder="List Name (e.g. Sunday Cooking)"
              placeholderTextColor="#928F9E"
              style={{
                backgroundColor: '#131315',
                borderColor: '#2A2A2C',
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: '#E5E1E4',
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 12,
              }}
            />

            <TextInput
              value={manualText}
              onChangeText={setManualText}
              placeholder="Enter items one per line:&#10;5kg Ponni Rice&#10;1L Sunflower Oil&#10;100g Cardamom"
              placeholderTextColor="#928F9E"
              multiline
              numberOfLines={6}
              style={{
                backgroundColor: '#131315',
                borderColor: '#2A2A2C',
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: '#E5E1E4',
                fontSize: 13.5,
                textAlignVertical: 'top',
                minHeight: 120,
                marginBottom: 16,
              }}
            />

            <Pressable
              onPress={handleCreateManual}
              style={{
                backgroundColor: '#6A5ACD',
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                Build Shopping List
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <StitchNav activeTab="list" />
    </Screen>
  );
}
