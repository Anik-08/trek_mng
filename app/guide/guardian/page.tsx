"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  ShieldCheck,
  Plus,
  Users,
  Radio,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Compass,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function GuideGuardianHubPage() {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guardian/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "GUIDE" || user.role === "ADMIN")) {
      fetchGroups();
    }
  }, [user]);

  if (authLoading) return <div className="p-10 text-center text-sm">Loading Guardian...</div>;
  if (!user || (user.role !== "GUIDE" && user.role !== "ADMIN")) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
        <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Guide Access Required</h2>
        <Link href="/login" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  const activeGroups = groups.filter((g) => g.status === "ACTIVE");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            href="/guide"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Guide Portal
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            AI Trek Guardian Live System
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trek Group Safety Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create real-time trekking groups, monitor live GPS positions, and detect participant separation.
          </p>
        </div>

        <Link
          href="/guide/guardian/create"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Trek Group
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block font-medium">Active Monitored Groups</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">{activeGroups.length}</span>
          </div>
          <Radio className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block font-medium">Total Registered Trekkers</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">
              {groups.reduce((acc, g) => acc + (g.memberCount || 0), 0)}
            </span>
          </div>
          <Users className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block font-medium">Live Sharing Compliance</span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-0.5 block">
              {groups.reduce((acc, g) => acc + (g.activeSharingCount || 0), 0)} Live Pings
            </span>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading groups...</div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-sm">
          <Compass className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Trek Groups Created Yet</h3>
          <p className="text-xs text-slate-500">
            Create a safety group for an upcoming trek schedule to invite participants and track them live on the trail.
          </p>
          <Link
            href="/guide/guardian/create"
            className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Create Your First Group
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Your Trek Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 hover:border-emerald-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {group.trek.name} ({group.trek.location})
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{group.name}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                    {group.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Join Code</span>
                    <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                      {group.groupCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Members</span>
                    <span className="font-bold text-emerald-800 text-sm mt-0.5 block">
                      {group.memberCount} / {group.maxMembers}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Schedule Date</span>
                    <span className="font-medium text-slate-700 mt-0.5 block">
                      {new Date(group.schedule.startDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Separation Alert Threshold</span>
                    <span className="font-medium text-slate-700 mt-0.5 block">
                      {group.separationThresholdMeters} meters
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-600" />
                    {group.activeSharingCount} sharing live location
                  </span>

                  <Link
                    href={`/guide/guardian/${group.id}`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                  >
                    Open Live Guardian
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
