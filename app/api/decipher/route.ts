import { NextRequest, NextResponse } from 'next/server';
import { buildDecipherContext } from '@/lib/prompts';
import { parseJsonResponse } from '@/lib/parse-json';
import { resolveProvider } from '@/lib/providers';
import type { AIProviderId, ConversionMode, SketchElement, WhiteboardIR } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { image, mode, elements, provider } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'image is required' }, { status: 400 });
    }

    const ai = resolveProvider(provider as AIProviderId | undefined);
    const prompt = buildDecipherContext(
      (elements || []) as SketchElement[],
      (mode || 'spec') as ConversionMode
    );

    const raw = await ai.visionComplete({
      imageBase64: image,
      prompt,
      jsonMode: true,
      maxTokens: 4096,
    });

    const ir = parseJsonResponse<WhiteboardIR>(raw);

    return NextResponse.json({
      ir,
      provider: ai.id,
      model: ai.model,
    });
  } catch (error) {
    console.error('Decipher error:', error);
    return NextResponse.json(
      { error: 'Failed to decipher sketch: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
