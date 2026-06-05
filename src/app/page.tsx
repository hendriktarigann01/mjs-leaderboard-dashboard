"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
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
  Trophy,
} from "lucide-react";
import {
  fetchLeaderboardData,
  formatToWIB,
  WEEK_RANGES,
  WeekKey,
  LeaderboardEntry,
} from "@/lib/dataService";
import { motion } from "framer-motion";

const GAMES = [
  {
    id: "catch-standard",
    name: "Catch Game (Sensor & Touch)",
    icon: Monitor,
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
    name: "Whac a Mole",
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const router = useRouter();

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
        err?.message || "An unexpected error occurred while loading data.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedGame, selectedWeek]);

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
    return `${seconds.toFixed(2)} seconds`;
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data available to export!");
      return;
    }

    const gameLabel =
      GAMES.find((g) => g.id === selectedGame)
        ?.name.replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase() || selectedGame;
    const fileName = `leaderboard-${gameLabel}-${selectedWeek}.csv`;

    let csvHeaders = [
      "Rank",
      "Player Name",
      "WhatsApp Number",
      "Play Time (WIB)",
    ];

    if (selectedGame === "memory") {
      csvHeaders.push(
        "Duration (ms)",
        "Duration (seconds)",
        "Total Moves",
        "Last Stage (Level)",
      );
    } else {
      csvHeaders.push("Score");
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

    const csvContent = "\uFEFF" + [csvHeaders.join(","), ...csvRows].join("\n");
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
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#540EE1] rounded-full blur-[160px] opacity-[0.15] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#AB7FEB] rounded-full blur-[140px] opacity-[0.1] pointer-events-none z-0" />

      <header className="sticky top-0 z-40 w-full py-4 px-4">
        <div className="flex items-center justify-between px-5 py-2.5 max-w-6xl mx-auto bg-white/[0.04] border border-white/[0.08] rounded-md backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ rotate: 8 }}
              transition={{ duration: 0.3 }}
              className="w-9 h-9 flex-shrink-0 overflow-hidden relative"
            >
              <Image
                src="/mjs_logo.png"
                alt="MJS Logo"
                fill
                className="object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-[15px] font-bold tracking-tight text-white/90 flex items-center gap-2">
                MJS Leaderboard
              </h1>
              <p className="text-[11px] text-gray-600 font-medium">
                Game Data Consolidation Dashboard
              </p>
            </motion.div>
          </div>

          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-sm bg-white/[0.03] border border-white/[0.07] text-xs text-gray-500"
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
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.07] hover:border-red-500/25 text-gray-500 hover:text-red-400 text-[11px] font-semibold uppercase tracking-widest transition-colors duration-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </motion.button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 z-10 space-y-8">
        {dbError && (
          <div className="glass-panel border-red-500/20 bg-red-950/20 p-5 rounded-md flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-red-200">
                  Database Connection Failed
                </h4>
                <p className="text-xs text-red-400/90 mt-1 leading-relaxed">
                  {dbError}. Please check if the{" "}
                  <code className="bg-black/50 px-1 py-0.5 rounded text-white text-[11px]">
                    .env.local
                  </code>{" "}
                  file has been configured with valid credentials and the
                  Supabase tables are ready.
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-500/15 hover:bg-red-500/35 border border-red-500/20 hover:border-red-500/40 text-red-200 text-xs font-semibold transition-all duration-300 whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        )}

        <section className="glass-panel rounded-md p-6 flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-[#AB7FEB] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5" /> Select Desktop Game
              </label>
              <div className="relative">
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value as GameId)}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#540EE1] transition-all cursor-pointer appearance-none"
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

            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-[#AB7FEB] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Filter Week Range (WIB)
              </label>
              <div className="relative">
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value as WeekKey)}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#540EE1] transition-all cursor-pointer appearance-none"
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

          <div className="flex flex-col sm:flex-row gap-4 items-stretch xl:items-end">
            <div className="relative min-w-[240px]">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> Search Player
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name / WhatsApp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-md pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#540EE1] transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={isLoading || filteredData.length === 0}
              className="flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 font-bold px-6 py-3.5 rounded-md transition-all duration-300 shadow-md text-sm whitespace-nowrap cursor-pointer hover:shadow-white/10"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={loadData}
              disabled={isLoading}
              title="Refresh Data"
              className="flex items-center justify-center w-[48px] h-[48px] bg-white/[0.03] hover:bg-white/[0.08] disabled:bg-transparent border border-white/10 hover:border-white/20 rounded-md text-gray-300 hover:text-white transition-all cursor-pointer shrink-0"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </section>

        {isLoading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#540EE1]/20 border-t-[#AB7FEB] rounded-full animate-spin" />
            <p className="text-sm font-semibold text-[#AB7FEB]/80 animate-pulse">
              Collecting data from Supabase... Please wait a moment.
            </p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="glass-panel rounded-md p-16 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-2">
              <HelpCircle className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-white">No Data Found</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              No data found for the game{" "}
              <strong className="text-[#AB7FEB]">{activeGameInfo?.name}</strong>{" "}
              in the selected period{" "}
              <strong className="text-[#AB7FEB]">
                {WEEK_RANGES[selectedWeek].label}
              </strong>
              . Please double-check the selected.
            </p>
          </div>
        ) : (
          <>
            <section className="flex flex-row items-end justify-center gap-2 md:grid md:grid-cols-3 md:gap-6 pt-6 max-w-4xl mx-auto px-2">
              {podiumWinners[1] ? (
                <div className="flex flex-col items-center w-1/3 md:w-full order-2 md:order-1">
                  <div className="text-center mb-3 w-full">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-gray-400/20 to-gray-200/20 border-2 border-gray-400 flex items-center justify-center mx-auto shadow-lg relative">
                      <span className="text-sm md:text-lg font-bold text-gray-300">
                        2
                      </span>
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gray-400 text-black px-1 md:px-1.5 py-0.5 rounded-full text-[7px] md:text-[9px] font-extrabold tracking-wider">
                        SILVER
                      </div>
                    </div>
                    <h4 className="text-xs md:text-sm font-bold text-white mt-3 truncate max-w-[90px] md:max-w-[150px] mx-auto">
                      {podiumWinners[1].name}
                    </h4>
                    <p className="text-[9px] md:text-[11px] text-gray-400 mt-0.5 truncate max-w-[90px] md:max-w-none mx-auto">
                      {podiumWinners[1].handphone}
                    </p>
                    <p className="text-[10px] md:text-xs font-black text-[#AB7FEB] mt-1">
                      {selectedGame === "memory"
                        ? formatDuration(podiumWinners[1].time_ms)
                        : `${podiumWinners[1].score} Pts`}
                    </p>
                  </div>
                  <div className="w-full h-20 md:h-24 bg-gradient-to-b from-gray-800/40 to-gray-900/60 border border-gray-700/30 rounded-t-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xl md:text-4xl font-extrabold text-gray-700">
                      2nd
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-1/3 md:w-full order-2 md:order-1" />
              )}

              {podiumWinners[0] ? (
                <div className="flex flex-col items-center w-1/3 md:w-full order-1 md:order-2">
                  <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 animate-bounce mb-1" />
                  <div className="text-center mb-4 w-full">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-yellow-400/20 to-amber-500/20 border-3 border-yellow-400 flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/10 relative">
                      <span className="text-xl md:text-2xl font-black text-yellow-400">
                        1
                      </span>
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-1.5 md:px-2 py-0.5 rounded-full text-[7px] md:text-[9px] font-black tracking-wider">
                        CHAMP
                      </div>
                    </div>
                    <h4 className="text-xs md:text-base font-extrabold text-white mt-3 truncate max-w-[100px] md:max-w-[180px] mx-auto">
                      {podiumWinners[0].name}
                    </h4>
                    <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 truncate max-w-[100px] md:max-w-none mx-auto">
                      {podiumWinners[0].handphone}
                    </p>
                    <p className="text-xs md:text-sm font-black text-yellow-400 mt-1">
                      {selectedGame === "memory"
                        ? formatDuration(podiumWinners[0].time_ms)
                        : `${podiumWinners[0].score} Pts`}
                    </p>
                  </div>
                  <div className="w-full h-28 md:h-32 bg-gradient-to-b from-[#540EE1]/20 to-[#540EE1]/5 border border-[#540EE1]/30 rounded-t-3xl flex items-center justify-center backdrop-blur-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#540EE1]/10 blur-xl pointer-events-none" />
                    <span className="text-2xl md:text-5xl font-black text-[#540EE1]">
                      1st
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-1/3 md:w-full order-1 md:order-2" />
              )}

              {podiumWinners[2] ? (
                <div className="flex flex-col items-center w-1/3 md:w-full order-3">
                  <div className="text-center mb-3 w-full">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-tr from-amber-800/20 to-amber-600/20 border border-amber-700 flex items-center justify-center mx-auto shadow-lg relative">
                      <span className="text-xs md:text-base font-bold text-amber-500">
                        3
                      </span>
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-700 text-white px-1 md:px-1.5 py-0.5 rounded-full text-[6px] md:text-[8px] font-extrabold tracking-wider">
                        BRONZE
                      </div>
                    </div>
                    <h4 className="text-xs md:text-sm font-bold text-white mt-3 truncate max-w-[80px] md:max-w-[140px] mx-auto">
                      {podiumWinners[2].name}
                    </h4>
                    <p className="text-[9px] md:text-[11px] text-gray-400 mt-0.5 truncate max-w-[80px] md:max-w-none mx-auto">
                      {podiumWinners[2].handphone}
                    </p>
                    <p className="text-[10px] md:text-xs font-black text-[#AB7FEB] mt-1">
                      {selectedGame === "memory"
                        ? formatDuration(podiumWinners[2].time_ms)
                        : `${podiumWinners[2].score} Pts`}
                    </p>
                  </div>
                  <div className="w-full h-14 md:h-20 bg-gradient-to-b from-amber-950/20 to-black/60 border border-amber-900/25 rounded-t-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-lg md:text-3xl font-extrabold text-amber-700/80">
                      3rd
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-1/3 md:w-full order-3" />
              )}
            </section>

            <section className="glass-panel rounded-md overflow-hidden shadow-2xl relative">
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <h3 className="text-sm font-extrabold tracking-wide uppercase text-white flex items-center gap-2">
                  {activeGameIcon}
                  <span>
                    Leaderboard Standings ({filteredData.length} Players)
                  </span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-[#AB7FEB] uppercase tracking-wider">
                      <th className="py-4.5 px-6 text-center w-24">Rank</th>
                      <th className="py-4.5 px-6">Player Name</th>
                      <th className="py-4.5 px-6">WhatsApp No.</th>
                      {selectedGame === "memory" ? (
                        <>
                          <th className="py-4.5 px-6 text-right">
                            Play Duration
                          </th>
                          <th className="py-4.5 px-6 text-center">Moves</th>
                          <th className="py-4.5 px-6 text-center">Stage</th>
                        </>
                      ) : (
                        <th className="py-4.5 px-6 text-center">Score</th>
                      )}
                      <th className="py-4.5 px-6 text-center w-64">
                        Play Time
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
                              className={`py-4.5 px-6 text-center font-bold ${row.rank && row.rank <= 3 ? "text-yellow-400/90" : "text-white"}`}
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
                            className={`py-4.5 px-6 text-center font-bold font-mono ${row.rank && row.rank <= 3 ? "text-yellow-400/90" : "text-white"}`}
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

              {filteredData.length > 0 && (
                <div className="px-6 py-4.5 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-400 font-semibold">
                    <div className="flex items-center gap-2">
                      <span>Rows per page:</span>
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
                      Showing {Math.min(filteredData.length, startIndex + 1)} -{" "}
                      {Math.min(filteredData.length, startIndex + itemsPerPage)}{" "}
                      of {filteredData.length} entries
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-40 disabled:hover:bg-white/[0.03] border border-white/10 disabled:cursor-not-allowed text-xs font-bold text-gray-300 transition-all cursor-pointer"
                    >
                      Previous
                    </button>

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
                              className={`w-8 h-8 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
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
                      className="px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-40 disabled:hover:bg-white/[0.03] border border-white/10 disabled:cursor-not-allowed text-xs font-bold text-gray-300 transition-all cursor-pointer"
                    >
                      Next
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
