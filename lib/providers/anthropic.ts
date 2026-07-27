import Anthropic from '@anthropic-ai/sdk';
import type { VisionRequest } from '../types';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

export function getAnthropicProvider(): import('./index').AIProvider {
  return {
    id: 'anthropic',
    label: 'Anthropic Claude',
    model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,

    isConfigured() {
      return Boolean(process.env.ANTHROPIC_API_KEY);
    },

    async visionComplete(request: VisionRequest): Promise<string> {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      }

      const anthropic = new Anthropic({ apiKey });
      const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
      const prompt = request.jsonMode
        ? `${request.prompt}\n\nRespond with raw JSON only. No markdown.`
        : request.prompt;

      const content: Anthropic.MessageParam['content'] = [{ type: 'text', text: prompt }];
      if (request.imageBase64) {
        content.unshift({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: request.imageBase64,
          },
        });
      }

      const message = await anthropic.messages.create({
        model,
        max_tokens: request.maxTokens ?? 4096,
        messages: [{ role: 'user', content }],
      });

      const result = message.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n\n');

      if (!result) {
        throw new Error('Anthropic API returned an empty response');
      }

      return result;
    },
  };
}
