#!/usr/bin/env tsx

/**
 * ADR Compliance Hook Verification Script (TypeScript)
 * Evaluates tool calls, file writes, and commit actions against repository ADR records.
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';

export interface ToolCallPayload {
  name: string;
  args?: {
    TargetFile?: string;
    CodeContent?: string;
    ReplacementContent?: string;
    ReplacementChunks?: Array<{ ReplacementContent?: string }>;
    CommandLine?: string;
    [key: string]: unknown;
  };
}

export interface PreToolUseHookInput {
  conversationId?: string;
  stepIdx?: number;
  workspacePaths?: string[];
  toolCall?: ToolCallPayload;
  transcriptPath?: string;
  artifactDirectoryPath?: string;
  modelName?: string;
}

export interface HookDecisionResponse {
  decision: 'allow' | 'deny' | 'ask' | 'force_ask';
  reason?: string;
  permissionOverrides?: string[];
  overwrite?: Record<string, unknown>;
}

interface ForbiddenRule {
  adr: string;
  regex: RegExp;
  message: string;
}

interface ForbiddenFilename {
  pattern: RegExp;
  adr: string;
  message: string;
}

// Forbidden patterns mapped to ADRs
const FORBIDDEN_RULES: ForbiddenRule[] = [
  {
    adr: 'ADR-0001 (State Management)',
    regex: /from\s+['"](@reduxjs\/toolkit|redux|jotai|recoil|mobx)(\/.*)?['"]/g,
    message: 'Forbidden external state management library. Use Zustand slices in apps/web/src/store/slices/.'
  },
  {
    adr: 'ADR-0001 (State Management)',
    regex: /const\s*\{[^}]+\}\s*=\s*useEditorStore\s*\(\s*\)/g,
    message: 'Whole-store destructuring detected. Use atomic selector: useEditorStore((s) => s.prop) or useShallow.'
  },
  {
    adr: 'ADR-0003 (AI Studio & Agent Execution)',
    regex: /from\s+['"](@langchain\/.*|langchain(\/.*)?)['"]/g,
    message: 'Forbidden LangChain dependency. Use Vercel AI SDK (ai, @ai-sdk/*).'
  },
  {
    adr: 'ADR-0005 (Routing & SSR)',
    regex: /from\s+['"]next(\/.*)?['"]/g,
    message: 'Forbidden Next.js import. Use TanStack Start / Router (@tanstack/react-router).'
  },
  {
    adr: 'ADR-0006 (Export Architecture)',
    regex: /\.captureStream\s*\(/g,
    message: 'Forbidden client-side canvas stream capture. Use apps/export-server headless rendering.'
  },
  {
    adr: 'ADR-0007 (Styling & Design System)',
    regex: /from\s+['"](styled-components|@emotion\/.*)['"]/g,
    message: 'Forbidden CSS-in-JS library. Use Tailwind CSS v4 utility classes.'
  }
];

const FORBIDDEN_FILENAMES: ForbiddenFilename[] = [
  {
    pattern: /tailwind\.config\.(js|cjs|mjs|ts)$/i,
    adr: 'ADR-0007 (Styling & Design System)',
    message: 'Do not create tailwind.config.js. Tailwind v4 uses CSS-first configuration via @theme in apps/web/src/styles.css.'
  }
];

function checkContent(content: string | undefined, filePath: string = ''): string[] {
  const violations: string[] = [];

  // Check forbidden file names
  if (filePath) {
    const fileName = basename(filePath);
    for (const rule of FORBIDDEN_FILENAMES) {
      if (rule.pattern.test(fileName)) {
        violations.push(`[${rule.adr}] ${rule.message} (File: ${filePath})`);
      }
    }
  }

  // Check forbidden patterns in code
  if (content && typeof content === 'string') {
    for (const rule of FORBIDDEN_RULES) {
      if (rule.regex.test(content)) {
        violations.push(`[${rule.adr}] ${rule.message}`);
      }
    }
  }

  return violations;
}

function checkGitChanges(): string[] {
  const violations: string[] = [];
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    const lines = status.split('\n').filter(Boolean);

    for (const line of lines) {
      const filePath = line.substring(3).trim();
      const fileName = basename(filePath);

      for (const rule of FORBIDDEN_FILENAMES) {
        if (rule.pattern.test(fileName)) {
          violations.push(`[${rule.adr}] Staged forbidden file: ${filePath}`);
        }
      }

      if (existsSync(filePath) && (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js'))) {
        const content = readFileSync(filePath, 'utf-8');
        const fileViolations = checkContent(content, filePath);
        violations.push(...fileViolations);
      }
    }
  } catch {
    // Non-git directory or git error - skip git check
  }

  return violations;
}

async function main(): Promise<void> {
  let input = '';
  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let payload: PreToolUseHookInput = {};
  try {
    if (input.trim()) {
      payload = JSON.parse(input) as PreToolUseHookInput;
    }
  } catch {
    // If not JSON, default to allow
    const allowResponse: HookDecisionResponse = { decision: 'allow' };
    console.log(JSON.stringify(allowResponse));
    return;
  }

  const toolCall = payload.toolCall;

  if (!toolCall) {
    const allowResponse: HookDecisionResponse = { decision: 'allow' };
    console.log(JSON.stringify(allowResponse));
    return;
  }

  const toolName = toolCall.name;
  const args = toolCall.args || {};
  const violations: string[] = [];

  // 1. Inspect file creation
  if (toolName === 'write_to_file') {
    const targetFile = args.TargetFile || '';
    const codeContent = args.CodeContent || '';
    violations.push(...checkContent(codeContent, targetFile));
  }

  // 2. Inspect file replacements
  if (toolName === 'replace_file_content') {
    const targetFile = args.TargetFile || '';
    const replacementContent = args.ReplacementContent || '';
    violations.push(...checkContent(replacementContent, targetFile));
  }

  if (toolName === 'multi_replace_file_content') {
    const targetFile = args.TargetFile || '';
    const chunks = args.ReplacementChunks || [];
    for (const chunk of chunks) {
      if (chunk.ReplacementContent) {
        violations.push(...checkContent(chunk.ReplacementContent, targetFile));
      }
    }
  }

  // 3. Inspect git commit commands
  if (toolName === 'run_command') {
    const commandLine = args.CommandLine || '';
    if (/git\s+commit/i.test(commandLine)) {
      violations.push(...checkGitChanges());
    }
  }

  if (violations.length > 0) {
    const uniqueViolations = [...new Set(violations)];
    const denyResponse: HookDecisionResponse = {
      decision: 'deny',
      reason: `ADR Architectural Violation Detected:\n- ${uniqueViolations.join('\n- ')}\nPlease consult docs/adr/ and remediate.`
    };
    console.log(JSON.stringify(denyResponse));
    return;
  }

  const allowResponse: HookDecisionResponse = { decision: 'allow' };
  console.log(JSON.stringify(allowResponse));
}

main().catch(() => {
  const fallbackResponse: HookDecisionResponse = { decision: 'allow' };
  console.log(JSON.stringify(fallbackResponse));
});
