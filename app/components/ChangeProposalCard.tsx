import { Check, X, Lightbulb } from 'lucide-react';
import { ChangeProposal } from '@/lib/types';

interface ChangeProposalCardProps {
  proposal: ChangeProposal;
  onAccept: () => void;
  onReject: () => void;
}

export function ChangeProposalCard({ proposal, onAccept, onReject }: ChangeProposalCardProps) {

  const renderValue = (value: any) => {
    if (typeof value !== 'string') {
      return <p>{JSON.stringify(value)}</p>;
    }
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return (
          <ul className="list-disc list-inside pl-2">
            {parsed.map((item, index) => (
              <li key={index} className="text-sm">{item}</li>
            ))}
          </ul>
        );
      }
      if (Array.isArray(parsed) && parsed.length === 0) {
        return <p className="text-sm italic text-gray-500">No items.</p>
      }
    } catch (e) {
      // Not a JSON string, just return it
    }
    return <p className="text-sm">{value || <span className="italic text-gray-500">No content.</span>}</p>;
  };


  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 my-4 shadow-md">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="ml-3 flex-grow">
          <h3 className="text-sm font-semibold text-yellow-800">Arete's Suggestion</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{proposal.description}</p>
          </div>
          
          <div className="mt-4 space-y-2 p-3 bg-white border border-gray-200 rounded-md">
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Before</h4>
              <div className="mt-1 p-2 bg-red-50 text-red-900 rounded-md">
                {renderValue(proposal.oldValue)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">After</h4>
              <div className="mt-1 p-2 bg-green-50 text-green-900 rounded-md">
                {renderValue(proposal.newValue)}
              </div>
            </div>
          </div>

        </div>
      </div>
      <div className="mt-4 flex justify-end space-x-3">
        <button
          onClick={onReject}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <X className="h-4 w-4 mr-2" />
          Reject
        </button>
        <button
          onClick={onAccept}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Check className="h-4 w-4 mr-2" />
          Accept
        </button>
      </div>
    </div>
  );
}
