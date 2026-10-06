"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Calendar, Compass, Star, X, CheckCircle2, AlertCircle, Radio, ArrowRight } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "COMPLETED" | "CANCELLED">("UPCOMING");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedTrekId, setSelectedTrekId] = useState("");
  const [selectedTrekName, setSelectedTrekName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/my");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Cancel this booking? This will initiate a full refund.")) return;
    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
      if (res.ok) {
        fetchBookings();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancellingId(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewError("");
    setReviewMessage("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trekId: selectedTrekId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Failed to submit review");
      } else {
        setReviewMessage("Thank you! Your review has been published.");
        setTimeout(() => setReviewModalOpen(false), 1500);
        fetchBookings();
      }
    } catch {
      setReviewError("Network error occurred");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-500">
        Loading bookings...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <Compass className="w-10 h-10 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Access Your Bookings</h2>
        <p className="text-xs text-slate-500">Sign in to view your upcoming itineraries and past treks.</p>
        <Link href="/login" className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
          Go to Login
        </Link>
      </div>
    );
  }

  const upcomingBookings = bookings.filter((b) => b.bookingStatus === "CONFIRMED");
  const completedBookings = bookings.filter((b) => b.bookingStatus === "COMPLETED");
  const cancelledBookings = bookings.filter((b) => b.bookingStatus === "CANCELLED");

  let currentList = upcomingBookings;
  if (activeTab === "COMPLETED") currentList = completedBookings;
  if (activeTab === "CANCELLED") currentList = cancelledBookings;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Trek History & Reservations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            My Bookings
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/guardian/join"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Join Trek Guardian
          </Link>
          <Link
            href="/treks"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            Book New Trek
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(["UPCOMING", "COMPLETED", "CANCELLED"] as const).map((tab) => {
          const count = tab === "UPCOMING" ? upcomingBookings.length : tab === "COMPLETED" ? completedBookings.length : cancelledBookings.length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === tab ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading your bookings...</div>
      ) : currentList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No {activeTab.toLowerCase()} bookings</h3>
          {activeTab === "UPCOMING" && (
            <Link href="/treks" className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition">
              Browse Treks
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((b) => {
            const canCancel = b.bookingStatus === "CONFIRMED" && new Date(b.startDate) > new Date();
            const hasReview = b.trek.reviews && b.trek.reviews.length > 0;
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{b.trek.name}</h3>
                    <p className="text-xs text-slate-500">{b.trek.location}, {b.trek.state}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={b.bookingStatus} type="booking" />
                    <StatusBadge status={b.paymentStatus} type="payment" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Start</span>
                    <span className="font-medium">{new Date(b.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">End</span>
                    <span className="font-medium">{new Date(b.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Participants</span>
                    <span className="font-medium">{b.participants} person(s)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Paid</span>
                    <span className="font-bold text-slate-800">₹{b.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-mono">#{b.bookingId} · {b.duration} day(s)</span>
                  <div className="flex items-center gap-2">
                    {b.bookingStatus === "CONFIRMED" && (
                      <Link
                        href="/guardian/join"
                        className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 border border-emerald-200"
                      >
                        <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                        Join Live Group
                      </Link>
                    )}
                    {b.bookingStatus === "COMPLETED" && !hasReview && (
                      <button
                        onClick={() => {
                          setSelectedTrekId(b.trek.id);
                          setSelectedTrekName(b.trek.name);
                          setRating(5);
                          setComment("");
                          setReviewMessage("");
                          setReviewError("");
                          setReviewModalOpen(true);
                        }}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 px-3 py-1.5 bg-emerald-50 rounded-lg transition"
                      >
                        <Star className="w-3 h-3" />
                        Write Review
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancellingId === b.id}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-3 py-1.5 bg-rose-50 rounded-lg transition disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                        {cancellingId === b.id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative">
            <button onClick={() => setReviewModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Expedition Feedback</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Review: {selectedTrekName}</h3>
            </div>

            {reviewMessage && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                {reviewMessage}
              </div>
            )}
            {reviewError && (
              <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button type="button" key={starVal} onClick={() => setRating(starVal)} className="p-1">
                      <Star className={`w-7 h-7 ${starVal <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{rating} Star{rating > 1 ? "s" : ""}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Experience *</label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the trail, guide, and summit views?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReviewModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submittingReview} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50">
                  {submittingReview ? "Submitting..." : "Publish Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
