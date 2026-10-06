import React from "react";
import Link from "next/link";
import { Calendar, Users, ArrowRight, X } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface Booking {
  id: string;
  bookingId: string;
  participants: number;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  startDate: string | Date;
  endDate: string | Date;
  duration: number;
  trek: {
    id: string;
    name: string;
    location: string;
    state: string;
    difficulty: string;
    imageUrl?: string;
    slug: string;
    reviews?: any[];
  };
}

interface Props {
  booking: Booking;
  onCancel?: (bookingId: string) => void;
  cancelling?: boolean;
}

export default function BookingCard({ booking, onCancel, cancelling }: Props) {
  const startFormatted = new Date(booking.startDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const endFormatted = new Date(booking.endDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const canCancel =
    booking.bookingStatus === "CONFIRMED" &&
    new Date(booking.startDate) > new Date();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row">
      <div className="sm:w-48 h-36 sm:h-auto bg-gradient-to-br from-emerald-800 to-slate-800 relative flex-shrink-0 flex items-center justify-center">
        {booking.trek.imageUrl ? (
          <img
            src={booking.trek.imageUrl}
            alt={booking.trek.name}
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute top-3 left-3">
          <StatusBadge status={booking.trek.difficulty} type="difficulty" />
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{booking.trek.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{booking.trek.location}, {booking.trek.state}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={booking.bookingStatus} type="booking" />
            <StatusBadge status={booking.paymentStatus} type="payment" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{startFormatted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{endFormatted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{booking.participants} Person(s)</span>
          </div>
          <div className="font-semibold text-slate-800">
            ₹{booking.totalAmount.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-auto">
          <span className="text-[11px] text-slate-400 font-mono">
            #{booking.bookingId}
          </span>
          <span className="text-[11px] text-slate-400">· {booking.duration} day(s)</span>

          <div className="flex items-center gap-2 ml-auto">
            {booking.bookingStatus === "COMPLETED" && booking.trek.reviews && booking.trek.reviews.length === 0 && (
              <Link
                href={`/my-bookings?review=${booking.trek.id}`}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 px-3 py-1.5 bg-emerald-50 rounded-lg transition"
              >
                Write Review
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}

            {canCancel && onCancel && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={cancelling}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-3 py-1.5 bg-rose-50 rounded-lg transition disabled:opacity-50"
              >
                <X className="w-3 h-3" />
                {cancelling ? "Cancelling..." : "Cancel"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
