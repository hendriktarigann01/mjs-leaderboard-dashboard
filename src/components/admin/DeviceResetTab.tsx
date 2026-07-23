"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  RefreshCw,
  Search,
  History,
  FileText,
  User,
  HardDrive,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import {
  DeviceResetLog,
  License,
  fetchDeviceResetLogs,
  fetchLicenses,
  resetDeviceHardware,
  formatWIB
} from "@/lib/licenseService";
import { GameId, mapGameIdToLicenseGame } from "@/lib/dataService";

interface DeviceResetTabProps {
  selectedGame: GameId;
}

export default function DeviceResetTab({ selectedGame: activeHeaderGame }: DeviceResetTabProps) {
  const [logs, setLogs] = useState<DeviceResetLog[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedLicenseId, setSelectedLicenseId] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const activeMappedGame = mapGameIdToLicenseGame(activeHeaderGame);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsData, licData] = await Promise.all([
        fetchDeviceResetLogs(),
        fetchLicenses()
      ]);
      setLogs(logsData);
      setLicenses(licData);

      const targetLic = licData.find(l => 
        l.gameId.toLowerCase().includes(activeMappedGame.toLowerCase()) && l.deviceFingerprint !== null
      ) || licData.find(l => l.gameId.toLowerCase().includes(activeMappedGame.toLowerCase())) || licData[0];

      if (targetLic) {
        setSelectedLicenseId(targetLic.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeHeaderGame]);

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicenseId || !resetReason.trim()) return;

    setIsResetting(true);
    setResetSuccessMessage(null);
    try {
      await resetDeviceHardware(selectedLicenseId, resetReason.trim(), "Admin");
      setResetSuccessMessage("Reset perangkat berhasil dieksekusi! Fingerprint telah dikosongkan dan status lisensi kembali ke PENDING.");
      setResetReason("");
      await loadData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const selectedLicenseObj = licenses.find(l => l.id === selectedLicenseId);

  const availableLicensesForGame = licenses.filter(l => {
    const target = activeMappedGame.toLowerCase();
    const g = l.gameId.toLowerCase();
    return g.includes(target) || target.includes(g) ||
      (target.includes("mole") && g.includes("mole")) ||
      (target.includes("catch") && g.includes("catch")) ||
      (target.includes("memory") && g.includes("memory")) ||
      (target.includes("scream") && g.includes("scream"));
  });

  const filteredLogs = logs.filter((log) => {
    const activeTarget = activeMappedGame.toLowerCase();
    const logGame = (log.gameId || "").toLowerCase();

    const matchHeaderGame = !log.gameId || logGame.includes(activeTarget) || activeTarget.includes(logGame) ||
      (activeTarget.includes("mole") && logGame.includes("mole")) ||
      (activeTarget.includes("catch") && logGame.includes("catch")) ||
      (activeTarget.includes("memory") && logGame.includes("memory")) ||
      (activeTarget.includes("scream") && logGame.includes("scream"));

    if (!matchHeaderGame) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (log.clientId && log.clientId.toLowerCase().includes(q)) ||
      log.oldFingerprint.toLowerCase().includes(q) ||
      log.reason.toLowerCase().includes(q) ||
      log.resetBy.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* DEVICE RESET MODULE CARD */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                Modul Reset Perangkat - {activeMappedGame}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Gunakan modul ini apabila unit PC/Klien mengalami pergantian komponen hardware (Motherboard/GPU/Network Card).
              </p>
            </div>
          </div>
        </div>

        {resetSuccessMessage && (
          <div className="p-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{resetSuccessMessage}</span>
            </div>
            <button onClick={() => setResetSuccessMessage(null)} className="text-emerald-400 hover:text-white text-xs font-bold">
              Tutup
            </button>
          </div>
        )}

        <form onSubmit={handleExecuteReset} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Column 1: Select License */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              1. Pilih Lisensi Terkunci ({activeMappedGame})
            </label>

            {availableLicensesForGame.length === 0 ? (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                Belum ada lisensi untuk game {activeMappedGame}.
              </div>
            ) : (
              <select
                value={selectedLicenseId}
                onChange={(e) => setSelectedLicenseId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-3 text-xs font-semibold text-white focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                {availableLicensesForGame.map((lic) => (
                  <option key={lic.id} value={lic.id} className="bg-slate-900 text-white">
                    {lic.clientId} — {lic.gameId} ({lic.deviceFingerprint ? `FP: ${lic.deviceFingerprint}` : 'Unbound'})
                  </option>
                ))}
              </select>
            )}

            {selectedLicenseObj && (
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] space-y-1 font-mono text-slate-400">
                <div>Client ID: <span className="text-white font-bold">{selectedLicenseObj.clientId}</span></div>
                <div>Status Saat Ini: <span className="text-amber-400 font-bold">{selectedLicenseObj.status}</span></div>
                <div>Device FP Saat Ini: <span className="text-indigo-300">{selectedLicenseObj.deviceFingerprint || 'Null'}</span></div>
              </div>
            )}
          </div>

          {/* Column 2: Alasan Reset */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              2. Alasan Reset / Pemindahan Hardware
            </label>
            <textarea
              required
              rows={4}
              placeholder="Contoh: Unit PC rusak, dilakukan penggantian Motherboard & GPU baru..."
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 transition-all resize-none"
            />
          </div>

          {/* Column 3: Warning & Execute */}
          <div className="space-y-3 flex flex-col justify-between p-4 rounded-lg bg-red-950/20 border border-red-500/20">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Konfirmasi Eksekusi Reset
              </div>
              <p className="text-[11px] text-red-300/80 leading-relaxed">
                Tindakan ini akan mengosongkan <code className="bg-black/50 px-1 py-0.5 rounded text-white">deviceFingerprint = null</code>, mengembalikan status ke <strong className="text-amber-400">PENDING</strong>, serta otomatis mencatat entri ke audit log.
              </p>
            </div>

            <button
              type="submit"
              disabled={isResetting || !resetReason.trim() || availableLicensesForGame.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-red-600/30 cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? "animate-spin" : ""}`} />
              <span>{isResetting ? "Memproses Reset..." : "Eksekusi Reset Perangkat"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="glass-panel rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-950/40">
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-slate-300 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <span>Tabel Audit Log Reset Perangkat - {activeMappedGame} ({filteredLogs.length} Log)</span>
          </h3>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari audit log..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold animate-pulse">Memuat audit log reset...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
            <History className="w-10 h-10 text-slate-600 mb-1" />
            <p className="text-sm font-bold text-white">Belum Ada Riwayat Reset Untuk {activeMappedGame}</p>
            <p className="text-xs text-slate-500">Semua eksekusi pemindahan hardware akan tercatat secara permanen di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                  <th className="py-4 px-5">Dilakukan Oleh (Reset By)</th>
                  <th className="py-4 px-5">Target Klien / Game</th>
                  <th className="py-4 px-5">Fingerprint Lama (Old Fingerprint)</th>
                  <th className="py-4 px-5">Alasan Reset (Reason)</th>
                  <th className="py-4 px-5 text-right">Waktu Eksekusi (WIB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-bold text-white">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        {log.resetBy}
                      </span>
                    </td>

                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="font-bold text-white">{log.clientId || log.licenseId}</div>
                      <div className="text-[11px] text-purple-300 font-medium">{log.gameId || activeMappedGame}</div>
                    </td>

                    <td className="py-4 px-5 font-mono text-[11px] whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded bg-red-950/40 border border-red-500/30 text-red-300">
                        {log.oldFingerprint}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-slate-300 leading-relaxed max-w-xs">
                      {log.reason}
                    </td>

                    <td className="py-4 px-5 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {formatWIB(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
