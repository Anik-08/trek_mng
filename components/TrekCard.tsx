import React from "react";
import Link from "next/link";
import { Mountain } from "lucide-react";

export interface TrekCardProps {
  trek: {
    id: string;
    name: string;
    slug: string;
    location: string;
    state: string;
    imageUrl?: string;
    difficulty: string;
    basePricePerDay: number;
    availableDurations: number[];
    distance?: number;
    elevation?: number;
    avgRating?: number;
    totalReviews?: number;
    nextSchedule?: { startDate: string | Date; bookedParticipants: number; capacity: number } | null;
  };
}

export default function TrekCard({ trek }: TrekCardProps) {
  const minDuration = Math.min(...(trek.availableDurations.length > 0 ? trek.availableDurations : [1]));
  const startingPrice = trek.basePricePerDay * minDuration;

  const difficultyColors: Record<string, string> = {
    EASY: "bg-green-100 text-green-800",
    MODERATE: "bg-amber-100 text-amber-800",
    DIFFICULT: "bg-rose-100 text-rose-800",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group">
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-emerald-800 to-slate-800 flex items-center justify-center">
        {trek.imageUrl ? (
          <img
            src={trek.imageUrl}
            alt={trek.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <Mountain className="w-16 h-16 text-emerald-400/40" />
        )}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${difficultyColors[trek.difficulty] || "bg-slate-100 text-slate-800"}`}>
            {trek.difficulty}
          </span>
        </div>
        {trek.availableDurations.length > 0 && (
          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-semibold">
            {trek.availableDurations.join("/")} day{trek.availableDurations.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs text-emerald-700 font-medium">
            {trek.location}{trek.state ? `, ${trek.state}` : ""}
          </span>
          {trek.avgRating && trek.avgRating > 0 ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              ★ {trek.avgRating}
              <span className="text-slate-400 text-[10px]">({trek.totalReviews})</span>
            </div>
          ) : null}
        </div>

        <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-2">
          {trek.name}
        </h3>

        {trek.nextSchedule && (
          <div className="text-xs text-slate-500 mb-2">
            Next:{" "}
            <span className="font-medium text-slate-700">
              {new Date(trek.nextSchedule.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
            {" · "}
            <span className="text-emerald-600 font-medium">
              {trek.nextSchedule.capacity - trek.nextSchedule.bookedParticipants} slots left
            </span>
          </div>
        )}

        <div className="pt-4 mt-auto flex items-center justify-between border-t border-slate-100">
          <div>
            <span className="text-[11px] text-slate-400 block">From</span>
            <span className="text-lg font-bold text-slate-900">₹{startingPrice.toLocaleString("en-IN")}</span>
            <span className="text-xs text-slate-500"> / person</span>
          </div>

          <Link
            href={`/treks/${trek.slug}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
