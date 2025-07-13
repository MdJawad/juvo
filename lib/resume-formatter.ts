import { ResumeData, WorkExperience } from './types';

/**
 * Helper functions for formatting user responses into appropriate resume sections
 */

/**
 * Extract company name from user response
 * @param response User's response text
 * @param resumeData Current resume data to match against
 * @returns Company name if found, or null
 */
export function extractCompanyFromResponse(response: string, resumeData: Partial<ResumeData>): string | null {
  // Check if the response mentions a company name that exists in the resume
  const companies = resumeData.experience?.map(exp => exp.company.toLowerCase()) || [];
  
  // Create a regex pattern for each company name
  for (const company of companies) {
    // Look for company names in the response, accounting for partial matches and Inc/LLC variations
    const companyRegex = new RegExp(`${company.replace(/\s+/g, '\\s+').replace(/[.,]/g, '\\$&')}\\s*(inc|solutions|corp|llc)?`, 'i');
    if (companyRegex.test(response)) {
      // Return the actual company name from the resume, not the matched text
      return resumeData.experience?.find(exp => exp.company.toLowerCase() === company)?.company || null;
    }
  }

  return null;
}

/**
 * Find the index of a company in the resume experience array
 * @param company Company name
 * @param resumeData Current resume data
 * @returns Index of the company or -1 if not found
 */
export function findCompanyIndex(company: string, resumeData: Partial<ResumeData>): number {
  return resumeData.experience?.findIndex(exp => exp.company === company) || -1;
}

/**
 * Format a user response into bullet points for work experience
 * @param response User's detailed response
 * @returns Array of formatted bullet points
 */
export function formatExperienceBullets(response: string): string[] {
  // Split into sentences
  const sentences = response
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // Group into 1-2 bullet points
  const bullets: string[] = [];
  let currentBullet = '';
  
  for (const sentence of sentences) {
    // Skip sentences that are too short or likely part of another context
    if (sentence.length < 15 || /^(I did this|This was at|While working at)/i.test(sentence)) continue;
    
    // If the bullet is empty, start with an action verb
    if (!currentBullet) {
      // Check if sentence starts with an action verb, if not add one
      if (/^(Implemented|Developed|Built|Created|Designed|Led|Managed|Optimized|Used|Maintained)/i.test(sentence)) {
        currentBullet = sentence;
      } else {
        // Add a suitable action verb
        if (/database|data|storage|index/i.test(sentence)) {
          currentBullet = `Implemented ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`;
        } else if (/app|application|system|platform/i.test(sentence)) {
          currentBullet = `Developed ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`;
        } else {
          currentBullet = `Built ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`;
        }
      }
    } else {
      // If we already have content, append this sentence
      currentBullet += `, ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`;
    }
    
    // If the bullet is getting long or we're at the last sentence, finalize it
    if (currentBullet.length > 100 || sentence === sentences[sentences.length - 1]) {
      bullets.push(currentBullet);
      currentBullet = '';
    }
  }
  
  // Make sure we've added the last bullet if it has content
  if (currentBullet) {
    bullets.push(currentBullet);
  }
  
  // If we couldn't generate bullets (e.g., response was too short), create a generic one
  if (bullets.length === 0 && response.length > 20) {
    bullets.push(`Implemented ${response.split(' ').slice(0, 10).join(' ')}...`);
  }
  
  // Add bullet point markers
  return bullets.map(bullet => {
    // Ensure the bullet starts with a capital letter
    const formattedBullet = bullet.charAt(0).toUpperCase() + bullet.slice(1);
    // Add a period if there isn't one
    return formattedBullet.endsWith('.') ? formattedBullet : `${formattedBullet}.`;
  });
}

/**
 * Extract and format technical skills from a user response
 * @param response User's detailed response about technical skills
 * @returns Array of formatted skill entries
 */
