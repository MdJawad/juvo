import { ResumeGap, ResumeData, WorkExperience } from './types';
import { extractCompanyFromResponse, formatExperienceBullets, extractTechnicalSkills, formatSummaryParagraph } from './resume-formatter';

/**
 * Extract skills from text using the LLM-based API
 * @param text The text to extract skills from
 * @returns Promise resolving to an array of extracted skills
 */
async function extractSkillsWithLLM(text: string): Promise<string[]> {
  if (!text || text.trim().length === 0) {
    console.log('No text provided for LLM skill extraction, skipping.');
    return [];
  }
  try {
    console.log('Extracting skills with LLM, input length:', text?.length || 0);
    console.log('[LLM_SKILL_EXTRACTION] POST text snippet:', text.slice(0, 120));
    
    // Use window.location to build a full URL path
    const baseUrl = typeof window !== 'undefined' ? 
      `${window.location.protocol}//${window.location.host}` : '';
    const apiUrl = `${baseUrl}/api/extract-skills`;
    
    console.log('Calling API endpoint:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error('API response error details:', errorText);
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[LLM_SKILL_EXTRACTION] success, skills detected:', (data.skills || []).length, (data.skills || []));
    return data.skills || [];
  } catch (error) {
    console.error('Error extracting skills with LLM:', error);
    // Return empty array on error - fallback will handle this
    return [];
  }
}

/**
 * Interface for section update strategies
 * Strategy pattern for handling different types of resume updates
 */
export interface SectionUpdateStrategy {
  /**
   * Determines if this strategy can handle the update for the given gap and response
   */
  canHandle(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): boolean;
  
  /**
   * Gets the path to update in the resume data
   */
  getUpdatePath(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): string;
  
  /**
   * Formats the user response appropriately for this section type
   */
  formatValue(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>, path: string): any;
  
  /**
   * Returns the current value at the specified path in the resume data
   */
  getCurrentValue(path: string, resumeData: Partial<ResumeData>): any;
}

/**
 * Base class for section update strategies with common functionality
 */
abstract class BaseSectionUpdateStrategy implements SectionUpdateStrategy {
  abstract canHandle(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): boolean;
  abstract getUpdatePath(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): string;
  abstract formatValue(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>, path: string): any;
  
  /**
   * Get the current value at a given path in the resume data
   */
  getCurrentValue(path: string, resumeData: Partial<ResumeData>): any {
    const parts = path.split('.');
    let current: any = resumeData;
    
    for (const part of parts) {
      // Handle array paths like "experience[0]"
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      
      if (arrayMatch) {
        const [, arrayName, indexStr] = arrayMatch;
        const index = parseInt(indexStr, 10);
        
        if (!current[arrayName] || !Array.isArray(current[arrayName]) || index >= current[arrayName].length) {
          return undefined;
        }
        
        current = current[arrayName][index];
      } else if (current && current[part] !== undefined) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
}

/**
 * Strategy for updating work experience
 */
export class ExperienceUpdateStrategy extends BaseSectionUpdateStrategy {
  canHandle(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): boolean {
    // Handle experience gaps or responses that mention a company in the resume
    if (gap.category === 'experience') return true;
    
    // Check if any company from resume is mentioned
    const companyName = extractCompanyFromResponse(userResponse, resumeData);
    return companyName !== null;
  }
  
  getUpdatePath(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): string {
    // Try to extract company name
    const companyName = extractCompanyFromResponse(userResponse, resumeData);
    
    if (companyName) {
      const companyIndex = this.findCompanyIndex(companyName, resumeData);
      
      if (companyIndex >= 0) {
        return `experience[${companyIndex}].achievements`;
      }
    }
    
    // If no specific company found but it's an experience gap, 
    // update the most recent/relevant experience
    if (gap.category === 'experience' && resumeData.experience && resumeData.experience.length > 0) {
      // For simplicity, update the first experience entry
      // In a more sophisticated implementation, we could determine the most relevant one
      return 'experience[0].achievements';
    }
    
    // Fallback to career summary if no appropriate experience entry found
    return 'profile.careerSummary';
  }
  
  formatValue(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>, path: string): any {
    if (path.endsWith('.achievements')) {
      // Format as bullet points for experience achievements
      const bulletPoints = formatExperienceBullets(userResponse);
      
      // Get current achievements
      const currentAchievements = this.getCurrentValue(path, resumeData) || [];
      
      // Return combined achievements without duplicates
      return [...new Set([...currentAchievements, ...bulletPoints])];
    }
    
    // Default format for other experience fields
    return userResponse;
  }
  
  private findCompanyIndex(company: string, resumeData: Partial<ResumeData>): number {
    return resumeData.experience?.findIndex(exp => 
      exp.company === company || exp.company.includes(company) || company.includes(exp.company)
    ) ?? -1;
  }
}

/**
 * Strategy for updating technical or soft skills
 */
export class SkillsUpdateStrategy extends BaseSectionUpdateStrategy {
  canHandle(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): boolean {
    return gap.category === 'technical_skills' || gap.category === 'soft_skills';
  }
  
  getUpdatePath(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): string {
    if (gap.category === 'technical_skills') {
      return 'skills.technical';
    } else {
      return 'skills.soft';
    }
  }
  
  async formatValue(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>, path: string): Promise<any> {
    let skills: string[] = [];
    
    if (path === 'skills.technical') {
      // Try LLM-based extraction first
      try {
        const llmSkills = await extractSkillsWithLLM(userResponse);
        if (llmSkills && llmSkills.length > 0) {
          skills = llmSkills;
        } else {
          // Fallback to regex-based extraction
          console.warn('[SKILL_EXTRACTION] LLM returned no skills, falling back to regex extraction');
          skills = extractTechnicalSkills(userResponse);
        }
      } catch (error) {
        console.error('Error in LLM skill extraction, falling back to regex:', error);
        // Fallback to regex-based extraction
        skills = extractTechnicalSkills(userResponse);
      }
    } else {
      // Soft skills branch
      if (!userResponse || userResponse.trim().length === 0) {
        console.warn('[SKILL_EXTRACTION] Empty userResponse for soft skills; returning current skills as-is');
        const currentSkills = this.getCurrentValue(path, resumeData) || [];
        return currentSkills;
      }

      // Simple extraction – split on punctuation
      skills = userResponse
        .split(/[,.]/) 
        .map(s => s.trim())
        .filter(s => s.length > 10 && s.length < 50);
      
      // If nothing detected, use the raw response as a single skill token
      if (skills.length === 0) {
        skills = [userResponse.trim()];
      }
    }
    
    // Get current skills
    const currentSkills = this.getCurrentValue(path, resumeData) || [];
    
    console.log('[SKILL_EXTRACTION] current:', currentSkills, 'new:', skills, 'merged:', [...new Set([...currentSkills, ...skills])]);
    return [...new Set([...currentSkills, ...skills])];
    const finalSkills = [...new Set([...currentSkills, ...skills])];
  console.log('[SKILL_EXTRACTION] current:', currentSkills, 'new:', skills, 'merged:', finalSkills);
  return finalSkills;
  }
}

/**
 * Strategy for updating career summary
 */
export class SummaryUpdateStrategy extends BaseSectionUpdateStrategy {
  canHandle(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): boolean {
    return gap.category === 'summary';
  }
  
  getUpdatePath(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): string {
    return 'profile.careerSummary';
  }
  
  formatValue(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>, path: string): any {
    const currentSummary = this.getCurrentValue(path, resumeData);
    return formatSummaryParagraph(userResponse, currentSummary);
  }
}

/**
 * Strategy for updating education
 */
export class EducationUpdateStrategy extends BaseSectionUpdateStrategy {
  canHandle(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): boolean {
    return gap.category === 'education';
  }
  
  getUpdatePath(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): string {
    // For simplicity, update the first education entry
    // In a more sophisticated implementation, we could determine the appropriate entry
    if (resumeData.education && resumeData.education.length > 0) {
      return 'education[0].fieldOfStudy';
    }
    
    // Fallback to career summary if no education entries exist
    return 'profile.careerSummary';
  }
  
  formatValue(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>, path: string): any {
    // Simple format for now - in a real app, this would be more sophisticated
    return userResponse;
  }
}

/**
 * Strategy for updating achievements section
 */
export class AchievementsUpdateStrategy extends BaseSectionUpdateStrategy {
  canHandle(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): boolean {
    return gap.category === 'achievements';
  }
  
  getUpdatePath(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): string {
    // In a real resume structure, this might be a dedicated achievements section
    // For now, we'll add it to the most recent work experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      return `experience[0].achievements`;
    }
    
    // Fallback to career summary
    return 'profile.careerSummary';
  }
  
  formatValue(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>, path: string): any {
    if (path.endsWith('.achievements')) {
      // Format as bullet points
      const bulletPoints = formatExperienceBullets(userResponse);
      
      // Get current achievements
      const currentAchievements = this.getCurrentValue(path, resumeData) || [];
      
      // Return combined achievements without duplicates
      return [...new Set([...currentAchievements, ...bulletPoints])];
    }
    
    // Default format
    return userResponse;
  }
}

/**
 * Fallback strategy when no specific strategy applies
 */
export class FallbackUpdateStrategy extends BaseSectionUpdateStrategy {
  canHandle(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): boolean {
    // Fallback always handles any gap
    return true;
  }
  
  getUpdatePath(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): string {
    // Default to updating the career summary
    return 'profile.careerSummary';
  }
  
  formatValue(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>, path: string): any {
    const currentSummary = this.getCurrentValue(path, resumeData);
    
    if (currentSummary) {
      return `${currentSummary}\n\n${userResponse}`;
    }
    
    return userResponse;
  }
}

/**
 * Strategy registry for managing and selecting update strategies
 */
export class UpdateStrategyRegistry {
  private strategies: SectionUpdateStrategy[] = [];
  
  constructor() {
    // Register strategies in priority order (more specific first)
    this.registerStrategy(new ExperienceUpdateStrategy());
    this.registerStrategy(new SkillsUpdateStrategy());
    this.registerStrategy(new SummaryUpdateStrategy());
    this.registerStrategy(new EducationUpdateStrategy());
    this.registerStrategy(new AchievementsUpdateStrategy());
    this.registerStrategy(new FallbackUpdateStrategy()); // Always last
  }
  
  registerStrategy(strategy: SectionUpdateStrategy): void {
    this.strategies.push(strategy);
  }
  
  /**
   * Get the appropriate strategy for a given gap and user response
   */
  getStrategy(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>): SectionUpdateStrategy {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(gap, userResponse, resumeData)) {
        return strategy;
      }
    }
    
    // The fallback strategy should always be registered last and always return true for canHandle
    return this.strategies[this.strategies.length - 1];
  }
  
  /**
   * Generate a change proposal for a gap and user response
   */
  async generateChangeProposal(gap: ResumeGap, userResponse: string, resumeData: Partial<ResumeData>) {
    const strategy = this.getStrategy(gap, userResponse, resumeData);
    const path = strategy.getUpdatePath(gap, userResponse, resumeData);
    const oldValue = strategy.getCurrentValue(path, resumeData);
    const formattedValue = await Promise.resolve(strategy.formatValue(gap, userResponse, resumeData, path));
    
    return {
      path,
      oldValue,
      newValue: formattedValue,
      description: `Update based on gap: ${gap.title}`,
    };
  }
}

// Export a singleton instance of the registry
export const updateStrategyRegistry = new UpdateStrategyRegistry();
