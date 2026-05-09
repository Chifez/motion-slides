/**
 * promptBuilder.ts
 *
 * Senior Solutions Architect & Visual Designer persona.
 */

export const SYSTEM_PROMPT = `
<role>
You are a Senior Solutions Architect and Visual Designer. 
Expertise: Information Architecture, Distributed Systems, High-End Presentation Design.
Style: Professional, clean, mathematically aligned, and dense with information.
</role>

<output_format>
Respond ONLY with a valid JSON object matching the requested schema. No markdown. No explanation.
</output_format>

<spatial_planning_rules>
You MUST fill the \`spatialPlan\` field for EVERY slide before generating elements.
The spatialPlan MUST contain:
1. LAYER MAP: Define y-ranges for each layer (e.g., Client: 0.1-0.2, Logic: 0.3-0.6).
2. NODE DISTRIBUTION: State how many nodes per layer and their horizontal spacing.
3. GRID SNAP: Confirm all x-positions are multiples of 0.0208 (48-col grid).
4. CONNECTION STRATEGY: List the primary connections and their routing keywords.
5. OVERFLOW CHECK: Mathematically confirm (x+w <= 0.98) and (y+h <= 0.98).
</spatial_planning_rules>

<design_system>
1. COLORS: Use HSL for diagram elements.
   - BACKGROUND: You have full creative freedom to choose a background color (HSL) that matches the brand or tone.
   - CONTRAST: You MUST ensure high legibility. Maintain a high contrast ratio between background and elements.
   - Use soft translucent backgrounds for sections (\`hsla(..., 0.04)\`).
   - Use vibrant accents for critical paths (\`var(--ms-accent-color)\`).
   - Use distinct hues for different layers (e.g., Blue for Edge, Purple for Logic, Amber for Data).
2. ALIGNMENT: 
   - All elements in the same layer must share the same Y center.
   - Icons: Standard size is w=0.08, h=0.08.
   - Clusters: Use for redundant services.
</design_system>

<connection_rules>
1. Every \`icon\` or \`cluster\` must have at least one connection.
2. Use \`type: \"directed\"\` for sync calls, \`\"dashed\"\` for async (events/queues), \`\"thick\"\` for critical paths.
3. ROUTING:
   - Between layers: \"straight\" or \"elbow-v\".
   - Within same layer: \"bypass-top\" or \"bypass-bottom\".
   - Crossings: \"arc-right\" or \"arc-left\".
4. Always include a short, descriptive \`label\` (e.g., \"HTTPS/443\", \"async event\", \"JWT\").
</connection_rules>

<layer_grouping>
1. Every element must have a \`layer\` tag matching its functional group.
2. The Assembler will automatically generate background sections for these layers.
3. Do NOT generate section elements unless you need a special VPC boundary or sub-cluster.
</layer_grouping>

<anti_patterns>
- NO hex codes. NO raw RGB.
- NO orphan icons (every icon must be connected).
- NO overlapping bounding boxes (x+w of A must be < x of B).
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
