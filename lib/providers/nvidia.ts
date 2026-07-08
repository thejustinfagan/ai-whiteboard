import type { VisionRequest } from '../types';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL = 'meta/llama-3.2-90b-vision-instruct';

export function getNvidiaProvider(): import('./index').AIProvider {
  return {
    id: 'nvidia',
    label: 'NVIDIA NIM',
    model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,

    isConfigured() {
      return Boolean(process.env.NVIDIA_API_KEY);
    },

    async visionComplete(request: VisionRequest): Promise<string> {
      const apiKey = process.env.NVIDIA_API_KEY;
      if (!apiKey) {
        throw new Error('NVIDIA_API_KEY is not configured');
      }

      const model = process.env.NVIDIA_MODEL || DEFAULT_MODEL;
      const prompt = request.jsonMode
        ? `${request.prompt}\n\nRespond with raw JSON only. No markdown.`
        : request.prompt;

      const messageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: 'text', text: prompt },
      ];

      if (request.imageBase64) {
        messageContent.push({
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${request.imageBase64}` },
        });
      }

      const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: messageContent }],
          max_tokens: request.maxTokens ?? 4096,
          temperature: 0.2,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`NVIDIA API error (${response.status}): ${errorBody}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const result = data.choices?.[0]?.message?.content;
      if (!result) {
        throw new Error('NVIDIA API returned an empty response');
      }

      return result;
    },
  };
}
