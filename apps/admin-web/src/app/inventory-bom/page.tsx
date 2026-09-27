'use client';

/**
 * Ingredient-Level Bill of Materials (BOM) Inventory Cascade Desk.
 *
 * Lets admins & kitchen supervisors toggle base ingredient availability (e.g. Parotta Dough,
 * Idli Batter, Basundi Milk) and automatically disables/enables all dependent dishes.
 */

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import { type Ingredient, type Product } from '@dfc/core';
import { Badge, Button } from '@/components/ui/primitives';
import { mockStore } from '@/lib/mock-store';
import { cn } from '@/lib/utils';

export default function InventoryBomPage() {
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    const update = () => {
      setIngredients(mockStore.getIngredients());
      setProducts(mockStore.getProducts());
    };
    update();
    return mockStore.subscribe(update);
  }, []);

  const handleToggle = (ing: Ingredient) => {
    mockStore.toggleIngredient(ing.id, !ing.inStock);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card/85 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border bg-surface px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-3.5" />
            Board
          </Link>
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <h1 className="text-[14px] font-semibold">Ingredient-Level BOM & Stock Cascades</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Quick Simulation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-white">
              <Layers className="size-3.5" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-foreground">Interactive Kitchen Stress Test</h3>
              <p className="text-[11px] text-muted-foreground">Test how disabling an ingredient instantly protects customer carts</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => mockStore.toggleIngredient('ing-parotta-dough', false)}
              className="text-xs border-amber-500/30 text-amber-600 dark:text-amber-400"
            >
              Simulate Dough Outage
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => mockStore.toggleIngredient('ing-basundi-milk', false)}
              className="text-xs border-orange-500/30 text-orange-600 dark:text-orange-400"
            >
              Simulate Milk Outage
            </Button>
            <Button
              size="sm"
              onClick={() => {
                mockStore.toggleIngredient('ing-parotta-dough', true);
                mockStore.toggleIngredient('ing-basundi-milk', true);
                mockStore.toggleIngredient('ing-idli-batter', true);
              }}
              className="text-xs bg-primary text-white"
            >
              Reset 100% Stock
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ingredients.map((ing) => {
            const linkedProducts = products.filter((p) => ing.linkedProductIds.includes(p.id));

            return (
              <div
                key={ing.id}
                className={cn(
                  'flex flex-col gap-3.5 rounded-xl border p-5 shadow-sm transition-all',
                  ing.inStock ? 'border-border bg-card' : 'border-red-500/40 bg-red-500/5',
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-semibold">{ing.name}</span>
                    <span className="text-[12px] font-tamil text-muted-foreground">{ing.nameTa}</span>
                    <span className="text-[11px] text-muted-foreground">Store: {ing.storeId}</span>
                  </div>

                  <Badge variant={ing.inStock ? 'default' : 'destructive'} className="text-[11px]">
                    {ing.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                  </Badge>
                </div>

                {/* Linked Dishes List */}
                <div className="rounded-lg border bg-surface p-3 text-[12px] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Linked Dishes ({linkedProducts.length})
                  </span>
                  <div className="space-y-1.5">
                    {linkedProducts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-[11.5px]">
                        <span className={cn('font-medium', !ing.inStock && 'line-through text-muted-foreground')}>
                          {p.name}
                        </span>
                        <Badge variant={p.isActive ? 'outline' : 'secondary'} className="text-[9.5px]">
                          {p.isActive ? 'Available' : 'Disabled'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-2.5">
                  <span className="text-[11px] text-muted-foreground">
                    Unit: <strong>{ing.unit}</strong>
                  </span>
                  <Button
                    size="sm"
                    variant={ing.inStock ? 'outline' : 'default'}
                    onClick={() => handleToggle(ing)}
                  >
                    {ing.inStock ? 'Mark Out of Stock' : 'Restore Stock'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
