import React from 'react';
import { ResumeData, ChangeProposal } from '@/lib/types';

interface ResumePreviewProps {
  proposedChange: ChangeProposal | null;
  resumeData?: Partial<ResumeData>;
  onAccept?: () => void;
  onReject?: () => void;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  proposedChange,
  onAccept,
  onReject
}) => {
  if (!proposedChange) return null;

  // Function to get the section title based on the path
  const getSectionTitle = (path: string): string => {
    if (path.startsWith('profile.')) {
      return 'Career Summary';
    } else if (path.startsWith('experience')) {
      return 'Work Experience';
    } else if (path.startsWith('skills.technical')) {
      return 'Technical Skills';
    } else if (path.startsWith('skills.soft')) {
      return 'Soft Skills';
    } else if (path.startsWith('education')) {
      return 'Education';
    } else {
      return 'Resume Section';
    }
  };

  // Format the current value for display
  const formatCurrentValue = (value: any): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
          {value.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    } else if (typeof value === 'string') {
      return <p className="mt-1">{value || 'No current content'}</p>;
    } else {
      return <p className="mt-1 italic text-gray-500">No current content</p>;
    }
  };

  // Format the new value for display, highlighting additions
  const formatNewValue = (oldValue: any, newValue: any): React.ReactNode => {

    if (Array.isArray(newValue)) {
      // For arrays (like skills or experience bullets), highlight new items
      const oldItems = Array.isArray(oldValue) ? oldValue : [];
      return (
        <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
          {newValue.map((item, idx) => {
            const isNew = !oldItems.includes(item);
            return (
              <li 
                key={idx} 
                className={isNew ? "bg-blue-50 dark:bg-blue-800 font-medium dark:text-white" : ""}
              >
                {item}
              </li>
            );
          })}
        </ul>
      );
    } else if (typeof newValue === 'string') {
      // For simple strings, just show the new value
      // In a more sophisticated version, we could highlight the differences
      return <p className="mt-1">{newValue}</p>;
    } else {
      return <p className="mt-1 italic text-gray-500">No update content</p>;
    }
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-900 dark:text-white">Resume Update Preview</h3>
        <div>
          <button 
            className="px-3 py-1 text-xs bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            onClick={() => {/* Could add edit functionality here */}}
          >
            Edit
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Current {getSectionTitle(proposedChange.path)}
            </h4>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 rounded text-sm">
              {formatCurrentValue(proposedChange.oldValue)}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Updated {getSectionTitle(proposedChange.path)}
            </h4>
            <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm dark:text-gray-100">
              {formatNewValue(proposedChange.oldValue, proposedChange.newValue)}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={onReject}
          >
            Reject
          </button>
          <button 
            className="px-4 py-2 border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={onAccept}
          >
            Accept Changes
          </button>
        </div>
      </div>
    </div>
  );
};
