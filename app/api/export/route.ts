import { NextRequest, NextResponse } from 'next/server';
import { buildExportPrompt } from '@/lib/prompts';
import { parseJsonResponse } from '@/lib/parse-json';
import { resolveProvider } from '@/lib/providers';
import type {
  AIProviderId,
  ConversionMode,
  PromptPack,
  ReviewResult,
  WhiteboardIR,
} from '@/lib/types';

interface ExportPayload {
  intent_summary: string;
  system_prompt: string;
  user_prompt: string;
  acceptance_criteria: string[];
  loop: PromptPack['loop'];
  exports: PromptPack['exports'];
}

export async function POST(req: NextRequest) {
  try {
    const { mode, ir, review, provider } = await req.json();

    if (!ir || !review) {
      return NextResponse.json({ error: 'ir and review are required' }, { status: 400 });
    }

    const ai = resolveProvider(provider as AIProviderId | undefined);
    const prompt = buildExportPrompt(
      JSON.stringify(ir as WhiteboardIR, null, 2),
      JSON.stringify(review as ReviewResult, null, 2),
      (mode || 'spec') as ConversionMode
    );

    const raw = await ai.visionComplete({
      imageBase64: '',
      prompt,
      jsonMode: true,
      maxTokens: 4096,
    });

    const payload = parseJsonResponse<ExportPayload>(raw);

    const promptPack: PromptPack = {
      version: '1.0',
      source: {
        mode: (mode || 'spec') as ConversionMode,
        timestamp: new Date().toISOString(),
        provider: ai.id,
      },
      intent_summary: payload.intent_summary,
      system_prompt: payload.system_prompt,
      user_prompt: payload.user_prompt,
      context: {
        ir: ir as WhiteboardIR,
        review: review as ReviewResult,
        constraints: [],
      },
      acceptance_criteria: payload.acceptance_criteria,
      loop: payload.loop,
      exports: {
        markdown: payload.exports.markdown,
        hermes_handoff: {
          ...payload.exports.hermes_handoff,
          ir,
          review,
          mode,
        },
      },
    };

    return NextResponse.json({
      promptPack,
      provider: ai.id,
      model: ai.model,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export prompt pack: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
