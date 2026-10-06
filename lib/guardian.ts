export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface LocationInput {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  isSimulated?: boolean;
}

export function isValidObjectId(id: string): boolean {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export function calculateGroupCentroid(
  positions: Array<{ latitude: number; longitude: number }>
): { latitude: number; longitude: number } | null {
  if (!positions || positions.length === 0) return null;

  let totalLat = 0;
  let totalLng = 0;

  for (const pos of positions) {
    totalLat += pos.latitude;
    totalLng += pos.longitude;
  }

  return {
    latitude: totalLat / positions.length,
    longitude: totalLng / positions.length,
  };
}

export function distanceToRouteSegment(
  pLat: number,
  pLng: number,
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): number {
  const segmentLength = haversineDistance(startLat, startLng, destLat, destLng);
  if (segmentLength === 0) return haversineDistance(pLat, pLng, startLat, startLng);

  const d1 = haversineDistance(pLat, pLng, startLat, startLng);
  const d2 = haversineDistance(pLat, pLng, destLat, destLng);

  if (d1 * d1 > d2 * d2 + segmentLength * segmentLength) return d2;
  if (d2 * d2 > d1 * d1 + segmentLength * segmentLength) return d1;

  const s = (segmentLength + d1 + d2) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - segmentLength) * (s - d1) * (s - d2)));
  return (2 * area) / segmentLength;
}

export function evaluateSeparation(
  rawDistance: number,
  accuracy: number | null | undefined,
  thresholdMeters: number,
  previousConsecutive: number
): {
  separationStatus: "NORMAL" | "WARNING" | "CRITICAL";
  consecutiveDeviations: number;
  effectiveDistance: number;
  isSeparated: boolean;
} {
  const gpsAccuracy = typeof accuracy === "number" && !isNaN(accuracy) ? accuracy : 0;
  const effectiveDistance = Math.max(0, rawDistance - Math.min(gpsAccuracy, 20));

  if (effectiveDistance <= thresholdMeters) {
    return {
      separationStatus: "NORMAL",
      consecutiveDeviations: 0,
      effectiveDistance,
      isSeparated: false,
    };
  }

  const consecutive = previousConsecutive + 1;

  if (effectiveDistance > thresholdMeters * 2.5 || consecutive >= 6) {
    return {
      separationStatus: "CRITICAL",
      consecutiveDeviations: consecutive,
      effectiveDistance,
      isSeparated: true,
    };
  }

  if (consecutive >= 3) {
    return {
      separationStatus: "WARNING",
      consecutiveDeviations: consecutive,
      effectiveDistance,
      isSeparated: true,
    };
  }

  return {
    separationStatus: "NORMAL",
    consecutiveDeviations: consecutive,
    effectiveDistance,
    isSeparated: false,
  };
}

export function generateGroupCode(trekName: string): string {
  const clean = trekName
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase();
  const prefix = clean.length >= 3 ? clean : "TRK";
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `TRK-${prefix}-${randomDigits}`;
}
