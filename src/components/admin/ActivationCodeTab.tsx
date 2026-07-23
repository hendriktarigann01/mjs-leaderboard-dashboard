"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  RefreshCw,
  Search,
  Copy,
  Check,
  Share2,
  ExternalLink,
  CheckCircle2,
  Clock,
  X,
  Sparkles,
  Send
} from "lucide-react";
import {
  ActivationCode,
  License,
  fetchActivationCodes,
  fetchLicenses,
  createActivationCode,
  buildWhatsAppSalesLink,
  formatWIB
} from "@/lib/licenseService";
import { GameId, mapGameIdToLicenseGame } from "@/lib/dataService";
import { motion, AnimatePresence } from "framer-motion";

interface ActivationCodeTabProps {
  selectedGame: GameId;
}

export default function ActivationCodeTab({ selectedGame: activeHeaderGame }: ActivationCodeTabProps) {
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedLicenseId, setSelectedLicenseId] = useState("");
  const [generatedCodeResult, setGeneratedCodeResult] = useState<ActivationCode | null>(null);

  // Copy Feedback state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedWALink, setCopiedWALink] = useState(false);

  const activeMappedGame = mapGameIdToLicenseGame(activeHeaderGame);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [codesData, licData] = await Promise.all([
        fetchActivationCodes(),
        fetchLicenses()
      ]);
      setCodes(codesData);
      setLicenses(licData);
      if (licData.length > 0) {
        const targetLic = licData.find(l => l.gameId.toLowerCase().includes(activeMappedGame.toLowerCase())) || licData[0];
        if (targetLic) {
          setSelectedLicenseId(targetLic.id);
        }
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicenseId) return;

    const newCodeObj = await createActivationCode(selectedLicenseId);
    setGeneratedCodeResult(newCodeObj);
    loadData();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyWA = (codeObj: ActivationCode) => {
    const waUrl = buildWhatsAppSalesLink(codeObj.code, codeObj.clientName, codeObj.gameId);
    navigator.clipboard.writeText(waUrl);
    setCopiedWALink(true);
    setTimeout(() => setCopiedWALink(false), 2000);
  };

  const handleOpenWA = (codeObj: ActivationCode) => {
    const waUrl = buildWhatsAppSalesLink(codeObj.code, codeObj.clientName, codeObj.gameId);
    window.open(waUrl, "_blank");
  };

  const filteredCodes = codes.filter((item) => {
    const activeTarget = activeMappedGame.toLowerCase();
    const itemGame = (item.gameId || "").toLowerCase();

    const matchHeaderGame = 
      !item.gameId || 
      itemGame.length === 0 ||
      itemGame.includes(activeTarget) || 
      activeTarget.includes(itemGame) ||
      (activeTarget.includes("mole") && (itemGame.includes("mole") || itemGame.includes("whac"))) ||
      (activeTarget.includes("catch") && itemGame.includes("catch")) ||
      (activeTarget.includes("memory") && itemGame.includes("memory")) ||
      (activeTarget.includes("scream") && itemGame.includes("scream"));

    if (!matchHeaderGame) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.code.toLowerCase().includes(q) ||
      (item.clientName && item.clientName.toLowerCase().includes(q))
    );
  });

  const availableLicensesForGame = licenses.filter(l => {
    const target = activeMappedGame.toLowerCase();
    const g = l.gameId.toLowerCase();
    return g.includes(target) || target.includes(g) ||
      (target.includes("mole") && (g.includes("mole") || g.includes("whac"))) ||
      (target.includes("catch") && g.includes("catch")) ||
      (target.includes("memory") && g.includes("memory")) ||
      (target.includes("scream") && g.includes("scream"));
  });

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-xl flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari Kode Aktivasi / Client ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setGeneratedCodeResult(null);
              setIsGenerateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Buat Kode Aktivasi Baru</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Refresh Kode Aktivasi"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ACTIVATION CODE TABLE */}
      <div className="glass-panel rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Kode Aktivasi - {activeMappedGame} ({filteredCodes.length} Kode)</span>
          </h3>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold animate-pulse">Memuat daftar kode aktivasi...</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
            <Zap className="w-10 h-10 text-slate-600 mb-1" />
            <p className="text-sm font-bold text-white">Belum Ada Kode Aktivasi Untuk {activeMappedGame}</p>
            <p className="text-xs text-slate-500">Klik "Buat Kode Aktivasi Baru" untuk menerbitkan kode bagi game ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  <th className="py-4 px-5">Kode Aktivasi</th>
                  <th className="py-4 px-5">Target Lisensi / Client</th>
                  <th className="py-4 px-5">Game</th>
                  <th className="py-4 px-5 text-center">Status Terpakai</th>
                  <th className="py-4 px-5">Diterbitkan Pada</th>
                  <th className="py-4 px-5">Digunakan Pada</th>
                  <th className="py-4 px-5 text-right">Aksi & Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-200">
                {filteredCodes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/40 font-mono font-extrabold text-amber-400 text-sm tracking-wider shadow-inner">
                        {item.code}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-bold text-white whitespace-nowrap">
                      {item.clientName || item.licenseId}
                    </td>

                    <td className="py-4 px-5 text-purple-300 font-semibold whitespace-nowrap">
                      {item.gameId || activeMappedGame}
                    </td>

                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      {item.used ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-800 text-slate-400 border border-slate-700">
                          <CheckCircle2 className="w-3 h-3 text-slate-400" /> Sudah Terpakai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Clock className="w-3 h-3 text-emerald-400" /> Belum Terpakai
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      {formatWIB(item.createdAt)}
                    </td>

                    <td className="py-4 px-5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {item.usedAt ? formatWIB(item.usedAt) : "-"}
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCopyCode(item.code)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                          title="Salin Kode"
                        >
                          <Copy className="w-3 h-3 text-amber-400" />
                          <span>Salin Kode</span>
                        </button>

                        <button
                          onClick={() => handleOpenWA(item)}
                          className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                          title="Kirim ke WhatsApp Sales"
                        >
                          <Send className="w-3 h-3 text-emerald-400" />
                          <span>WA Sales</span>
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

      {/* GENERATE CODE MODAL */}
      <AnimatePresence>
        {isGenerateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700/80 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Generator Kode Aktivasi Singkat
                </h3>
                <button
                  onClick={() => {
                    setIsGenerateModalOpen(false);
                    setGeneratedCodeResult(null);
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!generatedCodeResult ? (
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Pilih Lisensi Target Klien ({activeMappedGame})</label>
                    {availableLicensesForGame.length === 0 ? (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                        Belum ada lisensi untuk game {activeMappedGame}. Tambahkan lisensi baru terlebih dahulu di tab Manajemen Lisensi.
                      </div>
                    ) : (
                      <select
                        value={selectedLicenseId}
                        onChange={(e) => setSelectedLicenseId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-semibold text-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        {availableLicensesForGame.map((lic) => (
                          <option key={lic.id} value={lic.id} className="bg-slate-900 text-white">
                            {lic.clientId} — {lic.gameId} ({lic.status})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sistem akan memproduksi kode unik singkat (6-8 karakter alfanumerik) yang terkunci secara khusus ke lisensi klien terpilih.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsGenerateModalOpen(false)}
                      className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={availableLicensesForGame.length === 0}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 disabled:opacity-40 text-white text-xs font-bold hover:from-amber-400 hover:to-orange-500 cursor-pointer shadow-lg shadow-amber-500/30"
                    >
                      Generate Kode Sekarang
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-center py-2">
                  <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Kode Aktivasi Berhasil Dibuat
                    </p>
                    <div className="text-2xl font-black font-mono tracking-widest text-white py-1">
                      {generatedCodeResult.code}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Lisensi: <strong className="text-white">{generatedCodeResult.clientName}</strong> ({generatedCodeResult.gameId})
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleCopyCode(generatedCodeResult.code)}
                      className="flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                      <span>{copiedCode ? "Tersalin!" : "Salin Kode"}</span>
                    </button>

                    <button
                      onClick={() => handleCopyWA(generatedCodeResult)}
                      className="flex items-center justify-center gap-2 p-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all cursor-pointer"
                    >
                      {copiedWALink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-emerald-400" />}
                      <span>{copiedWALink ? "Link WA Tersalin!" : "Salin Link WA"}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenWA(generatedCodeResult)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Buka Chat WhatsApp Sales Langsung</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
