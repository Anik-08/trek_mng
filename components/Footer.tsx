import React from "react";
import Link from "next/link";
import { Compass, Heart, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                Trek<span className="text-emerald-400">Sync</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete full-stack trek expedition and mountain trail management system. Plan, book, and explore trails safely with certified guides.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Explore</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/treks" className="hover:text-emerald-400 transition">
                  All Treks
                </Link>
              </li>
              <li>
                <Link href="/treks?difficulty=EASY" className="hover:text-emerald-400 transition">
                  Beginner Friendly Trails
                </Link>
              </li>
              <li>
                <Link href="/treks?difficulty=DIFFICULT" className="hover:text-emerald-400 transition">
                  Challenging Expeditions
                </Link>
              </li>
              <li>
                <Link href="/treks?state=Karnataka" className="hover:text-emerald-400 transition">
                  Western Ghats Treks
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Roles & Access</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition">
                  Trekkers Login
                </Link>
              </li>
              <li>
                <Link href="/guide" className="hover:text-emerald-400 transition">
                  Guide Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Safety & Verification</h4>
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <p>
                Strict capacity management, certified lead guides, emergency contact tracking, and simulated instant refunds on cancellations.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TrekSync Management System. Built with Next.js, TypeScript, Tailwind CSS, PostgreSQL & Prisma.</p>
        </div>
      </div>
    </footer>
  );
}
