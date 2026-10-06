"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Search,
  ArrowLeft,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [newGuideData, setNewGuideData] = useState({
    name: "",
    email: "",
    password: "guide123",
    role: "GUIDE",
    phone: "",
    bio: "",
    emergencyContact: "",
  });

  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchUsers();
    }
  }, [user]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });

      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        alert("Failed to update role");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleCreateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFeedback({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGuideData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Failed to create user" });
      } else {
        setFeedback({ type: "success", text: "New guide added successfully!" });
        await fetchUsers();
        setTimeout(() => setModalOpen(false), 1200);
      }
    } catch {
      setFeedback({ type: "error", text: "Network error occurred" });
    } finally {
      setCreating(false);
    }
  };

  if (authLoading) return <div className="p-10 text-center text-sm">Loading...</div>;
  if (!user || user.role !== "ADMIN") {
    return <div className="p-10 text-center text-sm text-rose-600">Access Denied</div>;
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Users & Mountain Guides
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage user accounts, assign roles, and onboard certified trek guides.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedback({ type: "", text: "" });
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Certified Guide
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name or email..."
          className="w-full text-xs text-slate-800 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">
          Loading accounts...
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Bookings</th>
                  <th className="py-3 px-4">Assigned Treks</th>
                  <th className="py-3 px-4">Role Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : u.role === "GUIDE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {u.phone || <span className="text-slate-400">None</span>}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {u._count?.bookings || 0}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">
                      {u._count?.guidedTreks || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs bg-white text-slate-700"
                      >
                        <option value="USER">USER</option>
                        <option value="GUIDE">GUIDE</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Guide Onboarding
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Register New Mountain Guide
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
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateGuide} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newGuideData.name}
                  onChange={(e) => setNewGuideData({ ...newGuideData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newGuideData.email}
                  onChange={(e) => setNewGuideData({ ...newGuideData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={newGuideData.password}
                  onChange={(e) => setNewGuideData({ ...newGuideData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newGuideData.phone}
                    onChange={(e) => setNewGuideData({ ...newGuideData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency No
                  </label>
                  <input
                    type="tel"
                    value={newGuideData.emergencyContact}
                    onChange={(e) => setNewGuideData({ ...newGuideData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Experience / Bio
                </label>
                <textarea
                  rows={2}
                  value={newGuideData.bio}
                  onChange={(e) => setNewGuideData({ ...newGuideData, bio: e.target.value })}
                  placeholder="Mountaineering certifications, trails led..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {creating ? "Adding..." : "Add Guide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
