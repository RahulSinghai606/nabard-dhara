"use client";

// PulseChart — SVG cash-flow chart: 24-month history (income area, net line)
// + 6-month forecast with widening confidence band. Pure SVG, zero deps.

import React from "react";
import { MonthRow, ForecastPoint } from "@/lib/forecast";

export default function PulseChart({
  history,
  forecast,
  labels,
  height = 260,
}: {
  history: MonthRow[];
  forecast: ForecastPoint[];
  labels: { income: string; net: string; forecast: string };
  height?: number;
}) {
  const W = 980;
  const H = height;
  const PAD = { l: 54, r: 14, t: 18, b: 34 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;

  const nH = history.length;
  const total = nH + forecast.length;
  const x = (i: number) => PAD.l + (i / (total - 1)) * iw;

  const allVals = [
    ...history.map((r) => r.income),
    ...forecast.map((f) => f.hi),
    ...history.map((r) => r.net),
    ...forecast.map((f) => f.net),
    0,
  ];
  const maxV = Math.max(...allVals) * 1.08;
  const minV = Math.min(...allVals, 0) * 1.15;
  const y = (v: number) => PAD.t + ih - ((v - minV) / (maxV - minV)) * ih;

  const path = (pts: [number, number][]) => pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");

  const incHist: [number, number][] = history.map((r, i) => [x(i), y(r.income)]);
  const incFc: [number, number][] = [[x(nH - 1), y(history[nH - 1].income)], ...forecast.map((f, k) => [x(nH + k), y(f.income)] as [number, number])];
  const netHist: [number, number][] = history.map((r, i) => [x(i), y(r.net)]);
  const netFc: [number, number][] = [[x(nH - 1), y(history[nH - 1].net)], ...forecast.map((f, k) => [x(nH + k), y(f.net)] as [number, number])];

  const bandTop = forecast.map((f, k) => [x(nH + k), y(f.hi)] as [number, number]);
  const bandBot = forecast.map((f, k) => [x(nH + k), y(f.lo)] as [number, number]).reverse();
  const bandPath = `${path([[x(nH - 1), y(history[nH - 1].income)], ...bandTop])} L ${bandBot.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" L ")} Z`;

  const zeroY = y(0);
  const fcStartX = x(nH - 1);

  const tickEvery = 3;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Cash flow chart">
      {/* forecast zone */}
      <rect x={fcStartX} y={PAD.t} width={W - PAD.r - fcStartX} height={ih} fill="#7fc93f" opacity="0.06" />
      <line x1={fcStartX} y1={PAD.t} x2={fcStartX} y2={PAD.t + ih} stroke="#35a869" strokeDasharray="4 4" strokeWidth="1.4" opacity="0.7" />
      <text x={fcStartX + 8} y={PAD.t + 14} fontSize="12" fill="#1e7d46" fontWeight="700">{labels.forecast} →</text>

      {/* gridlines + y labels */}
      {[0.25, 0.5, 0.75].map((f) => {
        const v = minV + (maxV - minV) * f;
        return (
          <g key={f}>
            <line x1={PAD.l} y1={y(v)} x2={W - PAD.r} y2={y(v)} stroke="#dcead9" strokeWidth="1" />
            <text x={PAD.l - 8} y={y(v) + 4} fontSize="11" fill="#7d977f" textAnchor="end">₹{Math.round(v / 1000)}k</text>
          </g>
        );
      })}
      {/* zero line */}
      <line x1={PAD.l} y1={zeroY} x2={W - PAD.r} y2={zeroY} stroke="#d4553a" strokeWidth="1.2" strokeDasharray="2 4" opacity="0.7" />
      <text x={PAD.l - 8} y={zeroY + 4} fontSize="11" fill="#d4553a" textAnchor="end">₹0</text>

      {/* income history area */}
      <path d={`${path(incHist)} L ${x(nH - 1)} ${y(minV)} L ${x(0)} ${y(minV)} Z`} fill="url(#incFill)" opacity="0.5" />
      <defs>
        <linearGradient id="incFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#35a869" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#35a869" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* confidence band */}
      <path d={bandPath} fill="#1e7d46" opacity="0.13" />

      {/* income lines */}
      <path d={path(incHist)} fill="none" stroke="#1e7d46" strokeWidth="2.6" strokeLinejoin="round" />
      <path d={path(incFc)} fill="none" stroke="#1e7d46" strokeWidth="2.6" strokeDasharray="7 5" strokeLinejoin="round" />

      {/* net lines */}
      <path d={path(netHist)} fill="none" stroke="#0e5132" strokeWidth="2" opacity="0.85" strokeLinejoin="round" className="ecg-line" />
      <path d={path(netFc)} fill="none" stroke="#0e5132" strokeWidth="2" strokeDasharray="5 5" opacity="0.85" strokeLinejoin="round" />

      {/* negative forecast markers */}
      {forecast.map((f, k) =>
        f.net < 0 ? <circle key={k} cx={x(nH + k)} cy={y(f.net)} r="5" fill="#d4553a" stroke="#fff" strokeWidth="1.6" /> : null
      )}

      {/* x labels */}
      {[...history.map((r) => r.label), ...forecast.map((f) => f.label)].map((lb, i) =>
        i % tickEvery === 0 ? (
          <text key={i} x={x(i)} y={H - 10} fontSize="10.5" fill={i >= nH ? "#1e7d46" : "#7d977f"} textAnchor="middle" fontWeight={i >= nH ? 700 : 400}>
            {lb}
          </text>
        ) : null
      )}

      {/* legend */}
      <g transform={`translate(${PAD.l + 4}, ${PAD.t + 2})`} fontSize="11.5">
        <rect x="-4" y="-4" width="200" height="22" rx="6" fill="#ffffff" opacity="0.75" />
        <line x1="0" y1="6" x2="22" y2="6" stroke="#1e7d46" strokeWidth="3" />
        <text x="28" y="10" fill="#3f5c49">{labels.income}</text>
        <line x1="104" y1="6" x2="126" y2="6" stroke="#0e5132" strokeWidth="2.4" />
        <text x="132" y="10" fill="#3f5c49">{labels.net}</text>
      </g>
    </svg>
  );
}
