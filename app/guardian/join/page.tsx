"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  ShieldCheck,
  Radio,
  ArrowLeft,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Mountain,
  Search,
  UserCheck,
  Plus,
} from "lucide-react";

interface GroupPreview {
  groupId: string;
  groupCode: string;
  groupName: string;
  status: string;
  currentMembers: number;
  maxMembers: number;
  trek: { name: string; location: string; difficulty: string };
  schedule: { startDate: string; endDate: string; duration: number } | null;
  guideName: string | null;
  leaderName: string | null;
}

export default function JoinTrekGroupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [groupCode, setGroupCode] = useState("");
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [joinError, setJoinError] = useState("");

  const [userBookings, setUserBookings] = useState<any[]>([]);

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await fetch("/api/bookings/my");
        if (res.ok) {
          const data = await res.json();
          setUserBookings(
            (data.bookings || []).filter((b: any) => b.bookingStatus === "CONFIRMED")
          );
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (user) loadBookings();
  }, [user]);

  if (authLoading) {
    return <div className="p-10 text-center text-sm">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Login Required</h2>
        <Link href="/login" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  // ── Step 1: Look up the group preview ─────────────────────────────────────
  const handleLookup = async () => {
    const code = groupCode.trim().toUpperCase();
    if (!code) {
      setLookupError("Please enter a group join code");
      return;
    }

    setLookingUp(true);
    setLookupError("");
    setPreview(null);
    setJoinError("");

    try {
      const res = await fetch(`/api/guardian/groups/lookup?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || "Group not found");
      } else {
        setPreview(data);
      }
    } catch {
      setLookupError("Network error. Please try again.");
    } finally {
      setLookingUp(false);
    }
  };

  // ── Step 2: Confirm and join ───────────────────────────────────────────────
  const handleJoin = async () => {
    if (!preview) return;

    setSubmitting(true);
    setJoinError("");

    try {
      const res = await fetch("/api/guardian/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupCode: preview.groupCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || "Failed to join group");
        setSubmitting(false);
        return;
      }

      router.push(`/guardian/${data.groupId}`);
    } catch {
      setJoinError("Network error occurred");
      setSubmitting(false);
    }
  };

  const difficultyColor: Record<string, string> = {
    EASY: "text-emerald-600 bg-emerald-50",
    MODERATE: "text-amber-600 bg-amber-50",
    HARD: "text-rose-600 bg-rose-50",
    EXTREME: "text-purple-600 bg-purple-50",
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link
        href="/my-bookings"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Bookings
      </Link>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
          <Radio className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Trek Guardian Safety Group
        </h1>
        <p className="text-xs text-slate-500">
          Enter the join code shared by your trek leader to preview and join their group.
        </p>
      </div>

      {/* ── Step 1: Code Entry ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Step 1 — Enter Join Code
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={groupCode}
            onChange={(e) => {
              setGroupCode(e.target.value.toUpperCase());
              setPreview(null);
              setLookupError("");
              setJoinError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="e.g. TRK-KDM-4821"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 font-mono text-center text-sm font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleLookup}
            disabled={lookingUp || !groupCode.trim()}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition"
          >
            <Search className="w-3.5 h-3.5" />
            {lookingUp ? "..." : "Look Up"}
          </button>
        </div>

        {lookupError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}
      </div>

      {/* ── Step 2: Preview Card ── */}
      {preview && (
        <div className="bg-white rounded-3xl border-2 border-emerald-200 p-6 shadow-md space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Step 2 — Confirm &amp; Join
            </p>
            {preview.status === "ACTIVE" ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                LIVE
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                {preview.status}
              </span>
            )}
          </div>

          {/* Trek Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {preview.trek.name}
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                  difficultyColor[preview.trek.difficulty] ?? "text-slate-600 bg-slate-100"
                }`}
              >
                {preview.trek.difficulty}
              </span>
            </div>

            {preview.trek.location && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                {preview.trek.location}
              </div>
            )}

            <p className="text-xs font-semibold text-slate-700">
              Group: <span className="text-slate-900">{preview.groupName}</span>
            </p>
          </div>

          {/* Schedule + Capacity row */}
          <div className="grid grid-cols-2 gap-3">
            {preview.schedule && (
              <div className="bg-slate-50 rounded-2xl p-3 space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Departure
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {new Date(preview.schedule.startDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-[10px] text-slate-500">{preview.schedule.duration} days</p>
              </div>
            )}

            <div className="bg-slate-50 rounded-2xl p-3 space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> Capacity
              </p>
              <p className="text-xs font-bold text-slate-800">
                {preview.currentMembers} / {preview.maxMembers}
              </p>
              <p className="text-[10px] text-slate-500">
                {preview.maxMembers - preview.currentMembers} spot(s) left
              </p>
            </div>
          </div>

          {/* Guide / Leader */}
          {(preview.guideName || preview.leaderName) && (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-emerald-50 rounded-2xl px-4 py-2.5">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {preview.guideName
                  ? `Guide: ${preview.guideName}`
                  : `Trek Leader: ${preview.leaderName}`}
              </span>
            </div>
          )}

          {/* Full warning */}
          {preview.currentMembers >= preview.maxMembers && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              This group is full and not accepting new members.
            </div>
          )}

          {/* Join error */}
          {joinError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{joinError}</span>
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleJoin}
            disabled={
              submitting ||
              preview.status !== "ACTIVE" ||
              preview.currentMembers >= preview.maxMembers
            }
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {submitting ? "Joining..." : `Yes, join "${preview.groupName}"`}
          </button>

          <p className="text-[10px] text-slate-400 text-center">
            Joining confirms you are part of this trek group. Your location will only
            be shared when you explicitly start sharing on the next screen.
          </p>
        </div>
      )}

      {/* ── Create Group (for bookers) ── */}
      {userBookings.length > 0 && (
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Your Confirmed Expeditions
            </h3>
            <Link
              href="/guardian/create"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Create Group
            </Link>
          </div>

          <div className="space-y-3">
            {userBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{b.trek.name}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {b.participants} Person(s)
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Departure:{" "}
                  <b>
                    {new Date(b.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </b>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/guardian/create"
            className="w-full py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            Create a Group for My Booking
          </Link>
        </div>
      )}
    </div>
  );
}
