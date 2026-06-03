"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = () => {
      const cookies = document.cookie.split(";");
      const sessionCookie = cookies.find((c) =>
        c.trim().startsWith("mjs_admin_session="),
      );
      const localSession = localStorage.getItem("mjs_admin_session");

      if (sessionCookie || localSession === "authenticated_mjs_admin") {
        if (!sessionCookie) {
          document.cookie =
            "mjs_admin_session=authenticated_mjs_admin; path=/; max-age=86400; SameSite=Strict";
        }
        router.replace("/");
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (password === "mjsadmin2026") {
        document.cookie =
          "mjs_admin_session=authenticated_mjs_admin; path=/; max-age=86400; SameSite=Strict";
        localStorage.setItem("mjs_admin_session", "authenticated_mjs_admin");

        router.replace("/");
      } else {
        setError("Kata sandi admin tidak valid!");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#540EE1] rounded-full blur-[120px] opacity-30 pointer-events-none" />
      <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-[#AB7FEB] rounded-full blur-[100px] opacity-20 pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute w-2 h-2 rounded-full bg-[#AB7FEB] top-[10%] left-[30%] animate-ping duration-1000" />
        <div className="absolute w-3 h-3 rounded-full bg-[#540EE1] top-[75%] left-[80%] animate-pulse" />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-white top-[40%] left-[70%] animate-ping" />
      </div>

      <div className="w-full max-w-md p-6 z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#540EE1] to-[#AB7FEB] flex items-center justify-center shadow-lg shadow-[#540EE1]/30 border border-white/10 mb-4 animate-bounce">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
            MJS Leaderboard
          </h1>
          <p className="text-sm text-gray-400 mt-2 font-medium tracking-wide">
            ADMIN DASHBOARD SYSTEM
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#AB7FEB] to-transparent" />

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-[#AB7FEB] uppercase tracking-wider mb-2">
                Kata Sandi Admin
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="block w-full pl-11 pr-11 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#540EE1] focus:border-transparent transition-all duration-300 text-sm font-mono tracking-widest"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#AB7FEB] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-950/40 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium animate-shake">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-[#540EE1] to-[#AB7FEB] hover:from-[#490cc4] hover:to-[#9a6ee0] text-white font-bold rounded-2xl shadow-lg shadow-[#540EE1]/20 hover:shadow-[#540EE1]/40 border border-white/10 transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Masuk Dashboard"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-8 font-medium">
          © {new Date().getFullYear()} MJS Games. All rights reserved.
        </p>
      </div>
    </div>
  );
}
