"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  ShieldCheck,
  Radio,
  Users,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Activity,
  Bell,
  CheckCircle2,
} from "lucide-react";

export default function AdminGuardianAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [anRes, grRes] = await Promise.all([
        fetch("/api/guardian/analytics"),
        fetch("/api/guardian/groups"),
      ]);

      if (anRes.ok) {
        const aData = await anRes.json();
        setAnalytics(aData);
      }
      if (grRes.ok) {
        const gData = await grRes.json();
        setGroups(gData.groups || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchData();
    }
  }, [user]);

  if (authLoading || loading) {
    return <div className="p-10 text-center text-sm">Loading Guardian Analytics...</div>;
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Admin Access Required</h2>
        <Link href="/login" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Platform Guardian Safety Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trek Guardian System Telemetry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global monitoring of live groups, group separation alarms, route deviations, and compliance metrics.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
        >
          Refresh Telemetry
        </button>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 block font-medium">Active Monitored Groups</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">
              {analytics.activeGroups} / {analytics.totalGroups}
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 block font-medium">Active Trekkers Tracked</span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-0.5 block">
              {analytics.activeSharingMembers} / {analytics.totalMembers}
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 block font-medium">Separation Alarms Detected</span>
            <span className="text-2xl font-extrabold text-rose-600 mt-0.5 block">
              {analytics.separationEvents} Events
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 block font-medium">Route Deviation Flags</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-0.5 block">
              {analytics.deviationEvents} Flags
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <h2 className="text-lg font-bold text-slate-900">All Registered Safety Groups</h2>
        {groups.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-6 text-center">No groups created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                  <th className="py-3.5 px-4">Group Code</th>
                  <th className="py-3.5 px-4">Group Name</th>
                  <th className="py-3.5 px-4">Trek</th>
                  <th className="py-3.5 px-4">Lead Guide</th>
                  <th className="py-3.5 px-4">Members</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{g.groupCode}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{g.name}</td>
                    <td className="py-3.5 px-4 text-slate-700">{g.trek.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{g.guide?.name || "Unassigned"}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {g.memberCount} / {g.maxMembers}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {g.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/guide/guardian/${g.id}`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm inline-flex items-center gap-1"
                      >
                        Live Guardian
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {analytics?.recentEvents && analytics.recentEvents.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">System-Wide Real-Time Event Audit</h2>
          <div className="space-y-3">
            {analytics.recentEvents.map((ev: any) => (
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
                  <div className="text-slate-600">
                    Group: <b>{ev.group?.name}</b> ({ev.group?.trek?.name}) · Trigger: {ev.user?.name || "System"}
                  </div>
                  {ev.metadata && (
                    <div className="text-[11px] text-slate-500 font-mono mt-1 bg-white p-2 rounded-lg border border-slate-100">
                      {ev.metadata}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
