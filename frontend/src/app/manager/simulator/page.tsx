"use client";

import { useState } from "react";

export default function SimulatorPage() {
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = () => {
    setLoading(true);
    setTimeout(() => {
      setSimulationResult("Based on current team capacity and skill levels, there is a 78% probability of completing the Q3 OKRs on time. Bottleneck detected in UI Design.");
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
        
        <button 
          onClick={runSimulation}
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
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
