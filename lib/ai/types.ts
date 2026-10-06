/**
 * AI Trek Intelligence Type Definitions
 * Location: lib/ai/types.ts
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export type SeparationStatus = "NORMAL" | "WARNING" | "CRITICAL";
export type RouteStatus = "ON_TRACK" | "DEVIATED" | "OFF_TRAIL";
export type MovementStatus = "MOVING" | "SLOW" | "STOPPED" | "ABNORMAL";

export interface SimulatedTrekker {
  id: string;
  name: string;
  isGuide: boolean;
  latitude: number;
  longitude: number;
  altitude?: number;
  speedKmh: number;
  accuracyMeters: number;
  heading: number;
  progressPercent: number; // 0 to 100%
  separationStatus: SeparationStatus;
  distanceFromCentroidMeters: number;
  distanceFromRouteMeters: number;
  stoppedDurationSeconds: number;
  isDeviated: boolean;
  isSeparated: boolean;
  isStopped: boolean;
  consecutiveAnomalies: number;
}

export interface TrekRouteSection {
  id: string;
  name: string;
  startCheckpoint: string;
  endCheckpoint: string;
  difficulty: "EASY" | "MODERATE" | "DIFFICULT" | "STEEP";
  distanceKm: number;
  elevationGainM: number;
  averagePaceMinPerKm: number;
  estimatedDurationMinutes: number;
  terrainType: string;
  riskFactor: "LOW" | "MODERATE" | "HIGH";
  bottleneckWarning?: string;
}

export interface GuardianAssessment {
  groupStatus: SeparationStatus;
  routeStatus: "ON TRACK" | "DEVIATION DETECTED";
  activeCount: number;
  totalCount: number;
  centroid: LatLng | null;
  anomalies: Array<{
    trekkerId: string;
    trekkerName: string;
    type: "SEPARATION" | "ROUTE_DEVIATION" | "LONG_STOP" | "ABNORMAL_SPEED";
    severity: SeparationStatus;
    message: string;
    distanceMeters?: number;
    durationSeconds?: number;
  }>;
}

export interface ProgressETAResult {
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  totalDistanceKm: number;
  progressPercent: number;
  currentSpeedKmh: number;
  averageSpeedKmh: number;
  currentCheckpointIndex: number;
  currentCheckpointName: string;
  nextCheckpointName: string;
  checkpointsCompleted: number;
  totalCheckpoints: number;
  elapsedTimeSeconds: number;
  predictedRemainingMinutes: number;
  expectedCompletionTimeStr: string;
}

export interface RecommendationCriteria {
  difficulty?: "ANY" | "EASY" | "MODERATE" | "DIFFICULT" | "EXTREME";
  durationDays?: number | "ANY";
  maxBudget?: number | "ANY";
  location?: string | "ANY";
  season?: "ANY" | "MONSOON" | "WINTER" | "SUMMER" | "POST_MONSOON";
  maxDistanceKm?: number | "ANY";
}

export interface TrekRecommendation {
  trekId: string;
  name: string;
  slug: string;
  location: string;
  state: string;
  difficulty: string;
  distanceKm: number;
  durationDays: number;
  pricePerDay: number;
  totalPrice: number;
  imageUrl: string;
  matchScorePercent: number; // 0 - 100
  matchReasons: string[];
  bestSeason: string;
  highlights: string[];
}
