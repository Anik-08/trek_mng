"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  Compass,
  Calendar,
  Users,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mountain,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function GuideDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [treks, setTreks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGuideTreks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guide/treks");
      if (res.ok) {
        const data = await res.json();
        setTreks(data.treks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "GUIDE" || user.role === "ADMIN")) {
      fetchGuideTreks();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-500">
        Loading guide portal...
      </div>
    );
  }

  if (!user || (user.role !== "GUIDE" && user.role !== "ADMIN")) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Guide Access Required</h2>
        <p className="text-xs text-slate-500">
          This portal is reserved for certified trek guides and administrative leads.
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
        >
          Login as Guide
        </Link>
      </div>
    );
  }

  const totalParticipantsGuided = treks.reduce(
    (acc, t) => acc + (t.totalParticipants || 0),
    0
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Expedition Leader Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Guide Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, {user.name}. Review your assigned treks, participant rosters, and safety contacts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-center">
            <span className="text-[10px] text-emerald-700 font-semibold block uppercase">
              Assigned Treks
            </span>
            <span className="text-lg font-bold text-emerald-900">{treks.length}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-center">
            <span className="text-[10px] text-emerald-700 font-semibold block uppercase">
              Total Trekkers
            </span>
            <span className="text-lg font-bold text-emerald-900">
              {totalParticipantsGuided}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">
          Loading assigned treks...
        </div>
      ) : treks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Mountain className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No treks assigned yet</h3>
          <p className="text-xs text-slate-500">
            You will receive a notification when the admin team assigns you as lead guide for upcoming expeditions.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Your Assigned Trails</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {treks.map((trek) => {
              const startFormatted = trek.startDate
                ? new Date(trek.startDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "TBA";

              return (
                <div
                  key={trek.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {trek.location}, {trek.state}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">
                        {trek.name}
                      </h3>
                    </div>
                    <StatusBadge status={trek.difficulty} type="difficulty" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Next Departure</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {startFormatted}
                        {trek.scheduleCount > 1 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{trek.scheduleCount - 1} more
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Registered Trekkers</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        {trek.totalParticipants} / {trek.maxCapacity} Trekkers
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200/60">
                      <span className="text-slate-400 block text-[11px]">Starting Checkpoint</span>
                      <span className="font-medium text-slate-700 mt-0.5 block">
                        {trek.startingPoint}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      {trek.participantsList?.length || 0} Booking Group(s)
                    </span>

                    <Link
                      href={`/guide/treks/${trek.id}`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Participant Roster
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
