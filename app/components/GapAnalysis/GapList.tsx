import React from 'react';
import { ResumeGap } from '@/lib/types';

interface GapListProps {
  gaps: ResumeGap[];
  currentGapIndex: number;
  addressedGaps: Set<string>;
  skippedGaps: Set<string>;
  onSelectGap: (index: number) => void;
}

const getPriorityClass = (priority: number): string => {
  switch (priority) {
    case 1: return 'border-l-4 border-red-500'; // High priority
    case 2: return 'border-l-4 border-orange-500'; // Medium priority
    case 3: return 'border-l-4 border-green-500'; // Low priority
    default: return 'border-l-4 border-gray-300';
  }
};

const getStatusBadge = (
  gapId: string, 
  isActive: boolean, 
  addressedGaps: Set<string>, 
  skippedGaps: Set<string>
) => {
  if (isActive) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
        In Progress
      </span>
    );
  }
  
  if (addressedGaps.has(gapId)) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        Addressed
      </span>
    );
  }
  
  if (skippedGaps.has(gapId)) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
        Skipped
      </span>
    );
  }
  
  return (
    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
      Not Started
    </span>
  );
};

const getGapItemClass = (
  gapId: string, 
  isActive: boolean, 
  addressedGaps: Set<string>, 
  skippedGaps: Set<string>
): string => {
  let className = "gap-item p-4 cursor-pointer flex items-center transition-all hover:translate-x-1 hover:shadow-md hover:bg-blue-50 border border-transparent";
  
  if (isActive) {
    className += " bg-blue-50 border-blue-300";
  } else if (addressedGaps.has(gapId)) {
    className += " bg-green-50 opacity-90 hover:bg-green-100";
  } else if (skippedGaps.has(gapId)) {
    className += " bg-gray-50 opacity-70 hover:bg-gray-100";
  }
  
  return className;
};

export const GapList: React.FC<GapListProps> = ({ 
  gaps, 
  currentGapIndex, 
  addressedGaps, 
  skippedGaps, 
  onSelectGap 
}) => {
  const totalGaps = gaps.length;
  const addressedCount = addressedGaps.size;
  const progressPercentage = totalGaps > 0 ? (addressedCount / totalGaps) * 100 : 0;
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg h-full flex flex-col">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          Identified Gaps ({totalGaps})
        </h2>
        <p className="text-sm text-gray-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-medium">Click on any gap to address it</span>
        </p>
      </div>
      
      <div className="divide-y divide-gray-200 overflow-y-auto flex-grow">
        {gaps.map((gap, index) => (
          <div
            key={gap.id}
            className={`${getGapItemClass(gap.id, index === currentGapIndex, addressedGaps, skippedGaps)} ${getPriorityClass(gap.priority)}`}
            onClick={() => onSelectGap(index)}
            role="button"
            aria-label={`Select gap: ${gap.title}`}
          >
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium">
                  {index + 1}. {gap.title}
                </h3>
                {getStatusBadge(gap.id, index === currentGapIndex, addressedGaps, skippedGaps)}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {gap.priority === 1 ? 'High' : gap.priority === 2 ? 'Medium' : 'Low'} Priority - {gap.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            Progress: {addressedCount}/{totalGaps} gaps addressed
          </span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
