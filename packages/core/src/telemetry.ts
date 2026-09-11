/**
 * High-Frequency Spatial Telemetry, Dead Reckoning & Indoor Wayfinding.
 *
 * Implements smooth coordinate prediction between 3-second GPS pings,
 * sensor fusion (compass heading + velocity vector), and multi-level
 * indoor routing anchors for large commercial & residential complexes.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TelemetryPing {
  riderUid: string;
  orderId: string | null;
  lat: number;
  lng: number;
  headingDeg: number; // 0 to 360 (0 = North, 90 = East)
  speedKmph: number;
  accuracyMeters: number;
  timestamp: number; // ms
  accelerometer?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface DeadReckoningState {
  currentLat: number;
  currentLng: number;
  projectedLat: number;
  projectedLng: number;
  headingDeg: number;
  speedKmph: number;
  confidence: number; // 0.0 to 1.0
  isSimulated: boolean;
}

export interface IndoorWaypoint {
  id: string;
  complexName: string;
  localityId: string;
  gateCode: string; // e.g., "Gate 2 (West Entry)"
  towerOrBlock: string; // e.g., "Tower C / Block 4"
  floorLevel: string; // e.g., "3rd Floor, Suite 304"
  elevatorNear: string; // e.g., "Take Lift B next to lobby cafe"
  arDirectionBearingDeg: number;
  landmarkPhotoHint?: string;
}

// ---------------------------------------------------------------------------
// Geodesic Math & Dead Reckoning
// ---------------------------------------------------------------------------

const EARTH_RADIUS_METERS = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Calculates geodesic distance in meters between two coordinates.
 */
export function haversineDistanceMeters(p1: LatLng, p2: LatLng): number {
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates compass bearing from start to destination in degrees (0..360).
 */
export function calculateBearingDeg(from: LatLng, to: LatLng): number {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Projects a new coordinate given a starting position, heading in degrees,
 * speed in km/h, and elapsed time in milliseconds.
 * Used to predict rider position during GPS blackouts/bridges.
 */
export function projectDeadReckoning(
  origin: LatLng,
  headingDeg: number,
  speedKmph: number,
  elapsedMs: number,
): LatLng {
  if (speedKmph <= 0 || elapsedMs <= 0) {
    return { lat: origin.lat, lng: origin.lng };
  }

  const speedMetersPerSec = (speedKmph * 1000) / 3600;
  const distanceMeters = speedMetersPerSec * (elapsedMs / 1000);
  const distRatio = distanceMeters / EARTH_RADIUS_METERS;
  const brngRad = toRad(headingDeg);

  const lat1 = toRad(origin.lat);
  const lng1 = toRad(origin.lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distRatio) + Math.cos(lat1) * Math.sin(distRatio) * Math.cos(brngRad),
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brngRad) * Math.sin(distRatio) * Math.cos(lat1),
      Math.cos(distRatio) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lat: toDeg(lat2),
    lng: toDeg(lng2),
  };
}

/**
 * Interpolates smoothly between two telemetry points for 60fps map animation.
 * Progress is clamped between 0.0 (start) and 1.0 (end).
 */
export function interpolateTelemetryPosition(
  p1: LatLng,
  p2: LatLng,
  progress: number,
): LatLng {
  const t = Math.max(0, Math.min(1, progress));
  // Smooth cubic ease-in-out curve
  const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  return {
    lat: p1.lat + (p2.lat - p1.lat) * ease,
    lng: p1.lng + (p2.lng - p1.lng) * ease,
  };
}

// ---------------------------------------------------------------------------
// Madurai Major Complexes Indoor Wayfinding Seed Data
// ---------------------------------------------------------------------------

export const MADURAI_INDOOR_LANDMARKS: Record<string, IndoorWaypoint> = {
  'elcot-it-park': {
    id: 'elcot-it-park',
    complexName: 'ELCOT IT Park (Ilandhaikulam)',
    localityId: 'kk-nagar',
    gateCode: 'Gate 1 (Main Security Plaza)',
    towerOrBlock: 'Block B (Fintech & Cloud Wing)',
    floorLevel: '2nd Floor, Food Delivery Bay',
    elevatorNear: 'North Wing High-Speed Elevator',
    arDirectionBearingDeg: 42,
    landmarkPhotoHint: 'Park two-wheeler near EV charging bay next to security booth.',
  },
  'meenakshi-mission-campus': {
    id: 'meenakshi-mission-campus',
    complexName: 'Meenakshi Mission Hospital Campus',
    localityId: 'mattuthavani',
    gateCode: 'Gate 3 (Emergency & Outpatient Entrance)',
    towerOrBlock: 'Specialty Block 2',
    floorLevel: 'Ground Floor, Staff Desk Station 4',
    elevatorNear: 'Central Glass Elevator',
    arDirectionBearingDeg: 135,
    landmarkPhotoHint: 'Rider entry strictly via Gate 3 drop box counter.',
  },
  'vishaal-de-mal': {
    id: 'vishaal-de-mal',
    complexName: 'Vishaal De Mal Commercial Complex',
    localityId: 'tallakulam',
    gateCode: 'Service Gate (South Basement)',
    towerOrBlock: 'Food Court & Retails Tier',
    floorLevel: '4th Floor, Counter FC-12',
    elevatorNear: 'Service Goods Lift 2',
    arDirectionBearingDeg: 270,
    landmarkPhotoHint: 'Enter via rear basement service ramp; take Service Lift 2.',
  },
  'anna-nagar-tech-towers': {
    id: 'anna-nagar-tech-towers',
    complexName: 'Anna Nagar Commercial Towers',
    localityId: 'anna-nagar',
    gateCode: 'Gate A (80 Feet Road Entrance)',
    towerOrBlock: 'Tower Alpha',
    floorLevel: '5th Floor, Suite 501',
    elevatorNear: 'Lift Lobby 1',
    arDirectionBearingDeg: 88,
    landmarkPhotoHint: 'Security registration required at Gate A intercom.',
  },
};

export function lookupIndoorWaypoint(localityId: string, addressHint: string): IndoorWaypoint | null {
  const query = addressHint.toLowerCase();
  for (const landmark of Object.values(MADURAI_INDOOR_LANDMARKS)) {
    if (
      landmark.localityId === localityId ||
      query.includes(landmark.complexName.toLowerCase()) ||
      query.includes(landmark.id)
    ) {
      return landmark;
    }
  }
  return null;
}
