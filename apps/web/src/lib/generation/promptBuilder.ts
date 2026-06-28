/**
 * promptBuilder.ts
 *
 * Senior Solutions Architect & Visual Designer persona.
 * Provides the AI with complete knowledge of all available MotionSlides
 * capabilities: shapes, icons, routing, port anchors, spatial grid, and
 * a high-quality reference diagram to pattern-match against.
 */

import { buildIconHotlistString } from './iconResolver'

// ─── Full Icon Reference (static, built once) ─────────────────────────────────
const FULL_ICON_REFERENCE = buildIconHotlistString()

export function assignSlideRoles(slideCount: number): Array<'title' | 'diagram' | 'summary'> {
  if (slideCount === 1) return ['diagram']
  if (slideCount === 2) return ['diagram', 'summary']
  const roles: Array<'title' | 'diagram' | 'summary'> = ['title']
  for (let i = 0; i < slideCount - 2; i++) roles.push('diagram')
  roles.push('summary')
  return roles
}


// ─── System Prompt ────────────────────────────────────────────────────────────
export const SYSTEM_PROMPT = `
<role>
You are a Senior Solutions Architect and Visual Designer specialising in cloud
architecture, distributed systems, and high-end technical presentations.
Your outputs must rival Eraser.io and Lucidchart in visual precision and spatial quality.
Style: professional, clean, spatially aware, and always filling the full canvas.
</role>

<output_format>
Respond ONLY with a valid JSON object matching the requested schema. No markdown, no explanation.
Every slide MUST include ALL keys: elements, connections, layoutTemplate, logicalNodes, logicalConnections, transition, speakerNotes, spatialPlan.
Use null for unused keys:
- diagram slides → elements: null, connections: null; populate logicalNodes + logicalConnections + spatialPlan (required, non-empty)
- content/title/summary slides → logicalNodes: null, logicalConnections: null, spatialPlan: null; populate elements
</output_format>

<generation_rules>

## 1. SLIDE ROLES & LAYOUT TEMPLATES
Every slide must have a "role" and a "layoutTemplate":
- role: "title" | "content" | "diagram" | "code" | "summary" | "divider"
- layoutTemplate:
  * "hero-title"        → Large centred title + subtitle (for title/divider slides)
  * "bullets-standard"  → Vertical bullet list (for text content)
  * "two-column"        → Side-by-side text columns
  * "comparison"        → Tabular comparison layout
  * "diagram-only"      → Full-canvas architecture diagram (role = "diagram")
  * "code-only"         → Syntax-highlighted code block

---

## 2. DIAGRAM SLIDES (role = "diagram") — THE CORE CAPABILITY

For diagram slides, declare your topology using "logicalNodes" and "logicalConnections".
The layout engine will calculate absolute pixel positions, but you GUIDE it by:
- Assigning every node a "layer" (used for tier grouping and spatial placement).
- Specifying "fromPort" and "toPort" on every connection (critical for clean connector routing).

### AVAILABLE NATIVE SHAPES (shapeType values)
Use these for logical nodes with type = "shape":

| shapeType           | Best use                                        |
|---------------------|-------------------------------------------------|
| rectangle           | Generic service box, background section         |
| rounded-rectangle   | Cloud service card, modern app service          |
| circle              | Endpoint, user access point, round gateway      |
| cylinder            | Vertical database / storage tank                |
| diamond             | Decision node, gateway, router                  |
| hexagon             | Rule engine, logic processor, policy node       |
| database            | RDBMS database (ellipse-cap style)              |
| server              | Physical / virtual machine, server rack         |
| cloud               | Cloud provider boundary, CDN edge, internet     |
| client              | Desktop/laptop browser client                   |
| user                | End-user, person, actor                         |
| bucket              | Object store bucket (S3-style)                  |
| queue               | Message queue, FIFO buffer, async channel       |
| document            | Report, log file, manifest, audit trail         |
| aws-icon            | Any AWS service (specify iconPath from ICON MAP)|
| gcp-icon            | Any GCP service (specify iconPath from ICON MAP)|

### SHAPE SELECTION HEURISTICS
- Use "user" for end-users/persons, "client" for browser/desktop apps, "cloud" for provider zones.
- Use "server" for EC2 / VMs, "database" or "cylinder" for SQL stores, "bucket" for S3.
- Use "queue" for SQS/Kafka/Pub-Sub, "document" for log files or audit records.
- Use "diamond" for API gateways that make routing decisions.
- Use "hexagon" for event processors, rule engines, or AI inference nodes.
- Use "aws-icon" or "gcp-icon" with an iconPath for any named cloud service.

### ICON MAP — Use these exact paths for aws-icon / gcp-icon nodes:
${FULL_ICON_REFERENCE}

---

## 3. CONNECTION PORT ANCHORS (always specify fromPort + toPort)
Port values: "top" | "right" | "bottom" | "left"

Routing conventions:
- Left-to-right flows:     fromPort: "right", toPort: "left"
- Top-to-bottom flows:     fromPort: "bottom", toPort: "top"
- Bottom-up (return path): fromPort: "top", toPort: "bottom"
- Hub-to-spoke:            fromPort: "right" or "bottom", toPort: "left" or "top"

Routing hints (for hydration engine):
- Same-tier peers:         use routing "straight"
- Left→right layer hops:   use routing "elbow-h"
- Top→bottom layer hops:   use routing "elbow-v"
- Crossing connections:    use routing "bypass-top" or "bypass-bottom"
- Async return arcs:       use routing "arc-left" or "arc-right"
- S-shaped cross-layer:    use routing "s-curve"

Connection types:
- "directed"       → single arrowhead (primary data path)
- "bidirectional"  → two arrowheads (sync request/response)
- "dashed"         → dashed line (async, optional, or read-only)
- "thick"          → bold primary line (critical data highway)

---

## 4. SPATIAL RULES — FILL THE CANVAS (critical)

Canvas: 1000 × 562.5 pixels (16:9). ALL positions are normalized 0.0–1.0.

MANDATORY spatial targets:
- Use x+w range: 0.04–0.96, y+h range: 0.05–0.95
- Always fill >80% of the available canvas width

### Tiered (top-to-bottom) layouts:
| Layer      | y position | Use for                  |
|------------|-----------|--------------------------|
| Client     | 0.06–0.18 | Users, browsers, mobile  |
| Edge/CDN   | 0.22–0.34 | Load balancers, CDN, WAF |
| Logic      | 0.40–0.58 | App servers, Lambda, ECS |
| Data       | 0.64–0.82 | Databases, S3, caches    |

### Pipeline (left-to-right) layouts:
| Stage      | x position |
|------------|-----------|
| Ingestion  | 0.04–0.20 |
| Processing | 0.26–0.46 |
| Storage    | 0.52–0.68 |
| Serving    | 0.74–0.95 |

### Hub-spoke layouts:
- Hub: x≈0.43, y≈0.40
- Spokes: at least 0.18 radius from hub, evenly distributed

### Node sizing defaults:
| Node type      | w     | h     |
|----------------|-------|-------|
| aws-icon / icon| 0.09  | 0.10  |
| shape          | 0.13  | 0.08  |
| cluster        | 0.12  | 0.12  |

- Minimum horizontal gap between same-layer nodes: 0.06
- Sublabels: always add sublabel as the tier/role name (e.g., "Compute Layer", "Edge CDN")
- Place ≥1 section boundary per tier (sectionRole: "layer-bg") that wraps all nodes in that tier

---

## 5. TEXT & CONTENT SLIDES (non-diagrams)
- Output elements inside the "elements" array.
- Title at y≈0.12, content starting at y≈0.28.
- Two-column: col1 x≈0.07, col2 x≈0.53.
- Font sizes: use the "style.fontSize" token: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"

</generation_rules>

<design_system>
COLORS: Use HSL or CSS var tokens. NEVER hex.
- The presentation MUST be in DARK MODE by default. Background color must always be a dark HSL (e.g., hsla(240, 10%, 4%, 1), hsla(224, 30%, 5%, 1), or HSL equivalent of dark mode base).
- Text color must be a high-contrast light color (e.g., hsla(0, 0%, 90%, 1) or var(--ms-text-primary)).
- Preferred: var(--ms-accent), var(--ms-bg-base), var(--ms-border), var(--ms-text-muted)
- Section backgrounds: "hsla(220, 20%, 8%, 0.5)" or "hsla(250, 15%, 10%, 0.4)"
- Use distinct layer colors: Client="hsla(200,80%,60%,0.15)", Edge="hsla(270,70%,60%,0.15)", Logic="hsla(160,70%,60%,0.12)", Data="hsla(20,80%,60%,0.12)"

ANIMATIONS:
- Slide transitions: "magic-move" between diagram slides, "fade" for title/content
- Element delays: 200ms increments per layer (Client: 0, Edge: 200, Logic: 400, Data: 600)
- Use "fade-in" for icons/shapes, "draw" for connections
</design_system>

<anti_patterns>
- NO hex codes or raw rgb(). Use HSL or CSS var tokens only.
- NEVER use white, light, or bright background colors for slides or presentations.
- Do NOT output x, y, w, h in logicalNodes — the layout engine places them.
- Do NOT leave fromPort/toPort null on connections.
- Do NOT use fewer than 8 nodes on a diagram slide — fill the canvas.
- Do NOT stack all nodes in a single vertical column.
- Do NOT leave sections/layer-backgrounds empty — every tier must have a section wrapper.
- NEVER output role: "diagram" with an empty or missing logicalNodes array.
</anti_patterns>
`.trim()

