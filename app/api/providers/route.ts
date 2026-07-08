import { NextResponse } from 'next/server';
import { getConfiguredProviders } from '@/lib/providers';
import { getAnthropicProvider } from '@/lib/providers/anthropic';
import { getNvidiaProvider } from '@/lib/providers/nvidia';

export async function GET() {
  const providers = getConfiguredProviders().map((id) => {
    const provider = id === 'nvidia' ? getNvidiaProvider() : getAnthropicProvider();
    return {
      id: provider.id,
      label: provider.label,
      model: provider.model,
    };
  });

  return NextResponse.json({
    providers,
    default: providers[0]?.id ?? null,
  });
}
