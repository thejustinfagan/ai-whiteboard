import type { ConversionMode } from './types';

export const MODE_PROMPTS: Record<ConversionMode, string> = {
  spec: `You are a technical product manager. Analyze this whiteboard sketch and generate a detailed functional specification.

Include:
- **Overview**: What is this system/feature?
- **Components**: List all boxes, modules, or entities you see
- **Data Flow**: Describe arrows and connections
- **Key Features**: What functionality is implied?
- **Technical Requirements**: APIs, databases, integrations mentioned
- **User Stories**: Convert visual elements into user stories (As a [user], I want [goal], so that [benefit])

Be specific. Reference visual elements from the drawing.`,

  wireframe: `You are a UX designer. Analyze this wireframe sketch and provide detailed UI/UX analysis.

Include:
- **Layout Structure**: Describe the visual hierarchy
- **UI Components**: List all buttons, forms, cards, modals you see
- **Navigation Flow**: How do users move through this interface?
- **Content Areas**: What goes in each section?
- **Responsive Considerations**: Mobile/desktop layout notes
- **Accessibility**: Any a11y concerns or recommendations
- **Design System**: Suggested components and patterns

Reference specific elements from the sketch.`,

  diagram: `You are a systems architect. Analyze this technical diagram and document the architecture.

Include:
- **Architecture Type**: (e.g., microservices, monolith, data flow, sequence diagram)
- **Components**: List all services, databases, external systems
- **Communication Patterns**: APIs, message queues, events
- **Data Flow**: Trace how data moves through the system
- **Technology Stack**: Infer technologies from labels/icons
- **Scalability**: Potential bottlenecks or scaling considerations
- **Security**: Authentication, authorization, data protection points

Be technical and specific.`,

  story: `You are an agile product owner. Convert this sketch into a complete user story breakdown.

Include:
- **Epic**: High-level user need
- **User Stories**: Write 5-10 user stories in "As a [user], I want [goal], so that [benefit]" format
- **Acceptance Criteria**: For each story, list 3-5 testable criteria
- **Story Points**: Estimate complexity (1, 2, 3, 5, 8)
- **Dependencies**: Which stories must be completed first?
- **Definition of Done**: What makes this feature complete?

Reference the sketch elements to derive stories.`,
};

export const DECIPHER_PROMPT = `You are Hermes, a whiteboard deciphering agent. Analyze this sketch and extract structured intent.

Return ONLY valid JSON matching this schema (no markdown fences):
{
  "scenario_type": "system_diagram" | "user_flow" | "wireframe" | "freeform",
  "summary": "one paragraph describing what the user is designing",
  "entities": [
    { "id": "unique-id", "label": "visible label", "kind": "service|screen|actor|database|component|note|other", "bbox": [x, y, width, height] }
  ],
  "relationships": [
    { "from": "entity-id", "to": "entity-id", "type": "calls|reads|writes|navigates|depends_on|other", "label": "optional arrow label" }
  ],
  "annotations": ["freeform notes inferred from the sketch"],
  "ambiguities": ["things that are unclear or missing"],
  "confidence": 0.0 to 1.0
}

Infer entities from boxes, circles, labels, and icons. Infer relationships from arrows and connectors.`;

export const REVIEW_PROMPT = `You are an AI review agent for whiteboard designs. Given the sketch and structured decipher output, critique the design.

Return ONLY valid JSON (no markdown fences):
{
  "status": "draft" | "needs_revision" | "approved",
  "completeness_score": 0-100,
  "summary": "overall assessment",
  "strengths": ["what works well"],
  "gaps": ["missing elements or flows"],
  "suggestions": ["actionable improvements the user should draw or clarify"],
  "inconsistencies": ["contradictions between elements"]
}

Use "approved" only if the design is coherent and actionable with minor or no gaps.
Use "needs_revision" if important flows, actors, or error paths are missing.`;

export function buildElementContext(elements: { type: string; text: string }[]): string {
  const lines = elements
    .filter((el) => el.text)
    .map((el) => `- ${el.type}: "${el.text}"`);

  return `**Text elements visible in sketch:**\n${lines.join('\n') || '(no text labels)'}`;
}

export function buildDecipherContext(
  elements: { type: string; text: string }[],
  mode: ConversionMode
): string {
  return `${DECIPHER_PROMPT}\n\n**Target output mode:** ${mode}\n\n${buildElementContext(elements)}`;
}

export function buildReviewContext(
  irJson: string,
  elements: { type: string; text: string }[],
  mode: ConversionMode
): string {
  return `${REVIEW_PROMPT}\n\n**Target output mode:** ${mode}\n\n**Deciphered structure:**\n${irJson}\n\n${buildElementContext(elements)}`;
}

export function buildExportPrompt(
  irJson: string,
  reviewJson: string,
  mode: ConversionMode
): string {
  return `You are a prompt engineer. Convert this whiteboard session into an agent-ready prompt pack.

Return ONLY valid JSON (no markdown fences):
{
  "intent_summary": "one sentence",
  "system_prompt": "system message for an implementation agent",
  "user_prompt": "detailed user message with requirements",
  "acceptance_criteria": ["testable criteria"],
  "loop": {
    "type": "agent_loop",
    "steps": [
      { "role": "planner|implementer|reviewer", "prompt_ref": "system_prompt|user_prompt|review_checklist", "description": "what this step does" }
    ],
    "exit_condition": "when all acceptance criteria pass"
  },
  "exports": {
    "markdown": "human-readable spec in markdown",
    "hermes_handoff": { "ir": {}, "review": {}, "next_action": "implement|clarify|approve" }
  }
}

**Mode:** ${mode}
**Deciphered IR:** ${irJson}
**Review:** ${reviewJson}`;
}
