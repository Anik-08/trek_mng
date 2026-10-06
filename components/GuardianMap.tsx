"use client";

import React, { useEffect, useRef } from "react";

export interface ParticipantMapMarker {
  userId: string;
  name: string;
  role?: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  separationStatus?: "NORMAL" | "WARNING" | "CRITICAL" | string;
  distanceFromCentroid?: number;
  isSimulated?: boolean;
  isGuide?: boolean;
}

interface GuardianMapProps {
  startLat: number;
  startLng: number;
  destLat: number;
  destLng: number;
  startName?: string;
  destName?: string;
  centroid?: { latitude: number; longitude: number } | null;
  separationThresholdMeters?: number;
  participants?: ParticipantMapMarker[];
  guideLocation?: { latitude: number; longitude: number; name?: string } | null;
}

export default function GuardianMap({
  startLat,
  startLng,
  destLat,
  destLng,
  startName = "Trailhead Base",
  destName = "Summit Peak",
  centroid,
  separationThresholdMeters = 100,
  participants = [],
  guideLocation,
}: GuardianMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) {
        const initialLat = centroid?.latitude || startLat || 13.22;
        const initialLng = centroid?.longitude || startLng || 75.25;

        const map = L.map(containerRef.current!).setView([initialLat, initialLng], 14);
        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
      }

      const map = mapRef.current;
      layersRef.current.forEach((layer) => layer.remove());
      layersRef.current = [];

      const boundsGroup: any[] = [];

      const trailIcon = L.divIcon({
        className: "custom-trail-icon",
        html: `<div style="background-color: #065f46; color: white; padding: 4px 8px; border-radius: 8px; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap;">🚩 ${startName}</div>`,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      });
      const startMarker = L.marker([startLat, startLng], { icon: trailIcon })
        .addTo(map)
        .bindPopup(`<b>Trailhead:</b> ${startName}`);
      layersRef.current.push(startMarker);
      boundsGroup.push(startMarker);

      const summitIcon = L.divIcon({
        className: "custom-summit-icon",
        html: `<div style="background-color: #1e293b; color: white; padding: 4px 8px; border-radius: 8px; font-weight: bold; font-size: 11px; border: 2px solid #10b981; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap;">⛰️ ${destName}</div>`,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      });
      const destMarker = L.marker([destLat, destLng], { icon: summitIcon })
        .addTo(map)
        .bindPopup(`<b>Destination:</b> ${destName}`);
      layersRef.current.push(destMarker);
      boundsGroup.push(destMarker);

      const routeLine = L.polyline(
        [
          [startLat, startLng],
          [(startLat + destLat) / 2 + 0.003, (startLng + destLng) / 2 - 0.002],
          [destLat, destLng],
        ],
        { color: "#059669", weight: 4, dashArray: "6, 8", opacity: 0.7 }
      ).addTo(map);
      layersRef.current.push(routeLine);

      if (centroid) {
        const centroidCircle = L.circle([centroid.latitude, centroid.longitude], {
          radius: separationThresholdMeters,
          color: "#10b981",
          fillColor: "#10b981",
          fillOpacity: 0.12,
          weight: 2,
          dashArray: "4, 4",
        }).addTo(map);
        layersRef.current.push(centroidCircle);

        const centroidIcon = L.divIcon({
          className: "custom-centroid-icon",
          html: `<div style="background-color: #047857; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px #10b981;"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const centroidMarker = L.marker([centroid.latitude, centroid.longitude], {
          icon: centroidIcon,
        })
          .addTo(map)
          .bindPopup(`<b>Group Center (Centroid)</b><br/>Safety Radius: ${separationThresholdMeters}m`);
        layersRef.current.push(centroidMarker);
        boundsGroup.push(centroidMarker);
      }

      participants.forEach((p) => {
        let pinColor = "#10b981";
        let statusLabel = "Normal";
        let emoji = "🚶";

        if (p.isGuide) {
          pinColor = "#3b82f6";
          emoji = "🧭";
          statusLabel = "Lead Guide";
        } else if (p.separationStatus === "CRITICAL") {
          pinColor = "#ef4444";
          emoji = "🚨";
          statusLabel = "CRITICAL SEPARATION";
        } else if (p.separationStatus === "WARNING") {
          pinColor = "#f59e0b";
          emoji = "⚠️";
          statusLabel = "Possible Separation";
        }

        const participantIcon = L.divIcon({
          className: "custom-participant-icon",
          html: `
            <div style="background-color: ${pinColor}; color: white; padding: 3px 6px; border-radius: 12px; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35); white-space: nowrap; display: flex; align-items: center; gap: 3px;">
              <span>${emoji}</span>
              <span>${p.name.split(" ")[0]}</span>
            </div>
          `,
          iconSize: [70, 24],
          iconAnchor: [35, 12],
        });

        const pMarker = L.marker([p.latitude, p.longitude], { icon: participantIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-size: 12px; font-family: sans-serif; min-width: 140px;">
              <b>${p.name}</b>
              <div style="color: ${pinColor}; font-weight: bold; margin-top: 2px;">● ${statusLabel}</div>
              <div style="color: #64748b; margin-top: 4px;">Distance from Group: <b>${p.distanceFromCentroid || 0}m</b></div>
              ${p.accuracy ? `<div style="color: #94a3b8; font-size: 10px;">GPS Accuracy: ±${Math.round(p.accuracy)}m</div>` : ""}
              ${p.isSimulated ? `<div style="color: #6366f1; font-size: 10px; font-weight: bold; margin-top: 2px;">[SIMULATED TELEMETRY]</div>` : ""}
            </div>
          `);

        layersRef.current.push(pMarker);
        boundsGroup.push(pMarker);
      });

      if (boundsGroup.length > 0) {
        const featureGroup = L.featureGroup(boundsGroup);
        map.fitBounds(featureGroup.getBounds().pad(0.15));
      }
    });
  }, [
    startLat,
    startLng,
    destLat,
    destLng,
    startName,
    destName,
    centroid,
    separationThresholdMeters,
    participants,
    guideLocation,
  ]);

  return (
    <div className="w-full h-[450px] rounded-3xl overflow-hidden border border-slate-200 shadow-md relative bg-slate-100">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
