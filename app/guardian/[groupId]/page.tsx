"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  ShieldCheck,
  Radio,
  Users,
  Compass,
  MapPin,
  AlertTriangle,
  Play,
  Pause,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Shield,
  Activity,
  AlertCircle,
} from "lucide-react";

export default function ParticipantLiveTrekPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { user, loading: authLoading } = useAuth();

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sharingStatus, setSharingStatus] = useState<"ACTIVE" | "PAUSED" | "DENIED" | "INACTIVE">("INACTIVE");
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [lastUpdatedSec, setLastUpdatedSec] = useState<number | null>(null);
  const [myTelemetry, setMyTelemetry] = useState<any>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastPingTimeRef = useRef<number | null>(null);

  const fetchGroupData = async () => {
    try {
      const res = await fetch(`/api/guardian/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data.group);
        const me = data.group.members.find((m: any) => m.userId === user?.id);
        if (me && me.telemetry) {
          setMyTelemetry(me.telemetry);
        }
      } else {
        setError("Failed to load trek group details");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId && user) {
      fetchGroupData();
      const interval = setInterval(fetchGroupData, 4000);
      return () => clearInterval(interval);
    }
  }, [groupId, user]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (lastPingTimeRef.current) {
        const diff = Math.floor((Date.now() - lastPingTimeRef.current) / 1000);
        setLastUpdatedSec(diff);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sendLocationUpdate = async (pos: GeolocationPosition) => {
    try {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;
      setLastCoords({ lat: latitude, lng: longitude, accuracy });
      lastPingTimeRef.current = Date.now();
      setLastUpdatedSec(0);

      const res = await fetch(`/api/guardian/groups/${groupId}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMyTelemetry(data.telemetry);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateServerStatus = async (status: string) => {
    try {
      await fetch(`/api/guardian/groups/${groupId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartSharing = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setSharingStatus("ACTIVE");
    updateServerStatus("ACTIVE");

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setSharingStatus("ACTIVE");
        sendLocationUpdate(pos);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setSharingStatus("DENIED");
          updateServerStatus("DENIED");
        } else {
          setSharingStatus("PAUSED");
          updateServerStatus("PAUSED");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    watchIdRef.current = id;
  };

  const handleStopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharingStatus("INACTIVE");
    updateServerStatus("INACTIVE");
  };

  const handlePauseSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharingStatus("PAUSED");
    updateServerStatus("PAUSED");
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (authLoading || loading) {
    return <div className="p-12 text-center text-sm text-slate-500">Connecting to Trek Guardian...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Sign in to Join Live Trek</h2>
        <Link href="/login" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
          Login
        </Link>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center text-rose-600 text-sm">
        {error || "Trek group not found."}
      </div>
    );
  }

  const isSeparated =
    myTelemetry &&
    (myTelemetry.separationStatus === "WARNING" || myTelemetry.separationStatus === "CRITICAL");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        href="/my-bookings"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Bookings
      </Link>

      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            LIVE TREK GUARDIAN
          </div>
          <span className="font-mono text-xs text-slate-300 bg-white/10 px-2.5 py-1 rounded-lg">
            {group.groupCode}
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {group.trek.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1">Group: <b>{group.name}</b></p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/10">
          <div>
            <span className="text-slate-400 block text-[11px]">Lead Mountain Guide</span>
            <span className="font-bold text-white mt-0.5 block">{group.guide?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Group Size</span>
            <span className="font-bold text-emerald-400 mt-0.5 block">
              {group.stats.totalMembers} Trekkers
            </span>
          </div>
        </div>
      </div>

      {sharingStatus === "INACTIVE" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900">Live Location Required</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your live GPS position will be shared securely with your guide during this trek to detect group separation and ensure safety on the trail.
            </p>
          </div>

          <button
            onClick={handleStartSharing}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition shadow-md flex items-center justify-center gap-2 mx-auto"
          >
            <Play className="w-4 h-4" />
            Start Location Sharing
          </button>

          <p className="text-[11px] text-slate-400">
            You can stop or pause sharing at any time. Location is only active during the expedition.
          </p>
        </div>
      )}

      {sharingStatus === "DENIED" && (
        <div className="bg-rose-50 rounded-3xl border border-rose-200 p-6 shadow-sm space-y-3 text-center text-rose-900">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold">Location Permission Denied</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            Location sharing is required for live group monitoring and separation alerts. Please allow location permissions in your browser settings to continue.
          </p>
          <button
            onClick={handleStartSharing}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Try Again
          </button>
        </div>
      )}

      {(sharingStatus === "ACTIVE" || sharingStatus === "PAUSED") && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  sharingStatus === "ACTIVE" ? "bg-emerald-500 animate-ping" : "bg-amber-500"
                }`}
              />
              <span className="text-xs font-bold text-slate-900">
                Location Sharing: {sharingStatus === "ACTIVE" ? "Active" : "Paused"}
              </span>
            </div>

            <span className="text-[11px] text-slate-400">
              {lastUpdatedSec !== null ? `Updated ${lastUpdatedSec}s ago` : "Waiting for GPS..."}
            </span>
          </div>

          {isSeparated && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Group Separation Advisory</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                You appear to be {myTelemetry.distanceFromCentroid}m away from the group center. Please slow down or regroup with lead guide {group.guide?.name}.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Trek Safety Status</span>
              <span
                className={`font-bold mt-0.5 block ${
                  isSeparated ? "text-amber-600" : "text-emerald-700"
                }`}
              >
                ● {isSeparated ? "Advisory (Separated)" : "Normal (In Group)"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">GPS Accuracy</span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {lastCoords?.accuracy ? `±${Math.round(lastCoords.accuracy)} meters` : "Calibrating"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {sharingStatus === "ACTIVE" ? (
              <button
                onClick={handlePauseSharing}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause Sharing
              </button>
            ) : (
              <button
                onClick={handleStartSharing}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Resume Sharing
              </button>
            )}

            <button
              onClick={handleStopSharing}
              className="w-1/2 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition"
            >
              Stop Sharing
            </button>
          </div>
        </div>
      )}

      {group.trek.parsedCheckpoints && group.trek.parsedCheckpoints.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Trek Checkpoints & Route</h3>
          <div className="space-y-2">
            {group.trek.parsedCheckpoints.map((cp: string, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {idx + 1}
                </div>
                <span>{cp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
