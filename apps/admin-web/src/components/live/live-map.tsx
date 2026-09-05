'use client';

/**
 * Live ops — Madurai as a 3D board.
 *
 * This is not decoration. The board tells you what each order needs; this
 * tells you where the pressure is: which localities are stacking up, which
 * riders are moving, and how far the city is spread tonight. It reads at a
 * glance from across the ops room, which a table does not.
 *
 * Deliberately schematic — abstract plane, real relative geography. It is a
 * situation display, not a navigation map.
 */

import * as React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html as DreiHtml, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

import {
  LOCALITIES,
  columnOf,
  formatInr,
  localityById,
  storeById,
  tokens,
  type Order,
} from '@dfc/core';

// ---------------------------------------------------------------------------
// Geography -> scene coordinates
// ---------------------------------------------------------------------------

const SPAN = 11; // scene units across the widest axis

const bounds = {
  minLat: Math.min(...LOCALITIES.map((l) => l.lat)),
  maxLat: Math.max(...LOCALITIES.map((l) => l.lat)),
  minLng: Math.min(...LOCALITIES.map((l) => l.lng)),
  maxLng: Math.max(...LOCALITIES.map((l) => l.lng)),
};

function project(lat: number, lng: number): [number, number] {
  const w = bounds.maxLng - bounds.minLng || 1;
  const h = bounds.maxLat - bounds.minLat || 1;
  const x = ((lng - bounds.minLng) / w - 0.5) * SPAN;
  // Latitude grows north; z grows south in three's default orientation.
  const z = -((lat - bounds.minLat) / h - 0.5) * SPAN;
  return [x, z];
}

const CATEGORY_COLOR: Record<string, string> = {
  pharmacy: tokens.category.pharmacy.solid,
  grocery: tokens.category.grocery.solid,
  food: tokens.category.food.solid,
  concierge: tokens.category.concierge.solid,
};

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Ground({ dark }: { dark: boolean }) {
  return (
    <group>
      <RoundedBox
        args={[SPAN + 3, 0.35, SPAN + 3]}
        radius={0.16}
        smoothness={4}
        position={[0, -0.18, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color={dark ? '#141417' : '#F4F4F5'}
          roughness={0.95}
          metalness={0}
        />
      </RoundedBox>
      <gridHelper
        args={[SPAN + 3, 22, dark ? '#27272A' : '#E4E4E7', dark ? '#1C1C1F' : '#EBEBEE']}
        position={[0, 0.002, 0]}
      />
    </group>
  );
}

/** The Vaigai, as a soft ribbon across the middle of the city. */
function River({ dark }: { dark: boolean }) {
  const curve = React.useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-SPAN / 2 - 1.5, 0.01, 1.4),
        new THREE.Vector3(-2, 0.01, 0.2),
        new THREE.Vector3(1.6, 0.01, -0.5),
        new THREE.Vector3(SPAN / 2 + 1.5, 0.01, -1.9),
      ]),
    [],
  );
  const geometry = React.useMemo(() => new THREE.TubeGeometry(curve, 48, 0.28, 8, false), [curve]);
  return (
    <mesh geometry={geometry} position={[0, 0.004, 0]}>
      <meshBasicMaterial color={dark ? '#16283D' : '#DCE9F5'} />
    </mesh>
  );
}

interface Cluster {
  id: string;
  name: string;
  x: number;
  z: number;
  count: number;
  valuePaise: number;
  dominant: string;
  oldestMinutes: number;
}

function LocalityPillar({ cluster, dark }: { cluster: Cluster; dark: boolean }) {
  const ref = React.useRef<THREE.Mesh>(null);
  const target = 0.25 + Math.min(cluster.count, 12) * 0.34;
  const color = CATEGORY_COLOR[cluster.dominant] ?? tokens.neutral.primary;
  // An order sitting for 20 minutes is a problem; make it visibly one.
  const hot = cluster.oldestMinutes > 20;

  useFrame((_, dt) => {
    if (!ref.current) return;
    // Ease the height so a new order grows in rather than popping.
    ref.current.scale.y = THREE.MathUtils.damp(ref.current.scale.y, target, 4, dt);
    ref.current.position.y = ref.current.scale.y / 2;
  });

  return (
    <group position={[cluster.x, 0, cluster.z]}>
      <mesh ref={ref} position={[0, target / 2, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.28, 1, 24]} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.05}
          emissive={hot ? tokens.state.verify.solid : '#000000'}
          emissiveIntensity={hot ? 0.35 : 0}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <ringGeometry args={[0.4, 0.46, 32]} />
        <meshBasicMaterial color={dark ? '#27272A' : '#D4D4D8'} />
      </mesh>

      <DreiHtml
        position={[0, target + 0.42, 0]}
        center
        distanceFactor={12}
        occlude={false}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex -translate-y-1 flex-col items-center gap-0.5 whitespace-nowrap">
          <span className="rounded-md border bg-background/95 px-2 py-1 text-[10px] font-semibold tracking-tight shadow-sm backdrop-blur">
            {cluster.name}
          </span>
          <span className="tnum rounded-sm bg-foreground px-1.5 py-0.5 text-[9px] font-semibold text-background">
            {cluster.count} · {formatInr(cluster.valuePaise)}
          </span>
        </div>
      </DreiHtml>
    </group>
  );
}

