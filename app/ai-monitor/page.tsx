"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ShieldCheck,
  Radio,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
  Zap,
} from "lucide-react";

import {
  SimulatedTrekker,
  LatLng,
  GuardianAssessment,
  ProgressETAResult,
  TrekRouteSection,
} from "@/lib/ai/types";
import {
  assessGroupGuardian,
  predictProgressAndETA,
  generateRouteIntelligence,
} from "@/lib/ai";

// Dynamically import Leaflet map to avoid SSR issues
const DemoSimulationMap = dynamic(() => import("@/components/DemoSimulationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-3xl bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
      Loading Simulation Trail Map...
    </div>
  ),
});

interface TrekOption {
  id: string;
  name: string;
  difficulty: string;
  distance: number;
  elevation: number;
  meetingPoint: string;
  destination: string;
  startLat: number;
  startLng: number;
  destLat: number;
  destLng: number;
  checkpoints: string[];
}

const DEFAULT_TREKS: TrekOption[] = [
  {
    id: "kudremukh",
    name: "Kudremukh Peak Trek",
    difficulty: "MODERATE",
    distance: 22,
    elevation: 1894,
    meetingPoint: "Mullodi Village Forest Checkpost",
    destination: "Kudremukh Peak Summit (1,894m)",
    startLat: 13.2215,
    startLng: 75.2536,
    destLat: 13.1292,
    destLng: 75.2758,
    checkpoints: [
      "Mullodi Base Camp",
      "Forest Checkpost",
      "Ontimara Single Tree",
      "Lobo House Ruin",
      "Kudremukh Peak Summit",
    ],
  },
  {
    id: "skandagiri",
    name: "Skandagiri Sunrise Night Trek",
    difficulty: "EASY",
    distance: 8,
    elevation: 1450,
    meetingPoint: "Papagni Temple Base, Kalavara",
    destination: "Skandagiri Fort Summit (1,450m)",
    startLat: 13.4184,
    startLng: 77.6834,
    destLat: 13.4215,
    destLng: 77.6865,
    checkpoints: [
      "Kalavara Papagni Temple",
      "Forest Entry Gate",
      "Middle Fort Bastion",
      "Skandagiri Summit Viewpoint",
    ],
  },
  {
    id: "kumara",
    name: "Kumara Parvatha Challenge",
    difficulty: "DIFFICULT",
    distance: 28,
    elevation: 1712,
    meetingPoint: "Kukke Subramanya Temple Base",
    destination: "Kumara Parvatha Peak (1,712m)",
    startLat: 12.6781,
    startLng: 75.6178,
    destLat: 12.6644,
    destLng: 75.6883,
    checkpoints: [
      "Kukke Subramanya Trailhead",
      "Bhattara Mane Camp",
      "Forest Checkpoint",
      "Kallu Mandapa",
      "Shesha Parvatha Peak",
      "Kumara Parvatha Summit",
    ],
  },
  {
    id: "tadiandamol",
    name: "Tadiandamol Peak Trek",
    difficulty: "MODERATE",
    distance: 14,
    elevation: 1748,
    meetingPoint: "Nalknad Palace Trailhead",
    destination: "Tadiandamol Summit (1,748m)",
    startLat: 12.2185,
    startLng: 75.6124,
    destLat: 12.2156,
    destLng: 75.6087,
    checkpoints: [
      "Nalknad Palace Base",
      "Big Rock Viewpoint",
      "False Peak Ridge",
      "Tadiandamol Summit",
    ],
  },
];

interface EventLogItem {
  id: string;
  timestamp: string;
  message: string;
  type: "INFO" | "CHECKPOINT" | "WARNING" | "CRITICAL" | "SUCCESS";
}

