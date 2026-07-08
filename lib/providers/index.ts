import type { AIProviderId, VisionRequest } from '../types';
import { getAnthropicProvider } from './anthropic';
import { getNvidiaProvider } from './nvidia';

export interface AIProvider {
  id: AIProviderId;
  label: string;
  model: string;
  isConfigured(): boolean;
  visionComplete(request: VisionRequest): Promise<string>;
}

export function getConfiguredProviders(): AIProviderId[] {
  const providers: AIProviderId[] = [];
  if (getNvidiaProvider().isConfigured()) providers.push('nvidia');
  if (getAnthropicProvider().isConfigured()) providers.push('anthropic');
  return providers;
}

export function resolveProvider(requested?: AIProviderId): AIProvider {
  const providers: Record<AIProviderId, () => AIProvider> = {
    nvidia: getNvidiaProvider,
    anthropic: getAnthropicProvider,
  };

  const order: AIProviderId[] = requested
    ? [requested, 'nvidia', 'anthropic']
    : ['nvidia', 'anthropic'];

  const seen = new Set<AIProviderId>();
  for (const id of order) {
    if (seen.has(id)) continue;
    seen.add(id);
    const provider = providers[id]();
    if (provider.isConfigured()) {
      return provider;
    }
  }

  throw new Error(
    'No AI provider configured. Set NVIDIA_API_KEY or ANTHROPIC_API_KEY in .env.local'
  );
}
