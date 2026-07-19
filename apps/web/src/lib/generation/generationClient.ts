/**
 * generationClient.ts
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import {
  GeneratedPresentationSchema,
  GeneratedPresentationLaxSchema,
  formatZodIssues,
  type GeneratedPresentation,
  type AISlideType,
} from './slideGenerationSchema';
import {
  SYSTEM_PROMPT,
  buildArchitecturePrompt,
  buildRefinementPrompt,
  buildReadmePrompt,
} from './promptBuilder';
import { buildIconHotlist } from './iconResolver';
import { detectBlueprint } from './diagramBlueprints';
import { computeLayerReflow, formatReflowInstructions } from './reflowEngine';
import { parseStyleTokens, type StyleGuideTokens } from './styleTokenParser';

// ─── Provider Factory ─────────────────────────────────────────────────────────

function getModel(modelName = 'gpt-4o') {
  if (modelName.includes('claude')) {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    return anthropic(modelName);
  }
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai(modelName);
}

const ENRICHED_SYSTEM_PROMPT = buildEnrichedSystemPrompt();

function buildEnrichedSystemPrompt(): string {
  const tokens = parseStyleTokens();
  return (
    SYSTEM_PROMPT +
    `
<style_guide>
Use ONLY HSL tokens for colors.
LIGHT MODE: --ms-bg-base: ${tokens.light['--ms-bg-base']}, --ms-accent: ${tokens.light['--ms-accent']}
DARK MODE: --ms-bg-base: ${tokens.dark['--ms-bg-base']}, --ms-accent: ${tokens.dark['--ms-accent']}
</style_guide>
`
  );
}

// ─── Architecture Mode ────────────────────────────────────────────────────────

export async function generateFromArchitecture(
  opts: any,
): Promise<GeneratedPresentation> {
  const hotlist = buildIconHotlist(opts.description);
  const blueprint = detectBlueprint(opts.description);

  const userPrompt = buildArchitecturePrompt({
    briefing: opts.description,
    hotlist,
    blueprint,
    slideCount: opts.slideCount,
  });

  return callLLMWithCorrection(userPrompt, 12000, opts.model);
}

// ─── README Mode ──────────────────────────────────────────────────────────────

export async function generateFromReadme(
  opts: any,
): Promise<GeneratedPresentation> {
  const hotlist = buildIconHotlist(opts.markdown);
  const userPrompt = buildReadmePrompt({
    ...opts,
    briefing: opts.markdown,
    hotlist,
  });
  return callLLMWithCorrection(userPrompt, 10000, opts.model);
}

// ─── Refinement Mode ──────────────────────────────────────────────────────────

export async function refinePresentation(
  opts: any,
): Promise<GeneratedPresentation> {
  const userPrompt = buildRefinementPrompt(opts);
  return callLLMWithCorrection(userPrompt, 12000, opts.model);
}

// ─── Logical topology hydration ──────────────────────────────────────────────

// Tier-based y-position defaults for auto-layout when the AI doesn't specify positions.
// Nodes are spread horizontally within their tier band.
const TIER_Y_DEFAULTS: Record<string, { y: number; h: number }> = {
  Client: { y: 0.08, h: 0.1 },
  Edge: { y: 0.24, h: 0.1 },
  'Edge/CDN': { y: 0.24, h: 0.1 },
  Logic: { y: 0.42, h: 0.1 },
  Data: { y: 0.64, h: 0.1 },
  Storage: { y: 0.64, h: 0.1 },
  Producers: { y: 0.08, h: 0.1 },
  Consumers: { y: 0.64, h: 0.1 },
  'Event Bus': { y: 0.38, h: 0.1 },
  Gateway: { y: 0.1, h: 0.1 },
  Services: { y: 0.4, h: 0.1 },
  'Shared Infrastructure': { y: 0.7, h: 0.1 },
  Ingestion: { y: 0.1, h: 0.1 },
  Processing: { y: 0.38, h: 0.1 },
  Serving: { y: 0.65, h: 0.1 },
};

type NodeLayout = { x: number; y: number; w: number; h: number };

function smartRouting(
  fromNode: any,
  toNode: any,
  fromPort: string | undefined,
  toPort: string | undefined,
  fromLayout?: NodeLayout,
  toLayout?: NodeLayout,
): string {
  if (fromPort && toPort) {
    if (fromPort === 'right' && toPort === 'left') return 'elbow-h';
    if (fromPort === 'bottom' && toPort === 'top') return 'elbow-v';
    if (fromPort === 'top' && toPort === 'bottom') return 'arc-left';
    if (fromPort === 'right' && toPort === 'top') return 'elbow-h';
    if (fromPort === 'bottom' && toPort === 'left') return 'elbow-v';
  }

  if (fromLayout && toLayout) {
    const fromCx = fromLayout.x + fromLayout.w / 2;
    const fromCy = fromLayout.y + fromLayout.h / 2;
    const toCx = toLayout.x + toLayout.w / 2;
    const toCy = toLayout.y + toLayout.h / 2;
    const dx = toCx - fromCx;
    const dy = toCy - fromCy;

    if (fromNode?.layer === toNode?.layer) {
      if (Math.abs(dy) < 0.03) return 'straight';
      return Math.abs(dx) > Math.abs(dy) ? 'arc-right' : 'elbow-v';
    }

    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'elbow-h' : 'arc-left';
    return dy > 0 ? 'elbow-v' : 'arc-left';
  }

  if (!fromNode || !toNode) return 'elbow-v';
  if (fromNode.layer === toNode.layer) return 'straight';

  const tierOrder = [
    'Client',
    'Edge',
    'Edge/CDN',
    'Logic',
    'Gateway',
    'Services',
    'Data',
    'Storage',
    'Consumers',
  ];
  const fromIdx = tierOrder.indexOf(fromNode.layer);
  const toIdx = tierOrder.indexOf(toNode.layer);

  if (fromIdx >= 0 && toIdx >= 0) {
    return fromIdx < toIdx ? 'elbow-h' : 'arc-left';
  }
  return 'elbow-v';
}

function computeNodeLayout(
  ln: any,
  siblings: any[],
  tierBand: { y: number; h: number } | undefined,
): NodeLayout {
  let w = 0.09;
  let h = 0.1;
  if (ln.type === 'cluster') {
    w = 0.12;
    h = 0.12;
  } else if (ln.type === 'shape') {
    w = 0.13;
    h = 0.08;
  }

  const sibIdx = siblings.findIndex((s: any) => s.id === ln.id);
  const totalSibs = siblings.length;
  const totalWidth = totalSibs * w + (totalSibs - 1) * 0.06;
  const startX = Math.max(0.04, 0.5 - totalWidth / 2);
  const x = Math.min(startX + sibIdx * (w + 0.06), 0.96 - w);
  const y = tierBand ? tierBand.y : 0.35;

  return { x, y, w, h };
}

export function hydrateLogicalSlides(presentation: any): any {
  if (!presentation || !presentation.slides) return presentation;

  const slides = presentation.slides.map((slide: any) => {
    // if (slide.role !== 'diagram' || !slide.logicalNodes) return slide
    if (
      slide.role !== 'diagram' ||
      !slide.logicalNodes ||
      slide.logicalNodes.length === 0
    )
      return slide;

    // Group nodes by layer for horizontal auto-spacing
    const nodesByLayer: Record<string, any[]> = {};
    for (const ln of slide.logicalNodes || []) {
      const layer = ln.layer || 'Logic';
      if (!nodesByLayer[layer]) nodesByLayer[layer] = [];
      nodesByLayer[layer].push(ln);
    }

    const layoutById = new Map<string, NodeLayout>();
    for (const ln of slide.logicalNodes || []) {
      const layer = ln.layer || 'Logic';
      const siblings = nodesByLayer[layer] || [ln];
      layoutById.set(
        ln.id,
        computeNodeLayout(ln, siblings, TIER_Y_DEFAULTS[layer]),
      );
    }

    const elements = (slide.logicalNodes || []).map((ln: any) => {
      const layer = ln.layer || 'Logic';
      const position =
        layoutById.get(ln.id) ??
        computeNodeLayout(ln, [ln], TIER_Y_DEFAULTS[layer]);

      if (ln.type === 'icon') {
        return {
          type: 'icon',
          id: ln.id,
          iconPath: ln.iconPath || '',
          label: ln.label,
          layer,
          position,
          animation: 'fade-in',
          animationDelay: 0,
        };
      } else if (ln.type === 'cluster') {
        return {
          type: 'cluster',
          id: ln.id,
          iconPath: ln.iconPath || '',
          count: 3,
          label: ln.label,
          sublabels: null,
          stackDirection: 'right',
          position,
          layer,
          animation: 'fade-in',
          animationDelay: 0,
        };
      } else {
        return {
          type: 'shape',
          id: ln.id,
          shape: ln.shapeType || 'rectangle',
          label: ln.label,
          sublabel: ln.sublabel || null,
          iconPath: null,
          position,
          layer,
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'var(--ms-accent, #3b82f6)',
            borderWidth: 2,
            opacity: 1,
          },
          animation: 'fade-in',
          animationDelay: 0,
        };
      }
    });

    const nodeMap = new Map(
      (slide.logicalNodes || []).map((n: any) => [n.id, n]),
    );

    const connections = (slide.logicalConnections || []).map((lc: any) => {
      const fromNode = nodeMap.get(lc.from);
      const toNode = nodeMap.get(lc.to);
      const routing = smartRouting(
        fromNode,
        toNode,
        lc.fromPort,
        lc.toPort,
        layoutById.get(lc.from),
        layoutById.get(lc.to),
      );

      return {
        id: lc.id || `conn-${Math.random().toString(36).substr(2, 9)}`,
        from: lc.from,
        to: lc.to,
        type: lc.type || 'directed',
        label: lc.label || null,
        color: 'var(--ms-accent, #3b82f6)',
        routing,
        // Propagate port hints so the renderer can use exact port exits
        fromPort: lc.fromPort || null,
        toPort: lc.toPort || null,
      };
    });

    return {
      ...slide,
      elements,
      connections,
    };
  });

  return {
    ...presentation,
    slides,
  };
}

// ─── Core LLM Call with Correction Loop ───────────────────────────────────────

async function callLLMWithCorrection(
  userPrompt: string,
  maxTokens: number,
  modelName?: string,
): Promise<GeneratedPresentation> {
  // Pass 1: Primary Generation (uses Lax Schema)
  let presentation = await callLLM(userPrompt, maxTokens, modelName);

  // Hydrate logical node topologies to standard elements before safety check
  presentation = hydrateLogicalSlides(presentation);

  // Validation Pass (uses Strict Schema)
  const result = GeneratedPresentationSchema.safeParse(presentation);
  if (!result.success) {
    console.warn(
      '[generationClient] Layout/tier validation violations found. Triggering self-correction loop...',
    );
    console.warn(formatZodIssues(result.error.issues));
    return await selfCorrect(presentation, result.error.issues, modelName);
  }

  return presentation;
}

async function selfCorrect(
  presentation: GeneratedPresentation,
  issues: any[],
  modelName?: string,
): Promise<GeneratedPresentation> {
  const fixedSlides = [...presentation.slides];
  let changed = false;

  // Group issues by slide
  const slideIssuesMap = new Map<number, any[]>();
  issues.forEach((issue) => {
    if (issue.path[0] === 'slides') {
      const idx = issue.path[1] as number;
      if (!slideIssuesMap.has(idx)) slideIssuesMap.set(idx, []);
      slideIssuesMap.get(idx)!.push(issue);
    }
  });

  for (const [idx, slideIssues] of slideIssuesMap.entries()) {
    const slide = presentation.slides[idx];

    // Pillar 4: Mathematical Layer Reflow
    const reflow = computeLayerReflow(slide, slideIssues);
    const reflowInstructions = formatReflowInstructions(reflow);

    console.log(
      `[generationClient] Reflowing slide ${idx} with ${reflowInstructions.length} instructions`,
    );

    const correctionPrompt = buildRefinementPrompt({
      previousPresentation: { slides: [slide] },
      instruction:
        'The following slide has layout/schema violations. Apply the mandatory position fixes exactly.',
      reflowInstructions,
    });

    try {
      // Pass 2: Lightweight correction (uses the same model as primary)
      const correctedObj = hydrateLogicalSlides(await callLLM(correctionPrompt, 4000, modelName))
      if (correctedObj.slides?.[0]) {
        fixedSlides[idx] = correctedObj.slides[0]
        changed = true
      }
    } catch (err) {
      console.error(`[generationClient] Failed to correct slide ${idx}`, err);
    }
  }

  return changed ? { ...presentation, slides: fixedSlides } : presentation;
}

async function callLLM(
  userPrompt: string,
  maxTokens: number,
  modelName = 'gpt-4o',
): Promise<any> {
  const model = getModel(modelName);

  try {
    const { object } = await generateObject({
      model,
      schema: GeneratedPresentationLaxSchema,
      system: ENRICHED_SYSTEM_PROMPT,
      prompt: userPrompt,
      // @ts-ignore
      maxTokens: maxTokens,
      temperature: 0.3,
    });
    return object;
  } catch (err: any) {
    console.error(
      '[AI Generation Engine] Failed to generate valid schema object.',
    );
    if (err.issues && Array.isArray(err.issues)) {
      console.error('Validation Issues:\n' + formatZodIssues(err.issues));
    } else if (err.error && err.error.issues) {
      console.error('Validation Issues:\n' + formatZodIssues(err.error.issues));
    } else {
      console.error(err);
    }
    throw err;
  }
}

/** @deprecated */
export async function generatePresentation(opts: {
  userPrompt: string;
  maxTokens?: number;
}) {
  return callLLM(opts.userPrompt, opts.maxTokens ?? 8000);
}
