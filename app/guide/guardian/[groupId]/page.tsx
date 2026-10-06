"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import GuardianMap, { ParticipantMapMarker } from "@/components/GuardianMap";
import {
  ShieldCheck,
  Radio,
  Users,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Phone,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Bell,
  RefreshCw,
} from "lucide-react";

export default function GuideLiveGuardianDashboardPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { user, loading: authLoading } = useAuth();

  const [groupData, setGroupData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"MAP" | "ROSTER" | "EVENTS">("MAP");
  const [copied, setCopied] = useState(false);

  const [simRunning, setSimRunning] = useState(false);
  const [simStep, setSimStep] = useState(1);
  const [simDrift, setSimDrift] = useState(false);
  const [simLoading, setSimLoading] = useState(false);

  const pollTimerRef = useRef<any>(null);

  const fetchGroupState = async () => {
    try {
      const res = await fetch(`/api/guardian/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroupData(data.group);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/guardian/groups/${groupId}/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (groupId && user) {
      fetchGroupState();
      fetchEvents();

      pollTimerRef.current = setInterval(() => {
        fetchGroupState();
        fetchEvents();
      }, 3500);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [groupId, user]);

  const handleCopyCode = () => {
    if (!groupData) return;
    navigator.clipboard.writeText(groupData.groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateStep = async (driftVal = false, customStep?: number) => {
    setSimLoading(true);
    const nextStep = customStep !== undefined ? customStep : simStep + 1;
    try {
      const res = await fetch(`/api/guardian/groups/${groupId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "STEP",
          stepCount: nextStep,
          drift: driftVal,
        }),
      });
      if (res.ok) {
        setSimStep(nextStep);
        setSimDrift(driftVal);
        await fetchGroupState();
        await fetchEvents();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimLoading(false);
    }
  };

  const handleResetSimulation = async () => {
    setSimDrift(false);
    setSimStep(1);
    await handleSimulateStep(false, 1);
  };

  const handleUpdateGroupStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/guardian/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchGroupState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading || loading) {
    return <div className="p-12 text-center text-sm text-slate-500">Connecting to Live Guardian Telemetry...</div>;
  }

  if (!user || (user.role !== "GUIDE" && user.role !== "ADMIN")) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Guide Access Required</h2>
        <Link href="/login" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center text-rose-600 text-sm">
        Trek group could not be found.
      </div>
    );
  }

  const mapParticipants: ParticipantMapMarker[] = groupData.members
    .filter((m: any) => m.telemetry)
    .map((m: any) => ({
      userId: m.userId,
      name: m.user?.name || "Participant",
      role: m.role,
      latitude: m.telemetry.latitude,
      longitude: m.telemetry.longitude,
      accuracy: m.telemetry.accuracy,
      speed: m.telemetry.speed,
      separationStatus: m.telemetry.separationStatus,
      distanceFromCentroid: m.telemetry.distanceFromCentroid,
      isSimulated: m.telemetry.isSimulated,
      isGuide: m.role === "GUIDE",
    }));

  const separatedMembers = groupData.members.filter(
    (m: any) =>
      m.telemetry &&
      (m.telemetry.separationStatus === "WARNING" || m.telemetry.separationStatus === "CRITICAL")
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            href="/guide/guardian"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 font-medium mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Guardian Hub
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold border border-emerald-500/20">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
              Live Monitoring Active
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 uppercase">
              {groupData.status}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            {groupData.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Trail: <b>{groupData.trek.name}</b></span>
            <span>·</span>
            <span>Threshold: <b>{groupData.separationThresholdMeters}m</b></span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Join Code:</span>
            <span className="font-mono font-extrabold text-slate-900 text-sm">{groupData.groupCode}</span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition"
              title="Copy Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => handleUpdateGroupStatus(groupData.status === "ACTIVE" ? "COMPLETED" : "ACTIVE")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition ${
              groupData.status === "ACTIVE"
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {groupData.status === "ACTIVE" ? "Complete Trek" : "Re-activate Trek"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block font-medium">Total Registered</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">
              {groupData.stats.totalMembers} / {groupData.maxMembers}
            </span>
          </div>
          <Users className="w-7 h-7 text-emerald-600" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block font-medium">Sharing Location</span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-0.5 block">
              {groupData.stats.sharingCount} Trekkers
            </span>
          </div>
          <Radio className="w-7 h-7 text-emerald-600" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block font-medium">Inactive / Paused</span>
            <span className="text-2xl font-extrabold text-slate-700 mt-0.5 block">
              {groupData.stats.notSharingCount}
            </span>
          </div>
          <Clock className="w-7 h-7 text-slate-400" />
        </div>

        <div
          className={`p-5 rounded-3xl border shadow-sm flex items-center justify-between transition ${
            groupData.stats.separatedCount > 0
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <div>
            <span className="block font-medium opacity-80">Separation Alerts</span>
            <span
              className={`text-2xl font-extrabold mt-0.5 block ${
                groupData.stats.separatedCount > 0 ? "text-rose-600" : "text-slate-900"
              }`}
            >
              {groupData.stats.separatedCount} {groupData.stats.separatedCount === 1 ? "Alert" : "Alerts"}
            </span>
          </div>
          <AlertTriangle
            className={`w-7 h-7 ${
              groupData.stats.separatedCount > 0 ? "text-rose-600 animate-bounce" : "text-slate-400"
            }`}
          />
        </div>
      </div>

      {separatedMembers.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-rose-900 font-extrabold text-base">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>GROUP SEPARATION DETECTED</span>
          </div>
          <p className="text-xs text-rose-800">
            The geometric safety algorithm detected that the following participant(s) have strayed beyond the {groupData.separationThresholdMeters}m group perimeter:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {separatedMembers.map((m: any) => (
              <div
                key={m.id}
                className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm flex items-start justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{m.user.name}</span>
                  <div className="text-xs text-rose-700 font-bold mt-0.5">
                    ● {m.telemetry.separationStatus}: {m.telemetry.distanceFromCentroid}m from Group Centroid
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Consecutive deviations: <b>{m.telemetry.consecutiveDeviations} readings</b>
                  </div>
                </div>

                {m.user.phone && (
                  <a
                    href={`tel:${m.user.phone}`}
                    className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
              Testing & Demo Telemetry Engine
            </span>
            <h3 className="text-base font-bold mt-0.5">15-Trekker Virtual Simulation Mode</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Simulate 15 participants on the trail with 1 stray trekker to demonstrate real-time geometric separation alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSimulateStep(false)}
              disabled={simLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {simLoading ? "Advancing..." : "Advance Group Step"}
            </button>

            <button
              onClick={() => handleSimulateStep(true)}
              disabled={simLoading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Simulate Trekker Separation
            </button>

            <button
              onClick={handleResetSimulation}
              disabled={simLoading}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("MAP")}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === "MAP" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Live Map & Telemetry
        </button>
        <button
          onClick={() => setActiveTab("ROSTER")}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === "ROSTER" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Participant Roster ({groupData.members.length})
        </button>
        <button
          onClick={() => setActiveTab("EVENTS")}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === "EVENTS" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Safety Event Log ({events.length})
        </button>
      </div>

      {activeTab === "MAP" && (
        <div className="space-y-4">
          <GuardianMap
            startLat={groupData.trek.startLat || 13.2215}
            startLng={groupData.trek.startLng || 75.2536}
            destLat={groupData.trek.destLat || 13.1292}
            destLng={groupData.trek.destLng || 75.2758}
            startName={groupData.trek.meetingPoint}
            destName={groupData.trek.destination}
            centroid={groupData.centroid}
            separationThresholdMeters={groupData.separationThresholdMeters}
            participants={mapParticipants}
          />
        </div>
      )}

      {activeTab === "ROSTER" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                  <th className="py-3.5 px-4">Trekker Name</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Sharing Status</th>
                  <th className="py-3.5 px-4">Distance to Center</th>
                  <th className="py-3.5 px-4">Separation State</th>
                  <th className="py-3.5 px-4">Last Position Ping</th>
                  <th className="py-3.5 px-4 text-right">Emergency Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupData.members.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{m.user?.name}</div>
                      <div className="text-[11px] font-normal text-slate-400">{m.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          m.locationSharingStatus === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        ● {m.locationSharingStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {m.telemetry ? `${m.telemetry.distanceFromCentroid}m` : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.telemetry ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.telemetry.separationStatus === "CRITICAL"
                              ? "bg-rose-100 text-rose-800 font-extrabold"
                              : m.telemetry.separationStatus === "WARNING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {m.telemetry.separationStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No GPS</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {m.lastLocationAt
                        ? new Date(m.lastLocationAt).toLocaleTimeString("en-IN")
                        : "Never"}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {m.user?.emergencyContact || m.user?.phone || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "EVENTS" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Chronological Safety Event Log</h3>
          {events.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-8 text-center">No safety events recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs"
                >
                  <Bell className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ev.eventType}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString("en-IN")}
                      </span>
                    </div>
                    {ev.user && (
                      <p className="text-slate-600">
                        Triggered by: <b>{ev.user.name}</b> ({ev.user.email})
                      </p>
                    )}
                    {ev.metadata && (
                      <p className="text-[11px] text-slate-500 font-mono mt-1 bg-white p-2 rounded-lg border border-slate-100">
                        {ev.metadata}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
