/**
 * reflowEngine.ts
 *
 * Mathematically redistributes elements within a layer to prevent overlaps
 * and ensure they fit within canvas boundaries.
 */

import type { AISlideType } from './slideGenerationSchema';

export interface ReflowInstruction {
  layerName: string;
  reason: string;
  affectedNodeIds: string[];
  correctedPositions: Record<string, { x: number; y: number; w: number; h: number }>;
}

export function computeLayerReflow(
  slide: AISlideType,
  violations: any[]
): ReflowInstruction[] {
  // 1. Group nodes by layer
  const layerMap = new Map<string, any[]>();
  slide.elements.forEach(el => {
    if ('layer' in el && el.layer) {
      if (!layerMap.has(el.layer)) layerMap.set(el.layer, []);
      layerMap.get(el.layer)!.push(el);
    }
  });

  const instructions: ReflowInstruction[] = [];
  const GRID_UNIT = 0.0208; // 48-col grid

  layerMap.forEach((layerNodes, layerName) => {
    // Only reflow if there's an actual violation in this layer
    const hasViolation = violations.some(v => 
      v.path.includes('elements') && 
      layerNodes.some(n => n.id === slide.elements[v.path[1]]?.id)
    );

    if (!hasViolation) return;

    // Distribute nodes evenly across the horizontal row
    const N = layerNodes.length;
    const rowStartX = 0.06;
    const rowEndX = 0.94;
    const nodeW = 0.08;
    
    // Calculate spacing
    const totalSpacing = rowEndX - rowStartX - (N * nodeW);
    const gap = totalSpacing / (N + 1);

    // Median Y to preserve vertical position
    const medianY = layerNodes.reduce((sum, n) => sum + n.position.y, 0) / N;

    const correctedPositions: Record<string, { x: number; y: number; w: number; h: number }> = {};
    
    layerNodes.forEach((node, i) => {
      const targetX = rowStartX + gap * (i + 1) + nodeW * i;
      const snappedX = Math.round(targetX / GRID_UNIT) * GRID_UNIT;
      
      correctedPositions[node.id] = {
        x: snappedX,
        y: Math.max(0.1, Math.min(medianY, 0.9)),
        w: nodeW,
        h: nodeW,
      };
    });

    instructions.push({
      layerName,
      reason: `Layer reflow triggered to resolve overlaps/overflows.`,
      affectedNodeIds: layerNodes.map(n => n.id),
      correctedPositions,
    });
  });

  return instructions;
}

export function formatReflowInstructions(instructions: ReflowInstruction[]): string[] {
  return instructions.flatMap(instr =>
    Object.entries(instr.correctedPositions).map(
      ([id, pos]) =>
        `Node \"${id}\" (layer: ${instr.layerName}) MUST be set to: x=${pos.x.toFixed(4)}, y=${pos.y.toFixed(4)}, w=${pos.w}, h=${pos.h}`
    )
  );
}
