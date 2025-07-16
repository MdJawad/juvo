import React, { useState, useEffect } from 'react';
import { ResumeData, WorkExperience } from '@/lib/types';

interface ResponseFormProps {
  responseType: 'relevant' | 'similar' | 'none';
  gapCategory: string;
  resumeData: Partial<ResumeData>;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const ResponseForm: React.FC<ResponseFormProps> = ({
  responseType,
  gapCategory,
  resumeData,
  value,
  onChange,
  onSubmit
}) => {
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [newTech, setNewTech] = useState<string>('');
  const [metrics, setMetrics] = useState<{[key: string]: string}>({
    impact: '',
    scale: ''
  });

  // Generate options for company selection
  const companyOptions = resumeData.experience?.map(exp => ({
    value: exp.company,
    label: exp.company
  })) || [];
  
  // Add a personal project option
  companyOptions.push({ value: 'Personal Project', label: 'Personal Project' });
  
  // Function to combine form data into a structured response
  const combineFormData = () => {
    let combinedResponse = '';
    
    if (responseType === 'relevant' || responseType === 'similar') {
      if (selectedCompany) {
        combinedResponse += `At ${selectedCompany}, I `;
      }
      
      combinedResponse += value;
      
      if (metrics.impact && metrics.scale) {
        combinedResponse += ` This resulted in ${metrics.impact} across ${metrics.scale}.`;
      } else if (metrics.impact) {
        combinedResponse += ` This resulted in ${metrics.impact}.`;
      } else if (metrics.scale) {
        combinedResponse += ` This was implemented across ${metrics.scale}.`;
      }
      
      if (technologies.length > 0) {
        combinedResponse += ` Technologies used: ${technologies.join(', ')}.`;
      }
    } else {
      // For "I don't have this experience" responses
      combinedResponse = value;
    }
    
    return combinedResponse;
  };
  
  // Update the combined response when form fields change
  useEffect(() => {
    const combined = combineFormData();
    onChange(combined);
  }, [selectedCompany, value, metrics, technologies]);
  
  // Add a new technology to the list
  const handleAddTechnology = () => {
    if (newTech && !technologies.includes(newTech)) {
      setTechnologies([...technologies, newTech]);
      setNewTech('');
    }
  };
  
  // Remove a technology from the list
  const handleRemoveTechnology = (tech: string) => {
    setTechnologies(technologies.filter(t => t !== tech));
  };
  
  // Get placeholder text based on gap category
  const getPlaceholderText = () => {
    if (responseType === 'none') {
      return "Explain why you don't have this experience and any alternative skills you might have...";
    }
    
    switch (gapCategory) {
      case 'technical_skills':
        return "Describe your experience with this technology...";
      case 'soft_skills':
        return "Describe how you've demonstrated this skill...";
      case 'experience':
        return "Describe your relevant experience starting with an action verb...";
      case 'achievements':
        return "Describe your achievement with quantifiable results...";
      case 'education':
        return "Describe your relevant education or training...";
      case 'summary':
        return "Describe your relevant background for this requirement...";
      default:
        return "Provide details about your experience...";
    }
  };
  
  return (
    <div className="mt-6 border border-gray-200 rounded-md p-4">
      <h3 className="text-base font-medium text-gray-900 mb-3">
        {responseType === 'relevant'
          ? 'Describe Your Relevant Experience'
          : responseType === 'similar'
          ? 'Describe Your Similar Experience'
          : 'Alternative Approach'}
      </h3>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Only show company selector for experience or achievements */}
        {(gapCategory === 'experience' || gapCategory === 'achievements') && 
         (responseType === 'relevant' || responseType === 'similar') && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Company or Project</label>
            <select 
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <option value="">Select a company or project</option>
              {companyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Main response field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {responseType === 'none' 
              ? 'Your Response' 
              : 'Description (Start with an action verb)'
            }
          </label>
          <textarea 
            rows={3} 
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={getPlaceholderText()}
            value={value}
            onChange={(e) => {
              // Simply pass the raw input value to parent component
              onChange(e.target.value);
            }}
          ></textarea>
        </div>
        
        {/* Only show metrics for relevant/similar responses */}
        {(responseType === 'relevant' || responseType === 'similar') && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Metrics & Impact</label>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <input 
                type="text" 
                placeholder="Impact (e.g., 20% increase in efficiency)" 
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={metrics.impact}
                onChange={(e) => setMetrics({...metrics, impact: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Scale (e.g., 100K daily users)" 
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={metrics.scale}
                onChange={(e) => setMetrics({...metrics, scale: e.target.value})}
              />
            </div>
          </div>
        )}
        
        {/* Only show technologies for technical skills or experience */}
        {(gapCategory === 'technical_skills' || gapCategory === 'experience') && 
         (responseType === 'relevant' || responseType === 'similar') && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Technologies Used</label>
            <div className="mt-1 flex items-center">
              <input 
                type="text" 
                placeholder="Add a technology" 
                className="block flex-1 py-2 px-3 border border-gray-300 bg-white rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTechnology();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTechnology}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add
              </button>
            </div>
            {technologies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {technologies.map(tech => (
                  <span key={tech} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                    {tech}
                    <button
                      type="button"
                      className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                      onClick={() => handleRemoveTechnology(tech)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={onSubmit}
            className="px-4 py-2 border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Submit Response
          </button>
        </div>
      </div>
    </div>
  );
};
