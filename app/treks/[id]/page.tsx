import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import TrekMap from "@/components/TrekMap";
import {
  MapPin,
  Calendar,
  Clock,
  Mountain,
  Users,
  CheckCircle,
  Shield,
  Star,
  ArrowRight,
  Phone,
  Compass,
  CheckCircle2,
} from "lucide-react";

async function getTrek(idOrSlug: string) {
  try {
    const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
    const trek = await prisma.trek.findFirst({
      where: isObjectId
        ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
        : { slug: idOrSlug },
      include: {
        guide: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        schedules: {
          where: {
            status: { in: ["OPEN", "FULL"] },
            startDate: { gte: new Date() },
          },
          orderBy: {
            startDate: "asc",
          },
        },
      },
    });

    if (!trek) return null;

    let parsedRequirements: string[] = [];
    try {
      parsedRequirements = JSON.parse(trek.requirements);
    } catch {
      parsedRequirements = [trek.requirements];
    }

    let parsedCheckpoints: string[] = [];
    try {
      parsedCheckpoints = JSON.parse(trek.checkpoints);
    } catch {
      parsedCheckpoints = [];
    }

    let parsedItineraries: Record<string, Array<{ day: number; title: string; desc: string }>> = {};
    try {
      parsedItineraries = JSON.parse(trek.itineraries);
    } catch {
      parsedItineraries = {};
    }

    const totalReviews = trek.reviews.length;
    const avgRating =
      totalReviews > 0
        ? Number(
            (
              trek.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            ).toFixed(1)
          )
        : 0;

    return {
      ...trek,
      parsedRequirements,
      parsedCheckpoints,
      parsedItineraries,
      totalReviews,
      avgRating,
    };
  } catch {
    return null;
  }
}

export default async function TrekDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trek = await getTrek(id);

  if (!trek) {
    notFound();
  }

  const primarySchedule = trek.schedules[0];
  const minDuration = Math.min(...(trek.availableDurations.length > 0 ? trek.availableDurations : [1]));
  const startingPrice = trek.basePricePerDay * minDuration;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="relative h-80 sm:h-96 w-full rounded-3xl overflow-hidden shadow-md">
        <img
          src={trek.imageUrl}
          alt={trek.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

        <div className="absolute top-6 left-6 flex items-center gap-2">
          <StatusBadge status={trek.difficulty} type="difficulty" />
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
            {trek.location}, {trek.state}
          </span>
        </div>

        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {trek.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Starting: {trek.meetingPoint} &rarr; Summit: {trek.destination}
            </p>
          </div>

          {trek.avgRating > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-400/30 px-3 py-1.5 rounded-xl text-amber-300 text-xs font-bold w-fit">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{trek.avgRating} / 5.0</span>
              <span className="text-slate-300 font-normal">
                ({trek.totalReviews} reviews)
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">About the Trek</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {trek.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <Clock className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-slate-400 block text-[11px]">Durations</span>
                <span className="font-bold text-slate-800">{trek.availableDurations.join(", ")} Day(s)</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <Mountain className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-slate-400 block text-[11px]">Elevation</span>
                <span className="font-bold text-slate-800">{trek.elevation} meters</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <Compass className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-slate-400 block text-[11px]">Trail Distance</span>
                <span className="font-bold text-slate-800">{trek.distance} km</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <Users className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-slate-400 block text-[11px]">Group Size</span>
                <span className="font-bold text-slate-800">Max {trek.maxParticipants}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Interactive Trail & Route Map</h2>
            <p className="text-xs text-slate-500">
              Visual map illustrating starting base coordinates and summit peak pin.
            </p>
            <TrekMap
              startLat={trek.startLat || 13.22}
              startLng={trek.startLng || 75.25}
              destLat={trek.destLat || 13.12}
              destLng={trek.destLng || 75.27}
              startName={trek.meetingPoint}
              destName={trek.destination}
            />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Itineraries & Day Plans</h2>
            {Object.keys(trek.parsedItineraries).length === 0 ? (
              <p className="text-xs text-slate-500">Itinerary details briefed at trailhead.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(trek.parsedItineraries).map(([dur, days]) => (
                  <div key={dur} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">
                      {dur}-Day Option
                    </h3>
                    <div className="space-y-3">
                      {days.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            D{item.day || idx + 1}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Required Gear & Checkpoints</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trek.parsedRequirements.map((eq, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{eq}</span>
                </div>
              ))}
            </div>
            {trek.parsedCheckpoints.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block mb-2">Key Trail Checkpoints:</span>
                <div className="flex flex-wrap gap-2">
                  {trek.parsedCheckpoints.map((cp, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                      {idx + 1}. {cp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {trek.guide && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Assigned Mountain Guide</h2>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0">
                  {trek.guide.name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{trek.guide.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md uppercase">
                      Certified Leader
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {trek.guide.bio || "Certified wilderness leader with years of trail experience across Indian summits."}
                  </p>
                  {trek.guide.phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      {trek.guide.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Trekker Reviews</h2>
              <span className="text-xs text-slate-500">
                {trek.totalReviews} verified review(s)
              </span>
            </div>

            {trek.reviews.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No reviews yet for this trek. Be among the first to complete this expedition and write a review!
              </p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {trek.reviews.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                          {rev.user.name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-900">{rev.user.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 block">
                      Reviewed on {new Date(rev.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="sticky top-24 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] text-slate-400 block">Base Price</span>
                <span className="text-2xl font-extrabold text-slate-900">₹{trek.basePricePerDay.toLocaleString("en-IN")}</span>
                <span className="text-xs text-slate-500"> / person / day</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <span className="text-xs font-bold text-slate-800 block">Upcoming Schedule Instances:</span>
              {trek.schedules.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-center">
                  No upcoming dates posted. Check back soon.
                </div>
              ) : (
                <div className="space-y-2">
                  {trek.schedules.slice(0, 4).map((s) => {
                    const slotsLeft = s.capacity - s.bookedParticipants;
                    return (
                      <div key={s.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">
                            {new Date(s.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            {" - "}
                            {new Date(s.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </div>
                          <div className="text-[10px] text-slate-500">{s.duration} Day(s)</div>
                        </div>
                        <span className={`text-[11px] font-bold ${slotsLeft > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {slotsLeft > 0 ? `${slotsLeft} left` : "Full"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href={`/treks/${trek.id}/book`}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition shadow-md flex items-center justify-center gap-2"
            >
              Book Now
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="pt-2 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simulated Instant Payment & Full Refund On Cancel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