interface Leg {
  id: string;
  from: [number, number];
  to: [number, number];
  color: string;
  /** 0..1 — how far along the rider is. */
  progress: number;
  label: string;
}

function RiderLeg({ leg, dark }: { leg: Leg; dark: boolean }) {
  const dot = React.useRef<THREE.Mesh>(null);
  const t = React.useRef(leg.progress);

  const curve = React.useMemo(() => {
    const a = new THREE.Vector3(leg.from[0], 0.08, leg.from[1]);
    const b = new THREE.Vector3(leg.to[0], 0.08, leg.to[1]);
    const mid = a.clone().lerp(b, 0.5);
    // Arc the leg upward so overlapping routes stay readable.
    mid.y = 0.08 + a.distanceTo(b) * 0.22;
    return new THREE.QuadraticBezierCurve3(a, mid, b);
  }, [leg.from, leg.to]);

  const line = React.useMemo(() => {
    const pts = curve.getPoints(40);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [curve]);

  useFrame((_, dt) => {
    if (!dot.current) return;
    // Drift forward continuously; the real progress from Firestore snaps it
    // back on the next status change.
    t.current = (t.current + dt * 0.045) % 1;
    const p = curve.getPointAt(Math.max(0.001, Math.min(0.999, t.current)));
    dot.current.position.copy(p);
  });

  return (
    <group>
      <primitive object={new THREE.Line(line, new THREE.LineBasicMaterial({
        color: leg.color,
        transparent: true,
        opacity: dark ? 0.5 : 0.35,
      }))} />
      <mesh ref={dot} castShadow>
        <sphereGeometry args={[0.115, 20, 20]} />
        <meshStandardMaterial
          color={leg.color}
          emissive={leg.color}
          emissiveIntensity={0.7}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

function Scene({ orders, dark }: { orders: Order[]; dark: boolean }) {
  const clusters = React.useMemo<Cluster[]>(() => {
    const map = new Map<string, Cluster>();
    for (const o of orders) {
      const loc = localityById(o.localityId);
      if (!loc) continue;
      const full = LOCALITIES.find((l) => l.id === loc.id)!;
      const [x, z] = project(full.lat, full.lng);
      const existing = map.get(loc.id) ?? {
        id: loc.id,
        name: loc.name,
        x,
        z,
        count: 0,
        valuePaise: 0,
        dominant: o.category,
        oldestMinutes: 0,
      };
      existing.count += 1;
      existing.valuePaise += o.pricing.totalPaise;
      existing.oldestMinutes = Math.max(
        existing.oldestMinutes,
        Math.round((Date.now() - o.createdAt) / 60000),
      );
      map.set(loc.id, existing);
    }
    return [...map.values()];
  }, [orders]);

  const legs = React.useMemo<Leg[]>(() => {
    return orders
      .filter((o) => o.riderUid && columnOf(o.status) === 'dispatched')
      .map((o) => {
        const store = storeById(o.storeId);
        const storeLoc = LOCALITIES.find((l) => l.id === store?.localityId) ?? LOCALITIES[0]!;
        const dropLoc = LOCALITIES.find((l) => l.id === o.localityId) ?? LOCALITIES[0]!;
        const done = ['picked_up', 'out_for_delivery'].includes(o.status) ? 0.6 : 0.15;
        return {
          id: o.id,
          from: project(storeLoc.lat, storeLoc.lng),
          to: project(dropLoc.lat, dropLoc.lng),
          color: CATEGORY_COLOR[o.category] ?? tokens.neutral.primary,
          progress: done,
          label: o.riderName ?? '',
        };
      });
  }, [orders]);

  return (
    <>
      <ambientLight intensity={dark ? 0.7 : 1.1} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={dark ? 1.1 : 1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Ground dark={dark} />
      <River dark={dark} />
      {clusters.map((c) => (
        <LocalityPillar key={c.id} cluster={c} dark={dark} />
      ))}
      {legs.map((l) => (
        <RiderLeg key={l.id} leg={l} dark={dark} />
      ))}
      <OrbitControls
        makeDefault
        enablePan
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2.35}
        minDistance={7}
        maxDistance={24}
        autoRotate
        autoRotateSpeed={0.28}
      />
    </>
  );
}

export function LiveMap3D({ orders }: { orders: Order[] }) {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setDark(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 9.5, 12], fov: 38 }}
      // The scene is a fixed situation display — no need to burn frames when
      // nothing is animating off-screen.
      frameloop="always"
      style={{ background: dark ? '#09090B' : '#FAFAFA' }}
    >
      <React.Suspense fallback={null}>
        <Scene orders={orders} dark={dark} />
      </React.Suspense>
    </Canvas>
  );
}
