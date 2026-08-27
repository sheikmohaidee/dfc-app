/**
 * The OCR review card — where the customer fixes what the model read.
 *
 * A photograph of a handwritten prescription is the hardest input this product
 * takes, and the model will get names wrong. Until now a photo produced a
 * read-only summary, so the only way to correct a misread was for an admin to
 * telephone the customer. That is a phone call per bad line, and it happens
 * during the evening rush.
 *
 * So every line here is editable in place: fix the name, fix the unit, change
 * the quantity, delete a line the model invented, add one it missed. The
 * customer knows what their own medicine is called and the model does not.
 *
 * Two things this deliberately does NOT do:
 *
 *   It does not touch the photograph. The image stays immutable in Storage and
 *   remains what the pharmacist dispenses against — this edits the list DFC
 *   works from, not the prescription. The card says so, because a customer who
 *   believed otherwise might "correct" a dose.
 *
 *   It does not let anybody price anything. Money is the admin's, and the
 *   rules enforce that regardless of what this screen does.
 */

import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';

import {
  COPY,
  computePricing,
  formatInr,
  needsVerification,
  tokens,
  type Order,
  type OrderItem,
} from '@dfc/core';

import { Badge, Button, Card, Checkbox, Num, Stepper, T, Ta } from './index';
import { PressableScale } from './glass';

// ---------------------------------------------------------------------------
// One editable row
// ---------------------------------------------------------------------------

