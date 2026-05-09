/**
 * diagramBlueprints.ts
 *
 * Provides standard architectural patterns to the AI.
 */

export type DiagramBlueprint = {
  name: string;
  description: string;
  minNodes: number;
  requiredLayers: string[];
  connectionPattern: 'linear' | 'hub-spoke' | 'mesh' | 'bus' | 'tiered';
  backgroundSections: boolean;
};

export const DIAGRAM_BLUEPRINTS: DiagramBlueprint[] = [
  {
    name: 'three-tier-web',
    description: 'Client → Edge → Application → Database',
    minNodes: 8,
    requiredLayers: ['Client', 'Edge/CDN', 'Application', 'Database'],
    connectionPattern: 'tiered',
    backgroundSections: true,
  },
  {
    name: 'event-driven',
    description: 'Producers publish to an event bus (SNS/SQS); Consumers fan out',
    minNodes: 7,
    requiredLayers: ['Producers', 'Event Bus', 'Consumers', 'Storage'],
    connectionPattern: 'hub-spoke',
    backgroundSections: true,
  },
  {
    name: 'microservices-mesh',
    description: 'Multiple services connected via API Gateway and shared infra',
    minNodes: 10,
    requiredLayers: ['Gateway', 'Services', 'Shared Infrastructure'],
    connectionPattern: 'mesh',
    backgroundSections: true,
  },
  {
    name: 'data-pipeline',
    description: 'Ingestion → Processing → Storage → Serving',
    minNodes: 8,
    requiredLayers: ['Ingestion', 'Processing', 'Storage', 'Serving'],
    connectionPattern: 'linear',
    backgroundSections: false,
  },
];

export function detectBlueprint(userPrompt: string): DiagramBlueprint {
  const p = userPrompt.toLowerCase();

  if (p.includes('event') || p.includes('queue') || p.includes('pub') || p.includes('sub')) {
    return DIAGRAM_BLUEPRINTS.find(b => b.name === 'event-driven')!;
  }
  if (p.includes('service') || p.includes('micro') || p.includes('api')) {
    return DIAGRAM_BLUEPRINTS.find(b => b.name === 'microservices-mesh')!;
  }
  if (p.includes('pipeline') || p.includes('etl') || p.includes('ingest')) {
    return DIAGRAM_BLUEPRINTS.find(b => b.name === 'data-pipeline')!;
  }

  // Default
  return DIAGRAM_BLUEPRINTS[0];
}
