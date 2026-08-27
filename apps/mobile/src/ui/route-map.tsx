/**
 * The rider's route view.
 *
 * A deliberately schematic map, drawn with SVG from real relative geography —
 * no tiles, no API key, no network round trip when a rider is on a weak
 * connection outside a shop. It answers "which way, roughly how far" at a
 * glance in sunlight, which is what the top of the screen is for. Turn-by-turn
 * is a hand-off to Google Maps, which every rider in Madurai already uses.
 */

import * as React from 'react';
import { Linking, Pressable, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Crosshair, Navigation } from 'lucide-react-native';

import { LOCALITIES, routeKm, type LocalityGeo } from '@dfc/core';
import { Num, T } from './index';

const W = 390;
const H = 288;

/** Map the two endpoints onto the canvas with a comfortable margin. */
function layout(from: LocalityGeo, to: LocalityGeo) {
  const pad = 64;
  const lats = LOCALITIES.map((l) => l.lat);
  const lngs = LOCALITIES.map((l) => l.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const px = (l: LocalityGeo): [number, number] => [
    pad + ((l.lng - minLng) / (maxLng - minLng || 1)) * (W - pad * 2),
    pad + (1 - (l.lat - minLat) / (maxLat - minLat || 1)) * (H - pad * 2),
  ];

  return { a: px(from), b: px(to) };
}

export function RouteMap({
  fromLocalityId,
  toLocalityId,
  progress = 0.5,
  minutes,
}: {
  fromLocalityId: string;
  toLocalityId: string;
  /** 0..1 — where the rider is along the leg. */
  progress?: number;
  minutes?: number;
}) {
  const from = LOCALITIES.find((l) => l.id === fromLocalityId) ?? LOCALITIES[0]!;
  const to = LOCALITIES.find((l) => l.id === toLocalityId) ?? LOCALITIES[1]!;
  const { a, b } = layout(from, to);
  const km = routeKm(from.id, to.id);

  // An L-shaped path reads as "streets" rather than "as the crow flies".
  const midX = (a[0] + b[0]) / 2;
  const d = `M ${a[0]} ${a[1]} L ${midX} ${a[1]} L ${midX} ${b[1]} L ${b[0]} ${b[1]}`;

  const here: [number, number] =
    progress < 0.5
      ? [a[0] + (midX - a[0]) * (progress * 2), a[1]]
      : [midX, a[1] + (b[1] - a[1]) * ((progress - 0.5) * 2)];

  function openMaps() {
    const q = `${to.lat},${to.lng}`;
    void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=two_wheeler`);
  }

  return (
    <View style={{ height: H }} className="bg-muted">
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Rect width={W} height={H} fill="#F1F1F3" />

        {/* The Vaigai */}
        <Rect x={-20} y={126} width={W + 40} height={34} fill="#DCE9F5" transform="rotate(-6 195 143)" />

        {/* Parks */}
        <Rect x={24} y={26} width={86} height={56} rx={6} fill="#E3F2E7" />
        <Rect x={272} y={196} width={96} height={62} rx={6} fill="#E3F2E7" />

        {/* Arterial roads */}
        <G stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" fill="none">
          <Line x1={-10} y1={62} x2={400} y2={62} />
          <Line x1={-10} y1={214} x2={400} y2={214} />
          <Line x1={64} y1={-10} x2={64} y2={300} />
          <Line x1={212} y1={-10} x2={212} y2={300} />
          <Line x1={320} y1={-10} x2={320} y2={300} />
        </G>
        <G stroke="#E4E4E7" strokeWidth={6} strokeLinecap="round" fill="none">
          <Line x1={-10} y1={128} x2={400} y2={128} />
          <Line x1={136} y1={-10} x2={136} y2={300} />
          <Line x1={-10} y1={172} x2={400} y2={172} />
        </G>

        {/* The leg */}
        <Path d={d} stroke="#18181B" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Pickup */}
        <Circle cx={a[0]} cy={a[1]} r={13} fill="#2563EB" stroke="#FFFFFF" strokeWidth={3.5} />

        {/* Drop */}
        <Path
          d={`M ${b[0]} ${b[1] + 18} c 0 0 -11 -10 -11 -18 a 11 11 0 0 1 22 0 c 0 8 -11 18 -11 18 z`}
          fill="#18181B"
          stroke="#FFFFFF"
          strokeWidth={3}
        />
        <Circle cx={b[0]} cy={b[1]} r={4} fill="#FFFFFF" />

        {/* Rider */}
        <Circle cx={here[0]} cy={here[1]} r={11} fill="#2563EB" opacity={0.18} />
        <Circle cx={here[0]} cy={here[1]} r={6.5} fill="#2563EB" stroke="#FFFFFF" strokeWidth={2.6} />

        <SvgText x={a[0] - 34} y={a[1] - 22} fontSize={10.5} fontWeight="600" fill="#A1A1AA">
          {from.name.toUpperCase()}
        </SvgText>
        <SvgText x={b[0] - 34} y={b[1] + 34} fontSize={10.5} fontWeight="600" fill="#A1A1AA">
          {to.name.toUpperCase()}
        </SvgText>
      </Svg>

      {/* Distance chip */}
      <View className="absolute left-3 top-3 flex-row items-center gap-2 rounded-[9px] border border-border bg-background px-3 py-2">
        <Navigation size={15} color="#18181B" strokeWidth={2.2} />
        <Num className="text-sm font-semibold tracking-tight">{km} km</Num>
        {minutes ? (
          <>
            <View className="h-3.5 w-px bg-border" />
            <Num className="text-sm font-semibold tracking-tight">{minutes} min</Num>
          </>
        ) : null}
      </View>

      {/* Hand off to a real navigator */}
      <Pressable
        onPress={openMaps}
        className="absolute bottom-3 right-3 size-[46px] items-center justify-center rounded-xl border border-border bg-background"
        style={{
          shadowColor: '#09090B',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        }}
      >
        <Crosshair size={21} color="#18181B" strokeWidth={2} />
      </Pressable>

      <View className="hidden">
        <T>{km}</T>
      </View>
    </View>
  );
}
