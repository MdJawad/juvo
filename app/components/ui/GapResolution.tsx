'use client';

import React from 'react';
import { ResumeGap } from '@/lib/types';

interface GapResolutionProps {
  currentGap: ResumeGap | null;
  userInput: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export const GapResolution: React.FC<GapResolutionProps> = ({ currentGap, userInput, onInputChange, onSubmit, isLoading }) => {
  if (!currentGap) {
    return null;
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-md">
      <h3 className="font-bold text-lg text-blue-800">Addressing Gap: {currentGap.title}</h3>
      <p className="mt-2 text-sm text-gray-700">{currentGap.suggestedQuestion}</p>
      <form onSubmit={onSubmit} className="mt-4">
        <textarea
          value={userInput}
          onChange={onInputChange}
          placeholder="Your answer..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          disabled={isLoading || !userInput.trim()}
        >
          {isLoading ? 'Processing...' : 'Submit Answer'}
        </button>
      </form>
    </div>
  );
};
