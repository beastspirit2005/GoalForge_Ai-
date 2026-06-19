"use client";

import { useState, useEffect } from "react";

export default function WorkforceIntelligencePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Workforce Intelligence</h1>
        <p className="text-muted-foreground">AI-driven insights into team skills, gaps, and capacity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Critical Skill Gaps</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Advanced Kubernetes</p>
                <p className="text-sm text-muted-foreground">Required by 3 active targets</p>
              </div>
              <span className="text-destructive font-semibold">0 Experts</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Data Engineering</p>
                <p className="text-sm text-muted-foreground">Required by 1 active target</p>
              </div>
              <span className="text-destructive font-semibold">0 Experts</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Skill Inventory</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">React / Next.js</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold">4</span>
                <span className="text-xs text-muted-foreground">Employees</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Python / FastAPI</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold">3</span>
                <span className="text-xs text-muted-foreground">Employees</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
