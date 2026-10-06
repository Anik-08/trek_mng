"use client";

import React, { useEffect, useRef } from "react";

interface TrekMapProps {
  startLat?: number | null;
  startLng?: number | null;
  destLat?: number | null;
  destLng?: number | null;
  startName?: string;
  destName?: string;
}

export default function TrekMap({
  startLat = 13.2215,
  startLng = 75.2536,
  destLat = 13.1292,
  destLng = 75.2758,
  startName = "Trailhead Base",
  destName = "Peak Summit",
}: TrekMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const sLat = startLat || 13.2215;
  const sLng = startLng || 75.2536;
  const dLat = destLat || 13.1292;
  const dLng = destLng || 75.2758;

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    import("leaflet").then((L) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current!).setView([sLat, sLng], 12);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const defaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const startMarker = L.marker([sLat, sLng], { icon: defaultIcon })
        .addTo(map)
        .bindPopup(`<b>Starting Point</b><br/>${startName}`)
        .openPopup();

      const destMarker = L.marker([dLat, dLng], { icon: defaultIcon })
        .addTo(map)
        .bindPopup(`<b>Destination Summit</b><br/>${destName}`);

      const routeLine = L.polyline(
        [
          [sLat, sLng],
          [(sLat + dLat) / 2 + 0.005, (sLng + dLng) / 2 - 0.003],
          [dLat, dLng],
        ],
        { color: "#059669", weight: 4, dashArray: "6, 8" }
      ).addTo(map);

      const group = L.featureGroup([startMarker, destMarker, routeLine]);
      map.fitBounds(group.getBounds().pad(0.2));
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [sLat, sLng, dLat, dLng, startName, destName]);

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 relative shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
