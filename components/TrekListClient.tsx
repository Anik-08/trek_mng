"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, Mountain, X } from "lucide-react";

interface TrekItem {
  slug: string;
  title: string;
  intro: string;
}

interface Props {
  treks: TrekItem[];
}

export default function TrekListClient({ treks }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return treks;
    return treks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.intro.toLowerCase().includes(q)
    );
  }, [search, treks]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            All Trails & Expeditions
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Explore Trek Guides
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {treks.length} trek guides from our verified content library.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trek name..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Mountain className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No treks found</h3>
          <p className="text-xs text-slate-500">
            Try a different search term.
          </p>
          <button
            onClick={() => setSearch("")}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((trek) => (
            <div
              key={trek.slug}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
            >
              <div className="relative h-44 w-full bg-gradient-to-br from-emerald-800 to-slate-800 flex items-center justify-center">
                <Mountain className="w-16 h-16 text-emerald-400/40" />
                <div className="absolute bottom-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                    Trek Guide
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-base font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-emerald-700 transition">
                  {trek.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-grow">
                  {trek.intro || "Detailed trek guide with trail information, highlights, and travel tips."}
                </p>
                <div className="pt-4 mt-3 border-t border-slate-100">
                  <Link
                    href={`/treks/${trek.slug}`}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Read Guide
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
