"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  ShieldCheck,
  Users,
  Mountain,
  Calendar,
  IndianRupee,
  Compass,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileCheck,
  MessageSquare,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchAnalytics();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-500">
        Loading admin console...
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Admin Privileges Required</h2>
        <p className="text-xs text-slate-500">
          This section is strictly accessible by platform administrators.
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
        >
          Login as Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Admin Analytics & Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time platform metrics, booking revenues, and operational controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/treks"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Manage Treks
          </Link>
          <Link
            href="/admin/bookings"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Manage Bookings
          </Link>
          <Link
            href="/admin/users"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Users & Guides
          </Link>
          <Link
            href="/admin/reviews"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Reviews
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">
          Loading metrics...
        </div>
      ) : !analytics ? (
        <div className="text-center text-sm text-rose-600 py-10">
          Failed to load analytics.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Total Revenue</span>
                <IndianRupee className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                ₹{analytics.totalRevenue.toLocaleString("en-IN")}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium block">
                From completed & confirmed trips
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Total Bookings</span>
                <FileCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {analytics.totalBookings}
              </div>
              <span className="text-[11px] text-slate-500 font-medium block">
                {analytics.totalParticipants} total participants booked
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Active Treks</span>
                <Mountain className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {analytics.totalTreks}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium block">
                {analytics.upcomingTreks} upcoming departures
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase">Platform Users</span>
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {analytics.totalUsers}
              </div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Including {analytics.totalGuides} certified guides
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Most Booked Treks
                </h3>
                <Link
                  href="/admin/treks"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                >
                  View All &rarr;
                </Link>
              </div>

              {analytics.mostBookedTreks.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">No booking stats yet.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.mostBookedTreks.map((t: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900">{t.name}</div>
                        <div className="text-[11px] text-slate-500">{t.location}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-700">
                          {t.count} trekkers
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ₹{t.revenue.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Recent Platform Bookings
                </h3>
                <Link
                  href="/admin/bookings"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                >
                  View All &rarr;
                </Link>
              </div>

              {analytics.recentBookings.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">No bookings made yet.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.recentBookings.map((b: any) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="font-mono text-slate-500">{b.bookingId}</span>
                          <span>• {b.user.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{b.trek.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          ₹{b.totalAmount.toLocaleString("en-IN")}
                        </span>
                        <StatusBadge status={b.bookingStatus} type="booking" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
