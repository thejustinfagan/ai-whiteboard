'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import {
  Sparkles,
  FileText,
  Layout,
  Workflow,
  Search,
  ShieldCheck,
  Download,
  Copy,
  Check,
  PenLine,
} from 'lucide-react';
import type {
  AIProviderId,
  ConversionMode,
  PromptPack,
  ReviewResult,
  WhiteboardIR,
  WorkflowStep,
} from '@/lib/types';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

const STEPS: { id: WorkflowStep; label: string; icon: typeof PenLine }[] = [
  { id: 'draw', label: 'Draw', icon: PenLine },
  { id: 'decipher', label: 'Decipher', icon: Search },
  { id: 'review', label: 'Review', icon: ShieldCheck },
  { id: 'export', label: 'Export', icon: Download },
];

export default function AIWhiteboard() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [mode, setMode] = useState<ConversionMode>('spec');
  const [provider, setProvider] = useState<AIProviderId>('nvidia');
  const [providers, setProviders] = useState<Array<{ id: AIProviderId; label: string; model: string }>>([]);
  const [activeStep, setActiveStep] = useState<WorkflowStep>('draw');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [quickResult, setQuickResult] = useState('');
  const [ir, setIr] = useState<WhiteboardIR | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [promptPack, setPromptPack] = useState<PromptPack | null>(null);
  const [copied, setCopied] = useState(false);
  const [penActive, setPenActive] = useState(false);

  useEffect(() => {
    fetch('/api/providers')
      .then((res) => res.json())
      .then((data) => {
        setProviders(data.providers || []);
        if (data.default) setProvider(data.default);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      setPenActive(e.pointerType === 'pen');
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const captureSketch = useCallback(async () => {
    if (!excalidrawAPI) throw new Error('Canvas not ready');

    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const blob = await excalidrawAPI.exportToBlob({
      mimeType: 'image/png',
      elements,
      appState,
      files: excalidrawAPI.getFiles(),
    });

    const base64 = await blobToBase64(blob);
    const simplified = elements.map((el: any) => ({
      type: el.type,
      text: el.text || '',
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
    }));

    return { image: base64, elements: simplified };
  }, [excalidrawAPI]);

  async function runDecipher() {
    setBusy(true);
    setError('');
    try {
      const sketch = await captureSketch();
      const res = await fetch('/api/decipher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sketch, mode, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Decipher failed');
      setIr(data.ir);
      setReview(null);
      setPromptPack(null);
      setActiveStep('decipher');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runReview() {
    if (!ir) {
      await runDecipher();
      return;
    }
    setBusy(true);
    setError('');
    try {
      const sketch = await captureSketch();
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sketch, mode, provider, ir }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Review failed');
      setReview(data.review);
      setActiveStep('review');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runExport() {
    if (!ir || !review) {
      setError('Run Decipher and Review before exporting');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, provider, ir, review }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Export failed');
      setPromptPack(data.promptPack);
      setActiveStep('export');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runQuickGenerate() {
    setBusy(true);
    setError('');
    setQuickResult('');
    try {
      const sketch = await captureSketch();
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sketch, mode, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setQuickResult(data.result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copyPromptPack() {
    if (!promptPack) return;
    await navigator.clipboard.writeText(JSON.stringify(promptPack, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadPromptPack() {
    if (!promptPack) return;
    const blob = new Blob([JSON.stringify(promptPack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-pack-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const showPanel = Boolean(quickResult || ir || review || promptPack || error);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 p-3 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles className="w-6 h-6 text-purple-400 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white">AI Whiteboard</h1>
            <p className="text-xs text-gray-400 truncate">
              Draw on Surface → Hermes decipher → AI review → prompt loop export
            </p>
          </div>
          {penActive && (
            <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-1 rounded-full">
              Pen detected
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProviderId)}
            className="bg-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-600"
          >
            {providers.length === 0 ? (
              <option value="nvidia">NVIDIA NIM</option>
            ) : (
              providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))
            )}
          </select>

          <ModeButton active={mode === 'spec'} onClick={() => setMode('spec')} icon={FileText} label="Spec" />
          <ModeButton active={mode === 'wireframe'} onClick={() => setMode('wireframe')} icon={Layout} label="Wireframe" />
          <ModeButton active={mode === 'diagram'} onClick={() => setMode('diagram')} icon={Workflow} label="Diagram" />
          <ModeButton active={mode === 'story'} onClick={() => setMode('story')} icon={FileText} label="Story" />
        </div>
      </header>

      <div className="bg-gray-850 border-b border-gray-700 px-4 py-2 flex flex-wrap items-center gap-2">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                isActive ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {step.label}
            </button>
          );
        })}

        <div className="ml-auto flex flex-wrap gap-2">
          <ActionButton onClick={runDecipher} disabled={busy || !excalidrawAPI} label={busy ? 'Working...' : 'Decipher'} />
          <ActionButton onClick={runReview} disabled={busy || !excalidrawAPI} label="Review" variant="secondary" />
          <ActionButton onClick={runExport} disabled={busy || !ir || !review} label="Export Loop" variant="secondary" />
          <ActionButton onClick={runQuickGenerate} disabled={busy || !excalidrawAPI} label="Quick Generate" variant="gradient" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${showPanel ? 'w-1/2' : 'w-full'} transition-all min-h-0`}>
          <Excalidraw excalidrawAPI={(api) => setExcalidrawAPI(api)} theme="dark" />
        </div>

        {showPanel && (
          <aside className="w-1/2 bg-gray-800 border-l border-gray-700 overflow-y-auto p-5">
            {error && (
              <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            {activeStep === 'draw' && !quickResult && (
              <EmptyState
                title="Ready to draw"
                body="Sketch your scenario on the canvas, then run Decipher to extract structured intent with Hermes-style parsing."
              />
            )}

            {quickResult && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-white mb-3">Quick Generate</h2>
                <pre className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{quickResult}</pre>
              </section>
            )}

            {ir && (activeStep === 'decipher' || activeStep === 'review' || activeStep === 'export') && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Hermes Decipher</h2>
                <p className="text-gray-400 text-sm mb-3">{ir.summary}</p>
                <div className="grid gap-2 text-sm">
                  <Badge label={`Type: ${ir.scenario_type}`} />
                  <Badge label={`Confidence: ${Math.round(ir.confidence * 100)}%`} />
                  <Badge label={`Entities: ${ir.entities.length}`} />
                  <Badge label={`Relationships: ${ir.relationships.length}`} />
                </div>
                {ir.ambiguities.length > 0 && (
                  <div className="mt-3">
                    <h3 className="text-amber-400 text-sm font-medium mb-1">Ambiguities</h3>
                    <ul className="text-gray-300 text-sm list-disc pl-5">
                      {ir.ambiguities.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <details className="mt-3">
                  <summary className="text-purple-300 text-sm cursor-pointer">View raw IR JSON</summary>
                  <pre className="mt-2 text-xs text-gray-400 overflow-x-auto">{JSON.stringify(ir, null, 2)}</pre>
                </details>
              </section>
            )}

            {review && (activeStep === 'review' || activeStep === 'export') && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">AI Review</h2>
                <div className="flex gap-2 mb-3">
                  <StatusBadge status={review.status} />
                  <Badge label={`${review.completeness_score}% complete`} />
                </div>
                <p className="text-gray-300 text-sm mb-4">{review.summary}</p>

                <ReviewList title="Strengths" items={review.strengths} color="text-emerald-400" />
                <ReviewList title="Gaps" items={review.gaps} color="text-amber-400" />
                <ReviewList title="Suggestions" items={review.suggestions} color="text-blue-400" />
                <ReviewList title="Inconsistencies" items={review.inconsistencies} color="text-red-400" />
              </section>
            )}

            {promptPack && activeStep === 'export' && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-white">Prompt Loop Export</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={copyPromptPack}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy JSON'}
                    </button>
                    <button
                      onClick={downloadPromptPack}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-4">{promptPack.intent_summary}</p>

                <details open className="mb-3">
                  <summary className="text-purple-300 text-sm cursor-pointer mb-2">System prompt</summary>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap">{promptPack.system_prompt}</pre>
                </details>

                <details className="mb-3">
                  <summary className="text-purple-300 text-sm cursor-pointer mb-2">User prompt</summary>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap">{promptPack.user_prompt}</pre>
                </details>

                <details className="mb-3">
                  <summary className="text-purple-300 text-sm cursor-pointer mb-2">Agent loop steps</summary>
                  <ol className="text-sm text-gray-300 list-decimal pl-5 mt-2">
                    {promptPack.loop.steps.map((step, i) => (
                      <li key={i} className="mb-1">
                        <span className="font-medium">{step.role}</span>: {step.description}
                      </li>
                    ))}
                  </ol>
                </details>

                <details>
                  <summary className="text-purple-300 text-sm cursor-pointer mb-2">Hermes handoff payload</summary>
                  <pre className="text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(promptPack.exports.hermes_handoff, null, 2)}
                  </pre>
                </details>
              </section>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof FileText;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      <Icon className="w-4 h-4 inline mr-1" />
      {label}
    </button>
  );
}

function ActionButton({
  onClick,
  disabled,
  label,
  variant = 'primary',
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  variant?: 'primary' | 'secondary' | 'gradient';
}) {
  const classes =
    variant === 'gradient'
      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
      : variant === 'secondary'
        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
        : 'bg-indigo-600 hover:bg-indigo-700 text-white';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${classes}`}
    >
      {label}
    </button>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="inline-block bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">{label}</span>;
}

function StatusBadge({ status }: { status: ReviewResult['status'] }) {
  const colors = {
    approved: 'bg-emerald-900 text-emerald-300',
    needs_revision: 'bg-amber-900 text-amber-300',
    draft: 'bg-gray-700 text-gray-300',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function ReviewList({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items.length) return null;
  return (
    <div className="mb-3">
      <h3 className={`${color} text-sm font-medium mb-1`}>{title}</h3>
      <ul className="text-gray-300 text-sm list-disc pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center py-12">
      <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-3" />
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400 text-sm max-w-md mx-auto">{body}</p>
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
