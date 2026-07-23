"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  KeyRound,
  Zap,
  RotateCcw,
  Trophy,
  LogOut,
  ShieldCheck,
  Gamepad2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GameId, GAMES } from "@/lib/dataService";

// Import Admin Tabs
import LicenseManagementTab from "@/components/admin/LicenseManagementTab";
import ActivationCodeTab from "@/components/admin/ActivationCodeTab";
import DeviceResetTab from "@/components/admin/DeviceResetTab";
import LeaderboardTab from "@/components/admin/LeaderboardTab";

type AdminTab = "licenses" | "activation-codes" | "device-reset" | "leaderboard";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("licenses");
  const [selectedGame, setSelectedGame] = useState<GameId>("mole");
  const router = useRouter();

  const handleLogout = () => {
    document.cookie =
      "mjs_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
    localStorage.removeItem("mjs_admin_session");
    router.replace("/login");
  };

  const navTabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    {
      id: "licenses",
      label: "Manajemen Lisensi",
      icon: KeyRound
    },
    {
      id: "activation-codes",
      label: "Kode Aktivasi",
      icon: Zap
    },
    {
      id: "device-reset",
      label: "Reset Hardware",
      icon: RotateCcw
    },
    {
      id: "leaderboard",
      label: "Leaderboard & Skor",
      icon: Trophy
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-600 selection:text-white pb-16 overflow-x-hidden">
      {/* BACKGROUND GLOW ACCENTS */}
      <div className="fixed top-[-10%] right-[-10%] w-[650px] h-[650px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 w-full py-4 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ rotate: 6 }}
              className="w-10 h-10 flex-shrink-0 relative overflow-hidden rounded-lg border border-indigo-500/30 p-1 bg-slate-900 shadow-lg shadow-indigo-600/20"
            >
              <Image
                src="/mjs_logo.png"
                alt="MJS Logo"
                fill
                className="object-cover"
              />
            </motion.div>

            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                MJS Admin Dashboard
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" /> Licensing & Management
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Supabase Postgres Multi-Game Platform
              </p>
            </div>
          </div>

          {/* Right Header Controls (Select Game Dropdown) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 shadow-md">
              <Gamepad2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value as GameId)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
              >
                {GAMES.map((g) => (
                  <option key={g.id} value={g.id} className="bg-slate-900 text-white font-semibold">
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-300 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 z-10 space-y-6">
        {/* TABS NAVIGATION BAR */}
        <div className="glass-panel p-2 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-xl">
          <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? "text-white shadow-lg shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ACTIVE TAB CONTENT */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "licenses" && <LicenseManagementTab selectedGame={selectedGame} />}
            {activeTab === "activation-codes" && <ActivationCodeTab selectedGame={selectedGame} />}
            {activeTab === "device-reset" && <DeviceResetTab selectedGame={selectedGame} />}
            {activeTab === "leaderboard" && <LeaderboardTab selectedGame={selectedGame} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
