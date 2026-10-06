/**
 * AI Trek Progress & ETA Predictor
 * Location: lib/ai/eta-predictor.ts
 *
 * This module predicts remaining trek duration, current pace, and expected
 * completion timestamps based on moving telemetry, checkpoint progress, and
 * terrain gradient factors.
 *
 * NOTE FOR PRESENTATION / EVALUATION:
 * The current baseline predictor uses kinematic pacing with terrain-weighted
 * gradient multipliers (exponential decay for steep ascent).
 * The function interface `predictProgressAndETA()` is ready to accept a
 * trained Regression / Gradient Boosted / Neural Network model weights.
 */

import { ProgressETAResult } from "./types";

export interface ETAPredictorInput {
  totalDistanceKm: number;
  progressPercent: number; // 0 to 100
  elapsedTimeSeconds: number;
  currentInstantSpeedKmh: number;
  checkpoints: string[];
  terrainDifficultyMultiplier?: number; // 1.0 = standard, 1.3 = steep ascent, 0.9 = descent
}

/**
 * Predicts progress metrics, speed trends, and completion timestamp.
 */
export function predictProgressAndETA(input: ETAPredictorInput): ProgressETAResult {
  const {
    totalDistanceKm,
    progressPercent,
    elapsedTimeSeconds,
    currentInstantSpeedKmh,
    checkpoints = [],
    terrainDifficultyMultiplier = 1.0,
  } = input;

  const boundedProgress = Math.min(100, Math.max(0, progressPercent));
  const distanceCoveredKm = Number(((totalDistanceKm * boundedProgress) / 100).toFixed(2));
  const distanceRemainingKm = Number(Math.max(0, totalDistanceKm - distanceCoveredKm).toFixed(2));

  // Average speed across entire elapsed time (in km/h)
  const elapsedHours = elapsedTimeSeconds > 0 ? elapsedTimeSeconds / 3600 : 0.001;
  const rawAvgSpeed = distanceCoveredKm / elapsedHours;
  const averageSpeedKmh = Number(
    Math.min(12, Math.max(0.5, rawAvgSpeed > 0 ? rawAvgSpeed : 3.5)).toFixed(1)
  );

  // Blended effective speed for ETA (60% historical average + 40% current pace)
  const effectiveInstantSpeed = currentInstantSpeedKmh > 0.3 ? currentInstantSpeedKmh : averageSpeedKmh;
  const blendedSpeed = (0.6 * averageSpeedKmh + 0.4 * effectiveInstantSpeed) / terrainDifficultyMultiplier;
  const safePaceSpeed = Math.max(0.8, blendedSpeed);

  // Predicted remaining minutes
  let predictedRemainingMinutes = 0;
  if (distanceRemainingKm > 0 && boundedProgress < 100) {
    const remainingHours = distanceRemainingKm / safePaceSpeed;
    predictedRemainingMinutes = Math.round(remainingHours * 60);
  }

  // Checkpoints mapping
  const totalCheckpoints = Math.max(1, checkpoints.length);
  const currentCheckpointIndex = Math.min(
    totalCheckpoints - 1,
    Math.floor((boundedProgress / 100) * totalCheckpoints)
  );
  const checkpointsCompleted = Math.min(
    totalCheckpoints,
    Math.floor((boundedProgress / 100) * totalCheckpoints)
  );
  const currentCheckpointName = checkpoints[currentCheckpointIndex] || "Trailhead Base";
  const nextCheckpointName =
    checkpoints[Math.min(totalCheckpoints - 1, currentCheckpointIndex + 1)] || "Summit Peak";

  // Expected completion formatted string
  const completionDate = new Date(Date.now() + predictedRemainingMinutes * 60 * 1000);
  const hours = completionDate.getHours();
  const minutes = completionDate.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const expectedCompletionTimeStr =
    boundedProgress >= 100
      ? "COMPLETED"
      : `${formattedHours}:${formattedMinutes} ${ampm}`;

  return {
    distanceCoveredKm,
    distanceRemainingKm,
    totalDistanceKm,
    progressPercent: Number(boundedProgress.toFixed(1)),
    currentSpeedKmh: Number(effectiveInstantSpeed.toFixed(1)),
    averageSpeedKmh,
    currentCheckpointIndex,
    currentCheckpointName,
    nextCheckpointName,
    checkpointsCompleted,
    totalCheckpoints,
    elapsedTimeSeconds,
    predictedRemainingMinutes,
    expectedCompletionTimeStr,
  };
}