export default function AIMonitorDemoPage() {
  const [treksList, setTreksList] = useState<TrekOption[]>(DEFAULT_TREKS);
  const [selectedTrekId, setSelectedTrekId] = useState<string>("kudremukh");
  const [participantCount, setParticipantCount] = useState<number>(15);
  const [simSpeed, setSimSpeed] = useState<number>(2); // 2x default speed

  const [simStatus, setSimStatus] = useState<"IDLE" | "RUNNING" | "PAUSED" | "COMPLETED">("IDLE");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Manual Trigger Anomaly States
  const [separationTriggered, setSeparationTriggered] = useState<boolean>(false);
  const [routeDeviationTriggered, setRouteDeviationTriggered] = useState<boolean>(false);
  const [longStopTriggered, setLongStopTriggered] = useState<boolean>(false);

  // Telemetry state
  const [trekkers, setTrekkers] = useState<SimulatedTrekker[]>([]);
  const [eventsLog, setEventsLog] = useState<EventLogItem[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Selected Trek Definition
  const currentTrek = useMemo(() => {
    return treksList.find((t) => t.id === selectedTrekId) || treksList[0];
  }, [treksList, selectedTrekId]);

  // Route Polyline Points (interpolated trail corridor)
  const routePoints: LatLng[] = useMemo(() => {
    const sLat = currentTrek.startLat;
    const sLng = currentTrek.startLng;
    const dLat = currentTrek.destLat;
    const dLng = currentTrek.destLng;

    const points: LatLng[] = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      // create natural meandering curvature along the mountain path
      const curveOffsetLat = Math.sin(frac * Math.PI) * 0.0035;
      const curveOffsetLng = Math.sin(frac * Math.PI * 2) * 0.0025;
      points.push({
        latitude: sLat + (dLat - sLat) * frac + curveOffsetLat,
        longitude: sLng + (dLng - sLng) * frac + curveOffsetLng,
      });
    }
    return points;
  }, [currentTrek]);

  // Checkpoints mapping with coordinates
  const checkpointLocations = useMemo(() => {
    return currentTrek.checkpoints.map((name, idx) => {
      const frac = idx / Math.max(1, currentTrek.checkpoints.length - 1);
      const pointIndex = Math.min(routePoints.length - 1, Math.floor(frac * (routePoints.length - 1)));
      const pt = routePoints[pointIndex] || routePoints[0];
      return { name, lat: pt.latitude, lng: pt.longitude };
    });
  }, [currentTrek, routePoints]);

  // Route Intelligence Data
  const routeIntelligence = useMemo(() => {
    return generateRouteIntelligence(
      currentTrek.name,
      currentTrek.distance,
      currentTrek.elevation,
      currentTrek.difficulty,
      currentTrek.checkpoints
    );
  }, [currentTrek]);

  // Fetch real treks from API if available to enrich options
  useEffect(() => {
    async function loadTreks() {
      try {
        const res = await fetch("/api/treks");
        if (res.ok) {
          const data = await res.json();
          if (data.treks && data.treks.length > 0) {
            const formatted: TrekOption[] = data.treks.map((t: any) => {
              let parsedCheckpoints: string[] = [];
              try {
                parsedCheckpoints = JSON.parse(t.checkpoints);
              } catch {
                parsedCheckpoints = [
                  "Mullodi Base Camp",
                  "Forest Checkpost",
                  "Ontimara Single Tree",
                  "Kudremukh Peak Summit",
                ];
              }
              return {
                id: t.id,
                name: t.name,
                difficulty: t.difficulty,
                distance: t.distance,
                elevation: t.elevation || 1800,
                meetingPoint: t.meetingPoint || "Trailhead Base",
                destination: t.destination || "Summit Peak",
                startLat: t.startLat || 13.2215,
                startLng: t.startLng || 75.2536,
                destLat: t.destLat || 13.1292,
                destLng: t.destLng || 75.2758,
                checkpoints: parsedCheckpoints,
              };
            });
            setTreksList(formatted);
          }
        }
      } catch (e) {
        console.error("Using default seeded treks for demo simulation", e);
      }
    }
    loadTreks();
  }, []);

  // Format formatted timestamp (e.g. 09:41:12)
  const formatTime = (date: Date = new Date()) => {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const addEvent = (
    message: string,
    type: EventLogItem["type"] = "INFO"
  ) => {
    setEventsLog((prev) => [
      {
        id: Math.random().toString(36).substring(7),
        timestamp: formatTime(),
        message,
        type,
      },
      ...prev.slice(0, 39), // keep last 40 entries
    ]);
  };

  // Initialize or Reset Trekkers Fleet
  const initializeTrekkers = (count: number) => {
    const initial: SimulatedTrekker[] = [];
    const basePt = routePoints[0] || { latitude: currentTrek.startLat, longitude: currentTrek.startLng };

    // Trekker 01 is always lead guide
    initial.push({
      id: "guide-01",
      name: "Ramesh Sharma (Lead Guide)",
      isGuide: true,
      latitude: basePt.latitude,
      longitude: basePt.longitude,
      speedKmh: 4.2,
      accuracyMeters: 5,
      heading: 45,
      progressPercent: 0,
      separationStatus: "NORMAL",
      distanceFromCentroidMeters: 0,
      distanceFromRouteMeters: 0,
      stoppedDurationSeconds: 0,
      isDeviated: false,
      isSeparated: false,
      isStopped: false,
      consecutiveAnomalies: 0,
    });

    for (let i = 2; i <= count; i++) {
      const padNum = String(i).padStart(2, "0");
      // slight natural spread at trailhead
      const jitterLat = (Math.random() - 0.5) * 0.0003;
      const jitterLng = (Math.random() - 0.5) * 0.0003;

      initial.push({
        id: `trekker-${padNum}`,
        name: `Trekker ${padNum}`,
        isGuide: false,
        latitude: basePt.latitude + jitterLat,
        longitude: basePt.longitude + jitterLng,
        speedKmh: 3.8 + Math.random() * 0.6,
        accuracyMeters: 8,
        heading: 45,
        progressPercent: 0,
        separationStatus: "NORMAL",
        distanceFromCentroidMeters: 0,
        distanceFromRouteMeters: 0,
        stoppedDurationSeconds: 0,
        isDeviated: false,
        isSeparated: false,
        isStopped: false,
        consecutiveAnomalies: 0,
      });
    }

    setTrekkers(initial);
  };

  // Run initial setup
  useEffect(() => {
    initializeTrekkers(participantCount);
  }, [currentTrek, participantCount]);

  // ── SIMULATION ENGINE STEPPER ───────────────────────────────────────────────
  const stepSimulation = () => {
    setElapsedSeconds((prev) => {
      const nextSec = prev + 1 * simSpeed;

      // Calculate progress base (0 to 100% over ~180 virtual simulation steps)
      const baseProgress = Math.min(100, (nextSec / 180) * 100);

      // Check for automatic checkpoint alerts
      const totalCps = currentTrek.checkpoints.length;
      const currentCpIdx = Math.floor((baseProgress / 100) * totalCps);
      const prevCpIdx = Math.floor(((baseProgress - (1 / 180) * 100) / 100) * totalCps);

      if (currentCpIdx > prevCpIdx && currentCpIdx < totalCps) {
        addEvent(
          `Reached Checkpoint ${currentCpIdx + 1}: ${currentTrek.checkpoints[currentCpIdx]}`,
          "CHECKPOINT"
        );
      }

      if (baseProgress >= 100) {
        setSimStatus("COMPLETED");
        addEvent("Trek group reached Summit Destination safely! All objectives complete.", "SUCCESS");
      }

      setTrekkers((prevTrekkers) => {
        return prevTrekkers.map((t, idx) => {
          let trekkerProgress = baseProgress;

          // Natural pacing jitter
          if (!t.isGuide) {
            trekkerProgress = Math.max(0, Math.min(100, baseProgress - (idx * 0.4)));
          }

          // Handle Long Stop Anomaly (Trekker 04)
          let stoppedSec = t.stoppedDurationSeconds;
          let isStopped = false;
          if (longStopTriggered && t.name.includes("04")) {
            stoppedSec += 1 * simSpeed;
            isStopped = true;
            // Trekker 04 stays in place
            trekkerProgress = Math.max(0, baseProgress - (stoppedSec * 0.3));
          } else {
            stoppedSec = 0;
          }

          // Map progress percent to route coordinate index
          const routeIndex = Math.min(
            routePoints.length - 1,
            Math.floor((trekkerProgress / 100) * (routePoints.length - 1))
          );
          const baseCoord = routePoints[routeIndex] || routePoints[0];

          let lat = baseCoord.latitude;
          let lng = baseCoord.longitude;

          // Natural tight cluster spread around path (within 15m)
          const clusterJitterLat = ((idx % 3) - 1) * 0.00015;
          const clusterJitterLng = (((idx + 1) % 3) - 1) * 0.00015;
          lat += clusterJitterLat;
          lng += clusterJitterLng;

          // Handle Separation Anomaly (Trekker 12 drifts >120m away from group)
          let isSeparated = false;
          if (separationTriggered && t.name.includes("12")) {
            isSeparated = true;
            // Drift 140m perpendicular to trail
            lat += 0.0014;
            lng -= 0.0012;
          }

          // Handle Route Deviation Anomaly (Trekker 07 or 12 strays off-corridor)
          let isDeviated = false;
          if (routeDeviationTriggered && (t.name.includes("07") || t.name.includes("12"))) {
            isDeviated = true;
            // Stray far into side canyon
            lat -= 0.0018;
            lng += 0.0022;
          }

          const speed = isStopped ? 0.0 : t.isGuide ? 4.5 : 3.6 + ((idx % 4) * 0.2);

          return {
            ...t,
            latitude: lat,
            longitude: lng,
            progressPercent: trekkerProgress,
            speedKmh: speed,
            stoppedDurationSeconds: stoppedSec,
            isSeparated,
            isDeviated,
            isStopped,
          };
        });
      });

      return nextSec;
    });
  };

  // Timer loop for simulation
  useEffect(() => {
    if (simStatus === "RUNNING") {
      timerRef.current = setInterval(() => {
        stepSimulation();
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simStatus, simSpeed, separationTriggered, routeDeviationTriggered, longStopTriggered, routePoints]);

  // Run Guardian AI & ETA Assessment on every telemetry tick
  const guardianAssessment: GuardianAssessment = useMemo(() => {
    return assessGroupGuardian(trekkers, routePoints);
  }, [trekkers, routePoints]);

  const etaPrediction: ProgressETAResult = useMemo(() => {
    const avgProgress =
      trekkers.length > 0
        ? trekkers.reduce((sum, t) => sum + t.progressPercent, 0) / trekkers.length
        : 0;

    const leadSpeed = trekkers.find((t) => t.isGuide)?.speedKmh || 4.0;

    return predictProgressAndETA({
      totalDistanceKm: currentTrek.distance,
      progressPercent: avgProgress,
      elapsedTimeSeconds: elapsedSeconds,
      currentInstantSpeedKmh: leadSpeed,
      checkpoints: currentTrek.checkpoints,
      terrainDifficultyMultiplier: currentTrek.difficulty === "DIFFICULT" ? 1.3 : 1.0,
    });
  }, [trekkers, currentTrek, elapsedSeconds]);

  // ── SIMULATION CONTROL HANDLERS ───────────────────────────────────────────
  const handleStart = () => {
    setSimStatus("RUNNING");
    addEvent(`Trek simulation started for "${currentTrek.name}"`, "INFO");
    addEvent(`GPS Telemetry tracking active for ${participantCount} simulated participants`, "SUCCESS");
  };

  const handlePause = () => {
    setSimStatus("PAUSED");
    addEvent("Simulation paused", "INFO");
  };

  const handleResume = () => {
    setSimStatus("RUNNING");
    addEvent("Simulation resumed", "INFO");
  };

  const handleReset = () => {
    setSimStatus("IDLE");
    setElapsedSeconds(0);
    setSeparationTriggered(false);
    setRouteDeviationTriggered(false);
    setLongStopTriggered(false);
    setEventsLog([]);
    initializeTrekkers(participantCount);
    addEvent("Simulation reset cleanly. Ready for demonstration.", "INFO");
  };

  // Manual Trigger: Group Separation
  const handleTriggerSeparation = () => {
    setSeparationTriggered(true);
    addEvent("Simulating participant lag: Trekker 12 falling behind group pace", "WARNING");
    setTimeout(() => {
      addEvent("AI Guardian: Possible Group Separation — Trekker 12 is ~125m from group centroid (Sustained >5s)", "CRITICAL");
    }, 1200);
  };

  // Manual Trigger: Route Deviation
  const handleTriggerRouteDeviation = () => {
    setRouteDeviationTriggered(true);
    addEvent("Simulating off-trail movement: Trekker 07 took wrong fork at ridge", "WARNING");
    setTimeout(() => {
      addEvent("AI Guardian: Route Deviation Detected — Trekker 07 has moved outside the expected trail corridor", "CRITICAL");
    }, 1200);
  };

  // Manual Trigger: Long Stop
  const handleTriggerLongStop = () => {
    setLongStopTriggered(true);
    addEvent("Simulating unscheduled stationary halt: Trekker 04 stopped moving", "WARNING");
    setTimeout(() => {
      addEvent("AI Guardian: Prolonged Stop Alert — Trekker 04 inactive for 30+ seconds while group progresses", "WARNING");
    }, 1200);
  };

  // Manual Trigger: Return All to Route
  const handleReturnAll = () => {
    setSeparationTriggered(false);
    setRouteDeviationTriggered(false);
    setLongStopTriggered(false);
    addEvent("Group regrouped: All participants returned to expected trail formation", "SUCCESS");
    addEvent("AI Guardian: Group status restored to NORMAL (All 15 on track)", "SUCCESS");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── DEMO MODE BANNER ── */}
      <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-blue-500/10 border-2 border-amber-500/40 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] tracking-wider uppercase">
                  DEMO / SIMULATION MODE
                </span>
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                  Single-Laptop Presentation Engine
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                AI Trek Intelligence &amp; Guardian Monitor
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/recommendations"
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Smart Recommendations
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2">
          Demonstrating AI Trek Guardian anomaly detection, real-time ETA prediction, and route intelligence using simulated multi-trekker GPS telemetry. No physical devices required.
        </p>
      </div>

      {/* ── 4 PILLARS QUICK STATUS METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: AI Trek Guardian */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Feature 1</div>
                <div className="text-xs font-bold text-slate-900">AI Trek Guardian</div>
              </div>
            </div>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                guardianAssessment.groupStatus === "CRITICAL"
                  ? "bg-rose-100 text-rose-700 animate-pulse"
                  : guardianAssessment.groupStatus === "WARNING"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {guardianAssessment.groupStatus}
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Participants:</span>
              <span className="font-bold text-slate-800">{trekkers.length}/{participantCount} Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Route Status:</span>
              <span className={`font-bold ${guardianAssessment.routeStatus === "ON TRACK" ? "text-emerald-600" : "text-rose-600"}`}>
                {guardianAssessment.routeStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GPS Feed:</span>
              <span className="font-bold text-blue-600">ACTIVE (Simulated)</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: AI Progress & ETA */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Feature 2</div>
                <div className="text-xs font-bold text-slate-900">Progress &amp; ETA</div>
              </div>
            </div>
            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              {etaPrediction.progressPercent}%
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Covered / Total:</span>
              <span className="font-bold text-slate-800">
                {etaPrediction.distanceCoveredKm} / {etaPrediction.totalDistanceKm} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Speed:</span>
              <span className="font-bold text-slate-800">{etaPrediction.currentSpeedKmh} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Predicted ETA:</span>
              <span className="font-bold text-emerald-700">{etaPrediction.expectedCompletionTimeStr}</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: AI Route Intelligence */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Feature 3</div>
                <div className="text-xs font-bold text-slate-900">Route Intelligence</div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
              {currentTrek.difficulty}
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Active Checkpoint:</span>
              <span className="font-bold text-slate-800 truncate max-w-[120px]" title={etaPrediction.currentCheckpointName}>
                {etaPrediction.currentCheckpointName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Next Waypoint:</span>
              <span className="font-bold text-slate-800 truncate max-w-[120px]" title={etaPrediction.nextCheckpointName}>
                {etaPrediction.nextCheckpointName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Elevation:</span>
              <span className="font-bold text-slate-800">{currentTrek.elevation}m Peak</span>
            </div>
          </div>
        </div>

        {/* Pillar 4: AI Recommendations */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Feature 4</div>
                <div className="text-xs font-bold text-slate-900">Smart Suggestions</div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              DYNAMIC
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Matching Mode:</span>
              <span className="font-bold text-slate-800">Multi-factor Scoring</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Live Catalog:</span>
              <span className="font-bold text-emerald-600">Active DB Dataset</span>
            </div>
            <Link
              href="/recommendations"
              className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 text-[11px] pt-0.5"
            >
              Open Recommendation Engine <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── SIMULATION CONTROLS PANEL ── */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Presentation Control Console
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Demo Simulation Master Controls
            </h2>
          </div>

          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {simStatus === "IDLE" && (
              <button
                onClick={handleStart}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm rounded-2xl transition shadow-lg flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Demo Simulation
              </button>
            )}

            {simStatus === "RUNNING" && (
              <button
                onClick={handlePause}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-2xl transition shadow-lg flex items-center gap-2"
              >
                <Pause className="w-4 h-4 fill-current" />
                Pause
              </button>
            )}

            {simStatus === "PAUSED" && (
              <button
                onClick={handleResume}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm rounded-2xl transition shadow-lg flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Resume
              </button>
            )}

            {simStatus === "COMPLETED" && (
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30">
                Simulation Finished
              </span>
            )}

            <button
              onClick={handleReset}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-2xl transition flex items-center gap-1.5 border border-slate-700"
              title="Cleanly reset simulation to start over"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Configuration Row: Trek selection, participants, simulation speed */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Trek Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Select Trail</label>
            <select
              value={selectedTrekId}
              onChange={(e) => {
                setSelectedTrekId(e.target.value);
                handleReset();
              }}
              disabled={simStatus === "RUNNING"}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
            >
              {treksList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.distance}km — {t.difficulty})
                </option>
              ))}
            </select>
          </div>

          {/* Participant Count */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase">
              <span>Participants</span>
              <span className="text-emerald-400 font-bold">{participantCount} Trekkers</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={participantCount}
              onChange={(e) => {
                const count = Number(e.target.value);
                setParticipantCount(count);
                if (simStatus === "IDLE") initializeTrekkers(count);
              }}
              disabled={simStatus === "RUNNING"}
              className="w-full accent-emerald-500 cursor-pointer disabled:opacity-60"
            />
          </div>

          {/* Simulation Speed */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Simulation Speed</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 5, 10].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    simSpeed === spd
                      ? "bg-emerald-500 text-slate-950 font-black shadow-md"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Presentation Manual Triggers */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Presentation Instant Triggers (Test AI Alerts Immediately)
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Click any trigger button below during presentation to demonstrate instant anomaly detection
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={handleTriggerSeparation}
              disabled={simStatus !== "RUNNING"}
              className={`p-3 rounded-2xl border text-left transition disabled:opacity-40 ${
                separationTriggered
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200"
              }`}
            >
              <div className="font-bold text-xs">⚠️ Trigger Separation</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Trekker 12 drifts 120m+</div>
            </button>

            <button
              onClick={handleTriggerRouteDeviation}
              disabled={simStatus !== "RUNNING"}
              className={`p-3 rounded-2xl border text-left transition disabled:opacity-40 ${
                routeDeviationTriggered
                  ? "bg-rose-500/20 border-rose-500 text-rose-300"
                  : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200"
              }`}
            >
              <div className="font-bold text-xs">🚨 Trigger Route Deviation</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Trekker 07 moves off trail</div>
            </button>

            <button
              onClick={handleTriggerLongStop}
              disabled={simStatus !== "RUNNING"}
              className={`p-3 rounded-2xl border text-left transition disabled:opacity-40 ${
                longStopTriggered
                  ? "bg-purple-500/20 border-purple-500 text-purple-300"
                  : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200"
              }`}
            >
              <div className="font-bold text-xs">🛑 Trigger Long Stop</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Trekker 04 stationary &gt;30s</div>
            </button>

            <button
              onClick={handleReturnAll}
              disabled={simStatus !== "RUNNING"}
              className="p-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500 text-emerald-300 rounded-2xl text-left transition disabled:opacity-40"
            >
              <div className="font-bold text-xs">✅ Return All to Route</div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">Clear anomalies &amp; regroup</div>
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN TELEMETRY & MAP VIEW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Map + Active Anomalies (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <DemoSimulationMap
            startLat={currentTrek.startLat}
            startLng={currentTrek.startLng}
            destLat={currentTrek.destLat}
            destLng={currentTrek.destLng}
            startName={currentTrek.meetingPoint}
            destName={currentTrek.destination}
            routePoints={routePoints}
            checkpoints={checkpointLocations}
            centroid={guardianAssessment.centroid}
            separationThresholdMeters={100}
            trekkers={trekkers}
          />

          {/* Active AI Alert Notification Box */}
          {guardianAssessment.anomalies.length > 0 ? (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 space-y-3 animate-fade-in shadow-sm">
              <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
                <span>AI Trek Guardian Active Anomaly Alerts ({guardianAssessment.anomalies.length})</span>
              </div>
              <div className="space-y-2">
                {guardianAssessment.anomalies.map((an, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3 rounded-2xl border border-rose-200 text-xs text-slate-800 flex items-start justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <span className="font-bold text-rose-700 uppercase text-[10px] bg-rose-50 px-2 py-0.5 rounded-md mr-2">
                        {an.type.replace("_", " ")}
                      </span>
                      <span className="font-semibold text-slate-900">{an.message}</span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full shrink-0">
                      {an.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All {trekkers.length} participants within safety radius (Normal formation)</span>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-200/60 text-emerald-900 px-2.5 py-0.5 rounded-full">
                RADIUS &lt; 100M
              </span>
            </div>
          )}
        </div>

        {/* Right: Live Activity Log / Event Timeline */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Live Event Timeline
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {eventsLog.length} Records
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
            {eventsLog.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <Radio className="w-8 h-8 text-slate-300 mb-2" />
                <p className="font-semibold text-xs text-slate-600">No events yet</p>
                <p className="text-[11px] text-slate-400">Click &ldquo;Start Demo Simulation&rdquo; above to begin streaming telemetry.</p>
              </div>
            ) : (
              eventsLog.map((ev) => {
                let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                if (ev.type === "CHECKPOINT") badgeClass = "bg-blue-50 text-blue-800 border-blue-200";
                if (ev.type === "WARNING") badgeClass = "bg-amber-50 text-amber-800 border-amber-200";
                if (ev.type === "CRITICAL") badgeClass = "bg-rose-50 text-rose-800 border-rose-200";
                if (ev.type === "SUCCESS") badgeClass = "bg-emerald-50 text-emerald-800 border-emerald-200";

                return (
                  <div
                    key={ev.id}
                    className={`p-2.5 rounded-xl border text-[11px] leading-relaxed transition ${badgeClass}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                      <span>{ev.timestamp}</span>
                      <span className="font-bold uppercase tracking-wider">{ev.type}</span>
                    </div>
                    <div className="font-medium text-slate-900">{ev.message}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── DETAILED PROGRESS, ETA, AND ROUTE INTELLIGENCE BREAKDOWN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress & ETA Dashboard Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  AI Trek Progress &amp; ETA Prediction
                </h3>
                <p className="text-xs text-slate-500">
                  Kinematic pacing and terrain-gradient regression engine
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
              {etaPrediction.progressPercent}% Completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${etaPrediction.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>{currentTrek.meetingPoint} (0 km)</span>
              <span>{currentTrek.destination} ({currentTrek.distance} km)</span>
            </div>
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Distance Covered</span>
              <div className="text-sm font-extrabold text-slate-900">{etaPrediction.distanceCoveredKm} km</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Distance Left</span>
              <div className="text-sm font-extrabold text-slate-900">{etaPrediction.distanceRemainingKm} km</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Current Pace</span>
              <div className="text-sm font-extrabold text-slate-900">{etaPrediction.currentSpeedKmh} km/h</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Predicted ETA</span>
              <div className="text-sm font-extrabold text-emerald-700">{etaPrediction.expectedCompletionTimeStr}</div>
            </div>
          </div>
        </div>

        {/* Route Intelligence & Bottlenecks Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  AI Route Intelligence &amp; Topography
                </h3>
                <p className="text-xs text-slate-500">
                  Section difficulty ratings, bottleneck zones &amp; expected time
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
              {routeIntelligence.sections.length} Trail Sections
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
            {routeIntelligence.sections.map((sec, idx) => {
              let diffBadge = "bg-emerald-50 text-emerald-700";
              if (sec.difficulty === "MODERATE") diffBadge = "bg-amber-50 text-amber-700";
              if (sec.difficulty === "DIFFICULT" || sec.difficulty === "STEEP") diffBadge = "bg-rose-50 text-rose-700";

              return (
                <div
                  key={sec.id}
                  className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">
                      Section {idx + 1}: {sec.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${diffBadge}`}>
                      {sec.difficulty}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {sec.terrainType} • ~{sec.estimatedDurationMinutes} mins ({sec.averagePaceMinPerKm} min/km pace)
                  </div>
                  {sec.bottleneckWarning && (
                    <div className="text-[11px] font-semibold text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200">
                      ⚠️ Bottleneck Alert: {sec.bottleneckWarning}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
