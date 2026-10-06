"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Users, ShieldCheck, CreditCard, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [trek, setTrek] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingTrek, setLoadingTrek] = useState(true);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [participants, setParticipants] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const trekId = params.id as string;

  useEffect(() => {
    async function loadTrek() {
      try {
        const res = await fetch(`/api/treks/${trekId}`);
        if (res.ok) {
          const data = await res.json();
          setTrek(data.trek);
          const openSchedules = (data.schedules || []).filter((s: any) => s.status === "OPEN" && new Date(s.startDate) > new Date());
          setSchedules(openSchedules);
          if (openSchedules.length > 0) setSelectedScheduleId(openSchedules[0].id);
        } else {
          setError("Trek could not be loaded");
        }
      } catch {
        setError("Failed to fetch trek details");
      } finally {
        setLoadingTrek(false);
      }
    }
    if (trekId) loadTrek();
  }, [trekId]);

  if (authLoading || loadingTrek) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-500">Preparing your trek booking...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4">
        <Users className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Login Required</h2>
        <Link href="/login" className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  if (!trek) {
    return <div className="max-w-md mx-auto my-16 p-8 text-center text-rose-600 text-sm">{error || "Trek not found"}</div>;
  }

  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);
  const availableSlots = selectedSchedule ? selectedSchedule.capacity - selectedSchedule.bookedParticipants : 0;
  const duration = selectedSchedule?.duration || trek.availableDurations?.[0] || 1;
  const totalAmount = trek.basePricePerDay * duration * participants;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedScheduleId) {
      setError("Please select a schedule date");
      return;
    }

    if (participants > availableSlots) {
      setError(`Only ${availableSlots} slot(s) remain for this date`);
      return;
    }

    setProcessing(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trekId: trek.id,
          scheduleId: selectedScheduleId,
          participants,
          duration,
          participantDetails: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Booking failed");
        setProcessing(false);
        return;
      }

      router.push(`/bookings/confirmation/${data.booking.id}`);
    } catch {
      setError("Payment simulation failed");
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link href={`/treks/${trek.slug || trek.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600">
        <ArrowLeft className="w-4 h-4" />
        Back to Trek Details
      </Link>

      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Complete Your Reservation</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Book: {trek.name}
        </h1>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {schedules.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">1. Select Date</h3>
              <div className="space-y-2">
                {schedules.map((s) => {
                  const slots = s.capacity - s.bookedParticipants;
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        selectedScheduleId === s.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="schedule"
                          value={s.id}
                          checked={selectedScheduleId === s.id}
                          onChange={() => { setSelectedScheduleId(s.id); setParticipants(Math.min(participants, slots)); }}
                          className="accent-emerald-600"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {new Date(s.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {" – "}
                            {new Date(s.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-[10px] text-slate-500">{s.duration} day(s) · ₹{trek.basePricePerDay * s.duration}/person</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold ${slots > 5 ? "text-emerald-600" : slots > 0 ? "text-amber-600" : "text-rose-600"}`}>
                        {slots} slots left
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-center space-y-2">
              <p className="text-sm font-medium text-slate-700">No open schedules available</p>
              <p className="text-xs text-slate-500">Check back later or contact us for custom dates.</p>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">2. Number of Participants</h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Participants</span>
                <span className="text-[11px] text-slate-500">{availableSlots} slots available for selected date</span>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setParticipants(Math.max(1, participants - 1))} disabled={participants <= 1} className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-30">-</button>
                <span className="text-sm font-bold w-6 text-center">{participants}</span>
                <button type="button" onClick={() => setParticipants(Math.min(availableSlots, participants + 1))} disabled={participants >= availableSlots} className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-30">+</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">3. Payment Mode (Simulated)</h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">Sandbox</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["UPI / QR", "Credit/Debit Card", "Net Banking"].map((method) => (
                <button type="button" key={method} onClick={() => setPaymentMethod(method)} className={`p-3 rounded-2xl border text-xs font-semibold text-center transition ${paymentMethod === method ? "border-emerald-600 bg-emerald-50/50 text-emerald-800" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}>
                  <CreditCard className="w-4 h-4 mx-auto mb-1.5 text-slate-500" />
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Price Breakdown</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>₹{trek.basePricePerDay} × {duration} day(s) × {participants}</span>
                <span className="font-semibold text-slate-800">₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Guide & Permit Fees</span>
                <span className="text-emerald-600 font-medium">Included</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Payable</span>
                <span className="text-xl font-extrabold text-emerald-700">₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button type="submit" disabled={processing || availableSlots <= 0 || !selectedScheduleId} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
              {processing ? "Processing..." : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Pay ₹{totalAmount.toLocaleString("en-IN")}
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Full refund on cancellation before trek date
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
