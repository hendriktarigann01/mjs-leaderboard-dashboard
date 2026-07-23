"use client";

import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  Calendar,
  Search,
  Download,
  RefreshCw,
  Crown,
  Trophy,
  Flame,
  Monitor,
  AlertCircle,
  HelpCircle,
  Archive,
  X,
  Filter as FilterIcon
} from "lucide-react";
import {
  fetchLeaderboardData,
  formatToWIB,
  LeaderboardEntry,
  GameId,
  GAMES
} from "@/lib/dataService";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardTabProps {
  selectedGame: GameId;
}

export default function LeaderboardTab({ selectedGame }: LeaderboardTabProps) {
  const [filterMode, setFilterMode] = useState<"all" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTable, setActiveTable] = useState("None");
  const [dbError, setDbError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Archive / Reset Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const start = filterMode === "custom" && startDate ? startDate : null;
      const end = filterMode === "custom" && endDate ? endDate : null;
      const response = await fetchLeaderboardData(selectedGame, start, end);
      setData(response.data);
      setActiveTable(response.activeTable);
      if (response.error) {
        setDbError(response.error);
      }
    } catch (err: any) {
      console.error(err);
      setDbError(
        err?.message || "An unexpected error occurred while loading data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedGame, filterMode, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGame, filterMode, startDate, endDate, searchQuery]);

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
    startIndex + itemsPerPage
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
    const fileName = `leaderboard-${gameLabel}-${filterMode}.csv`;

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
        "Last Stage (Level)"
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
          row.stage ?? ""
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

  const handleWeeklyReset = () => {
    setResetFeedback(`Skor untuk ${GAMES.find(g => g.id === selectedGame)?.name} telah berhasil di-archive.`);
    setIsResetModalOpen(false);
    setTimeout(() => setResetFeedback(null), 5000);
  };

  const activeGameInfo = GAMES.find((g) => g.id === selectedGame);

  return (
    <div className="space-y-8">
      {dbError && (
        <div className="glass-panel border-red-500/20 bg-red-950/20 p-5 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-sm font-bold text-red-200">
                Koneksi Database Supabase Terganggu
              </h4>
              <p className="text-xs text-red-400/90 mt-1 leading-relaxed">
                {dbError}. Pastikan credentials pada{" "}
                <code className="bg-black/50 px-1 py-0.5 rounded text-white text-[11px]">
                  .env.local
                </code>{" "}
                telah terkonfigurasi dengan benar.
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-200 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      )}

      {resetFeedback && (
        <div className="p-4 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{resetFeedback}</span>
          </div>
          <button onClick={() => setResetFeedback(null)} className="text-indigo-300 hover:text-white font-bold">
            Tutup
          </button>
        </div>
      )}

      {/* FILTERS & SEARCH BAR (NO SELECT GAME HERE ANYMORE) */}
      <section className="glass-panel rounded-xl p-6 border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-xl flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 items-stretch sm:items-end">
          {/* Filter Mode (All / Custom Date) */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FilterIcon className="w-3.5 h-3.5" /> Filter Periode
            </label>
            <div className="relative">
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as "all" | "custom")}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All (All Time)</option>
                <option value="custom" className="bg-slate-900 text-white">Custom Date</option>
              </select>
            </div>
          </div>

          {/* Custom Date Inputs if Custom Selected */}
          {filterMode === "custom" && (
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Selesai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch xl:items-end">
          <div className="relative min-w-[200px]">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Cari Pemain
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nama / No. WhatsApp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={isLoading || filteredData.length === 0}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-lg transition-all text-xs whitespace-nowrap cursor-pointer shadow-lg shadow-indigo-600/25"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer"
            title="Reset & Archive Leaderboard"
          >
            <Archive className="w-4 h-4" />
            <span>Reset Leaderboard</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            title="Refresh Leaderboard"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </section>

      {/* LEADERBOARD STANDINGS CONTENT */}
      {isLoading ? (
        <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-xs font-semibold text-indigo-300 animate-pulse">
            Mengambil data skor dari Supabase...
          </p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="glass-panel rounded-xl border border-slate-800 bg-slate-900/80 p-16 text-center max-w-xl mx-auto flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-1">
            <HelpCircle className="w-7 h-7 text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-white">Tidak Ada Data Pemain</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tidak ditemukan data untuk game{" "}
            <strong className="text-indigo-400">{activeGameInfo?.name}</strong>.
          </p>
        </div>
      ) : (
        <>
          {/* PODIUM STANDINGS (1ST, 2ND, 3RD) */}
          <section className="flex flex-row items-end justify-center gap-2 md:grid md:grid-cols-3 md:gap-6 pt-4 max-w-4xl mx-auto px-2">
            {/* 2nd Place */}
            {podiumWinners[1] ? (
              <div className="flex flex-col items-center w-1/3 md:w-full order-2 md:order-1">
                <div className="text-center mb-3 w-full">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center mx-auto shadow-lg relative">
                    <span className="text-sm md:text-lg font-bold text-slate-200">2</span>
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-950 px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-extrabold tracking-wider">
                      SILVER
                    </div>
                  </div>
                  <h4 className="text-xs md:text-sm font-bold text-white mt-3 truncate max-w-[90px] md:max-w-[150px] mx-auto">
                    {podiumWinners[1].name}
                  </h4>
                  <p className="text-[9px] md:text-[11px] text-slate-400 truncate max-w-[90px] md:max-w-none mx-auto">
                    {podiumWinners[1].handphone}
                  </p>
                  <p className="text-[10px] md:text-xs font-black text-indigo-400 mt-1">
                    {selectedGame === "memory"
                      ? formatDuration(podiumWinners[1].time_ms)
                      : `${podiumWinners[1].score} Pts`}
                  </p>
                </div>
                <div className="w-full h-20 md:h-24 bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/50 rounded-t-2xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-xl md:text-3xl font-extrabold text-slate-500">2nd</span>
                </div>
              </div>
            ) : <div className="w-1/3 md:w-full order-2 md:order-1" />}

            {/* 1st Place */}
            {podiumWinners[0] ? (
              <div className="flex flex-col items-center w-1/3 md:w-full order-1 md:order-2">
                <Crown className="w-6 h-6 md:w-8 md:h-8 text-amber-400 animate-bounce mb-1" />
                <div className="text-center mb-4 w-full">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/20 relative">
                    <span className="text-xl md:text-2xl font-black text-amber-400">1</span>
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black tracking-wider">
                      CHAMP
                    </div>
                  </div>
                  <h4 className="text-xs md:text-base font-extrabold text-white mt-3 truncate max-w-[100px] md:max-w-[180px] mx-auto">
                    {podiumWinners[0].name}
                  </h4>
                  <p className="text-[10px] md:text-xs text-slate-400 truncate max-w-[100px] md:max-w-none mx-auto">
                    {podiumWinners[0].handphone}
                  </p>
                  <p className="text-xs md:text-sm font-black text-amber-400 mt-1">
                    {selectedGame === "memory"
                      ? formatDuration(podiumWinners[0].time_ms)
                      : `${podiumWinners[0].score} Pts`}
                  </p>
                </div>
                <div className="w-full h-28 md:h-32 bg-gradient-to-b from-indigo-600/30 to-slate-900/90 border border-indigo-500/40 rounded-t-3xl flex items-center justify-center backdrop-blur-md relative overflow-hidden">
                  <span className="text-2xl md:text-4xl font-black text-indigo-400">1st</span>
                </div>
              </div>
            ) : <div className="w-1/3 md:w-full order-1 md:order-2" />}

            {/* 3rd Place */}
            {podiumWinners[2] ? (
              <div className="flex flex-col items-center w-1/3 md:w-full order-3">
                <div className="text-center mb-3 w-full">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-amber-900/30 border border-amber-700 flex items-center justify-center mx-auto shadow-lg relative">
                    <span className="text-xs md:text-base font-bold text-amber-500">3</span>
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-700 text-white px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] font-extrabold tracking-wider">
                      BRONZE
                    </div>
                  </div>
                  <h4 className="text-xs md:text-sm font-bold text-white mt-3 truncate max-w-[80px] md:max-w-[140px] mx-auto">
                    {podiumWinners[2].name}
                  </h4>
                  <p className="text-[9px] md:text-[11px] text-slate-400 truncate max-w-[80px] md:max-w-none mx-auto">
                    {podiumWinners[2].handphone}
                  </p>
                  <p className="text-[10px] md:text-xs font-black text-indigo-400 mt-1">
                    {selectedGame === "memory"
                      ? formatDuration(podiumWinners[2].time_ms)
                      : `${podiumWinners[2].score} Pts`}
                  </p>
                </div>
                <div className="w-full h-14 md:h-20 bg-gradient-to-b from-amber-950/40 to-slate-900/90 border border-amber-900/30 rounded-t-2xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-lg md:text-2xl font-extrabold text-amber-700">3rd</span>
                </div>
              </div>
            ) : <div className="w-1/3 md:w-full order-3" />}
          </section>

          {/* LEADERBOARD TABLE */}
          <section className="glass-panel rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
              <h3 className="text-xs font-extrabold tracking-wider uppercase text-slate-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-indigo-400" />
                <span>Klasemen Skor {activeGameInfo?.name} ({filteredData.length} Total Player)</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                    <th className="py-4 px-5 text-center w-20">Rank</th>
                    <th className="py-4 px-5">Nama Pemain</th>
                    <th className="py-4 px-5">No. WhatsApp</th>
                    {selectedGame === "memory" ? (
                      <>
                        <th className="py-4 px-5 text-right">Durasi Main</th>
                        <th className="py-4 px-5 text-center">Moves</th>
                        <th className="py-4 px-5 text-center">Stage</th>
                      </>
                    ) : (
                      <th className="py-4 px-5 text-center">Skor</th>
                    )}
                    <th className="py-4 px-5 text-center w-56">Waktu Bermain (WIB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-200">
                  {paginatedTableData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-4 px-5 text-center">
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full">
                          {row.rank === 1 ? (
                            <Crown className="w-5 h-5 text-amber-400" />
                          ) : row.rank === 2 ? (
                            <div className="w-5 h-5 rounded-full bg-slate-700 border border-slate-400 flex items-center justify-center text-[11px] font-extrabold text-slate-200">
                              2
                            </div>
                          ) : row.rank === 3 ? (
                            <div className="w-5 h-5 rounded-full bg-amber-950 border border-amber-700 flex items-center justify-center text-[11px] font-extrabold text-amber-500">
                              3
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono font-bold">{row.rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {row.name}
                      </td>
                      <td className="py-4 px-5 text-slate-400 font-mono text-[11px]">
                        {row.handphone}
                      </td>

                      {selectedGame === "memory" ? (
                        <>
                          <td className={`py-4 px-5 text-right font-bold ${row.rank && row.rank <= 3 ? "text-amber-400" : "text-white"}`}>
                            {formatDuration(row.time_ms)}
                          </td>
                          <td className="py-4 px-5 text-center text-slate-400 font-mono">
                            {row.moves}
                          </td>
                          <td className="py-4 px-5 text-center text-slate-400 font-mono">
                            {row.stage}
                          </td>
                        </>
                      ) : (
                        <td className={`py-4 px-5 text-center font-extrabold font-mono ${row.rank && row.rank <= 3 ? "text-amber-400" : "text-white"}`}>
                          {row.score} Pts
                        </td>
                      )}

                      <td className="py-4 px-5 text-center text-slate-400 font-mono text-[11px]">
                        {formatToWIB(row.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {filteredData.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
                  <div className="flex items-center gap-2">
                    <span>Rows:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-slate-950 border border-slate-700/80 rounded-md px-2 py-1 text-white text-xs cursor-pointer"
                    >
                      {[5, 10, 20, 50, 100].map((size) => (
                        <option key={size} value={size} className="bg-slate-900 text-white">
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span>
                    Entries {Math.min(filteredData.length, startIndex + 1)} -{" "}
                    {Math.min(filteredData.length, startIndex + itemsPerPage)} of {filteredData.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
                  >
                    Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    .map((page, index, array) => {
                      const showEllipsisBefore = page > 1 && array[index - 1] !== page - 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && <span className="text-slate-600 text-xs px-1">...</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                              currentPage === page
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* WEEKLY RESET MODAL */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700/80 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Archive className="w-4 h-4 text-amber-400" /> Reset & Archive Leaderboard
                </h3>
                <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2">
                <p>Apakah Anda yakin ingin meng-archive leaderboard untuk game:</p>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-bold text-indigo-400">
                  {activeGameInfo?.name}
                </div>
                <p className="text-[11px] text-slate-400">
                  Data skor yang di-archive tidak akan terhapus permanen dari Supabase database dan dapat diakses kembali.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleWeeklyReset}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-amber-600/30"
                >
                  Konfirmasi Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
