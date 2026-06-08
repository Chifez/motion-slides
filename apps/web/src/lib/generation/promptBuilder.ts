/**
 * promptBuilder.ts
 *
 * Senior Solutions Architect & Visual Designer persona.
 */

export const SYSTEM_PROMPT = `
<role>
You are a Senior Solutions Architect and Visual Designer. 
Expertise: Information Architecture, Distributed Systems, High-End Presentation Design.
Style: Professional, clean, and structured.
</role>

<output_format>
Respond ONLY with a valid JSON object matching the requested schema. No markdown. No explanation.
</output_format>

<generation_rules>
1. SLIDE ROLES & TEMPLATES:
   - Every slide must have a 'role' (e.g., 'title', 'content', 'diagram', 'code', 'summary', 'divider').
   - Set 'layoutTemplate' on each slide to match its visual structure:
     * 'hero-title' (For title and divider slides)
     * 'bullets-standard' (For bullet point text content)
     * 'two-column' (For side-by-side text comparisons)
     * 'comparison' (For tabular or list-based comparisons)
     * 'diagram-only' (For architecture diagram slides)
     * 'code-only' (For source code presentation)

2. DIAGRAM SLIDES (role = 'diagram'):
   - Do NOT output coordinates (x, y, w, h) or write to the 'elements' or 'connections' fields directly.
   - Instead, declare the logical topology using the 'logicalNodes' and 'logicalConnections' fields.
   - For every logical node:
     * Declare an 'id', 'label', 'layer' (e.g. 'Client', 'Edge', 'Logic', 'Data'), and 'type' ('icon', 'cluster', or 'shape').
     * If 'type' is 'icon', map it to one of the allowed icon path names.
     * If 'type' is 'shape', specify 'shapeType' (e.g., 'rectangle', 'circle', 'cylinder', 'diamond', 'hexagon').
   - For every connection:
     * Declare 'from' and 'to' node IDs, a connection 'type' ('directed', 'bidirectional', 'dashed', 'thick'), and a connection 'label'.
   - The server-side layout engine will calculate the exact coordinate positioning math programmatically.

3. TEXT & CONTENT SLIDES (non-diagrams):
   - Output visual text elements inside the 'elements' array.
   - Snap positions to a standard vertical column flow (e.g. Title at y=0.15, content starting at y=0.32, column 1 x=0.1, column 2 x=0.55).
   - All text in elements must have high contrast and clean font sizes ('sm', 'md', 'lg', 'xl').
</generation_rules>

<design_system>
1. COLORS: Use HSL for colors.
   - BACKGROUND: Choose a background color (HSL) that matches the brand or tone.
   - Use soft translucent backgrounds for sections ('hsla(..., 0.04)').
   - Use distinct layer tags for automatic group boundary rendering (e.g., Client, Edge, Logic, Database).
2. ANIMATIONS:
   - Set transition type to 'magic-move' or 'fade'.
   - Apply subtle delays to elements (e.g., 200ms increments) to stagger rendering.
</design_system>

<anti_patterns>
- NO hex codes or raw RGB.
- Do NOT output absolute positioning (x, y, w, h) coordinates for diagram components; rely strictly on logicalNodes and logicalConnections.
</anti_patterns>
`.trim();

export function buildArchitecturePrompt(opts: {
  briefing: string,
  blueprint: any,
  hotlist: string[],
  slideCount: number
}): string {
  return `
GENERATE AN ARCHITECTURAL PRESENTATION.

SLIDE BUDGET: ${opts.slideCount} slides.
BLUEPRINT: ${opts.blueprint.name}
PATTERN: ${opts.blueprint.description}

<requirements>
1. Distribute the complexity of the architecture across exactly ${opts.slideCount} slides.
2. Use branching, non-linear layouts to represent complex microservice relationships.
3. Follow the ${opts.blueprint.name} structure strictly.
4. Map keywords to icons in the ALLOWED list.
5. Fill the spatialPlan with your mathematical design reasoning first.
6. All elements must have a \`layer\` tag.
</requirements>

ALLOWED ICONS (AWS/GCP/Generic):
${opts.hotlist.map(h => `- ${h}`).join('\n')}

<user_prompt>
${opts.briefing}
</user_prompt>
`.trim();
}

export function buildRefinementPrompt(opts: {
  previousPresentation: any,
  instruction: string,
  reflowInstructions?: string[]
}): string {
  return `
REFINE THIS PRESENTATION.

<existing_json>
${JSON.stringify(opts.previousPresentation)}
</existing_json>

<feedback>
${opts.instruction}
</feedback>

${opts.reflowInstructions ? `
<mandatory_position_fixes>
${opts.reflowInstructions.join('\n')}
</mandatory_position_fixes>
` : ''}

<requirements>
1. Apply the mandatory position fixes exactly.
2. Ensure connection routing is updated if nodes moved.
3. Maintain the 48-column grid snap.
</requirements>
`.trim();
}

export function buildReadmePrompt(opts: {
  briefing: string,
  hotlist: string[],
  slideCount: number,
  style: string,
  theme: string
}): string {
  return `
GENERATE A PRESENTATION FROM THIS README.

<readme_content>
${opts.briefing}
</readme_content>

ALLOWED ICONS (AWS/GCP/Generic):
${opts.hotlist.map(h => `- ${h}`).join('\n')}

<requirements>
1. Generate ${opts.slideCount} slides in a ${opts.style} style.
2. Theme: ${opts.theme} .
3. Use the 48-column grid for all alignments.
4. Fill the spatialPlan with your mathematical design reasoning first.
5. All elements must have a \`layer\` tag.
</requirements>
`.trim();
}
