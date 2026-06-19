"use client";

import { useState, useEffect } from "react";

export default function TargetsPage() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app this would fetch from /api/tasks/targets
    setLoading(false);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizational Targets</h1>
          <p className="text-muted-foreground">Manage top-level OKRs and strategic objectives.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
          Create Target
        </button>
      </div>

      {loading ? (
        <p>Loading targets...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {targets.length === 0 ? (
            <div className="col-span-full text-center p-12 border rounded-lg bg-card text-card-foreground shadow-sm">
              <h3 className="text-lg font-medium">No Targets Found</h3>
              <p className="text-muted-foreground mt-2">Get started by creating a new organizational target.</p>
            </div>
          ) : (
            targets.map((target: any) => (
              <div key={target.id} className="border rounded-lg p-4 bg-card text-card-foreground shadow-sm">
                <h3 className="font-semibold text-lg">{target.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{target.description}</p>
                <div className="mt-4 flex justify-between items-center text-sm">
                  <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs">
                    {target.status}
                  </span>
                  <span>{target.progress}% Complete</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
