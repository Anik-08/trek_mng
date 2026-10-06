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
  Plus,
} from "lucide-react";

export default function UserCreateTrekGroupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [confirmedBookings, setConfirmedBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [maxMembers, setMaxMembers] = useState(6);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await fetch("/api/bookings/my");
        if (res.ok) {
          const data = await res.json();
          const confirmed = (data.bookings || []).filter(
            (b: any) => b.bookingStatus === "CONFIRMED"
          );
          setConfirmedBookings(confirmed);
          if (confirmed.length > 0) {
            setSelectedBookingId(confirmed[0].id);
            setGroupName(`${user?.name ? user.name.split(" ")[0] + "'s" : "My"} ${confirmed[0].trek.name} Group`);
            setMaxMembers(Math.max(4, confirmed[0].participants || 4));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadBookings();
  }, [user]);

  const selectedBooking = confirmedBookings.find((b) => b.id === selectedBookingId);

  useEffect(() => {
    if (selectedBooking && user) {
      setGroupName(`${user.name.split(" ")[0]}'s ${selectedBooking.trek.name} Group`);
      setMaxMembers(Math.max(4, selectedBooking.participants || 4));
    }
  }, [selectedBookingId]);

  if (authLoading || loading) {
    return <div className="p-10 text-center text-sm">Preparing group creator...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Sign in to Create a Group</h2>
        <Link href="/login" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
          Login
        </Link>
      </div>
    );
  }

  if (confirmedBookings.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Confirmed Bookings Found</h2>
        <p className="text-xs text-slate-500">
          To create a live safety group for your friends and co-trekkers, you need an active confirmed booking for an upcoming trek.
        </p>
        <Link
          href="/treks"
          className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
        >
          Book a Trek First
        </Link>
      </div>
    );
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/guardian/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trekId: selectedBooking.trekId || selectedBooking.trek.id,
          scheduleId: selectedBooking.scheduleId,
          name: groupName,
          maxMembers: Number(maxMembers),
          separationThresholdMeters: 100,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create trek group");
        setSubmitting(false);
        return;
      }

      router.push(`/guardian/${data.group.id}`);
    } catch {
      setError("Network error occurred");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link
        href="/guardian/join"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Join Group
      </Link>

      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
          Co-Trekker Safety Group
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Create Trek Group for Your Booking
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Create a group code for your party so all your friends/participants can share live GPS and stay connected.
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
            Select Confirmed Expedition *
          </label>
          <div className="space-y-2">
            {confirmedBookings.map((b) => (
              <label
                key={b.id}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  selectedBookingId === b.id
                    ? "border-emerald-500 bg-emerald-50/60"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="bookingSelect"
                  value={b.id}
                  checked={selectedBookingId === b.id}
                  onChange={() => setSelectedBookingId(b.id)}
                  className="mt-1 accent-emerald-600"
                />
                <div className="flex-grow text-xs">
                  <div className="font-bold text-slate-900">{b.trek.name}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Departure:{" "}
                    <b>
                      {new Date(b.startDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </b>{" "}
                    · {b.participants} Person(s) booked
                  </div>
                </div>
              </label>
            ))}
          </div>
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
            placeholder="e.g. Rahul's Summit Squad"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Max Group Size
          </label>
          <input
            type="number"
            min={2}
            max={30}
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            How many friends/participants can join this group code.
          </span>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
          <Radio className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950">
            <span className="font-bold block">Share the Generated Join Code</span>
            Once created, you will get a unique join code (e.g. <span className="font-mono font-bold">TRK-KDM-4821</span>) to share with your group members.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Link
            href="/guardian/join"
            className="px-4 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? "Creating Group Code..." : "Create Group & Get Join Code"}
          </button>
        </div>
      </form>
    </div>
  );
}
