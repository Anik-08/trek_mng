import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import { CheckCircle2, MapPin, ArrowRight } from "lucide-react";

async function getBooking(id: string) {
  const isObjectId = /^[a-f\d]{24}$/i.test(id);
  return prisma.booking.findFirst({
    where: isObjectId ? { OR: [{ id }, { bookingId: id }] } : { bookingId: id },
    include: {
      trek: { include: { guide: true } },
      user: true,
    },
  });
}

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const booking = await getBooking(bookingId);

  if (!booking) {
    notFound();
  }

  const startFormatted = new Date(booking.startDate).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const endFormatted = new Date(booking.endDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const bookedOnFormatted = new Date(booking.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="bg-emerald-600 text-white rounded-3xl p-8 text-center space-y-3 shadow-lg">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Booking Confirmed!</h1>
        <p className="text-emerald-100 text-xs sm:text-sm max-w-md mx-auto">
          Your spots have been reserved. Prepare your trekking gear and report at the trailhead base camp.
        </p>
        <div className="inline-block bg-white text-emerald-900 font-mono font-bold text-sm px-4 py-1.5 rounded-xl mt-2 shadow-sm">
          Booking ID: {booking.bookingId}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expedition Details</span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">{booking.trek.name}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {booking.trek.location}, {booking.trek.state}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.bookingStatus} type="booking" />
            <StatusBadge status={booking.paymentStatus} type="payment" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[11px]">Trek Start</span>
            <span className="font-semibold text-slate-800 mt-1 block">{startFormatted}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Trek End</span>
            <span className="font-semibold text-slate-800 mt-1 block">{endFormatted}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Participants</span>
            <span className="font-semibold text-slate-800 mt-1 block">{booking.participants} Person(s)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Paid</span>
            <span className="font-bold text-emerald-700 text-sm mt-1 block">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
          <div className="font-semibold text-slate-800">Meeting Point:</div>
          <p className="text-slate-600">{booking.trek.meetingPoint || "Details will be shared before the trek"}</p>
          {booking.trek.guide && (
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500">Lead Guide:</span>
              <span className="font-semibold text-slate-800">
                {booking.trek.guide.name} ({booking.trek.guide.phone || "Contact at base"})
              </span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-500">Duration:</span>
            <span className="font-semibold text-slate-800">{booking.duration} day(s)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Booked On:</span>
            <span className="font-semibold text-slate-800">{bookedOnFormatted}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <Link href="/my-bookings" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5">
            View My Bookings
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/treks" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
            Explore More Treks
          </Link>
        </div>
      </div>
    </div>
  );
}
