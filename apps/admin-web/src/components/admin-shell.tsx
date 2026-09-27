'use client';

/**
 * DFC Command Center — Desktop Admin Shell & Persistent Sidebar
 * DFC Dark Floating Design System (#0E0E10, #18191B, #222327, #6A5ACD, #FF7F50)
 */

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Bike,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CloudRain,
  CreditCard,
  ExternalLink,
  Flame,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Layers,
  LogOut,
  MapPin,
  Moon,
  Package,
  Plus,
  Radio,
  Receipt,
  Route,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  Wallet,
  Zap,
} from 'lucide-react';

import { formatInr, type Order, type PlatformConfig } from '@dfc/core';
import { useAuth } from '@/lib/auth';
import { mockStore } from '@/lib/mock-store';
import { cn } from '@/lib/utils';
import { CreateOrderDialog } from '@/components/sheets/create-order-dialog';
import { FoodRescueDialog } from '@/components/sheets/food-rescue-dialog';
import { BatchingVisualizer } from '@/components/sheets/batching-visualizer';
import { PlatformAutomationsDialog } from '@/components/sheets/platform-automations-dialog';

export interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export function AdminShell({
  children,
  title,
  subtitle,
  headerActions,
}: AdminShellProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const currentPath = pathname || '/';
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [config, setConfig] = React.useState<PlatformConfig>(() => mockStore.getPlatformConfig());

  // Dialog states
  const [createOrderOpen, setCreateOrderOpen] = React.useState(false);
  const [foodRescueOpen, setFoodRescueOpen] = React.useState(false);
  const [batchingOpen, setBatchingOpen] = React.useState(false);
  const [automationsOpen, setAutomationsOpen] = React.useState(false);

  React.useEffect(() => {
    const unsub = mockStore.subscribe(() => {
      setOrders(mockStore.getOrders());
      setConfig(mockStore.getPlatformConfig());
    });
    setOrders(mockStore.getOrders());
    return unsub;
  }, []);

  const incomingCount = orders.filter((o) => o.status === 'incoming').length;
  const activeCount = orders.filter((o) =>
    ['incoming', 'placed', 'vendor_accepted', 'packing', 'ready_for_pickup', 'dispatched', 'picked_up', 'out_for_delivery'].includes(
      o.status,
    ),
  ).length;

  const NAV_SECTIONS = [
    {
      title: 'OPERATIONS',
      items: [
        {
          label: 'Dashboard',
          href: '/',
          icon: LayoutDashboard,
          active: currentPath === '/',
        },
        {
          label: 'Orders Overview',
          href: '/orders',
          icon: ShoppingBag,
          badge: activeCount > 0 ? activeCount : undefined,
          active: currentPath === '/orders',
        },
        {
          label: 'Incoming Queue',
          href: '/incoming',
          icon: Inbox,
          badge: incomingCount > 0 ? incomingCount : undefined,
          badgeColor: 'bg-[#FF7F50] text-white',
          active: currentPath === '/incoming',
        },
        {
          label: 'Live Dispatch Map',
          href: '/live',
          icon: Route,
          active: currentPath === '/live',
        },
      ],
    },
    {
      title: 'PARTNERS & CUSTOMERS',
      items: [
        {
          label: 'Captains / Fleet',
          href: '/captains',
          icon: Bike,
          active: currentPath === '/captains',
        },
        {
          label: 'Vendors / Stores',
          href: '/vendors',
          icon: Store,
          active: currentPath === '/vendors',
        },
        {
          label: 'Customers',
          href: '/customers',
          icon: Users,
          active: currentPath === '/customers',
        },
      ],
    },
    {
      title: 'CATALOGUE & GROWTH',
      items: [
        {
          label: 'Catalogue & Products',
          href: '/catalogue',
          icon: Boxes,
          active: currentPath === '/catalogue',
        },
        {
          label: 'Promotions & Ads',
          href: '/promotions',
          icon: Tag,
          active: currentPath === '/promotions',
        },
        {
          label: 'Payments & Escrow',
          href: '/payments',
          icon: Wallet,
          active: currentPath === '/payments',
        },
        {
          label: 'Reports & Analytics',
          href: '/analytics',
          icon: BarChart3,
          active: currentPath === '/analytics',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          label: 'Notifications',
          href: '/notifications',
          icon: Bell,
          active: currentPath === '/notifications',
        },
        {
          label: 'Platform Settings',
          href: '/settings',
          icon: Settings,
          active: currentPath === '/settings',
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#0E0E10] text-[#F4F4F5]">
      {/* SIDEBAR NAVIGATION (Desktop 260px) */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#2A2A2E] bg-[#18191B]">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#2A2A2E] px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#6A5ACD] shadow-lg shadow-[#6A5ACD]/25">
              <Flame className="size-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-extrabold tracking-tight text-[#F4F4F5]">
                  DFC COMMAND
                </span>
                <span className="rounded bg-[#6A5ACD]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#A78BFA]">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA]">Madurai Central Dispatch</p>
            </div>
          </Link>
        </div>

        {/* Live Status Pill */}
        <div className="border-b border-[#2A2A2E] px-4 py-2.5">
          <div className="flex items-center justify-between rounded-lg bg-[#222327] px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[#10B981]" />
              </span>
              <span className="text-[11px] font-bold tracking-wider text-[#10B981]">
                DISPATCH LIVE
              </span>
            </div>

            <span className="text-[11px] font-semibold text-[#A1A1AA]">
              {orders.length} orders
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="scroll-slim flex-1 overflow-y-auto px-3 py-3">
          <div className="flex flex-col gap-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="flex flex-col gap-1">
                <span className="px-3 text-[10px] font-bold tracking-[0.1em] text-[#71717A]">
                  {section.title}
                </span>

                <div className="mt-1 flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                          item.active
                            ? 'bg-[#6A5ACD] text-white shadow-sm font-semibold'
                            : 'text-[#A1A1AA] hover:bg-[#222327] hover:text-[#F4F4F5]',
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={cn(
                              'size-4 transition-colors',
                              item.active
                                ? 'text-white'
                                : 'text-[#71717A] group-hover:text-[#F4F4F5]',
                            )}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.badge !== undefined ? (
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                              item.badgeColor || (item.active ? 'bg-white/20 text-white' : 'bg-[#222327] text-[#A1A1AA]'),
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operations Actions Footer */}
        <div className="border-t border-[#2A2A2E] p-3">
          <button
            type="button"
            onClick={() => setCreateOrderOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6A5ACD] py-2 text-[12px] font-bold text-white shadow-md shadow-[#6A5ACD]/25 transition hover:bg-[#5b4cb8]"
          >
            <Plus className="size-4" />
            <span>Create Manual Order</span>
          </button>
        </div>

        {/* User Profile & Sign Out Bar */}
        <div className="flex items-center justify-between border-t border-[#2A2A2E] bg-[#141517] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#222327] text-[12px] font-bold text-[#F4F4F5]">
              {(user?.displayName || 'AD').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-[#F4F4F5]">
                {user?.displayName || 'Admin Arun'}
              </span>
              <span className="text-[10px] text-[#71717A]">Super Admin</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void signOut()}
            title="Sign Out"
            className="flex size-7 items-center justify-center rounded-md text-[#71717A] hover:bg-[#222327] hover:text-[#EF4444]"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col pl-64">
        {/* TOP STATUS BAR */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#2A2A2E] bg-[#18191B]/95 px-6 backdrop-blur-md">
          <div>
            <h1 className="text-[17px] font-extrabold tracking-tight text-[#F4F4F5]">
              {title || 'Madurai Operations Hub'}
            </h1>
            {subtitle ? (
              <p className="text-[11.5px] text-[#A1A1AA]">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Automation Pill Toggles */}
            {config.rainSurge?.active ? (
              <div className="flex items-center gap-1.5 rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/10 px-3 py-1 text-[11px] font-bold text-[#38BDF8]">
                <CloudRain className="size-3.5" />
                <span>Monsoon Surge 1.25x Active</span>
              </div>
            ) : null}

            {config.status === 'sleep' ? (
              <div className="flex items-center gap-1.5 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3 py-1 text-[11px] font-bold text-[#F59E0B]">
                <Moon className="size-3.5" />
                <span>Night Rest Mode</span>
              </div>
            ) : null}

            {/* Quick Dialog Buttons */}
            <button
              type="button"
              onClick={() => setBatchingOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 py-1.5 text-[12px] font-semibold text-[#F4F4F5] hover:bg-[#2A2A2E]"
            >
              <Boxes className="size-3.5 text-[#6A5ACD]" />
              <span>Smart Batching</span>
            </button>

            <button
              type="button"
              onClick={() => setFoodRescueOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 py-1.5 text-[12px] font-semibold text-[#F4F4F5] hover:bg-[#2A2A2E]"
            >
              <Flame className="size-3.5 text-[#FF7F50]" />
              <span>Food Rescue</span>
            </button>

            <button
              type="button"
              onClick={() => setAutomationsOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 py-1.5 text-[12px] font-semibold text-[#F4F4F5] hover:bg-[#2A2A2E]"
            >
              <Zap className="size-3.5 text-[#10B981]" />
              <span>Automations</span>
            </button>

            {headerActions}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Global Modals */}
      <CreateOrderDialog
        open={createOrderOpen}
        adminUid={user?.uid || 'admin-1'}
        onClose={() => setCreateOrderOpen(false)}
      />
      <FoodRescueDialog
        open={foodRescueOpen}
        onOpenChange={setFoodRescueOpen}
      />
      <BatchingVisualizer
        open={batchingOpen}
        onOpenChange={setBatchingOpen}
      />
      <PlatformAutomationsDialog
        open={automationsOpen}
        onClose={() => setAutomationsOpen(false)}
      />
    </div>
  );
}
