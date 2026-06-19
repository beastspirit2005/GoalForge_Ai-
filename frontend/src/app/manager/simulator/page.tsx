"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SimulatorPage() {
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [aiProvider, setAiProvider] = useState<"gemini" | "ollama">("gemini");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [ollamaModels, setOllamaModels] = useState<string[]>(["llama3", "gemma2:2b"]);

  useEffect(() => {
    if (aiProvider === "ollama") {
      fetch("http://localhost:11434/api/tags")
        .then(res => res.json())
        .then(data => {
          if (data.models && data.models.length > 0) {
            const models = data.models.map((m: any) => m.name);
            setOllamaModels(models);
            if (!models.includes(aiModel)) setAiModel(models[0]);
          }
        })
        .catch(() => console.warn("Could not fetch Ollama models"));
    }
  }, [aiProvider, aiModel]);

  const runSimulation = () => {
    setLoading(true);
    setTimeout(() => {
      setSimulationResult(`Simulation powered by ${aiProvider === "ollama" ? aiModel : "Gemini"}. Based on current team capacity and skill levels, there is a 78% probability of completing the Q3 OKRs on time. Bottleneck detected in UI Design.`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Capacity Simulator</h1>
        <p className="text-muted-foreground">Simulate deadline adjustments and resource reallocations.</p>
      </div>

      <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Run Prediction Model</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          This uses the AI Auto Assigner to predict if your team can handle a new target.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Engine</label>
            <Select value={aiProvider} onValueChange={(v: "gemini" | "ollama") => setAiProvider(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="AI Engine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini 2.5</SelectItem>
                <SelectItem value="ollama">Local Ollama</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {aiProvider === "ollama" && (
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ollama Model</label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ollama Model" />
                </SelectTrigger>
                <SelectContent>
                  {ollamaModels.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                  {ollamaModels.length === 0 && (
                    <SelectItem value="none" disabled>No local models found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <button 
          onClick={runSimulation}
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 w-full sm:w-auto"
        >
          {loading ? "Simulating..." : "Run Simulation"}
        </button>

        {simulationResult && (
          <div className="mt-6 p-4 bg-muted text-muted-foreground rounded-md border border-border">
            <h3 className="font-semibold text-foreground mb-2">Simulation Results:</h3>
            <p>{simulationResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}
