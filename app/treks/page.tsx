"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import TrekCard from "@/components/TrekCard";
import { Search, Filter, Mountain, X, Sparkles, ArrowRight } from "lucide-react";

export default function TreksPage() {
  const [treks, setTreks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [state, setState] = useState("");

  const fetchTreks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (difficulty) params.append("difficulty", difficulty);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (state) params.append("state", state);

      const res = await fetch(`/api/treks?${params.toString()}`);
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
    fetchTreks();
  }, [difficulty, maxPrice, state]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTreks();
  };

  const handleResetFilters = () => {
    setSearch("");
    setDifficulty("");
    setMaxPrice("");
    setState("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Smart Recommendations Callout Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/30 text-purple-300 flex items-center justify-center border border-purple-400/30 shrink-0">
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
              AI Smart Recommendation Engine
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Not sure which trek suits your fitness and budget?
            </h2>
          </div>
        </div>
        <Link
          href="/recommendations"
          className="px-4 py-2.5 bg-white hover:bg-purple-50 text-purple-950 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm shrink-0"
        >
          Get AI Recommendations
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            All Trails &amp; Expeditions
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Explore Mountain Treks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse through verified Indian treks with confirmed schedules and certified guides.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trek or location..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Search
          </button>
        </form>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MODERATE">Moderate</option>
            <option value="DIFFICULT">Difficult</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Max Daily Price</option>
            <option value="1300">Under ₹1,300/day</option>
            <option value="1500">Under ₹1,500/day</option>
            <option value="1800">Under ₹1,800/day</option>
            <option value="2500">Under ₹2,500/day</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All States</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Uttarakhand">Uttarakhand</option>
          </select>
        </div>

        {(difficulty || maxPrice || state || search) && (
          <button
            onClick={handleResetFilters}
            className="ml-auto text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
          >
            <X className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">
          Loading treks...
        </div>
      ) : treks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Mountain className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No treks found</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search query or reset the filters to see available expeditions.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {treks.map((trek) => (
            <TrekCard key={trek.id} trek={trek} />
          ))}
        </div>
      )}
    </div>
  );
}