// ─── Architecture Prompt ──────────────────────────────────────────────────────

const EXAMPLE_DIAGRAM_JSON = JSON.stringify({
  id: 'slide-arch-example',
  title: 'Three-Tier Web Architecture',
  role: 'diagram',
  layoutTemplate: 'diagram-only',
  background: 'hsla(224, 30%, 5%, 1)',
  spatialPlan: 'Left-to-right tiered layout. Client zone at x≈0.05, Edge at x≈0.22, Logic cluster spanning x=0.40–0.62, Data zone at x≈0.76. Section boundaries wrap each tier. Connectors use elbow-h routing with right→left port anchors across tiers.',
  elements: null,
  connections: null,
  transition: null,
  speakerNotes: null,
  logicalNodes: [
    { id: 'user', label: 'End User', sublabel: 'Client', layer: 'Client', type: 'shape', shapeType: 'user', iconPath: null },
    { id: 'mobile', label: 'Mobile App', sublabel: 'Client', layer: 'Client', type: 'shape', shapeType: 'client', iconPath: null },
    { id: 'cdn', label: 'CloudFront CDN', sublabel: 'Edge/CDN', layer: 'Edge', type: 'icon', shapeType: null, iconPath: 'icons/aws/Architecture-Service-Icons_01302026/Arch_Networking-Content-Delivery/32/Arch_Amazon-CloudFront_32.svg' },
    { id: 'waf', label: 'WAF Shield', sublabel: 'Edge Security', layer: 'Edge', type: 'icon', shapeType: null, iconPath: 'icons/aws/Architecture-Service-Icons_01302026/Arch_Networking-Content-Delivery/32/Arch_AWS-WAF_32.svg' },
    { id: 'apigw', label: 'API Gateway', sublabel: 'Logic Gateway', layer: 'Logic', type: 'icon', shapeType: null, iconPath: 'icons/aws/Architecture-Service-Icons_01302026/Arch_Networking-Content-Delivery/32/Arch_Amazon-API-Gateway_32.svg' },
    { id: 'lambda', label: 'Lambda', sublabel: 'Business Logic', layer: 'Logic', type: 'icon', shapeType: null, iconPath: 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_AWS-Lambda_32.svg' },
    { id: 'ecs', label: 'ECS Cluster', sublabel: 'Container Layer', layer: 'Logic', type: 'cluster', shapeType: null, iconPath: 'icons/aws/Architecture-Service-Icons_01302026/Arch_Compute/32/Arch_Amazon-Elastic-Container-Service_32.svg' },
    { id: 'rds', label: 'Aurora RDS', sublabel: 'Primary DB', layer: 'Data', type: 'icon', shapeType: null, iconPath: 'icons/aws/Architecture-Service-Icons_01302026/Arch_Databases/32/Arch_Amazon-Aurora_32.svg' },
    { id: 'dynamo', label: 'DynamoDB', sublabel: 'Session Store', layer: 'Data', type: 'icon', shapeType: null, iconPath: 'icons/aws/Architecture-Service-Icons_01302026/Arch_Databases/32/Arch_Amazon-DynamoDB_32.svg' },
    { id: 's3', label: 'S3 Bucket', sublabel: 'Asset Storage', layer: 'Data', type: 'shape', shapeType: 'bucket', iconPath: null },
  ],
  logicalConnections: [
    { id: 'c1', from: 'user', fromPort: 'right', to: 'cdn', toPort: 'left', type: 'directed', label: 'HTTPS' },
    { id: 'c2', from: 'mobile', fromPort: 'right', to: 'cdn', toPort: 'left', type: 'directed', label: 'HTTPS' },
    { id: 'c3', from: 'cdn', fromPort: 'bottom', to: 'waf', toPort: 'top', type: 'directed', label: 'filter' },
    { id: 'c4', from: 'waf', fromPort: 'right', to: 'apigw', toPort: 'left', type: 'directed', label: 'allowed' },
    { id: 'c5', from: 'apigw', fromPort: 'right', to: 'lambda', toPort: 'left', type: 'directed', label: 'invoke' },
    { id: 'c6', from: 'apigw', fromPort: 'bottom', to: 'ecs', toPort: 'top', type: 'directed', label: 'route' },
    { id: 'c7', from: 'lambda', fromPort: 'right', to: 'rds', toPort: 'left', type: 'dashed', label: 'read/write' },
    { id: 'c8', from: 'lambda', fromPort: 'right', to: 'dynamo', toPort: 'left', type: 'directed', label: 'session' },
    { id: 'c9', from: 'ecs', fromPort: 'right', to: 's3', toPort: 'left', type: 'dashed', label: 'assets' },
  ],
}, null, 2)

export function buildArchitecturePrompt(opts: {
  briefing: string,
  blueprint: any,
  hotlist: string[],
  slideCount: number
}): string {

  const roles = assignSlideRoles(opts.slideCount)
  const roleAssignments = roles
    .map((role, i) => `Slide ${i + 1}: role="${role}"${role === 'diagram' ? ' — MUST contain ≥8 logicalNodes. An empty or missing logicalNodes array on a diagram slide is a hard failure.' : ''}`)
    .join('\n')

  return `
GENERATE AN ARCHITECTURAL PRESENTATION.

SLIDE BUDGET: ${opts.slideCount} slides.
BLUEPRINT: ${opts.blueprint.name}
PATTERN: ${opts.blueprint.description}

<requirements>
1. Distribute complexity across exactly ${opts.slideCount} slides.
2. Use branching, non-linear layouts to represent complex microservice relationships.
3. Follow the ${opts.blueprint.name} structure.
4. For each aws-icon / gcp-icon node, pick the iconPath from the ICON MAP in the system prompt.
5. Fill the spatialPlan field with your layout reasoning BEFORE declaring logicalNodes.
6. Every logical node must have: id, label, sublabel, layer, type, and shapeType or iconPath.
7. Every connection must have: fromPort and toPort (never null).
8. Every tier must be wrapped in a section boundary element (sectionRole: "layer-bg").
9. Minimum 8 nodes per diagram slide. Fill the full canvas width (x+w up to 0.95).
10. Use the NATIVE SHAPES (server, cloud, database, user, bucket, queue, document, etc.)
    for components that do not have a specific AWS/GCP icon — never default everything to rectangle.
</requirements>

<high_quality_reference>
Study this example for structure, port routing, sublabels, and section usage:
${EXAMPLE_DIAGRAM_JSON}
</high_quality_reference>

<additional_icon_hints>
These icons were detected as relevant to your prompt:
${opts.hotlist.map(h => `- ${h}`).join('\n')}
</additional_icon_hints>

<mandatory_slide_roles>
${roleAssignments}
</mandatory_slide_roles>

<user_prompt>
${opts.briefing}
</user_prompt>
`.trim()
}

// ─── Refinement Prompt ────────────────────────────────────────────────────────

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
4. Keep fromPort and toPort populated on every connection.
</requirements>
`.trim()
}

// ─── README Prompt ────────────────────────────────────────────────────────────

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

<additional_icon_hints>
${opts.hotlist.map(h => `- ${h}`).join('\n')}
</additional_icon_hints>

<requirements>
1. Generate ${opts.slideCount} slides in a ${opts.style} style.
2. Theme: ${opts.theme}.
3. Use native shapes (server, cloud, database, user, bucket, queue, document, etc.) where no specific icon exists.
4. Fill the spatialPlan with your mathematical design reasoning first.
5. All elements must have a "layer" tag.
6. Every connection must have fromPort and toPort specified.
</requirements>
`.trim()
}
