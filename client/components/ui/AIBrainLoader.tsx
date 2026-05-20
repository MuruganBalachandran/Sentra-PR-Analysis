"use client";
import React from 'react';

export function AIBrainLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  };
  const cls = sizeMap[size];

  return (
    <div className={`relative flex items-center justify-center ${cls}`}>
      {/* Outer spinning ring representing thoughts/connections */}
      <div className="absolute inset-0 border-[3px] border-t-indigo-600 border-r-indigo-400 border-b-indigo-200 border-l-transparent rounded-full animate-spin"></div>
      
      {/* Center core representing the AI Brain */}
      <div className="absolute w-1/2 h-1/2 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg shadow-lg rotate-45 flex items-center justify-center animate-pulse">
        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
      </div>
    </div>
  );
}
