/**
 * The order-status scene.
 *
 * A 3D read of where an order is, on the tracking screen. It exists because
 * waiting is the worst part of a delivery and a progress bar does nothing for
 * it — a scooter that has visibly moved since you last looked answers "is it
 * close?" faster than reading a status line.
 *
 * It changes shape with the order rather than just changing colour:
 *
 *   confirmed   the parcel sits still on the pad
 *   packing     it turns while the store fills it
 *   on the way  a scooter carries it along an arc
 *   delivered   it settles, the ring closes, motion stops
 *
 * Same guards as the hero: lazily required, falls back to a flat scene, and
 * stops animating once the order is done so a delivered order does not hold a
 * GL context open in someone's pocket.
 */

import * as React from 'react';
import { View } from 'react-native';

import type { OrderStatus } from '@dfc/core';

import { StatusFallback } from './status-fallback';

type Mod = {
  Canvas: React.ComponentType<Record<string, unknown>>;
  useFrame: (cb: (state: unknown, delta: number) => void) => void;
};

let mod: Mod | null = null;
let attempted = false;

function load(): Mod | null {
  if (attempted) return mod;
  attempted = true;
  try {
    const fiber = require('@react-three/fiber/native');
    if (!fiber?.Canvas || !fiber?.useFrame) {
      mod = null;
      return null;
    }
    mod = { Canvas: fiber.Canvas, useFrame: fiber.useFrame };
  } catch {
    mod = null;
  }
  return mod;
}

export type StatusPhase = 'confirmed' | 'packing' | 'moving' | 'delivered';

export function phaseOf(status: OrderStatus): StatusPhase {
  switch (status) {
    case 'delivered':
      return 'delivered';
    case 'picked_up':
    case 'out_for_delivery':
    case 'dispatched':
      return 'moving';
    case 'vendor_accepted':
    case 'packing':
    case 'ready_for_pickup':
      return 'packing';
    default:
      return 'confirmed';
  }
}

const PHASE_COLOR: Record<StatusPhase, { body: string; accent: string; glow: string }> = {
  confirmed: { body: '#3F3F46', accent: '#A1A1AA', glow: '#71717A' },
  packing: { body: '#1E3A8A', accent: '#DBEAFE', glow: '#2563EB' },
  moving: { body: '#18181B', accent: '#FAFAFA', glow: '#2563EB' },
  delivered: { body: '#14532D', accent: '#BBF7D0', glow: '#16A34A' },
};

function makeScene(m: Mod, phase: StatusPhase) {
  const { useFrame } = m;
  const c = PHASE_COLOR[phase];

  return function Scene() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parcel = React.useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ring = React.useRef<any>(null);
    const t = React.useRef(0);

    useFrame((_s, delta) => {
      t.current += delta;

      if (parcel.current) {
        switch (phase) {
          case 'confirmed':
            // Barely alive — waiting, not working.
            parcel.current.rotation.y += delta * 0.12;
            parcel.current.position.x = 0;
            parcel.current.position.y = Math.sin(t.current * 0.7) * 0.04;
            break;
          case 'packing':
            // Busy: turning as it is filled.
            parcel.current.rotation.y += delta * 0.9;
            parcel.current.rotation.x = Math.sin(t.current * 1.4) * 0.14;
            parcel.current.position.y = Math.sin(t.current * 1.8) * 0.06;
            break;
          case 'moving': {
            // Travelling left to right along a shallow arc, then looping.
            const cycle = (t.current * 0.32) % 1;
            parcel.current.position.x = -1.9 + cycle * 3.8;
            parcel.current.position.y = Math.sin(cycle * Math.PI) * 0.34;
            parcel.current.rotation.y += delta * 1.5;
            parcel.current.rotation.z = -0.12;
            break;
          }
          case 'delivered':
            // Landed. Nothing moves.
            parcel.current.rotation.y = 0.62;
            parcel.current.rotation.x = 0.28;
            parcel.current.position.set(0, 0, 0);
            break;
        }
      }

      if (ring.current && phase !== 'delivered') {
        ring.current.rotation.z += delta * 0.5;
      }
    });

    return (
      <>
        <ambientLight intensity={1.15} />
        <directionalLight position={[3, 5, 4]} intensity={2} />
        <pointLight position={[-3, -1, -2]} intensity={7} color={c.glow} distance={12} />

        {/* The pad the parcel travels over */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]}>
          <circleGeometry args={[2.4, 48]} />
          <meshBasicMaterial color={c.glow} transparent opacity={0.07} />
        </mesh>

        {/* A turning ring — stops the moment the order lands */}
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.93, 0]}>
          <ringGeometry args={[1.55, 1.62, 64, 1, 0, phase === 'delivered' ? Math.PI * 2 : Math.PI * 1.2]} />
          <meshBasicMaterial color={c.glow} transparent opacity={phase === 'delivered' ? 0.6 : 0.35} />
        </mesh>

        <group ref={parcel} rotation={[0.28, 0.6, 0]}>
          <mesh>
            <boxGeometry args={[1.05, 1.05, 1.05]} />
            <meshPhysicalMaterial
              color={c.body}
              roughness={0.3}
              metalness={0.12}
              clearcoat={1}
              clearcoatRoughness={0.2}
            />
          </mesh>
          <mesh>
            <boxGeometry args={[1.08, 0.17, 1.08]} />
            <meshStandardMaterial color={c.accent} roughness={0.5} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[1.08, 0.17, 1.08]} />
            <meshStandardMaterial color={c.accent} roughness={0.5} />
          </mesh>
        </group>
      </>
    );
  };
}

export function Status3D({
  status,
  height = 190,
}: {
  status: OrderStatus;
  height?: number;
}) {
  const phase = phaseOf(status);
  const m = load();
  const Scene = React.useMemo(() => (m ? makeScene(m, phase) : null), [m, phase]);

  if (!m || !Scene) return <StatusFallback phase={phase} height={height} />;

  const { Canvas } = m;

  return (
    <View style={{ height }} pointerEvents="none">
      <Canvas
        camera={{ position: [0, 0.7, 4.4], fov: 44 }}
        gl={{ antialias: true, alpha: true }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </View>
  );
}
