"use client";

import { useState, useEffect } from "react";

export default function TeamLeaderboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gamification Leaderboard</h1>
        <p className="text-muted-foreground">Team rankings based on ForgeTokens and Work Points.</p>
      </div>

      <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
        <div className="p-6 pb-2">
          <h2 className="text-xl font-semibold">Top Performers</h2>
        </div>
        <div className="p-6">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 text-right">Work Points</th>
                <th className="px-4 py-3 text-right">ForgeTokens</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-3 font-bold text-lg">1</td>
                <td className="px-4 py-3 font-medium">Alex Johnson</td>
                <td className="px-4 py-3">Engineering</td>
                <td className="px-4 py-3 text-right">1,450</td>
                <td className="px-4 py-3 text-right font-mono text-primary">1,450.00 FT</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 font-bold text-lg">2</td>
                <td className="px-4 py-3 font-medium">Sarah Miller</td>
                <td className="px-4 py-3">Product</td>
                <td className="px-4 py-3 text-right">1,320</td>
                <td className="px-4 py-3 text-right font-mono text-primary">1,320.00 FT</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-lg">3</td>
                <td className="px-4 py-3 font-medium">David Chen</td>
                <td className="px-4 py-3">Engineering</td>
                <td className="px-4 py-3 text-right">980</td>
                <td className="px-4 py-3 text-right font-mono text-primary">980.00 FT</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
