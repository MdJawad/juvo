import { Phone, Mail, Linkedin, Github, Globe, GraduationCap, Briefcase, Award } from 'lucide-react';
import { ResumeData, UserProfile, WorkExperience, Education, Skills } from '@/lib/types';
import { clsx } from 'clsx';

interface ResumePreviewProps {
  resumeData: Partial<ResumeData>;
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

export function ResumePreview({ resumeData }: ResumePreviewProps) {
  const { 
    profile = {} as Partial<UserProfile>,
    experience = [] as Partial<WorkExperience>[],
    education = [] as Partial<Education>[],
    skills = { technical: [], soft: [] } as Partial<Skills>
  } = resumeData;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg h-full overflow-y-auto">
      <div className="p-8 text-sm text-gray-800 font-sans">
        {/* Header */}
        <div className="text-center border-b pb-4 mb-6">
          <h1 className="text-4xl font-bold text-gray-900">{profile.fullName || 'Your Name'}</h1>
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
            <p className="mt-2 text-sm leading-relaxed">{profile.careerSummary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-6">
            <SectionHeader title="Experience" />
            {experience.map((job, idx) => (
              <div key={job.id || idx} className={clsx("mt-3", idx !== experience.length - 1 && "mb-4")}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-md">{job.position}</h3>
                  <p className="text-xs font-medium text-gray-600">
                    {job.startDate} - {job.endDate || 'Present'}
                  </p>
                </div>
                <h4 className="font-medium text-sm text-blue-700">
                  {job.company}
                  {job.location && <span className="text-gray-600"> • {job.location}</span>}
                </h4>
                {job.achievements && job.achievements.length > 0 && (
                  <ul className="list-disc list-outside ml-5 mt-1 space-y-1 text-sm">
                    {job.achievements.map((achievement, index) => (
                      <li key={index} className="text-gray-700">{achievement}</li>
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
                  <h3 className="font-semibold text-md">{edu.degree}</h3>
                  <p className="text-xs font-medium text-gray-600">
                    {edu.startDate} - {edu.endDate}
                  </p>
                </div>
                <h4 className="font-medium text-sm text-blue-700">
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
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
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