export function extractTechnicalSkills(response: string): string[] {
  // Common technical skills patterns (databases, frameworks, tools)
  const techPatterns = [
    /\b(SQL|NoSQL|MongoDB|PostgreSQL|MySQL|Redis|Oracle|Cassandra)\b/gi,
    /\b(React|Angular|Vue|Svelte|Next\.?js|Node\.?js|Express|Django|Flask|Laravel|Spring|Rails)\b/gi,
    /\b(Docker|Kubernetes|AWS|Azure|GCP|Terraform|Jenkins|Git|CI\/CD)\b/gi,
    /\b(Python|JavaScript|TypeScript|Java|C#|Go|Rust|Ruby|PHP|Swift|Kotlin)\b/gi,
    /\b(Pinecone|Weaviate|Qdrant|Milvus|Faiss|Elasticsearch|Vector\s*Database)\b/gi,
    /\b(Machine Learning|Deep Learning|NLP|Computer Vision|AI|LLM|GPT|Transformers)\b/gi
  ];
  
  const skills: Set<string> = new Set();
  
  // Extract skills using patterns
  for (const pattern of techPatterns) {
    const matches = response.match(pattern) || [];
    matches.forEach(match => skills.add(match));
  }
  
  // Convert to array and filter out duplicates
  return Array.from(skills);
}

/**
 * Format a summary paragraph from user response
 * @param response User's detailed response
 * @param currentSummary Existing summary text
 * @returns Formatted summary paragraph
 */
export function formatSummaryParagraph(response: string, currentSummary: string | undefined): string {
  // If there's no existing summary, create a new one from the response
  if (!currentSummary) {
    // Extract the first 1-2 sentences
    const sentences = response
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
      
    if (sentences.length === 0) return response;
    
    // Use just the first 1-2 substantial sentences
    const summary = sentences.slice(0, 2).join('. ');
    return summary.endsWith('.') ? summary : `${summary}.`;
  }
  
  // If there is an existing summary, find a relevant place to integrate the new information
  // Extract key information from the response (first sentence usually has the main point)
  const firstSentence = response.split(/[.!?]+/)[0].trim();
  
  if (firstSentence.length < 15) return currentSummary;
  
  // Look for a relevant place to insert the new information
  const summaryParts = currentSummary.split('. ');
  
  // If the summary is short, just append the new information
  if (summaryParts.length <= 2) {
    return `${currentSummary} ${firstSentence}.`;
  }
  
  // Otherwise, try to insert at a relevant position
  // Usually after the first sentence, before the last
  const newSummary = [
    ...summaryParts.slice(0, 1),
    firstSentence,
    ...summaryParts.slice(1)
  ].join('. ');
  
  return newSummary.endsWith('.') ? newSummary : `${newSummary}.`;
}

/**
 * Determine the appropriate section to update based on gap category and user response
 * @param gapCategory The category of the gap being addressed
 * @param userResponse The user's response text
 * @param resumeData Current resume data
 * @returns Object with path and formatted value
 */
export function determineSectionUpdate(
  gapCategory: string, 
  userResponse: string, 
  resumeData: Partial<ResumeData>
) {
  // Default to updating the summary section
  let path = 'profile.careerSummary';
  let formattedValue: any = userResponse;
  let oldValue: any = resumeData.profile?.careerSummary || '';
  
  // Try to extract company name for experience-related gaps
  const companyName = extractCompanyFromResponse(userResponse, resumeData);
  
  switch (gapCategory) {
    case 'technical_skills': {
      const skills = extractTechnicalSkills(userResponse);
      if (skills.length > 0) {
        path = 'skills.technical';
        oldValue = resumeData.skills?.technical || [];
        // Avoid duplicates by combining with existing skills
        const existingSkills = new Set(oldValue);
        skills.forEach(skill => existingSkills.add(skill));
        formattedValue = Array.from(existingSkills);
      }
      break;
    }
    
    case 'soft_skills': {
      // For soft skills, extract key phrases or use as is
      path = 'skills.soft';
      oldValue = resumeData.skills?.soft || [];
      // Simple extraction - in a real app, this would be more sophisticated
      const softSkills = userResponse
        .split(/[,.]/)
        .map(s => s.trim())
        .filter(s => s.length > 10 && s.length < 50);
      
      formattedValue = [...new Set([...oldValue, ...(softSkills.length > 0 ? softSkills : [userResponse])])];
      break;
    }
    
    case 'experience': {
      if (companyName) {
        const companyIndex = findCompanyIndex(companyName, resumeData);
        if (companyIndex >= 0) {
          path = `experience[${companyIndex}].achievements`;
          const currentAchievements = resumeData.experience?.[companyIndex]?.achievements || [];
          oldValue = currentAchievements;
          
          // Format into bullet points and combine with existing achievements
          const newBullets = formatExperienceBullets(userResponse);
          formattedValue = [...currentAchievements, ...newBullets];
        }
      }
      break;
    }
    
    case 'education':
      // Education updates would be handled similarly to experience
      break;
      
    case 'summary':
    default: {
      formattedValue = formatSummaryParagraph(userResponse, resumeData.profile?.careerSummary);
      break;
    }
  }
  
  return { path, formattedValue, oldValue };
}
