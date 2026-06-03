"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Calendar,
  Gamepad2,
  Download,
  LogOut,
  Search,
  RefreshCw,
  Crown,
  Database,
  Smartphone,
  Monitor,
  Flame,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  fetchLeaderboardData,
  formatToWIB,
  WEEK_RANGES,
  WeekKey,
  LeaderboardEntry,
} from "@/lib/dataService";
import { motion } from "framer-motion";

// Game options definition
const GAMES = [
  {
    id: "catch-standard",
    name: "Catch Game (Standard)",
    icon: Monitor,
    dbName: "Catch Database",
  },
  {
    id: "catch-touch",
    name: "Catch Game (Touch)",
    icon: Smartphone,
    dbName: "Catch Database",
  },
  {
    id: "memory",
    name: "Memory Card",
    icon: Trophy,
    dbName: "Memory Card Database",
  },
  {
    id: "scream",
    name: "Scream Challenge",
    icon: Flame,
    dbName: "Scream Database",
  },
  {
    id: "mole",
    name: "Whac-A-Mole",
    icon: Gamepad2,
    dbName: "Whac-A-Mole Database",
  },
] as const;

type GameId = (typeof GAMES)[number]["id"];

export default function DashboardPage() {
  const [selectedGame, setSelectedGame] = useState<GameId>("catch-standard");
  const [selectedWeek, setSelectedWeek] = useState<WeekKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTable, setActiveTable] = useState("None");
  const [dbError, setDbError] = useState<string | null>(null);

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  // Load data dari Supabase
  const loadData = async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const response = await fetchLeaderboardData(selectedGame, selectedWeek);
      setData(response.data);
      setActiveTable(response.activeTable);
      if (response.error) {
        setDbError(response.error);
      }
    } catch (err: any) {
      console.error(err);
      setDbError(
        err?.message || "Terjadi kesalahan tidak terduga saat memuat data.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger loadData setiap kali game atau week berubah
  useEffect(() => {
    loadData();
  }, [selectedGame, selectedWeek]);

  // Reset ke halaman 1 saat game, week, atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGame, selectedWeek, searchQuery]);

  const handleLogout = () => {
    document.cookie =
      "mjs_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
    localStorage.removeItem("mjs_admin_session");
    router.replace("/login");
  };

  const filteredData = data.filter((entry) => {
    const q = searchQuery.toLowerCase();
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.handphone.toLowerCase().includes(q)
    );
  });
  const podiumWinners = filteredData.slice(0, 3);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTableData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const formatDuration = (ms?: number) => {
    if (typeof ms === "undefined") return "-";
    const seconds = ms / 1000;
    return `${seconds.toFixed(2)} detik`;
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    const gameLabel =
      GAMES.find((g) => g.id === selectedGame)
        ?.name.replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase() || selectedGame;
    const fileName = `leaderboard-${gameLabel}-${selectedWeek}.csv`;

    let csvHeaders = [
      "Peringkat",
      "Nama Pemain",
      "Nomor WhatsApp",
      "Waktu Bermain (WIB)",
    ];

    if (selectedGame === "memory") {
      csvHeaders.push(
        "Durasi (ms)",
        "Durasi (detik)",
        "Jumlah Langkah (Moves)",
        "Level Terakhir (Stage)",
      );
    } else {
      csvHeaders.push("Skor");
    }

    const csvRows = filteredData.map((row, idx) => {
      const baseRow = [
        idx + 1,
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.handphone}"`,
        `"${formatToWIB(row.created_at)}"`,
      ];

      if (selectedGame === "memory") {
        baseRow.push(
          row.time_ms ?? "",
          row.time_ms ? (row.time_ms / 1000).toFixed(2) : "",
          row.moves ?? "",
          row.stage ?? "",
        );
      } else {
        baseRow.push(row.score ?? "");
      }

      return baseRow.join(",");
    });

    const csvContent = "\uFEFF" + [csvHeaders.join(","), ...csvRows].join("\n"); // Ditambahkan BOM agar Excel dapat mendeteksi UTF-8
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeGameInfo = GAMES.find((g) => g.id === selectedGame);
  const activeGameIcon = activeGameInfo
    ? React.createElement(activeGameInfo.icon, {
        className: "w-6 h-6 text-[#AB7FEB]",
      })
    : null;

  return (
    <div className="relative min-h-screen w-full bg-[#050505] overflow-y-auto pb-12 font-sans selection:bg-[#540EE1] selection:text-white">
      {/* Background Glows */}
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#540EE1] rounded-full blur-[160px] opacity-[0.15] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#AB7FEB] rounded-full blur-[140px] opacity-[0.1] pointer-events-none z-0" />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full py-4 px-4">
        <div className="flex items-center justify-between px-5 py-2.5 max-w-6xl mx-auto bg-white/[0.04] border border-white/[0.08] rounded-full backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ rotate: 8 }}
              transition={{ duration: 0.3 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#540EE1] to-[#AB7FEB] flex items-center justify-center border border-white/10 shadow-lg shadow-[#540EE1]/20 flex-shrink-0"
            >
              <Trophy className="w-4.5 h-4.5 text-white" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-[15px] font-bold tracking-tight text-white/90 flex items-center gap-2">
                MJS Leaderboard
                <span className="text-[10px] bg-[#540EE1]/30 border border-[#AB7FEB]/25 px-2.5 py-0.5 rounded-full text-[#AB7FEB] font-semibold tracking-widest uppercase">
                  Admin
                </span>
              </h1>
              <p className="text-[11px] text-gray-600 font-medium">
                Dashboard Konsolidasi Data Game
              </p>
            </motion.div>
          </div>

          {/* Right: DB indicator + Logout */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.07] text-xs text-gray-500"
            >
              <Database className="w-3.5 h-3.5 text-[#AB7FEB]" />
              <span>Table:</span>
              <code className="text-[#AB7FEB] font-mono text-[11px]">
                {activeTable}
              </code>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.07] hover:border-red-500/25 text-gray-500 hover:text-red-400 text-[11px] font-semibold uppercase tracking-widest transition-colors duration-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Space */}
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 z-10 space-y-8">
        {/* Supabase Error Alert Banner */}
        {dbError && (
          <div className="glass-panel border-red-500/20 bg-red-950/20 p-5 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-red-200">
                  Koneksi Database Gagal
                </h4>
                <p className="text-xs text-red-400/90 mt-1 leading-relaxed">
                  {dbError}. Harap verifikasi apakah file{" "}
                  <code className="bg-black/50 px-1 py-0.5 rounded text-white text-[11px]">
                    .env.local
                  </code>{" "}
                  telah diisi dengan URL & Anon Key yang valid dan tabel
                  Supabase Anda telah dibuat.
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/35 border border-red-500/20 hover:border-red-500/40 text-red-200 text-xs font-semibold transition-all duration-300 whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
            </button>
          </div>
        )}

        {/* Toolbar Filter / Search */}
        <section className="glass-panel rounded-3xl p-6 flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
          {/* Filters Selectors */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Game Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-[#AB7FEB] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5" /> Pilih Game Desktop
              </label>
              <div className="relative">
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value as GameId)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#540EE1] transition-all cursor-pointer appearance-none"
                >
                  {GAMES.map((game) => (
                    <option
                      key={game.id}
                      value={game.id}
                      className="bg-[#0c0c0c] text-white"
                    >
                      {game.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Week Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-[#AB7FEB] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Filter Rentang Minggu (WIB)
              </label>
              <div className="relative">
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value as WeekKey)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#540EE1] transition-all cursor-pointer appearance-none"
                >
                  {Object.entries(WEEK_RANGES).map(([key, value]) => (
                    <option
                      key={key}
                      value={key}
                      className="bg-[#0c0c0c] text-white"
                    >
                      {value.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch xl:items-end">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> Cari Pemain
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nama / WhatsApp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#540EE1] transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={isLoading || filteredData.length === 0}
              className="flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 font-bold px-6 py-3.5 rounded-2xl transition-all duration-300 shadow-md text-sm whitespace-nowrap cursor-pointer hover:shadow-white/10"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>

            {/* Reload Button */}
            <button
              onClick={loadData}
              disabled={isLoading}
              title="Refresh Data"
              className="flex items-center justify-center w-[48px] h-[48px] bg-white/[0.03] hover:bg-white/[0.08] disabled:bg-transparent border border-white/10 hover:border-white/20 rounded-2xl text-gray-300 hover:text-white transition-all cursor-pointer shrink-0"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </section>

        {isLoading ? (
          /* Loading Skeleton */
          <div className="w-full py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#540EE1]/20 border-t-[#AB7FEB] rounded-full animate-spin" />
            <p className="text-sm font-semibold text-[#AB7FEB]/80 animate-pulse">
              Menghubungi Supabase & menarik data...
            </p>
          </div>
        ) : filteredData.length === 0 ? (
          /* Empty State */
          <div className="glass-panel rounded-3xl p-16 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-2">
              <HelpCircle className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Tidak Ada Data Leaderboard
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Tidak ditemukan data bermain untuk game{" "}
              <strong className="text-[#AB7FEB]">{activeGameInfo?.name}</strong>{" "}
              pada periode{" "}
              <strong className="text-[#AB7FEB]">
                {WEEK_RANGES[selectedWeek].label}
              </strong>
              . Silakan periksa kembali rentang minggu terpilih atau database
              Supabase Anda.
            </p>
          </div>
        ) : (
          <>
            {/* podium 3 besar (Hanya muncul jika ada minimal 1 data) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6 max-w-4xl mx-auto">
              {/* PODIUM 2 (Left) */}
              {podiumWinners[1] ? (
                <div className="flex flex-col items-center order-2 md:order-1 mt-6">
                  {/* Winner Card */}
                  <div className="text-center mb-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-400/20 to-gray-200/20 border-2 border-gray-400 flex items-center justify-center mx-auto shadow-lg relative">
                      <span className="text-lg font-bold text-gray-300">2</span>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-400 text-black px-1.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider">
                        SILVER
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-3 truncate max-w-[150px] mx-auto">
                      {podiumWinners[1].name}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {podiumWinners[1].handphone}
                    </p>
                    <p className="text-xs font-black text-[#AB7FEB] mt-1">
                      {selectedGame === "memory"
                        ? formatDuration(podiumWinners[1].time_ms)
                        : `${podiumWinners[1].score} Pts`}
                    </p>
                  </div>
                  {/* Podium Base */}
                  <div className="w-full h-24 bg-gradient-to-b from-gray-800/40 to-gray-900/60 border border-gray-700/30 rounded-t-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-4xl font-extrabold text-gray-700">
                      2nd
                    </span>
                  </div>
                </div>
              ) : (
                <div className="hidden md:block order-2 md:order-1" />
              )}

              {/* PODIUM 1 (Center) */}
              {podiumWinners[0] && (
                <div className="flex flex-col items-center order-1 md:order-2">
                  <Crown className="w-8 h-8 text-yellow-400 animate-bounce mb-1" />
                  {/* Winner Card */}
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400/20 to-amber-500/20 border-3 border-yellow-400 flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/10 relative">
                      <span className="text-2xl font-black text-yellow-400">
                        1
                      </span>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider">
                        CHAMP
                      </div>
                    </div>
                    <h4 className="text-base font-extrabold text-white mt-3 truncate max-w-[180px] mx-auto">
                      {podiumWinners[0].name}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {podiumWinners[0].handphone}
                    </p>
                    <p className="text-sm font-black text-yellow-400 mt-1">
                      {selectedGame === "memory"
                        ? formatDuration(podiumWinners[0].time_ms)
                        : `${podiumWinners[0].score} Pts`}
                    </p>
                  </div>
                  {/* Podium Base */}
                  <div className="w-full h-32 bg-gradient-to-b from-[#540EE1]/20 to-[#540EE1]/5 border border-[#540EE1]/30 rounded-t-3xl flex items-center justify-center backdrop-blur-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#540EE1]/10 blur-xl pointer-events-none" />
                    <span className="text-5xl font-black text-[#540EE1]">
                      1st
                    </span>
                  </div>
                </div>
              )}

              {/* PODIUM 3 (Right) */}
              {podiumWinners[2] ? (
                <div className="flex flex-col items-center order-3 mt-8">
                  {/* Winner Card */}
                  <div className="text-center mb-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-800/20 to-amber-600/20 border border-amber-700 flex items-center justify-center mx-auto shadow-lg relative">
                      <span className="text-base font-bold text-amber-500">
                        3
                      </span>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white px-1.5 py-0.5 rounded-full text-[8px] font-extrabold tracking-wider">
                        BRONZE
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-3 truncate max-w-[140px] mx-auto">
                      {podiumWinners[2].name}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {podiumWinners[2].handphone}
                    </p>
                    <p className="text-xs font-black text-[#AB7FEB] mt-1">
                      {selectedGame === "memory"
                        ? formatDuration(podiumWinners[2].time_ms)
                        : `${podiumWinners[2].score} Pts`}
                    </p>
                  </div>
                  {/* Podium Base */}
                  <div className="w-full h-20 bg-gradient-to-b from-amber-950/20 to-black/60 border border-amber-900/25 rounded-t-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-3xl font-extrabold text-amber-700/80">
                      3rd
                    </span>
                  </div>
                </div>
              ) : (
                <div className="hidden md:block order-3" />
              )}
            </section>

            {/* Leaderboard Table Container */}
            <section className="glass-panel rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <h3 className="text-sm font-extrabold tracking-wide uppercase text-white flex items-center gap-2">
                  {activeGameIcon}
                  <span>Daftar Peringkat ({filteredData.length} Pemain)</span>
                </h3>
                <span className="text-xs text-gray-500 font-medium">
                  Diurutkan berdasarkan ketentuan resmi MJS
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-[#AB7FEB] uppercase tracking-wider">
                      <th className="py-4.5 px-6 text-center w-24">
                        Peringkat
                      </th>
                      <th className="py-4.5 px-6">Nama Pemain</th>
                      <th className="py-4.5 px-6">No. WhatsApp</th>
                      {selectedGame === "memory" ? (
                        <>
                          <th className="py-4.5 px-6 text-right">
                            Durasi Main
                          </th>
                          <th className="py-4.5 px-6 text-center">
                            Langkah (Moves)
                          </th>
                          <th className="py-4.5 px-6 text-center">
                            Level (Stage)
                          </th>
                        </>
                      ) : (
                        <th className="py-4.5 px-6 text-right">Nilai Skor</th>
                      )}
                      <th className="py-4.5 px-6 text-center w-64">
                        Waktu Bermain
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm font-medium">
                    {paginatedTableData.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-white/[0.01] transition-colors group"
                      >
                        <td className="py-4.5 px-6 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full">
                            {row.rank === 1 ? (
                              <Crown className="w-5.5 h-5.5 text-yellow-400 filter drop-shadow-[0_2px_8px_rgba(250,204,21,0.4)]" />
                            ) : row.rank === 2 ? (
                              <div className="w-5.5 h-5.5 rounded-full bg-gray-400/20 border border-gray-400 flex items-center justify-center text-xs font-black text-gray-300">
                                2
                              </div>
                            ) : row.rank === 3 ? (
                              <div className="w-5.5 h-5.5 rounded-full bg-amber-800/20 border border-amber-700 flex items-center justify-center text-xs font-black text-amber-500">
                                3
                              </div>
                            ) : (
                              <span className="text-gray-400 font-mono font-bold">
                                {row.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4.5 px-6 font-bold text-white group-hover:text-[#AB7FEB] transition-colors">
                          {row.name}
                        </td>
                        <td className="py-4.5 px-6 text-gray-400 font-mono text-[13px]">
                          {row.handphone}
                        </td>

                        {selectedGame === "memory" ? (
                          <>
                            <td
                              className={`py-4.5 px-6 text-right font-bold ${row.rank && row.rank <= 3 ? "text-yellow-400/90" : "text-white"}`}
                            >
                              {formatDuration(row.time_ms)}
                            </td>
                            <td className="py-4.5 px-6 text-center text-gray-400 font-mono">
                              {row.moves}
                            </td>
                            <td className="py-4.5 px-6 text-center text-gray-400 font-mono">
                              {row.stage}
                            </td>
                          </>
                        ) : (
                          <td
                            className={`py-4.5 px-6 text-right font-bold font-mono ${row.rank && row.rank <= 3 ? "text-yellow-400/90" : "text-white"}`}
                          >
                            {row.score} Pts
                          </td>
                        )}

                        <td className="py-4.5 px-6 text-center text-gray-500 text-xs">
                          {formatToWIB(row.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredData.length > 0 && (
                <div className="px-6 py-4.5 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row gap-4 items-center justify-between">
                  {/* Left: Info items per page & entries count */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 font-semibold">
                    <div className="flex items-center gap-2">
                      <span>Baris per halaman:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#540EE1] cursor-pointer"
                      >
                        {[5, 10, 20, 50, 100].map((size) => (
                          <option
                            key={size}
                            value={size}
                            className="bg-[#0c0c0c] text-white"
                          >
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span>
                      Menampilkan{" "}
                      {Math.min(filteredData.length, startIndex + 1)} -{" "}
                      {Math.min(filteredData.length, startIndex + itemsPerPage)}{" "}
                      dari {filteredData.length} entri
                    </span>
                  </div>

                  {/* Right: Page Selector Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-40 disabled:hover:bg-white/[0.03] border border-white/10 disabled:cursor-not-allowed text-xs font-bold text-gray-300 transition-all cursor-pointer"
                    >
                      Sebelumnya
                    </button>

                    {/* Render Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, index, array) => {
                        const showEllipsisBefore =
                          page > 1 && array[index - 1] !== page - 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="text-gray-600 text-xs px-1">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                                currentPage === page
                                  ? "bg-[#540EE1] text-white shadow-lg shadow-[#540EE1]/20 border border-[#AB7FEB]/30"
                                  : "bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-gray-400 hover:text-white"
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-40 disabled:hover:bg-white/[0.03] border border-white/10 disabled:cursor-not-allowed text-xs font-bold text-gray-300 transition-all cursor-pointer"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
