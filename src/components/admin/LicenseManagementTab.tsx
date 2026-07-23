"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  PowerOff,
  ShieldAlert,
  CalendarX,
  AlertTriangle,
  Calendar,
  KeyRound,
  SlidersHorizontal,
  X
} from "lucide-react";
import {
  License,
  LicenseStatus,
  fetchLicenses,
  createLicense,
  updateLicenseStatus,
  updateOperatingHours,
  extendLicenseExpiration,
  calculateHeartbeat,
  formatWIB
} from "@/lib/licenseService";
import { GameId, mapGameIdToLicenseGame } from "@/lib/dataService";
import { motion, AnimatePresence } from "framer-motion";

const GAME_OPTIONS = [
  { id: "ALL", label: "Semua Game" },
  { id: "Whac-A-Mole", label: "Whac-A-Mole" },
  { id: "Catch", label: "Catch Game" },
  { id: "Memory", label: "Memory Card" },
  { id: "Scream", label: "Scream Challenge" }
];

const STATUS_OPTIONS: { id: LicenseStatus | "ALL"; label: string }[] = [
  { id: "ALL", label: "Semua Status" },
  { id: "ACTIVE", label: "ACTIVE (Aktif)" },
  { id: "PENDING", label: "PENDING (Belum Teraktivasi)" },
  { id: "DISABLED", label: "DISABLED (Non-Aktif Remote)" },
  { id: "BLOCKED", label: "BLOCKED (Perangkat Diblokir)" },
  { id: "EXPIRED", label: "EXPIRED (Kadaluarsa)" },
  { id: "CLOCK_TAMPERED", label: "CLOCK_TAMPERED (Jam Diubah)" }
];

interface LicenseManagementTabProps {
  selectedGame: GameId;
}

