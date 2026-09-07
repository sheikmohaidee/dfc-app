/**
 * The real map.
 *
 * react-native-maps — Google Maps on Android, Apple Maps on iOS. It shows the
 * pickup, the drop, and the rider's live position, and it auto-fits the three
 * so nobody has to pinch.
 *
 * Two deliberate decisions:
 *
 *   Turn-by-turn is a hand-off. Every rider in Madurai already navigates with
 *   Google Maps; reimplementing it badly inside DFC would be worse than one
 *   tap into the app they trust. So this map is situational awareness plus a
 *   Navigate button.
 *
 *   It degrades. react-native-maps needs a development build; in Expo Go the
 *   native module is missing. Rather than crash, we fall back to the schematic
 *   SVG route, which is still useful.
 */

import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Crosshair, Navigation } from 'lucide-react-native';

import { LOCALITIES, haversineKm, type LocalityGeo } from '@dfc/core';
import { openFirstAvailable } from '@/lib/linking';
import { Num, T } from './index';
import { RouteMap } from './route-map';

// The native module is optional: a missing dev build must not take the app
// down, so it is resolved at runtime rather than imported at the top level.
type MapsModule = typeof import('react-native-maps');
let Maps: MapsModule | null = null;
try {
   
  Maps = require('react-native-maps') as MapsModule;
} catch {
  Maps = null;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LiveMapProps {
  fromLocalityId: string;
  toLocalityId: string;
  /** Live rider position, when one is being reported. */
  rider?: LatLng | null;
  /** Fallback progress for the schematic view. */
  progress?: number;
  minutes?: number;
  height?: number;
}

const coordOf = (id: string): LocalityGeo =>
  LOCALITIES.find((l) => l.id === id) ?? LOCALITIES[0]!;

/**
 * A gentle arc between two points. Real road geometry needs the Directions
 * API; until that key is set, a curve reads far better than a ruler-straight
 * line laid over a street grid.
 */
function arc(a: LatLng, b: LatLng, steps = 24): { latitude: number; longitude: number }[] {
  const out: { latitude: number; longitude: number }[] = [];
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Perpendicular offset, largest in the middle.
    const bulge = Math.sin(Math.PI * t) * 0.12;
    out.push({
      latitude: a.lat + dy * t - dx * bulge,
      longitude: a.lng + dx * t + dy * bulge,
    });
  }
  return out;
}

/** Muted map styling so the route and pins stay the loudest thing on screen. */
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F1F1F3' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A1A1AA' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#FAFAFA' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#DCE9F5' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#E3F2E7' }] },
];

