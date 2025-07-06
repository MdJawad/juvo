'use client';

import { useState } from 'react';

interface JobDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobDescription: string) => void;
  isLoading: boolean;
}

export default function JobDescriptionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: JobDescriptionModalProps) {
  const [jobDescription, setJobDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (jobDescription.trim()) {
      onSubmit(jobDescription);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl transform transition-all">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tailor Your Resume</h2>
        <p className="text-gray-600 mb-6">Paste the job description below. Arete will analyze it and help you customize your resume to highlight the most relevant skills and experiences.</p>
        
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Paste job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          disabled={isLoading}
        />

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-300"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            disabled={isLoading || !jobDescription.trim()}
          >
            {isLoading ? 'Analyzing...' : 'Analyze & Tailor'}
          </button>
        </div>
      </div>
    </div>
  );
}