function ItemRow({
  item,
  canRemove,
  onToggle,
  onQuantity,
  onEdit,
  onRemove,
}: {
  item: OrderItem;
  canRemove: boolean;
  onToggle: () => void;
  onQuantity: (q: number) => void;
  onEdit: (patch: { name: string; unit: string }) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(item.name);
  const [unit, setUnit] = React.useState(item.unit);

  // If the document changes underneath us — an admin renaming a line while the
  // customer has the row open — take the new value rather than silently
  // writing a stale one back.
  React.useEffect(() => {
    if (!editing) {
      setName(item.name);
      setUnit(item.unit);
    }
  }, [item.name, item.unit, editing]);

  function commit() {
    const trimmed = name.trim();
    // An empty name is a mis-tap, not an intention to blank the line.
    if (!trimmed) {
      setName(item.name);
      setUnit(item.unit);
      setEditing(false);
      return;
    }
    if (trimmed !== item.name || unit.trim() !== item.unit) {
      onEdit({ name: trimmed, unit: unit.trim() });
    }
    setEditing(false);
  }

  function cancel() {
    setName(item.name);
    setUnit(item.unit);
    setEditing(false);
  }

  const flag = needsVerification(item);

  if (editing) {
    return (
      <View className="gap-2 border-b border-muted bg-surface px-3.5 py-3">
        <T className="text-[10px] font-bold tracking-[0.9px] text-placeholder">
          {COPY.correctThisLine.en.toUpperCase()}
        </T>

        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus
          selectTextOnFocus
          placeholder="Medicine or item name"
          placeholderTextColor={tokens.neutral.placeholder}
          returnKeyType="done"
          onSubmitEditing={commit}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-[14px] text-foreground"
        />

        <TextInput
          value={unit}
          onChangeText={setUnit}
          placeholder="strip of 15, 1 kg, 500 ml…"
          placeholderTextColor={tokens.neutral.placeholder}
          returnKeyType="done"
          onSubmitEditing={commit}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-[13px] text-foreground"
        />

        <View className="mt-0.5 flex-row gap-2">
          <Button
            size="sm"
            label="Save"
            labelTa="சேமி"
            onPress={commit}
            className="flex-1"
          />
          <Button variant="outline" size="sm" label="Cancel" onPress={cancel} className="flex-1" />
          {canRemove ? (
            <PressableScale
              onPress={() => {
                setEditing(false);
                onRemove();
              }}
              accessibilityLabel={`Remove ${item.name}`}
              className="size-9 items-center justify-center rounded-lg border border-destructive-border bg-destructive-tint"
            >
              <Trash2 size={15} color={tokens.state.destructive.fg} strokeWidth={2.1} />
            </PressableScale>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View className="min-h-[52px] flex-row items-center gap-2.5 border-b border-muted px-3.5 py-2">
      <Checkbox checked={item.included} onToggle={onToggle} />

      {/* The whole label is the edit target — a pencil alone is a small tap
          area, and this row is the one people will reach for most. */}
      <Pressable
        onPress={() => setEditing(true)}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.name}`}
        className="flex-1"
      >
        <View className="flex-row items-center gap-1.5">
          <T
            className={`flex-1 text-[13.5px] font-medium tracking-tight ${
              !item.included ? 'text-placeholder line-through' : flag ? 'text-verify-fg' : ''
            }`}
            numberOfLines={1}
          >
            {item.name}
          </T>
          <Pencil size={12} color={tokens.neutral.placeholder} strokeWidth={2} />
        </View>

        <View className="mt-0.5 flex-row items-center gap-1.5">
          {flag ? <Badge label="CHECK" tone="verify" /> : null}
          {item.addedByCustomer ? <Badge label="ADDED" tone="neutral" /> : null}
          {item.editedByCustomer ? <Badge label="EDITED" tone="neutral" /> : null}
          <Num className="text-[10px] text-placeholder" numberOfLines={1}>
            {item.unit}
          </Num>
        </View>

        {/* What the paper actually said, when the model expanded it. A
            customer cannot check "Pantoprazole 40mg" against a prescription
            that reads "Pan-40" unless we show them both. */}
        {item.readAs ? (
          <T className="mt-0.5 text-[10px] italic text-placeholder" numberOfLines={1}>
            your paper reads &ldquo;{item.readAs}&rdquo;
          </T>
        ) : null}
      </Pressable>

      <Stepper value={item.quantity} onChange={onQuantity} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Add a line
// ---------------------------------------------------------------------------

function AddRow({ onAdd }: { onAdd: (input: { name: string; unit: string }) => void }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [unit, setUnit] = React.useState('');

  function commit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, unit: unit.trim() });
    setName('');
    setUnit('');
    setOpen(false);
  }

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        className="min-h-[46px] flex-row items-center gap-2 border-b border-muted px-3.5 py-2.5 active:bg-surface"
      >
        <View className="size-[18px] items-center justify-center rounded-md border border-dashed border-disabled">
          <Plus size={11} color={tokens.neutral.placeholder} strokeWidth={2.4} />
        </View>
        <T className="text-[13px] font-medium text-muted-foreground">Add something else</T>
        <Ta className="text-[11px] text-placeholder">வேறு ஏதாவது</Ta>
      </Pressable>
    );
  }

  return (
    <View className="gap-2 border-b border-muted bg-surface px-3.5 py-3">
      <T className="text-[10px] font-bold tracking-[0.9px] text-placeholder">ADD AN ITEM</T>

      <TextInput
        value={name}
        onChangeText={setName}
        autoFocus
        placeholder="What else do you need?"
        placeholderTextColor={tokens.neutral.placeholder}
        returnKeyType="done"
        onSubmitEditing={commit}
        className="rounded-lg border border-input bg-background px-3 py-2.5 text-[14px] text-foreground"
      />
      <TextInput
        value={unit}
        onChangeText={setUnit}
        placeholder="How much? (optional)"
        placeholderTextColor={tokens.neutral.placeholder}
        returnKeyType="done"
        onSubmitEditing={commit}
        className="rounded-lg border border-input bg-background px-3 py-2.5 text-[13px] text-foreground"
      />

      <View className="mt-0.5 flex-row gap-2">
        <Button
          size="sm"
          label="Add"
          labelTa="சேர்"
          disabled={!name.trim()}
          onPress={commit}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          label="Cancel"
          onPress={() => {
            setName('');
            setUnit('');
            setOpen(false);
          }}
          className="flex-1"
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------

export function OrderReviewCard({
  order,
  onToggle,
  onQuantity,
  onEdit,
  onAdd,
  onRemove,
  onConfirm,
  busy,
}: {
  order: Order;
  onToggle: (itemId: string) => void;
  onQuantity: (itemId: string, quantity: number) => void;
  onEdit: (itemId: string, patch: { name: string; unit: string }) => void;
  onAdd: (input: { name: string; unit: string }) => void;
  onRemove: (itemId: string) => void;
  onConfirm?: () => void;
  busy?: boolean;
}) {
  const live = React.useMemo(
    () =>
      computePricing({
        items: order.items,
        stops: order.stops ?? [],
        deliveryPaise: order.pricing.deliveryPaise,
        servicePaise: order.pricing.servicePaise,
      }),
    [order.items, order.stops, order.pricing.deliveryPaise, order.pricing.servicePaise],
  );

  const picked = order.items.filter((i) => i.included);
  const unsure = order.items.filter((i) => i.included && needsVerification(i)).length;
  const fromPhoto = order.source.kind === 'photo';

  return (
    <Card className="overflow-hidden rounded-generative">
      <View className="gap-1 border-b border-muted px-3.5 py-3">
        <View className="flex-row items-center gap-2">
          <T className="flex-1 text-[13.5px] font-semibold tracking-tight">
            {fromPhoto ? 'We read this from your photo' : 'Check your list'}
          </T>
          <Num className="text-[11px] text-muted-foreground">
            {picked.length} of {order.items.length}
          </Num>
        </View>
        <Ta className="text-[11.5px] text-muted-foreground">
          {fromPhoto ? 'உங்கள் புகைப்படத்திலிருந்து' : 'உங்கள் பட்டியலைச் சரிபார்க்கவும்'}
        </Ta>
      </View>

      {unsure > 0 ? (
        <View className="border-b border-verify-border bg-verify-tint px-3.5 py-2.5">
          <T className="text-[12px] leading-[18px] text-verify-fg">
            {unsure === 1
              ? 'One line we are not sure we read correctly — tap it to check.'
              : `${unsure} lines we are not sure we read correctly — tap them to check.`}
          </T>
        </View>
      ) : null}

      {order.items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          // Never let the last line go: an order with nothing in it is a
          // support call. Cancelling is the way out.
          canRemove={order.items.length > 1}
          onToggle={() => onToggle(item.id)}
          onQuantity={(q) => onQuantity(item.id, q)}
          onEdit={(patch) => onEdit(item.id, patch)}
          onRemove={() => onRemove(item.id)}
        />
      ))}

      <AddRow onAdd={onAdd} />

      {fromPhoto ? (
        <View className="border-b border-muted px-3.5 py-2.5">
          <T className="text-[11px] leading-[16px] text-placeholder">
            Your prescription photo goes to the pharmacist exactly as you took it. Editing this
            list only changes what we shop for — it never changes the prescription.
          </T>
        </View>
      ) : null}

      <View className="gap-2.5 px-3.5 pb-3.5 pt-3">
        <View className="flex-row items-baseline">
          <T className="flex-1 text-[12.5px] text-muted-foreground">
            {live.itemsPaise > 0 ? 'Estimated so far' : 'A shop will price this'}
          </T>
          <Num className="text-[13px] font-semibold">
            {live.itemsPaise > 0 ? formatInr(live.totalPaise) : '—'}
          </Num>
        </View>

        <Button
          size="lg"
          label={COPY.sendToStore.en}
          labelTa={COPY.sendToStore.ta}
          disabled={picked.length === 0}
          loading={busy}
          onPress={onConfirm}
        />

        <T className="text-center text-[11px] leading-[16px] text-placeholder">
          You will see the price before you pay anything.
        </T>
      </View>
    </Card>
  );
}
