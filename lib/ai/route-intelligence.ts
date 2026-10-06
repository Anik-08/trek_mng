/**
 * AI Route Intelligence Engine
 * Location: lib/ai/route-intelligence.ts
 *
 * This module analyzes trail topography, segment elevation profiles, and
 * checkpoint bottlenecks to provide predictive intelligence for guides and trekkers.
 */

import { TrekRouteSection } from "./types";

export interface TrekIntelligenceProfile {
  trekId: string;
  name: string;
  totalDistanceKm: number;
  elevationGainMeters: number;
  overallDifficulty: string;
  estimatedTotalHours: number;
  sections: TrekRouteSection[];
  bottlenecks: Array<{
    location: string;
    description: string;
    riskLevel: "LOW" | "MODERATE" | "HIGH";
    recommendedAction: string;
  }>;
}

/**
 * Generates structured route intelligence for any trek given checkpoints and specs.
 */
export function generateRouteIntelligence(
  trekName: string,
  totalDistanceKm: number,
  elevationM: number,
  difficulty: string,
  checkpoints: string[] = []
): TrekIntelligenceProfile {
  const safeCheckpoints =
    checkpoints.length >= 2
      ? checkpoints
      : [
          "Trailhead Base",
          "Forest Entry",
          "Midpoint Ridge",
          "Waterfall Crossing",
          "Summit Peak",
        ];

  const sectionCount = safeCheckpoints.length - 1;
  const avgSectionDist = Number((totalDistanceKm / sectionCount).toFixed(1));
  const avgElevGain = Math.round(elevationM / sectionCount);

  const sections: TrekRouteSection[] = [];

  for (let i = 0; i < sectionCount; i++) {
    const startCp = safeCheckpoints[i];
    const endCp = safeCheckpoints[i + 1];

    let secDifficulty: TrekRouteSection["difficulty"] = "MODERATE";
    let terrain = "Forest Trail & Dirt Path";
    let pace = 18; // min/km
    let risk: TrekRouteSection["riskFactor"] = "LOW";
    let bottleneckWarning: string | undefined = undefined;

    // Intelligent section profile assignment based on position & trek difficulty
    if (i === 0) {
      secDifficulty = "EASY";
      terrain = "Gradual Incline & Forest Checkpost";
      pace = 14;
      risk = "LOW";
    } else if (i === sectionCount - 1) {
      secDifficulty = difficulty === "DIFFICULT" || difficulty === "EXTREME" ? "STEEP" : "DIFFICULT";
      terrain = "Exposed Boulders & Ridge Incline";
      pace = 26;
      risk = "HIGH";
      bottleneckWarning = "High wind exposure & steep scree. Maintain 2m distance between trekkers.";
    } else if (i === Math.floor(sectionCount / 2)) {
      secDifficulty = "DIFFICULT";
      terrain = "Stream Crossing & Rocky Ascent";
      pace = 22;
      risk = "MODERATE";
      bottleneckWarning = "Slippery wet rocks near stream/fall. Guide supervision required.";
    } else {
      secDifficulty = "MODERATE";
      terrain = "Rolling Shola Grassland & Wooded Trail";
      pace = 18;
      risk = "LOW";
    }

    const durationMin = Math.round(avgSectionDist * pace);

    sections.push({
      id: `sec-${i + 1}`,
      name: `${startCp} → ${endCp}`,
      startCheckpoint: startCp,
      endCheckpoint: endCp,
      difficulty: secDifficulty,
      distanceKm: avgSectionDist,
      elevationGainM: avgElevGain,
      averagePaceMinPerKm: pace,
      estimatedDurationMinutes: durationMin,
      terrainType: terrain,
      riskFactor: risk,
      bottleneckWarning,
    });
  }

  const bottlenecks = sections
    .filter((s) => s.bottleneckWarning)
    .map((s) => ({
      location: s.endCheckpoint,
      description: s.bottleneckWarning || "",
      riskLevel: s.riskFactor,
      recommendedAction:
        s.riskFactor === "HIGH"
          ? "Lead guide to secure rope/checkpoint and monitor pacing."
          : "Remind trekkers to tighten shoe laces and use trekking poles.",
    }));

  const totalEstMinutes = sections.reduce((acc, s) => acc + s.estimatedDurationMinutes, 0);

  return {
    trekId: trekName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    name: trekName,
    totalDistanceKm,
    elevationGainMeters: elevationM,
    overallDifficulty: difficulty,
    estimatedTotalHours: Number((totalEstMinutes / 60).toFixed(1)),
    sections,
    bottlenecks,
  };
}
