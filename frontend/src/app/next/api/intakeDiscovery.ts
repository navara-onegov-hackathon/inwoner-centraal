import type { AssistanceLevel } from '../types/begeleiding';
import type { OverzichtResponse } from '../types/overzicht';

export interface DiscoveryProgressEvent {
  line: string;
}

export interface IntakeDiscoveryCallbacks {
  onProgress?: (event: DiscoveryProgressEvent) => void;
  onToolCallStarted?: (event: Record<string, unknown>) => void;
  onToolCallFinished?: (event: Record<string, unknown>) => void;
  onResult?: (result: OverzichtResponse) => void;
  onError?: (message: string) => void;
}

export function startIntakeDiscovery(
  bsn: string | undefined,
  assistance: AssistanceLevel,
  callbacks: IntakeDiscoveryCallbacks,
) {
  const url = new URL('/api/data-reconciliation/intake-discovery/stream', window.location.origin);
  if (bsn) url.searchParams.set('bsn', bsn);
  url.searchParams.set('assistance', assistance);

  const source = new EventSource(url.toString());

  source.addEventListener('progress', (event) => {
    callbacks.onProgress?.(parseJson<DiscoveryProgressEvent>(event));
  });
  source.addEventListener('tool_call_started', (event) => {
    callbacks.onToolCallStarted?.(parseJson<Record<string, unknown>>(event));
  });
  source.addEventListener('tool_call_finished', (event) => {
    callbacks.onToolCallFinished?.(parseJson<Record<string, unknown>>(event));
  });
  source.addEventListener('result', (event) => {
    callbacks.onResult?.(parseJson<OverzichtResponse>(event));
    source.close();
  });
  source.addEventListener('error', (event) => {
    const payload = tryParseJson<{ message?: string }>(event);
    callbacks.onError?.(payload?.message ?? 'Discovery kon niet worden gestart.');
    source.close();
  });

  return {
    close: () => source.close(),
  };
}

function parseJson<T>(event: Event): T {
  const messageEvent = event as MessageEvent<string>;
  return JSON.parse(messageEvent.data) as T;
}

function tryParseJson<T>(event: Event): T | null {
  try {
    return parseJson<T>(event);
  } catch {
    return null;
  }
}
