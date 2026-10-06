import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TrekCard from "@/components/TrekCard";
import {
  Mountain,
  Users,
  ShieldCheck,
  Compass,
  ArrowRight,
  MapPin,
  Sparkles,
  CheckCircle2,
  Radio,
  TrendingUp,
  Layers,
  Zap,
  Play,
} from "lucide-react";

async function getFeaturedTreks() {
  try {
    const treks = await prisma.trek.findMany({
      where: { status: "ACTIVE" },
      take: 6,
      include: {
        guide: true,
        reviews: true,
        schedules: {
          where: {
            status: "OPEN",
            startDate: { gte: new Date() },
          },
          orderBy: { startDate: "asc" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return treks.map((t) => ({
      ...t,
      avgRating:
        t.reviews.length > 0
          ? Number(
              (
                t.reviews.reduce((acc, curr) => acc + curr.rating, 0) /
                t.reviews.length
              ).toFixed(1)
            )
          : 0,
      totalReviews: t.reviews.length,
      nextSchedule: t.schedules[0] ?? null,
    }));
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const treksCount = await prisma.trek.count();
    const bookingsCount = await prisma.booking.count();
    const usersCount = await prisma.user.count();
    const guidesCount = await prisma.user.count({ where: { role: "GUIDE" } });
    return { treksCount, bookingsCount, usersCount, guidesCount };
  } catch {
    return { treksCount: 6, bookingsCount: 1, usersCount: 5, guidesCount: 3 };
  }
}

export default async function HomePage() {
  const featuredTreks = await getFeaturedTreks();
  const stats = await getStats();

  return (
    <div className="space-y-16 pb-16">
      {/* ── HERO SECTION ── */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop"
            alt="Mountain Range"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Mountain Expeditions
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Conquer the Peaks with Certified Guides
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Explore handpicked trekking routes across Karnataka, Maharashtra, Kerala, and beyond. Verified slot capacities, interactive schedules, and certified wilderness leaders.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/treks"
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition shadow-lg flex items-center gap-2 text-sm"
              >
                Explore All Treks
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/ai-monitor"
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl transition shadow-lg flex items-center gap-2 text-sm"
              >
                <Zap className="w-4 h-4" />
                Launch AI Trek Monitor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI TREK INTELLIGENCE SUITE (4 PILLARS) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Next-Gen Mountain Safety
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                AI Trek Intelligence Suite
              </h2>
              <p className="text-sm text-slate-400 max-w-2xl">
                Comprehensive real-time spatial monitoring, kinematic ETA projection, trail topography intelligence, and preference matching.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/ai-monitor"
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Open AI Trek Monitor
              </Link>
              <Link
                href="/recommendations"
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition border border-white/15 backdrop-blur-md flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Smart Recommendations
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: AI Trek Guardian */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4 hover:border-emerald-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Trek Guardian</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Real-time monitoring for group separation, route deviation, and abnormal trek activity.
                </p>
              </div>
              {/* Mini visual status widget */}
              <div className="bg-slate-900/90 rounded-xl p-3 text-[11px] border border-slate-700/50 space-y-1.5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Group Status:</span>
                  <span className="text-emerald-400 font-bold">NORMAL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Participants:</span>
                  <span className="text-white font-semibold">15/15 Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Route:</span>
                  <span className="text-emerald-400 font-bold">ON TRACK</span>
                </div>
              </div>
            </div>

            {/* Card 2: AI Trek Progress & ETA */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4 hover:border-blue-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Trek Progress &amp; ETA</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Predicts trek progress and expected completion using movement, elevation and checkpoint data.
                </p>
              </div>
              {/* Mini visual status widget */}
              <div className="bg-slate-900/90 rounded-xl p-3 text-[11px] border border-slate-700/50 space-y-1.5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Progress:</span>
                  <span className="text-blue-400 font-bold">64%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Speed:</span>
                  <span className="text-white font-semibold">4.2 km/h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Predicted ETA:</span>
                  <span className="text-emerald-400 font-bold">4:42 PM</span>
                </div>
              </div>
            </div>

            {/* Card 3: AI Route Intelligence */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4 hover:border-amber-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Route Intelligence</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Identifies challenging route sections, delays and potential trek bottlenecks before arrival.
                </p>
              </div>
              {/* Mini visual status widget */}
              <div className="bg-slate-900/90 rounded-xl p-3 text-[11px] border border-slate-700/50 space-y-1.5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Current Section:</span>
                  <span className="text-white font-bold truncate max-w-[90px]">Forest Trail</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Difficulty:</span>
                  <span className="text-amber-400 font-bold">MODERATE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Bottlenecks:</span>
                  <span className="text-emerald-400 font-semibold">None Active</span>
                </div>
              </div>
            </div>

            {/* Card 4: AI Trek Recommendations */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4 hover:border-purple-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Recommendations</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Suggests personalized treks based on user fitness preferences, season and budget.
                </p>
              </div>
              {/* Mini visual status widget */}
              <div className="bg-slate-900/90 rounded-xl p-3 text-[11px] border border-slate-700/50 space-y-1.5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Matching Status:</span>
                  <span className="text-purple-400 font-bold">ACTIVE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Top Match:</span>
                  <span className="text-white font-semibold">96% Kudremukh</span>
                </div>
                <div className="text-[10px] text-emerald-400 pt-0.5">
                  3 Treks Match Your Preferences
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM STATS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <Mountain className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-3xl font-extrabold text-slate-900">{stats.treksCount}+</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Curated Trails</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <Users className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-3xl font-extrabold text-slate-900">{stats.usersCount}+</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Adventurers</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <Compass className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-3xl font-extrabold text-slate-900">{stats.guidesCount}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Certified Guides</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-3xl font-extrabold text-slate-900">{stats.bookingsCount}+</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Confirmed Bookings</div>
          </div>
        </div>
      </section>

      {/* ── FEATURED TREKS CATALOG ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Handpicked Expeditions
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Popular Trekking Trails
            </h2>
          </div>
          <Link
            href="/treks"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
          >
            View all available treks
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTreks.map((trek) => (
            <TrekCard key={trek.id} trek={trek as any} />
          ))}
        </div>
      </section>

      {/* ── VALUE PROPOSITION ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Why Trek With Our Platform?
            </h2>
            <p className="text-emerald-200 text-sm sm:text-base leading-relaxed">
              We eliminate chaotic offline bookings and unpredictable trek slots. Every trek has clear multi-day itineraries, verified equipment checklists, certified mountain leaders, and emergency protocols.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-emerald-800/60 p-4 rounded-xl border border-emerald-700/50">
                <ShieldCheck className="w-5 h-5 text-emerald-300 mb-2" />
                <h4 className="font-semibold text-sm">Real-time Slot Locks</h4>
                <p className="text-xs text-emerald-200 mt-1">Guaranteed slot reservation without overbooking issues.</p>
              </div>
              <div className="bg-emerald-800/60 p-4 rounded-xl border border-emerald-700/50">
                <MapPin className="w-5 h-5 text-emerald-300 mb-2" />
                <h4 className="font-semibold text-sm">Interactive Route Maps</h4>
                <p className="text-xs text-emerald-200 mt-1">Visual trailhead and peak coordinates before departure.</p>
              </div>
              <div className="bg-emerald-800/60 p-4 rounded-xl border border-emerald-700/50">
                <Users className="w-5 h-5 text-emerald-300 mb-2" />
                <h4 className="font-semibold text-sm">Dedicated Guide Roster</h4>
                <p className="text-xs text-emerald-200 mt-1">Guides have immediate access to participants and medical notes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
