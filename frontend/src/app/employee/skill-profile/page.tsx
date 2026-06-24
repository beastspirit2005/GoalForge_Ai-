"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Search, Trash2, UploadCloud, GraduationCap, BarChart3, BookOpen, CheckCircle2, Target, AlertCircle, AlertTriangle, Paperclip } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getSkillProfile,
  uploadResume,
  getLearningRecommendations,
} from "@/services/enterprise.service";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  
  const [aiProvider, setAiProvider] = useState("gemini");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
      ];
      if (validTypes.includes(file.type) || file.name.endsWith(".pdf") || file.name.endsWith(".docx") || file.name.endsWith(".txt")) {
        if (file.size <= 5 * 1024 * 1024) {
          setSelectedFile(file);
          setUploadResult(null);
        } else {
          setUploadResult("❌ File size exceeds 5MB limit.");
        }
      } else {
        setUploadResult("❌ Invalid file format. Only PDF, DOCX, and TXT are supported.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size <= 5 * 1024 * 1024) {
        setSelectedFile(file);
        setUploadResult(null);
      } else {
        setUploadResult("❌ File size exceeds 5MB limit.");
      }
    }
  };

  const handleUploadResume = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await uploadResume(selectedFile, aiProvider, aiModel);
      setUploadResult(`Successfully parsed! Found ${result.skill_count} skills.`);
      setSelectedFile(null);
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
            <p className="text-sm text-white/30 mb-6">
              Upload your resume (.pdf, .docx, or .txt). The AI engine will parse the document semantically, extract your skills, and update your profile automatically.
            </p>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                dragActive
                  ? "border-[var(--gf-indigo)] bg-[var(--gf-indigo)]/5"
                  : selectedFile
                  ? "border-[var(--gf-emerald)]/50 bg-[var(--gf-emerald)]/5"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.04]"
              }`}
            >
              <input
                type="file"
                id="resume-file-input"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleChange}
              />

              {!selectedFile ? (
                <label
                  htmlFor="resume-file-input"
                  className="flex flex-col items-center justify-center cursor-pointer w-full h-full"
                >
                  <div className="rounded-full bg-white/[0.04] p-4 mb-3 border border-white/[0.06] transition-transform group-hover:scale-110">
                    <UploadCloud className="h-6 w-6 text-white/40" />
                  </div>
                  <p className="text-sm font-medium text-white/80">
                    Drag and drop your file here, or{" "}
                    <span className="text-[var(--gf-cyan)] hover:underline">browse</span>
                  </p>
                  <p className="text-xs text-white/20 mt-1.5">
                    Supports PDF, DOCX, and TXT up to 5MB
                  </p>
                </label>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <div className="rounded-full bg-[var(--gf-emerald)]/10 p-4 mb-3 border border-[var(--gf-emerald)]/20">
                    <Paperclip className="h-6 w-6 text-[var(--gf-emerald)]" />
                  </div>
                  <p className="text-sm font-semibold text-white/90 truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    {selectedFile.size < 1024 * 1024
                      ? `${(selectedFile.size / 1024).toFixed(2)} KB`
                      : `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                  </p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="mt-4 flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove File
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Select value={aiProvider} onValueChange={(val) => {
                setAiProvider(val)
                if (val === 'gemini') setAiModel('gemini-2.5-flash')
                else if (val === 'ollama') setAiModel('llama3:8b')
              }}>
                <SelectTrigger className="h-10 w-36 dark:bg-white/[0.04] dark:border-white/[0.08] text-white">
                  <SelectValue placeholder="AI Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="ollama">Ollama</SelectItem>
                </SelectContent>
              </Select>

              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger className="h-10 w-44 dark:bg-white/[0.04] dark:border-white/[0.08] text-white">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {aiProvider === 'gemini' ? (
                    <>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="llama3:8b">Llama 3 (8B)</SelectItem>
                      <SelectItem value="mistral:latest">Mistral</SelectItem>
                      <SelectItem value="qwen3.6:latest">Qwen 3.6</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              <button
                onClick={handleUploadResume}
                disabled={uploading || !selectedFile}
                className="flex items-center gap-2 rounded-xl bg-[var(--gf-indigo)] px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--gf-indigo)]/25 transition-all hover:shadow-[var(--gf-indigo)]/40 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {uploading ? "Processing with AI..." : "Analyze Resume"}
              </button>
              {uploadResult && (
                <span className="text-sm text-white/70 ml-2">{uploadResult}</span>
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
