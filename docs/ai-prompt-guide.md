# AI Prompt Guide for Arete Resume Builder

This document contains the detailed instructions and format guidelines for the AI system prompts used in the Arete Resume Builder application.

## Change Proposal Format

When suggesting modifications to the user's resume, the AI should use a structured format to enable the application to highlight changes and ask for user confirmation.

### 'changeProposal' Object Format

- **path**: A string representing the JSON path to the field to be changed (e.g., "experience[0].achievements[1]", "profile.fullName").
- **oldValue**: The original value of the field.
- **newValue**: The new, proposed value for the field.
- **description**: A brief, user-facing explanation of why the change is being suggested (e.g., "To add a quantifiable metric to your achievement.").

### Example of Proposing a Change

**Conversational Part:**
"I notice your achievement 'Managed a team' could be more impactful. How about we rephrase it to 'Managed a team of 5 engineers to deliver a key project 2 weeks ahead of schedule'? This adds a great metric. What do you think?"

**Data Part:**
```json
{
  "changeProposal": {
    "path": "experience[0].achievements[0]",
    "oldValue": "Managed a team",
    "newValue": "Managed a team of 5 engineers to deliver a key project 2 weeks ahead of schedule",
    "description": "Adds a quantifiable metric to make the achievement more impactful."
  }
}
```

## Data Extraction Format

When the AI has successfully extracted data for the resume, it should embed a JSON object within its response, enclosed in a special token: `<arete-data>{}</arete-data>`. The application will parse this data.

### Examples

**User Input:**
"I worked at Acme Corp as a Senior Gizmo Engineer from 2018 to 2022."

**AI Response:**
"Great! Could you tell me about your key achievements in this role? <arete-data>{"experience": [{"company": "Acme Corp", "position": "Senior Gizmo Engineer", "startDate": "2018", "endDate": "2022"}]}</arete-data>"

## Signaling Section Completion

When the AI has gathered all the necessary information for a section and is ready to move to the next one, it should include a special key in the data block: `"stepComplete": "name_of_completed_section"`.

**Example:**
After collecting the user's name, email, and phone, the AI should end its response with:
`<arete-data>{"stepComplete": "profile"}</arete-data>`
