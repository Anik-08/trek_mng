import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckSquare,
  Shield,
} from "lucide-react";

async function getGuideTrekRoster(trekId: string) {
  const trek = await prisma.trek.findUnique({
    where: { id: trekId },
    include: {
      guide: true,
      schedules: {
        orderBy: {
          startDate: "asc",
        },
      },
      bookings: {
        where: {
          bookingStatus: { in: ["CONFIRMED", "COMPLETED"] },
        },
        include: {
          user: true,
          schedule: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return trek;
}

export default async function GuideTrekRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "GUIDE" && session.role !== "ADMIN")) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
        <p className="text-sm text-slate-700">Guide authentication required.</p>
        <Link
          href="/login"
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
        >
          Login
        </Link>
      </div>
    );
  }

  const { id } = await params;
  const trek = await getGuideTrekRoster(id);

  if (!trek) {
    notFound();
  }

  const totalParticipants = trek.bookings.reduce(
    (sum, b) => sum + b.participants,
    0
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link
        href="/guide"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Guide Dashboard
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Expedition Passenger Manifest
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
              {trek.name}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {trek.location}, {trek.state}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-center">
              <span className="text-[10px] text-emerald-700 font-semibold block uppercase">
                Trekkers Attending
              </span>
              <span className="text-lg font-bold text-emerald-900">
                {totalParticipants} / {trek.maxParticipants}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Trailhead Base</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{trek.meetingPoint || "Trailhead Base"}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Summit Destination</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{trek.destination || "Peak Summit"}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Participant Contact & Safety Roster
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {trek.bookings.length} Registered Group(s)
          </span>
        </div>

        {trek.bookings.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-8">
            No participants have booked spots for this trek yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-3">Booking ID</th>
                  <th className="py-3 px-3">Trekker Name</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Schedule</th>
                  <th className="py-3 px-3">Spots</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trek.bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-600">
                      {b.bookingId}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      {b.user.name}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      <div>{b.user.email}</div>
                      <div className="text-slate-400 text-[11px]">{b.user.phone || "No phone"}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {new Date(b.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - {new Date(b.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-emerald-700">
                      {b.participants}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
