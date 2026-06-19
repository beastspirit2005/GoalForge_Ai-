"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  getSkillProfile,
  uploadResume,
  getLearningRecommendations,
} from "@/services/enterprise.service";
import {
  GraduationCap,
  BarChart3,
  FileText,
  BookOpen,
  Search,
  CheckCircle2,
  Target,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

type SkillEntry = {
  skill_name: string;
  proficiency: number;
  base_source: string;
  verified_confidence: number;
  confidence_percentage: number;
  breakdown: {
    resume_confidence: number;
    task_based_confidence: number;
    milestone_confidence: number;
  };
};

type LearningRec = {
  required_skill: string;
  has_related_skill: string | null;
  recommendation: string;
  priority: string;
};

export default function SkillProfilePage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [learningRecs, setLearningRecs] = useState<LearningRec[]>([]);
  const [resumeText, setResumeText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"skills" | "resume" | "learning">("skills");

  const userId = user && "id" in user ? (user as any).id : 1;

  useEffect(() => {
    Promise.all([
      getSkillProfile(userId).catch(() => ({ skills: [] })),
      getLearningRecommendations(userId).catch(() => ({ recommendations: [] })),
    ])
      .then(([profile, recs]) => {
        setSkills(profile.skills || []);
        setLearningRecs(recs.recommendations || []);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleUploadResume = async () => {
    if (!resumeText.trim()) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await uploadResume(resumeText);
      setUploadResult(`✅ Extracted ${result.skills_extracted} skills: ${result.skills_added.join(", ")}`);
      const profile = await getSkillProfile(userId);
      setSkills(profile.skills || []);
    } catch {
      setUploadResult("❌ Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const confidenceBar = (value: number) => {
    const percent = value * 100;
    const color = percent >= 70 ? "from-emerald-500 to-teal-400" :
                  percent >= 40 ? "from-yellow-500 to-amber-400" :
                  "from-red-500 to-orange-400";
    return { width: `${percent}%`, className: `bg-gradient-to-r ${color}` };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Hero ── */}
        <section className="premium-panel relative overflow-hidden rounded-2xl p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[var(--gf-indigo)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--gf-cyan)]/8 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[var(--gf-cyan)]" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-cyan)]">
                Skill Intelligence
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Skill Intelligence
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/40">
              Your verified skill profile, resume analysis, and learning paths.
            </p>
          </div>
        </section>

        {/* ── Tabs ── */}
        <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 w-fit animate-fade-in-up">
          {(["skills", "resume", "learning"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                tab === t
                  ? "bg-[var(--gf-indigo)] text-white shadow-lg shadow-[var(--gf-indigo)]/25"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              {t === "skills" ? (
                <><BarChart3 className="h-3.5 w-3.5" /> Skills</>
              ) : t === "resume" ? (
                <><FileText className="h-3.5 w-3.5" /> Resume</>
              ) : (
                <><BookOpen className="h-3.5 w-3.5" /> Learning</>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="glass-card rounded-xl p-12 text-center text-white/30">
            Loading skill data...
          </div>
        ) : tab === "skills" ? (
          <div className="space-y-3 stagger-children">
            {skills.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <BarChart3 className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 font-medium text-white/90">No skills on profile yet</p>
                <p className="mt-1 text-sm text-white/30">
                  Upload your resume or add skills manually to build your profile.
                </p>
              </div>
            ) : (
              skills.map((skill) => {
                const bar = confidenceBar(skill.verified_confidence);
                return (
                  <div key={skill.skill_name} className="glass-card-hover rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white/90">{skill.skill_name}</h3>
                        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/30 capitalize">
                          {skill.base_source}
                        </span>
                      </div>
                      <span className="text-lg font-bold bg-gradient-to-r from-[var(--gf-cyan)] to-[var(--gf-indigo)] bg-clip-text text-transparent">
                        {skill.confidence_percentage}%
                      </span>
                    </div>

                    {/* Confidence Bar */}
                    <div className="h-2 w-full rounded-full bg-white/[0.06] mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${bar.className}`}
                        style={{ width: bar.width }}
                      />
                    </div>

                    {/* Breakdown */}
                    <div className="flex gap-4 text-[10px] text-white/30">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Resume: {(skill.breakdown.resume_confidence * 100).toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Tasks: {(skill.breakdown.task_based_confidence * 100).toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" /> Milestones: {(skill.breakdown.milestone_confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : tab === "resume" ? (
          <div className="glass-card rounded-xl p-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-[var(--gf-cyan)]" />
              <h2 className="text-lg font-semibold text-white/90">Upload Resume</h2>
            </div>
            <p className="text-sm text-white/30 mb-4">
              Paste your resume text below. AI will extract skills automatically and calculate confidence scores.
            </p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder={"Paste your resume text here...\n\nExample: Experienced software engineer with 5 years of experience in Python, React, Docker, and AWS. Built microservices using FastAPI and PostgreSQL..."}
              className="w-full h-48 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm outline-none transition-all placeholder:text-white/20 focus:border-[var(--gf-indigo)]/50 focus:ring-2 focus:ring-[var(--gf-indigo)]/20 resize-none"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleUploadResume}
                disabled={uploading || !resumeText.trim()}
                className="flex items-center gap-2 rounded-xl bg-[var(--gf-indigo)] px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--gf-indigo)]/25 transition-all hover:shadow-[var(--gf-indigo)]/40 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {uploading ? "Processing..." : "Analyze Resume"}
              </button>
              {uploadResult && (
                <span className="text-sm text-white/70">{uploadResult}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {learningRecs.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--gf-emerald)]" />
                <p className="mt-3 font-medium text-white/90">No skill gaps detected</p>
                <p className="mt-1 text-sm text-white/30">
                  Your current skills cover all assigned tasks.
                </p>
              </div>
            ) : (
              learningRecs.map((rec, idx) => (
                <div key={idx} className="glass-card-hover rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {rec.priority === "high" ? (
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gf-rose)]" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gf-amber)]" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white/90">{rec.required_skill}</h3>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          rec.priority === "high"
                            ? "bg-red-500/15 text-red-400 border-red-500/30"
                            : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-white/30 mt-1">{rec.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