export default function LicenseManagementTab({ selectedGame: activeHeaderGame }: LicenseManagementTabProps) {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterGame, setFilterGame] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedLicenseForAction, setSelectedLicenseForAction] = useState<License | null>(null);

  // Form States
  const activeMappedGame = mapGameIdToLicenseGame(activeHeaderGame);
  const [newGameId, setNewGameId] = useState(activeMappedGame);
  const [newClientId, setNewClientId] = useState("");
  const [newOpStart, setNewOpStart] = useState("09:00");
  const [newOpEnd, setNewOpEnd] = useState("22:00");
  const [newExpiresAt, setNewExpiresAt] = useState("");

  const [editOpStart, setEditOpStart] = useState("09:00");
  const [editOpEnd, setEditOpEnd] = useState("22:00");

  const [extendDate, setExtendDate] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLicenses();
      setLicenses(data);
    } catch (error) {
      console.error("Error loading licenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setNewGameId(mapGameIdToLicenseGame(activeHeaderGame));
  }, [activeHeaderGame]);

  // Filtered Licenses (Strictly matched against activeHeaderGame if filterGame is ALL)
  const filteredLicenses = licenses.filter((lic) => {
    const activeTarget = mapGameIdToLicenseGame(activeHeaderGame).toLowerCase();
    const licGame = lic.gameId.toLowerCase();

    // Match header selected game
    const matchHeaderGame = licGame.includes(activeTarget) || activeTarget.includes(licGame) ||
      (activeTarget.includes("mole") && licGame.includes("mole")) ||
      (activeTarget.includes("catch") && licGame.includes("catch")) ||
      (activeTarget.includes("memory") && licGame.includes("memory")) ||
      (activeTarget.includes("scream") && licGame.includes("scream"));

    if (!matchHeaderGame) return false;

    const matchFilterGame = filterGame === "ALL" || licGame.includes(filterGame.toLowerCase());
    const matchStatus = selectedStatus === "ALL" || lic.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      lic.clientId.toLowerCase().includes(q) ||
      lic.id.toLowerCase().includes(q) ||
      (lic.deviceFingerprint && lic.deviceFingerprint.toLowerCase().includes(q));

    return matchFilterGame && matchStatus && matchSearch;
  });

  const handleStatusChange = async (licenseId: string, status: LicenseStatus) => {
    await updateLicenseStatus(licenseId, status);
    loadData();
  };

  const handleOpenHoursModal = (lic: License) => {
    setSelectedLicenseForAction(lic);
    setEditOpStart(lic.operatingStart || "09:00");
    setEditOpEnd(lic.operatingEnd || "22:00");
    setIsHoursModalOpen(true);
  };

  const handleSaveHours = async () => {
    if (!selectedLicenseForAction) return;
    await updateOperatingHours(selectedLicenseForAction.id, editOpStart, editOpEnd);
    setIsHoursModalOpen(false);
    loadData();
  };

  const handleOpenExtendModal = (lic: License) => {
    setSelectedLicenseForAction(lic);
    const d = lic.expiresAt ? new Date(lic.expiresAt) : new Date(Date.now() + 365 * 86400000);
    setExtendDate(d.toISOString().split("T")[0]);
    setIsExtendModalOpen(true);
  };

  const handleSaveExtend = async () => {
    if (!selectedLicenseForAction || !extendDate) return;
    const newExpiresISO = new Date(`${extendDate}T23:59:59+07:00`).toISOString();
    await extendLicenseExpiration(selectedLicenseForAction.id, newExpiresISO);
    setIsExtendModalOpen(false);
    loadData();
  };

  const handleCreateNewLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientId.trim()) return;

    const expiresISO = newExpiresAt
      ? new Date(`${newExpiresAt}T23:59:59+07:00`).toISOString()
      : new Date(Date.now() + 365 * 86400000).toISOString();

    await createLicense({
      gameId: newGameId,
      clientId: newClientId.trim().toUpperCase(),
      operatingStart: newOpStart,
      operatingEnd: newOpEnd,
      expiresAt: expiresISO,
      status: "PENDING"
    });

    setIsAddModalOpen(false);
    setNewClientId("");
    loadData();
  };

  const renderStatusBadge = (status: LicenseStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> PENDING
          </span>
        );
      case "DISABLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <PowerOff className="w-3.5 h-3.5" /> DISABLED
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-500/15 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-3.5 h-3.5" /> BLOCKED
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <CalendarX className="w-3.5 h-3.5" /> EXPIRED
          </span>
        );
      case "CLOCK_TAMPERED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-600/25 text-red-300 border border-red-500/50 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> CLOCK_TAMPERED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const renderHeartbeatDot = (lastSeenAt: string | null, opStart: string, opEnd: string) => {
    const hb = calculateHeartbeat(lastSeenAt, opStart, opEnd);
    return (
      <div className="flex items-center gap-2" title={hb.label}>
        {hb.status === "online" ? (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        ) : hb.status === "idle" ? (
          <span className="h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
        ) : (
          <span className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
        )}
        <span className="text-xs text-slate-300 font-mono">{hb.label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* FILTER BAR & CONTROLS */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-xl flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Status Filter */}
          <div className="relative flex-1 min-w-[190px]">
            <label className="block text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Filter Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative flex-[1.5] min-w-[220px]">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Search className="w-3 h-3" /> Search Client / Device FP
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari Client ID, License ID, atau Fingerprint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-end xl:self-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Lisensi Baru</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Refresh Lisensi"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* TABLE LISTING */}
      <div className="glass-panel rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-slate-300 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <span>Daftar Lisensi Perangkat - {activeMappedGame} ({filteredLicenses.length} Record)</span>
          </h3>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold animate-pulse">Memuat data lisensi Supabase...</p>
          </div>
        ) : filteredLicenses.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
            <ShieldAlert className="w-10 h-10 text-slate-600 mb-1" />
            <p className="text-sm font-bold text-white">Belum ada lisensi untuk game {activeMappedGame}</p>
            <p className="text-xs text-slate-500">Klik "Tambah Lisensi Baru" untuk menambahkan lisensi game ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-center border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Client ID</th>
                  <th className="py-4 px-5">Game</th>
                  <th className="py-4 px-5">Device Fingerprint</th>
                  <th className="py-4 px-5">Jam Operasional</th>
                  <th className="py-4 px-5">Terakhir Terlihat</th>
                  <th className="py-4 px-5">Masa Berlaku</th>
                  <th className="py-4 px-5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-200">
                {filteredLicenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-5 whitespace-nowrap">{renderStatusBadge(lic.status)}</td>

                    <td className="py-4 px-5 whitespace-nowrap font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {lic.clientId}
                    </td>

                    <td className="py-4 px-5 font-semibold text-purple-300 whitespace-nowrap">
                      {lic.gameId}
                    </td>

                    <td className="py-4 px-5 font-mono text-[11px]">
                      {lic.deviceFingerprint ? (
                        <span className="px-2.5 py-1 rounded whitespace-wrap bg-slate-950 border border-slate-800 text-indigo-300">
                          {lic.deviceFingerprint}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Belum Terkunci</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-center whitespace-nowrap font-mono text-[11px]">
                      <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        {lic.operatingStart || "09:00"} - {lic.operatingEnd || "22:00"}
                      </span>
                    </td>

                    <td className="py-4 px-5 whitespace-nowrap">
                      {renderHeartbeatDot(lic.lastSeenAt, lic.operatingStart, lic.operatingEnd)}
                    </td>

                    <td className="py-4 px-5 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                      {formatWIB(lic.expiresAt)}
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={lic.status}
                          onChange={(e) => handleStatusChange(lic.id, e.target.value as LicenseStatus)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="ACTIVE" className="bg-slate-900 text-emerald-400">ACTIVE</option>
                          <option value="PENDING" className="bg-slate-900 text-amber-400">PENDING</option>
                          <option value="DISABLED" className="bg-slate-900 text-purple-400">DISABLED</option>
                          <option value="BLOCKED" className="bg-slate-900 text-red-400">BLOCKED</option>
                          <option value="EXPIRED" className="bg-slate-900 text-rose-400">EXPIRED</option>
                          <option value="CLOCK_TAMPERED" className="bg-slate-900 text-red-300">CLOCK_TAMPERED</option>
                        </select>

                        <button
                          onClick={() => handleOpenHoursModal(lic)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 transition-all cursor-pointer"
                          title="Edit Jam Operasional"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenExtendModal(lic)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-purple-600/30 border border-slate-700 hover:border-purple-500/50 text-slate-300 hover:text-purple-300 transition-all cursor-pointer"
                          title="Perpanjang Masa Berlaku"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: TAMBAH LISENSI BARU */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700/80 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" /> Tambah Lisensi Perangkat Baru
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewLicense} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Game</label>
                  <select
                    value={newGameId}
                    onChange={(e) => setNewGameId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-semibold text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {GAME_OPTIONS.filter(g => g.id !== "ALL").map(g => (
                      <option key={g.id} value={g.id}>{g.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Client ID</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: MJS-MALL-CGK-01"
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Jam Buka (Start)</label>
                    <input
                      type="time"
                      value={newOpStart}
                      onChange={(e) => setNewOpStart(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Jam Tutup (End)</label>
                    <input
                      type="time"
                      value={newOpEnd}
                      onChange={(e) => setNewOpEnd(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Masa Berlaku (Expires Date)</label>
                  <input
                    type="date"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    Simpan Lisensi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT JAM OPERASIONAL */}
      <AnimatePresence>
        {isHoursModalOpen && selectedLicenseForAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700/80 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" /> Edit Jam Operasional
                </h3>
                <button onClick={() => setIsHoursModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-400">
                Klien: <strong className="text-white">{selectedLicenseForAction.clientId}</strong> ({selectedLicenseForAction.gameId})
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Mulai (HH:mm)</label>
                  <input
                    type="time"
                    value={editOpStart}
                    onChange={(e) => setEditOpStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Selesai (HH:mm)</label>
                  <input
                    type="time"
                    value={editOpEnd}
                    onChange={(e) => setEditOpEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">Mendukung jam operasional reguler (cth: 09:00 - 22:00) maupun overnight (cth: 18:00 - 02:00).</p>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsHoursModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveHours}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  Simpan Perubahan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PERPANJANG LISENSI */}
      <AnimatePresence>
        {isExtendModalOpen && selectedLicenseForAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700/80 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" /> Perpanjang Masa Berlaku
                </h3>
                <button onClick={() => setIsExtendModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-400">
                Klien: <strong className="text-white">{selectedLicenseForAction.clientId}</strong> ({selectedLicenseForAction.gameId})
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tanggal Kadaluarsa Baru (Expires At)</label>
                <input
                  type="date"
                  value={extendDate}
                  onChange={(e) => setExtendDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExtendModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveExtend}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 cursor-pointer shadow-lg shadow-purple-600/30"
                >
                  Perpanjang Lisensi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