export function LiveMap({
  fromLocalityId,
  toLocalityId,
  rider,
  progress = 0.4,
  minutes,
  height = 288,
}: LiveMapProps) {
  const from = coordOf(fromLocalityId);
  const to = coordOf(toLocalityId);
  const mapRef = React.useRef<InstanceType<NonNullable<MapsModule>['default']> | null>(null);

  const remainingKm = React.useMemo(() => {
    const origin = rider ?? { lat: from.lat, lng: from.lng };
    return Math.round(haversineKm(origin.lat, origin.lng, to.lat, to.lng) * 1.35 * 10) / 10;
  }, [rider, from, to]);

  const fit = React.useCallback(() => {
    const points = [
      { latitude: from.lat, longitude: from.lng },
      { latitude: to.lat, longitude: to.lng },
      ...(rider ? [{ latitude: rider.lat, longitude: rider.lng }] : []),
    ];
    mapRef.current?.fitToCoordinates(points, {
      edgePadding: { top: 90, right: 70, bottom: 90, left: 70 },
      animated: true,
    });
  }, [from, to, rider]);

  React.useEffect(() => {
    const id = setTimeout(fit, 450);
    return () => clearTimeout(id);
  }, [fit]);

  /**
   * Hands the rider to a real navigation app.
   *
   * Tried in order, first one that opens wins. The https link is last and is
   * the only one guaranteed to resolve — every phone has a browser, and
   * Google Maps claims that URL when it is installed. `two_wheeler` matters:
   * it is the mode that routes down the lanes a Madurai delivery actually
   * uses, and the one the rider would have picked themselves.
   */
  function navigate() {
    const dest = `${to.lat},${to.lng}`;
    const web = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=two_wheeler`;

    void openFirstAvailable(
      Platform.OS === 'ios'
        ? [
            `comgooglemaps://?daddr=${dest}&directionsmode=driving`,
            `maps://?daddr=${dest}&dirflg=d`,
            web,
          ]
        : [`google.navigation:q=${dest}&mode=d`, `geo:${dest}?q=${dest}`, web],
    );
  }

  // No native module (Expo Go): the schematic still tells the rider which way.
  if (!Maps) {
    return (
      <RouteMap
        fromLocalityId={fromLocalityId}
        toLocalityId={toLocalityId}
        progress={progress}
        minutes={minutes}
      />
    );
  }

  const MapView = Maps.default;
  const { Marker, Polyline, PROVIDER_GOOGLE } = Maps;

  return (
    <View style={{ height }} className="bg-muted">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        // Google-flavoured styling JSON, and Apple Maps ignores it. Passing it
        // only where it does something keeps the iOS/Android difference stated
        // rather than looking like it should have worked.
        customMapStyle={Platform.OS === 'android' ? MAP_STYLE : undefined}
        initialRegion={{
          latitude: (from.lat + to.lat) / 2,
          longitude: (from.lng + to.lng) / 2,
          latitudeDelta: Math.max(0.03, Math.abs(from.lat - to.lat) * 2.4),
          longitudeDelta: Math.max(0.03, Math.abs(from.lng - to.lng) * 2.4),
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onMapReady={fit}
      >
        <Polyline
          coordinates={arc(
            rider ?? { lat: from.lat, lng: from.lng },
            { lat: to.lat, lng: to.lng },
          )}
          strokeColor="#18181B"
          strokeWidth={5}
          lineCap="round"
        />

        <Marker
          coordinate={{ latitude: from.lat, longitude: from.lng }}
          title="Pickup"
          description={from.name}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View className="size-[26px] items-center justify-center rounded-full border-[3px] border-white bg-pharmacy" />
        </Marker>

        <Marker
          coordinate={{ latitude: to.lat, longitude: to.lng }}
          title="Drop"
          description={to.name}
        >
          <View className="items-center">
            <View className="size-7 items-center justify-center rounded-full border-[3px] border-white bg-primary">
              <View className="size-2 rounded-full bg-white" />
            </View>
          </View>
        </Marker>

        {rider ? (
          <Marker
            coordinate={{ latitude: rider.lat, longitude: rider.lng }}
            title="Rider"
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <View className="size-8 items-center justify-center rounded-full bg-pharmacy/20">
              <View className="size-[15px] rounded-full border-[3px] border-white bg-pharmacy" />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <View className="absolute left-3 top-3 flex-row items-center gap-2 rounded-[9px] border border-border bg-background px-3 py-2">
        <Navigation size={15} color="#18181B" strokeWidth={2.2} />
        <Num className="text-sm font-semibold tracking-tight">{remainingKm} km</Num>
        {minutes ? (
          <>
            <View className="h-3.5 w-px bg-border" />
            <Num className="text-sm font-semibold tracking-tight">{minutes} min</Num>
          </>
        ) : null}
      </View>

      <View className="absolute bottom-3 right-3 gap-2.5">
        <Pressable
          onPress={fit}
          className="size-[46px] items-center justify-center rounded-xl border border-border bg-background"
        >
          <Crosshair size={21} color="#18181B" strokeWidth={2} />
        </Pressable>
        <Pressable
          onPress={navigate}
          className="h-[46px] flex-row items-center gap-2 rounded-xl bg-primary px-4"
          style={{
            shadowColor: '#09090B',
            shadowOpacity: 0.24,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
        >
          <Navigation size={17} color="#FAFAFA" strokeWidth={2.2} />
          <T className="text-[13.5px] font-semibold text-primary-foreground">Navigate</T>
        </Pressable>
      </View>
    </View>
  );
}
