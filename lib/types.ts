export type ConversionMode = 'spec' | 'wireframe' | 'diagram' | 'story';
export type AIProviderId = 'nvidia' | 'anthropic';
export type WorkflowStep = 'draw' | 'decipher' | 'review' | 'export';
export type ReviewStatus = 'draft' | 'needs_revision' | 'approved';

export interface SketchElement {
  type: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WhiteboardEntity {
  id: string;
  label: string;
  kind: 'service' | 'screen' | 'actor' | 'database' | 'component' | 'note' | 'other';
  bbox?: [number, number, number, number];
}

export interface WhiteboardRelationship {
  from: string;
  to: string;
  type: string;
  label?: string;
}

export interface WhiteboardIR {
  scenario_type: 'system_diagram' | 'user_flow' | 'wireframe' | 'freeform';
  summary: string;
  entities: WhiteboardEntity[];
  relationships: WhiteboardRelationship[];
  annotations: string[];
  ambiguities: string[];
  confidence: number;
}

export interface ReviewResult {
  status: ReviewStatus;
  completeness_score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  inconsistencies: string[];
}

export interface LoopStep {
  role: string;
  prompt_ref: string;
  description: string;
}

export interface PromptPack {
  version: '1.0';
  source: {
    mode: ConversionMode;
    timestamp: string;
    provider: AIProviderId;
  };
  intent_summary: string;
  system_prompt: string;
  user_prompt: string;
  context: {
    ir: WhiteboardIR;
    review?: ReviewResult;
    constraints: string[];
  };
  acceptance_criteria: string[];
  loop: {
    type: 'agent_loop';
    steps: LoopStep[];
    exit_condition: string;
  };
  exports: {
    markdown: string;
    hermes_handoff: Record<string, unknown>;
  };
}

export interface VisionRequest {
  imageBase64: string;
  prompt: string;
  maxTokens?: number;
  jsonMode?: boolean;
}
