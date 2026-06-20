"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, SearchX, Sparkles } from "lucide-react";
import { searchTalent } from "@/services/enterprise.service";

type TalentResult = {
  user_id: number;
  name: string;
  department: string;
  matched_skills: { skill: string; proficiency: number; confidence: number; composite_score: number }[];
  match_count: number;
  total_count: number;
  match_percentage: number;
  aggregate_score: number;
};

export default function TalentSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TalentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchTalent(query);
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero */}
        <section className="premium-panel relative overflow-hidden rounded-2xl p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[var(--gf-indigo)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--gf-cyan)]/8 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[var(--gf-cyan)]" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-cyan)]">
                Talent search
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Talent Search
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/40">
              Find the right people by skills with AI-powered ranking.
            </p>
          </div>
        </section>

        {/* Search Bar + Quick Chips */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white/90">Search Skills</h2>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search skills (e.g. React, Python, Docker)..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm outline-none transition-all placeholder:text-white/30 focus:border-[var(--gf-indigo)]/50 focus:ring-2 focus:ring-[var(--gf-indigo)]/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">
                comma-separated
              </span>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="rounded-xl bg-[var(--gf-indigo)] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[var(--gf-indigo)]/25 transition-all hover:shadow-[var(--gf-indigo)]/40 disabled:opacity-50"
            >
              {loading ? (
                "Searching..."
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </span>
              )}
            </button>
          </div>

          {/* Quick Chips */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <Sparkles className="h-3 w-3" />
              Quick:
            </span>
            {["Java, Spring Boot", "Figma, UI/UX", "C++, Systems Programming", "Content Writing, SEO", "React, TypeScript", "Agile, Scrum"].map(
              (chip) => (
                <button
                  key={chip}
                  onClick={() => { setQuery(chip); }}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/30 transition-all hover:border-[var(--gf-indigo)]/40 hover:text-white/90"
                >
                  {chip}
                </button>
              )
            )}
          </div>
        </div>

        {/* Results */}
        <section className="animate-fade-in-up">
          {loading ? (
            <div className="glass-card rounded-xl p-12 text-center text-white/30">
              <Search className="mx-auto h-8 w-8 animate-pulse text-[var(--gf-indigo)]" />
              <p className="mt-3 text-sm font-medium">Searching talent pool...</p>
            </div>
          ) : searched && results.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <SearchX className="mx-auto h-10 w-10 text-white/20" />
              <p className="mt-3 font-medium text-white/90">No matches found</p>
              <p className="mt-1 text-sm text-white/30">Try different skill combinations.</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3 stagger-children">
              {results.map((person, idx) => (
                <div
                  key={person.user_id}
                  className="glass-card-hover rounded-xl p-5"
                >
                  <div className="flex items-start gap-4">
                    {/* Rank Badge */}
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-bold text-sm ${
                      idx === 0 ? "bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/30" :
                      idx === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white" :
                      idx === 2 ? "bg-gradient-to-br from-amber-700 to-amber-800 text-white" :
                      "bg-white/[0.06] text-white/30"
                    }`}>
                      #{idx + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white/90">{person.name}</h3>
                        <span className="rounded-full bg-[var(--gf-indigo)]/15 border border-[var(--gf-indigo)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--gf-indigo)]">
                          {person.match_percentage}% match
                        </span>
                      </div>
                      <p className="text-sm text-white/30">{person.department}</p>

                      {/* Skill Tags */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {person.matched_skills.map((s) => (
                          <div
                            key={s.skill}
                            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1"
                          >
                            <span className="text-xs font-medium text-white/90">{s.skill}</span>
                            <span className="text-[10px] text-white/30">
                              {s.proficiency}% prof · {(s.confidence * 100).toFixed(0)}% conf
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-bold bg-gradient-to-r from-[var(--gf-cyan)] to-[var(--gf-indigo)] bg-clip-text text-transparent">
                        {person.aggregate_score}
                      </p>
                      <p className="text-[10px] text-white/30">score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </DashboardLayout>
  );
}
