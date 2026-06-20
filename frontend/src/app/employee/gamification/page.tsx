"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Trophy,
  Medal,
  Coins,
  ArrowRightLeft,
  Link2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  getGlobalLeaderboard,
  getMyPoints,
  getMyTransactions,
} from "@/services/enterprise.service";

type LeaderboardEntry = {
  rank: number;
  user_id: number;
  name: string;
  department: string;
  work_points: number;
  is_top_performer: boolean;
};

type PointsData = {
  db_points: number;
  chain_balance: number;
  is_synced: boolean;
};

type Transaction = {
  id: number;
  points_delta: number;
  reason: string;
  created_at: string | null;
};

export default function GamificationPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myPoints, setMyPoints] = useState<PointsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<"leaderboard" | "my-points">("leaderboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getGlobalLeaderboard().catch(() => []),
      getMyPoints().catch(() => null),
      getMyTransactions().catch(() => []),
    ])
      .then(([lb, pts, txns]) => {
        setLeaderboard(lb || []);
        setMyPoints(pts);
        setTransactions(txns || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const rankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const rankStyle = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-100 to-amber-50 dark:from-yellow-500/20 dark:to-amber-600/10 border-yellow-200 dark:border-yellow-500/30";
    if (rank === 2) return "bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-300/20 dark:to-slate-400/10 border-slate-200 dark:border-slate-300/30";
    if (rank === 3) return "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-700/20 dark:to-amber-800/10 border-amber-200 dark:border-amber-700/30";
    return "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06]";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Hero Section ── */}
        <section className="premium-panel relative overflow-hidden rounded-2xl p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[var(--gf-amber)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--gf-cyan)]/8 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[var(--gf-cyan)]" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-cyan)]">
                Gamification Hub
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white lg:text-4xl">
              🏆 Gamification
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/40">
              Leaderboards, work points, and blockchain-verified rewards.
            </p>
          </div>
        </section>

        {/* ── Tabs ── */}
        <div className="glass-card flex w-fit gap-1 rounded-lg p-1">
          {(["leaderboard", "my-points"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                tab === t
                  ? "bg-[var(--gf-indigo)] text-white shadow-lg shadow-[var(--gf-indigo)]/25"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              {t === "leaderboard" ? (
                <>
                  <Medal className="h-3.5 w-3.5" />
                  Leaderboard
                </>
              ) : (
                <>
                  <Coins className="h-3.5 w-3.5" />
                  My Points
                </>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="glass-card rounded-xl p-12 text-center text-white/30">
            Loading...
          </div>
        ) : tab === "leaderboard" ? (
          <section className="stagger-children space-y-2">
            {leaderboard.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <Trophy className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 font-medium text-white/90">Leaderboard is empty</p>
                <p className="mt-1 text-sm text-white/30">
                  Points will appear as employees complete goals.
                </p>
              </div>
            ) : (
              leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`glass-card-hover flex items-center gap-4 rounded-xl border p-4 transition-all hover:border-slate-300 dark:hover:border-white/[0.15] ${rankStyle(entry.rank)} text-slate-800 dark:text-white`}
                >
                  <div className="w-10 text-center text-2xl font-bold">
                    {rankIcon(entry.rank)}
                  </div>
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--gf-cyan)] to-[var(--gf-indigo)] text-xs font-bold text-white">
                    {entry.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900 dark:text-white/90">
                      {entry.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/30">{entry.department}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-400 dark:to-amber-500 bg-clip-text text-xl font-bold text-transparent">
                      {entry.work_points.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-white/30">points</p>
                  </div>
                </div>
              ))
            )}
          </section>
        ) : (
          <section className="stagger-children grid gap-6 md:grid-cols-2">
            {/* ── Points Card ── */}
            <div className="glass-card rounded-xl p-6">
              <div className="mb-4 flex items-center gap-2">
                <Coins className="h-4 w-4 text-[var(--gf-amber)]" />
                <h2 className="text-lg font-semibold text-white/90">
                  Your Work Points
                </h2>
              </div>

              {myPoints ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-5xl font-bold text-transparent">
                      {myPoints.db_points.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-white/30">Total Points</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="metric-card rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-white/90">
                        {myPoints.chain_balance}
                      </p>
                      <p className="flex items-center justify-center gap-1 text-[10px] text-white/30">
                        <Link2 className="h-3 w-3" />
                        Blockchain
                      </p>
                    </div>
                    <div className="metric-card rounded-lg p-3 text-center">
                      <p
                        className={`flex items-center justify-center gap-1 text-lg font-bold ${
                          myPoints.is_synced
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {myPoints.is_synced ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Synced
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Out of sync
                          </>
                        )}
                      </p>
                      <p className="text-[10px] text-white/30">Status</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-white/30">
                  No points data available.
                </p>
              )}
            </div>

            {/* ── Transactions ── */}
            <div className="glass-card rounded-xl p-6">
              <div className="mb-4 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-[var(--gf-cyan)]" />
                <h2 className="text-lg font-semibold text-white/90">
                  Recent Transactions
                </h2>
              </div>

              {transactions.length === 0 ? (
                <p className="p-4 text-center text-sm text-white/30">
                  No transactions yet.
                </p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {transactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="glass-card-hover flex items-center justify-between rounded-lg border border-white/[0.04] p-3 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize text-white/90">
                          {txn.reason.replace(/_/g, " ")}
                        </p>
                        <p className="text-[10px] text-white/30">
                          {txn.created_at?.split("T")[0]}
                        </p>
                      </div>
                      <span
                        className={`font-bold ${
                          txn.points_delta > 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {txn.points_delta > 0 ? "+" : ""}
                        {txn.points_delta}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
