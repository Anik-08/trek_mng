"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  ShieldCheck,
  ArrowLeft,
  Calendar,
  Users,
  Mountain,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function CreateTrekGroupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [treks, setTreks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTrekId, setSelectedTrekId] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [maxMembers, setMaxMembers] = useState(15);
  const [separationThreshold, setSeparationThreshold] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/treks");
        if (res.ok) {
          const data = await res.json();
          setTreks(data.treks || []);
          if (data.treks && data.treks.length > 0) {
            setSelectedTrekId(data.treks[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user && (user.role === "GUIDE" || user.role === "ADMIN")) {
      loadData();
    }
  }, [user]);

  const selectedTrek = treks.find((t) => t.id === selectedTrekId);
  const schedules = selectedTrek?.schedules || [];

  useEffect(() => {
    if (schedules.length > 0) {
      setSelectedScheduleId(schedules[0].id);
    } else {
      setSelectedScheduleId("");
    }
    if (selectedTrek && !groupName) {
      setGroupName(`${selectedTrek.name} Safety Group`);
    }
  }, [selectedTrekId, selectedTrek]);

  if (authLoading || loading) {
    return <div className="p-10 text-center text-sm">Preparing group creator...</div>;
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

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedTrekId || !selectedScheduleId || !groupName) {
      setError("Please fill all required fields and select an active schedule.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/guardian/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trekId: selectedTrekId,
          scheduleId: selectedScheduleId,
          name: groupName,
          maxMembers: Number(maxMembers),
          separationThresholdMeters: Number(separationThreshold),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create trek group");
        setSubmitting(false);
        return;
      }

      router.push(`/guide/guardian/${data.group.id}`);
    } catch {
      setError("Network error occurred");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link
        href="/guide/guardian"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Guardian Hub
      </Link>

      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
          New Live Expedition Group
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Create Trek Guardian Group
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Assign your scheduled trek to initiate real-time GPS monitoring and group separation alerts.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCreateGroup} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select Trek Trail *
          </label>
          <select
            value={selectedTrekId}
            onChange={(e) => setSelectedTrekId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {treks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.location}, {t.state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select Scheduled Departure *
          </label>
          {schedules.length === 0 ? (
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-200">
              No open schedules found for this trek. Create or open a schedule first.
            </div>
          ) : (
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {schedules.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.startDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  ({s.duration} Day(s)) — {s.capacity - (s.bookedParticipants || 0)} slots available
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Group Name *
          </label>
          <input
            type="text"
            required
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Kudremukh Morning Team Alpha"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Maximum Member Capacity
            </label>
            <input
              type="number"
              min={2}
              max={100}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Default: 15 members</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Separation Alert Threshold (Meters)
            </label>
            <input
              type="number"
              min={30}
              max={1000}
              step={10}
              value={separationThreshold}
              onChange={(e) => setSeparationThreshold(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Flags warning if a participant stays beyond this distance.
            </span>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950">
            <span className="font-bold block">Unique Join Code Will Be Generated</span>
            Upon creation, a code like <span className="font-mono font-bold">TRK-XYZ-4821</span> will be assigned for booked participants to join.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Link
            href="/guide/guardian"
            className="px-4 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !selectedScheduleId}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? "Creating Group..." : "Create Group & Open Live Map"}
          </button>
        </div>
      </form>
    </div>
  );
}
