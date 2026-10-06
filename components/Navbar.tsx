"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import NotificationBell from "./NotificationBell";
import {
  Compass,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  MapPin,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                Trek<span className="text-emerald-600">Sync</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link
                href="/treks"
                className="text-slate-600 hover:text-emerald-600 transition"
              >
                Browse Treks
              </Link>
              <Link
                href="/recommendations"
                className="text-slate-600 hover:text-purple-600 transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Smart Recommendations
              </Link>
              <Link
                href="/ai-monitor"
                className="text-slate-600 hover:text-amber-600 transition flex items-center gap-1 font-semibold"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                AI Demo Monitor
              </Link>
              {user && (
                <Link
                  href="/my-bookings"
                  className="text-slate-600 hover:text-emerald-600 transition"
                >
                  My Bookings
                </Link>
              )}
              {user && (
                <Link
                  href={user.role === "GUIDE" || user.role === "ADMIN" ? "/guide/guardian" : "/guardian/join"}
                  className="text-slate-600 hover:text-emerald-600 transition flex items-center gap-1.5"
                >
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Trek Guardian
                </Link>
              )}
              {user && (user.role === "GUIDE" || user.role === "ADMIN") && (
                <Link
                  href="/guide"
                  className="text-slate-600 hover:text-emerald-600 transition flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Guide Portal
                </Link>
              )}
              {user && user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="text-slate-600 hover:text-emerald-600 transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    <NotificationBell />
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      {user.name.split(" ")[0]}
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] uppercase font-bold">
                        {user.role}
                      </span>
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="text-xs font-medium text-slate-500 hover:text-rose-600 p-2 rounded-lg hover:bg-slate-100 transition"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/login"
                      className="text-sm font-medium text-slate-700 hover:text-emerald-600 px-3 py-2 transition"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      className="text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition shadow-sm"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/treks"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 py-1.5"
          >
            Browse Treks
          </Link>
          <Link
            href="/recommendations"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-purple-700 py-1.5 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            Smart Recommendations
          </Link>
          <Link
            href="/ai-monitor"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-amber-700 py-1.5 flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            AI Demo Monitor
          </Link>
          {user && (
            <>
              <Link
                href="/my-bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 py-1.5"
              >
                My Bookings
              </Link>
              <Link
                href={user.role === "GUIDE" || user.role === "ADMIN" ? "/guide/guardian" : "/guardian/join"}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 py-1.5 flex items-center gap-1.5"
              >
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                Trek Guardian
              </Link>
              {(user.role === "GUIDE" || user.role === "ADMIN") && (
                <Link
                  href="/guide"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-medium text-slate-700 py-1.5"
                >
                  Guide Portal
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-medium text-slate-700 py-1.5"
                >
                  Admin Panel
                </Link>
              )}
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 py-1.5"
              >
                Profile ({user.name})
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left text-sm font-medium text-rose-600 py-1.5"
              >
                Log out
              </button>
            </>
          )}
          {!user && !loading && (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-sm font-medium border border-slate-300 py-2 rounded-lg"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-sm font-medium text-white bg-emerald-600 py-2 rounded-lg"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
