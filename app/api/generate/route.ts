import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PROMPTS = {
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

export async function POST(req: NextRequest) {
  try {
    const { image, mode, elements } = await req.json();
    
    const prompt = PROMPTS[mode as keyof typeof PROMPTS] || PROMPTS.spec;
    
    // Add element context to help Claude understand the sketch
    const elementSummary = elements
      .filter((el: any) => el.text)
      .map((el: any) => `- ${el.type}: "${el.text}"`)
      .join('\n');
    
    const fullPrompt = `${prompt}\n\n**Text elements visible in sketch:**\n${elementSummary || '(no text labels)'}`;
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: image,
              },
            },
            {
              type: 'text',
              text: fullPrompt,
            },
          ],
        },
      ],
    });
    
    const result = message.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n\n');
    
    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate result: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
