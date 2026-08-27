'use client';

/**
 * The four-column lifecycle board.
 *
 * No sidebar, by design — the columns are the navigation. Cards drag between
 * columns; the drop is validated against the same state machine the security
 * rules enforce, so an illegal drop is refused before it reaches the network.
 */

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

import {
  BOARD_COLUMNS,
  COLUMN_LABEL,
  canTransition,
  columnOf,
  type BoardColumn,
  type Order,
} from '@dfc/core';

import { DenseRow, OrderCard } from './order-card';
import { DROP_TARGET, type Density } from '@/hooks/useBoard';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/primitives';

// ---------------------------------------------------------------------------

function DraggableCard({
  order,
  onOpen,
}: {
  order: Order;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
    data: { order },
  });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <OrderCard order={order} onOpen={onOpen} dragging={isDragging} />
    </div>
  );
}

function Column({
  column,
  orders,
  density,
  onOpen,
  activeOrder,
}: {
  column: BoardColumn;
  orders: Order[];
  density: Density;
  onOpen: (id: string) => void;
  activeOrder: Order | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  const label = COLUMN_LABEL[column];

  // Grey the column out while dragging something that cannot land here.
  const willAccept = activeOrder
    ? canTransition(activeOrder.status, DROP_TARGET[column], 'admin') ||
      columnOf(activeOrder.status) === column
    : true;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-xl border transition-colors',
        density === 'comfortable' ? 'bg-surface' : 'bg-card',
        isOver && willAccept && 'border-ring ring-[3px] ring-ring/10',
        activeOrder && !willAccept && 'opacity-40',
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 border-b bg-card',
          density === 'comfortable' ? 'px-3.5 py-3' : 'bg-surface px-3 py-2.5',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="truncate text-[12.5px] font-semibold tracking-tight">{label.en}</span>
          {density === 'comfortable' ? (
            <span className="ta truncate text-[10px] text-placeholder">{label.ta}</span>
          ) : null}
        </div>
        <span className="tnum rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-body-strong">
          {orders.length}
        </span>
      </div>

      <div className={cn('scroll-slim min-h-0 flex-1 overflow-y-auto', density === 'comfortable' && 'p-2.5')}>
        {orders.length === 0 ? (
          <div className="grid h-24 place-items-center text-[11.5px] text-placeholder">
            Nothing here
          </div>
        ) : density === 'comfortable' ? (
          <div className="flex flex-col gap-2.5">
            {orders.map((o) => (
              <DraggableCard key={o.id} order={o} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          orders.map((o, i) => <DenseRow key={o.id} order={o} onOpen={onOpen} selected={i === 0} />)
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function Board({
  byColumn,
  density,
  loading,
  onOpen,
  onMove,
}: {
  byColumn: Record<BoardColumn, Order[]>;
  density: Density;
  loading: boolean;
  onOpen: (id: string) => void;
  onMove: (order: Order, to: BoardColumn) => void;
}) {
  const [active, setActive] = React.useState<Order | null>(null);
  // 6px of slop so a click to open a card is not read as a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleStart(e: DragStartEvent) {
    setActive((e.active.data.current?.order as Order) ?? null);
  }

  function handleEnd(e: DragEndEvent) {
    const order = e.active.data.current?.order as Order | undefined;
    const target = e.over?.id as BoardColumn | undefined;
    setActive(null);
    if (!order || !target) return;
    if (columnOf(order.status) === target) return;
    onMove(order, target);
  }

  if (loading) {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-5 p-5">
        {BOARD_COLUMNS.map((c) => (
          <div key={c} className="flex flex-col gap-2.5 rounded-xl border bg-surface p-2.5">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToWindowEdges]}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
      onDragCancel={() => setActive(null)}
    >
      <div
        className={cn(
          'grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
          density === 'comfortable' ? 'gap-5 p-5' : 'gap-3.5 p-3.5',
        )}
      >
        {BOARD_COLUMNS.map((c) => (
          <Column
            key={c}
            column={c}
            orders={byColumn[c]}
            density={density}
            onOpen={onOpen}
            activeOrder={active}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {active ? (
          <div className="w-[320px] rotate-1 cursor-grabbing">
            <OrderCard order={active} onOpen={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
