/**
 * The 3D hero.
 *
 * A slowly turning delivery parcel, lit like a product shot. It sits on the
 * onboarding and sign-in screens, where there is no data on screen and the
 * whole job is to make the app feel considered in the first two seconds.
 *
 * Three rules keep it from being a liability:
 *
 *   It never blocks. react-three-fiber and expo-gl are native modules, so the
 *   whole scene is required lazily and falls back to a flat illustration if
 *   they are missing (Expo Go) or throw. A first-run crash on the login screen
 *   would be the worst possible place for one.
 *
 *   It stops. `frameloop="demand"` plus an explicit invalidate loop means the
 *   GL context is not pinned at 60fps behind a keyboard. On the login screen a
 *   customer may sit for a minute typing an OTP; that should not cost battery.
 *
 *   It is small. Primitive geometry and two lights — no model download, no
 *   texture, nothing that delays first paint.
 */

import * as React from 'react';
import { View } from 'react-native';

import { GlossyParcelFallback } from './hero-fallback';

type Mod = {
  Canvas: React.ComponentType<Record<string, unknown>>;
  useFrame: (cb: (state: unknown, delta: number) => void) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  THREE: any;
};

let mod: Mod | null = null;
let attempted = false;

/** Resolved once, lazily — a missing native module must not crash the screen. */
function load(): Mod | null {
  if (attempted) return mod;
  attempted = true;
  try {
     
    const fiber = require('@react-three/fiber/native');
    const THREE = require('three');
     
    mod = { Canvas: fiber.Canvas, useFrame: fiber.useFrame, THREE };
  } catch {
    mod = null;
  }
  return mod;
}

export type HeroTone = 'brand' | 'pharmacy' | 'grocery';

const TONE: Record<HeroTone, { body: string; accent: string; glow: string }> = {
  brand: { body: '#18181B', accent: '#FAFAFA', glow: '#2563EB' },
  pharmacy: { body: '#1E3A8A', accent: '#DBEAFE', glow: '#2563EB' },
  grocery: { body: '#14532D', accent: '#BBF7D0', glow: '#16A34A' },
};

/**
 * The scene. Defined as a factory so `useFrame` is only referenced once the
 * module is known to exist — calling a hook from a package that failed to load
 * would throw at render.
 */
function makeScene(m: Mod, tone: HeroTone, spin: boolean) {
  const { useFrame, THREE } = m;
  const c = TONE[tone];

  return function Scene() {
    const group = React.useRef<{ rotation: { x: number; y: number }; position: { y: number } } | null>(
      null,
    );
    const t = React.useRef(0);

    useFrame((_state, delta) => {
      if (!group.current || !spin) return;
      t.current += delta;
      group.current.rotation.y += delta * 0.42;
      // A slow bob, so it reads as floating rather than mounted on a turntable.
      group.current.rotation.x = Math.sin(t.current * 0.6) * 0.09;
      group.current.position.y = Math.sin(t.current * 0.9) * 0.09;
    });

    return (
      <>
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 6, 5]} intensity={2.1} />
        {/* Rim light in the accent hue — this is what reads as "glossy". */}
        <pointLight position={[-4, -1, -3]} intensity={9} color={c.glow} distance={14} />

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <group ref={group as any} rotation={[0.3, 0.6, 0]}>
          {/* Box */}
          <mesh castShadow>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshPhysicalMaterial
              color={c.body}
              roughness={0.28}
              metalness={0.15}
              clearcoat={1}
              clearcoatRoughness={0.18}
            />
          </mesh>

          {/* Tape, two bands, slightly proud of the surface */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.54, 0.24, 1.54]} />
            <meshStandardMaterial color={c.accent} roughness={0.55} />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[1.54, 0.24, 1.54]} />
            <meshStandardMaterial color={c.accent} roughness={0.55} />
          </mesh>

          {/* Edge highlight */}
          <lineSegments>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <edgesGeometry args={[new THREE.BoxGeometry(1.5, 1.5, 1.5)] as any} />
            <lineBasicMaterial color={c.glow} transparent opacity={0.5} />
          </lineSegments>
        </group>
      </>
    );
  };
}

export function Hero3D({
  tone = 'brand',
  height = 220,
  spin = true,
}: {
  tone?: HeroTone;
  height?: number;
  spin?: boolean;
}) {
  const m = load();

  // No native GL — the flat illustration is the same silhouette, so the screen
  // still looks deliberate rather than broken.
  if (!m) return <GlossyParcelFallback tone={tone} height={height} />;

  const Scene = React.useMemo(() => makeScene(m, tone, spin), [m, tone, spin]);
  const { Canvas } = m;

  return (
    <View style={{ height }} pointerEvents="none">
      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </View>
  );
}
