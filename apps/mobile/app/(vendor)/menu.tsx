/**
 * Vendor Menu & Catalogue Management.
 *
 * Allows merchants to add/remove products and toggle ON/OFF availability in real-time.
 */

import * as React from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react-native';

import {
  formatInr,
  toPaise,
  type Product,
} from '@dfc/core';

import { useAuth } from '@/providers/auth';
import {
  vendorAddProduct,
  vendorDeleteProduct,
  vendorSubscribeProducts,
  vendorToggleProduct,
} from '@/lib/orders';
import { Card, Empty, Loading, Num, Screen, T, Ta } from '@/ui';

export default function VendorMenu() {
  const router = useRouter();
  const { profile } = useAuth();
  const storeId = profile?.storeId ?? 'amma-mini-mart';

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Add Item Modal State
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [nameTa, setNameTa] = React.useState('');
  const [unit, setUnit] = React.useState('1 kg');
  const [sellPrice, setSellPrice] = React.useState('100');
  const [mrpPrice, setMrpPrice] = React.useState('110');
  const [stockQty, setStockQty] = React.useState('20');
  const [addBusy, setAddBusy] = React.useState(false);

  React.useEffect(() => {
    return vendorSubscribeProducts(storeId, (list) => {
      setProducts(list);
      setLoading(false);
    });
  }, [storeId]);

  async function handleToggle(id: string, current: boolean) {
    try {
      await vendorToggleProduct(id, !current);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  }

  async function handleDelete(id: string, itemName: string) {
    Alert.alert('Delete Item', `Remove "${itemName}" from your store menu?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await vendorDeleteProduct(id);
          } catch (e) {
            Alert.alert('Error', (e as Error).message);
          }
        },
      },
    ]);
  }

  async function handleCreateProduct() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Product name is required.');
      return;
    }
    setAddBusy(true);
    try {
      await vendorAddProduct({
        storeId,
        name: name.trim(),
        nameTa: nameTa.trim() || undefined,
        category: 'grocery',
        unit: unit.trim() || 'piece',
        mrpPaise: toPaise(Number(mrpPrice) || 100),
        sellPaise: toPaise(Number(sellPrice) || 90),
        stockQty: Number(stockQty) || 20,
        lowStockAt: 5,
        isActive: true,
      });

      setAddModalOpen(false);
      setName('');
      setNameTa('');
      setSellPrice('100');
      setMrpPrice('110');
      setStockQty('20');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setAddBusy(false);
    }
  }

  if (loading) return <Screen><Loading /></Screen>;

  return (
    <Screen edges={['top']}>
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={20} color="#18181B" strokeWidth={2} />
        </Pressable>
        <View className="flex-1">
          <T className="text-base font-semibold tracking-tight">Menu &amp; Availability</T>
          <Ta className="text-xs text-placeholder">மெனு &amp; இருப்பு கட்டுப்பாடு</Ta>
        </View>
        <Pressable
          onPress={() => setAddModalOpen(true)}
          className="flex-row items-center gap-1 rounded-lg bg-primary px-3 py-1.5"
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.4} />
          <T className="text-xs font-bold text-white">Add Item</T>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-2.5 p-4 pb-8">
        {products.length === 0 ? (
          <Empty
            title="No items in menu"
            subtitle="Add products to make them available for customers to order."
          />
        ) : (
          products.map((item) => (
            <Card key={item.id} className={`flex-row items-center gap-3 p-3.5 ${!item.isActive ? 'opacity-50' : ''}`}>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <T className="text-sm font-semibold text-foreground">{item.name}</T>
                  {item.nameTa ? <Ta className="text-xs text-placeholder">{item.nameTa}</Ta> : null}
                </View>
                <T className="mt-0.5 text-xs text-muted-foreground">
                  {item.unit} · Stock: {item.stockQty}
                </T>
                <Num className="mt-1 text-xs font-bold text-foreground">
                  {formatInr(item.sellPaise)}
                  {item.mrpPaise > item.sellPaise ? (
                    <T className="text-[11px] text-placeholder line-through">
                      {' '}
                      {formatInr(item.mrpPaise)}
                    </T>
                  ) : null}
                </Num>
              </View>

              <View className="items-end gap-1">
                <Switch
                  value={item.isActive}
                  onValueChange={() => void handleToggle(item.id, item.isActive)}
                  trackColor={{ false: '#E4E4E7', true: '#16A34A' }}
                />
                <T className={`text-[10px] font-semibold ${item.isActive ? 'text-grocery-fg' : 'text-placeholder'}`}>
                  {item.isActive ? 'AVAILABLE' : 'OFF'}
                </T>
              </View>

              <Pressable
                onPress={() => void handleDelete(item.id, item.name)}
                className="size-8 items-center justify-center rounded-lg border border-border"
              >
                <Trash2 size={13} color="#EF4444" />
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        visible={addModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="gap-3.5 rounded-t-2xl border-t border-border bg-background p-5">
            <View className="flex-row items-center justify-between">
              <T className="text-base font-bold text-foreground">Add Menu Item</T>
              <Pressable onPress={() => setAddModalOpen(false)}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>

            <View className="gap-1">
              <T className="text-xs font-semibold text-foreground">Item Name</T>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Parotta / Toor Dal"
                placeholderTextColor="#9CA3AF"
                className="rounded-lg border border-border bg-surface p-2.5 text-xs text-foreground"
              />
            </View>

            <View className="gap-1">
              <T className="text-xs font-semibold text-foreground">Tamil Name (Optional)</T>
              <TextInput
                value={nameTa}
                onChangeText={setNameTa}
                placeholder="e.g. பரோட்டா"
                placeholderTextColor="#9CA3AF"
                className="rounded-lg border border-border bg-surface p-2.5 text-xs text-foreground"
              />
            </View>

            <View className="flex-row gap-2.5">
              <View className="flex-1 gap-1">
                <T className="text-xs font-semibold text-foreground">Unit</T>
                <TextInput
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="1 kg, plate, 500 ml"
                  placeholderTextColor="#9CA3AF"
                  className="rounded-lg border border-border bg-surface p-2.5 text-xs text-foreground"
                />
              </View>
              <View className="flex-1 gap-1">
                <T className="text-xs font-semibold text-foreground">Initial Stock</T>
                <TextInput
                  value={stockQty}
                  onChangeText={setStockQty}
                  keyboardType="numeric"
                  placeholder="20"
                  placeholderTextColor="#9CA3AF"
                  className="rounded-lg border border-border bg-surface p-2.5 text-xs text-foreground"
                />
              </View>
            </View>

            <View className="flex-row gap-2.5">
              <View className="flex-1 gap-1">
                <T className="text-xs font-semibold text-foreground">MRP (₹)</T>
                <TextInput
                  value={mrpPrice}
                  onChangeText={setMrpPrice}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor="#9CA3AF"
                  className="rounded-lg border border-border bg-surface p-2.5 text-xs text-foreground"
                />
              </View>
              <View className="flex-1 gap-1">
                <T className="text-xs font-semibold text-foreground">Selling Price (₹)</T>
                <TextInput
                  value={sellPrice}
                  onChangeText={setSellPrice}
                  keyboardType="numeric"
                  placeholder="90"
                  placeholderTextColor="#9CA3AF"
                  className="rounded-lg border border-border bg-surface p-2.5 text-xs text-foreground"
                />
              </View>
            </View>

            <View className="mt-2 flex-row gap-2.5">
              <Pressable
                onPress={() => setAddModalOpen(false)}
                className="h-11 flex-1 items-center justify-center rounded-lg border border-border"
              >
                <T className="text-xs font-semibold text-foreground">Cancel</T>
              </Pressable>
              <Pressable
                onPress={() => void handleCreateProduct()}
                disabled={addBusy}
                className="h-11 flex-1 items-center justify-center rounded-lg bg-primary"
              >
                <T className="text-xs font-bold text-white">
                  {addBusy ? 'Adding…' : 'Add to Menu'}
                </T>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
