'use client';

/**
 * Manual Order Creation Dialog for Admin.
 *
 * Allows staff to intake orders over the phone or in person, select stores and items,
 * customize pricing and delivery fees, and immediately push the order to the board.
 */

import * as React from 'react';
import { Check, Phone, Plus, Trash2, User } from 'lucide-react';

import {
  ACTIVE_CATEGORIES,
  LOCALITIES,
  SEED_STORES,
  formatInr,
  routeKm,
  suggestDeliveryPaise,
  toPaise,
  type Category,
  type OrderItem,
  type PaymentMode,
} from '@dfc/core';

import { Button, Input, RupeeInput } from '@/components/ui/primitives';
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { createCustomOrder } from '@/lib/orders';
import { cn } from '@/lib/utils';

const CATEGORY_NAMES: Record<Category, string> = {
  grocery: 'Grocery',
  food: 'Food / Restaurant',
  concierge: 'Concierge Errand',
  pharmacy: 'Pharmacy',
  print: 'Print & Xerox',
  pickup_drop: 'Pickup & Drop',
  buy_deliver: 'Custom Delivery',
};

interface DraftItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  pricePaise: number | null;
}

export function CreateOrderDialog({
  open,
  adminUid,
  onClose,
  onCreated,
}: {
  open: boolean;
  adminUid: string;
  onClose: () => void;
  onCreated?: (orderId: string) => void;
}) {
  const [name, setName] = React.useState('R. Karthikeyan');
  const [phone, setPhone] = React.useState('+919876500002');
  const [localityId, setLocalityId] = React.useState('kk-nagar');
  const [addressLine, setAddressLine] = React.useState('14/2, 2nd Main Road');
  const [category, setCategory] = React.useState<Category>('grocery');
  const [storeId, setStoreId] = React.useState<string>('amma-mini-mart');
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>('cod');
  const [notes, setNotes] = React.useState('');
  const [deliveryPaise, setDeliveryPaise] = React.useState<number>(3000);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [items, setItems] = React.useState<DraftItem[]>([
    {
      id: 'item_1',
      name: 'Ponni boiled rice',
      unit: '5 kg',
      quantity: 1,
      pricePaise: toPaise(340),
    },
    {
      id: 'item_2',
      name: 'Toor dal',
      unit: '1 kg',
      quantity: 1,
      pricePaise: toPaise(148),
    },
  ]);

  // Filter stores by category
  const availableStores = React.useMemo(() => {
    return SEED_STORES.filter((s) => s.category === category);
  }, [category]);

  // Adjust default store when category changes
  React.useEffect(() => {
    if (availableStores.length > 0 && !availableStores.some((s) => s.id === storeId)) {
      setStoreId(availableStores[0]!.id);
    }
  }, [category, availableStores, storeId]);

  // Auto-calculate suggested delivery fee
  React.useEffect(() => {
    const store = SEED_STORES.find((s) => s.id === storeId);
    const km = store ? routeKm(store.localityId, localityId) : 3;
    const suggested = suggestDeliveryPaise(km, Math.max(1, items.length));
    setDeliveryPaise(suggested);
  }, [storeId, localityId, items.length]);

  function addItemRow() {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: '',
        unit: '1 kg',
        quantity: 1,
        pricePaise: toPaise(50),
      },
    ]);
  }

  function updateItem(id: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  const itemsTotalPaise = items.reduce(
    (acc, it) => acc + (it.pricePaise ? it.pricePaise * it.quantity : 0),
    0,
  );
  const totalPaise = itemsTotalPaise + deliveryPaise;

  async function handleCreate() {
    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Customer phone number is required.');
      return;
    }
    const validItems: OrderItem[] = items
      .filter((i) => i.name.trim().length > 0)
      .map((i) => ({
        id: i.id,
        name: i.name.trim(),
        unit: i.unit.trim() || 'each',
        quantity: i.quantity,
        unitPricePaise: i.pricePaise,
        confidence: 1,
        included: true,
      }));

    if (validItems.length === 0 && category !== 'concierge') {
      setError('Please add at least one line item.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const newId = await createCustomOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        localityId,
        addressLine: addressLine.trim(),
        category,
        storeId: storeId || null,
        items: validItems,
        deliveryFeePaise: deliveryPaise,
        paymentMode,
        notes: notes.trim(),
        adminUid,
      });

      onClose();
      onCreated?.(newId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent width={520}>
        <SheetHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Plus className="size-4" strokeWidth={2.4} />
            </span>
            <div className="flex flex-col">
              <SheetTitle className="text-base font-semibold tracking-tight">
                Create Manual Order
              </SheetTitle>
              <span className="ta text-[11px] text-placeholder">புதிய ஆர்டர் உருவாக்கு</span>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="flex flex-col gap-4">
          {error ? (
            <div className="rounded-lg border border-destructive-border bg-destructive-tint p-3 text-xs font-medium text-destructive-fg">
              {error}
            </div>
          ) : null}

          {/* Customer Details */}
          <div className="flex flex-col gap-2.5 rounded-lg border p-3.5">
            <span className="text-[10.5px] font-bold tracking-[0.1em] text-placeholder">
              CUSTOMER DETAILS
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-body-strong">Full Name</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-placeholder" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. R. Karthikeyan"
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-body-strong">Phone</span>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-placeholder" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-body-strong">Locality</span>
                <select
                  value={localityId}
                  onChange={(e) => setLocalityId(e.target.value)}
                  className="h-8 rounded-md border bg-background px-2 text-xs font-medium outline-none focus:border-ring"
                >
                  {LOCALITIES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.nameTa})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-body-strong">Address Line</span>
                <Input
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Street / Door no."
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Category & Store */}
          <div className="flex flex-col gap-2.5 rounded-lg border p-3.5">
            <span className="text-[10.5px] font-bold tracking-[0.1em] text-placeholder">
              CATEGORY & STORE
            </span>
            <div className="flex gap-2">
              {ACTIVE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs font-medium transition-colors',
                    category === cat
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-body-strong',
                  )}
                >
                  {CATEGORY_NAMES[cat]}
                </button>
              ))}
            </div>

            {availableStores.length > 0 ? (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-body-strong">Fulfilling Store</span>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="h-8 rounded-md border bg-background px-2 text-xs font-medium outline-none focus:border-ring"
                >
                  {availableStores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.nameTa}) · {s.localityId}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {/* Items Table */}
          <div className="flex flex-col gap-2 rounded-lg border p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold tracking-[0.1em] text-placeholder">
                ORDER ITEMS ({items.length})
              </span>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Plus className="size-3.5" />
                Add Item Row
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 rounded-md border bg-surface p-2">
                  <span className="grid size-5 shrink-0 place-items-center rounded bg-muted text-[10px] font-semibold text-placeholder">
                    {idx + 1}
                  </span>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    placeholder="Item name (e.g. Idli Rice)"
                    className="h-7 min-w-0 flex-1 text-xs"
                  />
                  <Input
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                    placeholder="Unit (kg, plate)"
                    className="h-7 w-20 shrink-0 text-xs"
                  />
                  <div className="flex h-7 shrink-0 items-center overflow-hidden rounded border bg-background">
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                      className="px-1.5 text-xs font-semibold hover:bg-muted"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                      className="px-1.5 text-xs font-semibold hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                  <RupeeInput
                    valuePaise={item.pricePaise}
                    onChangePaise={(p) => updateItem(item.id, { pricePaise: p })}
                    className="h-7 w-20 shrink-0 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="grid size-7 shrink-0 place-items-center text-placeholder transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Settings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-[10.5px] font-bold tracking-[0.1em] text-placeholder">
                DELIVERY FEE
              </span>
              <RupeeInput
                valuePaise={deliveryPaise}
                onChangePaise={(p) => setDeliveryPaise(p ?? 0)}
                className="h-8"
              />
              <span className="text-[10.5px] text-placeholder">Calculated by distance</span>
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-[10.5px] font-bold tracking-[0.1em] text-placeholder">
                PAYMENT MODE
              </span>
              <div className="flex gap-1.5">
                {(['cod', 'prepaid'] as PaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={cn(
                      'flex-1 rounded py-1.5 text-xs font-semibold uppercase transition-colors',
                      paymentMode === mode
                        ? 'bg-foreground text-background'
                        : 'border bg-surface text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {mode === 'cod' ? 'Cash (COD)' : 'Prepaid'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Special Notes */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-body-strong">Admin / Dispatch Notes</span>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ring bell twice, customer needs change for ₹500"
              className="h-8 text-xs"
            />
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-1 rounded-lg border bg-surface p-3 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Items Total:</span>
              <span className="font-semibold text-body-strong">{formatInr(itemsTotalPaise)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Fee:</span>
              <span className="font-semibold text-body-strong">{formatInr(deliveryPaise)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-semibold text-foreground">
              <span className="text-sm">Order Total:</span>
              <span className="text-base font-bold text-foreground">{formatInr(totalPaise)}</span>
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <div className="flex w-full gap-2.5">
            <Button variant="outline" size="default" onClick={onClose} disabled={busy} className="flex-1">
              Cancel
            </Button>
            <Button
              size="default"
              onClick={() => void handleCreate()}
              disabled={busy}
              className="flex-1 gap-1.5"
            >
              <Check className="size-4" />
              {busy ? 'Placing…' : 'Place Order on Board'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
