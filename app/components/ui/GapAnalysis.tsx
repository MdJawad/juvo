'use client';

import React from 'react';
import { GapAnalysisResult } from '@/lib/types';

interface GapAnalysisProps {
  gapAnalysis: GapAnalysisResult | null;
}

export const GapAnalysis: React.FC<GapAnalysisProps> = ({ gapAnalysis }) => {
  if (!gapAnalysis || !gapAnalysis.gaps || gapAnalysis.gaps.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Resume Gap Analysis</h2>
      <p className="mb-4">Overall Fit: {gapAnalysis.summary.overallMatch}%</p>
      <ul className="space-y-4">
        {gapAnalysis.gaps.map((gap, index) => (
          <li key={index} className="p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="font-bold text-lg">{gap.title}</h3>
            <p className="text-sm text-gray-600">{gap.description}</p>
            <div className="mt-2 text-xs">
              <span className="font-semibold">Priority:</span> {gap.priority === 1 ? 'High' : gap.priority === 2 ? 'Medium' : 'Low'}
              <span className="ml-4 font-semibold">Category:</span> {gap.category}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
