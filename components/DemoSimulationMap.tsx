"use client";

import React, { useEffect, useRef } from "react";
import { SimulatedTrekker, LatLng, SeparationStatus } from "@/lib/ai/types";

interface DemoSimulationMapProps {
  startLat: number;
  startLng: number;
  destLat: number;
  destLng: number;
  startName?: string;
  destName?: string;
  routePoints: LatLng[];
  checkpoints?: Array<{ name: string; lat: number; lng: number }>;
  centroid?: LatLng | null;
  separationThresholdMeters?: number;
  trekkers?: SimulatedTrekker[];
  activeAnomalyTrekkerId?: string | null;
}

export default function DemoSimulationMap({
  startLat,
  startLng,
  destLat,
  destLng,
  startName = "Trailhead Base",
  destName = "Summit Peak",
  routePoints = [],
  checkpoints = [],
  centroid,
  separationThresholdMeters = 100,
  trekkers = [],
}: DemoSimulationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    import("leaflet").then((L) => {
      // Fix default Leaflet icon paths in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) {
        const initialLat = centroid?.latitude || startLat || 13.22;
        const initialLng = centroid?.longitude || startLng || 75.25;

        const map = L.map(containerRef.current!, {
          zoomControl: true,
          attributionControl: false,
        }).setView([initialLat, initialLng], 14);

        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);
      }

      const map = mapRef.current;

      // Clear previous dynamic layers
      layersRef.current.forEach((layer) => layer.remove());
      layersRef.current = [];

      const boundsGroup: any[] = [];

      // 1. Trailhead Marker
      const trailIcon = L.divIcon({
        className: "custom-trail-icon",
        html: `<div style="background-color: #065f46; color: white; padding: 4px 8px; border-radius: 8px; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap;">🚩 ${startName}</div>`,
        iconSize: [80, 28],
        iconAnchor: [40, 14],
      });
      const startMarker = L.marker([startLat, startLng], { icon: trailIcon })
        .addTo(map)
        .bindPopup(`<b>Trailhead:</b> ${startName}`);
      layersRef.current.push(startMarker);
      boundsGroup.push(startMarker);

      // 2. Summit Marker
      const summitIcon = L.divIcon({
        className: "custom-summit-icon",
        html: `<div style="background-color: #1e293b; color: white; padding: 4px 8px; border-radius: 8px; font-weight: bold; font-size: 11px; border: 2px solid #10b981; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap;">⛰️ ${destName}</div>`,
        iconSize: [80, 28],
        iconAnchor: [40, 14],
      });
      const destMarker = L.marker([destLat, destLng], { icon: summitIcon })
        .addTo(map)
        .bindPopup(`<b>Destination:</b> ${destName}`);
      layersRef.current.push(destMarker);
      boundsGroup.push(destMarker);

      // 3. Expected Route Polyline
      const pathCoordinates: [number, number][] =
        routePoints.length > 0
          ? routePoints.map((p) => [p.latitude, p.longitude])
          : [
              [startLat, startLng],
              [(startLat + destLat) / 2 + 0.003, (startLng + destLng) / 2 - 0.002],
              [destLat, destLng],
            ];

      const routeLine = L.polyline(pathCoordinates, {
        color: "#059669",
        weight: 5,
        opacity: 0.8,
        lineCap: "round",
      }).addTo(map);
      layersRef.current.push(routeLine);

      // Route Corridor buffer line
      const corridorLine = L.polyline(pathCoordinates, {
        color: "#10b981",
        weight: 16,
        opacity: 0.15,
        lineCap: "round",
      }).addTo(map);
      layersRef.current.push(corridorLine);

      // 4. Checkpoints along trail
      checkpoints.forEach((cp, idx) => {
        const cpIcon = L.divIcon({
          className: "custom-cp-icon",
          html: `<div style="background-color: #0f172a; color: #38bdf8; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; border: 2px solid #38bdf8; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">${idx + 1}</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const cpMarker = L.marker([cp.lat, cp.lng], { icon: cpIcon })
          .addTo(map)
          .bindPopup(`<b>Checkpoint ${idx + 1}:</b> ${cp.name}`);
        layersRef.current.push(cpMarker);
      });

      // 5. Group Centroid Circle & Marker
      if (centroid) {
        const centroidCircle = L.circle([centroid.latitude, centroid.longitude], {
          radius: separationThresholdMeters,
          color: "#10b981",
          fillColor: "#10b981",
          fillOpacity: 0.1,
          weight: 2,
          dashArray: "5, 5",
        }).addTo(map);
        layersRef.current.push(centroidCircle);

        const centroidIcon = L.divIcon({
          className: "custom-centroid-icon",
          html: `<div style="background-color: #047857; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px #10b981;"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const centroidMarker = L.marker([centroid.latitude, centroid.longitude], {
          icon: centroidIcon,
        })
          .addTo(map)
          .bindPopup(`<b>AI Group Centroid</b><br/>Safety Radius: ${separationThresholdMeters}m`);
        layersRef.current.push(centroidMarker);
        boundsGroup.push(centroidMarker);
      }

      // 6. Simulated Trekkers Markers
      trekkers.forEach((t) => {
        let pinColor = "#10b981"; // normal green
        let statusLabel = "Normal — On Trail";
        let emoji = "🚶";

        if (t.isGuide) {
          pinColor = "#2563eb"; // blue
          emoji = "🧭";
          statusLabel = "Lead Guide";
        } else if (t.isDeviated) {
          pinColor = "#dc2626"; // red
          emoji = "⚠️";
          statusLabel = "Route Deviation (Off Trail)";
        } else if (t.isStopped) {
          pinColor = "#9333ea"; // purple
          emoji = "🛑";
          statusLabel = "Long Stop / Inactive";
        } else if (t.separationStatus === "CRITICAL") {
          pinColor = "#ef4444"; // red
          emoji = "🚨";
          statusLabel = "Critical Separation";
        } else if (t.separationStatus === "WARNING") {
          pinColor = "#f59e0b"; // amber
          emoji = "⚠️";
          statusLabel = "Separation Warning";
        }

        const isAlertState =
          t.isDeviated ||
          t.isStopped ||
          t.separationStatus === "WARNING" ||
          t.separationStatus === "CRITICAL";

        const participantIcon = L.divIcon({
          className: "custom-trekker-icon",
          html: `
            <div style="
              background-color: ${pinColor};
              color: white;
              padding: 3px 6px;
              border-radius: 12px;
              font-weight: 700;
              font-size: 10px;
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.35);
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 3px;
              ${isAlertState ? "animation: pulse 1.5s infinite;" : ""}
            ">
              <span>${emoji}</span>
              <span>${t.name}</span>
            </div>
          `,
          iconSize: [75, 24],
          iconAnchor: [37, 12],
        });

        const trekkerMarker = L.marker([t.latitude, t.longitude], { icon: participantIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-size: 12px; font-family: sans-serif; min-width: 170px; line-height: 1.4;">
              <div style="font-weight: bold; font-size: 13px; color: #0f172a;">${t.name}</div>
              <div style="color: ${pinColor}; font-weight: bold; margin-top: 3px;">● ${statusLabel}</div>
              <hr style="margin: 6px 0; border: none; border-top: 1px solid #e2e8f0;" />
              <div style="color: #475569; font-size: 11px;">Distance from Group: <b>${t.distanceFromCentroidMeters}m</b></div>
              <div style="color: #475569; font-size: 11px;">Current Speed: <b>${t.speedKmh} km/h</b></div>
              <div style="color: #475569; font-size: 11px;">Progress: <b>${Math.round(t.progressPercent)}%</b></div>
              ${
                t.stoppedDurationSeconds > 0
                  ? `<div style="color: #9333ea; font-size: 11px; font-weight: bold;">Stopped for: ${Math.round(t.stoppedDurationSeconds)}s</div>`
                  : ""
              }
              <div style="background-color: #f1f5f9; color: #4338ca; font-size: 9px; font-weight: bold; padding: 2px 4px; border-radius: 4px; margin-top: 6px; display: inline-block;">
                DEMO / SIMULATED GPS
              </div>
            </div>
          `);

        layersRef.current.push(trekkerMarker);
        boundsGroup.push(trekkerMarker);
      });

      // Fit bounds if initial or positions changed significantly
      if (boundsGroup.length > 0 && !mapRef.current._hasInitialFit) {
        const featureGroup = L.featureGroup(boundsGroup);
        map.fitBounds(featureGroup.getBounds().pad(0.2));
        mapRef.current._hasInitialFit = true;
      }
    });
  }, [
    startLat,
    startLng,
    destLat,
    destLng,
    startName,
    destName,
    routePoints,
    checkpoints,
    centroid,
    separationThresholdMeters,
    trekkers,
  ]);

  return (
    <div className="w-full h-[520px] rounded-3xl overflow-hidden border-2 border-slate-300 shadow-lg relative bg-slate-950">
      {/* Live Simulation Watermark Overlay */}
      <div className="absolute top-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-md flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
        DEMO / SIMULATION MODE
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white px-3 py-2 rounded-xl text-[10px] space-y-1 shadow-md hidden sm:block">
        <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Map Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Normal Group
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Lead Guide
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Warning Separation
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Critical / Deviation
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Long Stop
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
