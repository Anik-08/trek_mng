"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Mountain,
  Calendar,
  IndianRupee,
  MapPin,
  Sun,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { TrekRecommendation, RecommendationCriteria } from "@/lib/ai/types";

export default function AIRecommendationsPage() {
  const [difficulty, setDifficulty] = useState<string>("ANY");
  const [durationDays, setDurationDays] = useState<string>("ANY");
  const [maxBudget, setMaxBudget] = useState<string>("ANY");
  const [location, setLocation] = useState<string>("ANY");
  const [season, setSeason] = useState<string>("ANY");

  const [recommendations, setRecommendations] = useState<TrekRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch recommendations whenever filters change
  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          difficulty,
          durationDays,
          maxBudget,
          location,
          season,
        });
        const res = await fetch(`/api/ai/recommendations?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (err) {
        console.error("Failed to load recommendations", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [difficulty, durationDays, maxBudget, location, season]);

  const handleResetFilters = () => {
    setDifficulty("ANY");
    setDurationDays("ANY");
    setMaxBudget("ANY");
    setLocation("ANY");
    setSeason("ANY");
  };

  const difficultyColors: Record<string, string> = {
    EASY: "bg-emerald-50 text-emerald-700 border-emerald-200",
    MODERATE: "bg-amber-50 text-amber-700 border-amber-200",
    DIFFICULT: "bg-rose-50 text-rose-700 border-rose-200",
    EXTREME: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          AI Smart Trek Recommendations
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Find Your Perfect Mountain Trail
        </h1>
        <p className="text-sm text-slate-600">
          Our recommendation engine dynamically scores and ranks available expeditions based on your fitness level, schedule, budget, and seasonal weather suitability.
        </p>
      </div>

      {/* Interactive Preference Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Sliders className="w-4 h-4 text-purple-600" />
            <span>Customize Trek Preferences</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-purple-600 flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-slate-400" /> Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ANY">Any Difficulty</option>
              <option value="EASY">Easy (Beginner Friendly)</option>
              <option value="MODERATE">Moderate (Weekend Hikers)</option>
              <option value="DIFFICULT">Difficult (Endurance Challenge)</option>
            </select>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Duration
            </label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ANY">Any Duration</option>
              <option value="1">1 Day (Express Day Hike)</option>
              <option value="2">2 Days (Overnight Camp)</option>
              <option value="3">3 Days (Full Expedition)</option>
            </select>
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-slate-400" /> Max Budget / Day
            </label>
            <select
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ANY">Any Budget</option>
              <option value="1500">Under ₹1,500</option>
              <option value="2000">Under ₹2,000</option>
              <option value="3000">Under ₹3,000</option>
            </select>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Region / State
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ANY">All Regions</option>
              <option value="Chikkamagaluru">Chikkamagaluru</option>
              <option value="Pushpagiri">Coorg / Pushpagiri</option>
              <option value="Chikkaballapur">Chikkaballapur</option>
            </select>
          </div>

          {/* Season */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-slate-400" /> Target Season
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ANY">Any Season</option>
              <option value="MONSOON">Monsoon (Lush Greenery)</option>
              <option value="WINTER">Winter / Clear Sunrise</option>
              <option value="POST_MONSOON">Post-Monsoon (Best Visibility)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Top AI Recommended Treks ({recommendations.length})
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Ranked by AI multi-objective match percentage
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Scoring live trek dataset against criteria...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <Mountain className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">No matching treks found</h3>
            <p className="text-xs text-slate-500">Try broadening your budget or difficulty preferences.</p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((trek) => (
              <div
                key={trek.trekId}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Image & Match Score Badge */}
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={trek.imageUrl}
                      alt={trek.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1 backdrop-blur-xs">
                      <Sparkles className="w-3 h-3" />
                      {trek.matchScorePercent}% Match
                    </div>
                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      {trek.location}, {trek.state}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            difficultyColors[trek.difficulty] || "bg-slate-50 text-slate-700"
                          }`}
                        >
                          {trek.difficulty}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {trek.distanceKm} km • {trek.durationDays} Day(s)
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                        {trek.name}
                      </h3>
                    </div>

                    {/* AI Match Explanation Reasons */}
                    <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3.5 space-y-1.5">
                      <div className="text-[10px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" /> Why this matches:
                      </div>
                      <ul className="space-y-1 text-[11px] text-purple-950 font-medium">
                        {trek.matchReasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-purple-600 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Season info */}
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Best Season: <b>{trek.bestSeason}</b></span>
                    </div>
                  </div>
                </div>

                {/* Footer Price & Booking */}
                <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Starting at</span>
                    <div className="text-base font-extrabold text-slate-900">
                      ₹{trek.pricePerDay}
                      <span className="text-[11px] font-normal text-slate-500"> / day</span>
                    </div>
                  </div>

                  <Link
                    href={`/treks/${trek.trekId}`}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
