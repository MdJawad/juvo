import { Phone, Mail, Linkedin, Github, Globe, GraduationCap, Briefcase, Award, Download, Loader2 } from 'lucide-react';
import { ResumeData, UserProfile, WorkExperience, Education, Skills, ChangeProposal } from '@/lib/types';
import { generatePDF } from '@/lib/pdfUtils';
import { useState, useRef } from 'react';
import { clsx } from 'clsx';

interface ResumePreviewProps {
  resumeData: Partial<ResumeData>;
  proposedChange: ChangeProposal | null;
}

// Helper component for section headers
function SectionHeader({ title }: { title: string }) {
  return (
    <>
      <h2 className="text-lg font-bold uppercase tracking-wider text-gray-700 flex items-center">
        {title === 'Experience' && <Briefcase className="mr-2 h-5 w-5" />}
        {title === 'Education' && <GraduationCap className="mr-2 h-5 w-5" />}
        {title === 'Skills' && <Award className="mr-2 h-5 w-5" />}
        {title}
      </h2>
      <div className="h-0.5 bg-gray-200 my-2"></div>
    </>
  );
}

export function ResumePreview({ resumeData, proposedChange }: ResumePreviewProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  // With html2canvas-pro, we can directly use the resume content
  // No need for complex DOM manipulation since the library supports oklch colors
  
  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    
    try {
      setIsGeneratingPDF(true);
      
      const fileName = `${resumeData.profile?.fullName || 'resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Generate PDF directly from the resume content
      // html2canvas-pro supports oklch color functions
      await generatePDF(resumeRef.current, fileName, resumeData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  const { 
    profile = {} as Partial<UserProfile>,
    experience = [] as Partial<WorkExperience>[],
    education = [] as Partial<Education>[],
    skills = { technical: [], soft: [] } as Partial<Skills>
  } = resumeData;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg h-full overflow-y-auto relative">
      {/* Download PDF Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          aria-label="Download Resume as PDF"
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>
      
      <div ref={resumeRef} className="p-8 text-sm text-gray-800 font-sans">
        {/* Header */}
        <div className="text-center border-b pb-4 mb-6">
                    <h1 className={clsx("text-4xl font-bold text-gray-900", proposedChange?.path === 'profile.fullName' && 'bg-yellow-200 rounded p-1')}>{profile.fullName || 'Your Name'}</h1>
          <div className="flex justify-center items-center space-x-4 mt-2 text-xs text-gray-600">
            {profile.email && <span className="flex items-center"><Mail className="mr-1.5 h-3 w-3" />{profile.email}</span>}
            {profile.phone && <span className="flex items-center"><Phone className="mr-1.5 h-3 w-3" />{profile.phone}</span>}
          </div>
          <div className="flex justify-center items-center space-x-4 mt-1 text-xs text-blue-600">
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-800">
                <Linkedin className="mr-1.5 h-3 w-3" />LinkedIn
              </a>
            )}
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-800">
                <Github className="mr-1.5 h-3 w-3" />GitHub
              </a>
            )}
            {profile.portfolio && (
              <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-800">
                <Globe className="mr-1.5 h-3 w-3" />Portfolio
              </a>
            )}
          </div>
        </div>

        {/* Summary */}
        {profile.careerSummary && (
          <div className="mb-6">
            <SectionHeader title="Summary" />
                        <p className={clsx("mt-2 text-sm leading-relaxed", proposedChange?.path === 'profile.careerSummary' && 'bg-yellow-200 rounded p-1')}>{profile.careerSummary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-6">
            <SectionHeader title="Experience" />
            {experience.map((job, idx) => (
              <div key={job.id || idx} className={clsx("mt-3", idx !== experience.length - 1 && "mb-4")}>
                <div className="flex justify-between items-baseline">
                                    <h3 className={clsx("font-semibold text-md", proposedChange?.path === `experience[${idx}].position` && 'bg-yellow-200 rounded p-1')}>{job.position}</h3>
                  <p className="text-xs font-medium text-gray-600">
                    {job.startDate} - {job.endDate || 'Present'}
                  </p>
                </div>
                <h4 className={clsx("font-medium text-sm text-blue-700", proposedChange?.path === `experience[${idx}].company` && 'bg-yellow-200 rounded p-1')}>
                  {job.company}
                  {job.location && <span className="text-gray-600"> • {job.location}</span>}
                </h4>
                {job.achievements && job.achievements.length > 0 && (
                  <ul className="list-disc list-outside ml-5 mt-1 space-y-1 text-sm">
                    {job.achievements.map((achievement, index) => (
                                            <li 
                        key={index} 
                        className={clsx(
                          "text-gray-700",
                          proposedChange?.path === `experience[${idx}].achievements[${index}]` && 'bg-yellow-200 rounded p-1'
                        )}>
                          {achievement}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-6">
            <SectionHeader title="Education" />
            {education.map((edu, idx) => (
              <div key={edu.id || idx} className={clsx("mt-3", idx !== education.length - 1 && "mb-4")}>
                <div className="flex justify-between items-baseline">
                                    <h3 className={clsx("font-semibold text-md", proposedChange?.path === `education[${idx}].degree` && 'bg-yellow-200 rounded p-1')}>{edu.degree}</h3>
                  <p className="text-xs font-medium text-gray-600">
                    {edu.startDate} - {edu.endDate}
                  </p>
                </div>
                <h4 className={clsx("font-medium text-sm text-blue-700", proposedChange?.path === `education[${idx}].institution` && 'bg-yellow-200 rounded p-1')}>
                  {edu.institution}
                  {edu.fieldOfStudy && <span className="text-gray-600"> • {edu.fieldOfStudy}</span>}
                </h4>
                {edu.gpa && <p className="text-sm text-gray-600 mt-1">GPA: {edu.gpa}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {((skills.technical && skills.technical.length > 0) || (skills.soft && skills.soft.length > 0)) && (
          <div className="mb-6">
            <SectionHeader title="Skills" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.technical && skills.technical.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Technical Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.technical.map((skill, index) => (
                                            <span
                        key={index}
                        className={clsx(
                          "px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium",
                          proposedChange?.path === `skills.technical[${index}]` && 'ring-2 ring-yellow-400'
                        )}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skills.soft && skills.soft.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Soft Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.soft.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 