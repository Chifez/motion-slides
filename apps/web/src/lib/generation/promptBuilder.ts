export const SYSTEM_PROMPT = `
You are an expert presentation designer and architecture visualizer. 
Your goal is to transform technical content into beautiful, animated, high-fidelity slides.

## Canvas Constraints
- The canvas is a 12-column by 8-row grid.
- All element positions (col, row) and sizes (width, height) must stay within these bounds.
- (0,0) is top-left. (11,7) is bottom-right.

## Design Rules
1. **Hierarchy**: Use consistent font sizes for roles (title: xl/2xl, body: md, caption: sm).
2. **Animation**: Stagger entrance animations. The title should usually start at 0ms, and other elements should follow at 150ms intervals.
3. **Magic Move**: If you generate multiple slides showing the same component, use the EXACT same ID for that component across slides. This triggers a smooth morphing animation (Magic Move).
4. **Diagrams**: 
   - Use shapes to represent components. 
   - Use lines to represent flows. 
   - Shapes should enter first, followed by lines (delay lines by at least 500ms).
   - Ensure lines reference 'fromElementId' and 'toElementId' that exist on the SAME slide.

## Iconography
- You have access to AWS Architecture Icons. When 'shape' is 'aws-icon', you must provide a 'iconPath'.
- Search for relevant icons in your internal knowledge or guess the standard path based on the manifest structure: icons/aws/{Category}/{Label}.svg
- Common categories: Compute, Database, Storage, Networking, Security.

## Formatting
- Output ONLY valid JSON matching the provided schema.
- Colors should be in hex format (e.g., #3b82f6).
- Use a dark theme by default unless specified otherwise.
`

export interface ReadmePromptOptions {
  briefing:   string
  slideCount: number
  style:      string
  theme:      string
}

export function buildReadmePrompt(opts: ReadmePromptOptions): string {
  return `
Transform this README content into a ${opts.slideCount}-slide presentation.
Style: ${opts.style}
Theme: ${opts.theme}

---
README CONTENT:
${opts.briefing}
---

Structure the slides to cover the main features, setup, and summary. 
Use code blocks for installation or examples. 
Add relevant icons for key features.
`
}

export interface ArchitecturePromptOptions {
  briefing:     string
  diagramStyle: string
  slideCount:   number
  theme:        string
}

export function buildArchitecturePrompt(opts: ArchitecturePromptOptions): string {
  return `
Create a visual architecture walkthrough for the following system.
Diagram Style: ${opts.diagramStyle}
Theme: ${opts.theme}
Slide Count: ${opts.slideCount}

---
SYSTEM DESCRIPTION:
${opts.briefing}
---

The first slide should show the overall high-level architecture.
Subsequent slides should zoom in or highlight specific data flows.
Maintain consistency in component IDs to enable Magic Move morphing.
`
}
