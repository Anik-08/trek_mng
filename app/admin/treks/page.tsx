"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  X,
  CheckCircle2,
  ArrowLeft,
  CalendarDays,
  Users,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function AdminTreksPage() {
  const { user, loading: authLoading } = useAuth();
  const [treks, setTreks] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrek, setEditingTrek] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    state: "Karnataka",
    description: "",
    distance: 12,
    difficulty: "MODERATE",
    basePricePerDay: 1500,
    availableDurations: [1, 2],
    maxParticipants: 25,
    meetingPoint: "",
    destination: "",
    elevation: 1500,
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
    guideId: "",
    startLat: 13.22,
    startLng: 75.25,
    destLat: 13.12,
    destLng: 75.27,
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const [schedulesTrek, setSchedulesTrek] = useState<any | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesSaving, setSchedulesSaving] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState({ type: "", text: "" });
  const [scheduleForm, setScheduleForm] = useState({
    startDate: "",
    duration: 1,
    capacity: 20,
    guideId: "",
  });
  const [updatingScheduleId, setUpdatingScheduleId] = useState("");

  const fetchTreksAndGuides = async () => {
    setLoading(true);
    try {
      const [treksRes, guidesRes] = await Promise.all([
        fetch("/api/treks"),
        fetch("/api/admin/guides"),
      ]);

      if (treksRes.ok) {
        const data = await treksRes.json();
        setTreks(data.treks || []);
      }
      if (guidesRes.ok) {
        const data = await guidesRes.json();
        setGuides(data.guides || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchTreksAndGuides();
    }
  }, [user]);

  const handleOpenCreateModal = () => {
    setEditingTrek(null);
    setFormData({
      name: "",
      location: "",
      state: "Karnataka",
      description: "",
      distance: 12,
      difficulty: "MODERATE",
      basePricePerDay: 1500,
      availableDurations: [1, 2],
      maxParticipants: 25,
      meetingPoint: "Base Checkpost",
      destination: "Mountain Summit",
      elevation: 1500,
      imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
      guideId: guides.length > 0 ? guides[0].id : "",
      startLat: 13.22,
      startLng: 75.25,
      destLat: 13.12,
      destLng: 75.27,
    });
    setFeedback({ type: "", text: "" });
    setModalOpen(true);
  };

  const handleOpenEditModal = (trek: any) => {
    setEditingTrek(trek);
    setFormData({
      name: trek.name,
      location: trek.location,
      state: trek.state,
      description: trek.description,
      distance: trek.distance,
      difficulty: trek.difficulty,
      basePricePerDay: trek.basePricePerDay || 1500,
      availableDurations: trek.availableDurations || [1, 2],
      maxParticipants: trek.maxParticipants || 25,
      meetingPoint: trek.meetingPoint || "",
      destination: trek.destination || "",
      elevation: trek.elevation || 1500,
      imageUrl: trek.imageUrl,
      guideId: trek.guideId || "",
      startLat: trek.startLat || 13.22,
      startLng: trek.startLng || 75.25,
      destLat: trek.destLat || 13.12,
      destLng: trek.destLng || 75.27,
    });
    setFeedback({ type: "", text: "" });
    setModalOpen(true);
  };

  const handleDeleteTrek = async (trekId: string) => {
    if (!confirm("Are you sure you want to delete this trek? This will remove all associated bookings.")) {
      return;
    }

    try {
      const res = await fetch(`/api/treks/${trekId}`, { method: "DELETE" });
      if (res.ok) {
        setTreks((prev) => prev.filter((t) => t.id !== trekId));
      } else {
        alert("Failed to delete trek");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleOpenSchedulesModal = async (trek: any) => {
    setSchedulesTrek(trek);
    setScheduleFeedback({ type: "", text: "" });
    setScheduleForm({
      startDate: "",
      duration: 1,
      capacity: trek.maxParticipants || 20,
      guideId: trek.guideId || "",
    });
    await fetchSchedules(trek.id);
  };

  const fetchSchedules = async (trekId: string) => {
    setSchedulesLoading(true);
    try {
      const res = await fetch(`/api/admin/schedules?trekId=${trekId}`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules || []);
      } else {
        setScheduleFeedback({ type: "error", text: "Failed to load departures." });
      }
    } catch {
      setScheduleFeedback({ type: "error", text: "Network error while loading departures." });
    } finally {
      setSchedulesLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulesTrek) return;

    const isoToday = new Date().toISOString().slice(0, 10);
    if (!scheduleForm.startDate || scheduleForm.startDate < isoToday) {
      setScheduleFeedback({
        type: "error",
        text: "Please pick a start date that is today or in the future.",
      });
      return;
    }

    const start = new Date(`${scheduleForm.startDate}T00:00:00`);
    const duration = Math.max(1, Number(scheduleForm.duration) || 1);
    const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);

    setSchedulesSaving(true);
    setScheduleFeedback({ type: "", text: "" });
    try {
      const res = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trekId: schedulesTrek.id,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          duration,
          capacity: Number(scheduleForm.capacity),
          guideId: scheduleForm.guideId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScheduleFeedback({ type: "error", text: data.error || "Failed to create departure" });
        return;
      }

      setScheduleFeedback({ type: "success", text: "Departure created and guide assigned!" });
      setScheduleForm((prev) => ({ ...prev, startDate: "" }));
      await fetchSchedules(schedulesTrek.id);
    } catch {
      setScheduleFeedback({ type: "error", text: "Network error occurred" });
    } finally {
      setSchedulesSaving(false);
    }
  };

  const handleScheduleGuideChange = async (scheduleId: string, guideId: string) => {
    setUpdatingScheduleId(scheduleId);
    setScheduleFeedback({ type: "", text: "" });
    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guideId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScheduleFeedback({ type: "error", text: data.error || "Failed to update guide" });
        return;
      }

      setScheduleFeedback({ type: "success", text: "Guide assignment updated." });
      await fetchSchedules(schedulesTrek!.id);
    } catch {
      setScheduleFeedback({ type: "error", text: "Network error occurred" });
    } finally {
      setUpdatingScheduleId("");
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Delete this departure? Only departures without bookings can be removed.")) {
      return;
    }

    setScheduleFeedback({ type: "", text: "" });
    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setScheduleFeedback({ type: "error", text: data.error || "Failed to delete departure" });
        return;
      }
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      setScheduleFeedback({ type: "success", text: "Departure deleted." });
    } catch {
      setScheduleFeedback({ type: "error", text: "Network error occurred" });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: "", text: "" });

    try {
      const url = editingTrek ? `/api/treks/${editingTrek.id}` : "/api/treks";
      const method = editingTrek ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Operation failed" });
      } else {
        setFeedback({
          type: "success",
          text: editingTrek ? "Trek updated successfully!" : "New trek created!",
        });
        await fetchTreksAndGuides();
        setTimeout(() => setModalOpen(false), 1200);
      }
    } catch {
      setFeedback({ type: "error", text: "Network error occurred" });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="p-10 text-center text-sm">Loading...</div>;
  if (!user || user.role !== "ADMIN") {
    return <div className="p-10 text-center text-sm text-rose-600">Access Denied</div>;
  }

  const filteredTreks = treks.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Expeditions & Treks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create trails, manage slots, adjust pricing, and assign certified guides.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Trek
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter treks by name or region..."
          className="w-full text-xs text-slate-800 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">
          Loading treks list...
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                  <th className="py-3 px-4">Trek Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Base Price / Day</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Assigned Guide</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTreks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <Link
                        href={`/treks/${t.slug || t.id}`}
                        className="hover:text-emerald-600 transition"
                      >
                        {t.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {t.location}, {t.state}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={t.difficulty} type="difficulty" />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      ₹{t.basePricePerDay}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {t.maxParticipants}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {t.guide ? t.guide.name : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenSchedulesModal(t)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                        title="Manage Departures & Assign Guide"
                      >
                        <CalendarDays className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(t)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                        title="Edit Trek"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTrek(t.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Trek"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl w-full my-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                {editingTrek ? "Edit Expedition" : "New Expedition"}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {editingTrek ? `Edit: ${editingTrek.name}` : "Create New Trek Trail"}
              </h3>
            </div>

            {feedback.text && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === "error"
                    ? "bg-rose-50 border border-rose-200 text-rose-700"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                }`}
              >
                {feedback.type === "error" ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trek Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location / Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MODERATE">MODERATE</option>
                    <option value="DIFFICULT">DIFFICULT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price / Day (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.basePricePerDay}
                    onChange={(e) => setFormData({ ...formData, basePricePerDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Starting Point</label>
                  <input
                    type="text"
                    value={formData.meetingPoint}
                    onChange={(e) => setFormData({ ...formData, meetingPoint: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Summit Destination</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Elevation (m)</label>
                  <input
                    type="number"
                    value={formData.elevation}
                    onChange={(e) => setFormData({ ...formData, elevation: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Guide</label>
                  <select
                    value={formData.guideId}
                    onChange={(e) => setFormData({ ...formData, guideId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="">-- No Guide Assigned --</option>
                    {guides.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingTrek ? "Update Trek" : "Create Trek"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    {schedulesTrek && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-3xl w-full my-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSchedulesTrek(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Departures & Guide Assignments
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {schedulesTrek.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                A guide can lead only one trek on any given day. Conflicting dates are rejected automatically.
              </p>
            </div>

            {scheduleFeedback.text && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  scheduleFeedback.type === "error"
                    ? "bg-rose-50 border border-rose-200 text-rose-700"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                }`}
              >
                {scheduleFeedback.type === "error" ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <span>{scheduleFeedback.text}</span>
              </div>
            )}

            <form
              onSubmit={handleCreateSchedule}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={scheduleForm.startDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={scheduleForm.duration}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, duration: Number(e.target.value) })}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  value={scheduleForm.capacity}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, capacity: Number(e.target.value) })}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Assign Guide
                </label>
                <select
                  value={scheduleForm.guideId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, guideId: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="">Trek Leading Guide</option>
                  {guides.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={schedulesSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  {schedulesSaving ? "Adding..." : "Add Departure"}
                </button>
              </div>
            </form>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                Existing Departures
              </h4>

              {schedulesLoading ? (
                <p className="text-xs text-slate-500 py-4 text-center">Loading departures...</p>
              ) : schedules.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  No departures yet. Add the first one above.
                </p>
              ) : (
                schedules.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs">
                        <span className="font-bold text-slate-900">
                          {new Date(s.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {" - "}
                          {new Date(s.endDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-slate-400 ml-2">({s.duration} day(s))</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {s.bookedParticipants} / {s.capacity}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.status === "FULL"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : s.status === "COMPLETED"
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {s.status}
                        </span>
                        <button
                          onClick={() => handleDeleteSchedule(s.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Departure"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-400 text-[11px] w-24 shrink-0">
                        Lead Guide
                      </span>
                      <select
                        value={s.guideId || ""}
                        onChange={(e) => handleScheduleGuideChange(s.id, e.target.value)}
                        disabled={updatingScheduleId === s.id || s.status === "COMPLETED"}
                        className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white disabled:opacity-50"
                      >
                        <option value="">-- No Guide Assigned --</option>
                        {guides.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                      {updatingScheduleId === s.id && (
                        <span className="text-[11px] text-emerald-600 animate-pulse">
                          Saving...
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
