import { NextRequest, NextResponse } from 'next/server';
import { buildReviewContext } from '@/lib/prompts';
import { parseJsonResponse } from '@/lib/parse-json';
import { resolveProvider } from '@/lib/providers';
import type {
  AIProviderId,
  ConversionMode,
  ReviewResult,
  SketchElement,
  WhiteboardIR,
} from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { image, mode, elements, ir, provider } = await req.json();

    if (!image || !ir) {
      return NextResponse.json({ error: 'image and ir are required' }, { status: 400 });
    }

    const ai = resolveProvider(provider as AIProviderId | undefined);
    const prompt = buildReviewContext(
      JSON.stringify(ir as WhiteboardIR, null, 2),
      (elements || []) as SketchElement[],
      (mode || 'spec') as ConversionMode
    );

    const raw = await ai.visionComplete({
      imageBase64: image,
      prompt,
      jsonMode: true,
      maxTokens: 2048,
    });

    const review = parseJsonResponse<ReviewResult>(raw);

    return NextResponse.json({
      review,
      provider: ai.id,
      model: ai.model,
    });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json(
      { error: 'Failed to review sketch: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
